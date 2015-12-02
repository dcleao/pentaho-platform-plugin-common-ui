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
  "./PropertyCollection",
  "./Context",
  "../../../util/error",
  "../../../util/object"
], function(Type, Context, PropertyCollection, PropertyClassCollection, error, O) {
  /**
   * @name pentaho.data.meta.Complex
   * @class
   * @abstract
   * @extends pentaho.data.meta.Type
   * @implements pentaho.lang.IConfigurable
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
   * @description Creates a complex metadata instance and, optionally, registers it in a given context.
   *
   * Note that event when a context is not provided,
   * one is still created and used internally to assist in the complex type
   * construction and ensure the uniqueness of all types accessible
   * through the complex type's properties.
   *
   * @param {Object} keyArgs Keyword arguments object.
   * @param {pentaho.data.meta.IContext} [keyArgs.context] The metadata context.
   * @param {pentaho.data.meta.spec.IComplexConfig} [keyArgs.config] A complex metadata configuration.
   */
  var Complex = Type.extend("pentaho.data.meta.Complex", /** @lends pentaho.data.meta.Complex# */{
    id: "pentaho/data/meta/complex",
    name: "complex",
    namePlural: "complexes",
    label: "Complex",
    labelPlural: "Complexes",
    description: "A structured type of value. One that has properties.",

    constructor: function(keyArgs) {
      if(!keyArgs) keyArgs = {};
      var context = keyArgs.context || (keyArgs.context = new Context());

      // 1. Register `this` in `context` before props, to avoid endless recursion in cyclic complex types.
      this.base(keyArgs);

      // 2. Store context to support addition of _dyanmic_ properties
      //    (for static props, it would be enough to send `context` as a keyword argument below, along with `owner`).
      /**
       * The metadata context.
       * @type pentaho.data.meta.IContext
       * @ignore
       */
      this._context = context;

      // 3. Configure the complex type _locally_ only, _before_ building properties.
      //    Properties configure themselves upon construction.
      var config = context.getConfig(this.constructor);
      if(config) this._configureLocal(config);

      // 4. Create properties, recursively instantiating their types.
      this._properties = PropertyCollection.to([], {owner: this});
    },

    //region properties property
    _properties: null,

    /**
     * Gets the `Property` collection of the complex type instance.
     *
     * @type pentaho.data.meta.PropertyCollection
     * @reaonly
     */
    get properties() {
      return this._properties;
    },
    //endregion

    //region IConfigurable implementation
    /**
      * Configures the complex type metadata instance.
     *
     * @param {Object.<string,pentaho.data.meta.spec.IComplexConfig} config A complex type metadata configuration.
     */
    configure: function(config) {
      this.base(config);

      if(config.props) this._properties.configure(config.props);
    }
    //endregion

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
     * The complex type class `PropertyClass` collection.
     *
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