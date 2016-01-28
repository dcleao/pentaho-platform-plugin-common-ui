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
  "pentaho/type/Item",
  "pentaho/type/Context",
  "pentaho/type/RefinementMixin",
  "pentaho/util/error",
  "pentaho/i18n!/pentaho/type/i18n/types"
], function(Item, Context, RefinementMixin, error, bundle) {

  "use strict";

  /*global describe:true, it:true, expect:true, beforeEach:true*/

  var context = new Context(),
      Value = context.get("pentaho/type/value"),
      Number = context.get("pentaho/type/number");

  describe("pentaho/type/value -", function() {

    it("should be a function", function() {
      expect(typeof Value).toBe("function");
    });

    it("should be a sub-class of `Item`", function() {
      expect(Value.prototype instanceof Item).toBe(true);
    });

    describe(".Meta -", function() {
      var ValueMeta = Value.Meta;

      it("should be a function", function() {
        expect(typeof ValueMeta).toBe("function");
      });

      it("should be a sub-class of `Item.Meta`", function() {
        expect(ValueMeta.prototype instanceof Item.Meta).toBe(true);
      });

      it("should have an `uid`", function() {
        expect(ValueMeta.prototype.uid != null).toBe(true);
        expect(typeof ValueMeta.prototype.uid).toBe("number");
      });

      it("should have `abstract` equal to `true`", function() {
        expect(ValueMeta.prototype.abstract).toBe(true);
      });

      describe("#areEqual(va, vb)", function() {
        it("should return `true` if both values are nully", function() {
          expect(Value.meta.areEqual(null, null)).toBe(true);
          expect(Value.meta.areEqual(undefined, undefined)).toBe(true);
          expect(Value.meta.areEqual(null, undefined)).toBe(true);
          expect(Value.meta.areEqual(undefined, null)).toBe(true);
        });

        it("should return `false` if only one of the values is nully", function() {
          var va = new Value();

          expect(Value.meta.areEqual(null, va)).toBe(false);
          expect(Value.meta.areEqual(undefined, va)).toBe(false);
          expect(Value.meta.areEqual(va, undefined)).toBe(false);
          expect(Value.meta.areEqual(va, null)).toBe(false);
        });

        it("should return `true` when given the same value instances and not call its #equals method", function() {
          var va = new Value();

          spyOn(va, "equals").and.callThrough();

          expect(Value.meta.areEqual(va, va)).toBe(true);
          expect(va.equals).not.toHaveBeenCalled();
        });

        it("should return `false` when given values with different constructors and not call their #equals methods", function() {
          var va = new Value();
          var vb = new Number(1);

          spyOn(va, "equals").and.callThrough();
          spyOn(vb, "equals").and.callThrough();

          expect(Value.meta.areEqual(va, vb)).toBe(false);

          expect(va.equals).not.toHaveBeenCalled();
          expect(vb.equals).not.toHaveBeenCalled();
        });

        it("should call the first value's #equals method when these are distinct instances with the same constructor",
            function() {
          var va = new Value();
          var vb = new Value();

          spyOn(va, "equals").and.callFake(function() { return false; });
          spyOn(vb, "equals").and.callFake(function() { return false; });

          expect(Value.meta.areEqual(va, vb)).toBe(false);

          expect(va.equals).toHaveBeenCalled();
          expect(vb.equals).not.toHaveBeenCalled();
        });
      }); // end #areEqual

      describe("#validate(value)", function() {
        it("should return `null` when given a nully value", function() {
          expect(Value.meta.validate(null)).toBe(null);
          expect(Value.meta.validate(undefined)).toBe(null);
        });

        it("should return `null` when given a valid `Value`", function() {
          expect(Value.meta.validate(new Value())).toBe(null);
        });

        it("should return an error array when given a value not an instance " +
            "of the type and not call the type's validate method", function() {
          var value = new Value();
          spyOn(value, "validate");

          var errors = Number.meta.validate(value);

          expect(value.validate).not.toHaveBeenCalled();
          expect(Array.isArray(errors)).toBe(true);
          expect(errors.length).toBe(1);
          expect(errors[0] instanceof Error).toBe(true);
          expect(errors[0].message)
              .toBe(bundle.format(bundle.structured.errors.value.notOfType, [Number.meta.label]));
        });

        it("should call the value's validate method when it is an instance of the type", function() {
          var value = new Value();
          spyOn(value, "validate");
          Value.meta.validate(value);
          expect(value.validate.calls.count()).toBe(1);
        });

        it("should convert an error returned by the validate method to an array of errors", function() {
          var value = new Value();
          var error = new Error();
          spyOn(value, "validate").and.returnValue(error);
          var errors = Value.meta.validate(value);
          expect(errors).toEqual([error]);
        });

        it("should return an error array returned by the validate method", function() {
          var value = new Value();
          var errors = [new Error()];
          spyOn(value, "validate").and.returnValue(errors);

          expect(Value.meta.validate(value)).toBe(errors);
        });
      });// end #validate
    }); // ".Meta -"

    describe(".extend({...}) returns a value that -", function() {

      it("should be a function", function() {
        var Derived = Value.extend();
        expect(typeof Derived).toBe("function");
      });

      it("should be a sub-class of Value", function() {
        var Derived = Value.extend();
        expect(Derived).not.toBe(Value);
        expect(Derived.prototype instanceof Value).toBe(true);
      });

      describe("has a .Meta property that -", function() {

        it("should be a function", function() {
          var Derived = Value.extend();
          expect(typeof Derived.Meta).toBe("function");
        });

        it("should be a sub-class of Value.Meta", function() {
          var Derived = Value.extend();
          expect(Derived.Meta).not.toBe(Value.Meta);
          expect(Derived.meta instanceof Value.Meta).toBe(true);
        });

        describe("#abstract", function() {
          it("should respect a specified abstract spec value", function() {
            var Derived = Value.extend({meta: {abstract: true}});
            expect(Derived.meta.abstract).toBe(true);

            Derived = Value.extend({meta: {abstract: false}});
            expect(Derived.meta.abstract).toBe(false);
          });

          it("should default to `false` whe spec is unspecified and should not inherit the base value", function() {
            var Derived = Value.extend();
            expect(Derived.meta.abstract).toBe(false);

            var Abstract = Value.extend({meta: {abstract: true }});
            var Concrete = Value.extend({meta: {abstract: false}});

            var DerivedAbstract = Abstract.extend();
            var DerivedConcrete = Concrete.extend();

            expect(DerivedAbstract.meta.abstract).toBe(false);
            expect(DerivedConcrete.meta.abstract).toBe(false);
          });

          it("should respect a set non-nully value", function() {
            var Derived = Value.extend();
            expect(Derived.meta.abstract).toBe(false);

            Derived.meta.abstract = true;
            expect(Derived.meta.abstract).toBe(true);

            Derived.meta.abstract = false;
            expect(Derived.meta.abstract).toBe(false);
          });

          it("should set to the default value false when set to a nully value", function() {
            var Derived = Value.extend({meta: {abstract: true}});
            expect(Derived.meta.abstract).toBe(true);
            Derived.meta.abstract = null;
            expect(Derived.meta.abstract).toBe(false);

            Derived = Value.extend({meta: {abstract: true}});
            expect(Derived.meta.abstract).toBe(true);
            Derived.meta.abstract = undefined;
            expect(Derived.meta.abstract).toBe(false);
          });
        }); // #abstract

        describe("#refinements", function() {
          it("should get an empty array when unspecified", function() {
            var Derived = Value.extend();

            var derivedRefinements = Derived.meta.refinements;
            expect(Array.isArray(derivedRefinements)).toBe(true);
            expect(derivedRefinements.length).toBe(0);
          });

          it("should add a specified refinement class", function() {
            var Derived = Value.extend({
              meta: {
                refinements: RefinementMixin
              }
            });

            var derivedRefinements = Derived.meta.refinements;
            expect(Array.isArray(derivedRefinements)).toBe(true);
            expect(derivedRefinements.length).toBe(1);
            expect(derivedRefinements[0]).toBe(RefinementMixin);
          });

          it("should filter out specified duplicate refinement classes", function() {
            var Derived = Value.extend({
              meta: {
                refinements: [RefinementMixin, RefinementMixin]
              }
            });

            var derivedRefinements = Derived.meta.refinements;
            expect(Array.isArray(derivedRefinements)).toBe(true);
            expect(derivedRefinements.length).toBe(1);
            expect(derivedRefinements[0]).toBe(RefinementMixin);
          });

          it("should accept more than one specified distinct Mixin class", function() {
            var Mixin1 = RefinementMixin.extend(),
                Mixin2 = RefinementMixin.extend();

            var Derived = Value.extend({
              meta: {
                refinements: [Mixin1, Mixin2]
              }
            });

            var derivedRefinements = Derived.meta.refinements;
            expect(Array.isArray(derivedRefinements)).toBe(true);
            expect(derivedRefinements.length).toBe(2);
            expect(derivedRefinements[0]).toBe(Mixin1);
            expect(derivedRefinements[1]).toBe(Mixin2);
          });

          it("should allow to _add_ Mixin classes when there are already local refinements", function() {
            var Mixin1 = RefinementMixin.extend(),
                Mixin2 = RefinementMixin.extend();

            var Derived = Value.extend({
              meta: {
                refinements: [Mixin1]
              }
            });

            Derived.meta.refinements = Mixin2;

            var derivedRefinements = Derived.meta.refinements;
            expect(derivedRefinements.length).toBe(2);
            expect(derivedRefinements[0]).toBe(Mixin1);
            expect(derivedRefinements[1]).toBe(Mixin2);
          });

          it("should inherit the base refinements array when not specified locally", function() {
            var Mixin1 = RefinementMixin.extend(),
                Mixin2 = RefinementMixin.extend();

            var A = Value.extend({
              meta: {
                refinements: [Mixin1, Mixin2]
              }
            });

            var B = A.extend();

            expect(B.meta.refinements).toBe(A.meta.refinements);
          });

          it("should create a new array with all base refinements array when specified locally", function() {
            var Mixin1 = RefinementMixin.extend(),
                Mixin2 = RefinementMixin.extend(),
                Mixin3 = RefinementMixin.extend();

            var A = Value.extend({
              meta: {
                refinements: [Mixin1, Mixin2]
              }
            });

            var B = A.extend({
              meta: {
                refinements: [Mixin1, Mixin3]
              }
            });

            var derivedRefinements = B.meta.refinements;
            expect(derivedRefinements).not.toBe(A.meta.refinements);
            expect(A.meta.refinements.length).toBe(2);
            expect(derivedRefinements.length).toBe(3);
            expect(derivedRefinements[0]).toBe(Mixin1);
            expect(derivedRefinements[1]).toBe(Mixin2);
            expect(derivedRefinements[2]).toBe(Mixin3);
          });

          it("should throw when set on a refined type", function() {
            var Derived = Value.extend({
              meta: {
                refinements: [RefinementMixin]
              }
            });

            expect(function() {
              Derived.refine({
                meta: {
                  refinements: []
                }
              });
            }).toThrowError(
                error.operInvalid(bundle.structured.errors.value.refinementsSetOnRefined).message);
          });
        }); // #refinements

        describe("#refinesType", function() {
          it("should be null on an unrefined type", function() {
            expect(Value.meta.refinesType).toBe(null);

            var Derived = Value.extend();
            expect(Derived.meta.refinesType).toBe(null);
          });

          it("should be null on an unrefined type which has refinements", function() {
            var Derived = Value.extend({
              meta: {
                refinements: RefinementMixin
              }
            });

            expect(Derived.meta.refinements.length).toBeGreaterThan(0);
            expect(Derived.meta.refinesType).toBe(null);
          });
        });
      });

      // TODO: remaining properties: value, annotations...

    }); // .extend({...})

    describe("#key -", function() {
      it("should return the result of toString()", function() {
        var va = new Value();

        spyOn(va, "toString").and.returnValue("FOOO");

        expect(va.key).toBe("FOOO");
        expect(va.toString).toHaveBeenCalled();
      });
    });// end #key

    describe("#equals -", function() {
      it("should return `true` if given the same value", function() {
        var va = new Value();

        expect(va.equals(va)).toBe(true);
      });

      it("should return `true` if two distinct values have the same key", function() {
        var va = new Value(),
            vb = new Value();

        // Override/Redefine getter property
        Object.defineProperty(va, "key", {value: "A"});
        Object.defineProperty(vb, "key", {value: "A"});

        expect(va.equals(vb)).toBe(true);
      });

      it("should return `false` if two distinct values have different keys", function() {
        var va = new Value(),
            vb = new Value();

        // Override/Redefine getter property
        Object.defineProperty(va, "key", {value: "A"});
        Object.defineProperty(vb, "key", {value: "B"});

        expect(va.equals(vb)).toBe(false);
      });
    }); // end #equals

    describe("#clone() -", function() {
      it("should throw a not implemented error", function() {
        var va = new Value();

        expect(function() {
          va.clone();
        }).toThrowError(error.notImplemented().message);
      });
    });// end #clone

    describe("#validate() -", function() {
      it("should return null", function() {
        var va = new Value();
        expect(va.validate()).toBe(null);
      });
    });// end #validate

    describe("#isValid -", function() {
      it("should call #validate()", function() {
        var va = new Value();
        spyOn(va, "validate");
        va.isValid;
        expect(va.validate).toHaveBeenCalled();
      });

      it("should return `false` is #validate() returns a truthy value", function() {
        var va = new Value();
        spyOn(va, "validate").and.returnValue({});
        expect(va.isValid).toBe(false);
      });

      it("should return `true` is #validate() returns a nully value", function() {
        var va = new Value();
        spyOn(va, "validate").and.returnValue(null);
        expect(va.isValid).toBe(true);
      });
    });// end #validate

    describe(".refine([name, ] instSpec) -", function() {

      it("should not allow refining an unrefined class when it has no associated refinements", function() {
        expect(function() {
          Value.refine();
        }).toThrowError(
            error.operInvalid(bundle.structured.errors.value.refineTypeWithoutRefinements).message);
      });

      it("should allow refining an unrefined type with associated refinements", function() {
        var Mixin = RefinementMixin.extend();
        var TypeWithRefinements = Value.extend({meta: {refinements: [Mixin]}});

        TypeWithRefinements.refine();
      });

      it("should throw when trying to specify the mesa constructor of a refined type", function() {
        var Mixin = RefinementMixin.extend();
        var TypeWithRefinements = Value.extend({meta: {refinements: [Mixin]}});

        expect(function() {
          TypeWithRefinements.refine({
            constructor: function() {}
          });
        }).toThrowError(error.operInvalid(bundle.structured.errors.value.refinementTypeCtor).message);
      });

      it("should create a refined type constructor that inherits from this", function() {
        var Mixin = RefinementMixin.extend();
        var TypeWithRefinements = Value.extend({meta: {refinements: Mixin}});

        var Refined = TypeWithRefinements.refine();

        expect(Refined.prototype instanceof TypeWithRefinements).toBe(true);
      });

      it("should create a refined type constructor that when invoked returns a direct instance of this", function() {
        var Mixin = RefinementMixin.extend();
        var TypeWithRefinements = Value.extend({meta: {refinements: Mixin}});

        var Refined = TypeWithRefinements.refine();
        var instance = new Refined();
        expect(instance instanceof Refined).toBe(false);
        expect(instance instanceof TypeWithRefinements).toBe(true);
        expect(instance.constructor).toBe(TypeWithRefinements);
      });

      it("should create a refined type constructor that has the specified name", function() {
        var Mixin = RefinementMixin.extend();
        var TypeWithRefinements = Value.extend({meta: {refinements: Mixin}});

        var Refined = TypeWithRefinements.refine("MyRefined");
        // PhantomJS still fails configuring the name property...
        expect(Refined.name || Refined.displayName).toBe("MyRefined");
      });

      it("should create a refined type whose Meta#is(.) returns true for a this instance", function() {
        var Mixin = RefinementMixin.extend();
        var TypeWithRefinements = Value.extend({meta: {refinements: Mixin}});

        var Refined = TypeWithRefinements.refine();
        expect(Refined.meta.is(new TypeWithRefinements())).toBe(true);
      });

      it("should create a refined type whose Meta#create(.) returns direct instances of this", function() {
        var Mixin = RefinementMixin.extend();
        var TypeWithRefinements = Value.extend({meta: {refinements: Mixin}});

        var Refined = TypeWithRefinements.refine();
        var converted = Refined.meta.create({});
        expect(converted.constructor).toBe(TypeWithRefinements);
      });

      it("should create a refined type whose .extend(.) throws", function() {
        var Mixin = RefinementMixin.extend();
        var TypeWithRefinements = Value.extend({meta: {refinements: Mixin}});

        var Refined = TypeWithRefinements.refine();
        expect(function() {
          Refined.extend();
        }).toThrowError(error.operInvalid().message);
      });

      it("should create a refined type having refinesType equal to this", function() {
        var Mixin = RefinementMixin.extend();
        var TypeWithRefinements = Value.extend({meta: {refinements: Mixin}});

        var Refined = TypeWithRefinements.refine();

        expect(Refined.meta.refinesType).toBe(TypeWithRefinements.meta);
      });

      it("should create a refined type with the specified Refinement classes' prototype mixed in", function() {
        var Mixin1 = RefinementMixin.extend({
          attribute1: {}
        });

        var Mixin2 = RefinementMixin.extend({
          attribute2: {}
        });

        var TypeWithRefinements = Value.extend({meta: {refinements: [Mixin1, Mixin2]}});

        var Refined = TypeWithRefinements.refine();

        expect(Refined.meta.attribute1).toBe(Mixin1.prototype.attribute1);
        expect(Refined.meta.attribute2).toBe(Mixin2.prototype.attribute2);
      });

      it("should not mixin the Refinement classes' static interface", function() {
        var Mixin = RefinementMixin.extend({}, {
          attribute1: {},
          attribute2: function() {}
        });

        var TypeWithRefinements = Value.extend({meta: {refinements: [Mixin]}});

        var Refined = TypeWithRefinements.refine();

        expect(Refined.meta.attribute1).toBe(undefined);
        expect(Refined.meta.attribute2).toBe(undefined);

        // Meta
        expect(Refined.meta.constructor.attribute1).toBe(undefined);
        expect(Refined.meta.constructor.attribute2).toBe(undefined);
      });

      it("should be able to use the Refinement Mixin's members directly in the refines spec", function() {

        var Mixin1 = RefinementMixin.extend({
          set attribute1(v) {
            this._attribute1 = v;
          }
        });

        var Mixin2 = RefinementMixin.extend({
          set attribute2(v) {
            this._attribute2 = v;
          }
        });

        var TypeWithRefinements = Value.extend({meta: {refinements: [Mixin1, Mixin2]}});

        var v1 = {}, v2 = {};
        var Refined = TypeWithRefinements.refine({
          meta: {
            attribute1: v1,
            attribute2: v2
          }
        });

        expect(Refined.meta._attribute1).toBe(v1);
        expect(Refined.meta._attribute2).toBe(v2);
      });

      it("should allow to further refine a refined type preserving the refinesType", function() {
        var TypeWithRefinements = Value.extend({
          meta: {
            refinements: RefinementMixin
          }
        });

        var R1 = TypeWithRefinements.refine();
        var R2 = R1.refine();

        expect(R1.meta.refinesType).toBe(TypeWithRefinements.meta);
        expect(R2.meta.refinesType).toBe(TypeWithRefinements.meta);
      });

      it("should allow to further refine a refined type and set its name", function() {
        var TypeWithRefinements = Value.extend({
          meta: {
            refinements: RefinementMixin
          }
        });

        var R1 = TypeWithRefinements.refine();
        var R2 = R1.refine("Fooo");

        expect(R2.name || R2.displayName).toBe("Fooo");
      });
    }); // end .refine
  });
});