import Locals from '../providers/locals';

class Commons {
  public axios = require('axios');

  /**
 * axios request
 */
  public async Request({ url, data }) {
    const headers = {
      "content-type": "application/json",
    };

    return await this.axios({
      url,
      method: "POST",
      headers,
      data
    })
  }

  /**
   * Graphql request
   */
  public async GQLRequest({ variables, query }) {
    const headers = {
      'content-type': 'application/json',
      'x-hasura-admin-secret': Locals.config().hasuraAdminSecret
    };

    return await this.axios({
      url: `${Locals.config().hasuraGraphqlURL}/v1/graphql`,
      method: 'POST',
      headers: headers,
      data: {
        query,
        variables
      }
    });
  }

  /**
   * Server response
   */
  public Response(res: any, success: boolean, message: string, data: any) {
    res.json({ success, message, data });
  }

  /**
   * check validation error
   */
  public async CheckError(error: any, res: BodyInit, next: () => void) {
    if (error) {
      const { details } = error;
      const message = details.map((i: { message: any }) => i.message).join(',');

      return this.Response(res, false, message, null);
    }

    next();
  }
}

export default new Commons();
