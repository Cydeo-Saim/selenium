// Licensed to the Software Freedom Conservancy (SFC) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The SFC licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

'use strict'

const assert = require('assert')
const firefox = require('../../firefox')
const {Browser} = require('../../')
const {Pages, suite} = require('../../lib/test')
const logInspector = require('../../bidi/logInspector')
const filterBy = require('../../bidi/filterBy')

suite(
  function (env) {
    let driver

    beforeEach(async function () {
      driver = await env
        .builder()
        .setFirefoxOptions(new firefox.Options().enableBidi())
        .build()
    })

    afterEach(async function () {
      await driver.quit()
    })

    describe('Log Inspector', function () {
      it('can listen to console log', async function () {
        let logEntry = null
        const inspector = await logInspector(driver)
        await inspector.onConsoleEntry(function (log) {
          logEntry = log
        })

        await driver.get(Pages.logEntryAdded)
        await driver.findElement({id: 'consoleLog'}).click()

        assert.equal(logEntry.text, 'Hello, world!')
        assert.equal(logEntry.realm, null)
        assert.equal(logEntry.type, 'console')
        assert.equal(logEntry.level, 'info')
        assert.equal(logEntry.method, 'log')
        assert.equal(logEntry.stackTrace, null)
        assert.equal(logEntry.args.length, 1)

        await inspector.close()
      })

      it('can listen to console log with different consumers', async function () {
        let logEntry = null
        const inspector = await logInspector(driver)
        await inspector.onConsoleEntry(function (log) {
          logEntry = log
        })

        let logEntryText = null
        await inspector.onConsoleEntry(function (log) {
          logEntryText = log.text
        })

        await driver.get(Pages.logEntryAdded)
        await driver.findElement({id: 'consoleLog'}).click()

        assert.equal(logEntry.text, 'Hello, world!')
        assert.equal(logEntry.realm, null)
        assert.equal(logEntry.type, 'console')
        assert.equal(logEntry.level, 'info')
        assert.equal(logEntry.method, 'log')
        assert.equal(logEntry.stackTrace, null)
        assert.equal(logEntry.args.length, 1)

        assert.equal(logEntryText, 'Hello, world!')

        await inspector.close()
      })

      it('can filter console info level log', async function () {
        let logEntry = null
        const inspector = await logInspector(driver)
        await inspector.onConsoleEntry(function (log) {
          logEntry = log
        }, filterBy.FilterBy.logLevel('info'))

        await driver.get(Pages.logEntryAdded)
        await driver.findElement({id: 'consoleLog'}).click()

        assert.equal(logEntry.text, 'Hello, world!')
        assert.equal(logEntry.realm, null)
        assert.equal(logEntry.type, 'console')
        assert.equal(logEntry.level, 'info')
        assert.equal(logEntry.method, 'log')
        assert.equal(logEntry.stackTrace, null)
        assert.equal(logEntry.args.length, 1)

        await inspector.close()
      })

      it('can filter console log', async function () {
        let logEntry = null
        const inspector = await logInspector(driver)
        await inspector.onConsoleEntry(function (log) {
          logEntry = log
        }, filterBy.FilterBy.logLevel('error'))

        await driver.get(Pages.logEntryAdded)
        // Generating info level log but we are filtering by error level
        await driver.findElement({id: 'consoleLog'}).click()

        assert.equal(logEntry, null)
        await inspector.close()
      })

      it('can listen to javascript log', async function () {
        let logEntry = null
        const inspector = await logInspector(driver)
        await inspector.onJavascriptLog(function (log) {
          logEntry = log
        })

        await driver.get(Pages.logEntryAdded)
        await driver.findElement({id: 'jsException'}).click()

        assert.equal(logEntry.text, 'Error: Not working')
        assert.equal(logEntry.type, 'javascript')
        assert.equal(logEntry.level, 'error')

        await inspector.close()
      })

      it('can filter javascript log at error level', async function () {
        let logEntry = null
        const inspector = await logInspector(driver)
        await inspector.onJavascriptLog(function (log) {
          logEntry = log
        }, filterBy.FilterBy.logLevel('error'))

        await driver.get(Pages.logEntryAdded)
        await driver.findElement({id: 'jsException'}).click()

        assert.equal(logEntry.text, 'Error: Not working')
        assert.equal(logEntry.type, 'javascript')
        assert.equal(logEntry.level, 'error')

        await inspector.close()
      })

      it('can filter javascript log', async function () {
        let logEntry = null
        const inspector = await logInspector(driver)
        await inspector.onJavascriptLog(function (log) {
          logEntry = log
        }, filterBy.FilterBy.logLevel('info'))

        await driver.get(Pages.logEntryAdded)
        await driver.findElement({id: 'jsException'}).click()

        assert.equal(logEntry, null)

        await inspector.close()
      })

      it('can listen to javascript error log', async function () {
        let logEntry = null
        const inspector = await logInspector(driver)
        await inspector.onJavascriptException(function (log) {
          logEntry = log
        })

        await driver.get(Pages.logEntryAdded)
        await driver.findElement({id: 'jsException'}).click()

        assert.equal(logEntry.text, 'Error: Not working')
        assert.equal(logEntry.type, 'javascript')
        assert.equal(logEntry.level, 'error')

        await inspector.close()
      })

      it('can retrieve stack trace for a log', async function () {
        let logEntry = null
        const inspector = await logInspector(driver)
        await inspector.onJavascriptException(function (log) {
          logEntry = log
        })

        await driver.get(Pages.logEntryAdded)
        await driver.findElement({id: 'jsException'}).click()

        const stackTrace = logEntry.stackTrace
        assert.notEqual(stackTrace, null)
        assert.equal(stackTrace.callFrames.length, 3)

        await inspector.close()
      })

      it('can listen to any log', async function () {
        let logEntry = null
        const inspector = await logInspector(driver)
        await inspector.onLog(function (log) {
          logEntry = log
        })

        await driver.get(Pages.logEntryAdded)
        await driver.findElement({id: 'consoleLog'}).click()

        assert.equal(logEntry.text, 'Hello, world!')
        assert.equal(logEntry.realm, null)
        assert.equal(logEntry.type, 'console')
        assert.equal(logEntry.level, 'info')
        assert.equal(logEntry.method, 'log')
        assert.equal(logEntry.stackTrace, null)
        assert.equal(logEntry.args.length, 1)

        await inspector.close()
      })

      it('can filter any log', async function () {
        let logEntry = null
        const inspector = await logInspector(driver)
        await inspector.onLog(function (log) {
          logEntry = log
        }, filterBy.FilterBy.logLevel('info'))

        await driver.get(Pages.logEntryAdded)
        await driver.findElement({id: 'consoleLog'}).click()

        assert.equal(logEntry.text, 'Hello, world!')
        assert.equal(logEntry.realm, null)
        assert.equal(logEntry.type, 'console')
        assert.equal(logEntry.level, 'info')
        assert.equal(logEntry.method, 'log')
        assert.equal(logEntry.stackTrace, null)
        assert.equal(logEntry.args.length, 1)

        await inspector.close()
      })

      it('can filter any log at error level', async function () {
        let logEntry = null
        const inspector = await logInspector(driver)
        await inspector.onLog(function (log) {
          logEntry = log
        }, filterBy.FilterBy.logLevel('error'))

        await driver.get(Pages.logEntryAdded)
        await driver.findElement({id: 'jsException'}).click()

        assert.equal(logEntry.text, 'Error: Not working')
        assert.equal(logEntry.type, 'javascript')
        assert.equal(logEntry.level, 'error')
        await inspector.close()
      })
    })
  },
  {browsers: [Browser.FIREFOX]}
)
