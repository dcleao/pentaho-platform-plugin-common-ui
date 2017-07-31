/*!
 * Copyright 2010 - 2017 Pentaho Corporation.  All rights reserved.
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
  "pentaho/type/standard",
  "tests/test-utils"
], function(standard, testUtils) {

  "use strict";

  /* global describe:false, it:false, expect:false, beforeEach:false, afterEach:false, Promise:false, spyOn:false*/

  /* jslint max-nested-callbacks: 7 */

  // Use alternate, promise-aware version of `it`.
  var it = testUtils.itAsync;
  var expectToRejectWith = testUtils.expectToRejectWith;

  describe("pentaho.type.Context -", function() {

    it("is a function", function() {

      return require.using(["pentaho/type/Context"], function(Context) {
        expect(typeof Context).toBe("function");
      });
    });

    describe("new Context([contextVars]) -", function() {

      it("should return a context instance", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {
            expect(context instanceof Context).toBe(true);
          });
        });
      });

      it("should create a context that has an Environment in #environment", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {
            expect(context.environment instanceof Object).toBe(true);
          });
        });
      });

      it("should create a context that has a pentaho.environment.main by default", function() {

        return require.using(["pentaho/type/Context", "pentaho/environment"], function(Context, envDefault) {

          return Context.createAsync().then(function(context) {
            expect(context.environment).toBe(envDefault);
          });
        });
      });

      it("should create a context that has a null transaction by default", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {
            expect(context.transaction).toBe(null);
          });
        });
      });

      it("should respect a given context instance", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          var customEnv = {createChild: function() {}}; // duck typing

          return Context.createAsync(customEnv).then(function(context) {
            expect(context.environment).toBe(customEnv);
          });
        });
      });
    });

    describe("#transaction", function() {
      // Read
    });

    describe("#enterChange()", function() {

      it("should return a TransactionScope instance", function() {

        return require.using(["pentaho/type/Context", "pentaho/type/changes/TransactionScope"], function(Context, TransactionScope) {

          return Context.createAsync().then(function(context) {

            var txnScope = context.enterChange();

            expect(txnScope instanceof TransactionScope).toBe(true);

            txnScope.exit();
          });
        });
      });

      it("should return a TransactionScope instance whose transaction is now the ambient transaction", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {

            var txnScope = context.enterChange();

            expect(txnScope.transaction).toBe(context.transaction);

            txnScope.exit();
          });
        });
      });

      it("should return a TransactionScope whose context is this one", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {

            var txnScope = context.enterChange();

            expect(txnScope.context).toBe(context);
          });
        });
      });

      it("should return a new TransactionScope instance each time", function() {

        return require.using(["pentaho/type/Context", "pentaho/type/changes/TransactionScope"], function(Context) {

          return Context.createAsync().then(function(context) {

            var txnScope1 = context.enterChange();
            var txnScope2 = context.enterChange();

            expect(txnScope1).not.toBe(txnScope2);
          });
        });
      });

      it("should return a new TransactionScope of the same transaction, each time", function() {

        return require.using(["pentaho/type/Context", "pentaho/type/changes/TransactionScope"], function(Context) {

          return Context.createAsync().then(function(context) {
            var txnScope1 = context.enterChange();
            var txnScope2 = context.enterChange();

            expect(txnScope1.transaction).toBe(txnScope2.transaction);
          });
        });
      });

      it("should call the new ambient transaction's #__enteringAmbient method", function() {

        return require.using([
          "pentaho/type/Context",
          "pentaho/type/changes/Transaction",
          "pentaho/type/changes/TransactionScope"
        ], function(Context, Transaction, TransactionScope) {

          return Context.createAsync().then(function(context) {
            var txn = new Transaction(context);

            spyOn(txn, "__enteringAmbient");

            var scope = new TransactionScope(context, txn);

            expect(txn.__enteringAmbient).toHaveBeenCalled();

            scope.exit();
          });
        });
      });

      it("should call the suspending ambient transaction's __exitingAmbient, when a null scope enters", function() {

        return require.using([
          "pentaho/type/Context",
          "pentaho/type/changes/Transaction",
          "pentaho/type/changes/TransactionScope",
          "pentaho/type/changes/CommittedScope"
        ], function(Context, Transaction, TransactionScope, CommittedScope) {

          return Context.createAsync().then(function(context) {
            var txn = new Transaction(context);
            var scope = new TransactionScope(context, txn);

            spyOn(txn, "__exitingAmbient");

            var scopeNull = new CommittedScope(context);

            expect(txn.__exitingAmbient).toHaveBeenCalled();

            scopeNull.exit();
            scope.exit();
          });
        });
      });
    });

    describe("#get|getAsync(typeRef)", function() {

      // region get test helpers
      /**
       * Each of the following tests is performed both synchronously and asynchronously
       * using a single tester function.
       *
       * A test that should succeed uses testGet.
       * A test that should fail uses testGet and expectToRejectWith.
       */

      /**
       * Creates an async test function suitable for `it`.
       *
       * Receives a _get-test_ function, `tester`, that is called in two modes: sync and async.
       *
       * The `tester` function has the signature `function(sync, Context) : ?Promise`.
       *
       * The `tester` function should use `callGet(context, sync, spec)` to actually call the
       * corresponding get method, sync or async, while providing the test's specific spec argument.
       *
       * If the `tester` function returns a promise, it is resolved and expected to succeed.
       */

      function testGet(getTester, configAmd) {

        return testUtils.modal([true, false], function(sync) {
          return require.using(
              ["pentaho/type/Context", "require", "tests/pentaho/util/errorMatch"],
              (configAmd || function() {}),
              function(Context, require, errorMatch) {
                return Context.createAsync().then(function(context) {
                  return getTester(sync, context, require, errorMatch);
                });
              });

        });
      }

      function testGetAsync(getTester, configAmd) {

        return require.using(
            ["pentaho/type/Context", "require", "tests/pentaho/util/errorMatch"],
            (configAmd || function() {}),
            function(Context, require, errorMatch) {
              return Context.createAsync().then(function(context) {
                return getTester(context, require, errorMatch);
              });
            });
      }

      function testGetCustom(getTester) {

        return testUtils.modal([true, false], function(sync) {
          return require.using(
              ["pentaho/type/Context", "require", "tests/pentaho/util/errorMatch"],
              getTester.bind(null, sync));
        });
      }

      /*
       * Calls the get or getAsync method depending on the `sync` argument value.
       */
      function callGet(context, sync, spec) {
        try {
          var result = context[sync ? "get" : "getAsync"](spec);
          if(sync) {
            if(result) expect(result instanceof Promise).toBe(false);
          } else {
            expect(result instanceof Promise).toBe(true);
          }
        } catch(ex) {
          return Promise.reject(ex);
        }

        return Promise.resolve(result);
      }
      // endregion

      it("should have pre-loaded standard primitive types, mixins and filters", function() {

        return require.using(["require", "pentaho/type/Context"], function(localRequire, Context) {
          return Context.createAsync().then(function(context) {

            var p;

            for(p in standard)
              if(standard.hasOwnProperty(p))
                if(p !== "mixins" && p !== "Instance")
                  expect(!!context.get("pentaho/type/" + p)).toBe(true);

            for(p in standard.mixins)
              if(standard.mixins.hasOwnProperty(p))
                expect(!!context.get("pentaho/type/mixins/" + p)).toBe(true);

          });
        });
      });

      describe("by id", function() {

        it("should throw on get, when the given id exists but hasn't been loaded yet", function() {
          return require.using(["pentaho/type/Context", "require"], function(Context, localRequire) {

            return Context.createAsync().then(function(context) {
              localRequire.define("my/foo", [], function() {
                return function(ctx) {
                  return function() {};
                };
              });

              // expect to throw
              expect(function() {
                context.get("my/foo");
              }).toThrow();
            });
          });
        });

        describe("should be able to get a standard type given its alias", function() {

          var aliasMap = {};

          Object.keys(standard).forEach(function(standardType) {
            /* eslint default-case: 0 */
            if(standardType !== "mixins") {
              aliasMap[standardType] = "pentaho/type/" + standardType;
            }
          });

          Object.keys(aliasMap).forEach(function(alias) {

            it("for the alias '" + alias + "'", function() {

              return testGet(function(sync, context) {

                var promise = callGet(context, sync, alias);

                return promise.then(function(InstCtor) {
                  expect(InstCtor.type.id).toBe(aliasMap[alias]);
                });
              });
            });
          });
        });

        it("should be able to get a standard type given its absolute id", function() {

          return testGet(function(sync, context) {

            var promise = callGet(context, sync, "pentaho/type/string");

            return promise.then(function(InstCtor) {
              expect(InstCtor.type.id).toBe("pentaho/type/string");
            });
          });
        });

        it("should be able to get an already loaded non-standard type given its absolute id", function() {

          var mid = "pentaho/foo/bar";

          function configAmd(localRequire) {

            localRequire.define(mid, [], function() {
              return [
                "pentaho/type/simple",
                function(Simple) {
                  return Simple.extend({$type: {id: mid}});
                }
              ];
            });
          }

          function getTester(sync, context) {

            return context.getAsync(mid)
                .then(function() {
                  return callGet(context, sync, mid);
                })
                .then(function(InstCtor) {
                  expect(InstCtor.type.id).toBe(mid);
                });
          }

          return testGet(getTester, configAmd);

        });

        // The sync case does not apply.
        it("should be able to get a non-loaded non-standard type, asynchronously, given its absolute id", function() {

          var mid = "test/type/a";

          function configAmd(localRequire) {

            localRequire.define(mid, [], function() {
              return [
                "pentaho/type/simple",
                function(Simple) {
                  return Simple.extend({$type: {id: mid}});
                }
              ];
            });
          }

          return require.using(["pentaho/type/Context"], configAmd, function(Context) {

            return Context.createAsync().then(function(context) {
              return context.getAsync(mid);
            });
          });
        });

        // The sync case does not apply.
        it("should be able to get a non-loaded non-standard type given its registered alias", function() {

          var mid = "test/type/a";

          function configAmd(localRequire) {

            localRequire.config({
              config: {
                "pentaho/typeInfo": {
                  "test/type/a": {alias: "XYZ"}
                }
              }
            });

            localRequire.define(mid, [], function() {
              return [
                "pentaho/type/simple",
                function(Simple) {
                  return Simple.extend({
                    $type: {
                      id: mid,
                      alias: "XYZ"
                    }
                  });
                }
              ];
            });
          }

          return require.using(["pentaho/type/Context"], configAmd, function(Context) {

            return Context.createAsync().then(function(context) {
              return context.getAsync("XYZ").then(function(Xyz) {
                expect(Xyz.type.id).toBe(mid);
              });
            });
          });
        });
      });

      describe("by type instance constructor (Instance)", function() {

        it("should be able to get a standard type", function() {

          return testGet(function(sync, context) {

            var Value = context.get("pentaho/type/value");
            var promise = callGet(context, sync, Value);

            return promise.then(function(InstCtor) {
              expect(InstCtor.type.id).toBe("pentaho/type/value");
            });
          });
        });

        it("should configure standard types", function() {

          return testGetCustom(function(sync, Context) {

            // "value" is configured on the Context constructor, so need to wire the prototype...

            spyOn(Context.prototype, "__getConfigAsync").and.callFake(function(id) {
              return Promise.resolve(id === "pentaho/type/value" ? {foo: "bar", instance: {bar: "foo"}} : null);
            });

            return Context.createAsync().then(function(context) {

              expect(Context.prototype.__getConfigAsync).toHaveBeenCalledWith("pentaho/type/value");

              var InstCtor = context.get("pentaho/type/value");
              expect(InstCtor.prototype.bar).toBe("foo");
              expect(InstCtor.type.foo).toBe("bar");
            });
          });
        });

        it("should not configure a type twice", function() {

          return require.using(["pentaho/type/Context"], function(Context) {

            spyOn(Context.prototype, "__getConfigAsync").and.callFake(function(id) {
              return Promise.resolve(id === "tests/foo/bar" ? {foo: "bar", instance: {bar: "foo"}} : null);
            });

            return Context.createAsync().then(function(context) {

              var Value = context.get("pentaho/type/value");

              var Value2 = Value.extend({
                $type: {
                  id: "tests/foo/bar"
                }
              });

              var ValueType2 = Value2.type.constructor;
              spyOn(ValueType2, "implement").and.callThrough();

              return context.getAsync(Value2).then(function(InstCtor) {

                expect(InstCtor).toBe(Value2);

                expect(Context.prototype.__getConfigAsync).toHaveBeenCalledWith("tests/foo/bar");
                expect(ValueType2.implement).toHaveBeenCalledTimes(1);

                expect(Value2.prototype.bar).toBe("foo");
                expect(Value2.type.foo).toBe("bar");

                return context.getAsync(Value2).then(function(InstCtor) {

                  expect(InstCtor).toBe(Value2);

                  expect(ValueType2.implement).toHaveBeenCalledTimes(1);
                });
              });
            });
          });
        });

        it("should increment the configuration depth level while configuring a type", function() {

          return require.using(["pentaho/type/Context"], function(Context) {

            spyOn(Context.prototype, "__getConfigAsync").and.callFake(function(id) {
              return Promise.resolve(id === "tests/foo/bar" ? {foo: "bar", instance: {bar: "foo"}} : null);
            });

            return Context.createAsync().then(function(context) {

              expect(context.__configDepth).toBe(0);

              var Value = context.get("pentaho/type/value");
              var Value2 = Value.extend({
                $type: {
                  id: "tests/foo/bar"
                }
              });

              var ValueType2 = Value2.type.constructor;

              spyOn(ValueType2, "implement").and.callFake(function() {

                expect(context.__configDepth).toBe(1);
              });

              return context.getAsync(Value2).then(function(InstCtor) {

                expect(InstCtor).toBe(Value2);

                expect(ValueType2.implement).toHaveBeenCalledTimes(1);

                expect(context.__configDepth).toBe(0);
              });
            });
          });
        });

        it("should have #isConfiguring = true, while configuring a type", function() {

          return require.using(["pentaho/type/Context"], function(Context) {

            spyOn(Context.prototype, "__getConfigAsync").and.callFake(function(id) {
              return Promise.resolve(id === "tests/foo/bar" ? {foo: "bar", instance: {bar: "foo"}} : null);
            });

            return Context.createAsync().then(function(context) {

              expect(context.__configDepth).toBe(0);

              var Value = context.get("pentaho/type/value");

              var Value2 = Value.extend({
                $type: {
                  id: "tests/foo/bar"
                }
              });

              var ValueType2 = Value2.type.constructor;

              spyOn(ValueType2, "implement").and.callFake(function() {

                expect(context.isConfiguring).toBe(true);
              });

              return context.getAsync(Value2).then(function(InstCtor) {

                expect(InstCtor).toBe(Value2);

                expect(ValueType2.implement).toHaveBeenCalledTimes(1);

                expect(context.isConfiguring).toBe(false);
              });
            });
          });
        });
      });

      describe("by type object", function() {

        it("should be able to get a standard type given its type object", function() {

          return testGet(function(sync, context) {

            var Value = context.get("pentaho/type/value");
            var promise = callGet(context, sync, Value.type);

            return promise.then(function(InstCtor) {
              expect(InstCtor.type.id).toBe("pentaho/type/value");
            });
          });
        });
      });

      describe("by others, invalid", function() {

        it("should throw/reject when given the type-constructor (Type)", function() {

          return testGet(function(sync, context, localRequire, errorMatch) {

            var Value   = context.get("pentaho/type/value");

            return expectToRejectWith(
                function() { return callGet(context, sync, Value.type.constructor); },
                errorMatch.argInvalid("typeRef"));
          });
        });

        it("should throw/reject when given the type-factory", function() {

          return testGet(function(sync, context, localRequire, errorMatch) {

            var valueModule = localRequire("pentaho/type/value");
            var valueFactory = valueModule[valueModule.length - 1];

            return expectToRejectWith(
                function() { return callGet(context, sync, valueFactory); },
                errorMatch.argInvalid("typeRef"));
          });
        });

        it("should throw/reject when given null", function() {

          return testGet(function(sync, context, localRequire, errorMatch) {

            return expectToRejectWith(
                function() { return callGet(context, sync, null); },
                errorMatch.argRequired("typeRef"));
          });
        });

        it("should throw/reject when given undefined", function() {

          return testGet(function(sync, context, localRequire, errorMatch) {

            return expectToRejectWith(
                function() { return callGet(context, sync, undefined); },
                errorMatch.argRequired("typeRef"));
          });
        });

        it("should throw/reject when given an empty string", function() {

          return testGet(function(sync, context, localRequire, errorMatch) {

            return expectToRejectWith(
                function() {
                  return callGet(context, sync, "");
                },
                errorMatch.argRequired("typeRef"));
          });
        });

        it("should throw/reject when given a standard type instance prototype", function() {

          return testGet(function(sync, context, localRequire, errorMatch) {

            var Value = context.get("pentaho/type/value");

            return expectToRejectWith(
                function() { return callGet(context, sync, Value.prototype); },
                errorMatch.argInvalid("typeRef"));
          });
        });

        it("should throw/reject if given a number (not a string, function or object)", function() {

          return testGet(function(sync, context, localRequire, errorMatch) {

            return expectToRejectWith(
                function() { return callGet(context, sync, 1); },
                errorMatch.argInvalid("typeRef"));
          });
        });

        it("should throw/reject if given a boolean (not a string, function or object)", function() {

          return testGet(function(sync, context, localRequire, errorMatch) {

            return expectToRejectWith(
                function() { return callGet(context, sync, true); },
                errorMatch.argInvalid("typeRef"));
          });
        });
      });

      describe("by generic or specialized type specification syntax", function() {
        // Generic type specification syntax:
        // {id: "foo", base: "complex", ...}

        describe("`base` and `id`", function() {

          describe("when `base` is not specified", function() {

            it("should default `base` to `null` when `id` is 'value'", function() {

              return testGet(function(sync, context) {

                var promise = callGet(context, sync, {id: "value"});

                return promise.then(function(InstCtor) {
                  var Value = context.get("pentaho/type/value");

                  expect(InstCtor).toBe(Value);
                });
              });
            });

            it("should default `base` to 'complex' when `id` is not specified", function() {

              return testGet(function(sync, context) {

                var promise = callGet(context, sync, {props: ["a", "b"]});

                return promise.then(function(InstCtor) {

                  var Complex = context.get("pentaho/type/complex");

                  expect(InstCtor.type.isSubtypeOf(Complex.type)).toBe(true);

                  expect(InstCtor.ancestor).toBe(Complex);
                  expect(InstCtor.type.has("a")).toBe(true);
                  expect(InstCtor.type.has("b")).toBe(true);
                });
              });
            });
          });

          describe("when `base` is `undefined`", function() {

            it("should default `base` to 'complex'", function() {

              return testGet(function(sync, context) {

                var promise = callGet(context, sync, {base: undefined, props: ["a", "b"]});

                return promise.then(function(InstCtor) {

                  var Complex = context.get("pentaho/type/complex");

                  expect(InstCtor.type.isSubtypeOf(Complex.type)).toBe(true);

                  expect(InstCtor.ancestor).toBe(Complex);
                  expect(InstCtor.type.has("a")).toBe(true);
                  expect(InstCtor.type.has("b")).toBe(true);
                });
              });
            });
          });

          describe("when `base` is `null`", function() {

            it("should default `base` to 'complex'", function() {

              return testGet(function(sync, context) {

                var promise = callGet(context, sync, {base: null, props: ["a", "b"]});

                return promise.then(function(InstCtor) {

                  var Complex = context.get("pentaho/type/complex");

                  expect(InstCtor.type.isSubtypeOf(Complex.type)).toBe(true);

                  expect(InstCtor.ancestor).toBe(Complex);
                  expect(InstCtor.type.has("a")).toBe(true);
                  expect(InstCtor.type.has("b")).toBe(true);
                });
              });
            });
          });
        });

        // region complex
        it("should be able to create an anonymous complex type with base complex", function() {

          return testGet(function(sync, context) {

            var promise = callGet(context, sync, {base: "complex", props: ["a", "b"]});

            return promise.then(function(InstCtor) {

              var Complex = context.get("pentaho/type/complex");

              expect(InstCtor.type.isSubtypeOf(Complex.type)).toBe(true);

              expect(InstCtor.ancestor).toBe(Complex);
              expect(InstCtor.type.has("a")).toBe(true);
              expect(InstCtor.type.has("b")).toBe(true);
            });
          });
        });
        // endregion

        // region list
        it("should be able to create a list type using generic notation", function() {

          return testGet(function(sync, context) {

            var promise = callGet(context, sync, {
              base: "list",
              of: {props: ["a", "b"]}
            });

            return promise.then(function(InstCtor) {

              expect(InstCtor.prototype instanceof context.get("list")).toBe(true);

              var ofType = InstCtor.type.of;
              expect(ofType.instance instanceof context.get("complex")).toBe(true);
              expect(ofType.count).toBe(2);
              expect(ofType.has("a")).toBe(true);
              expect(ofType.has("b")).toBe(true);
            });
          });
        });

        it("should be able to create a list type using the shorthand list-type notation", function() {

          return testGet(function(sync, context) {

            var promise = callGet(context, sync, [
              {props: ["a", "b"]}
            ]);

            return promise.then(function(InstCtor) {

              expect(InstCtor.prototype instanceof context.get("list")).toBe(true);

              var ofType = InstCtor.type.of;
              expect(ofType.instance instanceof context.get("complex")).toBe(true);
              expect(ofType.count).toBe(2);
              expect(ofType.has("a")).toBe(true);
              expect(ofType.has("b")).toBe(true);
            });
          });
        });

        it("should throw/reject if the shorthand list-type notation has two entries", function() {

          return testGet(function(sync, context, localRequire, errorMatch) {

            return expectToRejectWith(
                function() { return callGet(context, sync, [123, 234]); },
                errorMatch.argInvalid("typeRef"));
          });
        });
        // endregion

        // region temporary ids
        it("should allow creating a type that contains a temporary type id", function() {

          return testGet(function(sync, context) {

            var typeSpec = {
              props: [
                {name: "a", valueType: {id: "_:ab1", base: "number", label: "My Number"}},
                {name: "b", valueType: "_:ab1"}
              ]
            };

            var promise = callGet(context, sync, typeSpec);

            return promise.then(function(InstCtor) {

              var type = InstCtor.type;
              var myNumberType = type.get("a").valueType;

              expect(myNumberType.ancestor.shortId).toBe("number");
              expect(myNumberType.label).toBe("My Number");

              expect(type.get("b").valueType).toBe(myNumberType);
            });
          });
        });

        it("should use the same type instance for all temporary type id references", function() {

          return testGet(function(sync, context) {
            var typeSpec = {
              props: [
                {name: "a", valueType: {id: "_:1", base: "number", label: "My Number"}},
                {name: "b", valueType: "_:1"}
              ]
            };

            var promise = callGet(context, sync, typeSpec);

            return promise.then(function(InstCtor) {

              var type = InstCtor.type;

              expect(type.get("a").valueType).toBe(type.get("b").valueType);
            });
          });
        });

        // coverage
        // although, because we do not yet support recursive types, this is not useful
        it("should allow a top-level temporary type id", function() {

          return testGet(function(sync, context) {

            var typeSpec = {
              id: "_:1",
              props: [
                {name: "a", valueType: "string"},
                {name: "b", valueType: "string"}
              ]
            };

            return callGet(context, sync, typeSpec);
          });
        });

        it("should allow two generic type specifications with the same temporary id, " +
           "however the second spec is ignored", function() {

          return testGet(function(sync, context) {

            var typeSpec = {
              props: [
                {name: "a", valueType: {id: "_:1", base: "string"}},
                {name: "b", valueType: {id: "_:1", base: "number"}}
              ]
            };

            var promise = callGet(context, sync, typeSpec);

            return promise.then(function(InstCtor) {

              var type = InstCtor.type;

              expect(type.get("a").valueType).toBe(type.get("b").valueType);

              expect(type.get("a").valueType.ancestor.shortId).toBe("string");
            });
          });
        });

        it("should throw if trying to get a temporary id, directly, " +
           "and there is no ambient specification context", function() {

          return testGet(function(sync, context, localRequire, errorMatch) {

            return expectToRejectWith(
                function() { return callGet(context, sync, "_:1"); },
                errorMatch.argInvalid("typeRef"));
          });
        });

        // The async case is not testable.
        it("should throw if trying to get a temporary id, directly, and it does not exist " +
           "in the ambient specification context", function() {

          return require.using([
            "pentaho/type/Context",
            "pentaho/type/SpecificationScope",
            "tests/pentaho/util/errorMatch"
          ], function(Context, SpecificationScope, errorMatch) {

            return Context.createAsync().then(function(context) {
              var scope = new SpecificationScope();

              expect(function() {
                context.get("_:1");
              }).toThrow(errorMatch.argInvalid("typeRef"));

              scope.dispose();
            });
          });
        });

        // endregion
      });

      describe("type module", function() {

        it("should throw if the module is not an array", function() {

          return testGetAsync(function(context, localRequire, errorMatch) {

            var mid = "pentaho/foo/bar2";

            localRequire.define(mid, [], function() {
              return "not an array";
            });

            return context.getAsync(mid)
                .then(function() {
                  expect("to throw").toBe(true);
                }, function(ex) {
                  expect(ex).toEqual(errorMatch.argInvalidType("typeModule", "Array", "string"));
                });
          });
        });

        it("should throw if the module is an array whose last position is not a function", function() {

          var mid = "pentaho/foo/bar2";

          function configAmd(localRequire) {

            localRequire.define(mid, [], function() {
              return ["a/b/c", "not a function"];
            });
          }

          function getTester(context, localRequire, errorMatch) {

            return context.getAsync(mid)
                .then(function() {
                  expect("to throw").toBe(true);
                }, function(ex) {
                  expect(ex).toEqual(errorMatch.argInvalid("typeModule"));
                });
          }

          return testGetAsync(getTester, configAmd);
        });

        it("should throw if the factory does not return a function", function() {

          return testGetAsync(function(context, localRequire, errorMatch) {

            var mid = "pentaho/foo/bar2";

            localRequire.define(mid, [], function() {
              return [function() {
                return "not a function";
              }];
            });

            return context.getAsync(mid)
                .then(function() {
                  expect("to throw").toBe(true);
                }, function(ex) {
                  expect(ex).toEqual(errorMatch.operInvalid());
                });
          });
        });

        it("should throw if it returns a function that is not an Instance", function() {

          return testGetAsync(function(context, localRequire, errorMatch) {
            var mid = "pentaho/foo/bar2";

            localRequire.define(mid, [], function() {
              return [function() {
                return function notAnInstance() {
                };
              }];
            });

            return context.getAsync(mid)
                .then(function() {
                  expect("to throw").toBe(true);
                }, function(ex) {
                  expect(ex).toEqual(errorMatch.operInvalid());
                });
          });
        });

        it("should not throw if the module is an array whose last position is a function", function() {

          return testGetAsync(function(context, localRequire) {

            var mid = "pentaho/foo/bar2";

            localRequire.define(mid, [], function() {
              return [
                "pentaho/type/simple",
                function(Simple) {
                  return Simple.extend({$type: {id: mid}});
                }
              ];
            });

            return context.getAsync(mid)
                .then(function(InstCtor) {
                  expect(InstCtor.type.id).toBe(mid);
                });
          });
        });
      });

      it("should collect non-standard type ids in getAsync", function() {

        return require.using(["require", "pentaho/type/Context"], function(localRequire, Context) {

          function defineTempModule(mid) {
            localRequire.define(mid, [], function() {
              return [
                "pentaho/type/simple",
                function(Simple) {
                  return Simple.extend({$type: {id: mid}});
                }
              ];
            });
          }

          function defineTempMixin(mid) {
            localRequire.define(mid, [], function() {
              return [
                "pentaho/type/value",
                function(Value) {
                  return Value.extend({$type: {id: mid}});
                }
              ];
            });
          }

          function defineTempProp(mid) {
            localRequire.define(mid, [], function() {
              return [
                "pentaho/type/property",
                function(Property) {
                  return Property.extend({$type: {id: mid}});
                }
              ];
            });
          }

          defineTempModule("pentaho/test/type1");
          defineTempModule("pentaho/test/type2");
          defineTempModule("pentaho/test/type3");
          defineTempModule("pentaho/test/type4");
          defineTempMixin("pentaho/test/mixins/Mixin1");
          defineTempProp("pentaho/test/prop1");

          // -----

          var genericSpec = {
            base: "complex",
            props: [
              {name: "prop1", valueType: "pentaho/test/type1"},
              {name: "prop2", valueType: {base: "pentaho/test/type2"}},
              {name: "prop3", valueType: {base: "list", of: "pentaho/test/type3"}},
              {name: "prop4", valueType: ["pentaho/test/type3"]},
              {name: "prop5", valueType: {props: {
                a: {valueType: "pentaho/test/type4"},
                b: {valueType: "pentaho/test/type3"}
              }}},
              {name: "prop6", valueType: {
                base: "pentaho/test/type1",
                mixins: ["pentaho/test/mixins/Mixin1"]
              }},
              {name: "prop7", base: "pentaho/test/prop1", valueType: "string"}
            ]
          };

          return Context.createAsync().then(function(context) {

            return context.getAsync(genericSpec)
                .then(function(InstCtor) {

                  var mixin1Type = context.get("pentaho/test/mixins/Mixin1").type;
                  var prop1Type = context.get("pentaho/test/prop1").type;

                  expect(InstCtor.type.get("prop1").valueType.id).toBe("pentaho/test/type1");
                  expect(InstCtor.type.get("prop2").valueType.ancestor.id).toBe("pentaho/test/type2");
                  expect(InstCtor.type.get("prop3").valueType.of.id).toBe("pentaho/test/type3");
                  expect(InstCtor.type.get("prop4").valueType.of.id).toBe("pentaho/test/type3");
                  expect(InstCtor.type.get("prop5").valueType.get("a").valueType.id).toBe("pentaho/test/type4");
                  expect(InstCtor.type.get("prop6").valueType.mixins[0]).toBe(mixin1Type);
                  expect(InstCtor.type.get("prop7").isSubtypeOf(prop1Type)).toBe(true);
                });
          });
        });
      });

      // should throw when sync and the requested module is not defined
      // should throw when sync and the requested module is not yet loaded
      // should not throw when async and the requested module is not defined
    }); // #get|getAsync

    describe("#resolve(typeRefs)", function() {

      it("should return an empty array when given an empty array", function() {

        return require.using(["pentaho/type/Context"], function(Context) {
          return Context.createAsync().then(function(context) {

            var result = context.resolve([]);

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
          });
        });
      });

      it("should return an empty object when given an empty object", function() {

        return require.using(["pentaho/type/Context"], function(Context) {
          return Context.createAsync().then(function(context) {

            var result = context.resolve({});

            expect(result != null).toBe(true);
            expect(result.constructor).toBe(Object);
            expect(result).toEqual({});
          });
        });
      });

      it("should call #get for each type ref in the given array", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {

            var F1 = function() {};
            var F2 = function() {};

            spyOn(context, "get").and.callFake(function(typeRef) {
              switch(typeRef) {
                case "f1": return F1;
                case "f2": return F2;
              }
            });

            context.resolve(["f2", "f1"]);

            expect(context.get.calls.count()).toBe(2);
            expect(context.get).toHaveBeenCalledWith("f2");
            expect(context.get).toHaveBeenCalledWith("f1");
          });
        });
      });

      it("should call #get for each type ref in the given object", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {

            var F1 = function() {};
            var F2 = function() {};

            spyOn(context, "get").and.callFake(function(typeRef) {
              switch(typeRef) {
                case "f1": return F1;
                case "f2": return F2;
              }
            });

            context.resolve({a: "f2", b: "f1"});

            expect(context.get.calls.count()).toBe(2);
            expect(context.get).toHaveBeenCalledWith("f2");
            expect(context.get).toHaveBeenCalledWith("f1");
          });
        });
      });

      it("should return an array of types when given an array of type refs", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {

            var F1 = function() {};
            var F2 = function() {};

            spyOn(context, "get").and.callFake(function(typeRef) {
              switch(typeRef) {
                case "f1": return F1;
                case "f2": return F2;
              }
            });

            var result = context.resolve(["f2", "f1"]);

            expect(result).toEqual([F2, F1]);
          });
        });
      });

      it("should return an object with types as values when given a map of type refs", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {

            var F1 = function() {};
            var F2 = function() {};

            spyOn(context, "get").and.callFake(function(typeRef) {
              switch(typeRef) {
                case "f1": return F1;
                case "f2": return F2;
              }
            });

            var result = context.resolve({a: "f2", b: "f1"});

            expect(result).toEqual({a: F2, b: F1});
          });
        });
      });
    }); // #resolve

    describe("#inject(typeRefs, fun, ctx)", function() {

      it("should return a new function when given an array", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {

            var fun = function() {};
            var result = context.inject([], fun, {});

            expect(typeof result).toBe("function");
            expect(typeof result).not.toBe(fun);
          });
        });
      });

      it("should return a new function when given an object", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {

            var fun = function() {};
            var result = context.inject([], fun, {});

            expect(typeof result).toBe("function");
            expect(typeof result).not.toBe(fun);
          });
        });
      });

      it("should return a function that when called for the first time resolves the type refs (array)", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {

            var F1 = function() {};
            var F2 = function() {};

            spyOn(context, "get").and.callFake(function(typeRef) {
              switch(typeRef) {
                case "f1": return F1;
                case "f2": return F2;
              }
            });

            var fun = function() {};
            var result = context.inject(["f2", "f1"], fun, {});

            expect(context.get).not.toHaveBeenCalled();

            result();

            expect(context.get.calls.count()).toBe(2);

            // Only on the first time...
            result();

            expect(context.get.calls.count()).toBe(2);
          });
        });
      });

      it("should return a function that when called for the first time resolves the type refs (object)", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {

            var F1 = function() {};
            var F2 = function() {};

            spyOn(context, "get").and.callFake(function(typeRef) {
              switch(typeRef) {
                case "f1": return F1;
                case "f2": return F2;
              }
            });

            var fun = function() {};
            var result = context.inject({a: "f2", b: "f1"}, fun, {});

            expect(context.get).not.toHaveBeenCalled();

            result();

            expect(context.get.calls.count()).toBe(2);

            // Only on the first time...
            result();

            expect(context.get.calls.count()).toBe(2);
          });
        });
      });

      it("should return a function that when called calls the original with the resolved types (array)", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {

            var F1 = function() {};
            var F2 = function() {};

            spyOn(context, "get").and.callFake(function(typeRef) {
              switch(typeRef) {
                case "f1": return F1;
                case "f2": return F2;
              }
            });

            var fun = jasmine.createSpy();
            var result = context.inject(["f2", "f1"], fun, {});

            result();

            expect(fun.calls.count()).toBe(1);
            expect(fun.calls.first().args.length).toBe(2);
            expect(fun.calls.first().args[0]).toBe(F2);
            expect(fun.calls.first().args[1]).toBe(F1);
          });
        });
      });

      it("should return a function that when called calls the original with the resolved types (object)", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {

            var F1 = function() {};
            var F2 = function() {};

            spyOn(context, "get").and.callFake(function(typeRef) {
              switch(typeRef) {
                case "f1": return F1;
                case "f2": return F2;
              }
            });

            var fun = jasmine.createSpy();
            var result = context.inject({a: "f2", b: "f1"}, fun, {});

            result();

            expect(fun.calls.count()).toBe(1);
            expect(fun.calls.first().args.length).toBe(1);
            expect(fun.calls.first().args[0]).toEqual({a: F2, b: F1});
          });
        });
      });

      it("should return a function that when called passes additional arguments to the original (array)", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {

            var F1 = function() {};
            var F2 = function() {};

            spyOn(context, "get").and.callFake(function(typeRef) {
              switch(typeRef) {
                case "f1": return F1;
                case "f2": return F2;
              }
            });

            var fun = jasmine.createSpy();
            var result = context.inject(["f2", "f1"], fun, {});

            result(1, 2);

            expect(fun.calls.count()).toBe(1);
            expect(fun.calls.first().args.length).toBe(4);
            expect(fun.calls.first().args[2]).toBe(1);
            expect(fun.calls.first().args[3]).toBe(2);
          });
        });
      });

      it("should return a function that when called passes additional arguments to the original (object)", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {

            var F1 = function() {};
            var F2 = function() {};

            spyOn(context, "get").and.callFake(function(typeRef) {
              switch(typeRef) {
                case "f1": return F1;
                case "f2": return F2;
              }
            });

            var fun = jasmine.createSpy();
            var result = context.inject({a: "f2", b: "f1"}, fun, {});

            result(1, 2);

            expect(fun.calls.count()).toBe(1);
            expect(fun.calls.first().args.length).toBe(3);
            expect(fun.calls.first().args[1]).toBe(1);
            expect(fun.calls.first().args[2]).toBe(2);
          });
        });
      });

      it("should return a function that calls the original with the given `ctx`", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {

            var fun = jasmine.createSpy();
            var ctx = {};
            var result = context.inject([], fun, ctx);

            result();

            expect(fun.calls.count()).toBe(1);
            expect(fun.calls.first().object).toBe(ctx);
          });
        });
      });

      it("should return a function that passes through `this` to the original when no `ctx` is given", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {

            var fun = jasmine.createSpy();
            var result = context.inject([], fun);

            var ctx = {};
            result.call(ctx);

            expect(fun.calls.count()).toBe(1);
            expect(fun.calls.first().object).toBe(ctx);
          });
        });
      });

      it("should return a function that returns the original's return value", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {

            var value = {};
            var fun = function() { return value; };
            var fun2 = context.inject([], fun);

            var result = fun2();

            expect(result).toBe(value);
          });
        });
      });
    }); // #inject

    describe("#getAllAsync(baseTypeId, ka)", function() {

      function configRequire(localRequire) {

        localRequire.define("exp/baseWithNoRegistrations", [], function() {
          return [
            "pentaho/type/simple",
            function(Simple) {
              return Simple.extend({$type: {id: "exp/baseWithNoRegistrations"}});
            }
          ];
        });

        // ---

        localRequire.define("exp/thing", [], function() {
          return [
            "pentaho/type/simple",
            function(Simple) {
              return Simple.extend({$type: {id: "exp/thing"}});
            }
          ];
        });

        localRequire.define("exp/foo", [], function() {
          return [
            "exp/thing",
            function(Thing) {
              return Thing.extend({$type: {id: "exp/foo"}});
            }
          ];
        });

        // ---

        localRequire.define("exp/bar", [], function() {
          return [
            "exp/thing",
            function(Thing) {
              return Thing.extend({$type: {id: "exp/bar", isBrowsable: false}});
            }
          ];
        });

        // ---

        localRequire.define("exp/dude", [], function() {
          return [
            "pentaho/type/simple",
            function(Simple) {
              return Simple.extend({$type: {id: "exp/dude"}});
            }
          ];
        });

        // ---

        localRequire.define("exp/prop", [], function() {
          return [
            "pentaho/type/property",
            function(Property) {
              return Property.extend({$type: {id: "exp/prop"}});
            }
          ];
        });

        // ---

        localRequire.config({
          config: {
            "pentaho/service": {
              "exp/thing": "exp/thing",
              "exp/foo":   "exp/thing",
              "exp/bar":   "exp/thing",
              "exp/dude":  "pentaho/type/value",
              "exp/prop":  "pentaho/type/property",
              "exp/baseWithNoRegistrations": "exp/baseWithNoRegistrations" // but itself...
            }
          }
        });
      }

      it("should return a promise", function() {

        return require.using(["require", "pentaho/type/Context"], configRequire, function(localRequire, Context) {

          return Context.createAsync().then(function(context) {

            var p = context.getAllAsync();
            expect(p instanceof Promise).toBe(true);
          });
        });
      });

      it("should return all known subtypes of 'pentaho/type/value' by default", function() {

        return require.using(["require", "pentaho/type/Context"], configRequire, function(localRequire, Context) {

          return Context.createAsync().then(function(context) {

            var valueType = context.get("pentaho/type/value").type;

            return context
                .getAllAsync()
                .then(function(InstCtors) {
                  expect(InstCtors instanceof Array).toBe(true);

                  var requiredCount = 0;

                  // While all registered but the exp/prop are pentaho/type/value,
                  // We don't know about the existence of the exp/thing...
                  // Then, there are all other standard types in the registry.
                  InstCtors.forEach(function(InstCtor) {
                    // Must be a value
                    expect(InstCtor.type.isSubtypeOf(valueType)).toBe(true);

                    switch(InstCtor.type.id) {
                      case "exp/foo":
                      case "exp/bar":
                      case "exp/thing":
                      case "exp/baseWithNoRegistrations":
                        fail("Should not have loaded exp/thing or exp/baseWithNoRegistrations");
                        break;
                      case "exp/dude":
                        requiredCount++;
                    }
                  });

                  expect(requiredCount).toBe(1);
                });
          });
        });
      });

      it("should return all known non-abstract subtypes of 'pentaho/type/value' by default, " +
         "when isAbstract is false", function() {

        return require.using(["require", "pentaho/type/Context"], configRequire, function(localRequire, Context) {

          return Context.createAsync().then(function(context) {

            var valueType = context.get("pentaho/type/value").type;

            return context
                .getAllAsync(null, {isAbstract: false})
                .then(function(InstCtors) {
                  expect(InstCtors instanceof Array).toBe(true);

                  // While all registered but the exp/prop are pentaho/type/value,
                  // We don't know about the existence of the exp/thing...
                  // Then, there are all other standard types in the registry.
                  InstCtors.forEach(function(InstCtor) {
                    // Must be a value
                    expect(InstCtor.type.isSubtypeOf(valueType)).toBe(true);
                    expect(InstCtor.type.isAbstract).toBe(false);
                  });
                });
          });
        });
      });

      it("should return an array with the base type, when the specified baseType " +
         "has no additional registrations", function() {

        return require.using(["require", "pentaho/type/Context"], configRequire, function(localRequire, Context) {

          return Context.createAsync().then(function(context) {

            return context
                .getAllAsync("exp/baseWithNoRegistrations")
                .then(function(InstCtors) {
                  expect(InstCtors instanceof Array).toBe(true);
                  expect(InstCtors.length).toBe(1);
                  expect(InstCtors[0].type.id).toBe("exp/baseWithNoRegistrations");
                });
          });
        });
      });

      it("should return all registered Types under a given base type id and the base type itself", function() {

        return require.using(["require", "pentaho/type/Context"], configRequire, function(localRequire, Context) {

          return Context.createAsync().then(function(context) {

            return context
                .getAllAsync("exp/thing")
                .then(function(InstCtors) {
                  expect(InstCtors instanceof Array).toBe(true);
                  expect(InstCtors.length).toBe(3);

                  var typeIds = InstCtors.map(function(InstCtor) { return InstCtor.type.id; });

                  expect(typeIds.indexOf("exp/thing")).not.toBeLessThan(0);
                  expect(typeIds.indexOf("exp/foo")).not.toBeLessThan(0);
                  expect(typeIds.indexOf("exp/bar")).not.toBeLessThan(0);
                });
          });
        });
      });

      it("should return all registered Types that satisfy the isBrowsable filter", function() {

        return require.using(["require", "pentaho/type/Context"], configRequire, function(localRequire, Context) {

          return Context.createAsync().then(function(context) {

            return context
                .getAllAsync("exp/thing", {"isBrowsable": true})
                .then(function(InstCtors) {
                  expect(InstCtors instanceof Array).toBe(true);
                  expect(InstCtors.length).toBe(2);
                  var typeIds = InstCtors.map(function(InstCtor) { return InstCtor.type.id; });

                  // bar is not browsable
                  expect(typeIds.indexOf("exp/thing")).not.toBeLessThan(0);
                  expect(typeIds.indexOf("exp/foo")).not.toBeLessThan(0);
                });
          });
        });
      });
    }); // #getAllAsync

    describe("#getAll(baseTypeId, ka)", function() {

      it("should return all registered/loaded types derived from Value, by default", function() {

        return require.using(["pentaho/type/Context"], function(Context) {
          return Context.createAsync().then(function(context) {

            var valueType = context.get("pentaho/type/value").type;

            var InstCtors = context.getAll();

            // All value standard types. More than Value.
            expect(InstCtors.length).toBeGreaterThan(1);

            InstCtors.forEach(function(InstCtor) {
              expect(InstCtor.type.isSubtypeOf(valueType)).toBe(true);
            });
          });
        });
      });

      it("should return only subtypes of the specified baseType", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {

            var simpleType = context.get("pentaho/type/simple").type;

            var InstCtors = context.getAll("pentaho/type/simple");

            // All simple standard types. More than Simple.
            expect(InstCtors.length).toBeGreaterThan(1);

            InstCtors.forEach(function(InstCtor) {
              expect(InstCtor.type.isSubtypeOf(simpleType)).toBe(true);
            });
          });
        });
      });

      it("should include types registered using getAsync", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {

            var simpleType = context.get("pentaho/type/simple").type;

            var ExpBar = context.get(simpleType).extend({$type: {id: "exp/bar", isBrowsable: false}});

            // register
            context.getAsync(ExpBar).then(function() {

              var InstCtors = context.getAll(simpleType);

              expect(InstCtors.indexOf(ExpBar) >= 0).toBe(true);
            });
          });
        });
      });

      it("should include types with the specified keyArgs.isBrowsable value", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {

            var simpleType = context.get("pentaho/type/simple").type;

            var ExpBar = context.get(simpleType).extend({$type: {id: "exp/bar", isBrowsable: false}});

            // register
            context.getAsync(ExpBar).then(function() {

              var InstCtors = context.getAll(null, {isBrowsable: false});

              expect(InstCtors.indexOf(ExpBar) >= 0).toBe(true);
            });
          });
        });
      });

      it("should not include types without the specified keyArgs.isBrowsable value", function() {

        return require.using(["pentaho/type/Context"], function(Context) {

          return Context.createAsync().then(function(context) {

            var Simple = context.get("pentaho/type/simple");

            var ExpBar = Simple.extend({$type: {id: "exp/bar", isBrowsable: false}});

            // register
            context.getAsync(ExpBar).then(function() {

              var InstCtors = context.getAll(null, {isBrowsable: true});

              expect(InstCtors.indexOf(ExpBar) >= 0).toBe(false);
            });
          });
        });
      });

      function configRequire(localRequire) {

        localRequire.define("exp/thing", [], function() {
          return [
            "pentaho/type/simple",
            function(Simple) {
              return Simple.extend({$type: {id: "exp/thing"}});
            }
          ];
        });

        localRequire.define("exp/foo", [], function() {
          return [
            "exp/thing",
            function(Thing) {
              return Thing.extend({$type: {id: "exp/foo"}});
            }
          ];
        });

        localRequire.define("exp/bar", [], function() {
          return [
            "exp/thing",
            function(Thing) {
              return Thing.extend({$type: {id: "exp/bar"}});
            }
          ];
        });

        localRequire.config({
          config: {
            "pentaho/service": {
              "exp/thing": "exp/thing",
              "exp/foo":   "exp/thing",
              "exp/bar":   "exp/thing"
            }
          }
        });
      }

      it("should throw when the given base id exists but hasn't been loaded yet", function() {

        return require.using(["pentaho/type/Context"], configRequire, function(Context) {

          return Context.createAsync().then(function(context) {

            // expect to throw
            expect(function() {
              context.getAll("exp/thing");
            }).toThrow();
          });
        });
      });

      it("should throw when the given base id is loaded but some of the registered service ids are not", function() {

        return require.using(["pentaho/type/Context"], configRequire, function(Context) {

          return Context.createAsync().then(function(context) {

            return context.getAsync("exp/thing")
                .then(function() {
                  expect(function() {
                    context.getAll("exp/thing");
                  }).toThrow();
                });
          });
        });
      });

      it("should work if given base id and all its service registered ids are loaded", function() {

        return require.using(["pentaho/type/Context", "require"], configRequire, function(Context, localRequire) {

          return Context.createAsync().then(function(context) {
            return context.resolveAsync(["exp/thing", "exp/foo", "exp/bar"])
                .then(function() {

                  var InstCtors = context.getAll("exp/thing");
                  expect(InstCtors.length).toBe(3);

                  var typeIds = InstCtors.map(function(InstCtor) { return InstCtor.type.id; });

                  expect(typeIds.indexOf("exp/thing")).not.toBeLessThan(0);
                  expect(typeIds.indexOf("exp/foo")).not.toBeLessThan(0);
                  expect(typeIds.indexOf("exp/bar")).not.toBeLessThan(0);
                });
          });
        });
      });
    }); // #getAll

    describe("instance", function() {

      it("should return a context instance", function() {

        return require.using(["pentaho/type/Context"], function(Context) {
          var context = Context.instance;
          expect(context instanceof Context).toBe(true);
        });
      });

      it("should create a context that has as environment the value of pentaho.environment.main", function() {

        return require.using(["pentaho/type/Context", "pentaho/environment"], function(Context, envDefault) {
          var context = Context.instance;
          expect(context.environment).toBe(envDefault);
        });
      });

      it("should always return the same context instance", function() {

        return require.using(["pentaho/type/Context"], function(Context) {
          var context1 = Context.instance;

          expect(Context.instance).toBe(context1);
          expect(Context.instance).toBe(context1);
          expect(Context.instance).toBe(context1);
        });
      });
    });
  }); // pentaho.type.Context
});
