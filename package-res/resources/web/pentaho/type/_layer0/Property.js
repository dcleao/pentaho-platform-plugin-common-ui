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
  "../../util/error",
  "../../util/arg",
  "../../util/text",
  "../../util/object"
], function(Base, error, arg, text, O) {

  "use strict";

  // TODO: self-recursive complexes won't work if we don't handle them specially:
  // Component.parent : Component
  // Will cause requiring Component during it's own build procedure...
  // Need to recognize requests for the currently being built _top-level_ complex in a special way -
  // the one that can not be built and have a module id.
  // ^ This should be handled by the type IContext, used below.

  /**
   * @name pentaho.type.Property
   *
   * @class
   * @sealed
   * @implements pentaho.lang.IConfigurable
   * @implements pentaho.lang.IWithKey
   * @implements pentaho.lang.IListElement
   * @implements pentaho.lang.ICollectionElement
   *
   * @classdesc The class of properties of a complex type instance.
   *
   * Example property class usage:
   * ```javascript
   * require(["pentaho/type/Property"], function(Property) {
   *
   *   return new Property({ // spec
   *     // 1. An AMD id, identified by having at least one "/"
   *     // 2. A string, which is prepended with
   *     //    "pentaho/type/" to form a full type amd id
   *     //    in which case it _must_ be an already loaded AMD module.
   *     // 3. An instance of `pentaho/type/Value`.
   *     type: "string",
   *     name: "name",
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
   * @see pentaho.type.Complex
   * @description Creates a property instance.
   *
   * This constructor is used internally by the type package and should not be used directly.
   */
  var Property = Base.extend("pentaho.type.Property", /** @lends pentaho.type.Property# */{

    // TODO: countMin, countMax, required, applicable, readonly, visible, defaultValue, members?, p

    /**
     * Creates a property instance.
     *
     * @param {pentaho.type.Complex} ownerType The complex type that holds this property.
     * @param {pentaho.type.PropertyClass} propClass The property's `PropertyClass`.
     * @ignore
     */
    constructor: function(ownerType, propClass) {
      if(!ownerType) throw error.argRequired("ownerType");
      if(!propClass) throw error.argRequired("propClass");

      this._ownerType = ownerType;
      this._propClass = propClass;

      this._name = propClass.name;
      this._list = propClass.list;
      this._type = ownerType._context.get(propClass.type, /* assertPresent: */true);

      // Obtain this property's configuration, which is, actually,
      // provided as part of the owner type's configuration.
      var ownerConfig = ownerType._context.getConfig(ownerType.constructor),
          config = ownerConfig && ownerConfig.props && ownerConfig.props[propClass.name];

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
     * The complex type that owns this property.
     *
     * @type !pentaho.type.Complex
     * @readonly
     * @immutable
     */
    get ownerType() {
      return this._ownerType;
    },

    /**
     * The type of the values that the property can hold.
     *
     * @type !pentaho.type.Value
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
        // Inherit from the property class or from the value type.
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
        // Inherit from the property class or from the value type.
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
        // Inherit from the property class or from the value type.
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
        // Inherit from the property class or from the value type.
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
