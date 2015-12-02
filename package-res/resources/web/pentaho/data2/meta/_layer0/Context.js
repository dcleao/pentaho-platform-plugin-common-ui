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
  "../../../util/object"
], function(Type, Base, error, O) {

  "use strict";

  /**
   * @name pentaho.data.meta.Context
   *
   * @class
   * @sealed
   * @classdesc The `Context` class contains metadata `Type` instances _configured_ for a particular _context_.
   *
   * Contexts support the creation phase of `Type` instances,
   * by maintaining a dictionary with the instance of each `Type` class,
   * and also enable the definition of _recursive_ complex types.
   *
   * @description Creates metadata domain.
   */
  return Base.extend(/** @lends pentaho.data.meta.Domain# */{

    constructor: function() {
      // Instance by type uid
      this._byTypeUid = {};
    },

    /**
     * Obtains the type instance of a given type class, if one is present, or `null`, otherwise.
     *
     * @param {Class.<pentaho.data.meta.Type>} Type The desired type class.
     * @param {boolean} [assertPresent=false] Indicates if an error should be thrown
     *   when an instance of the specified `Type` is not present in this context.
     * @return {pentaho.data.meta.Type?} The type instance or `null`.
     * @throw {Error} When `assertPresent` is `true` and the specified `Type`
     *   is not present in this context.
     */
    ff,

    /**
     * Adds a type instance to the context.
     *
     * @param {pentaho.data.meta.Type} type The type to add.
     * @return {pentaho.data.meta.Type} The added type.
     * @throw {Error} When An instance of the same type already exists.
     */
    add: function(type) {
      if(type == null) throw error.argRequired("type");

      if(!(type instanceof Type))
        throw error.argInvalidType("type", "Not a '" + Type.displayName + "'.");

      var uid = type.uid,
          existing = O.getOwn(this._byTypeUid, uid);
      if(existing) {
        if(existing === type) return type;
        throw error.argInvalid("type", "Already registered a different instance.");
      }
      return (this._byTypeUid[uid] = type);
    },

    /**
     * Obtains the configuration for a given type class, if one is present, or `null`, otherwise.
     *
     * @param {Class.<pentaho.data.meta.Type>} Type The type class.
     * @return {pentaho.data.meta.spec.ITypeConfig} The type configuration or `null`.
     */
    getConfig: function(Type) {
      if(Type == null) throw error.argRequired("Type");
      // TODO:
      return null;
    }
  });
});