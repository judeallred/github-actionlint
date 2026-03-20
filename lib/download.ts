/**
 * Download and extract actionlint binary from GitHub Releases.
 */

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { createWriteStream } from "node:fs";
import { getPlatformAsset } from "./platform";
import { extract } from "tar";
import AdmZip from "adm-zip";

const CACHE_DIR = path.join(
  process.env.ACTIONLINT_CACHE_DIR ??
    path.join(
      process.env.HOME ?? process.env.USERPROFILE ?? process.cwd(),
      ".github-actionlint"
    ),
  "bin"
);

export { CACHE_DIR };

interface DownloadOptions {
  headers?: Record<string, string>;
  onProgress?: (downloaded: number, total: number) => void;
}

function downloadFile(
  url: string,
  destPath: string,
  options: DownloadOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const { headers = {}, onProgress } = options;
    const token = process.env.GITHUB_TOKEN;

    const reqHeaders: Record<string, string> = {
      "User-Agent": "github-actionlint",
    };
    if (token) {
      reqHeaders.Authorization = `Bearer ${token}`;
    }
    Object.assign(reqHeaders, headers);

    https
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
          reject(
            new Error(
              `Download failed: ${res.statusCode} ${res.statusMessage} for ${url}`
            )
          );
          return;
        }

        const total = parseInt(res.headers["content-length"] ?? "0", 10);
        let downloaded = 0;

        const file = createWriteStream(destPath);
        res.pipe(file);

        if (onProgress && total > 0) {
          res.on("data", (chunk: Buffer) => {
            downloaded += chunk.length;
            onProgress(downloaded, total);
          });
        }

        file.on("finish", () => {
          file.close();
          resolve();
        });
        file.on("error", (err) => {
          fs.unlink(destPath, () => undefined);
          reject(err);
        });
      })
      .on("error", reject);
  });
}

async function extractTarGz(
  archivePath: string,
  destDir: string
): Promise<void> {
  await extract({
    file: archivePath,
    cwd: destDir,
  });
}

async function extractZip(archivePath: string, destDir: string): Promise<void> {
  const zip = new AdmZip(archivePath);
  const entries = zip.getEntries();
  const hasRootDir = entries.some(
    (e: AdmZip.IZipEntry) => e.entryName.includes("/") && !e.isDirectory
  );
  if (hasRootDir) {
    zip.extractAllTo(destDir, true);
    const subdirs = fs.readdirSync(destDir).filter((f) => {
      const p = path.join(destDir, f);
      return fs.statSync(p).isDirectory();
    });
    if (subdirs.length === 1) {
      const subdir = path.join(destDir, subdirs[0] as string);
      const files = fs.readdirSync(subdir);
      for (const f of files) {
        fs.renameSync(path.join(subdir, f), path.join(destDir, f));
      }
      fs.rmdirSync(subdir);
    }
  } else {
    zip.extractAllTo(destDir, true);
  }
}

async function download(version: string): Promise<string> {
  const platform = getPlatformAsset(version);
  if (!platform) {
    throw new Error("Platform not supported");
  }

  const { url, ext } = platform;
  const versionDir = path.join(CACHE_DIR, version);
  const binaryName =
    process.platform === "win32" ? "actionlint.exe" : "actionlint";
  const binaryPath = path.join(versionDir, binaryName);

  if (fs.existsSync(binaryPath)) {
    return binaryPath;
  }

  fs.mkdirSync(versionDir, { recursive: true });
  const archivePath = path.join(versionDir, `archive.${ext}`);

  try {
    await downloadFile(url, archivePath);

    if (ext === "tar.gz") {
      await extractTarGz(archivePath, versionDir);
    } else {
      await extractZip(archivePath, versionDir);
    }

    fs.unlinkSync(archivePath);

    if (!fs.existsSync(binaryPath)) {
      throw new Error(`Binary not found at ${binaryPath} after extraction`);
    }

    try {
      fs.chmodSync(binaryPath, 0o755);
    } catch {
      // chmod may fail on Windows
    }
    return binaryPath;
  } catch (err) {
    try {
      fs.rmSync(versionDir, { recursive: true });
    } catch {
      /* ignore cleanup errors */
    }
    throw err;
  }
}

export async function getBinaryPath(version: string): Promise<string> {
  const envPath = process.env.ACTIONLINT_BIN;
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  return download(version);
}
