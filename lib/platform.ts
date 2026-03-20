/**
 * Platform detection for actionlint binary download.
 * Maps Node.js process.platform and process.arch to actionlint release asset names.
 */

export const ACTIONLINT_REPO = "rhysd/actionlint";

export interface PlatformAsset {
  assetName: string;
  url: string;
  ext: string;
}

/**
 * Get the asset name for the current platform.
 */
export function getPlatformAsset(version: string): PlatformAsset | null {
  const platform = process.platform;
  const arch = process.arch;

  const archMap: Record<string, string> = {
    x64: "amd64",
    ia32: "386",
    arm64: "arm64",
    arm: "arm",
  };
  const actionlintArch = archMap[arch] ?? arch;

  const platformMap: Record<string, string> = {
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
  const url = `https://github.com/${ACTIONLINT_REPO}/releases/download/v${version}/${assetName}`;

  return { assetName, url, ext };
}

export function isSupported(): boolean {
  return getPlatformAsset("1.0.0") !== null;
}

export function getUnsupportedMessage(): string {
  return (
    `Platform ${process.platform}/${process.arch} is not supported. ` +
    `Supported: darwin (x64, arm64), linux (x64, arm64, 386, arm), win32 (x64, arm64), freebsd (386, amd64).`
  );
}
