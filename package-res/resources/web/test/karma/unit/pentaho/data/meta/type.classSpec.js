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
  "pentaho/data/meta/type",
  "pentaho/util/error"
], function(Type, error) {
  "use strict";

  /*global describe:true, it:true, expect:true, beforeEach:true*/

  describe("pentaho/data/meta/type -", function() {
    it("is a function", function() {
      expect(typeof Type).toBe("function");
    });

    it("should have an `uid`", function() {
      expect(Type.prototype.uid != null).toBe(true);
      expect(typeof Type.prototype.uid).toBe("number");
    });

    describe(".extend({...}) -", function() {
      it("should return a function", function() {
        var Derived = Type.extend({
          name:  "derived",
          label: "Derived"
        });

        expect(typeof Derived).toBe("function");
      });

      it("should return a sub-class of Type", function() {
        var Derived = Type.extend({
          name:  "derived",
          label: "Derived"
        });

        expect(Derived).not.toBe(Type);
        expect(Derived.prototype instanceof Type).toBe(true);
      });

      describe("#name and #label -", function() {

        describe("when `name` is falsy -", function() {

          // when both aren't specified, both are inherited
          describe("when `label` is falsy -", function() {
            it("should inherit both `name` and `label`", function() {
              function expectIt(derivedSpec) {
                var Derived = Type.extend(derivedSpec);
                expect(Derived.prototype.name).toBe("value");
                expect(Derived.prototype.label).toBe(Type.prototype.label);
              }

              expectIt({});
              expectIt({label: undefined});
              expectIt({label: null});
              expectIt({label: ""});

              expectIt({name: undefined});
              expectIt({name: null});
              expectIt({name: ""});

              expectIt({name: undefined, label: undefined});
              expectIt({name: undefined, label: null});
              expectIt({name: undefined, label: ""});

              expectIt({name: null, label: undefined});
              expectIt({name: null, label: null});
              expectIt({name: null, label: ""});

              expectIt({name: "", label: undefined});
              expectIt({name: "", label: null});
              expectIt({name: "", label: ""});
            });
          }); // when `label` is falsy

          describe("when `label` is truthy", function() {
            // Can change the label and inherit the name
            it("should respect the `label` and inherit the `name`", function() {
              function expectIt(derivedSpec) {
                var label = derivedSpec.label;
                var Derived = Type.extend(derivedSpec);
                expect(Derived.prototype.name).toBe("value");
                expect(Derived.prototype.label).toBe(label);
              }

              expectIt({label: "Foo"});
              expectIt({name: undefined, label: "Foo"});
              expectIt({name: null, label: "Foo"});
              expectIt({name: "", label: "Foo"});
            });
          }); // when `label` is truthy
        }); // when `name` is falsy

        // ----

        describe("when `name` is truthy -", function() {

          // Label is defaulted from the locally set name
          describe("when `label` is falsy -", function() {
            it("should generate the `label` from the name", function() {
              function expectIt(derivedSpec, label) {
                var name = derivedSpec.name;
                var Derived = Type.extend(derivedSpec);
                expect(Derived.prototype.name).toBe(name);
                expect(Derived.prototype.label).toBe(label);
              }

              expectIt({name: "fooBar"}, "Foo Bar");
              expectIt({name: "fooBar", label: undefined}, "Foo Bar");
              expectIt({name: "fooBar", label: null}, "Foo Bar");
              expectIt({name: "fooBar", label: ""}, "Foo Bar");
            });
          });

          // Respects both when both are specified non-empty.
          describe("when `label` is truthy -", function() {
            it("should respect `name`", function() {
              var Derived = Type.extend({
                name:  "derived",
                label: "Derived"
              });
              expect(Derived.prototype.name).toBe("derived");
            });

            it("should respect `label`", function() {
              var Derived = Type.extend({
                name:  "derived",
                label: "Derived"
              });
              expect(Derived.prototype.label).toBe("Derived");
            });
          });
        }); // when `name` is truthy
      }); // #name and #label

      // =====

      describe("#name and #namePlural -", function() {

        describe("when `name` is falsy -", function() {
          describe("when `namePlural` is falsy -", function() {
            it("should inherit both `name` and `namePlural`", function() {
              function expectIt(derivedSpec) {
                var Derived = Type.extend(derivedSpec);
                expect(Derived.prototype.name).toBe("value");
                expect(Derived.prototype.namePlural).toBe(Type.prototype.namePlural);
              }

              expectIt({});
              expectIt({namePlural: undefined});
              expectIt({namePlural: null});
              expectIt({namePlural: ""});

              expectIt({name: undefined});
              expectIt({name: null});
              expectIt({name: ""});

              expectIt({name: undefined, namePlural: undefined});
              expectIt({name: undefined, namePlural: null});
              expectIt({name: undefined, namePlural: ""});

              expectIt({name: null, namePlural: undefined});
              expectIt({name: null, namePlural: null});
              expectIt({name: null, namePlural: ""});

              expectIt({name: "", namePlural: undefined});
              expectIt({name: "", namePlural: null});
              expectIt({name: "", namePlural: ""});
            });
          });

          describe("when `namePlural` is truthy -", function() {
            it("it is ignored and inherited", function() {
              function expectIt(derivedSpec) {
                var Derived = Type.extend(derivedSpec);
                expect(Derived.prototype.name).toBe("value");
                expect(Derived.prototype.namePlural).toBe(Type.prototype.namePlural);
              }
              expectIt({namePlural: "foos"});
              expectIt({name: undefined, namePlural: "foos"});
              expectIt({name: null, namePlural: "foos"});
              expectIt({name: "", namePlural: "foos"});
            });
          });
        }); // when `name` is falsy

        // ----

        describe("when `name` is truthy -", function() {
          describe("when `namePlural` is falsy -", function() {
            it("it is generated from name", function() {
              function expectIt(derivedSpec) {
                var name = derivedSpec.name;
                var Derived = Type.extend(derivedSpec);
                expect(Derived.prototype.name).toBe(name);
                expect(Derived.prototype.namePlural).toBe(name + "s");
              }

              expectIt({name: "foo"});
              expectIt({name: "foo", namePlural: undefined});
              expectIt({name: "foo", namePlural: null});
              expectIt({name: "foo", namePlural: ""});
            });
          });

          describe("when `namePlural` is truthy -", function() {
            it("it is repected", function() {
              var Derived = Type.extend({
                name: "derived",
                namePlural: "myDeriveds",
              });
              expect(Derived.prototype.namePlural).toBe("myDeriveds");
            });
          });
        }); // when `name` is truthy
      }); // #name and #namePlural

      // =====

      describe("#label and #labelPlural -", function() {
        // labelPlural is ignored when label is not specified
        describe("when `label` is falsy -", function() {
          describe("when `labelPlural` falsy -", function() {
            it("should inherit both `label` and `labelPlural`", function() {
              function expectIt(derivedSpec) {
                var Derived = Type.extend(derivedSpec);
                expect(Derived.prototype.label).toBe(Type.prototype.label);
                expect(Derived.prototype.labelPlural).toBe(Type.prototype.labelPlural);
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
              expectIt({label: undefined, namePlural: ""});

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
                var Derived = Type.extend(derivedSpec);
                expect(Derived.prototype.label).toBe(Type.prototype.label);
                expect(Derived.prototype.labelPlural).toBe(Type.prototype.labelPlural);
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
                var Derived = Type.extend(derivedSpec);
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
              var Derived = Type.extend({
                label: "Derived",
                labelPlural: "MyDeriveds"
              });

              expect(Derived.prototype.labelPlural).toBe("MyDeriveds");
            });
          });
        }); // when `label` is falsy
      }); // #label and #labelPlural

      // =====

      describe("#name, #namePlural, #label and #labelPlural -", function() {
        describe("when only `name` is truthy -", function() {
          var Derived = Type.extend({
            name: "derivedProp"
          });

          it("generates `namePlural` from `name`", function() {
            expect(Derived.prototype.namePlural).toBe("derivedProps");
          });

          it("generates `label` from `name`", function() {
            expect(Derived.prototype.label).toBe("Derived Prop");
          });

          it("generates `labelPlural` from `namePlural`", function() {
            expect(Derived.prototype.labelPlural).toBe("Derived Props");
          });
        });
      });

      // =====

      describe("#id -", function() {
        describe("when `id` is falsy -", function() {
          it("should have `null` as a default `id`", function() {
            function expectIt(spec) {
              var Derived = Type.extend(spec);
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
            var Derived = Type.extend({
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
              var Derived = Type.extend(spec);

              expect(Derived.prototype.description).toBe(Type.prototype.description);
            }

            expectIt({});
            expectIt({description: undefined});
          });
        });

        describe("when specified as `null` or an empty string -", function() {
          it("should set the description to `null`", function() {
            function expectIt(spec) {
              var Derived = Type.extend(spec);

              expect(Derived.prototype.description).toBe(null);
            }

            expect({description: null});
            expect({description: ""});
          });
        });

        describe("when specified as a non-empty string -", function() {
          it("should respect it", function() {
            var Derived = Type.extend({description: "Foo"});

            expect(Derived.prototype.description).toBe("Foo");
          });
        });
      }); // #description

      // ====

      describe("#category -", function() {
        describe("when not specified -", function() {
          it("should inherit the base category", function() {
            function expectIt(spec) {
              var Derived = Type.extend(spec);

              expect(Derived.prototype.category).toBe(Type.prototype.category);
            }

            expectIt({});
            expectIt({category: undefined});
          });
        });

        describe("when specified as `null` or an empty string -", function() {
          it("should set the category to `null`", function() {
            function expectIt(spec) {
              var Derived = Type.extend(spec);

              expect(Derived.prototype.category).toBe(null);
            }

            expect({category: null});
            expect({category: ""});
          });
        });

        describe("when specified as a non-empty string", function() {
          it("should respect it", function() {
            var Derived = Type.extend({category: "Foo"});

            expect(Derived.prototype.category).toBe("Foo");
          });
        });
      }); // #category

      // ====

      describe("#helpUrl -", function() {
        describe("when not specified", function() {
          it("should inherit the base helpUrl", function() {
            function expectIt(spec) {
              var Derived = Type.extend(spec);

              expect(Derived.prototype.helpUrl).toBe(Type.prototype.helpUrl);
            }

            expectIt({});
            expectIt({helpUrl: undefined});
          });
        });

        describe("when specified as `null` or an empty string -", function() {
          it("should set the helpUrl to `null`", function() {
            function expectIt(spec) {
              var Derived = Type.extend(spec);

              expect(Derived.prototype.helpUrl).toBe(null);
            }

            expect({helpUrl: null});
            expect({helpUrl: ""});
          });
        });

        describe("when specified as a non-empty string -", function() {
          it("should respect it", function() {
            var Derived = Type.extend({helpUrl: "Foo"});

            expect(Derived.prototype.helpUrl).toBe("Foo");
          });
        });
      }); // #helpUrl

      // ====

      describe("#uid -", function() {
        it("should not be inherited", function() {
          var Derived = Type.extend();
          expect(Derived.prototype.uid).not.toBe(Type.uid);
        });

        it("should be unique", function() {
          var DerivedA = Type.extend(),
              DerivedB = Type.extend();
          expect(DerivedA.prototype.uid).not.toBe(DerivedB.prototype.uid);
          expect(DerivedA.prototype.uid).not.toBe(Type.prototype.uid);
        });
      }); // #uid

      // TODO: remaining poperties: defaultValue, format, domain, annotations...
      // TODO: methods resolve, resolveAsync

    }); // .extend({...})
  });

});