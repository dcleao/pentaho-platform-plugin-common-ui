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

  describe("pentaho.impl.CustomContextVars -", function() {

    /**
     * Mocks AMD with dummy default context properties.
     */
    function configDefaultContext(localRequire) {

      localRequire.define("pentaho/contextVars", {
        basePath:    "ABC",
        application: "APP",
        user:        "USER",
        userHome:    "USER-HOME",
        theme:       "THEME",
        locale:      "LOCALE",
        reservedChars: "RESERVED-CHARS",
        reservedCharsDisplay: "RESERVED-CHARS-DISPLAY",
        reservedCharsPattern: "RESERVED-CHARS-PATTERN",
        serverUrl: "SERVER-URL",
        serverProtocol: "SERVER-PROTOCOL"
      });
    }

    it("is a function", function() {

      return require.using(["pentaho/impl/CustomContextVars"], configDefaultContext,
      function(CustomContextVars) {
        expect(typeof CustomContextVars).toBe("function");
      });
    });

    describe("new CustomContextVars(spec) -", function() {

      it("should return a CustomContextVars instance", function() {

        return require.using(["pentaho/impl/CustomContextVars"], configDefaultContext,
        function(CustomContextVars) {
          var contextVars = new CustomContextVars();
          expect(contextVars instanceof CustomContextVars).toBe(true);
        });
      });

      /**
       * Tests that a context property is properly implemented by pentaho.impl.CustomContextVars.
       *
       * @param {string} propName - The name of the context property.
       */
      function testProperty(propName) {
        describe(propName, function() {

          it("should default to the default property's value, when spec." + propName + " is not specified", function() {

            return require.using([
              "pentaho/contextVars",
              "pentaho/impl/CustomContextVars"
            ], configDefaultContext, function(defaultContextVars, CustomContextVars) {

              var customContext = new CustomContextVars();
              expect(customContext[propName]).toBe(defaultContextVars[propName]);
            });
          });

          it("should default to the default property's value, when spec." + propName + " is undefined", function() {

            return require.using([
              "pentaho/contextVars",
              "pentaho/impl/CustomContextVars"
            ], configDefaultContext, function(defaultContextVars, CustomContextVars) {
              var spec = {};
              spec[propName] = undefined;

              var customContext = new CustomContextVars(spec);

              expect(customContext[propName]).toBe(defaultContextVars[propName]);
            });
          });

          it("should convert to `null`, when spec." + propName + " is empty", function() {

            return require.using([
              "pentaho/contextVars",
              "pentaho/impl/CustomContextVars"
            ], configDefaultContext, function(defaultContextVars, CustomContextVars) {
              var spec = {};
              spec[propName] = "";

              var customContext = new CustomContextVars(spec);

              expect(customContext[propName]).toBe(null);
            });
          });

          it("should preserve a spec." + propName + " = null", function() {

            return require.using([
              "pentaho/contextVars",
              "pentaho/impl/CustomContextVars"
            ], configDefaultContext, function(defaultContextVars, CustomContextVars) {
              var spec = {};
              spec[propName] = null;

              var customContext = new CustomContextVars(spec);

              expect(customContext[propName]).toBe(null);
            });
          });

          it("should respect a non-empty spec." + propName + " value", function() {

            return require.using(["pentaho/impl/CustomContextVars"], configDefaultContext,
            function(CustomContextVars) {
              var spec = {};
              spec[propName] = "FOOOO";

              var customContext = new CustomContextVars(spec);
              expect(customContext[propName]).toBe(spec[propName]);
            });
          });
        });
      }

      testProperty("basePath");
      testProperty("application");
      testProperty("user");
      testProperty("userHome");
      testProperty("theme");
      testProperty("locale");
      testProperty("reservedChars");
      testProperty("reservedCharsDisplay");
      testProperty("reservedCharsPattern");
      testProperty("serverUrl");
      testProperty("serverProtocol");
    });
  }); // pentaho.impl.CustomContextVars
});
