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
  "pentaho/type/complex",
  "pentaho/type/value",
  "pentaho/type/string",
  "pentaho/type/_layer0/PropertyMeta",
  "pentaho/type/_layer0/PropertyMetaCollection"
], function(Context, complexFactory, valueFactory, stringFactory, PropertyMeta, PropertyMetaCollection) {

  "use strict";

  /*global describe:true, it:true, expect:true, beforeEach:true*/

  var context = new Context(),
      Value   = context.get(valueFactory),
      Complex = context.get(complexFactory),
      String  = context.get(stringFactory);

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
        expect(Complex.Meta.the.label).not.toBe(Value.Meta.the.label);

        expect(Complex.Meta.the.description).not.toBe(Value.Meta.the.description);
      });

      describe("the `props` property", function() {
        it("should be defined", function() {
           expect(Complex.Meta.the.props).toBeTruthy();
        });

        it("should contain an instance of PropertyMetaCollection", function() {
           expect(Complex.Meta.the.props instanceof PropertyMetaCollection).toBe(true);
        });

        it("should be an empty collection", function() {
           expect(Complex.Meta.the.props.length).toBe(0);
        });
      });
    }); // anatomy

    describe(".extend({...}) - the returned value -", function() {
      it("should be a function", function() {
        var Derived = Complex.extend({
          meta: {
            name:  "derived",
            label: "Derived"
          }
        });

        expect(typeof Derived).toBe("function");
      });

      it("should be a sub-class of Complex", function() {
        var Derived = Complex.extend({
          meta: {
            name:  "derived",
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
            name:  "derived",
            label: "Derived"
          }
        });

        expect(typeof Derived.Meta).toBe("function");
      });

      it(".Meta should be a sub-class of Complex", function() {
        var Derived = Complex.extend({
          meta: {
            name:  "derived",
            label: "Derived"
          }
        });

        expect(Derived.Meta).not.toBe(Value.Meta);
        expect(Derived.Meta).not.toBe(Complex.Meta);
        expect(Derived.Meta.the instanceof Complex.Meta).toBe(true);
      });

      describe(".Meta#props -", function() {
        describe("when not specified or specified empty -", function() {
          it("should have a `props` collection", function() {
            var Derived = Complex.extend({
              meta: {
                name:  "derived",
                label: "Derived"
              }
            });

            expect(Derived.Meta.the.props != null).toBe(true);
            expect(Derived.Meta.the.props instanceof PropertyMetaCollection).toBe(true);

            Derived = Complex.extend({
              meta: {
                name:  "derived",
                label: "Derived",
                props: []
              }
            });

            expect(Derived.Meta.the.props != null).toBe(true);
            expect(Derived.Meta.the.props instanceof PropertyMetaCollection).toBe(true);
          });

          it("should have an empty props collection", function() {
            var Derived = Complex.extend({
              meta: {
                name:  "derived",
                label: "Derived"
              }
            });

            expect(Derived.Meta.the.props.length).toBe(0);

            Derived = Complex.extend({
              meta: {
                name:  "derived",
                label: "Derived",
                props: []
              }
            });

            expect(Derived.Meta.the.props.length).toBe(0);
          });
        }); // when [#props is] not specified or specified empty

        // Tests UPropertyMeta
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

            it("should result in a props collection with length 1", function() {
              expect(Derived.Meta.the.props.length).toBe(1);
            });

            describe("the single property meta -", function() {
              var propMeta = Derived.Meta.the.props[0];

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
                expect(propMeta.type).toBe(String.Meta.the);
              });

              it("should have `declaringType` equal to containing ComplexMeta class", function() {
                expect(propMeta.declaringType).toBe(Derived.Meta.the);
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

        }); // when specified non-empty
      }); // #props

    }); // .extend({...})
  }); // pentaho/type/complex
});