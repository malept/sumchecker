# Sumchecker

[![Build
Status](https://github.com/malept/sumchecker/workflows/CI/badge.svg)](https://github.com/malept/sumchecker/actions?query=workflow%3ACI)
[![Code Coverage](https://codecov.io/gh/malept/sumchecker/branch/master/graph/badge.svg)](https://codecov.io/gh/malept/sumchecker)
![Dependency Status](https://tidelift.com/badges/github/malept/sumchecker)


Sumchecker is a pure Node.js solution to validating files specified in a checksum file, which are
usually generated by programs such as [`sha256sum`](https://en.wikipedia.org/wiki/Sha256sum).

## Usage

```javascript
const sumchecker = require('sumchecker');

try {
  await sumchecker(algorithm, checksumFilename, baseDir, filesToCheck);
  console.log('All files validate!');
} catch (error) {
  console.error('An error occurred', error);
}
```

Returns a [`Promise`]. The promise is resolved when all files specified in
[`filesToCheck`](#filesToCheck) are validated. The promise is rejected otherwise.

### Parameters

#### `algorithm`

`String` - The hash algorithm used in [`checksumFilename`](#checksumFilename). Corresponds to the
algorithms allowed by [`crypto.createHash()`].

#### `checksumFilename`

`String` - The path to the checksum file.

#### `baseDir`

`String` - The base directory for the files specified in [`filesToCheck`](#filesToCheck).

#### `filesToCheck`

`Array` or `String` - one or more paths of the files that will be validated, relative to
[`baseDir`](#baseDir).

### Errors

These are `sumchecker`-specific error classes that are passed to the promise's reject callback.

#### `sumchecker.ChecksumMismatchError`

When at least one of the files does not match its expected checksum.

Properties:

* `filename` (`String`) - a path to a file that did not match

#### `sumchecker.ChecksumParseError`

When the checksum file cannot be parsed (as in, it does not match the checksum file format).

Properties:

* `lineNumber` (`Number`) - the line number that could not be parsed
* `line` (`String`) - the raw line data that could not be parsed, sans newline

#### `sumchecker.NoChecksumFoundError`

When at least one of the files specified to check is not listed in the checksum file.

Properties:

* `filename` (`String`) - a filename from [`filesToCheck`](#filesToCheck)

## Support

[Get supported sumchecker with the Tidelift Subscription](https://tidelift.com/subscription/pkg/npm-sumchecker?utm_source=npm-sumchecker&utm_medium=referral&utm_campaign=readme).

## Security contact information

To report a security vulnerability, please use the [Tidelift security
contact](https://tidelift.com/security). Tidelift will coordinate the fix and disclosure.

## Legal

This library is copyrighted under the terms of the [Apache 2.0 License].

[`crypto.createHash()`]: https://nodejs.org/dist/latest-v4.x/docs/api/crypto.html#crypto_crypto_createhash_algorithm
[`Promise`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[Apache 2.0 License]: http://www.apache.org/licenses/LICENSE-2.0

## Enterprise support

Available as part of the Tidelift Subscription.

The maintainers of sumchecker and thousands of other packages are working with Tidelift to deliver commercial support and maintenance for the open source dependencies you use to build your applications. Save time, reduce risk, and improve code health, while paying the maintainers of the exact dependencies you use. [Learn more](https://tidelift.com/subscription/pkg/npm-sumchecker?utm_source=npm-sumchecker&utm_medium=referral&utm_campaign=enterprise&utm_term=repo).
