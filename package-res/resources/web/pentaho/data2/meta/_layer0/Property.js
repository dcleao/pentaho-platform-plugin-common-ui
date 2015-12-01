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
  "./type",
  "../../../lang/Base",
  "../../../util/error",
  "../../../util/arg",
  "../../../util/text",
  "../../../util/object"
], function(Type, Base, error, arg, text, O) {

  // TODO: self-recursive complexes won't work if we don't handle them specially:
  // Component.parent : Component
  // Will cause requiring Component during it's own build procedure...
  // Need to recognize requests for the currently being built _top-level_ complex in a special way -
  // the one that can not be built and have a module id.

  /**
   * @name pentaho.data.meta.Property
   *
   * @class
   * @sealed
   * @implements pentaho.lang.IConfigurable
   * @implements pentaho.lang.IWithKey
   * @implements pentaho.lang.IListElement
   * @implements pentaho.lang.ICollectionElement
   *
   * @classdesc The class of properties of instances of a complex type metadata.
   *
   * Example property metadata:
   * ```javascript
   * require(["pentaho/data/meta/Property"], function(PropertyMeta) {
   *
   *   return new PropertyMeta({ // spec
   *     // 1. An AMD id, identified by having at least one "/"
   *     // 2. A string, which is prepended with
   *     //    "pentaho/data/properties/" to form a full property amd id
   *     //    in which case it _must_ be an already loaded AMD module.
   *     // 3. An instance of `pentaho/data/meta/Property`.
   *     type: "string",
   *
   *     // Override inherited #type properties
   *     name: "name",
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
   *     // (Some) known values, along with their metadata.
   *     // TODO: is this the right place for this?
   *     // Contrast with Value#domain.
   *     members: [
   *     ],
   *
   *     // Formatting specification
   *     format: {},
   *
   *     list: false,
   *     // countMin, countMax, required
   *
   *     // applicable, readonly, visible
   *
   *     // default value
   *     // (uses domain, list and countMin to determine a default)
   *     defaultValue: null,
   *
   *     browsable: true
   *   });
   * });
   * ```
   * @see pentaho.data.meta.Complex
   * @description Creates a property metadata instance.
   *
   * This constructor is used internally by the metadata package and should not be used directly.
   */
  var Property = Base.extend("pentaho.data.meta.Property", /** @lends pentaho.data.meta.Property# */{

    // TODO: countMin, countMax, required, applicable, readonly, visible, defaultValue, members?, p

    /**
     * Creates a property metadata instance.
     *
     * @param {Object} keyArgs Keyword arguments object.
     * @param {pentaho.data.meta.IDomain} [keyArgs.metaDomain] The metadata domain.
     * @param {pentaho.data.meta.PropertyClass} keyArgs.propClass The property's `PropertyClass`.
     * @param {pentaho.data.meta.Complex} keyArgs.declaringType The complex type that declares this property.
     * @param {pentaho.data.meta.Property} [keyArgs.ancestorProp] The ancestor property, if any.
     * @param {pentaho.data.meta.IPropertyConfig} [config] The property configuration.
     * @ignore
     */
    constructor: function(metaDomain, propClass, declaringType, ancestorProp, config) {
      if(!metaDomain) throw error.argRequired("metaDomain");
      if(!propClass) throw error.argRequired("propClass");
      if(!declaringType) throw error.argRequired("declaringType");

      this._declaringType = declaringType;
      this._propClass = propClass;
      this._ancestor = ancestorProp || null;

      this._name = propClass.name;
      this._list = propClass.list;
      this._type = metaDomain.get(propClass.type);

      // These must be explicitly set in the constructor to force proper initialization.
      this.label = arg.defined(config, "label");
      this.description = arg.defined(config, "description");
      this.category = arg.defined(config, "category");
      this.helpUrl = arg.defined(config, "helpUrl");

    },

    //region IListElement
    /**
     * Gets the singular name of `Property` list-elements.
     * @type string
     * @readonly
     * @default "property"
     * @immutable
     */
    elemName: "property",
    //endregion

    //region IWithKey implementation
    /**
     * Gets the singular name of `Property` keys.
     * @type string
     * @readonly
     * @default "name"
     * @immutable
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
     * The complex type that declares this property.
     *
     * @type !pentaho.data.meta.Complex
     * @readonly
     * @immutable
     */
    get declaringType() {
      return this._declaringType;
    },

    /**
     * The base property, if any.
     *
     * @type ?pentaho.data.meta.Property
     * @readonly
     * @immutable
     */
    get ancestor() {
      return this._ancestor;
    },

    /**
     * The type of the values that the property can hold.
     *
     * @type !pentaho.data.meta.Type
     * @readonly
     * @immutable
     */
    get type() {
      return this._type;
    },

    /**
     * The name of the property.
     *
     * @type !nonEmptyString
     * @readonly
     * @immutable
     */
    get name() {
      return this._name;
    },

    /**
     * Gets a value that indicates if the property is a list property.
     *
     * The value of a list property is an array of values.
     *
     * @type boolean
     * @readonly
     * @immutable
     */
    get list() {
      return this._list;
    },

    //region label property

    // -> nonEmptyString, Required,
    //    Inherited from property class or value type (label or labelPlural, according to list),
    //    Configurable, Localized

    _label: undefined,

    get label() {
      return this._label;
    },

    set label(value) {
      if(value === undefined) {
        // Inherit from the property class or from value type metadata.
        value = this._propClass.label;

        if(!value) {
          value = (this._list && this._type.labelPlural) || this._type.label;
          if(!value)
            value = text.titleFromName(this._name);
        }
      } else {
        // null || ""
        if(!value) throw error.argRequired("label");
      }

      this._label = value;
    },
    //endregion

    //region description property

    // -> nonEmptyString, Optional,
    //    Inherited from property class or value type,
    //    Configurable, Localized

    _description: null,

    get description() {
      return this._description;
    },

    set description(value) {
      if(value === undefined) {
        // Inherit from the property class or from value type metadata.
        value = this._propClass.description || this._type.description;
      }

      this._description = value || null;
    },
    //endregion

    //region category property

    // -> nonEmptyString, Optional,
    //    Inherited from property class or value type,
    //    Configurable, Localized

    _category: null,

    get category() {
      return this._category;
    },

    set category(value) {
      if(value === undefined) {
        // Inherit from the property class or from value type metadata.
        value = this._propClass.category || this._type.category;
      }

      // null || ""
      this._category = value || null;
    },
    //endregion

    //region helpUrl property

    // -> nonEmptyString, Optional,
    //    Inherited from property class or value type,
    //    Configurable, Localized?

    _helpUrl: null,

    get helpUrl() {
      return this._helpUrl;
    },

    set helpUrl(value) {
      if(value === undefined) {
        // Inherit from the property class or from value type metadata.
        value = this._propClass.helpUrl || this._type.helpUrl;
      }

      this._helpUrl = value || null;
    },
    //endregion

    //region browsable property

    // -> Optional, Configurable

    _browsable: undefined,

    get browsable() {
      return this._browsable;
    },

    set browsable(value) {
      if(value === undefined) {
        // Inherit from the property class.
        value = this._propClass.browsable;
      } else {
        this._browsable = !!value;
      }
    }
    //endregion

  });

  return Property;
});