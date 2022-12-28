import { Application } from 'express';

import functionRoutes from '../routes';

/**
 * Initialize all routes
 */
class Routes {
  public functionRoutes(_express: Application): Application {
    return _express.use('/', functionRoutes);
  }
}

export default new Routes();
