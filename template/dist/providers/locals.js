"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const dotenv = require("dotenv");
class Locals {
    /**
     * Initialize all env variables
     */
    static config() {
        dotenv.config({ path: path.join(__dirname, '../../.env') });
        const port = process.env.APP_PORT || 9000;
        return {
            port,
        };
    }
    /**
     * Injects config in app's locals
     */
    static init(_express) {
        _express.locals.app = this.config();
        return _express;
    }
}
exports.default = Locals;
//# sourceMappingURL=locals.js.map