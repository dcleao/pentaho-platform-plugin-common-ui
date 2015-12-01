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
  "./PropertyClassCollection",
  "../../../util/error"
], function(Type, PropertyClassCollection, error) {
  /**
   * @name pentaho.data.meta.Complex
   * @class
   * @abstract
   * @extends pentaho.data.meta.Type
   *
   * @classdesc The base abstract class of metadata of complex types.
   *
   * Example complex metadata:
   * ```javascript
   * define(["pentaho/data/meta/Complex"], function(ComplexMeta) {
   *   return ComplexMeta.extend({
   *     // Properties
   *     props: [
   *       {name: "name", type: "string", label: "Name"},
   *       {name: "category", type: "string", label: "Category", list: true},
   *       {name: "price", type: "number", label: "Price"}
   *     ]
   *   });
   * });
   * ```
   *
   * @description Creates a complex metadata instance for a given configuration.
   * @param {pentaho.data.spec.Complex} [config] A complex metadata configuration.
   */
  var Complex = Type.extend("pentaho.data.meta.Complex", /** @lends pentaho.data.meta.Complex# */{
    id: "pentaho/data/meta/complex",
    name: "complex",
    namePlural: "complexes",
    label: "Complex",
    labelPlural: "Complexes",
    description: "A structured type of value. One that has properties."
  }, /** @lends pentaho.data.meta.Complex */{
    /**
     * Creates a subclass of this type metadata class.
     *
     * @name pentaho.data.meta.Complex.extend
     *
     * @param {string} [name] The name of the complex metadata sub-class. This is used mostly for debugging
     *    and is unrelated to {@link pentaho.data.meta.Type#name}.
     *
     * @param {pentaho.data.meta.spec.IComplex} instSpec The complex metadata specification.
     * @param {Object} [classSpec] Class-level members of the class.
     *
     * @return {Class.<pentaho.data.meta.Complex>} The created sub-class.
     */

    _extend: function(name, instSpec) {
      // Prevent property "props" being added to the prototype.
      var propSpecs = removeProp(instSpec, "props");

      var Derived = this.base.apply(this, arguments);

      // Create properties classes collection.
      Derived._properties = PropertyClassCollection.to(propSpecs, Derived);

      return Derived;
    },

    //region properties property
    _properties: null,

    /**
     * @name pentaho.data.meta.Complex.properties
     * @type pentaho.data.meta.PropertyClassCollection
     * @reaonly
     */
    get properties() {
      return this._properties;
    }
    //endregion
  });

  // Create root properties classes collection.
  Complex._properties = PropertyClassCollection.to(undefined, Complex);

  return Complex;

  function removeProp(o, p) {
    var v;
    if(o && (p in o)) {
      v = o[p];
      delete o[p];
    }
    return v;
  }
});