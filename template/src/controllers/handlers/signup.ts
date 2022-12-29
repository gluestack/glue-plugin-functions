import * as bcrypt from 'bcrypt';

import Common from '../../commons';
import Helpers from '../helpers';
import Mutations from '../graphql/mutations';
import Queries from '../graphql/queries';
import Locals from '../../../providers/locals';
import { parseInt } from 'lodash';
const axios = require('axios');

class Signup {
  public static async handle(req: any, res: any): Promise<void> {
    const { name, email, password, img_url, captcha } = req.body.input.input || req.body;
    try {
      // const { isCaptchaValid, captchaMessage } = await this.validateCaptcha(
      //   captcha,
      // );
      // if (!isCaptchaValid) {
      //   return Common.Response(res, false, captchaMessage, null);
      // }

      // hash password
      const hashPswd = await bcrypt.hash(password, 12);

      const { userData, errors } = await this.createUser(
        name,
        email,
        hashPswd,
        img_url,
        res
      );

      if (!userData || !userData.data || !userData.data.insert_users_one) {
        const error =
          errors ||
          (userData.errors && userData.errors[0].message) ||
          'Something went wrong!';
        return Common.Response(res, false, error, null);
      }

      let user = userData.data.insert_users_one;

      await this.createWaitlistTickets(email, name, img_url, '');
      const { teamData, teamErrors } = await this.createTeam(user, res);

      if (!teamData || !teamData.data || !teamData.data.insert_teams_one) {
        const error =
          teamErrors ||
          (teamData.errors && teamData.errors[0].message) ||
          'Something went wrong!';
        return Common.Response(res, false, error, null);
      }

      const userTeam = teamData.data.insert_teams_one;

      const { allowedRoles, defaultRole, ownerTeamIds, firstTeamRole } =
        await this.getAllowedAndDefaultRoles(user.id, 'owner', user.status);

      // create Token for authentication
      const token = await Helpers.CreateToken({
        id: user.id,
        allowedRoles: allowedRoles,
        defaultRole: [defaultRole],
        teamIds: [ownerTeamIds]
      });

      const refreshToken = await Helpers.CreateRefreshToken({
        id: user.id
      });

      const access_token = await this.createUserAccessToken(user.id);

      return Common.Response(res, true, 'Signup successfully!', {
        ...user,
        access_token:
          user.status === Locals.config().defaultSignUpUserStatus
            ? null
            : access_token,
        status: user.status,
        team: {
          ...userTeam,
          role: firstTeamRole,
          token: token.token,
          expires_in: token.expires_in,
          refresh_token: refreshToken.refresh_token,
          refresh_token_expires_in: refreshToken.refresh_token_expires_in
        }
      });
    } catch (error) {
      return Common.Response(res, false, error.message, null);
    }
  }

  public static async createUserAccessToken(userId: number) {
    // graphql query
    const { data, errors } = await Common.GQLRequest({
      variables: {
        user_id: userId
      },
      query: Mutations.InsertUserTokensOne
    });

    if (
      data.data &&
      data.data.insert_user_tokens_one &&
      data.data.insert_user_tokens_one.access_token
    ) {
      return data.data.insert_user_tokens_one.access_token;
    }
    return null;
  }

  public static async createUser(
    name: string,
    email: string,
    hashPswd: string,
    img_url: any,
    res: any
  ) {
    // graphql query
    const { data, errors } = await Common.GQLRequest({
      variables: {
        name: name,
        email: email.toLowerCase(),
        img_url: img_url ? img_url : null,
        password: hashPswd,
        status: Locals.config().defaultSignUpUserStatus
      },
      query: Mutations.InsertUser
    });

    return { userData: data, errors: errors };
  }

  public static async createWaitlistTickets(
    email,
    name,
    img_url,
    provider_type
  ) {
    // graphql query
    const { data, errors } = await Common.GQLRequest({
      variables: {
        name: name,
        email: email,
        img_url: img_url,
        provider_type: provider_type
      },
      query: Mutations.InsertWaitlistTicketOne
    });
    return true;
  }

  public static async createTeam(user, res) {
    // graphql query
    const { data, errors } = await Common.GQLRequest({
      variables: {
        name: `${user.name} Team`,
        user_id: user.id,
        is_single_member: true
      },
      query: Mutations.InsertTeam
    });
    return { teamData: data, teamErrors: errors };
  }

  public static async validateCaptcha(captcha) {
    const secret_key = Locals.config().captchaSecret;
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secret_key}&response=${captcha}`,
      {},
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          json: true
        }
      }
    );

    if (!response.data.success) {
      return {
        isCaptchaValid: false,
        captchaMessage: response.data['error-codes'][0]
      };
    }
    return { isCaptchaValid: response.data.success, captchaMessage: '' };
  }

  public static async getAllowedAndDefaultRoles(userId, role, status) {
    let roles = [];
    let ownerTeamIds = [];
    let firstTeamRole;
    if (status !== 'on_waitlist') {
      const data = await Common.GQLRequest({
        variables: { user_id: parseInt(userId) },
        query: Queries.TeamMembersWhereOwner
      });

      if (data.data.data.team_members.length) {
        data.data.data.team_members.map((teamMember) => {
          if (!ownerTeamIds.includes(teamMember.team_id)) {
            roles.push(teamMember.role);
            ownerTeamIds.push(teamMember.team_id);
          }
        });
      }
      firstTeamRole = data.data.data.team_members[0].role;
      return {
        allowedRoles: roles,
        defaultRole: role,
        ownerTeamIds: ownerTeamIds,
        firstTeamRole: firstTeamRole
      };
    }

    return {
      allowedRoles: ['guest'],
      defaultRole: 'guest',
      ownerTeamIds: [],
      firstTeamRole: 'guest'
    };
  }
}

export default Signup;
