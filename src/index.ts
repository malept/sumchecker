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

import { createReadStream, promises as fs } from "fs";
import crypto from "crypto";
import debug from "debug";
import path from "path";
import { promisify } from "util";
import stream from "stream";

const d = debug("sumchecker");
const pipeline = promisify(stream.pipeline);

const CHECKSUM_LINE = /^([\da-fA-F]+) ([ *])(.+)$/;

/**
 * Tuple which consists of the hexadecimal checksum and whether the entry is for a binary file.
 */
export type Checksum = [string, boolean];

/**
 * Options used when validating a checksum.
 */
export type ChecksumOptions = {
  /**
   * The default text encoding of the file to be validated (defaults to `utf8`).
   */
  defaultTextEncoding?: BufferEncoding;
};

class ErrorWithFilename extends Error {
  filename: string;

  constructor(filename: string) {
    super();
    this.filename = filename;
  }
}

/**
 * Error thrown when at least one of the files does not match its expected checksum.
 */
export class ChecksumMismatchError extends ErrorWithFilename {
  /**
   * @param filename - A path to a file that did not match.
   */
  constructor(filename: string) {
    super(filename);
    this.message = `Generated checksum for "${filename}" did not match expected checksum.`;
  }
}

/**
 * Error thrown when the checksum file cannot be parsed (as in, it does not match the checksum
 * file format).
 */
export class ChecksumParseError extends Error {
  /**
   * The line number that could not be parsed.
   */
  lineNumber: number;
  /**
   * The raw line data that could not be parsed, sans newline.
   */
  line: string;

  /**
   * @param lineNumber - The line number that could not be parsed.
   * @param line - The raw line data that could not be parsed, sans newline.
   */
  constructor(lineNumber: number, line: string) {
    super();
    this.lineNumber = lineNumber;
    this.line = line;
    this.message = `Could not parse checksum file at line ${lineNumber}: ${line}`;
  }
}

/**
 * Error thrown when at least one of the files specified to check is not listed in the
 * checksum file.
 */
export class NoChecksumFoundError extends ErrorWithFilename {
  /**
   * @param filename - A filename from `filesToCheck`.
   */
  constructor(filename: string) {
    super(filename);
    this.message = `No checksum found in checksum file for "${filename}".`;
  }
}

export class ChecksumValidator {
  algorithm: string;
  checksumFilename: string;
  checksums: Record<string, Checksum> | null;
  defaultTextEncoding: BufferEncoding;

  constructor(
    algorithm: string,
    checksumFilename: string,
    options?: ChecksumOptions,
  ) {
    this.algorithm = algorithm;
    this.checksumFilename = checksumFilename;
    this.checksums = null;

    if (options?.defaultTextEncoding) {
      this.defaultTextEncoding = options.defaultTextEncoding;
    } else {
      this.defaultTextEncoding = "utf8";
    }
  }

  encoding(binary: boolean): BufferEncoding {
    return binary ? "binary" : this.defaultTextEncoding;
  }

  parseChecksumFile(data: string): void {
    d("Parsing checksum file");
    this.checksums = {};
    let lineNumber = 0;
    for (const line of data.trim().split(/[\r\n]+/)) {
      lineNumber += 1;
      const result = CHECKSUM_LINE.exec(line);
      if (result === null) {
        d(`Could not parse line number ${lineNumber}`);
        throw new ChecksumParseError(lineNumber, line);
      } else {
        result.shift();
        const [checksum, binaryMarker, filename] = result;
        const isBinary = binaryMarker === "*";

        this.checksums[filename] = [checksum, isBinary];
      }
    }
    d("Parsed checksums:", this.checksums);
  }

  async readFile(filename: string, binary: boolean): Promise<string> {
    d(`Reading "${filename} (binary mode: ${binary})"`);
    return fs.readFile(filename, { encoding: this.encoding(binary) });
  }

  async validate(
    baseDir: string,
    filesToCheck: string[] | string,
  ): Promise<void> {
    if (typeof filesToCheck === "string") {
      filesToCheck = [filesToCheck];
    }

    const data = await this.readFile(this.checksumFilename, false);
    this.parseChecksumFile(data);
    await this.validateFiles(baseDir, filesToCheck);
  }

  async validateFile(baseDir: string, filename: string): Promise<void> {
    d(`validateFile: ${filename}`);

    let calculated;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const metadata = this.checksums![filename];
    if (!metadata) {
      throw new NoChecksumFoundError(filename);
    }

    const [checksum, binary] = metadata;
    const fullPath = path.resolve(baseDir, filename);

    d(`Reading file with "${this.encoding(binary)}" encoding`);
    const fileToCheck = createReadStream(fullPath, {
      encoding: this.encoding(binary),
    });
    const hasher = crypto.createHash(this.algorithm, {
      defaultEncoding: "binary",
    });
    hasher.on("readable", () => {
      const data = hasher.read();
      if (data) {
        calculated = data.toString("hex");
      }
    });
    await pipeline(fileToCheck, hasher);

    d(`Expected checksum: ${checksum}; Actual: ${calculated}`);
    if (calculated !== checksum) {
      throw new ChecksumMismatchError(filename);
    }
  }

  async validateFiles(
    baseDir: string,
    filesToCheck: string[],
  ): Promise<void[]> {
    return Promise.all(
      filesToCheck.map((filename) => this.validateFile(baseDir, filename)),
    );
  }
}

/**
 * Validates the checksum of files from a given checksum file, usually generated by programs such as
 * [`sha256sum`](https://en.wikipedia.org/wiki/Sha256sum). Throws an error if any file to check
 * specified fails validation.
 *
 * ### Usage
 *
 * ```javascript
 * const sumchecker = require("sumchecker");
 *
 * // NB: Top-level await is available in Node.js >= 14.8.0. Non-top-level-await syntax is left as an
 * // exercise to the reader.
 * try {
 *   await sumchecker(algorithm, checksumFilename, baseDir, filesToCheck);
 *   console.log("All files validate!");
 * } catch (error) {
 *   console.error("An error occurred", error);
 * }
 * ```
 *
 * @param algorithm - The hash algorithm used in `checksumFilename`. Corresponds to the
 * algorithms allowed by [`crypto.createHash()`](https://nodejs.org/dist/latest-v12.x/docs/api/crypto.html#crypto_crypto_createhash_algorithm_options).
 * @param checksumFilename - The path to the checksum file.
 * @param baseDir - The base directory for the files specified in `filesToCheck`.
 * @param filesToCheck - One or more paths of the files that will be validated, relative to `baseDir`.
 */
export default async function sumchecker(
  algorithm: string,
  checksumFilename: string,
  baseDir: string,
  filesToCheck: string[] | string,
): Promise<void> {
  return new ChecksumValidator(algorithm, checksumFilename).validate(
    baseDir,
    filesToCheck,
  );
}
