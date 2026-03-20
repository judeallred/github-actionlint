#!/usr/bin/env node

/**
 * Basic tests - verify our binary runs and produces expected output.
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getBinaryPath } from "../lib/download";
import { isSupported } from "../lib/platform";
import pkg from "../package.json";

const version = pkg.version as string;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, "fixtures");

interface RunResult {
  code: number;
  signal: string | null;
  stdout: string;
  stderr: string;
}

function runBinary(args: string[]): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    getBinaryPath(version).then((binaryPath) => {
      const child = spawn(binaryPath, args, {
        cwd: fixturesDir,
        stdio: ["inherit", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      child.stdout?.on("data", (d: Buffer) => (stdout += d.toString()));
      child.stderr?.on("data", (d: Buffer) => (stderr += d.toString()));
      child.on("close", (code, signal) => {
        resolve({
          code: code ?? 128,
          signal,
          stdout,
          stderr,
        });
      });
      child.on("error", reject);
    }, reject);
  });
}

async function main(): Promise<void> {
  if (!isSupported()) {
    console.log("Skipping tests: platform not supported");
    process.exit(0);
  }

  let failed = 0;

  const okResult = await runBinary(["minimal_ok.yaml"]);
  if (okResult.code !== 0) {
    console.error("FAIL: minimal_ok.yaml should exit 0, got", okResult.code);
    console.error(okResult.stderr || okResult.stdout);
    failed++;
  } else {
    console.log("PASS: minimal_ok.yaml exits 0");
  }

  const errResult = await runBinary(["-no-color", "one_error.yaml"]);
  if (errResult.code !== 1) {
    console.error("FAIL: one_error.yaml should exit 1, got", errResult.code);
    failed++;
  } else {
    const expected = "potentially untrusted";
    const output = errResult.stdout + errResult.stderr;
    if (!output.includes(expected)) {
      console.error("FAIL: output should contain", expected);
      console.error("Got:", output);
      failed++;
    } else {
      console.log("PASS: one_error.yaml exits 1 with expected message");
    }
  }

  const versionResult = await runBinary(["-version"]);
  if (versionResult.code !== 0) {
    console.error("FAIL: -version should exit 0, got", versionResult.code);
    failed++;
  } else {
    const out = (versionResult.stdout + versionResult.stderr).trim();
    if (!out.includes(version)) {
      console.error(
        "FAIL: version output should contain",
        version,
        "got:",
        out
      );
      failed++;
    } else {
      console.log("PASS: -version works");
    }
  }

  if (failed > 0) {
    process.exit(1);
  }
  console.log("All tests passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
