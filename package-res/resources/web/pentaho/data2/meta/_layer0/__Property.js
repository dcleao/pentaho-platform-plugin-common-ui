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
  "../../../util/text"
], function(Type, Base, error, arg, text) {

  /**
   * @name pentaho.data.meta.Property
   *
   * @class
   * @abstract
   * @implements pentaho.lang.IConfigurable
   * @implements pentaho.lang.IWithKey
   * @implements pentaho.lang.IListElement
   * @implements pentaho.lang.ICollectionElement
   *
   * @classdesc The metadata class of properties of a complex value type.
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
   * @description Creates a property metadata instance, given a configuration.
   * @param {pentaho.data.meta.Complex} [declaringType=null] The complex type that declares this property.
   * @param {pentaho.data.meta.Property} [ancestorProp=null] The base property metadata instance.
   */
  var Property = Base.extend("pentaho.data.meta.Property", /** @lends pentaho.data.meta.Property# */{

    // TODO: countMin, countMax, required, applicable, readonly, visible, defaultValue, members?, p

    constructor: function(declaringType, ancestorProp) {
      if(!declaringType) throw error.argRequired("declaringType");
      if(!ancestorProp) throw error.argRequired("ancestorProp");

      var ValueType = this.constructor.type;

      this._declaringType = declaringType;
      this._ancestor = ancestorProp;
      this._type = new ValueType();

      // These must explicitly be set in the constructor to force proper initialization.
      this.label =
      this.description =
      this.category =
      this.helpUrl = undefined;
    },

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
     * The complex type that declares this property.
     *
     * @type !pentaho.data.meta.Complex
     * @readonly
     */
    get declaringType() {
      return this._declaringType;
    },

    /**
     * The base property, if any.
     *
     * @type ?pentaho.data.meta.Property
     * @readonly
     */
    get ancestor() {
      return this._ancestor;
    },

    /**
     * The metadata instance of the type of _single_ values that the property can hold.
     *
     * @type !pentaho.data.meta.Type
     * @readonly
     */
    get type() {
      return this._type;
    },

    //region name property

    // -> nonEmptyString, Required, Immutable,
    //    Set at extension time, or inherited from #type.name or #type.namePlural according to #list.

    _name: undefined,

    get name() {
      return this._name;
    },
    //endregion

    //region list property

    // -> Optional(false), Immutable, Set at extension time of the root property.
    _list: false,

    get list() {
      return this._list;
    },
    //endregion

    //region label property

    // -> nonEmptyString, Required,
    //    Set at extension time, or
    //    Inherited from #type.label or #type.labelPlural, according to #list,
    //    Configurable, Localized

    _label: undefined,

    get label() {
      return this._label;
    },

    set label(value) {
      if(value === undefined) {
        // Inherit from the ancestor property or from value type metadata.
        if(this._ancestor) {
          delete this._label;
          return;
        }

        value = (this._list && this._type.labelPlural) || this._type.label;

        if(!value) value = text.titleFromName(this._name);
      } else {
        // null || ""
        if(!value) throw error.argRequired("label");
      }

      this._label = value;
    },
    //endregion

    //region description property

    // -> nonEmptyString, Optional,
    //    Set at extension time or Inherited from #type.description,
    //    Configurable, Localized

    _description: null,

    get description() {
      return this._description;
    },

    set description(value) {
      if(value === undefined) {
        // Inherit from the ancestor property or from value type metadata.
        if(this._ancestor) {
          delete this._description;
          return;
        }

        value = this._type.description;
      }

      this._description = value || null;
    },
    //endregion

    //region category property

    // -> nonEmptyString, Optional,
    //    Set at extension time or Inherited from #type.category
    //    Configurable, Localized

    _category: null,

    get category() {
      return this._category;
    },

    set category(value) {
      if(value === undefined) {
        // Inherit from the ancestor property or from value type metadata.
        if(this._ancestor) {
          delete this._category;
          return;
        }

        value = this._type.category;
      }

      // null || ""
      this._category = value || null;
    },
    //endregion

    //region helpUrl property

    // -> nonEmptyString, Optional,
    //    Set at extension time or Inherited from #type.helpUrl
    //    Configurable, Localized?

    _helpUrl: null,

    get helpUrl() {
      return this._helpUrl;
    },

    set helpUrl(value) {
      if(value === undefined) {
        // Inherit from the ancestor property or from value type metadata.
        if(this._ancestor) {
          delete this._helpUrl;
          return;
        }

        value = this._type.helpUrl;
      }

      this._helpUrl = value || null;
    },
    //endregion

    //region browsable property

    // -> Optional(true), Configurable

    _browsable: true,

    get browsable() {
      return this._browsable;
    },

    set browsable(value) {
      if(value === undefined) {
        delete this._browsable;
      } else {
        this._browsable = !!value;
      }
    }
    //endregion


  }, /** @lends pentaho.data.meta.Property */{
    /**
     * Creates a subclass of this property metadata class.
     *
     * @name pentaho.data.meta.Property.extend
     *
     * @param {string} [name] The name of the property metadata sub-class.
     * @param {pentaho.data.meta.spec.IProperty} propSpec The property metadata specification.
     * @param {Object} [classSpec] Class-level members of the property metadata class.
     *
     * @return {Class.<pentaho.data.meta.Property>} The created property metadata sub-class.
     */

    // TODO: self-recursive complexes won't work if we don't handle them specially:
    // Component.parent : Component
    // Will cause requiring Component during it's own build procedure...
    // Need to recognize requests for the currently being built _top-level_ complex in a special way -
    // the one that can not be built and have a module id.

    _extend: function(name, propSpec, classSpec) {

      var BaseProperty = this === Property ? null : this;

      // Consume properties that have special handling.
      var typeSpec = consumeProp(propSpec, "type"),
          isList   = consumeProp(propSpec, "list"),
          propName = consumeProp(propSpec, "name");

      // Resolve value type synchronously.
      var ValueType = Type.resolve(typeSpec);

      if(BaseProperty) {
        // Hierarchy consistency of the special properties `name` and `list`.
        if(propName && propName !== BaseProperty.prototype.name)
          throw error.argInvalid("propSpec.name", "Sub-property has a different 'name' value.");

        if(isList != null && (!!isList) !== BaseProperty.prototype.list)
          throw error.argInvalid("propSpec.list", "Sub-property has a different 'list' value.");

      } else if(!propName) {
        // The default property name is the name of the property's value type.
        propName = ValueType.prototype[isList ? "name" : "namePlural"];
        if(!propName) throw error.argRequired("propSpec.name");
      }

      // The only property that can only be passed in #extend is `propSpec.constructor`.
      var DerivedProperty = this.base({constructor: propSpec.constructor}, classSpec);

      // All of the following must be set _before_ any of the remaining properties are set,
      // through implement(propSpec).

      // static get type() : Class.<Type>
      DerivedProperty._type = ValueType;

      var derivedProto = DerivedProperty.prototype;
      if(!BaseProperty) {
        // Only a root property stores `name` and `list`.
        derivedProto._name = propName;
        derivedProto._list = !!isList;
      }

      // ----

      // TODO: remove any known _ fields from propSpec (_name, _list, _type, ...).
      // (the problem of using extend for get/set is that everything is copied, even, possibly, private fields...)

      return DerivedProperty.implement(propSpec);
    },

    //region type property

    // -> Required, Immutable, Set when extending.
    _type: undefined,

    /**
     * Gets the type metadata class of the _single_ values that the property can hold.
     *
     * @type Class.<pentaho.data.meta.Type>
     * @readonly
     */
    get type() {
      return this._type;
    }
    //endregion
  });

  return Property;

  function consumeProp(o, p) {
    var v;
    if(o && (p in o)) {
      v = o[p];
      delete o[p];
    }
    return v;
  }
});