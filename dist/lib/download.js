"use strict";
/**
 * Download and extract actionlint binary from GitHub Releases.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_DIR = void 0;
exports.getBinaryPath = getBinaryPath;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_https_1 = __importDefault(require("node:https"));
const node_fs_2 = require("node:fs");
const platform_1 = require("./platform");
const tar_1 = require("tar");
const adm_zip_1 = __importDefault(require("adm-zip"));
const CACHE_DIR = node_path_1.default.join(process.env.ACTIONLINT_CACHE_DIR ??
    node_path_1.default.join(process.env.HOME ?? process.env.USERPROFILE ?? process.cwd(), ".github-actionlint"), "bin");
exports.CACHE_DIR = CACHE_DIR;
function downloadFile(url, destPath, options = {}) {
    return new Promise((resolve, reject) => {
        const { headers = {}, onProgress } = options;
        const token = process.env.GITHUB_TOKEN;
        const reqHeaders = {
            "User-Agent": "github-actionlint",
        };
        if (token) {
            reqHeaders.Authorization = `Bearer ${token}`;
        }
        Object.assign(reqHeaders, headers);
        node_https_1.default
            .get(url, { headers: reqHeaders }, (res) => {
            const location = res.headers.location;
            if (res.statusCode === 302 || res.statusCode === 301) {
                if (typeof location === "string") {
                    return downloadFile(location, destPath, options)
                        .then(resolve)
                        .catch(reject);
                }
            }
            if (res.statusCode !== 200) {
                reject(new Error(`Download failed: ${res.statusCode} ${res.statusMessage} for ${url}`));
                return;
            }
            const total = parseInt(res.headers["content-length"] ?? "0", 10);
            let downloaded = 0;
            const file = (0, node_fs_2.createWriteStream)(destPath);
            res.pipe(file);
            if (onProgress && total > 0) {
                res.on("data", (chunk) => {
                    downloaded += chunk.length;
                    onProgress(downloaded, total);
                });
            }
            file.on("finish", () => {
                file.close();
                resolve();
            });
            file.on("error", (err) => {
                node_fs_1.default.unlink(destPath, () => undefined);
                reject(err);
            });
        })
            .on("error", reject);
    });
}
async function extractTarGz(archivePath, destDir) {
    await (0, tar_1.extract)({
        file: archivePath,
        cwd: destDir,
    });
}
async function extractZip(archivePath, destDir) {
    const zip = new adm_zip_1.default(archivePath);
    const entries = zip.getEntries();
    const hasRootDir = entries.some((e) => e.entryName.includes("/") && !e.isDirectory);
    if (hasRootDir) {
        zip.extractAllTo(destDir, true);
        const subdirs = node_fs_1.default.readdirSync(destDir).filter((f) => {
            const p = node_path_1.default.join(destDir, f);
            return node_fs_1.default.statSync(p).isDirectory();
        });
        if (subdirs.length === 1) {
            const subdir = node_path_1.default.join(destDir, subdirs[0]);
            const files = node_fs_1.default.readdirSync(subdir);
            for (const f of files) {
                node_fs_1.default.renameSync(node_path_1.default.join(subdir, f), node_path_1.default.join(destDir, f));
            }
            node_fs_1.default.rmdirSync(subdir);
        }
    }
    else {
        zip.extractAllTo(destDir, true);
    }
}
async function download(version) {
    const platform = (0, platform_1.getPlatformAsset)(version);
    if (!platform) {
        throw new Error("Platform not supported");
    }
    const { url, ext } = platform;
    const versionDir = node_path_1.default.join(CACHE_DIR, version);
    const binaryName = process.platform === "win32" ? "actionlint.exe" : "actionlint";
    const binaryPath = node_path_1.default.join(versionDir, binaryName);
    if (node_fs_1.default.existsSync(binaryPath)) {
        return binaryPath;
    }
    node_fs_1.default.mkdirSync(versionDir, { recursive: true });
    const archivePath = node_path_1.default.join(versionDir, `archive.${ext}`);
    try {
        await downloadFile(url, archivePath);
        if (ext === "tar.gz") {
            await extractTarGz(archivePath, versionDir);
        }
        else {
            await extractZip(archivePath, versionDir);
        }
        node_fs_1.default.unlinkSync(archivePath);
        if (!node_fs_1.default.existsSync(binaryPath)) {
            throw new Error(`Binary not found at ${binaryPath} after extraction`);
        }
        try {
            node_fs_1.default.chmodSync(binaryPath, 0o755);
        }
        catch {
            // chmod may fail on Windows
        }
        return binaryPath;
    }
    catch (err) {
        try {
            node_fs_1.default.rmSync(versionDir, { recursive: true });
        }
        catch {
            /* ignore cleanup errors */
        }
        throw err;
    }
}
async function getBinaryPath(version) {
    const envPath = process.env.ACTIONLINT_BIN;
    if (envPath && node_fs_1.default.existsSync(envPath)) {
        return envPath;
    }
    return download(version);
}
//# sourceMappingURL=download.js.map