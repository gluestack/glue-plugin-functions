import Common from '../../commons';
import Queries from '../graphql/queries';
import Helpers from '../helpers';

class JwtFromAccessToken {
  public static async handle(req: any, res: any) {
    const { access_token, project_id } = req.body.input.input || req.body;

    const { data, errors } = await Common.GQLRequest({
      variables: { access_token: access_token, project_id: project_id },
      query: Queries.UserByProject
    });

    if (!data || !data.data || !data.data || !data.data.users.length) {
      const error = 'Invalid Token!';
      return Common.Response(res, false, error, null);
    }

    const user = data.data.users[0];

    const { allowedRoles, defaultRole, teamIds, teamRole } =
      await this.getAllowedAndDefaultRoles(user, project_id);

    // create Token for authentication
    const token = await Helpers.CreateToken({
      id: user.id,
      allowedRoles: allowedRoles,
      defaultRole: defaultRole,
      teamIds: teamIds
    });

    return Common.Response(res, true, 'JWT created successfully!', {
      token: token.token,
      expires_in: token.expires_in
    });
  }

  public static async getAllowedAndDefaultRoles(user, projectId) {
    let roles = [];
    let ownerTeamIds = [];

    const data = await Common.GQLRequest({
      variables: { user_id: user.id, project_id: projectId },
      query: Queries.TeamMemberByProject
    });

    if (data.data.data.team_members.length) {
      data.data.data.team_members.map((teamMember) => {
        if (!ownerTeamIds.includes(teamMember.team_id)) {
          roles.push(teamMember.role);
          ownerTeamIds.push(teamMember.team_id);
        }
      });
    }

    const firstTeamRole = data.data.data.team_members[0].role;

    return {
      allowedRoles: roles,
      defaultRole: roles,
      teamIds: ownerTeamIds,
      teamRole: firstTeamRole
    };
  }
}
export default JwtFromAccessToken;
