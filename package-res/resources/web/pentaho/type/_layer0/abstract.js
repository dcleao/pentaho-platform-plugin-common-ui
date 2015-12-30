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
  "./Abstract.Meta",
  "../../lang/Base",
  "../../util/error",
  "../../util/object"
], function(AbstractMeta, Base, error, O) {

  "use strict";

  /**
   * @name pentaho.type.Abstract
   * @class
   * @abstract
   *
   * @classDesc The base abstract class of type classes, whatever their context.
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
    },

    //region meta property
    /**
     * Gets the metadata of this instance's type.
     *
     * @type pentaho.type.Value.Meta
     * @readonly
     */
    get meta() {
      return this.constructor.meta;
    },

    // Supports Meta instance-level configuration only. Can only be called on the prototype, through Type#implement!
    // Not documented on purpose, to avoid users trying to configure a type
    //  when they already have an instance of it, which is not supported...
    // However, this is the simplest and cleanest way to implement:
    //   Type.implement({meta: .})
    // to mean
    //   Type.Meta.implement(.).Value
    set meta(config) {
      var Type = this.constructor;
      if(this !== Type.prototype)
        throw error.operInvalid("Use `Type.implement({meta: ...})` instead.");

      if(config) Type.Meta.implement(config);
    }
    //endregion
  }, /** @lends pentaho.type.Abstract */{

    //region meta property
    // The binding between Abstract and Abstract.Meta is performed below, before return.
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

    // Supports Meta class-level configuration only.
    // Not documented on purpose.
    // Allows writing;
    //   Type.implementStatic({meta: .})
    // to mean:
    //   Type.Meta#implementStatic(.).Value
    set meta(config) {
      if(config) this.Meta.implementStatic(config);
    },
    //endregion

    // @override
    _extend: function(name, instSpec, classSpec) {
      if(!instSpec) instSpec = {};

      // MESA I
      // Create class but don't apply instSpec,
      // as this may need to override property accessors only defined by Meta.
      var DerivedMesa = this.base(name, instSpec.constructor && {constructor: instSpec.constructor});

      // META I
      var metaInstSpec  = O["delete"](instSpec,  "meta"),
          metaClassSpec = O["delete"](classSpec, "meta");

      // -> requires Mesa to already exist, to be able to define accessors
      // -> Initial Meta.extend call explicitly only applies the `id` and `constructor` properties
      //    (and any other immutable, shared props any sub-classes may have; See AbstractMeta._extend).
      var DerivedMeta = this.Meta.extend(name && (name + ".Meta"), metaInstSpec, metaClassSpec);

      // Bind the two classes together
      DerivedMeta.Mesa = DerivedMesa;
      DerivedMesa.Meta = DerivedMeta;

      // META II
      DerivedMeta.mix(metaInstSpec, metaClassSpec);

      // MESA II
      // Note: mix does not apply the `constructor` property, if any.
      return DerivedMesa.mix(instSpec, classSpec);
    }
  });

  Abstract.Meta = AbstractMeta;
  AbstractMeta.Mesa = Abstract;

  return Abstract;
});
