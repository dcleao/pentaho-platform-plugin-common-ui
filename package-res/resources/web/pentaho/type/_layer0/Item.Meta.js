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
  "../../util/arg",
  "../../util/fun",
  "../../util/object"
], function(bundle, Base, AnnotatableLinked, error, arg, fun, O) {

  "use strict";

  // Unique item class id exposed through Item.Meta#uid and used by Context instances.
  var _nextUid = 1;

  /**
   * @name pentaho.type.Item.Meta
   * @class
   * @abstract
   *
   * @classDesc The base abstract _metadata_ class of _items_, whatever their context.
   *
   * _Meta_ classes do not create instances. Instead, their constructor is used to:
   * 1. initialize _prototype_ instances
   * 2. hold static members.
   *
   * The _mesadata_ (prototype) of this class can be accessed through {@link pentaho.type.Item.Meta#mesa}.
   *
   * @description Initializes an item metadata instance.
   */
  var ItemMeta = Base.extend("pentaho.type.Item.Meta",
      /** @lends pentaho.type.Item.Meta# */{

    constructor: function(instSpec, keyArgs) {
      if(!instSpec) instSpec = {};

      this._init(instSpec, keyArgs);

      this.extend(instSpec);

      this._postInit(instSpec, keyArgs);
    },

    _init: function(instSpec, keyArgs) {
      O.setConst(this, "_uid", _nextUid++);

      // Bind
      var mesa = arg.required(keyArgs, "mesa", "keyArgs");
      O.setConst(mesa, "_meta", this);
      O.setConst(this, "mesa",  mesa);

      // Hierarchy
      O.setConst(this, "proto", this);
      if(!this.root && this !== ItemMeta.prototype)
        O.setConst(this, "root", this);

      // Block inheritance, with default values
      this._styleClass = null;
      this._ordinal    = 0;
      this._label      = null;
    },

    _postInit: function(instSpec, keyArgs) {
    },

    //region uid property
    _uid: null,

    /**
     * Gets the unique item type id (auto-generated).
     *
     * Note that even anonymous item types -
     * that do not have a {@link pentaho.type.Value.Meta#id} -
     * have an unique-id.
     *
     * This attribute is (obviously) not inherited.
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
     * Gets the context where this item type is defined.
     *
     * @name context
     * @memberOf pentaho.type.Item.Meta#
     * @type pentaho.type.IContext
     * @readonly
     * @abstract
     * @see pentaho.type.Item.Meta#root
     */
    //endregion

    //region proto property
    // Set on `Item._extend`
    /**
     * Gets the closest _prototype_, possibly itself.
     *
     * @name proto
     * @memberOf pentaho.type.Item.Meta#
     * @type !pentaho.type.Item.Meta
     * @readonly
     * @see pentaho.type.Item.Meta#root
     * @see pentaho.type.Item.Meta#ancestor
     */
    //endregion

    //region root property
    // root must be set on direct sub-classes of Item
    // the "proto" which has no "proto" above it
    // Set on Item.Meta._extend
    /**
     * Gets the root _prototype_ item.
     *
     * Root item types are the immediate sub-types of _item_.
     * An _item_, by itself, is meaningless or totally abstract,
     * a _root item_ is not.
     *
     * The `Item` type is the head of a _forest_ composed of
     * type trees which are rooted in _root item types_.
     *
     * @name root
     * @memberOf pentaho.type.Item.Meta#
     * @type pentaho.type.Item.Meta
     * @readonly
     * @see pentaho.type.Item.Meta#ancestor
     * @see pentaho.type.Item.Meta#proto
     */

    /**
     * Gets a value that indicates if the item is a tree root _prototype_.
     *
     * @type boolean
     * @readonly
     */
    get isRoot() {
      return this === this.root;
    },
    //endregion

    //region ancestor property
    /**
     * Gets the closest **ancestor** _prototype_ item of the current tree, if any, or `null`.
     *
     * The root item returns `null`.
     *
     * @type pentaho.type.Item.Meta
     * @readonly
     */
    get ancestor() {
      if(this.isRoot) return null;

      var proto = this.proto;
      return (proto !== this ? proto : Object.getPrototypeOf(proto).proto) || null;
    },
    //endregion

    //region mesa property
    // Set on `Item._extend`
    /**
     * Gets the _mesadata_ _prototype_ of this item type.
     *
     * @name mesa
     * @memberOf pentaho.type.Item.Meta#
     * @type pentaho.type.Item
     * @readonly
     * @see pentaho.type.Item#meta
     */
    //endregion

    //region id property

    // -> nonEmptyString, Optional(null), Immutable, Shared (note: not Inherited)
    // "" -> null conversion

    _id: null,

    /**
     * Gets the id of the item type.
     *
     * Can only be specified when extending an item type.
     *
     * Only item types which have an associated AMD/RequireJS module have an id.
     * However, note that all have a {@link pentaho.type.Item.Meta#uid}.
     *
     * This attribute is not inherited.
     *
     * @type ?nonEmptystring
     * @readonly
     */
    get id() {
      return this._id;
    },

    set id(value) {
      // Can only be set once or throws.
      O.setConst(this, "_id", nonEmptyString(value));
    },
    //endregion

    //region label property
    // @type !nonEmptyString
    // -> nonEmptyString, Optional, Inherited, Configurable, Localized
    // null or "" -> undefined conversion

    _label: null,

    _resetLabel: function() {
      if(!this.isRoot) {
        delete this._label;
      }
    },

    get label() {
      return this._label;
    },

    set label(value) {
      // null or "" -> undefined conversion
      if(value == null || value === "") {
        this._resetLabel();
      } else {
        this._label = String(value);
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
        if(!this.isRoot) {
          delete this._description;
        }
      } else {
        this._description = nonEmptyString(value);
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
        if(!this.isRoot) {
          delete this._category;
        }
      } else {
        this._category = nonEmptyString(value);
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
        if(!this.isRoot) {
          delete this._helpUrl;
        }
      } else {
        this._helpUrl = nonEmptyString(value);
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
        if(!this.isRoot) {
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
        if(!this.isRoot) {
          delete this._advanced;
        }
      } else {
        this._advanced = !!value;
      }
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
      this._styleClass = nonEmptyString(value);
    },
    //endregion

    //region ordinal property
    // @type integer
    // -> Optional(0), Configurable

    _ordinal: null,

    get ordinal() {
      return this._ordinal;
    },

    set ordinal(value) {
      this._ordinal = value == null ? 0 : Math.floor((+value) || 0);
    },
    //endregion

    /**
     * Creates a sub-prototype of this one.
     *
     * This method creates a _prototype_ which does not have an own constructor.
     * The current constructor is kept.
     *
     * Do not use this method directly.
     * Use {@link pentaho.type.Item#extendProto} instead.
     *
     * @param {object} instSpec The prototype specification.
     * @param {object} keyArgs Keyword arguments.
     * @param {pentaho.type.Item} keyArgs.mesa The corresponding _sub-mesadata_ item.
     *
     * @return {pentaho.type.Item.Meta} The new sub-prototype.
     */
    extendProto: function(instSpec, keyArgs) {
      var subMeta = Object.create(this);

      // NOTE: `subMeta.constructor` is still the "base" constructor.
      subMeta.constructor(instSpec, keyArgs);

      return subMeta;
    }
  }, /** @lends pentaho.type.Item.Meta */{

    /**
     * Gets the class of which this one is the metadata class.
     *
     * If you're wondering were this name comes from,
     * "Mesa" is a Greek word which is opposite to "Meta".
     * See {@link http://www.gwiznlp.com/wp-content/uploads/2014/08/Whats-the-opposite-of-meta.pdf}.
     *
     * @name Mesa
     * @memberOf pentaho.type.Item.Meta
     * @type Class.<pentaho.type.Item>
     * @readonly
     */

    /**
     * @override
     * @ignore
     */
    _subClassed: function(SubMeta, instSpec, classSpec, keyArgs) {

      SubMeta._initMesa(keyArgs.mesa.constructor, instSpec, keyArgs);

      if(classSpec) SubMeta.implementStatic(classSpec);
    },

    // NOTE: optionally receiving `keyArgs` as an optimization.
    // `_subClassed` is given a _derived_ `keyArgs`
    // that can/should be passed to `this`(constructor).
    _initMesa: function(Mesa, instSpec, keyArgs) {

      Object.defineProperty(Mesa, "Meta", {value: this});
      Object.defineProperty(this, "Mesa", {value: Mesa});

      this.call(this.prototype, instSpec, keyArgs || {mesa: Mesa.prototype});
    }
  })
  .implement(AnnotatableLinked);

  function nonEmptyString(value) {
    return value == null ? null : (String(value) || null);
  }

  return ItemMeta;
});
