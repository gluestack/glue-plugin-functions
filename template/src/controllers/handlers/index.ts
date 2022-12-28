import Get from './get';

class Authentication {
  public get(req: any, res: any): any {
    return Get.handle(req, res);
  }
}

export default new Authentication();
