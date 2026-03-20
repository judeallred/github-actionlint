#!/usr/bin/env node

import { spawn } from "node:child_process";
import os from "node:os";
import { getBinaryPath } from "../lib/download";
import { isSupported, getUnsupportedMessage } from "../lib/platform";
import pkg from "../package.json";

async function main(): Promise<void> {
  if (!isSupported()) {
    console.error(getUnsupportedMessage());
    process.exit(1);
  }

  const releaseVersion = process.env.ACTIONLINT_RELEASE ?? pkg.version;

  try {
    const binaryPath = await getBinaryPath(releaseVersion);
    const child = spawn(binaryPath, process.argv.slice(2), {
      stdio: "inherit",
      windowsHide: true,
    });

    child.on("exit", (code, signal) => {
      if (signal) {
        const sigNum =
          os.constants.signals[signal as keyof typeof os.constants.signals];
        process.exit(sigNum !== undefined ? 128 + sigNum : 1);
      }
      process.exit(code ?? 0);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("github-actionlint:", message);
    process.exit(1);
  }
}

main();
