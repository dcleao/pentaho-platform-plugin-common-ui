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
  "../../i18n!../i18n/types",
   "../../lang/Base",
   "../../lang/_AnnotatableLinked",
   "../../util/error",
   "../../util/fun",
   "../../util/object"
], function(bundle, Base, AnnotatableLinked, error, fun, O) {

  "use strict";

  // Unique type class id exposed through Meta.prototype.uid and
  // used by Context instances.
  var _nextUid = 1;

  /**
   * @name pentaho.type.Abstract
   * @class
   * @abstract
   *
   * @classDesc The base abstract class of type classes,
   * _independently of their context_.
   *
   * The metadata about this class can be accessed through
   * {@link pentaho.type.Abstract.meta}.
   *
   * @see pentaho.type.Value
   *
   * @description Creates an instance.
   */
  var Abstract = Base.extend("pentaho.type.Abstract", /** @lends pentaho.type.Abstract# */{
    // NOTE: not calling base to block default Base.js from copying 1st argument into `this`.
    constructor: function() {
    }
  }, /** @lends pentaho.type.Abstract */{

    //region meta property
    // The binding between Abstract and Abstract.Meta is performed below after AbstractMeta declaration.
    Meta: null,

    /**
     * Gets the metadata of this type.
     *
     * @type pentaho.type.Value.Meta
     * @readonly
     */
    get meta() {
      return this.Meta.the;
    },
    //endregion

    // @override
    _extend: function(name, instSpec, classSpec) {
      if(!instSpec) instSpec = {};

      // META
      var DerivedMeta = this.Meta.extend(
            name && (name + ".Meta"),
            O["delete"](instSpec,  "meta"),
            O["delete"](classSpec, "meta"));

      // VALUE
      // Delegate to a virtual method to extend the Value class.
      // This allows complex types to define getters and setters.
      var Derived = this._extendValue(DerivedMeta, this.base, name, instSpec, classSpec);

      DerivedMeta.Value = Derived;
      Derived.Meta = DerivedMeta;

      return Derived;
    },

    // @virtual
    _extendValue: function(DerivedMeta, baseExtend, name, instSpec, classSpec) {
      return baseExtend.call(this, name, instSpec, classSpec);
    }
  });

  /**
   * @name pentaho.type.Abstract.Meta
   * @class
   * @abstract
   *
   * @classDesc The base abstract _metadata_ class of types,
   * independently of their context.
   *
   * A metadata class is a _singleton_ class.
   * Each class' single instance is accessible through its `the` property,
   * {@link pentaho.type.Abstract.Meta.the}.
   * Alternatively,
   * the singleton metadata instance can also be accessed through
   * {@link pentaho.type.Abstract.meta}.
   *
   * @see pentaho.type.Value.Meta
   *
   * @description Creates a type metadata instance.
   */
  var AbstractMeta = Base.extend("pentaho.type.Abstract.Meta",
      /** @lends pentaho.type.Abstract.Meta# */{

    // NOTE: not calling base to block default Base.js from copying 1st argument into `this`.
    constructor: function() {
    },

    // Implementation note:
    //  The following JS properties are used to set properties on the class' prototypes,
    //  upon calls to Class.extend and Class.implement,
    //  through the properties' setters.
    //
    //  Generally, type metadata instances are immutable and are not changeable.
    //
    //  The user should not use the setters on actual `Meta` instances...

    //region uid property
    _uid: _nextUid++,

    /**
     * Gets the unique type id.
     *
     * The unique type id is auto-generated when creating a new class through
     * {@link pentaho.type.Abstract.Meta.extend}.
     * All instances of the type have the same unique id.
     *
     * Note that anonymous types do not have a {@link pentaho.type.Value.Meta#id}.
     * However, all types have an unique id.
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
    /**
     * Gets the context where this type class is defined.
     *
     * @name context
     * @memberOf pentaho.type.Abstract.Meta
     * @type pentaho.type.IContext
     * @readonly
     * @abstract
     * @see pentaho.type.Abstract.Meta#root
     */
    //endregion

    //region root property
    /**
     * Gets the (singleton) `Value.Meta` instance of the class' context.
     * @name root
     * @memberOf pentaho.type.Abstract.Meta
     * @type pentaho.type.Value.Meta
     * @readonly
     * @see pentaho.type.Abstract.Meta#ancestor
     * @abstract
     */

    /** @ignore */
    get _isRootProto() {
      return this === this.root.constructor.prototype;
    },
    //endregion

    //region ancestor property
    /**
     * Gets the metadata of the ancestor type, if any, or `null`.
     * @type pentaho.type.Value.Meta
     * @readonly
     */
    get ancestor() {
      var Meta = this.constructor;
      return Meta !== AbstractMeta && Meta !== this.root.constructor ? Meta.ancestor.the : null;
    },
    //endregion

    //region id property

    // -> nonEmptyString, Optional(null), Immutable, Shared (note: not Inherited)
    // "" -> null conversion

    _id: null,

    /**
     * Gets the id of the type.
     *
     * Can only be specified when extending a type.
     *
     * Only types which have an associated AMD/RequireJS module have an id.
     * However, all types have a {@link pentaho.type.Value.Meta#uid}.
     *
     * This property is not inherited.
     *
     * @type ?nonEmptystring
     * @readonly
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
        if(!this._isRootProto) {
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
        if(!this._isRootProto) {
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
        if(!this._isRootProto) {
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
        if(!this._isRootProto) {
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
        if(!this._isRootProto) {
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

    _abstract: true, // for Value.Meta

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
        if(!this._isRootProto)
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
  }, /** @lends pentaho.type.Abstract.Meta */{

    // @override
    _extend: function(name, instSpec) {
      if(!instSpec) instSpec = {};

      var id = O["delete"](instSpec, "id"),
          p  = O["delete"](instSpec,  "p");

      var DerivedMeta = this.base.apply(this, arguments);

      // -----
      // Shared, Immutable, Non-inheritable
      var derivedProto = DerivedMeta.prototype;
      derivedProto._id  = id || null;
      derivedProto._uid = _nextUid++;

      // Block inheritance
      if(!("styleClass" in instSpec)) derivedProto._styleClass = null;
      if(!("abstract"   in instSpec)) derivedProto._abstract   = false; // default value

      // TODO: review annotations... this looks really buggy..
      AnnotatableLinked.configure(derivedProto, {p: p});

      return DerivedMeta;
    },

    //region the property
    _the: null,

    /**
     * Gets the singleton metadata instance.
     * @type pentaho.type.Value.Meta
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
  .implement(AnnotatableLinked);

  Abstract.Meta = AbstractMeta;
  AbstractMeta.Value = Abstract;

  return Abstract;

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
