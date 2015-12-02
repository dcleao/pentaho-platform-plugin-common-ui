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
  "./PropertyClass",
  "pentaho/lang/Collection",
  "pentaho/util/arg",
  "pentaho/util/error"
], function(PropertyClass, Collection, arg, error) {

  /**
   * @name PropertyClassCollection
   * @memberOf pentaho.data.meta
   * @class
   * @extends pentaho.lang.Collection
   *
   * @classdesc A collection of property classes.
   *
   * @description Initializes a property classes collection.
   * This constructor is used internally by the metadata package and should not be used directly.
   *
   * @see pentaho.data.meta.Property
   */
  return Collection.extend("pentaho.data.meta.PropertyClassCollection", /** @lends pentaho.data.meta.PropertyClassCollection# */{

    /**
     * Initializes a property classes collection.
     *
     * @param {Class.<pentaho.data.meta.Complex>} declaringType The complex type class that declares
     *   non-inherited property classes.
     * @ignore
     */
    constructor: function(declaringType) {
      if(!declaringType) throw error.argRequired("declaringType");

      /**
       * The complex type class that owns this collection.
       * @type Class.<pentaho.data.meta.Complex>
       * @ignore
       */
      this._declaringType = declaringType;

      // Copy owner ancestor's properties.
      var ownerBase = this._declaringType.ancestor,
          colBase = ownerBase && ownerBase.properties;

      if(colBase) {
        // Backup any provided specs.
        var newProps;
        if(this.length) {
          newProps = this.slice();
          this.length = 0;
        }

        this.base();

        // All base properties. Preserve original positions.
        colBase.copyTo(this);

        // New/Override properties.
        if(newProps) this.addMany(newProps);
      } else {
        // Default: addMany of contained specs.
        this.base();
      }
    },

    //region List implementation
    elemClass: PropertyClass,

    _adding: function(spec, index, ka) {
      if(!spec) throw error.argRequired("props[i]");

      var name = getSpecName(spec), existing;
      if(name && (existing = this.get(name))) {
        // An object spec? Otherwise it's a noop.
        // Configure existing local property or override inherited one.
        if(spec !== name) {
          if(existing.declaringType === this._declaringType)
            existing.configure(spec);
          else
            this.replace(spec, this.indexOf(existing));
        }

        // And cancel add property.
        return;
      }

      return this.base.apply(this, arguments);
    },

    _replacing: function(spec, index, existing, ka) {
      if(!spec) throw error.argRequired("props[i]");

      var name = getSpecName(spec);
      if(name !== existing.name)
        throw error.argInvalid("props[i]", "Incorrect property name.");

      if(existing.declaringType === this._declaringType) {
        // Configure existing local property and cancel replace.
        // If spec is not an object, then it's a noop.
        if(spec !== name) existing.configure(spec);
        return;
      }

      // Replace with overridden property class.
      return existing.extend(spec, this._declaringType);
    },

    _cast: function(spec) {
      // For new, local properties.
      return PropertyClass.to(spec, this._declaringType);
    }
    //endregion
  });

  function getSpecName(spec) {
    return typeof spec === "string" ? spec : spec.name;
  }
});