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
  "../../util/text"
], function(Value, AnnotatableLinked, Base, error, text) {

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
   * @name pentaho.type.PropertyMeta
   *
   * @class
   * @sealed
   * @implements pentaho.lang.IWithKey
   * @implements pentaho.lang.IListElement
   * @implements pentaho.lang.ICollectionElement
   *
   * @classdesc The metadata of a property of a complex type.
   *
   * Example property:
   * ```javascript
   * require(["pentaho/type/PropertyMeta"], function(PropertyMeta) {
   *
   *   return new PropertyMeta({ // spec
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
   * @description Creates a `PropertyMeta`.
   *
   * This constructor is used internally by the type package and should not be used directly.
   */
  var PropertyMeta = Base.extend("pentaho.type.PropertyMeta", /** @lends pentaho.type.PropertyMeta# */{

    // TODO: countMin, countMax, required, applicable, readonly, visible, value, members?, p

    /**
     * Creates a _root_ `PropertyMeta` instance, given a property specification.
     *
     * Non-root properties are created by calling {@link pentaho.type.PropertyMeta#extend}
     * on the base property.
     *
     * @param {pentaho.type.spec.UPropertyMeta} spec A property name or specification object.
     * @param {Class.<pentaho.type.Complex.Meta>} declaringMetaCtor The metadata class of the complex type
     *    that declares the property.
     * @param {number} ordinal The index of the property within its complex type.
     * @ignore
     */
    constructor: function(spec, declaringMetaCtor, ordinal) {
      if(!spec) throw error.argRequired("spec");
      if(!declaringMetaCtor) throw error.argRequired("declaringMetaCtor");

      // A singular string property with the specified name.
      if(typeof spec === "string") spec = {name: spec};

      // Root attributes
      this._name = spec.name;
      if(!this._name) throw error.argRequired("spec.name");

      this._list = !!spec.list;

      this._root = this;

      // Others
      this._declaringMetaCtor = declaringMetaCtor;
      this._ordinal = ordinal;

      // Resolve value type synchronously.
      this._typeMetaCtor = declaringMetaCtor.prototype.context.get(spec.type).Meta;

      if(!("label" in spec)) this._label = text.titleFromName(this._name);

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
     * @param {pentaho.type.spec.UPropertyMeta} spec A property name or specification object.
     * @param {Class.<pentaho.type.Complex.Meta>} declaringMetaCtor The metadata class of the complex type
     *   that declares the sub-property.
     * @return {pentaho.type.PropertyMeta} The created `PropertyMeta`.
     * @ignore
     */
    extend: function(spec, declaringMetaCtor) {
      if(!spec) throw error.argRequired("spec");
      if(!declaringMetaCtor) throw error.argRequired("declaringMetaCtor");

      var subProp = Object.create(this);

      subProp._declaringMetaCtor = declaringMetaCtor;

      // Resolve value type synchronously.
      var ValueTypeMeta = spec.type != null
            ? declaringMetaCtor.prototype.context.get(spec.type).Meta
            : null;

      // Validate that it is a sub-type of the base property's type.
      if(ValueTypeMeta && ValueTypeMeta !== this._typeMetaCtor) {
        if(!(ValueTypeMeta.prototype instanceof this._typeMetaCtor))
          throw error.argInvalid(
              "spec.type",
              "Sub-property's 'type' does not derive from the base property's 'type'.");

        subProp._typeMetaCtor = ValueTypeMeta;
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

    /**
     * Configures a property.
     *
     * @param {!pentaho.type.spec.IPropertyMetaConfig} config A property configuration.
     * @ignore
     */
    _configure: function(config) {
      if(!config) throw error.argRequired("config");

      // undefined passes through.
      // Value semantics is determined by each setter.
      for(var p in config)
        if(configurableProps[p] === 1)
          this[p] = config[p];

      AnnotatableLinked.configure(this, config);
    },
    //endregion

    //region IListElement
    /**
     * Gets the singular name of `PropertyMeta` list-elements.
     * @type string
     * @readonly
     * @default "property"
     */
    elemName: "property",
    //endregion

    //region IWithKey implementation
    /**
     * Gets the singular name of `PropertyMeta` keys.
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
     * The metadata of the complex type that declares this property.
     *
     * @type pentaho.type.Complex.Meta
     * @readonly
     */
    get declaringType() {
      return this._declaringMetaCtor.the;
    },

    /**
     * The index of the property in the containing complex type.
     *
     * @type number
     * @readonly
     */
    get ordinal() {
      return this._ordinal;
    },

    /**
     * The root property.
     *
     * @type !pentaho.type.PropertyMeta
     * @readonly
     */
    get root() {
      return this._root;
    },

    /**
     * Gets a value that indicates if the property is the root property.
     * @type boolean
     */
    get isRoot() {
      return this._root === this;
    },

    /**
     * The base property, if any.
     *
     * @type ?pentaho.type.PropertyMeta
     * @readonly
     */
    get ancestor() {
      return this.isRoot ? null : Object.getPrototypeOf(this);
    },

    /**
     * The type of the _single_ values that the property can hold.
     *
     * @type !pentaho.type.Value.Meta
     * @readonly
     */
    get type() {
      return this._typeMetaCtor.the;
    },

    /**
     * The value of the property.
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

    //region label property
    // @type !nonEmptyString
    // -> nonEmptyString, Optional, Inheritable, Configurable, Localized
    // null or "" -> undefined conversion
    // default is a Capitalization of name
    _label: null,

    get label() {
      return this._label;
    },

    set label(value) {
      this._label = (value == null || value === "")
          ? text.titleFromName(this.name)
          : String(value);
    },
    //endregion

    //region description property
    // @type ?nonEmptyString
    // -> nonEmptyString, Optional, Inherited, Configurable, Localized
    // "" -> null
    _description: null,

    get description() {
      return this._description;
    },

    set description(value) {
      if(value === undefined) {
        if(this !== PropertyMeta.prototype) {
          delete this._description;
        }
      } else {
        // "" -> null
        this._description = nonEmptyString(value);
      }
    },
    //endregion

    //region category property
    // @type ?nonEmptyString
    // -> nonEmptyString, Optional, Inherited, Configurable, Localized
    // "" -> null
    _category: null,

    get category() {
      return this._category;
    },

    set category(value) {
      if(value === undefined) {
        if(this !== PropertyMeta.prototype) {
          delete this._category;
        }
      } else {
        // "" -> null
        this._category = nonEmptyString(value);
      }
    },
    //endregion

    //region helpUrl property
    // @type ?nonEmptyString
    // -> nonEmptyString, Optional, Inherited, Configurable, Localized
    // "" -> null
    _helpUrl: null,

    get helpUrl() {
      return this._helpUrl;
    },

    set helpUrl(value) {
      if(value === undefined) {
        if(this !== PropertyMeta.prototype) {
          delete this._helpUrl;
        }
      } else {
        // "" -> null
        this._helpUrl = nonEmptyString(value);
      }
    },
    //endregion

    //region browsable property
    // @type boolean
    // -> boolean, Optional(true), Inherited, Configurable
    // null || undefined -> reset
    _browsable: true,

    get browsable() {
      return this._browsable;
    },

    set browsable(value) {
      if(value == null) {
        if(this !== PropertyMeta.prototype) {
          delete this._browsable;
        }
      } else {
        this._browsable = !!value;
      }
    },
    //endregion

    //region advanced property
    // @type boolean
    // -> boolean, Optional(false), Inherited, Configurable
    // null || undefined -> reset
    _advanced: false,

    get advanced() {
      return this._advanced;
    },

    set advanced(value) {
      if(value == null) {
        if(this !== PropertyMeta.prototype) {
          delete this._advanced;
        }
      } else {
        this._advanced = !!value;
      }
    }
    //endregion

  }, /** @lends pentaho.type.PropertyMeta */{
    /**
     * Converts a property specification to a `PropertyMeta` instance.
     *
     * @param {pentaho.type.spec.UPropertyMeta} spec A property name or specification object.
     * @param {Class.<pentaho.type.Complex.Meta>} declaringMetaCtor The metadata class of the complex type
     *   that declares the property.
     * @param {number} ordinal The index of the property within its complex type.
     * @return {pentaho.type.PropertyMeta} The created `PropertyMeta` instance.
     */
    to: function(spec, declaringMetaCtor, ordinal) {
      return new PropertyMeta(spec, declaringMetaCtor, ordinal);
    }
  });

  function nonEmptyString(value) {
    return value == null ? null : (String(value) || null);
  }

  return PropertyMeta;
});
