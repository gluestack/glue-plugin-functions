"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// Others
const health_check_1 = require("../controllers/health-check");
const router = (0, express_1.Router)();
/**
 * routes
 */
router.get('/', health_check_1.default.handle);
exports.default = router;
//# sourceMappingURL=index.js.map