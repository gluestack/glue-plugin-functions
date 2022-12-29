"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class Commons {
    constructor() {
        this.axios = require('axios');
    }
    /**
   * axios request
   */
    Request({ url, data }) {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = {
                "content-type": "application/json",
            };
            return yield this.axios({
                url,
                method: "POST",
                headers,
                data
            });
        });
    }
    /**
     * Server response
     */
    Response(res, success, message, data) {
        res.json({ success, message, data });
    }
    /**
     * check validation error
     */
    CheckError(error, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (error) {
                const { details } = error;
                const message = details.map((i) => i.message).join(',');
                return this.Response(res, false, message, null);
            }
            next();
        });
    }
}
exports.default = new Commons();
//# sourceMappingURL=commons.js.map