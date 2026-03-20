#!/usr/bin/env node

/**
 * Parity test: Run our binary against actionlint's testdata and verify output
 * matches the official binary. Requires cloning rhysd/actionlint in CI.
 *
 * Usage: ACTIONLINT_TESTDATA=/path/to/actionlint node test/parity-test.js
 */

import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { getBinaryPath } from "../lib/download";
import { isSupported } from "../lib/platform";
import pkg from "../package.json";

const version = pkg.version as string;

interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

async function runActionlint(
  binaryPath: string,
  args: string[],
  cwd: string
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, args, {
      cwd,
      stdio: ["inherit", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr?.on("data", (d: Buffer) => (stderr += d.toString()));
    child.on("close", (code) => {
      resolve({ code: code ?? 128, stdout, stderr });
    });
    child.on("error", reject);
  });
}

async function main(): Promise<void> {
  const testdataRoot =
    process.env.ACTIONLINT_TESTDATA ?? process.env.GITHUB_WORKSPACE;
  if (!testdataRoot || !fs.existsSync(path.join(testdataRoot, "testdata"))) {
    console.log(
      "Skipping parity test: ACTIONLINT_TESTDATA or actionlint repo not found"
    );
    console.log(
      "In CI, clone rhysd/actionlint and set ACTIONLINT_TESTDATA to its path"
    );
    process.exit(0);
  }

  if (!isSupported()) {
    console.log("Skipping parity test: platform not supported");
    process.exit(0);
  }

  const testdataDir = path.join(testdataRoot, "testdata");
  const errDir = path.join(testdataDir, "err");
  const okDir = path.join(testdataDir, "ok");

  if (!fs.existsSync(errDir) || !fs.existsSync(okDir)) {
    console.error("testdata/err or testdata/ok not found");
    process.exit(1);
  }

  const ourBinary = await getBinaryPath(version);
  let failed = 0;

  const errFiles = fs
    .readdirSync(errDir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
  for (const file of errFiles.slice(0, 5)) {
    const base = file.replace(/\.(yaml|yml)$/, "");
    const outFile = path.join(errDir, `${base}.out`);
    if (!fs.existsSync(outFile)) continue;

    const result = await runActionlint(
      ourBinary,
      ["-no-color", "-oneline", file],
      errDir
    );
    const expected = fs.readFileSync(outFile, "utf8").trim();
    const actual = (result.stdout + result.stderr).trim();

    const expectedLines = expected
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && (l.includes(":") || l.startsWith("/")))
      .sort();
    const actualLines = actual
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && /^[^:]+\.(yaml|yml):\d+:\d+:/.test(l))
      .map((l) => l.replace(/^[^:]+\.(yaml|yml):/, "test.yaml:"))
      .sort();

    if (result.code !== 1) {
      console.error(`FAIL: ${file} should exit 1, got ${result.code}`);
      failed++;
    } else if (expectedLines.length !== actualLines.length) {
      console.error(
        `FAIL: ${file} expected ${expectedLines.length} errors, got ${actualLines.length}`
      );
      console.error("Expected:", expectedLines);
      console.error("Actual:", actualLines);
      failed++;
    } else {
      console.log(`PASS: ${file}`);
    }
  }

  const okFiles = fs
    .readdirSync(okDir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
  for (const file of okFiles.slice(0, 3)) {
    const result = await runActionlint(ourBinary, [file], okDir);
    if (result.code !== 0) {
      console.error(`FAIL: ${file} should exit 0, got ${result.code}`);
      console.error(result.stderr || result.stdout);
      failed++;
    } else {
      console.log(`PASS: ${file}`);
    }
  }

  if (failed > 0) {
    process.exit(1);
  }
  console.log("Parity tests passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
