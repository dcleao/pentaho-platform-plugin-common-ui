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
  "pentaho/type/_layer0/PropertyDef",
  "pentaho/type/_layer0/PropertyDefCollection"
], function(Context, complexFactory, valueFactory, stringFactory, PropertyDef, PropertyDefCollection) {

  "use strict";

  /*global describe:true, it:true, expect:true, beforeEach:true*/

  var context = new Context(),
      ValueType = context.get(valueFactory),
      ComplexType = context.get(complexFactory),
      StringType = context.get(stringFactory);

  describe("pentaho/type/complex -", function() {
    describe("anatomy -", function() {
      it("is a function", function() {
        expect(typeof ComplexType).toBe("function");
      });

      it("is a sub-class of ValueType", function() {
        expect(ComplexType).not.toBe(ValueType);
        expect(ComplexType.the instanceof ValueType).toBe(true);
      });

      it("has different 'info' attributes from those of ValueType", function() {
        expect(ComplexType.the.label).not.toBe(ValueType.the.label);
        expect(ComplexType.the.labelPlural).not.toBe(ValueType.the.labelPlural);

        expect(ComplexType.the.description).not.toBe(ValueType.the.description);
      });

      describe("the `props` static property", function() {
        it("should be defined", function() {
           expect(ComplexType.the.props).toBeTruthy();
        });

        it("should contain an instance of PropertyDefCollection", function() {
           expect(ComplexType.the.props instanceof PropertyDefCollection).toBe(true);
        });

        it("should be an empty collection", function() {
           expect(ComplexType.the.props.length).toBe(0);
        });
      });
    }); // anatomy

    describe(".extend({...}) - the returned value -", function() {
      it("should be a function", function() {
        var Derived = ComplexType.extend({
          name:  "derived",
          label: "Derived"
        });

        expect(typeof Derived).toBe("function");
      });

      it("should be a sub-class of ComplexType", function() {
        var Derived = ComplexType.extend({
          name:  "derived",
          label: "Derived"
        });

        expect(Derived).not.toBe(ValueType);
        expect(Derived).not.toBe(ComplexType);
        expect(Derived.the instanceof ComplexType).toBe(true);
      });

      describe("#props -", function() {
        describe("when not specified or specified empty -", function() {
          it("should have a `props` collection", function() {
            var Derived = ComplexType.extend({
              name:  "derived",
              label: "Derived"
            });

            expect(Derived.the.props != null).toBe(true);
            expect(Derived.the.props instanceof PropertyDefCollection).toBe(true);

            Derived = ComplexType.extend({
              name:  "derived",
              label: "Derived",
              props: []
            });

            expect(Derived.the.props != null).toBe(true);
            expect(Derived.the.props instanceof PropertyDefCollection).toBe(true);
          });

          it("should have an empty props collection", function() {
            var Derived = ComplexType.extend({
              name:  "derived",
              label: "Derived"
            });

            expect(Derived.the.props.length).toBe(0);

            Derived = ComplexType.extend({
              name:  "derived",
              label: "Derived",
              props: []
            });

            expect(Derived.the.props.length).toBe(0);
          });
        }); // when [#props is] not specified or specified empty

        // Tests UProperty
        describe("when specified non-empty -", function() {

          // string
          describe("with a single 'string' entry -", function() {
            var Derived = ComplexType.extend({
                  name:  "derived",
                  label: "Derived",
                  props: ["foo"]
                });

            it("should result in a props collection with length 1", function() {
              expect(Derived.the.props.length).toBe(1);
            });

            describe("the single property def -", function() {
              var propDef = Derived.the.props[0];

              it("should be a property def instance", function() {
                expect(propDef instanceof PropertyDef).toBe(true);
              });

              it("should have `name` equal to the specified string", function() {
                expect(propDef.name).toBe("foo");
              });

              it("should have `label` be undefined", function() {
                // only resolved after type is instantiated and, possibly, configured.
                expect(propDef.label).toBeUndefined();
              });

              it("should have `type` string", function() {
                expect(propDef.type).toBe(StringType);
              });

              it("should have `declaringType` equal to containing ComplexType class", function() {
                expect(propDef.declaringType).toBe(Derived);
              });

              it("should have `list=false`", function() {
                expect(propDef.list).toBe(false);
              });

              it("should have `root` equal to itself", function() {
                expect(propDef.root).toBe(propDef);
              });

              it("should have `ancestor` equal to `null`", function() {
                expect(propDef.ancestor).toBe(null);
              });
            });
          });

        }); // when specified non-empty
      }); // #props

    }); // .extend({...})
  }); // pentaho/type/complex
});