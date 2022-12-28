import Common from '../commons';

class Get {
  public static async handle(req: any, res: any): Promise<void> {
    try {
      return Common.Response(res, true, "success!", {});
    } catch (error) {
      return Common.Response(res, false, error.message, null);
    }
  }
}

export default Get;
