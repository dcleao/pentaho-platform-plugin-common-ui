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
  "pentaho/data/meta/_layer0/PropertyClass",
  "pentaho/data/meta/complex",
  "pentaho/data/meta/string",
  "pentaho/data/meta/boolean",
  "pentaho/data/meta/number",
  "pentaho/util/error"
], function(PropertyClass, Complex, StringMeta, BooleanMeta, NumberMeta, error) {
  "use strict";

  /*global describe:true, it:true, expect:true, beforeEach:true*/

  describe("pentaho/data/meta/PropertyClass -", function() {
    it("is a function", function() {
      expect(typeof PropertyClass).toBe("function");
    });

    describe("#new(spec, declaringType) =>", function() {

      var Derived;

      beforeEach(function() {
        Derived = Complex.extend({
          name:  "derived",
          label: "Derived"
        });
      });

      describe("when spec is a string -", function() {
        var propClass;

        beforeEach(function() {
          propClass = PropertyClass.to("foo", Derived);
        });

        it("should build a property class instance", function() {
          expect(propClass instanceof PropertyClass).toBe(true);
        });

        it("should have `declaringType` equal to containing Complex class", function() {
          expect(propClass.declaringType).toBe(Derived);
        });

        it("should have `root` equal to itself", function() {
          expect(propClass.root).toBe(propClass);
        });

        it("should have `ancestor` equal to `null`", function() {
          expect(propClass.ancestor).toBe(null);
        });

        it("should have `name` equal to the spec string", function() {
          expect(propClass.name).toBe("foo");
        });

        it("should have `label` be undefined", function() {
          // only resolved after type is instantiated and, possibly, configured.
          expect(propClass.label).toBeUndefined();
        });

        it("should have `type` string", function() {
          expect(propClass.type).toBe(StringMeta);
        });

        it("should have `list=false`", function() {
          expect(propClass.list).toBe(false);
        });
      }); // when spec is a string

      describe("when spec is an object -", function() {

        describe("basic characteristics -", function() {
          var propClass;

          beforeEach(function() {
            propClass = PropertyClass.to({name: "foo"}, Derived);
          });

          it("should build a property class instance", function() {
            expect(propClass instanceof PropertyClass).toBe(true);
          });

          it("should have `declaringType` equal to containing Complex class", function() {
            expect(propClass.declaringType).toBe(Derived);
          });

          it("should have `root` equal to itself", function() {
            expect(propClass.root).toBe(propClass);
          });

          it("should have `ancestor` equal to `null`", function() {
            expect(propClass.ancestor).toBe(null);
          });
        });

        describe("`spec.list` - ", function() {
          it("should default to `false`", function() {
            var propClass = PropertyClass.to({name: "foo"}, Derived);
            expect(propClass.list).toBe(false);
          });

          it("should respect the specified value", function() {
            var propClass = PropertyClass.to({name: "foo", list: true}, Derived);
            expect(propClass.list).toBe(true);

            propClass = PropertyClass.to({name: "foo", list: false}, Derived);
            expect(propClass.list).toBe(false);

            propClass = PropertyClass.to({name: "foo", list: 0}, Derived);
            expect(propClass.list).toBe(false);

            propClass = PropertyClass.to({name: "foo", list: 1}, Derived);
            expect(propClass.list).toBe(true);
          });
        }); // spec.list

        describe("`spec.type` - ", function() {

          // NOTE: tests of Type.resolve test type resolution more thoroughly.

          it("should default to String", function() {
            var propClass = PropertyClass.to({name: "foo"}, Derived);
            expect(propClass.type).toBe(StringMeta);
          });

          it("should resolve the specified value", function() {
            var propClass = PropertyClass.to({name: "foo", type: "string"}, Derived);
            expect(propClass.type).toBe(StringMeta);

            propClass = PropertyClass.to({name: "foo", type: "boolean"}, Derived);
            expect(propClass.type).toBe(BooleanMeta);
          });

          it("should throw if the specified value is an unloaded module", function() {
            expect(function() {
              PropertyClass.to({name: "foo", type: "bar/oof"}, Derived);
            }).toThrowError(/bar\/oof/);
          });
        }); // spec.type

        describe("`spec.name` - ", function() {
          describe("when falsy", function() {
            describe("when `list` is `false`", function() {
              it("should default to the `name` of `type#`", function() {
                function expectIt(name) {
                  var propClass = PropertyClass.to({
                        name: name,
                        list: false,
                        type: "string"
                      }, Derived);

                  expect(propClass.name).toBe(StringMeta.prototype.name);
                }

                expectIt(undefined);
                expectIt(null);
                expectIt("");
              });
            });

            describe("when `list` is `true`", function() {
              it("should default to the `namePlural` of `type#`", function() {
                function expectIt(name) {
                  var propClass = PropertyClass.to({
                        name: name,
                        list: true,
                        type: "string"
                      }, Derived);

                  expect(propClass.name).toBe(StringMeta.prototype.namePlural);
                }

                expectIt(undefined);
                expectIt(null);
                expectIt("");
              });
            });
          }); // when falsy

          describe("when truthy -", function() {
            it("should respect it", function() {
              var propClass = PropertyClass.to({
                    name: "fooBar",
                    list: true,
                    type: "string"
                  }, Derived);

              expect(propClass.name).toBe("fooBar");
            });
          });
        }); // spec.name

        describe("`spec.label` - ", function() {
          it("should default to `undefined`", function() {
            var propClass = PropertyClass.to({name: "foo"}, Derived);
            expect(propClass.label).toBe(undefined);
          });

          it("should convert empty to null", function() {
            var propClass = PropertyClass.to({name: "foo", label: ""}, Derived);
            expect(propClass.label).toBe(null);
          });

          it("should respect null", function() {
            var propClass = PropertyClass.to({name: "foo", label: null}, Derived);
            expect(propClass.label).toBe(null);
          });

          it("should respect the specified value", function() {
            var propClass = PropertyClass.to({name: "foo", label: "MyFoo"}, Derived);
            expect(propClass.label).toBe("MyFoo");
          });
        }); // spec.label

        describe("`spec.description` - ", function() {
          it("should default to `undefined`", function() {
            var propClass = PropertyClass.to({name: "foo"}, Derived);
            expect(propClass.description).toBe(undefined);

            propClass = PropertyClass.to({name: "foo", description: undefined}, Derived);
            expect(propClass.description).toBe(undefined);
          });

          it("should convert empty to null", function() {
            var propClass = PropertyClass.to({name: "foo", description: ""}, Derived);
            expect(propClass.description).toBe(null);
          });

          it("should respect null", function() {
            var propClass = PropertyClass.to({name: "foo", description: null}, Derived);
            expect(propClass.description).toBe(null);
          });

          it("should respect the specified value", function() {
            var propClass = PropertyClass.to({name: "foo", description: "MyFoo"}, Derived);
            expect(propClass.description).toBe("MyFoo");
          });
        }); // spec.description

        describe("`spec.category` - ", function() {
          it("should default to `undefined`", function() {
            var propClass = PropertyClass.to({name: "foo"}, Derived);
            expect(propClass.category).toBe(undefined);

            propClass = PropertyClass.to({name: "foo", category: undefined}, Derived);
            expect(propClass.category).toBe(undefined);
          });

          it("should convert empty to null", function() {
            var propClass = PropertyClass.to({name: "foo", category: ""}, Derived);
            expect(propClass.category).toBe(null);
          });

          it("should respect null", function() {
            var propClass = PropertyClass.to({name: "foo", category: null}, Derived);
            expect(propClass.category).toBe(null);
          });

          it("should respect the specified value", function() {
            var propClass = PropertyClass.to({name: "foo", category: "MyFoo"}, Derived);
            expect(propClass.category).toBe("MyFoo");
          });
        }); // spec.category

        describe("`spec.helpUrl` - ", function() {
          it("should default to `undefined`", function() {
            var propClass = PropertyClass.to({name: "foo"}, Derived);
            expect(propClass.helpUrl).toBe(undefined);

            propClass = PropertyClass.to({name: "foo", helpUrl: undefined}, Derived);
            expect(propClass.helpUrl).toBe(undefined);
          });

          it("should convert empty to null", function() {
            var propClass = PropertyClass.to({name: "foo", helpUrl: ""}, Derived);
            expect(propClass.helpUrl).toBe(null);
          });

          it("should respect null", function() {
            var propClass = PropertyClass.to({name: "foo", helpUrl: null}, Derived);
            expect(propClass.helpUrl).toBe(null);
          });

          it("should respect the specified value", function() {
            var propClass = PropertyClass.to({name: "foo", helpUrl: "MyFoo"}, Derived);
            expect(propClass.helpUrl).toBe("MyFoo");
          });
        }); // spec.helpUrl

        describe("`spec.browsable` - ", function() {
          it("should default to `true`", function() {
            var propClass = PropertyClass.to({name: "foo"}, Derived);
            expect(propClass.browsable).toBe(true);

            propClass = PropertyClass.to({name: "foo", browsable: undefined}, Derived);
            expect(propClass.browsable).toBe(true);
          });

          it("should cast other values to boolean", function() {
            var propClass = PropertyClass.to({name: "foo", browsable: 1}, Derived);
            expect(propClass.browsable).toBe(true);

            propClass = PropertyClass.to({name: "foo", browsable: 0}, Derived);
            expect(propClass.browsable).toBe(false);

            propClass = PropertyClass.to({name: "foo", browsable: ""}, Derived);
            expect(propClass.browsable).toBe(false);

            propClass = PropertyClass.to({name: "foo", browsable: null}, Derived);
            expect(propClass.browsable).toBe(false);

            propClass = PropertyClass.to({name: "foo", browsable: true}, Derived);
            expect(propClass.browsable).toBe(true);

            propClass = PropertyClass.to({name: "foo", browsable: "yes"}, Derived);
            expect(propClass.browsable).toBe(true);

            propClass = PropertyClass.to({name: "foo", browsable: "no"}, Derived);
            expect(propClass.browsable).toBe(true);
          });
        }); // spec.list

        // TODO: attributes defaultValue, format, metadata

      }); // when spec is an object
    }); // new(spec, declaringType)

    describe("#extend(spec, declaringType) - extending a base property -", function() {
      var BaseType,
          Derived;

      beforeEach(function() {
        BaseType = Complex.extend({
          name:  "base",
          label: "Base",
          props: [
            {
              name: "baseStr",
              label: "BaseSTR",
              type: "string",
              description: "Base Str",
              helpUrl: "Base Str Help",
              category: "Cat Str",
              browsable: false
            },
            {name: "baseNum", type: "number"},
            {name: "baseNumLst", type: "number", list: true}
          ]
        });

        Derived = BaseType.extend({
          name:  "derived",
          label: "Derived"
        });
      });

      // Override PropertyClass tests
      describe("when spec is {name: '.'} and the name is equal to that of the base property -", function() {
        describe("the created property class -", function() {
          var propClass, basePropClass;

          beforeEach(function() {
            basePropClass = BaseType.properties.get("baseStr");
            propClass = basePropClass.extend({name: "baseStr"}, Derived);
          });

          // basic fields

          it("should build a property class instance", function() {
            expect(propClass instanceof PropertyClass).toBe(true);
          });

          it("should have the overridden property as `ancestor`", function() {
            expect(propClass).not.toBe(basePropClass);
            expect(propClass.ancestor).toBe(basePropClass);
          });

          it("should have `declaringType` equal to the derived class", function() {
            expect(propClass.declaringType).toBe(Derived);
          });

          it("should have `root` equal to the base property", function() {
            expect(propClass.root).toBe(basePropClass);
          });

          // should inherit all attributes

          it("should have the base `name`", function() {
            expect(propClass.name).toBe(basePropClass.name);
          });

          it("should have the base `list`", function() {
            expect(propClass.list).toBe(basePropClass.list);
          });

          it("should have the base `label`", function() {
            expect(propClass.label).toBe(basePropClass.label);
          });

          it("should have the base `description`", function() {
            expect(propClass.description).toBe(basePropClass.description);
          });

          it("should have the base `helpUrl`", function() {
            expect(propClass.helpUrl).toBe(basePropClass.helpUrl);
          });

          it("should have the base `category`", function() {
            expect(propClass.category).toBe(basePropClass.category);
          });

          it("should have the base `browsable`", function() {
            expect(propClass.browsable).toBe(basePropClass.browsable);
          });
        });

        describe("when `spec.type` is a sub-type of the base property's type", function() {
          var basePropClass;

          var PostalCodeMeta = StringMeta.extend({
            name: "postalCode"
          });

          beforeEach(function() {
            basePropClass = BaseType.properties.get("baseStr");
          });

          it("should accept it", function() {
            var propClass = basePropClass.extend({name: "baseStr", type: PostalCodeMeta}, Derived);

            expect(propClass instanceof PropertyClass).toBe(true);
            expect(propClass.ancestor).toBe(basePropClass);
            expect(propClass.type).toBe(PostalCodeMeta);
          });
        });

        describe("when `spec.type` is a not a sub-type of the base property's type", function() {
          var basePropClass;

          var IntegerMeta = NumberMeta.extend({
            name: "integer"
          });

          beforeEach(function() {
            basePropClass = BaseType.properties.get("baseStr");
          });

          it("should throw", function() {
            expect(function() {
              basePropClass.extend({name: "baseStr", type: IntegerMeta}, Derived);
            }).toThrowError(error.argInvalid("spec.type", "Sub-property's 'type' does not derive from the base property's 'type'.").message);
          });
        });

        describe("when `spec.list` is not that of the base property's type", function() {
          it("should throw when base is list and derived isn't", function() {
            var basePropClass = BaseType.properties.get("baseNumLst");
            expect(function() {
              basePropClass.extend({name: "baseNumLst", list: false}, Derived);
            }).toThrowError(error.argInvalid("spec.list", "Sub-property has a different 'list' value.").message);
          });

          it("should throw when base is not list and derived is", function() {
            var basePropClass = BaseType.properties.get("baseNum");
            expect(function() {
              basePropClass.extend({name: "baseNum", list: true}, Derived);
            }).toThrowError(error.argInvalid("spec.list", "Sub-property has a different 'list' value.").message);
          });
        });

        it("should respect other overridden attributes", function() {
          var basePropClass = BaseType.properties.get("baseNum");
          var propClass = basePropClass.extend({
                name: "baseNum",
                label: "A",
                description: "B",
                helpUrl: "C",
                category: "D",
                browsable: true
              }, Derived);

          expect(propClass.label).toBe("A");
          expect(propClass.description).toBe("B");
          expect(propClass.helpUrl).toBe("C");
          expect(propClass.category).toBe("D");
          expect(propClass.browsable).toBe(true);
        });
      }); // when spec is {name: '.'} and the name is equal ...

      describe("when spec is {name: .} and the name is not that of the name of the base property -", function() {
        it("should throw", function() {
          var basePropClass = BaseType.properties.get("baseStr");
          expect(function() {
            basePropClass.extend({name: "baseStr2"}, Derived);
          }).toThrowError(error.argInvalid("spec.name", "Sub-property has a different 'name' value.").message);
        });
      });
    }); // #extend(spec, declaringType)...

    // TODO: see above

  }); // pentaho/data/meta/complex
});