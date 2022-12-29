class HealthCheck {
  public static async handle(req: any, res: any): Promise<void> {
    try {
      return res.status(200).json({status: true, message: 'OK'});
    } catch (error) {
      return res.status(500).json({status: false, message: 'Not OK'});
    }
  }
}

export default HealthCheck;
