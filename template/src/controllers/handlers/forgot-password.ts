import Common from '../../commons';
import Helpers from '../helpers';
import Queries from '../graphql/queries';

class ForgotPassword {
  public static async handle(req: any, res: any): Promise<void> {
    const { email } = req.body.input.input || req.body;

    try {
      // graphql query
      const { data, errors } = await Common.GQLRequest({
        variables: { email: email.toLowerCase() },
        query: Queries.UserByEmail
      });

      if (!data || !data.data || !data.data.users) {
        const error = errors || data.errors && data.errors[0].message || "Something went wrong!";
        return Common.Response(res, false, error, null);
      }

      // check if users response is empty
      if (data.data.users.length === 0) {
        return Common.Response(res, false, "No user registered with this email address", null);
      }

      // generate token
      const token = await Helpers.CreateResetPasswordToken({ id: data.data.users[0].id, email: data.data.users[0].email })

      // // send Forgot password email
      // const response = await Common.Request({
      //   url: `${process.env.EMAIL_SERVICE_URL}/send`,
      //   data: {
      //     trigger: { name: "forgot_password" },
      //     event: { data: { old: { token, name: data.data.users[0].name, email: data.data.users[0].email } } }
      //   }
      // })

      // // if response is not ok throw error
      // if (response.data.success !== true) {
      //   throw new Error(response.data.message);
      // }

      return Common.Response(res, true, "Email send successfully!", {});
    } catch (error) {
      return Common.Response(res, false, error.message, null);
    }
  }
}

export default ForgotPassword;
