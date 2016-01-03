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
  "./Item",
  "./value",
  "../../lang/_AnnotatableLinked",
  "../../util/arg",
  "../../util/error",
  "../../util/object",
  "../../util/text"
], function(Item, Value, AnnotatableLinked, arg, error, O, text) {

  "use strict";

  var configurableProps = {
          "label": 1,
          "description": 1,
          "category": 1,
          "helpUrl": 1,
          "defaultValue": 1,
          "format": 1,
          "browsable": 1
        },
      O_isProtoOf = Object.prototype.isPrototypeOf;

  /**
   * @name pentaho.type.Property
   *
   * @class
   * @extends pentaho.type.Item
   *
   * @classdesc A property of a complex value.
   *
   * @see pentaho.type.Complex
   * @description Creates a property.
   *
   * This constructor is used internally by the `pentaho/type` package and
   * should not be used directly.
   */

  /**
   * @name pentaho.type.Property.Meta
   *
   * @class
   * @extends pentaho.type.Item.Meta
   *
   * @implements pentaho.lang.IWithKey
   * @implements pentaho.lang.IListElement
   * @implements pentaho.lang.ICollectionElement
   * @implements pentaho.lang.IConfigurable
   *
   * @classdesc The metadata of a property of a complex type.
   *
   * @description Creates a property metadata instance.
   *
   * This constructor is used internally by the `pentaho/type` package and
   * should not be used directly.
   *
   * @see pentaho.type.Complex
   */
  var Property = Item.extend("pentaho.type.Property", /** @lends pentaho.type.Property# */{

    meta: /** @lends pentaho.type.Property.Meta# */{

      // TODO: countMin, countMax, required, applicable, readonly, visible, value, members?, p

      /**
       * Creates a property metadata instance, given a property specification.
       *
       * @param {pentaho.type.spec.UPropertyMeta} spec A property name or specification object.
       * @param {object} keyArgs Keyword arguments.
       * @param {pentaho.type.Complex.Meta} keyArgs.declaringMeta The metadata class of the complex type
       *    that declares the property.
       * @param {number} keyArgs.index The index of the property within its complex type.
       * @ignore
       */
      constructor: function(spec, keyArgs) {
        // A singular string property with the specified name.
        if(typeof spec === "string") spec = {name: spec};

        this.base(spec, keyArgs);
      },

      _init: function(spec, keyArgs) {

        this.base.apply(this, arguments);

        // TODO: Validate same context as base?

        O.setConst(this, "_declaringMeta", arg.required(keyArgs, "declaringMeta", "keyArgs"));
        O.setConst(this, "_isPropRoot", Object.getPrototypeOf(this).isRoot);

        if(this._isPropRoot)
          O.setConst(this, "_index", keyArgs.index || 0);
      },

      _postInit: function() {

        this.base.apply(this, arguments);

        if(this._isPropRoot) {
          // Required validation
          if(!this._name) this.name = null; // throws...

          // Force assuming default values
          if(!this._type)  this.type = null;
          if(!this._label) this._resetLabel();

          this._createValueAccessor();
        }
      },

      //region IConfigurable implementation

      // Used by constructor, createSub and PropertyMetaCollection._replace

      /**
       * Configures a property.
       *
       * @param {!pentaho.type.spec.IPropertyMetaConfig} config A property configuration.
       * @ignore
       */
      xconfigure: function(config) {
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
       * Gets the singular name of `Property.Meta` list-elements.
       * @type string
       * @readonly
       * @default "property"
       */
      elemName: "property",
      //endregion

      //region IWithKey implementation
      /**
       * Gets the singular name of `Property.Meta` keys.
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

      //region attributes
      //region context property
      /**
       * Gets the context of the property prototype.
       *
       * The context of a property is that of
       * the complex type that declares it.
       *
       * @type pentaho.type.IContext
       * @readonly
       */
      get context() {
        return this._declaringMeta.context;
      },
      //endregion

      //region declaringType attribute
      /**
       * The metadata of the complex type that declares this property.
       *
       * @type pentaho.type.Complex.Meta
       * @readonly
       */
      get declaringType() {
        return this._declaringMeta;
      },
      //endregion

      //region index attribute
      /**
       * The index of the property in the containing complex type.
       *
       * @type number
       * @readonly
       */
      get index() {
        return this._index;
      },
      //endregion

      //region name attribute

      // -> nonEmptyString, Required, Immutable, Root-only.
      _name: undefined,

      get name() {
        return this._name;
      },

      set name(value) {
        value = nonEmptyString(value);

        if(this._isPropRoot) {
          if(!value) throw error.argRequired("name");
          // Can only be set once,or throws.
          O.setConst(this, "_name", value);
          O.setConst(this, "_namePriv", "_" + value);
        } else {
          // Hierarchy consistency
          if(value && value !== this._name)
            throw error.argInvalid("name", "Sub-properties cannot change the 'name' attribute.");
        }
      },
      //endregion

      //region list attribute

      // -> Optional(false), Immutable, Root-only.
      _list: false,

      get list() {
        return this._list;
      },

      set list(value) {
        if(this._isPropRoot) {
          this._list = !!value;
        } else if(value != null) {
          // Hierarchy consistency
          value = !!value;
          if(value !== this._list)
            throw error.argInvalid("list", "Sub-properties cannot change the 'list' attribute.");
        }
      },
      //endregion

      //region value type attribute
      /**
       * The type of _singular_ values that the property can hold.
       *
       * @type !pentaho.type.Value.Meta
       * @readonly
       */
      get type() {
        return this._typeMeta;
      },

      set type(value) {
        // Resolves types synchronously.
        if(this._isPropRoot) {
          this._typeMeta = this.context.get(value).meta;
        } else if(value != null) {
          // Hierarchy consistency
          var typeMeta = this.context.get(value).meta;

          // Validate that it is a sub-type of the base property's type.
          if(typeMeta !== this._typeMeta) {
            if(!O_isProtoOf.call(typeMeta, this._typeMeta))
              throw error.argInvalid(
                  "type",
                  "Sub-properties must have a 'type' that derives from their base property's 'type'.");

            this._typeMeta = typeMeta;
          }
        }
      },
      //endregion

      //region value attribute
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
      //endregion

      //region label attribute
      // default is a Capitalization of name
      _resetLabel: function() {
        this._label = text.titleFromName(this.name);
      },
      //endregion

      //endregion

      //region value accessor
      _createValueAccessor: function() {
        var mesa = this._declaringMeta.mesa,
            name = this._name,
            namePriv = this._namePriv;

        if((name in mesa) || (namePriv in mesa))
          throw error.argInvalid("spec.name", "Property cannot have name '" + name + "' cause it's reserved.");

        // Receives a `Property` instance (see `Complex#constructor`).
        //mesa[namePriv] = new Property( ... );

        Object.defineProperty(mesa, name, {
          configurable: true,

          get: function propertyValueGetter() {
            return this[namePriv].value;
          },

          set: function propertyValueSetter(value) {
            this[namePriv].value = value;
          }
        });
      }
      //endregion
    } // end instance meta:
  });

  function nonEmptyString(value) {
    return value == null ? null : (String(value) || null);
  }

  return Property;
});
