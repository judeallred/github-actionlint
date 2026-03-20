/**
 * Programmatic API for github-actionlint.
 */

import { spawn, type SpawnOptions } from "node:child_process";
import { getBinaryPath } from "./download";
import { isSupported, getUnsupportedMessage } from "./platform";
import pkg from "../package.json";

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
export async function actionlint(
  options: ActionlintOptions = {}
): Promise<ActionlintResult> {
  const { args = [], version, spawnOptions = {} } = options;

  if (!isSupported()) {
    throw new Error(getUnsupportedMessage());
  }

  const releaseVersion =
    version ?? process.env.ACTIONLINT_RELEASE ?? pkg.version;

  const binaryPath = await getBinaryPath(releaseVersion);

  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, args, {
      stdio: ["inherit", "pipe", "pipe"],
      windowsHide: true,
      ...spawnOptions,
    });

    let stdout = Buffer.alloc(0);
    let stderr = Buffer.alloc(0);

    if (child.stdout) {
      child.stdout.on("data", (chunk: Buffer) => {
        stdout = Buffer.concat([stdout, chunk]);
      });
    }
    if (child.stderr) {
      child.stderr.on("data", (chunk: Buffer) => {
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

export { getBinaryPath } from "./download";
export { isSupported, getUnsupportedMessage } from "./platform";
