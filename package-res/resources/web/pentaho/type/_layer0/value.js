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
  "../../i18n!types",
   "../../lang/Base",
   "../../lang/_AnnotatableLinked",
   "../../util/error",
   "../../util/fun",
   "../../util/object",
   "../../util/promise"
], function(bundle, Base, AnnotatableLinked, error, fun, O, promise) {

  "use strict";

  var _baseMid = "pentaho/type/",

      // Unique type class id exposed through Type.prototype.uid and
      // used by Context instances.
      _nextUid = 1;

  /**
   * Creates the `ValueType` class for the given context.
   *
   * ### AMD
   *
   * Module Id: `pentaho/type/value`
   *
   * @alias valueFactory
   * @memberOf pentaho.type
   * @type pentaho.type.TypeFactory
   * @amd pentaho/type/value
   */
  return function(context) {
    /**
     * @name pentaho.type.ValueType
     * @class
     *
     * @classDesc
     *
     * A type class is a _singleton_ class.
     * Its single instance is accessible through property {@link pentaho.type.ValueType.the}.
     *
     * Example value type:
     * ```javascript
     * define(["pentaho/type/value"], function(valueFactory) {
     *
     *   return function(context) {
     *
     *     var ValueType = context.get(valueFactory);
     *
     *     return ValueType.extend({
     *       // Defaults
     *
     *       // Name of a single element of this type of value.
     *       name: "name",
     *
     *       // Label of a single element of this type of value.
     *       label: "Name",
     *
     *       // Category of the type of value or concept
     *       category: "foo",
     *
     *       // Description of the type of value
     *       description: "Foo",
     *
     *       helpUrl: "foo/bar"
     *
     *       value: null,
     *
     *       // min, max - for _ordered_ types (number, string, any having compare specified?)
     *       // minOpen, maxOpen? false
     *       // lengthMin, lengthMax, pattern - facets for strings only
     *
     *       // Arbitrary metadata
     *       p: {
     *       },
     *
     *       // Closed domain of _values_ of this type.
     *       // When inherited, specified values must be a subset of those in the base class.
     *       // By default, the list is an undetermined, possibly infinite,
     *       // set of all values allowed in the base domain...
     *       // This also specifies the default natural ordering of the values.
     *       domain: [],
     *
     *       // Default formatting specification for values of this type
     *       format: {},
     *
     *       styleClass: ""
     *     });
     *   };
     * });
     * ```
     *
     * @description Creates a type instance.
     */
    var ValueType = Base.extend("pentaho.type.ValueType", /** @lends pentaho.type.ValueType# */{

      // NOTE: not calling base to block default Base.js from copying 1st argument into this.
      constructor: function() {
      },

      // Implementation note:
      //  The following JS properties are used to set properties on the class' prototypes,
      //  upon calls to Class.extend and Class.implement,
      //  through the properties' setters.
      //
      //  Generally, type instances are immutable and are not changeable.
      //
      //  The user should not use the setters on actual `Type` instances...

      //region uid property
      _uid: _nextUid++,

      /**
       * Gets the unique type id.
       *
       * The unique type id is auto-generated when creating a new class through {@link pentaho.type.ValueType.extend}.
       * All instances of the type have the same unique id.
       *
       * Note that anonymous types do not have a {@link pentaho.type.ValueType#id}.
       * However, all types an unique id.
       *
       * This property is (obviously) not inherited.
       *
       * @type number
       * @readonly
       */
      get uid() {
        return this._uid;
      },
      //endregion

      //region context property
      _context: null,

      /**
       * Gets the context that defined this type class.
       * @type pentaho.type.IContext
       */
      get context() {
        return this._context;
      },
      //endregion

      //region ancestor property
      /**
       * Gets the ancestor (singleton) type instance, if any, or `null`.
       * @type pentaho.type.ValueType
       */
      get ancestor() {
        return this.constructor !== ValueType ? this.constructor.ancestor.the : null;
      },
      //endregion

      //region id property

      // -> nonEmptyString, Optional(null), Immutable, Shared (note: not Inherited)
      // "" -> null conversion

      _id: _baseMid + "value",

      /**
       * Gets the id of the value type.
       *
       * Can only be specified when extending a type.
       *
       * Only types which have an associated AMD/RequireJS module have an id.
       * However, all types a {@link pentaho.type.ValueType#uid}.
       *
       * This property is not inherited.
       *
       * @type ?nonEmptystring
       */
      get id() {
        return this._id;
      },
      //endregion

      //region label property
      // @type !nonEmptyString
      // -> nonEmptyString, Optional, Inherited, Configurable, Localized
      // null or "" -> undefined conversion

      _label: null, // set through implement bundle, below

      get label() {
        return this._label;
      },

      set label(value) {
        // null or "" -> undefined conversion
        if(value == null || value === "") {
          if(this !== ValueType.prototype) {
            delete this._label;
          }
        } else {
          this._label = value;
          if(!this.hasOwnProperty("_labelPlural")) {
            this._labelPlural = null;
          }
        }
      },
      //endregion

      //region description property

      // -> nonEmptyString, Optional, Inherited, Configurable, Localized
      // "" -> null conversion

      _description: null, // set through implement bundle, below

      get description() {
        return this._description;
      },

      set description(value) {
        if(value === undefined) {
          if(this !== ValueType.prototype) {
            delete this._description;
          }
        } else {
          this._description = value || null;
        }
      },
      //endregion

      //region category property

      // -> nonEmptyString, Optional, Inherited, Configurable, Localized
      // "" -> null conversion

      _category: null,

      get category() {
        return this._category;
      },

      set category(value) {
        if(value === undefined) {
          if(this !== ValueType.prototype) {
            delete this._category;
          }
        } else {
          this._category = value || null;
        }
      },
      //endregion

      //region helpUrl property

      // -> nonEmptyString, Optional, Inherited, Configurable, Localized?
      // "" -> null conversion

      _helpUrl: null,

      get helpUrl() {
        return this._helpUrl;
      },

      set helpUrl(value) {
        if(value === undefined) {
          if(this !== ValueType.prototype) {
            delete this._helpUrl;
          }
        } else {
          this._helpUrl = value || null;
        }
      },
      //endregion

      //region browsable property
      // @type boolean
      // -> boolean, Optional(true), Inherited, Configurable
      // undefined or null -> resets

      _browsable: true,

      get browsable() {
        return this._browsable;
      },

      set browsable(value) {
        if(value == null) {
          if(this !== ValueType.prototype) {
            delete this._browsable;
          }
        } else {
          this._browsable = !!value;
        }
      },
      //endregion

      //region abstract property
      // @type boolean
      // -> boolean, Optional(false)

      _abstract: true, // for ValueType

      get "abstract"() {
        return this._abstract;
      },

      set "abstract"(value) {
        this._abstract = !!value;
      },
      //endregion

      //region styleClass property
      // @type nonEmptyString
      // -> nonEmptyString, Optional(null), Configurable, Localized
      // "" or undefined -> null conversion

      _styleClass: null,

      get styleClass() {
        return this._styleClass;
      },

      set styleClass(value) {
        // undefined or "" -> null conversion
        this._styleClass = value || null;
      },
      //endregion

      //region format

      // TODO: recursively inherit? clone? merge on set?

      // -> Optional({}), Inherited, Configurable
      _format: undefined,

      get format() {
        return this._format;
      },

      set format(value) {
        if(value === undefined) {
          // Reset
          if(this !== ValueType.prototype)
            delete this._format;
          else
            this._format = {};
        } else {
          this._format = value || {};
        }
      },
      //endregion

      //region domain

      // Closed domain of _values_ of this type.
      // Also defines the default natural ordering of the values.
      // When inherited, specified values must be a subset of those in the base class.
      // Although they can be in a different order.
      // By default, the list is an undetermined, possibly infinite,
      // set of all values allowed in the base domain...
      // Because it is not possible to escape a base domain,
      // both setting to undefined or null resets the property,
      // inheriting the base domain.
      _domain: null,

      get domain() {
        return this._domain;
      },

      set domain(value) {
        var baseDomain = Object.getPrototypeOf(this)._domain;
        if(value == null) {
          // inherit unless we're the root
          if(baseDomain !== undefined)
            delete this._domain;
          else
            this._domain = null;
        } else {
          if(baseDomain && !isSubsetOf(value, baseDomain))
            throw error.argInvalid("domain", bundle.structured.errors.type.domainIsNotSubsetOfBase);

          this._domain = value;
        }
      },
      //endregion

      // All empty values should have key=""
      isEmpty: function(value) {
        return value === null;
      },

      getKey: function(value) {
        // A unique key of the value among values of the same "kind".
        // TODO: Specifically, unique among values of its first sub-class???
        return this.isEmpty(value) ? "" : String(value);
      },

      // Unit validation of a value.
      // Returns array of non-empty Error objects or null
      validate: function(value) {
        return this.isEmpty(value) ? null : this.validateNonEmpty(value);
      },

      // Should be consistent with result of compare.
      // areEqual => compare -> 0
      areEqual: function(va, vb) {
        return va === vb ||
          (this.isEmpty(va) && this.isEmpty(vb)) ||
          this.areEqualNonEmpty(va, vb);
      },

      areEqualNonEmpty: function(va, vb) {
        return va === vb;
      },

      // consistent with isEmpty and areEqual
      compare: function(va, vb) {
        // Quick bailout test
        if(va === vb) return 0;

        if(this.isEmpty(va)) return this.isEmpty(vb) ? 0 : 1;
        if(this.isEmpty(vb)) return -1;
        if(this.areEqualNonEmpty(va, vb)) return 0;
        return this.compareNonEqualOrEmpty(va, vb);
      },

      // Validation of a non-empty value.
      // Should call the base method first.
      // TODO: Only undefined and arrays are not possible values?
      validateNonEmpty: function(value) {
        return value === undefined    ? [new Error(bundle.structured.errors.value.isUndefined)] :
               value instanceof Array ? [new Error(bundle.structured.errors.value.singleValueIsArray)] :
               null;
      },

      // natural ascending comparer of non-equal, non-empty values
      compareNonEqualOrEmpty: function(va, vb) {
        return fun.compare(va, vb);
      },

      // TODO: Serialization of a Specification to/from JSON
      toJSON: function(value) {
      },

      fromJSON: function(json) {
      }
    }, /** @lends pentaho.type.ValueType */{

      // Overrides documentation only.
      /**
       * Creates a subclass of this value type class.
       *
       * @name pentaho.type.ValueType.extend
       *
       * @param {string} [name] The name of the value type sub-class.
       * @param {pentaho.type.spec.IType} instSpec The value type extend specification.
       * @param {Object} [classSpec] Class-level members of the value type class.
       *
       * @return {Class.<pentaho.type.ValueType>} The created value type sub-class.
       */

      // @override
      _extend: function(name, instSpec) {
        if(!instSpec) instSpec = {};

        var id = consumeProp(instSpec, "id"),
            p  = consumeProp(instSpec,  "p");

        var Derived = this.base.apply(this, arguments);

        // -----
        // Shared, Immutable, Non-inheritable
        var derived = Derived.prototype;
        derived._context = context;
        derived._id  = id || null;
        derived._uid = _nextUid++;

        // Block inheritance
        if(!("styleClass" in instSpec)) derived._styleClass = null;
        if(!("abstract"   in instSpec)) derived._abstract   = false; // default value

        // TODO: review annotations... this looks really buggy..
        AnnotatableLinked.configure(derived, {p: p});

        return Derived;
      },

      //region the property
      _the: null,

      /**
       * Gets the single type instance.
       * @type pentaho.type.ValueType
       */
      get the() {
        // Using an instance instead of `this.prototype` helps
        // the debugging experience, cause getter/setter methods,
        // and normal methods also,
        // don't show up mixed with the smart get/set properties...
        return this._the || (this._the = new this());
      }
      //endregion
    })
    .implement(AnnotatableLinked)
    .implement(bundle.structured.value);

    return ValueType;
  };

  function consumeProp(o, p) {
    var v;
    if(o && (p in o)) {
      v = o[p];
      delete o[p];
    }
    return v;
  }

  function isSubsetOf(sub, sup, key) {
    if(!key) key = fun.identity;

    var L1 = sup.length, L2 = sub.length, i, supIndex;
    if(L2 > L1) return false;

    supIndex = {};
    i = L1;
    while(i--) supIndex[key(sup[i])] = 1;

    i = L2;
    while(i--) if(!O.hasOwn(supIndex, key(sub[i]))) return false;

    return true;
  }
});
