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
  "./PropertyDef",
  "../../lang/Collection",
  "../../util/arg",
  "../../util/error"
], function(PropertyDef, Collection, arg, error) {

  "use strict";

  /**
   * @name PropertyDefCollection
   * @memberOf pentaho.type
   * @class
   * @extends pentaho.lang.Collection
   *
   * @classDesc A collection of properties.
   *
   * @description Initializes a property collection.
   * This constructor is used internally by the type package and should not be used directly.
   *
   * @see pentaho.type.PropertyDef
   */
  return Collection.extend("pentaho.type.PropertyDefCollection", /** @lends pentaho.type.PropertyDefCollection# */{

    /**
     * Initializes a property collection.
     *
     * @param {Class.<pentaho.type.Complex>} declaringTypeCtor The complex type class that declares non-inherited properties.
     * @ignore
     */
    constructor: function(declaringTypeCtor) {
      if(!declaringTypeCtor) throw error.argRequired("declaringTypeCtor");

      /**
       * The complex type class that _owns_ this collection.
       * @type Class.<pentaho.type.Complex>
       * @ignore
       */
      this._declaringTypeCtor = declaringTypeCtor;

      // Copy owner's ancestor's properties.
      var ownerBase = this._declaringTypeCtor.ancestor,
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

        // Create/Override properties.
        if(newProps) this.addMany(newProps);
      } else {
        // Default: calls `addMany` on contained specs.
        this.base();
      }
    },

    //region List implementation
    elemClass: PropertyDef,

    _adding: function(spec, index, ka) {
      if(!spec) throw error.argRequired("props[i]");

      var name = getSpecName(spec), existing;
      if(name && (existing = this.get(name))) {
        // An object spec? Otherwise it's a noop - nothing to configure or override.
        // Configure existing local property or override inherited one.
        if(spec !== name) {
          if(existing.declaringType === this._declaringTypeCtor.the)
            existing.configure(spec);
          else
            this.replace(spec, this.indexOf(existing));
        }

        // And cancel add property.
        return;
      }

      return this.base.apply(this, arguments);
    },

    _replacing: function(spec, index, existing) {
      if(!spec) throw error.argRequired("props[i]");

      var name = getSpecName(spec);
      if(name !== existing.name)
        throw error.argInvalid("props[i]", "Incorrect property name.");

      if(existing.declaringType === this._declaringTypeCtor.the) {
        // Configure existing local property and cancel replace.
        // If spec is not an object, then it's a noop.
        if(spec !== name) existing.configure(spec);
        return;
      }

      // Replace with overridden property.
      return existing.extend(spec, this._declaringTypeCtor);
    },

    _cast: function(spec, index) {
      // For new, root, local properties.
      return PropertyDef.to(spec, this._declaringTypeCtor, index);
    }
    //endregion
  });

  function getSpecName(spec) {
    return typeof spec === "string" ? spec : spec.name;
  }
});
