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
  "../../../lang/_AnnotatableLinked",
  "../../../lang/Base",
  "../../../util/error"
], function(Type, AnnotatableLinked, Base, error) {

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
   * @name pentaho.data.meta.PropertyClass
   *
   * @class
   * @sealed
   * @implements pentaho.lang.IWithKey
   * @implements pentaho.lang.IListElement
   * @implements pentaho.lang.ICollectionElement
   *
   * @classdesc Describes a property class of complex type class.
   *
   * Example property metadata:
   * ```javascript
   * require(["pentaho/data/meta/Property"], function(PropertyMeta) {
   *
   *   return new PropertyClass({ // spec
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
   * @description Creates a `PropertyClass` instance.
   *
   * This constructor is used internally by the metadata package and should not be used directly.
   */
  var PropertyClass = Base.extend("pentaho.data.meta.PropertyClass", /** @lends pentaho.data.meta.PropertyClass# */{

    // TODO: countMin, countMax, required, applicable, readonly, visible, defaultValue, members?, p

    /**
     * Creates a _root_ `PropertyClass` instance, given a property class specification.
     *
     * Non-root property classes are created by calling {@link pentaho.data.meta.PropertyClass#extend}
     * on the base property class.
     *
     * @param {pentaho.data.meta.spec.UProperty} spec A property name or specification object.
     * @param {Class.<pentaho.data.meta.Complex>} declaringType The complex type class that declares the property.
     * @ignore
     */
    constructor: function(spec, declaringType) {
      if(!spec) throw error.argRequired("spec");
      if(!declaringType) throw error.argRequired("declaringType");

      if(typeof spec === "string") spec = {name: spec};

      this._root = this;
      this._declaringType = declaringType;

      // Resolve value type synchronously.
      this._type = Type.resolve(spec.type);
      this._list = !!spec.list;

      var name = spec.name;
      if(!name) {
        // The default property name is the name of the property's value type.
        name = this._type.prototype[this._list ? "namePlural" : "name"];
        if(!name) throw error.argRequired("spec.name");
      }
      this._name = name;

      this._configure(spec);
    },

    // TODO: self-recursive complexes won't work if we don't handle them specially:
    // Component.parent : Component
    // Will cause requiring Component during it's own build procedure...
    // Need to recognize requests for the currently being built _top-level_ complex in a special way -
    // the one that can not be built and have a module id.

    /**
     * Creates a sub-property class of this one given its specification.
     *
     * @param {pentaho.data.meta.spec.UProperty} spec A property name or specification object.
     * @param {Class.<pentaho.data.meta.Complex>} declaringType The complex type class that declares the sub-property.
     * @return {pentaho.data.meta.PropertyClass} The created `PropertyClass`.
     * @ignore
     */
    extend: function(spec, declaringType) {
      if(!spec) throw error.argRequired("spec");
      if(!declaringType) throw error.argRequired("declaringType");

      var subProp = Object.create(this);

      subProp._declaringType = declaringType;
      subProp._root = this._root;

      // Resolve value type synchronously.
      var ValueType = spec.type != null ? Type.resolve(spec.type) : null;

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

    //region Private IConfigurable implementation

    // Only used by constructor and extend.
    // It is Property that is configurable by the user, not PropertyClass.

    /**
     * Configures a property class.
     *
     * @param {!pentaho.data.meta.spec.IPropertyClassConfig} config A property class configuration.
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
    elemName: "property class",
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
     * The complex type class that declares this property class.
     *
     * @type !Class.<pentaho.data.meta.Complex>
     * @readonly
     */
    get declaringType() {
      return this._declaringType;
    },

    /**
     * The root property class.
     *
     * @type !pentaho.data.meta.PropertyClass
     * @readonly
     */
    get root() {
      return this._root;
    },

    /**
     * The base property class, if any.
     *
     * @type ?pentaho.data.meta.PropertyClass
     * @readonly
     */
    get ancestor() {
      return this.root === this ? null : Object.getPrototypeOf(this);
    },

    /**
     * The type class of the _single_ values that the property can hold.
     *
     * @type !Class.<pentaho.data.meta.Type>
     * @readonly
     */
    get type() {
      return this._type;
    },

    //region name property

    // -> nonEmptyString, Required, Immutable,
    //    Same as base property class or, when a root property class,
    //    defaults from #type#name or #type#namePlural according to #list.
    _name: undefined,

    get name() {
      return this._name;
    },
    //endregion

    //region list property

    // -> Optional(false), Immutable,
    //    Same as base property or, when a root property, defaults to false.
    _list: false,

    get list() {
      return this._list;
    },
    //endregion

    // -----------------

    //region label property

    // -> nonEmptyString, Optional, Configurable, Localized
    // undefined sets the default (inherit; root undefined)
    // "" -> null conversion
    _label: undefined,

    get label() {
      return this._label;
    },

    set label(value) {
      if(value === undefined) {
        delete this._label;
      } else {
        this._label = value || null;
      }
    },
    //endregion

    //region description property

    // -> nonEmptyString, Optional, Inherited, Configurable, Localized
    // undefined sets the default (inherit; root undefined)
    // "" -> null conversion

    _description: undefined,

    get description() {
      return this._description;
    },

    set description(value) {
      if(value === undefined)
        delete this._description;
      else
        this._description = value || null;
    },
    //endregion

    //region category property

    // -> nonEmptyString, Optional, Inherited, Configurable, Localized
    // undefined sets the default (inherit; root undefined)
    // "" -> null conversion

    _category: undefined,

    get category() {
      return this._category;
    },

    set category(value) {
      if(value === undefined)
        delete this._category;
      else
        this._category = value || null;
    },
    //endregion

    //region helpUrl property

    // -> nonEmptyString, Optional, Inherited, Configurable, Localized?
    // undefined sets the default (inherit; root undefined)
    // "" -> null conversion

    _helpUrl: undefined,

    get helpUrl() {
      return this._helpUrl;
    },

    set helpUrl(value) {
      if(value === undefined)
        delete this._helpUrl;
      else
        this._helpUrl = value || null;
    },
    //endregion

    //region browsable property

    // -> Optional(true), Configurable
    // undefined sets the default (inherit; root true)
    // other -> Boolean(other) conversion
    _browsable: true,

    get browsable() {
      return this._browsable;
    },

    set browsable(value) {
      if(value === undefined)
        delete this._browsable;
      else
        this._browsable = !!value;
    }
    //endregion
  }, /** @lends pentaho.data.meta.PropertyClass */{
    /**
     * Converts a property specification to a `PropertyClass` instance.
     *
     * @param {pentaho.data.meta.spec.UProperty} spec A property name or specification object.
     * @param {Class.<pentaho.data.meta.Complex>} declaringType The complex type class that declares the property.
     * @return {pentaho.data.meta.PropertyClass} The created `PropertyClass` instance.
     */
    to: function(spec, declaringType) {
      return new PropertyClass(spec, declaringType);
    }
  });

  return PropertyClass;
});