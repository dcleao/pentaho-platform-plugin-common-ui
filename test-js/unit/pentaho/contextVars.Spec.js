/*!
 * Copyright 2010 - 2015 Pentaho Corporation.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([
  "tests/test-utils"
], function(testUtils) {

  "use strict";

  /* global describe:false, it:false, expect:false, beforeEach:false, afterEach:false */

  // Use alternate, promise-aware version of `it`.
  var it = testUtils.itAsync;

  describe("pentaho.contextVars", function() {

    /**
     * Tests that a context variable is properly implemented.
     *
     * @param {string} propName - The name of the context property.
     * @param {string} globalVarName - The name of the context property's global variable name.
     */
    function testContextProperty(propName, globalVarName) {

      describe(propName, function() {

        function mockWindowWith(varName, varValue) {

          return function(localRequire) {
            var win = {};
            if(varName) win[varName] = varValue;

            localRequire.define("pentaho/util/domWindow", win);
          };
        }

        it("should have a null value when " + globalVarName + " is undefined", function() {

          return require.using(["pentaho/contextVars"], mockWindowWith(), function(contextVars) {
            expect(contextVars[propName]).toBe(null);
          });
        });

        it("should have a null value when " + globalVarName + " is empty", function() {

          return require.using(["pentaho/contextVars"], mockWindowWith(globalVarName, ""), function(contextVars) {
            expect(contextVars[propName]).toBe(null);
          });
        });

        it("should respect a non-empty " + globalVarName + " value", function() {

          return require.using(["pentaho/contextVars"], mockWindowWith(globalVarName, "ABC"), function(contextVars) {
            expect(contextVars[propName]).toBe("ABC");
          });
        });
      });
    }

    testContextProperty("basePath", "CONTEXT_PATH");
    testContextProperty("application", "PENTAHO_CONTEXT_NAME");
    testContextProperty("user", "SESSION_NAME");
    testContextProperty("userHome", "HOME_FOLDER");
    testContextProperty("theme", "active_theme");
    testContextProperty("locale", "SESSION_LOCALE");
    testContextProperty("reservedChars", "RESERVED_CHARS");
    testContextProperty("reservedCharsDisplay", "RESERVED_CHARS_DISPLAY");
    testContextProperty("reservedCharsPattern", "RESERVED_CHARS_REGEX_PATTERN");
    testContextProperty("serverUrl", "FULL_QUALIFIED_URL");
    testContextProperty("serverProtocol", "SERVER_PROTOCOL");

  }); // pentaho.contextVars
});
