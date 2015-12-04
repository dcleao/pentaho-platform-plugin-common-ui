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
  "pentaho/type/value",
  "pentaho/util/error"
], function(Value, error) {
  "use strict";

  /*global describe:true, it:true, expect:true, beforeEach:true*/

  describe("pentaho/type/value -", function() {
    it("is a function", function() {
      expect(typeof Value).toBe("function");
    });

    it("should have an `uid`", function() {
      expect(Value.prototype.uid != null).toBe(true);
      expect(typeof Value.prototype.uid).toBe("number");
    });

    describe(".extend({...}) -", function() {
      it("should return a function", function() {
        var Derived = Value.extend({
          label: "Derived"
        });

        expect(typeof Derived).toBe("function");
      });

      it("should return a sub-class of Value", function() {
        var Derived = Value.extend({
          label: "Derived"
        });

        expect(Derived).not.toBe(Value);
        expect(Derived.prototype instanceof Value).toBe(true);
      });

      describe("#label -", function() {

        describe("when `label` is falsy -", function() {
          it("should inherit `label`", function() {
            function expectIt(derivedSpec) {
              var Derived = Value.extend(derivedSpec);
              expect(Derived.prototype.label).toBe(Value.prototype.label);
            }

            expectIt({});
            expectIt({label: undefined});
            expectIt({label: null});
            expectIt({label: ""});
          });
        }); // when `label` is falsy

        describe("when `label` is truthy", function() {
          // Can change the label
          it("should respect the `label`", function() {
            var Derived = Value.extend({label: "Foo"});
            expect(Derived.prototype.label).toBe("Foo");
          });
        });
      }); // #label

      // =====

      describe("#label and #labelPlural -", function() {
        // labelPlural is ignored when label is not specified
        describe("when `label` is falsy -", function() {
          describe("when `labelPlural` falsy -", function() {
            it("should inherit both `label` and `labelPlural`", function() {
              function expectIt(derivedSpec) {
                var Derived = Value.extend(derivedSpec);
                expect(Derived.prototype.label).toBe(Value.prototype.label);
                expect(Derived.prototype.labelPlural).toBe(Value.prototype.labelPlural);
              }

              expectIt({});
              expectIt({labelPlural: undefined});
              expectIt({labelPlural: null});
              expectIt({labelPlural: ""});

              expectIt({label: undefined});
              expectIt({label: null});
              expectIt({label: ""});

              expectIt({label: undefined, labelPlural: undefined});
              expectIt({label: undefined, labelPlural: null});
              expectIt({label: undefined, labelPlural: ""});

              expectIt({label: null, labelPlural: undefined});
              expectIt({label: null, labelPlural: null});
              expectIt({label: null, labelPlural: ""});

              expectIt({label: "", labelPlural: undefined});
              expectIt({label: "", labelPlural: null});
              expectIt({label: "", labelPlural: ""});
            });
          });

          describe("when `labelPlural` is truthy -", function() {
            it("it is ignored and inherited", function() {
              function expectIt(derivedSpec) {
                var Derived = Value.extend(derivedSpec);
                expect(Derived.prototype.label).toBe(Value.prototype.label);
                expect(Derived.prototype.labelPlural).toBe(Value.prototype.labelPlural);
              }
              expectIt({labelPlural: "Foos"});
              expectIt({label: undefined, labelPlural: "Foos"});
              expectIt({label: null, labelPlural: "Foos"});
              expectIt({label: "", labelPlural: "Foos"});
            });
          });
        }); // when `label` is truthy

        describe("when `label` is truthy -", function() {
          describe("when `labelPlural` is falsy -", function() {

            it("it is generated from the local `label`", function() {
              function expectIt(derivedSpec) {
                var label = derivedSpec.label;
                var Derived = Value.extend(derivedSpec);
                expect(Derived.prototype.label).toBe(label);
                expect(Derived.prototype.labelPlural).toBe(label + "s");
              }

              expectIt({label: "Foo"});
              expectIt({label: "Foo", labelPlural: undefined});
              expectIt({label: "Foo", labelPlural: null});
              expectIt({label: "Foo", labelPlural: ""});
            });
          });

          describe("when `labelPlural` is truthy -", function() {
            it("it is respected", function() {
              var Derived = Value.extend({
                label: "Derived",
                labelPlural: "MyDeriveds"
              });

              expect(Derived.prototype.labelPlural).toBe("MyDeriveds");
            });
          });
        }); // when `label` is falsy
      }); // #label and #labelPlural

      // =====

      describe("#id -", function() {
        describe("when `id` is falsy -", function() {
          it("should have `null` as a default `id`", function() {
            function expectIt(spec) {
              var Derived = Value.extend(spec);
              expect(Derived.prototype.id).toBe(null);
            }

            expectIt({});
            expectIt({id: undefined});
            expectIt({id: null});
            expectIt({id: null});
          });
        });

        describe("when `id` is truthy -", function() {
          it("should respect it", function() {
            var Derived = Value.extend({
              id: "foo/bar"
            });

            expect(Derived.prototype.id).toBe("foo/bar");
          });
        });
      }); // #id

      // =====

      describe("#description -", function() {
        describe("when not specified -", function() {
          it("should inherit the base description", function() {
            function expectIt(spec) {
              var Derived = Value.extend(spec);

              expect(Derived.prototype.description).toBe(Value.prototype.description);
            }

            expectIt({});
            expectIt({description: undefined});
          });
        });

        describe("when specified as `null` or an empty string -", function() {
          it("should set the description to `null`", function() {
            function expectIt(spec) {
              var Derived = Value.extend(spec);

              expect(Derived.prototype.description).toBe(null);
            }

            expect({description: null});
            expect({description: ""});
          });
        });

        describe("when specified as a non-empty string -", function() {
          it("should respect it", function() {
            var Derived = Value.extend({description: "Foo"});

            expect(Derived.prototype.description).toBe("Foo");
          });
        });
      }); // #description

      // ====

      describe("#category -", function() {
        describe("when not specified -", function() {
          it("should inherit the base category", function() {
            function expectIt(spec) {
              var Derived = Value.extend(spec);

              expect(Derived.prototype.category).toBe(Value.prototype.category);
            }

            expectIt({});
            expectIt({category: undefined});
          });
        });

        describe("when specified as `null` or an empty string -", function() {
          it("should set the category to `null`", function() {
            function expectIt(spec) {
              var Derived = Value.extend(spec);

              expect(Derived.prototype.category).toBe(null);
            }

            expect({category: null});
            expect({category: ""});
          });
        });

        describe("when specified as a non-empty string", function() {
          it("should respect it", function() {
            var Derived = Value.extend({category: "Foo"});

            expect(Derived.prototype.category).toBe("Foo");
          });
        });
      }); // #category

      // ====

      describe("#helpUrl -", function() {
        describe("when not specified", function() {
          it("should inherit the base helpUrl", function() {
            function expectIt(spec) {
              var Derived = Value.extend(spec);

              expect(Derived.prototype.helpUrl).toBe(Value.prototype.helpUrl);
            }

            expectIt({});
            expectIt({helpUrl: undefined});
          });
        });

        describe("when specified as `null` or an empty string -", function() {
          it("should set the helpUrl to `null`", function() {
            function expectIt(spec) {
              var Derived = Value.extend(spec);

              expect(Derived.prototype.helpUrl).toBe(null);
            }

            expect({helpUrl: null});
            expect({helpUrl: ""});
          });
        });

        describe("when specified as a non-empty string -", function() {
          it("should respect it", function() {
            var Derived = Value.extend({helpUrl: "Foo"});

            expect(Derived.prototype.helpUrl).toBe("Foo");
          });
        });
      }); // #helpUrl

      // ====

      describe("#uid -", function() {
        it("should not be inherited", function() {
          var Derived = Value.extend();
          expect(Derived.prototype.uid).not.toBe(Value.uid);
        });

        it("should be unique", function() {
          var DerivedA = Value.extend(),
              DerivedB = Value.extend();
          expect(DerivedA.prototype.uid).not.toBe(DerivedB.prototype.uid);
          expect(DerivedA.prototype.uid).not.toBe(Value.prototype.uid);
        });
      }); // #uid

      // TODO: remaining poperties: defaultValue, format, domain, annotations...
      // TODO: methods resolve, resolveAsync

    }); // .extend({...})
  });

});