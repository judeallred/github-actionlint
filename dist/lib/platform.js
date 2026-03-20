"use strict";
/**
 * Platform detection for actionlint binary download.
 * Maps Node.js process.platform and process.arch to actionlint release asset names.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTIONLINT_REPO = void 0;
exports.getPlatformAsset = getPlatformAsset;
exports.isSupported = isSupported;
exports.getUnsupportedMessage = getUnsupportedMessage;
exports.ACTIONLINT_REPO = "rhysd/actionlint";
/**
 * Get the asset name for the current platform.
 */
function getPlatformAsset(version) {
    const platform = process.platform;
    const arch = process.arch;
    const archMap = {
        x64: "amd64",
        ia32: "386",
        arm64: "arm64",
        arm: "arm",
    };
    const actionlintArch = archMap[arch] ?? arch;
    const platformMap = {
        darwin: "darwin",
        linux: "linux",
        win32: "windows",
        freebsd: "freebsd",
    };
    const actionlintOs = platformMap[platform];
    if (!actionlintOs || !actionlintArch) {
        return null;
    }
    const ext = platform === "win32" ? "zip" : "tar.gz";
    const assetName = `actionlint_${version}_${actionlintOs}_${actionlintArch}.${ext}`;
    const url = `https://github.com/${exports.ACTIONLINT_REPO}/releases/download/v${version}/${assetName}`;
    return { assetName, url, ext };
}
function isSupported() {
    return getPlatformAsset("1.0.0") !== null;
}
function getUnsupportedMessage() {
    return (`Platform ${process.platform}/${process.arch} is not supported. ` +
        `Supported: darwin (x64, arm64), linux (x64, arm64, 386, arm), win32 (x64, arm64), freebsd (386, amd64).`);
}
//# sourceMappingURL=platform.js.map