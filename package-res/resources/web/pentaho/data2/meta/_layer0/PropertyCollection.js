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
  "./Property",
  "./PropertyClass",
  "pentaho/lang/Collection",
  "pentaho/util/arg",
  "pentaho/util/error",
  "pentaho/util/object"
], function(Property, PropertyClass, Collection, arg, error, O) {

  /**
   * @name PropertyCollection
   * @memberOf pentaho.data.meta
   * @class
   * @extends pentaho.lang.Collection
   * @implements pentaho.lang.IConfigurable
   *
   * @classdesc A collection of property classes.
   *
   * @description Initializes a property classes collection.
   * This constructor is used internally by the metadata package and should not be used directly.
   *
   * @see pentaho.data.meta.Property
   */
  return Collection.extend("pentaho.data.meta.PropertyCollection", /** @lends pentaho.data.meta.PropertyCollection# */{

    /**
     * Initializes a properties  collection.
     *
     * @param {Object} keyArgs Keyword arguments object.
     * @param {pentaho.data.meta.Complex} keyArgs.owner The complex type instance.
     * @ignore
     */
    constructor: function(keyArgs) {
      var ownerType = arg.required(keyArgs, "owner", "keyArgs");

      /**
       * The complex type instance that owns this collection.
       * @type pentaho.data.meta.Complex
       * @ignore
       */
      this._ownerType = ownerType;

      // J.I.C. assertion
      if(this.length) throw error.operInvalid("Should be created empty.");

      this.base();

      // "Derive" a `Property` from each of the `PropertyClass` in the owner property class collection.
      // Simply add that collection to `this` and each `PropertyClass` will be converted to a property.
      this.addMany(ownerType.constructor.properties);
    },

    //region List implementation
    elemClass: Property,

    _adding: function(propClass, index, ka) {
      if(!propClass) throw error.argRequired("props[i]");
      if(!(propClass instanceof PropertyClass)) throw error.argInvalidType("props[i]", "Not a `PropertyClass`.");

      // Create the property.
      var prop = new Property(this._ownerType, propClass);

      return this.base(prop, index, ka);
    },

    _replacing: function(spec, index, existing, ka) {
      throw error.operInvalid("Cannot move or remove existing properties.");
    },

    _cast: function(spec) {
      // For new, local properties.
      return Property.to(spec, this._ownerType);
    },
    //endregion

    //region IConfigurable implementation
    /**
     * Configures the properties in the collection.
     *
     * @param {Object.<string,pentaho.data.meta.spec.IPropertyConfig} propConfigs A map of property configurations.
     */
    configure: function(propConfigs) {
      O.eachOwn(propConfigs, function(propConfig, name) {
        var prop = this.get(name);
        if(prop) prop.configure(propConfig);
      }, this);
    }
    //endregion
  });
});