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
   "../../lang/Base",
   "../../lang/_AnnotatableLinked",
   "../../util/error",
   "../../util/fun",
   "../../util/object",
   "../../util/promise",
   "../../util/text"
], function(Base, AnnotatableLinked, error, fun, O, promise, text) {

  "use strict";

  /*global Promise:true*/

  var baseMid = "pentaho/type/";

  // Unique type class id exposed through Type.prototype.uid and
  // used by Context instances.
  var _nextUid = 1;

  // Standard types which can be assumed to already be loaded.
  var basicStandardTypes = {};
  ["value", "complex", "simple", "string", "number", "boolean", "date"].forEach(function(name) {
    basicStandardTypes[baseMid + name] = 1;
  });

  var configurableProps = {
      "label": 1,
      "labelPlural": 1,
      "description": 1,
      "category": 1,
      "helpUrl": 1,
      "defaultValue": 1,
      "format": 1
    };

  /**
   * @name pentaho.type.Value
   * @class
   * @abstract
   * @implements pentaho.lang.IConfigurable
   * @implements pentaho.lang.IAnnotatable
   *
   * @classdesc
   *
   * Example value type:
   * ```javascript
   * define(["pentaho/type/value"], function(Value) {
   *   return Value.extend({
   *     // Defaults
   *
   *     // Name of a single element of this type of value.
   *     name: "name",
   *
   *     // Plural name of elements of this type of value.
   *     // not the same as a set name...
   *     namePlural: "names",
   *
   *     // Label of a single element of this type of value.
   *     label: "Name", // localized
   *
   *     // Plural label of elements of this type of value.
   *     labelPlural: "Names",
   *
   *     // Category of the type of value or concept
   *     category: "foo", // localized
   *
   *     // Description of the type of value
   *     description: "Foo", // localized
   *
   *     helpUrl: "foo/bar"
   *
   *     defaultValue: null,
   *
   *     // min, max - for _ordered_ types (number, string, any having compare specified?)
   *     // minOpened, maxOpened? false (exclusive?)
   *     // lengthMin, lengthMax, pattern - facets for strings only?
   *
   *     // Arbitrary metadata
   *     p: {
   *     },
   *
   *     // Closed domain of _values_ of this type.
   *     // When inherited, specified values must be a subset of those in the base class.
   *     // By default, the list is an undetermined, possibly infinite,
   *     // set of all values allowed in the base domain...
   *     // This also specifies the default natural ordering of the values.
   *     domain: [],
   *
   *     // Default formatting specification for values of this type
   *     format: {},
   *
   *     // Not configurable, changeable, etc.
   *     // Overridable upon extension:
   *
   *     // Serialization of a Specification to/from JSON
   *     toJSON: function(value) {
   *     },
   *
   *     fromJSON: function(json) {
   *     },
   *
   *     // Unit validation of a value of this type
   *     // Should call base method first.
   *     validate: function(value) {
   *        var valid = this.base.apply(this, arguments);
   *        if(!valid) { }
   *        return valid;
   *     },
   *
   *     isEmpty: function(value) {
   *       return value == null || value === "";
   *     },
   *
   *     getKey: function(value) {
   *      // A unique key of the value among values of the same "kind".
   *      // Specifically, among values of its first sub-class???
   *     },
   *
   *     comparer: function(va, vb) {
   *     }
   *   });
   * });
   * ```
   *
   * @description Creates a type instance and, optionally, registers it in a given context.
   * @param {Object} keyArgs Keyword arguments object.
   * @param {pentaho.type.IContext} [keyArgs.context] The type context.
   */
  var Value = Base.extend("pentaho.type.Value", /** @lends pentaho.type.Value# */{

    constructor: function(keyArgs) {
      // Register in the current context, if any.
      var context = keyArgs && keyArgs.context
      if(context) context.add(this);
    },

    // Implementation note:
    //  Some of the following JS properties are used to set
    //  both class defaults (set on the prototype) and instance JS properties.
    //  This is an implementation convenience to support the extend method.
    //  Use of property getters/setters to set the prototype properties is not documented
    //   and should not be used directly by the user.
    //  The user should use these getters and setters on actual `Type` instances only.

    //region uid property
    _uid: _nextUid++,

    /**
     * Gets the unique type _class_ id.
     *
     * The unique type id is autogenerated upon {@link pentaho.type.Value.extend}.
     * A different unique id can be assigned each time.
     * All instances of the type have the same unique id.
     *
     * @type number
     * @readonly
     */
    get uid() {
      return this._uid;
    },
    //endregion

    //region id property

    // -> nonEmptyString, Optional(null), Immutable, Shared (note: not Inherited)
    // "" -> null conversion

    _id: "pentaho/type/value",

    /**
     * Gets or sets the id of the value type.
     *
     * Can only be specified when extending a value type class.
     *
     * Only value types which have an associated AMD/RequireJS module have an id.
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
    // -> nonEmptyString, "Required", Inherited, Configurable, Localized
    // null or "" -> undefined conversion
    // Defaulted from name, when local, or inherited from base label.

    _label: "Value", // TODO: localize

    get label() {
      return this._label;
    },

    set label(value) {
      // null or "" -> undefined conversion
      if(!value) {
        delete this._label;
      } else {
        this._label = value;
      }
    },
    //endregion

    //region labelPlural property

    // @type !nonEmptyString
    // -> nonEmptyString, "Required", Inherited, Configurable, Localized
    // null or "" -> undefined conversion
    // Defaulted from namePlural or label, when local, or inherited from base labelPlural.

    _labelPlural: "Values", // TODO: localize

    get labelPlural() {
      return this._labelPlural;
    },

    set labelPlural(value) {
      if(!value) {
        if(this.hasOwnProperty("_label"))
          this._labelPlural = this._label + "s";
        else
          delete this._labelPlural;
      } else {
        this._labelPlural = value;
      }
    },
    //endregion

    //region description property

    // -> nonEmptyString, Optional, Inherited, Configurable, Localized
    // "" -> null conversion

    _description: "The most abstract type of value.", // TODO: localize

    get description() {
      return this._description;
    },

    set description(value) {
      if(value === undefined) {
        delete this._description;
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
        delete this._category;
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
        delete this._helpUrl;
      } else {
        this._helpUrl = value || null;
      }
    },
    //endregion

    //region defaultValue

    // -> Optional, Inherited, Configurable
    _defaultValue: null,

    /**
     * Gets or sets the default value of the type.
     *
     * Can be specified when defining a type class
     * through {@link pentaho.type.spec.ITypeExtend#defaultValue}.
     *
     * A type instance can be configured through
     * {@link pentaho.type.spec.ITypeConfig#defaultValue}.
     *
     * Set to `null` to force the value to be `null`
     * and break inheritance.
     *
     * Set to `undefined` to reset the value to its default.
     *
     * The default `defaultValue` is that inherited from the base value type.
     * That of the root value type is `null`.
     *
     * @type ?pentaho.data.Value
     */
    get defaultValue() {
      return this._defaultValue;
    },

    set defaultValue(value) {
      if(value === undefined) {
        // Prevent setting to undefined at the root type
        if(Object.getPrototypeOf(this)._defaultValue !== undefined)
          delete this._defaultValue;
        else
          this._defaultValue = null;
      } else {
        this.defaultValue = value;
      }
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
        if(Object.getPrototypeOf(this)._format)
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
          throw error.argInvalid("domain", "Must be a subset of the base domain.");

        this._domain = value;
      }
    },
    //endregion

    //region IConfigurable implementation
    /**
     * Configures a type instance.
     *
     * @param {!pentaho.type.spec.ITypeConfig} config A type instance configuration.
     */
    configure: function(config) {
      this._configureLocal(config);
    },

    /**
     * Configures the local part of the type medatata instance.
     *
     * Complex types have a "non-local part", constituted by their properties.
     * This method exposes local configuration alone.
     *
     * This method can be overridden by sub-classes to handle
     * additional local configurations.
     *
     * @param {!pentaho.type.spec.ITypeConfig} config A type instance configuration.
     * @virtual
     */
    _configureLocal: function(config) {
      if(!config) throw error.argRequired("config");

      // undefined passes through.
      // Semantics is imposed by each setter.
      for(var p in config)
        if(configurableProps[p] === 1)
          this[p] = config[p];

      AnnotatableLinked.configure(this, config);
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
      return value === undefined    ? [new Error("Values cannot be 'undefined'.")] :
             value instanceof Array ? [new Error("Single values cannot be arrays.")] :
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
  }, /** @lends pentaho.type.Value */{

    // Override documentation only.
    /**
     * Creates a subclass of this value type class.
     *
     * @name pentaho.type.Value.extend
     *
     * @param {string} [name] The name of the value type sub-class.
     * @param {pentaho.type.spec.ITypeExtend} instSpec The value type extend specification.
     * @param {Object} [classSpec] Class-level members of the value type class.
     *
     * @return {Class.<pentaho.type.Value>} The created value type sub-class.
     */

    // @override
    _extend: function(name, instSpec) {
      if(!instSpec) instSpec = {};

      var id = consumeProp(instSpec, "id"),
          labelSingular = consumeProp(instSpec, "label"),
          labelPlural = consumeProp(instSpec, "labelPlural");

      if(!labelSingular) labelPlural = undefined;

      // -----

      var Derived = this.base.apply(this, arguments);

      // -----
      // Shared (only settable when extending), Immutable, Non-inheritable
      Derived.prototype._id = id || null;
      Derived.prototype._uid = _nextUid++;

      // These have setters, as they're instance-configurable.
      // Because the set order is relevant :-( ,
      //  the set cannot be done through `this.base.apply`, above.
      // Also, must set these, even if to `undefined`, so that defaults are determined.
      Derived.prototype.label = labelSingular;
      Derived.prototype.labelPlural = labelPlural;

      return Derived;
    },

    resolveAsync: function(typeSpec) {
      return resolve(typeSpec, true);
    },

    resolve: function(typeSpec) {
      return resolve(typeSpec, false);
    }
  })
  .implement(AnnotatableLinked);

  return Value;

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

  function resolve(typeSpec, async) {
    // Default property type is "string".
    if(!typeSpec) typeSpec = "string";

    switch(typeof typeSpec) {
      case "string":
        // It's considered an AMD id only if it has at least one "/".
        // Otherwise, append pentaho's base amd id.
        if(typeSpec.indexOf("/") < 0) {
          typeSpec = "pentaho/type/" + typeSpec;
        }

        // This fails if a module with the id in the `typeSpec` var
        // is not already _loaded_.
        return async ? promise.require([typeSpec]) : require(typeSpec);

      case "function":
        // Already a Type class?
        if(!(typeSpec.prototype instanceof Value)) {
          throw error.argInvalid(
            "typeSpec",
            "The type specification is a function that is not a class derived from 'Value'.");
        }

        return async ? Promise.resolve(typeSpec) : typeSpec;

      case "object":
        // Properties only: [string||{}, ...] or
        // Inline type spec: {[base: "complex", ] ... }
        if(typeSpec instanceof Array) typeSpec = {props: typeSpec};

        var baseTypeSpec = typeSpec.base || "complex",
            resolveSync = function() {
              resolve(baseTypeSpec, false).extend(typeSpec);
            };

        if(!async) return resolveSync();

        // Collect the module ids of all custom types used within typeSpec.
        var customTypeIds = [];
        collectTypeIds(typeSpec, customTypeIds);

        // Require them all and only then invoke the synchronous BaseType.extend method.
        if(customTypeIds.length)
          return promise.require(customTypeIds).then(resolveSync);

        // All types are standard and can be assumed to be already loaded.
        // Anyway, must only extend async...
        return new Promise(function(resolve) { resolve(resolveSync()); });
    }

    throw error.argInvalid("typeSpec");
  }

  // Recursively collect the module ids of all custom types used within typeSpec.
  function collectTypeIds(typeSpec, outIds) {
    if(!typeSpec) return;

    switch(typeof typeSpec) {
      case "string":
        // It's considered an AMD id only if it has at least one "/".
        // Otherwise, append pentaho's base amd id.
        if(typeSpec.indexOf("/") < 0) typeSpec = baseMid + typeSpec;

        // A standard type that is surely loaded?
        if(basicStandardTypes[typeSpec] === 1) return;

        outIds.push(typeSpec);
        return;

      case "object":
        // Properties only: [string||{}, ...] or
        // Inline type spec: {[base: "complex", ] ... }
        if(typeSpec instanceof Array) typeSpec = {props: typeSpec};

        collectTypeIds(typeSpec.base, outIds);

        if(typeSpec.props) typeSpec.props.forEach(function(propSpec) {
          collectTypeIds(propSpec && propSpec.type, outIds);
        });
        return;
    }
  }
});
