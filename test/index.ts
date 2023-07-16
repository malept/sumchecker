/*
Copyright 2016, 2017, 2019, 2021 Mark Lee and contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import path from "path";
import sumchecker, {
  ChecksumParseError,
  ChecksumMismatchError,
  ChecksumValidator,
  NoChecksumFoundError,
} from "../src/";
import test from "ava"; // eslint-disable-line import/no-unresolved

function fixture(filename: string): string {
  return path.join(__dirname, "fixtures", filename);
}

function testSumChecker(
  checksumFilename: string,
  filesToCheck: string[] | string,
): Promise<void> {
  return sumchecker(
    "sha256",
    fixture(checksumFilename),
    fixture(""),
    filesToCheck,
  );
}

test("Checksum validates", async (t) => {
  await t.notThrowsAsync(testSumChecker("example.sha256sum", "example"));
});

test("Checksum validates binary file", async (t) => {
  await t.notThrowsAsync(testSumChecker("example.sha256sum", "example.binary"));
});

test("Checksum file not found", async (t) => {
  await t.throwsAsync(testSumChecker("nonexistent.sha256sum", "example"), {
    instanceOf: Error,
    code: "ENOENT",
  });
});

test("Checksum file not parseable", async (t) => {
  const error = (await t.throwsAsync(
    testSumChecker("invalid.sha256sum", "example"),
    {
      instanceOf: ChecksumParseError,
      message: "Could not parse checksum file at line 1: invalid",
    },
  )) as ChecksumParseError;
  t.is(error.lineNumber, 1);
  t.is(error.line, "invalid");
});

test("Specified file not found in checksum file", async (t) => {
  const error = (await t.throwsAsync(
    testSumChecker("example.sha256sum", "nonexistent"),
    {
      instanceOf: NoChecksumFoundError,
      message: 'No checksum found in checksum file for "nonexistent".',
    },
  )) as NoChecksumFoundError;
  t.is(error.filename, "nonexistent");
});

test("Specified file does not match checksum", async (t) => {
  const error = (await t.throwsAsync(
    testSumChecker("example.sha256sum", "wrong-checksum"),
    {
      instanceOf: ChecksumMismatchError,
      message:
        'Generated checksum for "wrong-checksum" did not match expected checksum.',
    },
  )) as ChecksumMismatchError;
  t.is(error.filename, "wrong-checksum");
});

test("Multiple files specified, one does not match", async (t) => {
  const error = (await t.throwsAsync(
    testSumChecker("example.sha256sum", ["example", "wrong-checksum"]),
    {
      instanceOf: ChecksumMismatchError,
    },
  )) as ChecksumMismatchError;
  t.is(error.filename, "wrong-checksum");
});

test("Not specifying a text encoding defaults to utf8", (t) => {
  const validator = new ChecksumValidator("sha256", "nonexistent.sha256sum");
  t.is(validator.encoding(false), "utf8");
});

test("Specifying a text encoding overrides the default", (t) => {
  const validator = new ChecksumValidator("sha256", "nonexistent.sha256sum", {
    defaultTextEncoding: "hex",
  });
  t.is(validator.encoding(false), "hex");
});
