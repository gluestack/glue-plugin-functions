import * as jwt from 'jsonwebtoken';

import Locals from '../../providers/locals';
import Common from '../commons';
import Mutations from './graphql/mutations';

class Helpers {
  /**
   * Create Token
   */
  public async CreateToken(_payload: {
    id: any;
    allowedRoles: any;
    defaultRole: any;
    teamIds?: any;
  }) {
    const expires_in = Locals.config().authTokenExpiresIn;

    const tokenContents = {
      key: Locals.config().JWT_KEY,
      id: _payload.id.toString(),
      'https://hasura.io/jwt/claims': {
        'x-hasura-allowed-roles': _payload.allowedRoles,
        'x-hasura-default-role': _payload.defaultRole.toString(),
        'x-hasura-user-id': _payload.id.toString(),
        'x-hasura-team-ids': _payload.teamIds.join(',')
      }
    };

    const token = jwt.sign(tokenContents, Locals.config().jwtSecret, {
      algorithm: 'HS256',
      expiresIn: expires_in
    });

    return {
      token,
      expires_in
    };
  }

  /**
   * Refresh Token
   */
  public async CreateRefreshToken(_payload: any) {
    const expires_in = Locals.config().refreshTokenExpiresIn;

    const tokenContents = {
      key: Locals.config().JWT_KEY,
      'https://hasura.io/jwt/claims': {
        'X-Hasura-Allowed-Roles': ['guest'],
        'X-Hasura-Default-Role': 'guest',
        'X-Hasura-User-Id': _payload.id.toString()
      }
    };

    const refresh_token = jwt.sign(tokenContents, Locals.config().jwtSecret, {
      algorithm: 'HS256',
      expiresIn: expires_in.toString()
    });

    return {
      refresh_token,
      refresh_token_expires_in: expires_in
    };
  }

  /**
   * Reset token 
   */
  public async CreateResetPasswordToken(_payload: any) {
    const expires_in = Locals.config().resetPasswordExpiresIn;

    const tokenContents = {
      email: _payload.email,
      id: _payload.id.toString(),
      secret: Locals.config().jwtSecret
    };

    const resetToken = jwt.sign(tokenContents, Locals.config().jwtSecret, {
      algorithm: "HS256",
      expiresIn: expires_in.toString(),
    });

    return resetToken;
  }

  /**
   * Set OTP against user
   */
  public async SetOTP(id: number, otp: number) {
    // graphql query
    const { data, errors } = await Common.GQLRequest({
      variables: { id, otp },
      query: Mutations.SetOTP
    });

    if (!data || !data.data || !data.data.update_users_by_pk) {
      throw (
        errors ||
        (data.errors && { message: data.errors[0].message }) ||
        'failed to send email!'
      );
    }
  }

  /**
   * Verify Token
   */
  public verifyToken(token: any) {
    try {
      const verifiedToken = jwt.verify(token, Locals.config().jwtSecret);
      return { success: true, token: verifiedToken };
    } catch (err) {
      return { success: false, error: err };
    }
  }
}

export default new Helpers();
