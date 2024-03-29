# Sumchecker

[![Build
Status](https://github.com/malept/sumchecker/workflows/CI/badge.svg)](https://github.com/malept/sumchecker/actions?query=workflow%3ACI)
[![Code Coverage](https://codecov.io/gh/malept/sumchecker/branch/main/graph/badge.svg)](https://codecov.io/gh/malept/sumchecker)
![Dependency Status](https://tidelift.com/badges/github/malept/sumchecker)
[![NPM package](https://img.shields.io/npm/v/sumchecker)](https://npm.im/sumchecker)

Sumchecker is a pure Node.js solution to validating files specified in a checksum file, which are
usually generated by programs such as [`sha256sum`](https://en.wikipedia.org/wiki/Sha256sum).

## Requirements

`sumchecker` is tested with Node.js 14.19.0 (LTS) and above.

## Usage

```javascript
const sumchecker = require("sumchecker");

// NB: Top-level await is available in Node.js >= 14.8.0. Non-top-level-await syntax is left as an
// exercise to the reader.
try {
  await sumchecker(algorithm, checksumFilename, baseDir, filesToCheck);
  console.log("All files validate!");
} catch (error) {
  console.error("An error occurred", error);
}
```

For details, see the [API documentation](https://malept.github.io/sumchecker/).

## Security contact information

See [SECURITY.md](https://github.com/malept/sumchecker/blob/main/SECURITY.md).

## Legal

This library is copyrighted under the terms of the [Apache 2.0 License].

[apache 2.0 license]: http://www.apache.org/licenses/LICENSE-2.0

## Enterprise support

Available as part of the Tidelift Subscription.

The maintainers of sumchecker and thousands of other packages are working with Tidelift to deliver commercial support and maintenance for the open source dependencies you use to build your applications. Save time, reduce risk, and improve code health, while paying the maintainers of the exact dependencies you use. [Learn more](https://tidelift.com/subscription/pkg/npm-sumchecker?utm_source=npm-sumchecker&utm_medium=referral&utm_campaign=enterprise&utm_term=repo).
