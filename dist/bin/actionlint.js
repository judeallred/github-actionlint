#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_child_process_1 = require("node:child_process");
const node_os_1 = __importDefault(require("node:os"));
const download_1 = require("../lib/download");
const platform_1 = require("../lib/platform");
const package_json_1 = __importDefault(require("../package.json"));
async function main() {
    if (!(0, platform_1.isSupported)()) {
        console.error((0, platform_1.getUnsupportedMessage)());
        process.exit(1);
    }
    const releaseVersion = process.env.ACTIONLINT_RELEASE ?? package_json_1.default.version;
    try {
        const binaryPath = await (0, download_1.getBinaryPath)(releaseVersion);
        const child = (0, node_child_process_1.spawn)(binaryPath, process.argv.slice(2), {
            stdio: "inherit",
            windowsHide: true,
        });
        child.on("exit", (code, signal) => {
            if (signal) {
                const sigNum = node_os_1.default.constants.signals[signal];
                process.exit(sigNum !== undefined ? 128 + sigNum : 1);
            }
            process.exit(code ?? 0);
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("github-actionlint:", message);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=actionlint.js.map