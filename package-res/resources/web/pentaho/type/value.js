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

        //region restrictions
        _restrictions: [],

        /**
         * Gets the restriction mixin classes that an unrestricted type supports.
         *
         * Can only be specified when extending an _unrestricted type_.
         *
         * @type Array.<pentaho.type.RetrictionMixin>
         * @readonly
         */
        get restrictions() {
          return this._restrictions;
        },

        // for configuration only
        set restrictions(values) {
          if(this.restrictsType)
            throw error.operInvalid(bundle.structured.errors.value.restrictionsSetOnRestricted);

          var restrictions = O.getOwn(this, "_restrictions");
          if(!restrictions)
            restrictions = this._restrictions = this._restrictions.slice();

          // Add new restrictions from values
          if(Array.isArray(values))
            values.forEach(addRestriction);
          else
            addRestriction(values);

          function addRestriction(Mixin) {
            if(restrictions.indexOf(Mixin) < 0)
              restrictions.push(Mixin);
          }
        },

        /**
         * Gets the ancestor unrestricted type, if any.
         *
         * When a type is a _restricted_ type,
         * returns the base unrestricted type which it restricts.
         * Otherwise, returns `null`.
         *
         * A restricted type is an **abstract** subtype of an _unrestricted_ type.
         *
         * @type ?pentaho.type.Value.Meta
         * @readonly
         */
        get restrictsType() {
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
       * Creates a restricted subtype of this one.
       *
       * An error is thrown if the `constructor` property is specified in `instSpec`.
       * the constructor of restricted subtypes is fixed and always returns an
       * instance of the unrestricted type instead.
       *
       * If this type is an unrestricted type,
       * a restricted type that restricts it is returned.
       * Otherwise, if this type is already a restricted type,
       * a more restricted type is created and returned.
       *
       * @param {?string} [name] A name of the type used for debugging purposes.
       * @param {Object} instSpec The restriction type instance specification.
       *
       * The available options are those accepted by each of the unrestricted type's
       * restrictions.
       * Please check each type's documentation to know which restrictions it supports.
       *
       * @return {Class.<pentaho.type.Value>} The subtype's constructor.
       *
       * @see pentaho.type.Value.Meta#restrictsType
       */
      restrict: function(name, instSpec) {

        if(typeof name !== "string") {
          instSpec = name;
          name = null;
        }

        // Restricted types have a fixed, controlled constructor.
        if(instSpec && O.hasOwn(instSpec, "constructor"))
          throw error.operInvalid(bundle.structured.errors.value.restrictionTypeCtor);

        var restrictsMeta = this.meta;

        // Am already a restricted type?
        if(restrictsMeta.restrictsType) {
          // Just extend it and return it.
          // Grab the original extend method, as, below,
          // it is replaced by an always-throws version for restricted types.
          var class_extend = Value.extend;
          return class_extend.call(this, name || "", instSpec);
        }

        // --- Create a root restricted type

        var RestrictsType = this;

        var Restricted = this.extend(name || "", {
            // Constructor always returns an instance of `restrictsType`.
            constructor: function() {
              return O.make(RestrictsType, arguments);
            },

            meta: {
              // Say this is a restricted type and which is the type it restricts.
              get restrictsType() {
                return restrictsMeta;
              },

              // Redirect to restrictsMeta.
              is: function(value) {
                return restrictsMeta.is(value);
              },

              // Redirect to restrictsMeta.
              create: function() {
                throw restrictsMeta.create.apply(restrictsMeta, arguments);
              }
            }
          }, {
            // Can only further _restrict_ a Restricted class, not `extend` it.
            extend: function() {
              throw error.operInvalid();
            }
          });

        // --- Mixin RestrictionMixin classes
        // Note that only the instance side of `RestrictionMixin` classes is mixed in.
        //  The class/static side contains the `validate` method that is called directly,
        //  later, upon value validation.
        // Also, it is the _meta_ side of Restricted that receives the mixin.
        restrictsMeta.restrictions.forEach(function(RestrictionMixin) {
          this.implement(RestrictionMixin.prototype);
        }, Restricted.Meta);

        // --- Apply instSpec
        // This is where the just defined mixin getters/setters
        // can/should be called to configure the restricted type.
        if(instSpec)
          Restricted.implement(instSpec);

        return Restricted;
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
