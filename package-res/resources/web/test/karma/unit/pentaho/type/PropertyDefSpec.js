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
  "pentaho/type/Context",
  "pentaho/type/_layer0/PropertyDef",
  "pentaho/type/complex",
  "pentaho/type/string",
  "pentaho/type/boolean",
  "pentaho/type/number",
  "pentaho/util/error"
], function(Context, PropertyDef, complexFactory, stringFactory, booleanFactory, numberFactory, error) {

  "use strict";

  /*global describe:true, it:true, expect:true, beforeEach:true*/

  var context     = new Context(),
      BooleanType = context.get(booleanFactory),
      ComplexType = context.get(complexFactory),
      StringType  = context.get(stringFactory),
      NumberType  = context.get(numberFactory);

  describe("pentaho/type/PropertyDef -", function() {
    it("is a function", function() {
      expect(typeof PropertyDef).toBe("function");
    });

    describe("#new(spec, declaringType, ordinal) =>", function() {

      var Derived;

      beforeEach(function() {
        Derived = ComplexType.extend({
          name:  "derived"
        });
      });

      describe("when spec is a string -", function() {
        var propDef;

        beforeEach(function() {
          propDef = PropertyDef.to("fooBarGuru", Derived, 0);
        });

        it("should build a property def instance", function() {
          expect(propDef instanceof PropertyDef).toBe(true);
        });

        it("should have `declaringType` equal to containing Complex type instance", function() {
          expect(propDef.declaringType).toBe(Derived.the);
        });

        it("should have `root` equal to itself", function() {
          expect(propDef.root).toBe(propDef);
        });

        it("should have `ancestor` equal to `null`", function() {
          expect(propDef.ancestor).toBe(null);
        });

        it("should have `name` equal to the spec string", function() {
          expect(propDef.name).toBe("fooBarGuru");
        });

        it("should have `label` be a capitalization of `name`", function() {
          // only resolved after type is instantiated and, possibly, configured.
          expect(propDef.label).toBe("Foo Bar Guru");
        });

        it("should have `type` string", function() {
          expect(propDef.type).toBe(StringType.the);
        });

        it("should have `list=false`", function() {
          expect(propDef.list).toBe(false);
        });

        it("should have `ordinal` equal to the specified value", function() {
          expect(propDef.ordinal).toBe(0);
        });
      }); // when spec is a string

      describe("when spec is an object -", function() {

        describe("basic characteristics -", function() {
          var propDef;

          beforeEach(function() {
            propDef = PropertyDef.to({name: "foo"}, Derived);
          });

          it("should build a property def instance", function() {
            expect(propDef instanceof PropertyDef).toBe(true);
          });

          it("should have `declaringType` equal to containing Complex type instance", function() {
            expect(propDef.declaringType).toBe(Derived.the);
          });

          it("should have `root` equal to itself", function() {
            expect(propDef.root).toBe(propDef);
          });

          it("should have `ancestor` equal to `null`", function() {
            expect(propDef.ancestor).toBe(null);
          });
        });

        describe("`spec.list` - ", function() {
          it("should default to `false`", function() {
            var propDef = PropertyDef.to({name: "foo"}, Derived);
            expect(propDef.list).toBe(false);
          });

          it("should respect the specified value", function() {
            var propDef = PropertyDef.to({name: "foo", list: true}, Derived);
            expect(propDef.list).toBe(true);

            propDef = PropertyDef.to({name: "foo", list: false}, Derived);
            expect(propDef.list).toBe(false);

            propDef = PropertyDef.to({name: "foo", list: 0}, Derived);
            expect(propDef.list).toBe(false);

            propDef = PropertyDef.to({name: "foo", list: 1}, Derived);
            expect(propDef.list).toBe(true);
          });
        }); // spec.list

        describe("`spec.type` - ", function() {

          // NOTE: tests of Type.resolve test type resolution more thoroughly.

          it("should default to String", function() {
            var propDef = PropertyDef.to({name: "foo"}, Derived);
            expect(propDef.type).toBe(StringType.the);
          });

          it("should resolve the specified value", function() {
            var propDef = PropertyDef.to({name: "foo", type: "string"}, Derived);
            expect(propDef.type).toBe(StringType.the);

            propDef = PropertyDef.to({name: "foo", type: "boolean"}, Derived);
            expect(propDef.type).toBe(BooleanType.the);
          });

          it("should throw if the specified value is an unloaded module", function() {
            expect(function() {
              PropertyDef.to({name: "foo", type: "bar/oof"}, Derived);
            }).toThrowError(/bar\/oof/);
          });
        }); // spec.type

        describe("`spec.name` - ", function() {
          describe("when falsy -", function() {
            it("should throw`", function() {
              function expectIt(name) {
                expect(function() {
                  PropertyDef.to({
                      name: name,
                      list: false,
                      type: "string"
                    }, Derived);
                }).toThrowError(error.argRequired("spec.name").message);
              }

              expectIt(undefined);
              expectIt(null);
              expectIt("");
            });
          }); // when falsy

          describe("when truthy -", function() {
            it("should respect it", function() {
              var propDef = PropertyDef.to({
                    name: "fooBar",
                    list: true,
                    type: "string"
                  }, Derived);

              expect(propDef.name).toBe("fooBar");
            });
          });
        }); // spec.name

        describe("`spec.label` - ", function() {
          it("should default to the pluralization of `name`", function() {
            var propDef = PropertyDef.to({name: "foo"}, Derived);
            expect(propDef.label).toBe("Foo");
          });

          it("should convert empty to default", function() {
            var propDef = PropertyDef.to({name: "foo", label: ""}, Derived);
            expect(propDef.label).toBe("Foo");
          });

          it("should convert null to default", function() {
            var propDef = PropertyDef.to({name: "foo", label: null}, Derived);
            expect(propDef.label).toBe("Foo");
          });

          it("should convert undefined to default", function() {
            var propDef = PropertyDef.to({name: "foo", label: undefined}, Derived);
            expect(propDef.label).toBe("Foo");
          });

          it("should respect the specified value", function() {
            var propDef = PropertyDef.to({name: "foo", label: "MyFoo"}, Derived);
            expect(propDef.label).toBe("MyFoo");
          });
        }); // spec.label

        describe("`spec.description` - ", function() {
          it("should default to null", function() {
            var propDef = PropertyDef.to({name: "foo"}, Derived);
            expect(propDef.description).toBe(null);

            propDef = PropertyDef.to({name: "foo", description: undefined}, Derived);
            expect(propDef.description).toBe(null);
          });

          it("should convert empty to null", function() {
            var propDef = PropertyDef.to({name: "foo", description: ""}, Derived);
            expect(propDef.description).toBe(null);
          });

          it("should respect null", function() {
            var propDef = PropertyDef.to({name: "foo", description: null}, Derived);
            expect(propDef.description).toBe(null);
          });

          it("should respect the specified value", function() {
            var propDef = PropertyDef.to({name: "foo", description: "MyFoo"}, Derived);
            expect(propDef.description).toBe("MyFoo");
          });
        }); // spec.description

        describe("`spec.category` - ", function() {
          it("should default to null", function() {
            var propDef = PropertyDef.to({name: "foo"}, Derived);
            expect(propDef.category).toBe(null);

            propDef = PropertyDef.to({name: "foo", category: undefined}, Derived);
            expect(propDef.category).toBe(null);
          });

          it("should convert empty to null", function() {
            var propDef = PropertyDef.to({name: "foo", category: ""}, Derived);
            expect(propDef.category).toBe(null);
          });

          it("should respect null", function() {
            var propDef = PropertyDef.to({name: "foo", category: null}, Derived);
            expect(propDef.category).toBe(null);
          });

          it("should respect the specified value", function() {
            var propDef = PropertyDef.to({name: "foo", category: "MyFoo"}, Derived);
            expect(propDef.category).toBe("MyFoo");
          });
        }); // spec.category

        describe("`spec.helpUrl` - ", function() {
          it("should default to null", function() {
            var propDef = PropertyDef.to({name: "foo"}, Derived);
            expect(propDef.helpUrl).toBe(null);

            propDef = PropertyDef.to({name: "foo", helpUrl: undefined}, Derived);
            expect(propDef.helpUrl).toBe(null);
          });

          it("should convert empty to null", function() {
            var propDef = PropertyDef.to({name: "foo", helpUrl: ""}, Derived);
            expect(propDef.helpUrl).toBe(null);
          });

          it("should respect null", function() {
            var propDef = PropertyDef.to({name: "foo", helpUrl: null}, Derived);
            expect(propDef.helpUrl).toBe(null);
          });

          it("should respect the specified value", function() {
            var propDef = PropertyDef.to({name: "foo", helpUrl: "MyFoo"}, Derived);
            expect(propDef.helpUrl).toBe("MyFoo");
          });
        }); // spec.helpUrl

        describe("`spec.browsable` - ", function() {
          it("should default to true", function() {
            var propDef = PropertyDef.to({name: "foo"}, Derived);
            expect(propDef.browsable).toBe(true);
          });

          it("should convert undefined to default", function() {
            var propDef = PropertyDef.to({name: "foo", browsable: undefined}, Derived);
            expect(propDef.browsable).toBe(true);
          });

          it("should convert null to default", function() {
            var propDef = PropertyDef.to({name: "foo", browsable: null}, Derived);
            expect(propDef.browsable).toBe(true);
          });

          it("should cast other values to boolean", function() {
            var propDef = PropertyDef.to({name: "foo", browsable: 1}, Derived);
            expect(propDef.browsable).toBe(true);

            propDef = PropertyDef.to({name: "foo", browsable: 0}, Derived);
            expect(propDef.browsable).toBe(false);

            propDef = PropertyDef.to({name: "foo", browsable: ""}, Derived);
            expect(propDef.browsable).toBe(false);

            propDef = PropertyDef.to({name: "foo", browsable: true}, Derived);
            expect(propDef.browsable).toBe(true);

            propDef = PropertyDef.to({name: "foo", browsable: "yes"}, Derived);
            expect(propDef.browsable).toBe(true);

            propDef = PropertyDef.to({name: "foo", browsable: "no"}, Derived);
            expect(propDef.browsable).toBe(true);
          });
        }); // spec.list

        // TODO: other attributes: value, format, metadata

      }); // when spec is an object
    }); // new(spec, declaringType)

    describe("#extend(spec, declaringType) - extending a base property -", function() {
      var BaseType,
          Derived;

      beforeEach(function() {
        BaseType = ComplexType.extend({
          label: "Base",
          props: [
            {
              name:  "baseStr",
              label: "BaseSTR",
              type:  "string",
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
          label: "Derived"
        });
      });

      // Override PropertyDef tests
      describe("when spec is {name: '.'} and the name is that of a base property -", function() {
        describe("the returned property def -", function() {
          var propDef, basePropDef;

          beforeEach(function() {
            basePropDef = BaseType.the.props.get("baseStr");
            propDef = basePropDef.extend({name: "baseStr"}, Derived);
          });

          // basic fields

          it("should be an instance of `PropertyDef`", function() {
            expect(propDef instanceof PropertyDef).toBe(true);
          });

          it("should have the overridden property as `ancestor`", function() {
            expect(propDef).not.toBe(basePropDef);
            expect(propDef.ancestor).toBe(basePropDef);
          });

          it("should have `declaringType` equal to the derived class' instance", function() {
            expect(propDef.declaringType).toBe(Derived.the);
          });

          it("should have `root` equal to the base property", function() {
            expect(propDef.root).toBe(basePropDef);
          });

          // should inherit all attributes

          it("should have the base `name`", function() {
            expect(propDef.name).toBe(basePropDef.name);
          });

          it("should have the base `list`", function() {
            expect(propDef.list).toBe(basePropDef.list);
          });

          it("should have the base `type`", function() {
            expect(propDef.type).toBe(basePropDef.type);
          });

          it("should have the base `label`", function() {
            expect(propDef.label).toBe(basePropDef.label);
          });

          it("should have the base `description`", function() {
            expect(propDef.description).toBe(basePropDef.description);
          });

          it("should have the base `helpUrl`", function() {
            expect(propDef.helpUrl).toBe(basePropDef.helpUrl);
          });

          it("should have the base `category`", function() {
            expect(propDef.category).toBe(basePropDef.category);
          });

          it("should have the base `browsable`", function() {
            expect(propDef.browsable).toBe(basePropDef.browsable);
          });
        });

        describe("when `spec.type` is a sub-type of the base property's type", function() {
          var basePropDef;

          var PostalCodeType = StringType.extend({
            name: "postalCode"
          });

          beforeEach(function() {
            basePropDef = BaseType.the.props.get("baseStr");
          });

          it("should accept it", function() {
            var propDef = basePropDef.extend({name: "baseStr", type: PostalCodeType}, Derived);

            expect(propDef instanceof PropertyDef).toBe(true);
            expect(propDef.ancestor).toBe(basePropDef);
            expect(propDef.type).toBe(PostalCodeType.the);
          });
        });

        describe("when `spec.type` is a not a sub-type of the base property's type", function() {
          var basePropDef;

          var IntegerType = NumberType.extend({
            name: "integer"
          });

          beforeEach(function() {
            basePropDef = BaseType.the.props.get("baseStr");
          });

          it("should throw", function() {
            expect(function() {
              basePropDef.extend({name: "baseStr", type: IntegerType}, Derived);
            }).toThrowError(error.argInvalid("spec.type", "Sub-property's 'type' does not derive from the base property's 'type'.").message);
          });
        });

        describe("when `spec.list` is not that of the base property's type", function() {
          it("should throw when base is list and derived isn't", function() {
            var basePropDef = BaseType.the.props.get("baseNumLst");
            expect(function() {
              basePropDef.extend({name: "baseNumLst", list: false}, Derived);
            }).toThrowError(error.argInvalid("spec.list", "Sub-property has a different 'list' value.").message);
          });

          it("should throw when base is not list and derived is", function() {
            var basePropDef = BaseType.the.props.get("baseNum");
            expect(function() {
              basePropDef.extend({name: "baseNum", list: true}, Derived);
            }).toThrowError(error.argInvalid("spec.list", "Sub-property has a different 'list' value.").message);
          });
        });

        it("should respect other overridden attributes", function() {
          var basePropDef = BaseType.the.props.get("baseNum");
          var propDef = basePropDef.extend({
                name: "baseNum",
                label: "A",
                description: "B",
                helpUrl: "C",
                category: "D",
                browsable: true
              }, Derived);

          expect(propDef.label).toBe("A");
          expect(propDef.description).toBe("B");
          expect(propDef.helpUrl).toBe("C");
          expect(propDef.category).toBe("D");
          expect(propDef.browsable).toBe(true);
        });
      }); // when spec is {name: '.'} and the name is equal ...

      describe("when spec is {name: .} and the name is not that of the name of the base property -", function() {
        it("should throw", function() {
          var basePropDef = BaseType.the.props.get("baseStr");
          expect(function() {
            basePropDef.extend({name: "baseStr2"}, Derived);
          }).toThrowError(error.argInvalid("spec.name", "Sub-property has a different 'name' value.").message);
        });
      });
    }); // #extend(spec, declaringType)...

    // TODO: see above

  }); // pentaho/type/complex
});