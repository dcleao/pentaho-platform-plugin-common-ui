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
  "pentaho/type/RestrictionMixin",
  "pentaho/util/error",
  "pentaho/i18n!/pentaho/type/i18n/types"
], function(Item, Context, RestrictionMixin, error, bundle) {

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

        describe("#restrictions", function() {
          it("should get an empty array when unspecified", function() {
            var Derived = Value.extend();

            var derivedRestrictions = Derived.meta.restrictions;
            expect(Array.isArray(derivedRestrictions)).toBe(true);
            expect(derivedRestrictions.length).toBe(0);
          });

          it("should add a specified restriction class", function() {
            var Derived = Value.extend({
              meta: {
                restrictions: RestrictionMixin
              }
            });

            var derivedRestrictions = Derived.meta.restrictions;
            expect(Array.isArray(derivedRestrictions)).toBe(true);
            expect(derivedRestrictions.length).toBe(1);
            expect(derivedRestrictions[0]).toBe(RestrictionMixin);
          });

          it("should filter out specified duplicate restriction classes", function() {
            var Derived = Value.extend({
              meta: {
                restrictions: [RestrictionMixin, RestrictionMixin]
              }
            });

            var derivedRestrictions = Derived.meta.restrictions;
            expect(Array.isArray(derivedRestrictions)).toBe(true);
            expect(derivedRestrictions.length).toBe(1);
            expect(derivedRestrictions[0]).toBe(RestrictionMixin);
          });

          it("should accept more than one specified distinct Mixin class", function() {
            var Mixin1 = RestrictionMixin.extend(),
                Mixin2 = RestrictionMixin.extend();

            var Derived = Value.extend({
              meta: {
                restrictions: [Mixin1, Mixin2]
              }
            });

            var derivedRestrictions = Derived.meta.restrictions;
            expect(Array.isArray(derivedRestrictions)).toBe(true);
            expect(derivedRestrictions.length).toBe(2);
            expect(derivedRestrictions[0]).toBe(Mixin1);
            expect(derivedRestrictions[1]).toBe(Mixin2);
          });

          it("should allow to _add_ Mixin classes when there are already local restrictions", function() {
            var Mixin1 = RestrictionMixin.extend(),
                Mixin2 = RestrictionMixin.extend();

            var Derived = Value.extend({
              meta: {
                restrictions: [Mixin1]
              }
            });

            Derived.meta.restrictions = Mixin2;

            var derivedRestrictions = Derived.meta.restrictions;
            expect(derivedRestrictions.length).toBe(2);
            expect(derivedRestrictions[0]).toBe(Mixin1);
            expect(derivedRestrictions[1]).toBe(Mixin2);
          });

          it("should inherit the base restrictions array when not specified locally", function() {
            var Mixin1 = RestrictionMixin.extend(),
                Mixin2 = RestrictionMixin.extend();

            var A = Value.extend({
              meta: {
                restrictions: [Mixin1, Mixin2]
              }
            });

            var B = A.extend();

            expect(B.meta.restrictions).toBe(A.meta.restrictions);
          });

          it("should create a new array with all base restrictions array when specified locally", function() {
            var Mixin1 = RestrictionMixin.extend(),
                Mixin2 = RestrictionMixin.extend(),
                Mixin3 = RestrictionMixin.extend();

            var A = Value.extend({
              meta: {
                restrictions: [Mixin1, Mixin2]
              }
            });

            var B = A.extend({
              meta: {
                restrictions: [Mixin1, Mixin3]
              }
            });

            var derivedRestrictions = B.meta.restrictions;
            expect(derivedRestrictions).not.toBe(A.meta.restrictions);
            expect(A.meta.restrictions.length).toBe(2);
            expect(derivedRestrictions.length).toBe(3);
            expect(derivedRestrictions[0]).toBe(Mixin1);
            expect(derivedRestrictions[1]).toBe(Mixin2);
            expect(derivedRestrictions[2]).toBe(Mixin3);
          });

          it("should throw when set on a restricted type", function() {
            var Derived = Value.extend({
              meta: {
                restrictions: [RestrictionMixin]
              }
            });

            expect(function() {
              Derived.restrict({
                meta: {
                  restrictions: []
                }
              });
            }).toThrowError(
                error.operInvalid(bundle.structured.errors.value.restrictionsSetOnRestricted).message);
          });
        }); // #restrictions

        describe("#restrictsType", function() {
          it("should be null on an unrestricted type", function() {
            expect(Value.meta.restrictsType).toBe(null);

            var Derived = Value.extend();
            expect(Derived.meta.restrictsType).toBe(null);
          });

          it("should be null on an unrestricted type which has restrictions", function() {
            var Derived = Value.extend({
              meta: {
                restrictions: RestrictionMixin
              }
            });

            expect(Derived.meta.restrictions.length).toBeGreaterThan(0);
            expect(Derived.meta.restrictsType).toBe(null);
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

    describe(".restrict([name, ] instSpec) -", function() {

      it("should not allow restricting an unrestricted class when it has no associated restrictions", function() {
        expect(function() {
          Value.restrict();
        }).toThrowError(
            error.operInvalid(bundle.structured.errors.value.restrictTypeWithoutRestrictions).message);
      });

      it("should allow restricting an unrestricted type with associated restrictions", function() {
        var Mixin = RestrictionMixin.extend();
        var TypeWithRestrictions = Value.extend({meta: {restrictions: [Mixin]}});

        TypeWithRestrictions.restrict();
      });

      it("should throw when trying to specify the mesa constructor of a restricted type", function() {
        var Mixin = RestrictionMixin.extend();
        var TypeWithRestrictions = Value.extend({meta: {restrictions: [Mixin]}});

        expect(function() {
          TypeWithRestrictions.restrict({
            constructor: function() {}
          });
        }).toThrowError(error.operInvalid(bundle.structured.errors.value.restrictionTypeCtor).message);
      });

      it("should create a restricted type constructor that inherits from this", function() {
        var Mixin = RestrictionMixin.extend();
        var TypeWithRestrictions = Value.extend({meta: {restrictions: Mixin}});

        var Restricted = TypeWithRestrictions.restrict();

        expect(Restricted.prototype instanceof TypeWithRestrictions).toBe(true);
      });

      it("should create a restricted type constructor that when invoked returns a direct instance of this", function() {
        var Mixin = RestrictionMixin.extend();
        var TypeWithRestrictions = Value.extend({meta: {restrictions: Mixin}});

        var Restricted = TypeWithRestrictions.restrict();
        var instance = new Restricted();
        expect(instance instanceof Restricted).toBe(false);
        expect(instance instanceof TypeWithRestrictions).toBe(true);
        expect(instance.constructor).toBe(TypeWithRestrictions);
      });

      it("should create a restricted type constructor that has the specified name", function() {
        var Mixin = RestrictionMixin.extend();
        var TypeWithRestrictions = Value.extend({meta: {restrictions: Mixin}});

        var Restricted = TypeWithRestrictions.restrict("MyRestricted");
        // PhantomJS still fails configuring the name property...
        expect(Restricted.name || Restricted.displayName).toBe("MyRestricted");
      });

      it("should create a restricted type whose Meta#is(.) returns true for a this instance", function() {
        var Mixin = RestrictionMixin.extend();
        var TypeWithRestrictions = Value.extend({meta: {restrictions: Mixin}});

        var Restricted = TypeWithRestrictions.restrict();
        expect(Restricted.meta.is(new TypeWithRestrictions())).toBe(true);
      });

      it("should create a restricted type whose Meta#create(.) returns direct instances of this", function() {
        var Mixin = RestrictionMixin.extend();
        var TypeWithRestrictions = Value.extend({meta: {restrictions: Mixin}});

        var Restricted = TypeWithRestrictions.restrict();
        var converted = Restricted.meta.create({});
        expect(converted.constructor).toBe(TypeWithRestrictions);
      });

      it("should create a restricted type whose .extend(.) throws", function() {
        var Mixin = RestrictionMixin.extend();
        var TypeWithRestrictions = Value.extend({meta: {restrictions: Mixin}});

        var Restricted = TypeWithRestrictions.restrict();
        expect(function() {
          Restricted.extend();
        }).toThrowError(error.operInvalid().message);
      });

      it("should create a restricted type having restrictsType equal to this", function() {
        var Mixin = RestrictionMixin.extend();
        var TypeWithRestrictions = Value.extend({meta: {restrictions: Mixin}});

        var Restricted = TypeWithRestrictions.restrict();

        expect(Restricted.meta.restrictsType).toBe(TypeWithRestrictions.meta);
      });

      it("should create a restricted type with the specified Restriction classes' prototype mixed in", function() {
        var Mixin1 = RestrictionMixin.extend({
          attribute1: {}
        });

        var Mixin2 = RestrictionMixin.extend({
          attribute2: {}
        });

        var TypeWithRestrictions = Value.extend({meta: {restrictions: [Mixin1, Mixin2]}});

        var Restricted = TypeWithRestrictions.restrict();

        expect(Restricted.meta.attribute1).toBe(Mixin1.prototype.attribute1);
        expect(Restricted.meta.attribute2).toBe(Mixin2.prototype.attribute2);
      });

      it("should not mixin the Restriction classes' static interface", function() {
        var Mixin = RestrictionMixin.extend({}, {
          attribute1: {},
          attribute2: function() {}
        });

        var TypeWithRestrictions = Value.extend({meta: {restrictions: [Mixin]}});

        var Restricted = TypeWithRestrictions.restrict();

        expect(Restricted.meta.attribute1).toBe(undefined);
        expect(Restricted.meta.attribute2).toBe(undefined);

        // Meta
        expect(Restricted.meta.constructor.attribute1).toBe(undefined);
        expect(Restricted.meta.constructor.attribute2).toBe(undefined);
      });

      it("should be able to use the Restriction Mixin's members directly in the restricts spec", function() {

        var Mixin1 = RestrictionMixin.extend({
          set attribute1(v) {
            this._attribute1 = v;
          }
        });

        var Mixin2 = RestrictionMixin.extend({
          set attribute2(v) {
            this._attribute2 = v;
          }
        });

        var TypeWithRestrictions = Value.extend({meta: {restrictions: [Mixin1, Mixin2]}});

        var v1 = {}, v2 = {};
        var Restricted = TypeWithRestrictions.restrict({
          meta: {
            attribute1: v1,
            attribute2: v2
          }
        });

        expect(Restricted.meta._attribute1).toBe(v1);
        expect(Restricted.meta._attribute2).toBe(v2);
      });

      it("should allow to further restrict a restricted type preserving the restrictsType", function() {
        var TypeWithRestrictions = Value.extend({
          meta: {
            restrictions: RestrictionMixin
          }
        });

        var R1 = TypeWithRestrictions.restrict();
        var R2 = R1.restrict();

        expect(R1.meta.restrictsType).toBe(TypeWithRestrictions.meta);
        expect(R2.meta.restrictsType).toBe(TypeWithRestrictions.meta);
      });

      it("should allow to further restrict a restricted type and set its name", function() {
        var TypeWithRestrictions = Value.extend({
          meta: {
            restrictions: RestrictionMixin
          }
        });

        var R1 = TypeWithRestrictions.restrict();
        var R2 = R1.restrict("Fooo");

        expect(R2.name || R2.displayName).toBe("Fooo");
      });
    }); // end .restrict
  });
});