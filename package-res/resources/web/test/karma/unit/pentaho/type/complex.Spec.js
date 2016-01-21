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
  "pentaho/type/Property",
  "pentaho/type/PropertyMetaCollection",
  "pentaho/util/error"
], function(Context, Property, PropertyMetaCollection, error) {

  "use strict";

  /*global describe:true, it:true, expect:true, beforeEach:true*/

  var context = new Context(),
      PropertyMeta = Property.Meta,
      Value   = context.get("pentaho/type/value"),
      Complex = context.get("pentaho/type/complex"),
      String  = context.get("pentaho/type/string"),
      List    = context.get("pentaho/type/list");

  describe("pentaho/type/complex -", function() {
    describe("anatomy -", function() {
      it("is a function", function() {
        expect(typeof Complex).toBe("function");
      });

      it("is a sub-class of Value", function() {
        expect(Complex).not.toBe(Value);
        expect(Complex.prototype instanceof Value).toBe(true);
      });

      it(".Meta is a function", function() {
        expect(typeof Complex.Meta).toBe("function");
      });

      it(".Meta is a sub-class of Value.Meta", function() {
        expect(Complex.Meta).not.toBe(Value.Meta);
        expect(Complex.Meta.prototype instanceof Value.Meta).toBe(true);
      });

      it(".Meta has different 'info' attributes from those of Value.Meta", function() {
        expect(Complex.meta.label).not.toBe(Value.meta.label);

        expect(Complex.meta.description).not.toBe(Value.meta.description);
      });
    }); // anatomy

    describe(".extend({...}) - the returned value -", function() {
      it("should be a function", function() {
        var Derived = Complex.extend({
          meta: {
            label: "Derived"
          }
        });

        expect(typeof Derived).toBe("function");
      });

      it("should be a sub-class of Complex", function() {
        var Derived = Complex.extend({
          meta: {
            label: "Derived"
          }
        });

        expect(Derived).not.toBe(Value);
        expect(Derived).not.toBe(Complex);
        expect(Derived.prototype instanceof Complex).toBe(true);
      });

      it(".Meta should be a function", function() {
        var Derived = Complex.extend({
          meta: {
            label: "Derived"
          }
        });

        expect(typeof Derived.Meta).toBe("function");
      });

      it(".Meta should be a sub-class of Complex", function() {
        var Derived = Complex.extend({
          meta: {
            label: "Derived"
          }
        });

        expect(Derived.Meta).not.toBe(Value.Meta);
        expect(Derived.Meta).not.toBe(Complex.Meta);
        expect(Derived.meta instanceof Complex.Meta).toBe(true);
      });

      describe(".Meta properties -", function() {
        describe("when not specified or specified empty -", function() {
          it("should have no properties", function() {
            var Derived = Complex.extend({
              meta: {
                name:  "derived",
                label: "Derived"
              }
            });

            expect(Derived.meta.count).toBe(0);

            Derived = Complex.extend({
              meta: {
                name:  "derived",
                label: "Derived",
                props: []
              }
            });

            expect(Derived.meta.count).toBe(0);
          });

          it("should inherit the base class' properties", function() {
            var A = Complex.extend({
              meta: {
                label: "A",
                props: ["fooBar", "guru"]
              }
            });

            var B = A.extend({
              meta: {
                label: "B"
              }
            });

            expect(A.meta.count).toBe(2);
            expect(B.meta.count).toBe(2);

            expect(A.meta.at(0)).toBe(B.meta.at(0));
            expect(A.meta.at(1)).toBe(B.meta.at(1));
          });
        }); // when [#props is] not specified or specified empty

        describe("when specified non-empty -", function() {

          // string
          describe("with a single 'string' entry -", function() {
            var Derived = Complex.extend({
                  meta: {
                    name:  "derived",
                    label: "Derived",
                    props: ["fooBar"]
                  }
                });

            it("should result in a single property", function() {
              expect(Derived.meta.count).toBe(1);
            });

            describe("the single property meta -", function() {
              var propMeta = Derived.meta.at(0);

              it("should be a property meta instance", function() {
                expect(propMeta instanceof PropertyMeta).toBe(true);
              });

              it("should have `name` equal to the specified string", function() {
                expect(propMeta.name).toBe("fooBar");
              });

              it("should have `label` derived by 'capitalization' of name", function() {
                expect(propMeta.label).toBe("Foo Bar");
              });

              it("should have `type` string", function() {
                expect(propMeta.type).toBe(String.meta);
              });

              it("should have `declaringType` equal to containing ComplexMeta class", function() {
                expect(propMeta.declaringType).toBe(Derived.meta);
              });

              it("should have `list=false`", function() {
                expect(propMeta.list).toBe(false);
              });

              it("should have `root` equal to itself", function() {
                expect(propMeta.root).toBe(propMeta);
              });

              it("should have `ancestor` equal to `null`", function() {
                expect(propMeta.ancestor).toBe(null);
              });
            });
          });

          describe("with two entries -", function() {
            var Derived = Complex.extend({
              meta: {
                label: "Derived",
                props: ["fooBar", "guru"]
              }
            });

            it("should result in 2 properties", function() {
              expect(Derived.meta.count).toBe(2);
              expect(Derived.meta.at(0).name).toBe("fooBar");
              expect(Derived.meta.at(1).name).toBe("guru");
            });
          });

          describe("with an entry that overrides a base type property -", function() {
            var A = Complex.extend({
              meta: {
                label: "A",
                props: ["fooBar", "guru"]
              }
            });

            var B = A.extend({
              meta: {
                label: "B",
                props: [{name: "guru", label: "HELLO"}]
              }
            });

            it("should create a sub-property", function() {
              expect(A.meta.count).toBe(2);
              expect(B.meta.count).toBe(2);

              var baseProp = A.meta.at(1);
              var subProp  = B.meta.at(1);

              expect(subProp).not.toBe(baseProp);

              expect(baseProp.name).toBe("guru");
              expect(baseProp.label).toBe("Guru");

              expect(subProp.name).toBe("guru");
              expect(subProp.label).toBe("HELLO");

              expect(subProp.ancestor).toBe(baseProp);
            });
          });

          describe("with an entry that is not a base type property -", function() {
            var A = Complex.extend({
              meta: {
                label: "A",
                props: ["fooBar", "guru"]
              }
            });

            var B = A.extend({
              meta: {
                label: "B",
                props: [{name: "guru", label: "HELLO"}, {name: "babah"}]
              }
            });

            it("should append a new property", function() {
              expect(A.meta.count).toBe(2);
              expect(B.meta.count).toBe(3);

              expect(B.meta.at(0).name).toBe("fooBar");
              expect(B.meta.at(1).name).toBe("guru");
              expect(B.meta.at(2).name).toBe("babah");
            });
          });

          describe("with a dictionary -", function() {
            it("should define the defined properties", function() {
              var A = Complex.extend({
                meta: {
                  label: "A",
                  props: {"fooBar": {}, "guru": {}}
                }
              });

              expect(A.meta.count).toBe(2);
              expect(A.meta.at(0)).not.toBe(A.meta.at(1));

              var iName0 = ["fooBar", "guru"].indexOf(A.meta.at(0).name);
              var iName1 = ["fooBar", "guru"].indexOf(A.meta.at(1).name);

              expect(iName0).not.toBe(-1);
              expect(iName1).not.toBe(-1);

              expect(iName0).not.toBe(iName1);
            });

            it("should ignore undefined properties", function() {
              var A = Complex.extend({
                meta: {
                  label: "A",
                  props: {"fooBar": {}, "guru": {}, "dada": null, "babah": undefined}
                }
              });

              expect(A.meta.count).toBe(2);
              expect(A.meta.get("fooBar", true) instanceof PropertyMeta).toBe(true);
              expect(A.meta.get("guru",   true) instanceof PropertyMeta).toBe(true);
              expect(A.meta.get("dada",   true)).toBe(null);
              expect(A.meta.get("babah",  true)).toBe(null);
            });

            it("should throw if a property specifies a name different from the key", function() {
              expect(function() {
                Complex.extend({
                  meta: {
                    label: "A",
                    props: {"fooBar": {name: "babah"}}
                  }
                });
              }).toThrowError(error.argInvalid("config", "Property name does not match object key.").message);
            });
          });

          it("should be possible to configure existing properties using a dictionary and `Type.implement`", function() {
            var A = Complex.extend({
              meta: {
                label: "A",
                props: ["x", "y"]
              }
            });

            A.implement({
              meta: {
                props: {
                  "x": {label: "labelX"},
                  "y": {label: "labelY"}
                }
              }
            });

            expect(A.meta.at(0).label).toBe("labelX");
            expect(A.meta.at(1).label).toBe("labelY");
          });
        }); // when specified non-empty
      }); // #props

    }); // .extend({...})

    describe("new Complex() -", function() {
      it("should be possible to create an instance with no arguments", function() {
        new Complex();
      });

      it("should be possible to create an instance with empty arguments", function() {
        new Complex({});
      });

      it("should have meta.count = 0", function() {
        var complex = new Complex({});
        expect(complex.meta.count).toBe(0);
      });
    });

    describe("new DerivedComplex() -", function() {
      var Derived;

      beforeEach(function() {
        Derived = Complex.extend({
          meta: {
            label: "Derived",
            props: [
              "x",
              "y",
              {name: "z", type: ["string"]}
            ]
          }
        });
      });

      describe("when given empty arguments -", function() {
        it("should not throw", function() {
          new Derived();
        });

        it("should have every property with its default value", function() {
          var derived = new Derived();

          expect(derived.get("x")).toBe(null);
          expect(derived.get("y")).toBe(null);
          expect(derived.get("z").toArray()).toEqual([]);
        });
      });

      describe("when given a spec", function() {
        it("should respect values specified in an object", function() {
          var derived = new Derived({x: "1", y: "2", z: ["0"]});

          expect(derived.get("x").value).toBe("1");
          expect(derived.get("y").value).toBe("2");
          expect(derived.get("z").count).toBe(1);
          expect(derived.get("z").at(0).value).toBe("0");
        });

        it("should respect values specified in an array", function() {
          var derived = new Derived(["1", "2", ["0"]]);

          expect(derived.get("x").value).toBe("1");
          expect(derived.get("y").value).toBe("2");
          expect(derived.get("z").count).toBe(1);
          expect(derived.get("z").at(0).value).toBe("0");
        });

        it("should cast the specified values", function() {
          var derived = new Derived([0, 1, [2]]);

          expect(derived.get("x").value).toBe("0");
          expect(derived.get("y").value).toBe("1");
          expect(derived.get("z").count).toBe(1);
          expect(derived.get("z").at(0).value).toBe("2");
        });

        it("should respect values specified in v/f syntax", function() {
          var derived = new Derived({
            x: {v: 1, f: "1.0 EUR"},
            y: {v: 2, f: "2.0 USD"},
            z: [{v: 0, f: "0.0 POUNDS"}]
          });

          expect(derived.get("x").value).toBe("1");
          expect(derived.get("y").value).toBe("2");
          expect(derived.get("z").count).toBe(1);
          expect(derived.get("z").at(0).value).toBe("0");

          expect(derived.get("x").formatted).toBe("1.0 EUR");
          expect(derived.get("y").formatted).toBe("2.0 USD");
          expect(derived.get("z").at(0).formatted).toBe("0.0 POUNDS");
        });
      });


    });

    describe("#get(name, lenient)", function() {
      it("should return the `Value` of an existing singular property", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x", type: "string"}]}
        });

        var derived = new Derived({x: "1"});

        var value = derived.get("x");

        expect(value instanceof Value).toBe(true);
        expect(value.value).toBe("1");
      });

      it("should return the value of an existing property given its metadata instance", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x", type: "string"}]}
        });

        var derived = new Derived({x: "1"});

        var pMeta = Derived.meta.get("x");
        expect(pMeta instanceof Property.Meta).toBe(true);

        var value = derived.get(pMeta);

        expect(value instanceof Value).toBe(true);
        expect(value.value).toBe("1");
      });

      it("should return the `List` value of an existing list property", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x", type: ["string"]}]}
        });

        var derived = new Derived();

        var values = derived.get("x");

        expect(values instanceof List).toBe(true);
        expect(values.count).toBe(0);
      });

      it("should return the same `List` of an existing list property every time", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x", type: ["string"]}]}
        });

        var derived = new Derived({x: ["1"]});

        expect(derived.get("x")).toBe(derived.get("x"));
      });

      it("should return null when given the name of an undefined property and lenient is true", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x"}]}
        });

        var derived = new Derived();

        expect(derived.get("y", true)).toBe(null);
      });

      it("should throw when given the name of an undefined property and lenient is not specified", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x"}]}
        });

        var derived = new Derived();

        expect(function() {
          derived.get("y");
        }).toThrowError(error.operInvalid("A property with the name 'y' is not defined.").message);
      });

      it("should throw when given the name of an undefined property and lenient is false", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x"}]}
        });

        var derived = new Derived();

        expect(function() {
          derived.get("y", false);
        }).toThrowError(error.operInvalid("A property with the name 'y' is not defined.").message);
      });
    });

    describe("#applicable(name)", function() {
      it("should return the evaluated static value of an existing property", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x", applicable: false}]}
        });

        var derived = new Derived();

        expect(derived.applicable("x")).toBe(false);
      });

      it("should return the evaluated dynamic value of an existing property", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x", applicable: function() { return this.foo; }}]}
        });

        var derived = new Derived();

        derived.foo = true;

        expect(derived.applicable("x")).toBe(true);

        derived.foo = false;

        expect(derived.applicable("x")).toBe(false);
      });

      it("should throw when given the name of an undefined property", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x"}]}
        });

        var derived = new Derived();

        expect(function() {
          derived.applicable("y");
        }).toThrowError(error.operInvalid("A property with the name 'y' is not defined.").message);
      });

      it("should throw when given the metadata not owned by the complex, even if of same name as an existing one", function() {
        var Other = Complex.extend({meta: {props: [{name: "x"}]}});

        var Derived = Complex.extend({
          meta: {props: [{name: "x"}]}
        });

        var derived = new Derived();

        expect(function() {
          derived.applicable(Other.meta.get("x"));
        }).toThrowError(error.operInvalid("A property with the name 'x' is not defined.").message);
      });
    }); // end applicable

    describe("#readOnly(name)", function() {
      it("should return the evaluated static value of an existing property", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x", readOnly: false}]}
        });

        var derived = new Derived();

        expect(derived.readOnly("x")).toBe(false);
      });

      it("should return the evaluated dynamic value of an existing property", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x", readOnly: function() { return this.foo; }}]}
        });

        var derived = new Derived();

        derived.foo = true;

        expect(derived.readOnly("x")).toBe(true);

        derived.foo = false;

        expect(derived.readOnly("x")).toBe(false);
      });

      it("should throw when given the name of an undefined property", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x"}]}
        });

        var derived = new Derived();

        expect(function() {
          derived.readOnly("y");
        }).toThrowError(error.operInvalid("A property with the name 'y' is not defined.").message);
      });

      it("should throw when given the metadata not owned by the complex, even if of same name as an existing one", function() {
        var Other = Complex.extend({meta: {props: [{name: "x"}]}});

        var Derived = Complex.extend({
          meta: {props: [{name: "x"}]}
        });

        var derived = new Derived();

        expect(function() {
          derived.readOnly(Other.meta.get("x"));
        }).toThrowError(error.operInvalid("A property with the name 'x' is not defined.").message);
      });
    }); // end readOnly

    describe("#required(name)", function() {
      it("should return the evaluated static value of an existing property", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x", required: true}]}
        });

        var derived = new Derived();

        expect(derived.required("x")).toBe(true);
      });

      it("should return the evaluated dynamic value of an existing property", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x", required: function() { return this.foo; }}]}
        });

        var derived = new Derived();

        derived.foo = true;

        expect(derived.required("x")).toBe(true);

        derived.foo = false;

        expect(derived.required("x")).toBe(false);
      });

      it("should throw when given the name of an undefined property", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x"}]}
        });

        var derived = new Derived();

        expect(function() {
          derived.required("y");
        }).toThrowError(error.operInvalid("A property with the name 'y' is not defined.").message);
      });

      it("should throw when given the metadata not owned by the complex, even if of same name as an existing one", function() {
        var Other = Complex.extend({meta: {props: [{name: "x"}]}});

        var Derived = Complex.extend({
          meta: {props: [{name: "x"}]}
        });

        var derived = new Derived();

        expect(function() {
          derived.required(Other.meta.get("x"));
        }).toThrowError(error.operInvalid("A property with the name 'x' is not defined.").message);
      });
    }); // end required

    describe("#countRange(name)", function() {
      it("should return the evaluated static value of an existing property", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x", countMin: 1, countMax: 1}]}
        });

        var derived = new Derived();

        var range = derived.countRange("x");
        expect(range.min).toBe(1);
        expect(range.max).toBe(1);
      });

      it("should return the evaluated dynamic value of an existing property", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x", countMin: function() { return this.fooMin; }}]}
        });

        var derived = new Derived();

        derived.fooMin = 0;

        expect(derived.countRange("x").min).toBe(0);

        derived.fooMin = 1;

        expect(derived.countRange("x").min).toBe(1);
      });

      it("should throw when given the name of an undefined property", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x"}]}
        });

        var derived = new Derived();

        expect(function() {
          derived.countRange("y");
        }).toThrowError(error.operInvalid("A property with the name 'y' is not defined.").message);
      });

      it("should throw when the given metadata is not owned by the complex, even if of an existing name", function() {
        var Other = Complex.extend({meta: {props: [{name: "x"}]}});

        var Derived = Complex.extend({
          meta: {props: [{name: "x"}]}
        });

        var derived = new Derived();

        expect(function() {
          derived.countRange(Other.meta.get("x"));
        }).toThrowError(error.operInvalid("A property with the name 'x' is not defined.").message);
      });
    }); // end countRange

    describe("#count(name)", function() {
      it("should return 0 when a non-list property is null", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x"}]}
        });

        var derived = new Derived();

        expect(derived.get("x")).toBe(null);
        expect(derived.count("x")).toBe(0);
      });

      it("should return 1 when a non-list property is not null", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x"}]}
        });

        var derived = new Derived([1]);

        expect(derived.get("x").value).toBe("1");
        expect(derived.count("x")).toBe(1);
      });

      it("should return the count of the list value on a list property", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x", type: ["string"]}]}
        });

        var derived = new Derived([[1]]);

        expect(derived.count("x")).toBe(1);

        derived = new Derived([[1, 2]]);

        expect(derived.count("x")).toBe(2);
      });

      it("should throw when given the name of an undefined property", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x"}]}
        });

        var derived = new Derived();

        expect(function() {
          derived.count("y");
        }).toThrowError(error.operInvalid("A property with the name 'y' is not defined.").message);
      });
    }); // end count

    describe("#path", function() {
      it("should get the value of a property given its name", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x", type: "number"}]}
        });

        var derived = new Derived({x: 1});

        expect(derived.path("x").value).toBe(1);
      });

      it("should get the nth value of a property given its name and index", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x", type: ["number"]}]}
        });

        var derived = new Derived({x: [1, 2]});

        expect(derived.path("x", 1).value).toBe(2);
      });

      it("should get the nth value of a property given its name and key", function() {
        var Derived = Complex.extend({
          meta: {props: [{name: "x", type: ["number"]}]}
        });

        var derived = new Derived({x: [1, 2]});

        expect(derived.path("x", "2").value).toBe(2);
      });

      it("should get the end value of a path having multiple steps", function() {
        var Derived = Complex.extend({
          meta: {
            props: [
              {name: "x", type: [
                {props: [
                  {name: "y", type: ["number"]}
                ]}
              ]}
            ]
          }
        });

        var derived = new Derived({x: [{y: [1, 2]}]});

        expect(derived.path("x", 0, "y", 1).value).toBe(2);
      });

      it("should return null if a path having multiple steps has a null property along the way", function() {
        var Derived = Complex.extend({
          meta: {
            props: [
              {
                name: "x",
                type: {
                  props: [
                    {name: "y", type: ["number"]}
                  ]
                }
              }
            ]
          }
        });

        var derived = new Derived({x: null});

        expect(derived.path("x", "y", 1)).toBe(null);
      });

      it("should return null if a path having multiple steps has an out-of-range index along the way", function() {
        var Derived = Complex.extend({
          meta: {
            props: [
              {
                name: "x",
                type: {
                  props: [
                    {name: "y", type: ["number"]}
                  ]
                }
              }
            ]
          }
        });

        var derived = new Derived({x: {y: [1]}});

        expect(derived.path("x", "y", 1)).toBe(null);
      });

      it("should throw if a path having multiple steps has an undefined property name along the way", function() {
        var Derived = Complex.extend({
          meta: {
            props: [
              {
                name: "x",
                type: {
                  props: [
                    {name: "y", type: ["number"]}
                  ]
                }
              }
            ]
          }
        });

        var derived = new Derived({x: {y: [1]}});

        expect(function() {
          derived.path("x", "z", 1)
        }).toThrowError(error.operInvalid("A property with the name 'z' is not defined.").message);

      });
    }); // end path

  }); // pentaho/type/complex
});