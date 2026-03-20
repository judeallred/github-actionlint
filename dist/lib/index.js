"use strict";
/**
 * Programmatic API for github-actionlint.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnsupportedMessage = exports.isSupported = exports.getBinaryPath = void 0;
exports.actionlint = actionlint;
const node_child_process_1 = require("node:child_process");
const download_1 = require("./download");
const platform_1 = require("./platform");
const package_json_1 = __importDefault(require("../package.json"));
/**
 * Run actionlint with the given arguments.
 */
async function actionlint(options = {}) {
    const { args = [], version, spawnOptions = {} } = options;
    if (!(0, platform_1.isSupported)()) {
        throw new Error((0, platform_1.getUnsupportedMessage)());
    }
    const releaseVersion = version ?? process.env.ACTIONLINT_RELEASE ?? package_json_1.default.version;
    const binaryPath = await (0, download_1.getBinaryPath)(releaseVersion);
    return new Promise((resolve, reject) => {
        const child = (0, node_child_process_1.spawn)(binaryPath, args, {
            stdio: ["inherit", "pipe", "pipe"],
            windowsHide: true,
            ...spawnOptions,
        });
        let stdout = Buffer.alloc(0);
        let stderr = Buffer.alloc(0);
        if (child.stdout) {
            child.stdout.on("data", (chunk) => {
                stdout = Buffer.concat([stdout, chunk]);
            });
        }
        if (child.stderr) {
            child.stderr.on("data", (chunk) => {
                stderr = Buffer.concat([stderr, chunk]);
            });
        }
        child.on("error", reject);
        child.on("close", (code, signal) => {
            resolve({
                stdout,
                stderr,
                code: code ?? (signal ? 128 + 1 : 0),
            });
        });
    });
}
var download_2 = require("./download");
Object.defineProperty(exports, "getBinaryPath", { enumerable: true, get: function () { return download_2.getBinaryPath; } });
var platform_2 = require("./platform");
Object.defineProperty(exports, "isSupported", { enumerable: true, get: function () { return platform_2.isSupported; } });
Object.defineProperty(exports, "getUnsupportedMessage", { enumerable: true, get: function () { return platform_2.getUnsupportedMessage; } });
//# sourceMappingURL=index.js.map