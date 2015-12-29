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
  "../../i18n!../i18n/types",
  "./PropertyMetaCollection"
], function(valueFactory, bundle, PropertyMetaCollection) {

  "use strict";

  /**
   * Creates the `Complex` class for the given context.
   *
   * ### AMD
   *
   * Module Id: `pentaho/type/complex`
   *
   * @alias complexFactory
   * @memberOf pentaho.type
   * @type pentaho.type.Factory
   * @amd pentaho/type/complex
   * @return {Class.<pentaho.type.Complex>} The `Complex` class of the given context.
   */
  return function(context) {

    var Value = context.get(valueFactory);

    /**
     * @name pentaho.type.Complex.Meta
     * @class
     * @extends pentaho.type.Value.Meta
     *
     * @classDesc The metadata class of {@link pentaho.type.Complex}.
     */

    /**
     * @name pentaho.type.Complex
     * @class
     * @extends pentaho.type.Value
     *
     * @classDesc The base class of complex types.
     *
     * Example complex type:
     * ```javascript
     * define(["pentaho/type/complex"], function(complexFactory) {
     *
     *   return function(context) {
     *
     *     var Complex = context.get(complexFactory);
     *
     *     return Complex.extend({
     *       meta: {
     *         // Properties
     *         props: [
     *           {name: "name", type: "string", label: "Name"},
     *           {name: "category", type: "string", label: "Category", list: true},
     *           {name: "price", type: "number", label: "Price"}
     *         ]
     *       }
     *     });
     *   };
     *
     * });
     * ```
     *
     * @description Creates a complex instance.
     */
    var Complex = Value.extend("pentaho.type.Complex", {
      meta: /** @lends pentaho.type.Complex.Meta# */{
        id: "pentaho/type/complex",

        "abstract": true,

        styleClass: "pentaho-type-complex",

        //region properties property
        _props: null,

        /**
         * Gets the `PropertyMeta` collection of the complex type.
         *
         * @type pentaho.type.PropertyMetaCollection
         * @readonly
         */
        get props() {
          return this._props;
        } //endregion
      }
    }, {
      meta: /** @lends pentaho.type.Complex.Meta */{

        // Documentation override
        /**
         * Creates a sub-type of this one.
         *
         * @name pentaho.type.Complex.Meta.extend
         *
         * @param {string} [name] The name of the complex sub-type.
         *   This is used mostly for debugging and is otherwise unrelated to {@link pentaho.type.Value.Meta#id}.
         *
         * @param {pentaho.type.spec.IComplexMeta} instSpec The complex type metadata specification.
         * @param {Object} [classSpec] Class-level members of the class.
         *
         * @return {Class.<pentaho.type.Complex.Meta>} The created sub-class.
         */

        _extend: function(name, instSpec) {
          // Prevent property "props" being added to the prototype.
          var propSpecs = consumeProp(instSpec, "props");

          var DerivedMeta = this.base.apply(this, arguments);

          // Not using Class.init, cause there would be no way to pass propSpecs to it
          // (unless an alternate instSpec prop was used...)
          initMeta(DerivedMeta, propSpecs);

          return DerivedMeta;
        }
      }
    }).Meta.implement(bundle.structured.complex).Value;

    // Create root properties collection.
    initMeta(Complex.Meta);

    return Complex;
  };

  function initMeta(ComplexMeta, propSpecs) {
    ComplexMeta.prototype._props = PropertyMetaCollection.to(propSpecs, /*declaringMetaCtor:*/ComplexMeta);
  }

  function consumeProp(o, p) {
    var v;
    if(o && (p in o)) {
      v = o[p];
      delete o[p];
    }
    return v;
  }
});
