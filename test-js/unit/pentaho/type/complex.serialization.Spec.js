/*!
 * Copyright 2010 - 2016 Pentaho Corporation.  All rights reserved.
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
  "pentaho/type/Context"
], function(Context) {
  "use strict";

  /* global describe:false, it:false, expect:false, beforeEach:false, Date:false */

  describe("instance serialization -", function() {
    var context = new Context();

    describe("pentaho/type/complex -", function() {
      var Complex = context.get("pentaho/type/complex");

      var TestLevel1 = Complex.extend("TestLevel1", {
        type: {
          label: "TestLevel1",
          props: [
            "type"
          ]
        }
      });

      var TestLevel2 = TestLevel1.extend("TestLevel2", {
        type: {
          label: "TestLevel2",
          props: [
            "name"
          ]
        }
      });

      var Derived = Complex.extend({
        type: {
          label: "Derived",
          props: [
            {name: "quantity", type: "number"},
            "type",
            {name: "noFormat", type: "number"},
            {name: "anything", type: TestLevel1},
            {
              name: "sub",
              type: {
                props: [
                  {name: "truth", type: "boolean"},
                  {name: "when", type: "date"}
                ]
              }
            }
          ]
        }
      });

      var originalSpec = {
        quantity: {v: 20, f: "I'm a simple 20"},
        type: {v: "bar", f: "I'm a bar"},
        noFormat: 50,
        anything: new TestLevel2({"name": "concrete", "type": "Level2"}),
        sub: {
          truth: {v: true, f: "I'm a nested true"},
          when: new Date()
        }
      };

      var value;

      beforeEach(function() {
        value = new Derived(originalSpec);
      });

      describe("values", function() {
        describe("default", function() {
          it("should return primitive value, formatted value, and inline types", function() {
            var spec = value.toSpec({preferPropertyArray: true});

            expect(spec.quantity.v).toBe(originalSpec.quantity.v);
            expect(spec.quantity.f).toBe(originalSpec.quantity.f);
            expect(spec.quantity._).toBeDefined();

            expect(spec.type.v).toBe(originalSpec.type.v);
            expect(spec.type.f).toBe(originalSpec.type.f);
            expect(spec.type._).toBeDefined();

            expect(spec.noFormat.v).toBe(originalSpec.noFormat);
            expect(spec.noFormat.f).toBeDefined();
            expect(spec.noFormat.f).toBeNull();
            expect(spec.noFormat._).toBeDefined();

            //expect(spec.anything.name.v).toBe(originalSpec.anything.name.v);
            expect(spec.anything.name.f).toBeDefined();
            expect(spec.anything.name.f).toBeNull();
            expect(spec.anything.name._).toBeDefined();

            //expect(spec.anything.type.v).toBe(originalSpec.anything.type.v);
            expect(spec.anything.type.f).toBeDefined();
            expect(spec.anything.type.f).toBeNull();
            expect(spec.anything.type._).toBeDefined();

            expect(spec.sub.truth.v).toBe(originalSpec.sub.truth.v);
            expect(spec.sub.truth.f).toBe(originalSpec.sub.truth.f);
            expect(spec.sub.truth._).toBeDefined();

            expect(spec.sub.when.v).toBe(originalSpec.sub.when);
            expect(spec.sub.when.f).toBeDefined();
            expect(spec.sub.when.f).toBeNull();
            expect(spec.sub.when._).toBeDefined();
          });
        });

        describe("default", function() {
          it("should return primitive value, formatted value, and inline types", function() {
            var spec = value.toSpec();

            expect(spec.quantity.v).toBe(originalSpec.quantity.v);
            expect(spec.quantity.f).toBe(originalSpec.quantity.f);
            expect(spec.quantity._).toBeDefined();

            expect(spec.type.v).toBe(originalSpec.type.v);
            expect(spec.type.f).toBe(originalSpec.type.f);
            expect(spec.type._).toBeDefined();

            expect(spec.noFormat.v).toBe(originalSpec.noFormat);
            expect(spec.noFormat.f).toBeUndefined();
            expect(spec.noFormat._).toBeDefined();

            //expect(spec.anything.name.v).toBe(originalSpec.anything.name.v);
            expect(spec.anything.name.f).toBeUndefined();
            expect(spec.anything.name._).toBeDefined();

            //expect(spec.anything.type.v).toBe(originalSpec.anything.type.v);
            expect(spec.anything.type.f).toBeUndefined();
            expect(spec.anything.type._).toBeDefined();

            expect(spec.sub.truth.v).toBe(originalSpec.sub.truth.v);
            expect(spec.sub.truth.f).toBe(originalSpec.sub.truth.f);
            expect(spec.sub.truth._).toBeDefined();

            expect(spec.sub.when.v).toBe(originalSpec.sub.when);
            expect(spec.sub.when.f).toBeUndefined();
            expect(spec.sub.when._).toBeDefined();
          });
        });

        describe("omitFormatted: false and omitRootType: true", function() {
          it("should return primitive value and undefined formatted value when not formatted", function() {
            var spec = value.toSpec({omitRootType: true});

            expect(spec.quantity.v).toBe(originalSpec.quantity.v);
            expect(spec.quantity.f).toBe(originalSpec.quantity.f);
            expect(spec.quantity._).toBeDefined();

            expect(spec.type.v).toBe(originalSpec.type.v);
            expect(spec.type.f).toBe(originalSpec.type.f);
            expect(spec.type._).toBeDefined();

            expect(spec.noFormat.v).toBe(originalSpec.noFormat);
            expect(spec.noFormat.f).toBeUndefined();
            expect(spec.noFormat._).toBeDefined();

            expect(spec.anything.name.v).toBe(originalSpec.anything.name);
            expect(spec.anything.name.f).toBeUndefined();
            expect(spec.anything.name._).toBeDefined();

            expect(spec.anything.type).toBe(originalSpec.anything.type);
            expect(spec.anything.type.f).toBeUndefined();
            expect(spec.anything.type._).toBeDefined();

            expect(spec.sub.truth.v).toBe(originalSpec.sub.truth.v);
            expect(spec.sub.truth.f).toBe(originalSpec.sub.truth.f);
            expect(spec.sub.truth._).toBeDefined();

            expect(spec.sub.when).toBe(originalSpec.sub.when);
            expect(spec.sub.when.f).toBeUndefined();
            expect(spec.sub.when._).toBeDefined();
          });
        });

        describe("omitFormatted: true and omitRootType: false", function() {
          it("should return primitive value even when formatted", function() {
            var spec = value.toSpec({omitFormatted: true});

            expect(spec.quantity.v).toBe(originalSpec.quantity.v);
            expect(spec.quantity.f).toBeUndefined();
            expect(spec.quantity._).toBeDefined();

            expect(spec.type.v).toBe(originalSpec.type.v);
            expect(spec.type.f).toBeUndefined();
            expect(spec.type._).toBeDefined();

            expect(spec.noFormat.v).toBe(originalSpec.noFormat);
            expect(spec.noFormat.f).toBeUndefined();
            expect(spec.noFormat._).toBeDefined();

            expect(spec.anything.name.v).toBe(originalSpec.anything.name);
            expect(spec.anything.name.f).toBeUndefined();
            expect(spec.anything.name._).toBeDefined();

            expect(spec.anything.type.v).toBe(originalSpec.anything.type);
            expect(spec.anything.type.f).toBeUndefined();
            expect(spec.anything.type._).toBeDefined();

            expect(spec.sub.truth.v).toBe(originalSpec.sub.truth.v);
            expect(spec.sub.truth.f).toBeUndefined();
            expect(spec.sub.truth._).toBeDefined();

            expect(spec.sub.when.v).toBe(originalSpec.sub.when);
            expect(spec.sub.when.f).toBeUndefined();
            expect(spec.sub.when._).toBeDefined();
          });
        });

        describe("omitFormatted: true but omitRootType: true", function() {
          it("should return primitive value and undefined formatted value even when formatted", function() {
            var spec = value.toSpec({omitFormatted: true, omitRootType: true});

            expect(spec.quantity.v).toBe(originalSpec.quantity.v);
            expect(spec.quantity.f).toBeUndefined();
            expect(spec.quantity._).toBeDefined();

            expect(spec.type.v).toBe(originalSpec.type.v);
            expect(spec.type.f).toBeUndefined();
            expect(spec.type._).toBeDefined();

            expect(spec.noFormat.v).toBe(originalSpec.noFormat);
            expect(spec.noFormat.f).toBeUndefined();
            expect(spec.noFormat._).toBeDefined();

            expect(spec.anything.name.v).toBe(originalSpec.anything.name);
            expect(spec.anything.name.f).toBeUndefined();
            expect(spec.anything.name._).toBeDefined();

            expect(spec.anything.type).toBe(originalSpec.anything.type);
            expect(spec.anything.type.f).toBeUndefined();
            expect(spec.anything.type._).toBeDefined();

            expect(spec.sub.truth.v).toBe(originalSpec.sub.truth.v);
            expect(spec.sub.truth.f).toBeUndefined();
            expect(spec.sub.truth._).toBeDefined();

            expect(spec.sub.when.v).toBe(originalSpec.sub.when);
            expect(spec.sub.when.f).toBeUndefined();
            expect(spec.sub.when._).toBeDefined();
          });
        });

        describe("omitFormatted: false, omitRootType: false, and includeDefaults: true", function() {
          it("should return primitive value, formatted value, and undefined inline type", function() {
            var spec = value.toSpec({includeDefaults: true});

            expect(spec.value).toBe(originalSpec.v);
            expect(spec.formatted).toBe(originalSpec.f);
            expect(spec.type).toBeDefined();
            expect(spec.type.toSpec().id).toBe(PentahoBoolean.type.toSpec().id);
          });
        });
      });
    }); // pentaho.type.Complex
  });
});
