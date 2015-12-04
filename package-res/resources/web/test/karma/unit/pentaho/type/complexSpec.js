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
  "pentaho/type/complex",
  "pentaho/type/value",
  "pentaho/type/string",
  "pentaho/type/_layer0/PropertyClass",
  "pentaho/type/_layer0/PropertyClassCollection",
  "pentaho/util/error"
], function(Complex, Value, StringMeta, PropertyClass, PropertyClassCollection, error) {
  "use strict";

  /*global describe:true, it:true, expect:true, beforeEach:true*/

  describe("pentaho/type/complex -", function() {
    describe("anatomy -", function() {
      it("is a function", function() {
        expect(typeof Complex).toBe("function");
      });

      it("is a sub-class of Value", function() {
        expect(Complex).not.toBe(Value);
        expect(Complex.prototype instanceof Value).toBe(true);
      });

      it("has different 'info' attributes from those of Value", function() {
        expect(Complex.prototype.label).not.toBe(Value.prototype.label);
        expect(Complex.prototype.labelPlural).not.toBe(Value.prototype.labelPlural);

        expect(Complex.prototype.description).not.toBe(Value.prototype.description);
      });

      describe("the `properties` static property", function() {
        it("should be defined", function() {
           expect(Complex.properties).toBeTruthy();
        });

        it("should contain an instance of PropertyClassCollection", function() {
           expect(Complex.properties instanceof PropertyClassCollection).toBe(true);
        });

        it("should be an empty collection", function() {
           expect(Complex.properties.length).toBe(0);
        });
      });
    }); // anatomy

    describe(".extend({...}) - the returned value -", function() {
      it("should be a function", function() {
        var Derived = Complex.extend({
          name:  "derived",
          label: "Derived"
        });

        expect(typeof Derived).toBe("function");
      });

      it("should be a sub-class of Complex", function() {
        var Derived = Complex.extend({
          name:  "derived",
          label: "Derived"
        });

        expect(Derived).not.toBe(Value);
        expect(Derived).not.toBe(Complex);
        expect(Derived.prototype instanceof Complex).toBe(true);
      });

      describe("#props -", function() {
        describe("when not specified or specified empty -", function() {
          it("should not contain `props` in its prototype", function() {
            var Derived = Complex.extend({
              name:  "derived",
              label: "Derived",
              props: []
            });

            expect(Derived.prototype.props).toBeUndefined();
          });

          it("should have a `properties` collection", function() {
            var Derived = Complex.extend({
              name:  "derived",
              label: "Derived"
            });

            expect(Derived.properties != null).toBe(true);
            expect(Derived.properties instanceof PropertyClassCollection).toBe(true);

            Derived = Complex.extend({
              name:  "derived",
              label: "Derived",
              props: []
            });

            expect(Derived.properties != null).toBe(true);
            expect(Derived.properties instanceof PropertyClassCollection).toBe(true);
          });

          it("should have an empty properties collection", function() {
            var Derived = Complex.extend({
              name:  "derived",
              label: "Derived"
            });

            expect(Derived.properties.length).toBe(0);

            Derived = Complex.extend({
              name:  "derived",
              label: "Derived",
              props: []
            });

            expect(Derived.properties.length).toBe(0);
          });
        }); // when [#props is] not specified or specified empty

        // Tests UProperty
        describe("when specified non-empty -", function() {

          // string
          describe("with a single 'string' entry -", function() {
            var Derived = Complex.extend({
                  name:  "derived",
                  label: "Derived",
                  props: ["foo"]
                });

            it("should result in a properties collection with length 1", function() {
              expect(Derived.properties.length).toBe(1);
            });

            describe("the single property class -", function() {
              var propClass = Derived.properties[0];

              it("should be a property class instance", function() {
                expect(propClass instanceof PropertyClass).toBe(true);
              });

              it("should have `name` equal to the specified string", function() {
                expect(propClass.name).toBe("foo");
              });

              it("should have `label` be undefined", function() {
                // only resolved after type is instantiated and, possibly, configured.
                expect(propClass.label).toBeUndefined();
              });

              it("should have `type` string", function() {
                expect(propClass.type).toBe(StringMeta);
              });

              it("should have `declaringType` equal to containing Complex class", function() {
                expect(propClass.declaringType).toBe(Derived);
              });

              it("should have `list=false`", function() {
                expect(propClass.list).toBe(false);
              });

              it("should have `root` equal to itself", function() {
                expect(propClass.root).toBe(propClass);
              });

              it("should have `ancestor` equal to `null`", function() {
                expect(propClass.ancestor).toBe(null);
              });
            });
          });

        }); // when specified non-empty
      }); // #props

    }); // .extend({...})
  }); // pentaho/type/complex
});