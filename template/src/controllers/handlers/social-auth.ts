import * as bcrypt from 'bcrypt';

import Common from '../../commons';
import Helpers from '../helpers';
import Mutations from '../graphql/mutations';
import Queries from '../graphql/queries';
import Locals from '../../../providers/locals';
const fetch = require('node-fetch');

class SocialAuth {
  public static async handle(req: any, res: any): Promise<void> {
    const { email, name, access_token, role, img_url, provider_type } =
      req.body.input.input || req.body.input;
    try {
      let isUserVerified: boolean = false;
      let user;
      switch (provider_type) {
        case 'github':
          isUserVerified = await this.github(access_token);
          break;
        // case "gitlab":
        //   isUserVerified = await this.linkedinAuth(token);
        //   break;
      }

      if (!isUserVerified) {
        return Common.Response(res, false, 'User verification failed!!!', null);
      }

      let userData;
      let userTeam;
      let user_access_token;

      const { data } = await Common.GQLRequest({
        variables: { email: email.toLowerCase() },
        query: Queries.UserByEmail
      });
      userData = data;
      // error handling
      if (!userData || !userData.data || !userData.data.users) {
        const error =
          (userData.errors && userData.errors) || 'Something went wrong!';
        return Common.Response(res, false, error, null);
      }
      user = userData.data.users[0];

      //  If user does not exist, create user
      if (userData.data.users.length === 0) {
        const password = Common.passwordGenerator();
        /// Hash password
        const hashPswd = await bcrypt.hash(password, 12);
        /// Insert user
        const { userData, errors } = await this.createUser(
          name,
          email,
          img_url,
          hashPswd
        );
        /// User table insertion errors
        if (!userData || !userData.data || !userData.data.insert_users_one) {
          const error =
            errors ||
            (userData.errors && userData.errors[0].message) ||
            'Something went wrong!';
          return Common.Response(res, false, error, null);
        }
        user = userData.data.insert_users_one;
        user_access_token = await this.createUserAccessToken(user.id);
        const { teamData, teamErrors } = await this.createTeam(user, res);

        if (!teamData || !teamData.data || !teamData.data.insert_teams_one) {
          const error =
            teamErrors ||
            (teamData.errors && teamData.errors[0].message) ||
            'Something went wrong!';
          return Common.Response(res, false, error, null);
        }
        await this.createWaitlistTickets(email, name, img_url, provider_type);
        userTeam = teamData.data.insert_teams_one;
      }
      // else if (!user.is_verified) {
      //   return Common.Response(
      //     res,
      //     false,
      //     "User is deactivated by admin",
      //     null,
      //   );
      // }

      if (!user_access_token) {
        user_access_token = await this.getUserAccessToken(user.id);
        console.log('user_access_token', user_access_token);
      }

      // check user role exists
      let roleExists = false;
      if (role === 'super-admin') {
        const userRoles = await Common.GQLRequest({
          variables: { user_id: user.id, role: role },
          query: Queries.UserRolesWhereRole
        });
        if (userRoles.data.errors || !userRoles.data.data.user_roles.length) {
          return Common.Response(
            res,
            false,
            userRoles.data.errors[0].message,
            null
          );
        }
        roleExists = true;
      } else if (role === 'owner') {
        const teamMember = await Common.GQLRequest({
          variables: { user_id: user.id },
          query: Queries.TeamMembersWhereOwner
        });
        if (teamMember.data.data.team_members.length === 0) {
          return Common.Response(
            res,
            false,
            'no user registered with this email address',
            null
          );
        }
        roleExists = true;
      }

      if (!roleExists) {
        return Common.Response(res, false, 'User not found', null);
      }

      const {
        allowedRoles,
        defaultRole,
        ownerTeamIds,
        firstTeamRole,
        firstTeam
      } = await this.getAllowedAndDefaultRoles(user.id, 'owner', user.status);

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

      return Common.Response(res, true, 'Signup successfully!', {
        ...user,
        access_token:
          user.status === Locals.config().defaultSignUpUserStatus
            ? null
            : user_access_token,
        status: user.status,
        team: {
          ...firstTeam,
          role: firstTeamRole,
          token: token.token,
          expires_in: token.expires_in,
          refresh_token: refreshToken.refresh_token,
          refresh_token_expires_in: refreshToken.refresh_token_expires_in
        }
      });
    } catch (error: any) {
      return Common.Response(res, false, error.message, null);
    }
  }

  /// Verification for Github token
  public static async github(token: any) {
    const data = await fetch('https://api.github.com/user', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => response.json())
      .then((data) => {
        // Extract the response in a variable and log it
        const response = data;
        if (response.login) {
          return true;
        } else {
          return false;
        }
      })
      .catch((error) => {
        return false;
      });
    return data;
  }

  public static async createUser(
    name: string,
    email: string,
    img_url: string,
    hashPswd: string
  ) {
    // graphql query
    const { data, errors } = await Common.GQLRequest({
      variables: {
        name: name,
        email: email.toLowerCase(),
        img_url: img_url,
        password: hashPswd,
        status: Locals.config().defaultSignUpUserStatus
      },
      query: Mutations.InsertUser
    });
    return { userData: data, errors: errors };
  }
  public static async getTeamIds(userId: number) {
    const data = await Common.GQLRequest({
      variables: { user_id: userId },
      query: Queries.TeamMembersWhereOwner
    });
    let ownerTeamIds = [];
    if (data.data.data.team_members.length) {
      data.data.data.team_members.map((teamMember) => {
        if (!ownerTeamIds.includes(teamMember.team_id)) {
          ownerTeamIds.push(teamMember.team_id);
        }
      });
    }
    const firstTeam = data.data.data.team_members[0].team;
    return { ownerTeamIds: ownerTeamIds, firstTeam: firstTeam };
  }

  public static async getAllowedAndDefaultRoles(userId, role, status) {
    let roles = [];
    let ownerTeamIds = [];
    let firstTeamRole;
    roles.push(role);

    const data = await Common.GQLRequest({
      variables: { user_id: parseInt(userId) },
      query: Queries.TeamMembersWhereOwner
    });

    if (data.data.data.team_members.length) {
      data.data.data.team_members.map((teamMember) => {
        if (!ownerTeamIds.includes(teamMember.team_id)) {
          ownerTeamIds.push(teamMember.team_id);
        }
        if (!roles.includes(teamMember.role)) {
          roles.push(teamMember.role);
        }
      });
    }

    firstTeamRole = data.data.data.team_members[0].role;
    const firstTeam = data.data.data.team_members[0].team;

    if (status !== 'on_waitlist') {
      return {
        allowedRoles: roles,
        defaultRole: role,
        ownerTeamIds: ownerTeamIds,
        firstTeamRole: firstTeamRole,
        firstTeam: firstTeam
      };
    }

    return {
      allowedRoles: ['guest'],
      defaultRole: 'guest',
      ownerTeamIds: [],
      firstTeamRole: 'guest',
      firstTeam: firstTeam
    };
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

  public static async getUserAccessToken(userId: number) {
    // graphql query

    const { data, errors } = await Common.GQLRequest({
      variables: {
        user_id: userId
      },
      query: Queries.UserTokens
    });

    if (
      data.data &&
      data.data.user_tokens &&
      data.data.user_tokens.access_token
    ) {
      return data.data.user_tokens.access_token;
    }
    return null;
  }
}

export default SocialAuth;
