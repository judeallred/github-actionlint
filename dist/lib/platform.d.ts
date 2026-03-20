/**
 * Platform detection for actionlint binary download.
 * Maps Node.js process.platform and process.arch to actionlint release asset names.
 */
export declare const ACTIONLINT_REPO = "rhysd/actionlint";
export interface PlatformAsset {
    assetName: string;
    url: string;
    ext: string;
}
/**
 * Get the asset name for the current platform.
 */
export declare function getPlatformAsset(version: string): PlatformAsset | null;
export declare function isSupported(): boolean;
export declare function getUnsupportedMessage(): string;
//# sourceMappingURL=platform.d.ts.map