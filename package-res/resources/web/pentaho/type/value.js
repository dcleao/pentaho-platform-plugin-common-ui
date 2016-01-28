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
  "module",
  "./Item",
  "../i18n!types",
  "../util/error",
  "../util/object"
], function(module, Item, bundle, error, O) {

  "use strict";

  // NOTE: PhantomJS does not like this variable to be named context
  // because it would get into trouble on the context getter, below...
  return function(theContext) {

    /**
     * @name pentaho.type.Value.Meta
     * @class
     * @extends pentaho.type.Item.Meta
     *
     * @classDesc The base _metadata_ class of value types.
     */

    /**
     * @name pentaho.type.Value
     * @class
     * @extends pentaho.type.Item
     * @amd pentaho/type/value
     *
     * @classDesc
     *
     * ### AMD
     *
     * Module Id: `pentaho/type/value`
     *
     * The AMD module returns the type's factory, a
     * {@link pentaho.type.Factory<pentaho.type.Value>}.
     *
     * @description Creates a value instance.
     */
    var Value = Item.extend("pentaho.type.Value", /** @lends pentaho.type.Value# */{

      /**
       * Gets the key of the value.
       *
       * The key of a value identifies it among values of the same concrete type.
       *
       * If two values have the same concrete type and their
       * keys are equal, then it must also be the case that
       * {@link pentaho.type.Value.Meta#areEqual}
       * returns `true` when given the two values.
       * The opposite should be true as well.
       * If two values of the same concrete type have distinct keys,
       * then {@link pentaho.type.Value.Meta#areEqual} should return `false`.
       *
       * The default implementation returns the result of calling `toString()`.
       *
       * @type string
       * @readonly
       */
      get key() {
        return this.toString();
      },

      /**
       * Creates a shallow clone of this value.
       *
       * @return {!pentaho.type.Value} The value clone.
       */
      clone: function() {
        throw error.notImplemented();
      },

      /**
       * Determines if a given value, of the same type, is equal to this one.
       *
       * The given value **must** be of the same concrete type (or the result is undefined).
       *
       * To test equality for any two arbitrary values,
       * in a robust way, use {@link pentaho.type.Value.Meta#areEqual}.
       *
       * If two values are equal, they must have an equal {@link pentaho.type.Value#key}.
       * Otherwise, if they are different, they must have a different `key`.
       *
       * The default implementation returns `true` is the two values
       * have the same `key` and `false` otherwise.
       *
       * @param {!pentaho.type.Value} other A value to test for equality.
       * @return {boolean} `true` if the given value is equal to this one, `false`, otherwise.
       */
      equals: function(other) {
        return this === other || this.key === other.key;
      },

      /**
       * Performs validation of this value.
       *
       * When invalid, returns either one `Error` or a non-empty array of `Error` objects.
       * When valid, `null` is returned.
       *
       * @return {Error|Array.<!Error>|null} An `Error`, a non-empty array of `Error` or `null`.
       */
      validate: function() {
        return null;
      },

      /**
       * Gets a value that indicates if this value is valid.
       *
       * This property evaluates {@link pentaho.type.Value#validate} and
       * returns whether no errors were returned.
       *
       * @type boolean
       * @readonly
       */
      get isValid() {
        return !this.validate();
      },

      meta: /** @lends pentaho.type.Value.Meta# */{
        // Note: constructor/_init only called on sub-classes of Value.Meta,
        // and not on Value.Meta itself.
        _init: function() {
          this.base.apply(this, arguments);

          // Block inheritance, with default values
          this._abstract = false;
        },

        id: module.id,

        styleClass: "pentaho-type-value",

        //region list property
        /**
         * Gets a value that indicates if a value is a list value,
         * i.e. if it is or extends {@link pentaho.type.List}.
         *
         * @type boolean
         * @readOnly
         */
        get list() {
          return false;
        },
        //endregion

        //region context property

        // NOTE: any class extended from this one will return the same context...
        /**
         * Gets the context that defined this type class.
         * @type pentaho.type.IContext
         * @override
         */
        get context() {
          // NOTE: PhantomJS does not like this variable to be named context...
          return theContext;
        },
        //endregion

        //region abstract property
        // @type boolean
        // -> boolean, Optional(false)

        // Default value is for `Value.Meta` only.
        // @see Value.Meta#constructor.
        _abstract: true,

        // TODO: Rhino probably gives a syntax error on this.
        // However, cannot use the `get "abstract"()` syntax cause then Phantom JS 1.9.8 starts failing
        get abstract() {
          return this._abstract;
        },

        set abstract(value) {
          // nully is reset, which is false, so !! works well.
          this._abstract = !!value;
        },
        //endregion

        //region refinements
        _refinements: [],

        /**
         * Gets the refinement mixin classes that an unrefined type supports.
         *
         * Can only be specified when extending an _unrefined type_.
         *
         * @type Array.<pentaho.type.RetrictionMixin>
         * @readonly
         */
        get refinements() {
          return this._refinements;
        },

        // for configuration only
        set refinements(values) {
          if(this.refinesType)
            throw error.operInvalid(bundle.structured.errors.value.refinementsSetOnRefined);

          var refinements = O.getOwn(this, "_refinements");
          if(!refinements)
            refinements = this._refinements = this._refinements.slice();

          // Add new refinements from values
          if(Array.isArray(values))
            values.forEach(addRefinement);
          else
            addRefinement(values);

          function addRefinement(Mixin) {
            if(refinements.indexOf(Mixin) < 0)
              refinements.push(Mixin);
          }
        },

        /**
         * Gets the ancestor unrefined type, if any.
         *
         * When a type is a _refined_ type,
         * returns the base unrefined type which it refines.
         * Otherwise, returns `null`.
         *
         * A refined type is an **abstract** subtype of an _unrefined_ type.
         *
         * @type ?pentaho.type.Value.Meta
         * @readonly
         */
        get refinesType() {
          return null;
        },
        //endregion

        // Returns array of non-empty Error objects or null.
        /**
         * Performs validation on a given value and
         * returns a non-empty array of `Error` objects or `null`.
         *
         * If a {@link Nully} value is specified, `null` is returned.
         *
         * @param {pentaho.type.Value|Nully} value The value to validate.
         * @return {?Array.<!Error>} An array of `Error` or `null`.
         */
        validate: function(value) {
          if(value == null) return null;

          if(!this.is(value))
            return [
              new Error(bundle.format(bundle.structured.errors.value.notOfType, [this.label]))
            ];

          var error = value.validate();
          return !error ? null : Array.isArray(error) ? error : [error];
        },

        /**
         * Gets a value that indicates if two given values are equal.
         *
         * If both values are {@link Nully}, `true` is returned.
         * If only one is {@link Nully}, `false` is returned.
         * If the values have different constructors, `false` is returned.
         * Otherwise, {@link pentaho.type.Value#equals} is called
         * on `va`, with `vb` as an argument, and its result is returned.
         *
         * @param {pentaho.type.Value|Nully} [va] The first value.
         * @param {pentaho.type.Value|Nully} [vb] The second value.
         *
         * @return {boolean} `true` if two values are equal, `false` otherwise.
         */
        areEqual: function(va, vb) {
          return va === vb || (va == null && vb == null) ||
                 (va != null && vb != null &&
                  (va.constructor === vb.constructor) && va.equals(vb));
        }
      }
    }, /** @lends pentaho.type.Value */{

      /**
       * Creates a refined subtype of this one.
       *
       * An error is thrown if the `constructor` property is specified in `instSpec`.
       * the constructor of refined subtypes is fixed and always returns an
       * instance of the unrefined type instead.
       *
       * If this type is an unrefined type,
       * a refined type that refines it is returned.
       * Otherwise, if this type is already a refined type,
       * a more refined type is created and returned.
       *
       * @param {?string} [name] A name of the type used for debugging purposes.
       * @param {Object} instSpec The refined type instance specification.
       *
       * The available options are those accepted by each of the unrefined type's
       * refinements.
       * Please check each type's documentation to know which refinements it supports.
       *
       * @return {Class.<pentaho.type.Value>} The subtype's constructor.
       *
       * @see pentaho.type.Value.Meta#refinesType
       */
      refine: function(name, instSpec) {

        if(typeof name !== "string") {
          instSpec = name;
          name = null;
        }

        // Refined types have a fixed, controlled constructor.
        if(instSpec && O.hasOwn(instSpec, "constructor"))
          throw error.operInvalid(bundle.structured.errors.value.refinementTypeCtor);

        var refinesMeta = this.meta;

        // Am already a refined type?
        if(refinesMeta.refinesType) {
          // Just extend it and return it.
          // Grab the original extend method, as, below,
          // it is replaced by an always-throws version for refined types.
          var class_extend = Value.extend;
          return class_extend.call(this, name || "", instSpec);
        }

        if(!refinesMeta.refinements.length)
          throw error.operInvalid(bundle.structured.errors.value.refineTypeWithoutRefinements);

        // --- Create a root refined type

        var RefinesType = this;

        var Refined = this.extend(name || "", {
            // Constructor always returns an instance of `refinesType`.
            constructor: function() {
              return O.make(RefinesType, arguments);
            },

            meta: {
              // Say this is a refined type and which is the type it refines.
              get refinesType() {
                return refinesMeta;
              },

              // Redirect to refinesMeta.
              is: function(value) {
                return refinesMeta.is(value);
              },

              // Redirect to refinesMeta.
              create: function() {
                return refinesMeta.create.apply(refinesMeta, arguments);
              }
            }
          }, {
            // Can only further _refine_ a Refined class, not `extend` it.
            extend: function() {
              throw error.operInvalid();
            }
          });

        // --- Mixin RefinementMixin classes
        // Note that only the instance side of `RefinementMixin` classes is mixed in.
        //  The class/static side contains the `validate` method that is called directly,
        //  later, upon value validation.
        // Also, it is the _meta_ side of Refined that receives the mixin.
        refinesMeta.refinements.forEach(function(RefinementMixin) {
          this.implement(RefinementMixin.prototype);
        }, Refined.Meta);

        // --- Apply instSpec
        // This is where the just defined mixin getters/setters
        // can/should be called to configure the refined type.
        if(instSpec)
          Refined.implement(instSpec);

        return Refined;
      }
    },
    /*keyArgs:*/ {
      isRoot: true
    }).implement({
      meta: bundle.structured.value
    });

    return Value;
  };
});
