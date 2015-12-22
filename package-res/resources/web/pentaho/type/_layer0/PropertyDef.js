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
  "./value",
  "../../lang/_AnnotatableLinked",
  "../../lang/Base",
  "../../util/error",
  "../../util/arg",
  "../../util/text",
  "../../util/fun",
  "../../util/object"
], function(Value, AnnotatableLinked, Base, error, arg, text, fun, O) {

  "use strict";

  var configurableProps = {
      "label": 1,
      "description": 1,
      "category": 1,
      "helpUrl": 1,
      "defaultValue": 1,
      "format": 1,
      "browsable": 1
    };

  /**
   * @name pentaho.type.Property
   *
   * @class
   * @sealed
   * @implements pentaho.lang.IWithKey
   * @implements pentaho.lang.IListElement
   * @implements pentaho.lang.ICollectionElement
   *
   * @classdesc A property of a complex type.
   *
   * Example property:
   * ```javascript
   * require(["pentaho/type/Property"], function(Property) {
   *
   *   return new Property({ // spec
   *     type: "string",
   *     name: "name",
   *     list: false,
   *
   *     // countMin, countMax, required
   *     // applicable, readonly, visible
   *     browsable: true,
   *
   *     // (Some) known values, along with their metadata.
   *     // TODO: is this the right place for this?
   *     // Contrast with Value#domain.
   *     members: [
   *     ],
   *
   *     // Override inherited #type properties
   *     label: "Name",      // override, localized
   *     category: "foo",    // override, localized
   *     description: "Foo", // override, localized
   *     helpUrl: "foo/bar"
   *
   *     // Arbitrary metadata (linked to that of #type)
   *     p: {
   *        color:   "red",
   *        geoRole: ""
   *     },
   *
   *     // Formatting specification
   *     format: {},
   *
   *     // default value
   *     // (uses domain, list and countMin to determine a default)
   *     defaultValue: null
   *   });
   * });
   * ```
   * @see pentaho.type.Complex
   * @description Creates a `Property`.
   *
   * This constructor is used internally by the type package and should not be used directly.
   */
  var Property = Base.extend("pentaho.type.Property", /** @lends pentaho.type.Property# */{

    // TODO: countMin, countMax, required, applicable, readonly, visible, defaultValue, members?, p

    /**
     * Creates a _root_ `Property` instance, given a property specification.
     *
     * Non-root properties are created by calling {@link pentaho.type.Property#extend}
     * on the base property.
     *
     * @param {pentaho.type.spec.UProperty} spec A property name or specification object.
     * @param {Class.<pentaho.type.Complex>} declaringType The complex type class that declares the property.
     * @ignore
     */
    constructor: function(spec, declaringType) {
      if(!spec) throw error.argRequired("spec");
      if(!declaringType) throw error.argRequired("declaringType");

      // A singular string property whith the specified name.
      if(typeof spec === "string") spec = {name: spec};

      // Root attributes
      this._name = spec.name;
      if(!this._name) throw error.argRequired("spec.name");

      this._list = !!spec.list;

      this._root = this;

      // Others
      this._declaringType = declaringType;

      // Resolve value type synchronously.
      this._type = Value.resolve(spec.type);

      // Instances interface
      this._owner = null;
      this._value = null;

      this._configure(spec);
    },

    // TODO: self-recursive complexes won't work if we don't handle them specially:
    // Component.parent : Component
    // Will cause requiring Component during it's own build procedure...
    // Need to recognize requests for the currently being built _top-level_ complex in a special way -
    // the one that can not be built and have a module id.

    /**
     * Creates a sub-property of this one given its specification.
     *
     * @param {pentaho.type.spec.UProperty} spec A property name or specification object.
     * @param {Class.<pentaho.type.Complex>} declaringType The complex type class that declares the sub-property.
     * @return {pentaho.type.Property} The created `Property`.
     * @ignore
     */
    extend: function(spec, declaringType) {
      if(!spec) throw error.argRequired("spec");
      if(!declaringType) throw error.argRequired("declaringType");

      var subProp = Object.create(this);

      subProp._declaringType = declaringType;

      // Resolve value type synchronously.
      var ValueType = spec.type != null ? Value.resolve(spec.type) : null;

      // Validate that it is a sub-type of the base property's type.
      if(ValueType && ValueType !== this.type) {
        if(!(ValueType.prototype instanceof this.type))
          throw error.argInvalid("spec.type", "Sub-property's 'type' does not derive from the base property's 'type'.");

        subProp._type = ValueType;
      }

      // Hierarchy consistency of the special properties `name` and `list`.
      if(spec.name && spec.name !== this.name)
        throw error.argInvalid("spec.name", "Sub-property has a different 'name' value.");

      if(spec.list != null && (!!spec.list) !== this.list)
        throw error.argInvalid("spec.list", "Sub-property has a different 'list' value.");

      subProp._configure(spec);

      return subProp;
    },

    // Call only on the prototype
    attribute: addAttribute,

    //region Private IConfigurable implementation

    // Only used by constructor and extend.
    // It is Property that is configurable by the user, not Property.

    /**
     * Configures a property.
     *
     * @param {!pentaho.type.spec.IPropertyClassConfig} config A property configuration.
     * @ignore
     */
    _configure: function(config) {
      if(!config) throw error.argRequired("config");

      // undefined passes through.
      // Semantics is imposed by each setter.
      for(var p in config)
        if(configurableProps[p] === 1)
          this[p] = config[p];

      AnnotatableLinked.configure(this, config);
    },
    //endregion

    //region IListElement
    /**
     * Gets the singular name of `Property` list-elements.
     * @type string
     * @readonly
     * @default "property"
     */
    elemName: "property",
    //endregion

    //region IWithKey implementation
    /**
     * Gets the singular name of `Property` keys.
     * @type string
     * @readonly
     * @default "name"
     */
    keyName: "name",

    /**
     * Gets the key of the property.
     *
     * The key of a property is its name.
     *
     * @type string
     * @readonly
     */
    get key() {
      return this._name;
    },
    //endregion

    /**
     * The complex type class that declares this property.
     *
     * @type !Class.<pentaho.type.Complex>
     * @readonly
     */
    get declaringType() {
      return this._declaringType;
    },

    /**
     * The root property.
     *
     * @type !pentaho.type.Property
     * @readonly
     */
    get root() {
      return this._root;
    },

    /**
     * The base property, if any.
     *
     * @type ?pentaho.type.Property
     * @readonly
     */
    get ancestor() {
      return this.root === this ? null : Object.getPrototypeOf(this);
    },

    /**
     * The type of the _single_ values that the property can hold.
     *
     * @type !Class.<pentaho.type.Value>
     * @readonly
     */
    get type() {
      return this._type;
    },

    /**
     * The complex that owns this property.
     *
     * This attribute is non-null only in "leaf-properties" -
     * those that are used by actual instances of {@link pentaho.type.Complex} and
     * not by their prototypes.
     *
     * @type ?pentaho.type.Complex
     * @readonly
     * @immutable
     */
    get owner() {
      return this._owner;
    },

    /**
     * The value of the property.
     *
     * This attribute can only be non-null in "leaf-properties" -
     * those that are used by actual instances of {@link pentaho.type.Complex} and
     * not by their prototypes.
     *
     * @type pentaho.type.Value | pentaho.type.Value[] | null
     */
    get value() {
      return this._value;
    },

    set value(value) {
      // TODO
      this._value = value;
    },

    //region name property

    // -> nonEmptyString, Required, Immutable, Root-only.
    _name: undefined,

    get name() {
      return this._name;
    },
    //endregion

    //region list property

    // -> Optional(false), Immutable, Root-only.
    _list: false,

    get list() {
      return this._list;
    },
    //endregion
  }, /** @lends pentaho.type.Property */{
    /**
     * Converts a property specification to a `Property` instance.
     *
     * @param {pentaho.type.spec.UProperty} spec A property name or specification object.
     * @param {Class.<pentaho.type.Complex>} declaringType The complex type class that declares the property.
     * @return {pentaho.type.Property} The created `Property` instance.
     */
    to: function(spec, declaringType) {
      return new Property(spec, declaringType);
    }
  });

  Property.prototype
    .attribute("label", {
      cast: nonEmptyString,
      "default": function() {
        return (this._list && this._type.prototype.labelPlural) ||
            this._type.prototype.label ||
            text.titleFromName(this._name);
      }
    })
    .attribute("description", {
      cast: nonEmptyString,
      "default": function() {
        return this._type.prototype.description;
      }
    })
    .attribute("category", {
      cast: nonEmptyString,
      "default": function() {
        return this._type.prototype.category;
      }
    })
    .attribute("helpUrl", {
      cast: nonEmptyString,
      "default": function() {
        return this._type.prototype.helpUrl;
      }
    })
    .attribute("browsable", {
      cast: Boolean,
      value: true,
      "default": function() { return true; }
    });

  function nonEmptyString(value) {
    return value != null ? null : (String(value) || null);
  }

  // When creating a derived property class, new attributes can be defined.
  // However, only when creating or extending a property instance can attribute values be changed.
  function addAttribute(name, spec) {
    var namePriv = "_" + name,
        cast = spec.cast,
        getDefault = spec["default"];

    // The public property descriptor.
    Object.defineProperty(this, name, {get: getter, set: setter});

    // The configuration method.
    this[namePriv + "Configure"] = configurer;

    // Set the root's default value (for future base calls?)
    this[name] = spec.value;

    if(!getDefault) {
      (function(v0) {
        if(v0 != null) getDefault = fun.constant(v0);
      }(this[namePriv]));
    }

    return this;

    function getter() {
      // Get value from private property, own or inherited, calculated or not.
      // Already casted.
      var value = this[namePriv];

      // Dynamic, local default, determined on each get.
      // Cannot have a cache when there's no way to invalidate it.
      if(value === undefined && (!getDefault || (value = getDefault.call(this)) === undefined))
        value = null;

      return value;
    }

    function setter(value) {
      if(cast && value != null) value = cast(value);

      if(value === undefined)
        delete this[namePriv]; // Inherit value
      else
        this[namePriv] = value;
    }

    function configurer(propDesc) {
      var getter = propDesc.get;
      if(getter) {
        // Calculated, read-only attribute.
        if(cast) getter = wrapGetter(getter, cast);
        Object.defineProperty(this, namePriv, {get: getter, configurable: true});
      } else {
        Object.defineProperty(this, namePriv, {value: propDesc.value, configurable: true});
      }
    }
  }

  function wrapGetter(getter, cast) {

    function wrappedGetter() {
      var value = getter.call(this);
      return value != null ? cast(value) : value;
    }

    return wrappedGetter;
  }

  return Property;
});
