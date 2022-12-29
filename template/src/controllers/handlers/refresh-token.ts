import Helpers from '../helpers';
import Common from '../../commons';
import Queries from '../graphql/queries';
import User from '../models/user';

class RefreshToken {
  public static async handle(req: any, res: any): Promise<void> {
    const { team_id } = req.body.input.input || req.body;
    try {
      /// Verify and Decode Token
      const tempToken = req.headers.authorization?.split(' ')[1];
      const vToken = Helpers.verifyToken(tempToken);

      if (!vToken.success) {
        return Common.Response(res, false, 'Invalid Token', null);
      }

      const user_id = req.body.session_variables['x-hasura-user-id'];

      /// Get the user based on id
      const { data: userData } = await Common.GQLRequest({
        variables: { id: user_id },
        query: Queries.UserByPK
      });

      // error handling
      if (!userData || !userData.data || !userData.data.users_by_pk) {
        const error =
          (userData.errors && userData.errors) || 'Something went wrong!';
        return Common.Response(res, false, error, null);
      }

      const { allowedRoles, defaultRole, roleTeamIds, team, teamRole } =
        await this.getAllowedAndDefaultRoles(user_id, team_id);

      if (!team) {
        return Common.Response(
          res,
          false,
          'User does not access to this team',
          null
        );
      }

      const user: User = { ...userData.data.users_by_pk };

      // create Token for authentication
      const token = await Helpers.CreateToken({
        id: user_id,
        allowedRoles: allowedRoles,
        defaultRole: defaultRole,
        teamIds: roleTeamIds
      });

      const refreshToken = await Helpers.CreateRefreshToken({
        id: user_id
      });

      return res.json({
        success: true,
        message: 'Refresh Token generated successfully!',
        data: {
          ...user,
          team: {
            ...team,
            role: teamRole,
            token: token.token,
            expires_in: token.expires_in,
            refresh_token: refreshToken.refresh_token,
            refresh_token_expires_in: refreshToken.refresh_token_expires_in
          }
        }
      });
    } catch (error: any) {
      return Common.Response(res, false, error.message, null);
    }
  }

  public static async getAllowedAndDefaultRoles(userId, teamId) {
    let roles = [];
    let roleTeamIds = [];

    const data = await Common.GQLRequest({
      variables: { user_id: userId, team_id: teamId },
      query: Queries.TeamMembersWhereTeamId
    });

    if (data.data.data.team_members.length) {
      data.data.data.team_members.map((teamMember) => {
        if (!roleTeamIds.includes(teamMember.team_id)) {
          roles.push(teamMember.role);
          roleTeamIds.push(teamMember.team_id);
        }
      });
    }

    let team = null;
    let teamRole = null;
    if (data.data.data.team_members.length) {
      team = data.data.data.team_members[0].team;
      teamRole = data.data.data.team_members[0].role;
    }

    return {
      allowedRoles: roles,
      defaultRole: roles,
      roleTeamIds: roleTeamIds,
      team: team,
      teamRole: teamRole
    };
  }
}
export default RefreshToken;
