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
  "pentaho/type/_layer0/Property",
  "pentaho/type/complex",
  "pentaho/type/string",
  "pentaho/type/boolean",
  "pentaho/type/number",
  "pentaho/util/error"
], function(Context, Property, complexFactory, stringFactory, booleanFactory, numberFactory, error) {

  "use strict";

  /*global describe:true, it:true, expect:true, beforeEach:true*/

  var context = new Context(),
      PropertyMeta = Property.Meta,
      Boolean = context.get(booleanFactory),
      Complex = context.get(complexFactory),
      String  = context.get(stringFactory),
      Number  = context.get(numberFactory);

  describe("pentaho/type/PropertyMeta -", function() {
    it("is a function", function() {
      expect(typeof PropertyMeta).toBe("function");
    });

    describe("#new(spec, declaringType, ordinal) =>", function() {

      var Derived;

      beforeEach(function() {
        Derived = Complex.extend();
      });

      describe("when spec is a string -", function() {
        var propMeta;

        beforeEach(function() {
          propMeta = PropertyMeta.to("fooBarGuru", Derived.Meta, 0);
        });

        it("should build a property meta instance", function() {
          expect(propMeta instanceof PropertyMeta).toBe(true);
        });

        it("should have `declaringType` equal to containing Complex type instance", function() {
          expect(propMeta.declaringType).toBe(Derived.Meta.the);
        });

        it("should have `root` equal to itself", function() {
          expect(propMeta.root).toBe(propMeta);
        });

        it("should have `ancestor` equal to `null`", function() {
          expect(propMeta.ancestor).toBe(null);
        });

        it("should have `name` equal to the spec string", function() {
          expect(propMeta.name).toBe("fooBarGuru");
        });

        it("should have `label` be a capitalization of `name`", function() {
          // only resolved after type is instantiated and, possibly, configured.
          expect(propMeta.label).toBe("Foo Bar Guru");
        });

        it("should have `type` string", function() {
          expect(propMeta.type).toBe(String.Meta.the);
        });

        it("should have `list=false`", function() {
          expect(propMeta.list).toBe(false);
        });

        it("should have `ordinal` equal to the specified value", function() {
          expect(propMeta.ordinal).toBe(0);
        });
      }); // when spec is a string

      describe("when spec is an object -", function() {

        describe("basic characteristics -", function() {
          var propMeta;

          beforeEach(function() {
            propMeta = PropertyMeta.to({name: "foo"}, Derived.Meta);
          });

          it("should build a property meta instance", function() {
            expect(propMeta instanceof PropertyMeta).toBe(true);
          });

          it("should have `declaringType` equal to containing Complex type instance", function() {
            expect(propMeta.declaringType).toBe(Derived.Meta.the);
          });

          it("should have `root` equal to itself", function() {
            expect(propMeta.root).toBe(propMeta);
          });

          it("should have `ancestor` equal to `null`", function() {
            expect(propMeta.ancestor).toBe(null);
          });
        });

        describe("`spec.list` - ", function() {
          it("should default to `false`", function() {
            var propMeta = PropertyMeta.to({name: "foo"}, Derived.Meta);
            expect(propMeta.list).toBe(false);
          });

          it("should respect the specified value", function() {
            var propMeta = PropertyMeta.to({name: "foo", list: true}, Derived.Meta);
            expect(propMeta.list).toBe(true);

            propMeta = PropertyMeta.to({name: "foo", list: false}, Derived.Meta);
            expect(propMeta.list).toBe(false);

            propMeta = PropertyMeta.to({name: "foo", list: 0}, Derived.Meta);
            expect(propMeta.list).toBe(false);

            propMeta = PropertyMeta.to({name: "foo", list: 1}, Derived.Meta);
            expect(propMeta.list).toBe(true);
          });
        }); // spec.list

        describe("`spec.type` - ", function() {

          // NOTE: tests of Context#get test type resolution more thoroughly.

          it("should default to String", function() {
            var propMeta = PropertyMeta.to({name: "foo"}, Derived.Meta);
            expect(propMeta.type).toBe(String.Meta.the);
          });

          it("should resolve the specified value", function() {
            var propMeta = PropertyMeta.to({name: "foo", type: "string"}, Derived.Meta);
            expect(propMeta.type).toBe(String.Meta.the);

            propMeta = PropertyMeta.to({name: "foo", type: "boolean"}, Derived.Meta);
            expect(propMeta.type).toBe(Boolean.Meta.the);
          });

          it("should throw if the specified value is an unloaded module", function() {
            expect(function() {
              PropertyMeta.to({name: "foo", type: "bar/oof"}, Derived.Meta);
            }).toThrowError(/bar\/oof/);
          });
        }); // spec.type

        describe("`spec.name` - ", function() {
          describe("when falsy -", function() {
            it("should throw`", function() {
              function expectIt(name) {
                expect(function() {
                  PropertyMeta.to({
                      name: name,
                      list: false,
                      type: "string"
                    }, Derived.Meta);
                }).toThrowError(error.argRequired("spec.name").message);
              }

              expectIt(undefined);
              expectIt(null);
              expectIt("");
            });
          }); // when falsy

          describe("when truthy -", function() {
            it("should respect it", function() {
              var propMeta = PropertyMeta.to({
                    name: "fooBar",
                    list: true,
                    type: "string"
                  }, Derived.Meta);

              expect(propMeta.name).toBe("fooBar");
            });
          });
        }); // spec.name

        describe("`spec.label` - ", function() {
          it("should default to the pluralization of `name`", function() {
            var propMeta = PropertyMeta.to({name: "foo"}, Derived.Meta);
            expect(propMeta.label).toBe("Foo");
          });

          it("should convert empty to default", function() {
            var propMeta = PropertyMeta.to({name: "foo", label: ""}, Derived.Meta);
            expect(propMeta.label).toBe("Foo");
          });

          it("should convert null to default", function() {
            var propMeta = PropertyMeta.to({name: "foo", label: null}, Derived.Meta);
            expect(propMeta.label).toBe("Foo");
          });

          it("should convert undefined to default", function() {
            var propMeta = PropertyMeta.to({name: "foo", label: undefined}, Derived.Meta);
            expect(propMeta.label).toBe("Foo");
          });

          it("should respect the specified value", function() {
            var propMeta = PropertyMeta.to({name: "foo", label: "MyFoo"}, Derived.Meta);
            expect(propMeta.label).toBe("MyFoo");
          });
        }); // spec.label

        describe("`spec.description` - ", function() {
          it("should default to null", function() {
            var propMeta = PropertyMeta.to({name: "foo"}, Derived.Meta);
            expect(propMeta.description).toBe(null);

            propMeta = PropertyMeta.to({name: "foo", description: undefined}, Derived.Meta);
            expect(propMeta.description).toBe(null);
          });

          it("should convert empty to null", function() {
            var propMeta = PropertyMeta.to({name: "foo", description: ""}, Derived.Meta);
            expect(propMeta.description).toBe(null);
          });

          it("should respect null", function() {
            var propMeta = PropertyMeta.to({name: "foo", description: null}, Derived.Meta);
            expect(propMeta.description).toBe(null);
          });

          it("should respect the specified value", function() {
            var propMeta = PropertyMeta.to({name: "foo", description: "MyFoo"}, Derived.Meta);
            expect(propMeta.description).toBe("MyFoo");
          });
        }); // spec.description

        describe("`spec.category` - ", function() {
          it("should default to null", function() {
            var propMeta = PropertyMeta.to({name: "foo"}, Derived.Meta);
            expect(propMeta.category).toBe(null);

            propMeta = PropertyMeta.to({name: "foo", category: undefined}, Derived.Meta);
            expect(propMeta.category).toBe(null);
          });

          it("should convert empty to null", function() {
            var propMeta = PropertyMeta.to({name: "foo", category: ""}, Derived.Meta);
            expect(propMeta.category).toBe(null);
          });

          it("should respect null", function() {
            var propMeta = PropertyMeta.to({name: "foo", category: null}, Derived.Meta);
            expect(propMeta.category).toBe(null);
          });

          it("should respect the specified value", function() {
            var propMeta = PropertyMeta.to({name: "foo", category: "MyFoo"}, Derived.Meta);
            expect(propMeta.category).toBe("MyFoo");
          });
        }); // spec.category

        describe("`spec.helpUrl` - ", function() {
          it("should default to null", function() {
            var propMeta = PropertyMeta.to({name: "foo"}, Derived.Meta);
            expect(propMeta.helpUrl).toBe(null);

            propMeta = PropertyMeta.to({name: "foo", helpUrl: undefined}, Derived.Meta);
            expect(propMeta.helpUrl).toBe(null);
          });

          it("should convert empty to null", function() {
            var propMeta = PropertyMeta.to({name: "foo", helpUrl: ""}, Derived.Meta);
            expect(propMeta.helpUrl).toBe(null);
          });

          it("should respect null", function() {
            var propMeta = PropertyMeta.to({name: "foo", helpUrl: null}, Derived.Meta);
            expect(propMeta.helpUrl).toBe(null);
          });

          it("should respect the specified value", function() {
            var propMeta = PropertyMeta.to({name: "foo", helpUrl: "MyFoo"}, Derived.Meta);
            expect(propMeta.helpUrl).toBe("MyFoo");
          });
        }); // spec.helpUrl

        describe("`spec.browsable` - ", function() {
          it("should default to true", function() {
            var propMeta = PropertyMeta.to({name: "foo"}, Derived.Meta);
            expect(propMeta.browsable).toBe(true);
          });

          it("should convert undefined to default", function() {
            var propMeta = PropertyMeta.to({name: "foo", browsable: undefined}, Derived.Meta);
            expect(propMeta.browsable).toBe(true);
          });

          it("should convert null to default", function() {
            var propMeta = PropertyMeta.to({name: "foo", browsable: null}, Derived.Meta);
            expect(propMeta.browsable).toBe(true);
          });

          it("should cast other values to boolean", function() {
            var propMeta = PropertyMeta.to({name: "foo", browsable: 1}, Derived.Meta);
            expect(propMeta.browsable).toBe(true);

            propMeta = PropertyMeta.to({name: "foo", browsable: 0}, Derived.Meta);
            expect(propMeta.browsable).toBe(false);

            propMeta = PropertyMeta.to({name: "foo", browsable: ""}, Derived.Meta);
            expect(propMeta.browsable).toBe(false);

            propMeta = PropertyMeta.to({name: "foo", browsable: true}, Derived.Meta);
            expect(propMeta.browsable).toBe(true);

            propMeta = PropertyMeta.to({name: "foo", browsable: "yes"}, Derived.Meta);
            expect(propMeta.browsable).toBe(true);

            propMeta = PropertyMeta.to({name: "foo", browsable: "no"}, Derived.Meta);
            expect(propMeta.browsable).toBe(true);
          });
        }); // spec.list

        // TODO: other attributes: value, format, metadata

      }); // when spec is an object
    }); // new(spec, declaringType)

    describe("#extend(spec, declaringType) - extending a base property -", function() {
      var Base,
          Derived;

      beforeEach(function() {
        Base = Complex.extend({
          meta: {
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
          }
        });

        Derived = Base.extend({
          meta: {
            label: "Derived"
          }
        });
      });

      // Override PropertyMeta tests
      describe("when spec is {name: '.'} and the name is that of a base property -", function() {
        describe("the returned property meta -", function() {
          var propMeta, basePropMeta;

          beforeEach(function() {
            basePropMeta = Base.Meta.the.props.get("baseStr");
            propMeta = basePropMeta.createSub({name: "baseStr"}, Derived.Meta);
          });

          // basic fields

          it("should be an instance of `PropertyMeta`", function() {
            expect(propMeta instanceof PropertyMeta).toBe(true);
          });

          it("should have the overridden property as `ancestor`", function() {
            expect(propMeta).not.toBe(basePropMeta);
            expect(propMeta.ancestor).toBe(basePropMeta);
          });

          it("should have `declaringType` equal to the derived class' instance", function() {
            expect(propMeta.declaringType).toBe(Derived.Meta.the);
          });

          it("should have `root` equal to the base property", function() {
            expect(propMeta.root).toBe(basePropMeta);
          });

          // should inherit all attributes

          it("should have the base `name`", function() {
            expect(propMeta.name).toBe(basePropMeta.name);
          });

          it("should have the base `list`", function() {
            expect(propMeta.list).toBe(basePropMeta.list);
          });

          it("should have the base `type`", function() {
            expect(propMeta.type).toBe(basePropMeta.type);
          });

          it("should have the base `label`", function() {
            expect(propMeta.label).toBe(basePropMeta.label);
          });

          it("should have the base `description`", function() {
            expect(propMeta.description).toBe(basePropMeta.description);
          });

          it("should have the base `helpUrl`", function() {
            expect(propMeta.helpUrl).toBe(basePropMeta.helpUrl);
          });

          it("should have the base `category`", function() {
            expect(propMeta.category).toBe(basePropMeta.category);
          });

          it("should have the base `browsable`", function() {
            expect(propMeta.browsable).toBe(basePropMeta.browsable);
          });
        });

        describe("when `spec.type` is a sub-type of the base property's type", function() {
          var basePropMeta;

          var PostalCode = String.extend({
            name: "postalCode"
          });

          beforeEach(function() {
            basePropMeta = Base.Meta.the.props.get("baseStr");
          });

          it("should accept it", function() {
            var propMeta = basePropMeta.createSub({name: "baseStr", type: PostalCode.Meta}, Derived.Meta);

            expect(propMeta instanceof PropertyMeta).toBe(true);
            expect(propMeta.ancestor).toBe(basePropMeta);
            expect(propMeta.type).toBe(PostalCode.Meta.the);
          });
        });

        describe("when `spec.type` is a not a sub-type of the base property's type", function() {
          var basePropMeta;

          var Integer = Number.extend();

          beforeEach(function() {
            basePropMeta = Base.Meta.the.props.get("baseStr");
          });

          it("should throw", function() {
            expect(function() {
              basePropMeta.createSub({name: "baseStr", type: Integer.Meta}, Derived.Meta);
            }).toThrowError(error.argInvalid("spec.type",
                "Sub-properties must have a 'type' that derives from their base property's 'type'.").message);
          });
        });

        describe("when `spec.list` is not that of the base property's type", function() {
          it("should throw when base is list and derived isn't", function() {
            var basePropMeta = Base.Meta.the.props.get("baseNumLst");
            expect(function() {
              basePropMeta.createSub({name: "baseNumLst", list: false}, Derived.Meta);
            }).toThrowError(
                error.argInvalid("spec.list", "Sub-properties cannot change the 'list' attribute.").message);
          });

          it("should throw when base is not list and derived is", function() {
            var basePropMeta = Base.Meta.the.props.get("baseNum");
            expect(function() {
              basePropMeta.createSub({name: "baseNum", list: true}, Derived.Meta);
            }).toThrowError(
                error.argInvalid("spec.list", "Sub-properties cannot change the 'list' attribute.").message);
          });
        });

        it("should respect other overridden attributes", function() {
          var basePropMeta = Base.Meta.the.props.get("baseNum");
          var propMeta = basePropMeta.createSub({
                name: "baseNum",
                label: "A",
                description: "B",
                helpUrl: "C",
                category: "D",
                browsable: true
              }, Derived.Meta);

          expect(propMeta.label).toBe("A");
          expect(propMeta.description).toBe("B");
          expect(propMeta.helpUrl).toBe("C");
          expect(propMeta.category).toBe("D");
          expect(propMeta.browsable).toBe(true);
        });
      }); // when spec is {name: '.'} and the name is equal ...

      describe("when spec is {name: .} and the name is not that of the name of the base property -", function() {
        it("should throw", function() {
          var basePropMeta = Base.Meta.the.props.get("baseStr");
          expect(function() {
            basePropMeta.createSub({name: "baseStr2"}, Derived.Meta);
          }).toThrowError(error.argInvalid("spec.name", "Sub-properties cannot change the 'name' attribute.").message);
        });
      });
    }); // #extend(spec, declaringType)...

    // TODO: see above

  }); // pentaho/type/complex
});