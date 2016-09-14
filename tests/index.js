/*
Copyright 2016 Mark Lee

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

'use strict'

define((require) => {
  const assert = require('intern/chai!assert')
  const path = require('intern/dojo/node!path')
  const registerSuite = require('intern!object')
  const sumchecker = require('intern/dojo/node!../build')

  let fixture = (filename) => {
    return path.join('tests', 'fixtures', filename)
  }

  let reject = (deferred) => {
    return deferred.reject.bind(deferred)
  }

  let testSumChecker = (checksumFilename, filesToCheck) => {
    return sumchecker('sha256', fixture(checksumFilename), fixture(''), filesToCheck)
  }

  const nodeVersionInfo = process.versions.node.split('.').map(function (n) { return Number(n) })
  const isOldNode = nodeVersionInfo < [4, 0, 0]

  let assertError = (error, errorClass) => {
    if (isOldNode) {
      assert.instanceOf(error, Error)
    } else {
      assert.instanceOf(error, errorClass)
    }
  }

  registerSuite({
    'Checksum validates': function () {
      let deferred = this.async(1000)
      testSumChecker('example.sha256sum', 'example')
        .then(deferred.callback(() => {}), reject(deferred))
    },

    'Checksum validates binary file': function () {
      let deferred = this.async(1000)
      testSumChecker('example.sha256sum', 'example.binary')
        .then(deferred.callback(() => {}), reject(deferred))
    },

    'Checksum file not found': function () {
      let deferred = this.async(1000)
      testSumChecker('nonexistent.sha256sum', 'example')
        .then(reject(deferred), deferred.callback(error => {
          assert.instanceOf(error, Error)
          assert.equal(error.code, 'ENOENT')
        }))
    },

    'Checksum file not parseable': function () {
      let deferred = this.async(1000)
      testSumChecker('invalid.sha256sum', 'example')
        .then(reject(deferred), deferred.callback(error => {
          assertError(error, sumchecker.ChecksumParseError)
          assert.strictEqual(error.lineNumber, 1)
          assert.strictEqual(error.line, 'invalid')
        }))
    },

    'Specified file not found in checksum file': function () {
      let deferred = this.async(1000)
      testSumChecker('example.sha256sum', 'nonexistent')
        .then(reject(deferred), deferred.callback(error => {
          assertError(error, sumchecker.NoChecksumFoundError)
          assert.equal(error.filename, 'nonexistent')
        }))
    },

    'Specified file does not match checksum': function () {
      let deferred = this.async(1000)
      testSumChecker('example.sha256sum', 'wrong-checksum')
        .then(reject(deferred), deferred.callback(error => {
          assertError(error, sumchecker.ChecksumMismatchError)
          assert.equal(error.filename, 'wrong-checksum')
        }))
    },

    'Multiple files specified, one does not match': function () {
      let deferred = this.async(1000)
      testSumChecker('example.sha256sum', ['example', 'wrong-checksum'])
        .then(reject(deferred), deferred.callback(error => {
          assertError(error, sumchecker.ChecksumMismatchError)
          assert.equal(error.filename, 'wrong-checksum')
        }))
    },

    'Not specifying a text encoding defaults to utf8': function () {
      let validator = new sumchecker.ChecksumValidator()
      assert.equal(validator.encoding(false), 'utf8')
    },

    'Specifying a text encoding overrides the default': function () {
      let validator = new sumchecker.ChecksumValidator('sha256', 'nonexistent.sha256sum', {defaultTextEncoding: 'hex'})
      assert.equal(validator.encoding(false), 'hex')
    }
  })
})
