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
  "./Context",
  "./PropertyCollection",
  "./PropertyClassCollection",
  "../../util/error",
  "../../util/object"
], function(Value, Context, PropertyCollection, PropertyClassCollection, error, O) {

  "use strict";

  /**
   * @name pentaho.type.Complex
   * @class
   * @abstract
   * @extends pentaho.type.Value
   * @implements pentaho.lang.IConfigurable
   *
   * @classdesc The base abstract class of complex types.
   *
   * Example complex type:
   * ```javascript
   * define(["pentaho/type/complex"], function(ComplexType) {
   *   return ComplexType.extend({
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
   * @description Creates a complex type instance and, optionally, registers it in a given context.
   *
   * Note that event when a context is not provided,
   * one is still created and used internally to assist in the complex type
   * construction and ensure the uniqueness of all types accessible
   * through the complex type's properties.
   *
   * @param {Object} keyArgs Keyword arguments object.
   * @param {pentaho.type.IContext} [keyArgs.context] The type context.
   * @param {pentaho.type.spec.IComplexConfig} [keyArgs.config] A complex type configuration.
   */
  var Complex = Value.extend("pentaho.type.Complex", /** @lends pentaho.type.Complex# */{
    id: "pentaho/type/complex",
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
       * The type context.
       * @type pentaho.type.IContext
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
     * @type pentaho.type.PropertyCollection
     * @reaonly
     */
    get properties() {
      return this._properties;
    },
    //endregion

    //region IConfigurable implementation
    /**
      * Configures the complex type instance.
     *
     * @param {Object.<string,pentaho.type.spec.IComplexConfig} config A complex type configuration.
     */
    configure: function(config) {
      this.base(config);

      if(config.props) this._properties.configure(config.props);
    }
    //endregion

  }, /** @lends pentaho.type.Complex */{
    /**
     * Creates a subclass of this type class.
     *
     * @name pentaho.type.Complex.extend
     *
     * @param {string} [name] The name of the complex type sub-class.
     *   This is used mostly for debugging and is unrelated to {@link pentaho.type.Value#name}.
     *
     * @param {pentaho.type.spec.IComplex} instSpec The complex type specification.
     * @param {Object} [classSpec] Class-level members of the class.
     *
     * @return {Class.<pentaho.type.Complex>} The created sub-class.
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
     * @type pentaho.type.PropertyClassCollection
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
