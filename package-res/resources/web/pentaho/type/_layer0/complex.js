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
  "../../i18n!types",
  "./PropertyDefCollection"
], function(valueFactory, bundle, PropertyDefCollection) {

  "use strict";

  /**
   * Creates the `ComplexType` class for the given context.
   *
   * ### AMD
   *
   * Module Id: `pentaho/type/complex`
   *
   * @alias complexFactory
   * @memberOf pentaho.type
   * @type pentaho.type.TypeFactory
   * @amd pentaho/type/complex
   * @return {Class.<pentaho.type.ComplexType>} The `ComplexType` class of the given context.
   */
  return function(context) {

    var ValueType = context.get(valueFactory);

    /**
     * @name pentaho.type.ComplexType
     * @class
     * @extends pentaho.type.ValueType
     * @implements pentaho.lang.IConfigurable
     *
     * @classDesc The base class of complex types.
     *
     * Example complex type:
     * ```javascript
     * define(["pentaho/type/complex"], function(complexFactory) {
     *
     *   return function(context) {
     *
     *     var ComplexType = context.get(complexFactory);
     *
     *     return ComplexType.extend({
     *       // Properties
     *       props: [
     *         {name: "name", type: "string", label: "Name"},
     *         {name: "category", type: "string", label: "Category", list: true},
     *         {name: "price", type: "number", label: "Price"}
     *       ]
     *     });
     *   };
     *
     * });
     * ```
     *
     * @description Creates a complex type instance.
     */
    var ComplexType = ValueType.extend("pentaho.type.ComplexType", /** @lends pentaho.type.ComplexType# */{
      id: "pentaho/type/complex",

      "abstract": true,

      styleClass: "pentaho-type-complex",

      //region properties property
      _props: null,

      /**
       * Gets the `Property` collection of the complex type.
       *
       * @type pentaho.type.PropertyCollection
       * @readonly
       */
      get props() {
        return this._props;
      }, //endregion

      //region IConfigurable _class_ implementation support
      /**
       * Configures the complex class.
       *
       * This method _must not_ be called directly on type instances.
       * It is expected to be called on the `prototype` of
       * the constructor function, to configure the class.
       *
       * @param {pentaho.type.spec.IComplexConfig} config A complex type class configuration.
       * @protected
       * @virtual
       */
      _configure: function(config) {
        if(!config) return; // TODO: remove this later
        this.base(config);

        if(config.props) this._props.configure(config.props);
      }
      //endregion

    }, /** @lends pentaho.type.ComplexType */{
      /**
       * Creates a sub-type of this one.
       *
       * @name pentaho.type.ComplexType.extend
       *
       * @param {string} [name] The name of the complex type sub-class.
       *   This is used mostly for debugging and is otherwise unrelated to {@link pentaho.type.Value#id}.
       *
       * @param {pentaho.type.spec.IComplexType} instSpec The complex type specification.
       * @param {Object} [classSpec] Class-level members of the class.
       *
       * @return {Class.<pentaho.type.ComplexType>} The created sub-class.
       */

      _extend: function(name, instSpec) {
        // Prevent property "props" being added to the prototype.
        var propSpecs = removeProp(instSpec, "props");

        var Derived = this.base.apply(this, arguments);

        // Not using Class.init, cause there would be no way to pass propSpecs to it
        // (unless an alternate instSpec prop was used...)
        initType(Derived, propSpecs);

        return Derived;
      }
    }).implement(bundle.structured.complex);

    // Create root properties collection.
    initType(ComplexType);

    return ComplexType;
  };

  function initType(ComplexType, propSpecs) {
    ComplexType.prototype._props = PropertyDefCollection.to(propSpecs, /*declaringTypeCtor:*/ComplexType);
  }

  function removeProp(o, p) {
    var v;
    if(o && (p in o)) {
      v = o[p];
      delete o[p];
    }
    return v;
  }
});
