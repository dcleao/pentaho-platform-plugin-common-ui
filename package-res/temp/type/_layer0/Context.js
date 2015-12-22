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
  "../../lang/Base",
  "../../util/error",
  "../../util/object"
], function(Value, Base, error, O) {

  "use strict";

  /**
   * @name pentaho.type.Context
   *
   * @class
   * @sealed
   * @classdesc The `Context` class contains `Value` instances _configured_ for a particular _context_.
   *
   * Contexts support the creation phase of `Value` instances,
   * by maintaining a dictionary with the instance of each `Value` class,
   * and also enable the definition of _recursive_ complex types.
   *
   * @description Creates a type domain.
   */
  return Base.extend(/** @lends pentaho.type.Domain# */{

    constructor: function() {
      // Instance by type uid
      this._byTypeUid = {};
    },

    /**
     * Obtains the type instance of a given type class, if one is present, or `null`, otherwise.
     *
     * @param {Class.<pentaho.type.Value>} Type The desired type class.
     * @param {boolean} [assertPresent=false] Indicates if an error should be thrown
     *   when an instance of the specified `Type` is not present in this context.
     * @return {pentaho.type.Value?} The type instance or `null`.
     * @throw {Error} When `assertPresent` is `true` and the specified `Type`
     *   is not present in this context.
     */
    get: function(Type, assertPresent) {
      if(!Type) throw error.argRequired("type");

      var uid = Type.prototype.uid,
          type = O.getOwn(this._byTypeUid, uid);

      if(!type && assertPresent)
        throw error.operInvalid("Type '" + Type.prototype.id + "' is not present.");

      return type || null;
    },

    /**
     * Adds a type instance to the context.
     *
     * @param {pentaho.type.Value} type The type to add.
     * @return {pentaho.type.Value} The added type.
     * @throw {Error} When An instance of the same type already exists.
     */
    add: function(type) {
      if(type == null) throw error.argRequired("type");

      if(!(type instanceof Value))
        throw error.argInvalidType("type", "Not a '" + Value.displayName + "'.");

      var uid = type.uid,
          existing = O.getOwn(this._byTypeUid, uid);
      if(existing) {
        if(existing !== type)
          throw error.argInvalid("type", "Already registered a different instance.");
        return type;
      }
      return (this._byTypeUid[uid] = type);
    },

    /**
     * Obtains the configuration for a given type class, if one is present, or `null`, otherwise.
     *
     * @param {Class.<pentaho.type.Value>} Type The type class.
     * @return {pentaho.type.spec.ITypeConfig} The type configuration or `null`.
     */
    getConfig: function(Type) {
      if(Type == null) throw error.argRequired("Type");
      // TODO:
      return null;
    }
  });
});
