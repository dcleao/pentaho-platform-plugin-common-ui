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
  "../lang/Base",
  "../util/object"
], function(Base, O) {

  "use strict";

  /**
   * @name pentaho.type.SpecificationScope
   * @class
   * @amd pentaho/type/SpecificationScope
   *
   * @classDesc A `SpecificationScope` object holds information that is
   * shared during the serialization (or conversion to specification) of an instance or type.
   *
   * Specifically, a scope tracks the temporary ids assigned to referenced anonymous types.
   *
   * @constructor
   * @description Creates a `SpecificationScope`.
   */
  var SpecificationScope = Base.extend(/** @lends pentaho.type.SpecificationScope# */{

    constructor: function() {
      /**
       * The type specifications already described in the scope.
       *
       * @type {Object.<string, Object>}
       * @private
       */
      this._typeSpecsByUid = {};

      /**
       * The next number that will be used to build a temporary id.
       * @type {number}
       * @private
       */
      this._nextId = 1;
    },

    /**
     * Gets the id of a type, if it has one, or its temporary id within this scope, if not.
     *
     * If the given type is anonymous and also hasn't been added to this scope, `null` is returned.
     *
     * @param {pentaho.type.Type} type The type.
     *
     * @return {?nonEmptyString} The id of the type within this scope, or `null`.
     */
    getIdOf: function(type) {
      return type.id || O.getOwn(this._typeSpecsByUid, type.uid) || null;
    },

    /**
     * Adds a type to the scope.
     *
     * If the given type is not anonymous, its id is returned.
     * Else, if the anonymous type had already been added to the scope,
     * its temporary id is returned.
     * Else, the anonymous type is added to the scope
     * and a temporary id is generated for it and returned.
     *
     * @param {pentaho.type.Type} type The type to add.
     *
     * @return {nonEmptyString} The id of the type within this scope.
     */
    add: function(type) {
      var id = type.id, uid;
      if(!id && !(id = O.getOwn(this._typeSpecsByUid, (uid = type.uid)))) {
        id = "_" + (this._nextId++);
        this._typeSpecsByUid[uid] = id;
      }

      return id;
    },

    dispose: function() {

    }
  });

  return SpecificationScope;
});
