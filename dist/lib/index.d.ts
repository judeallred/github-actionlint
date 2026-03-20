/**
 * Programmatic API for github-actionlint.
 */
import { type SpawnOptions } from "node:child_process";
export interface ActionlintResult {
    stdout: Buffer;
    stderr: Buffer;
    code: number;
}
export interface ActionlintOptions {
    args?: string[];
    version?: string;
    spawnOptions?: SpawnOptions;
}
/**
 * Run actionlint with the given arguments.
 */
export declare function actionlint(options?: ActionlintOptions): Promise<ActionlintResult>;
export { getBinaryPath } from "./download";
export { isSupported, getUnsupportedMessage } from "./platform";
//# sourceMappingURL=index.d.ts.map