"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../routes");
/**
 * Initialize all routes
 */
class Routes {
    functionRoutes(_express) {
        return _express.use('/', routes_1.default);
    }
}
exports.default = new Routes();
//# sourceMappingURL=routes.js.map