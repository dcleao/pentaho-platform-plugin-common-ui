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
  "./PropertyMetaCollection",
  "../../i18n!../i18n/types",
  "../../util/object"
], function(valueFactory, PropertyMetaCollection, bundle, O) {

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

      constructor: function(spec) {
        // Note: neither `Value` or `Abstract` do anything in their constructor,
        // so, in the name of performance, we're purposely not calling base.

        // Create `Property` instances.
        var pMetas = this.meta.props,
            i = pMetas.length,
            hasSpec = !!spec,
            isArray = hasSpec && (spec instanceof Array),
            pMeta, v;

        while(i--) {
          pMeta = pMetas[i];
          v = hasSpec ? spec[isArray ? pMeta.index : pMeta.name] : undefined;
          this[pMeta._namePriv] = null; // new Property(pMeta, this, v);
        }
      },

      meta: /** @lends pentaho.type.Complex.Meta# */{
        id: "pentaho/type/complex",

        "abstract": true,

        styleClass: "pentaho-type-complex",

        //region properties property
        _props: null,

        /**
         * Gets or configures (when set) the `Property.Meta` collection of the complex type.
         *
         * To _configure_ the properties _set_ `props` with
         * any value accepted by {@link pentaho.type.PropertyMetaCollection#configure}.
         *
         * @type pentaho.type.PropertyMetaCollection
         * @readonly
         */
        get props() {
          // Always get/create from/on the class' prototype.
          // Lazy creation.
          var proto = this.constructor.prototype;
          return O.getOwn(proto, "_props") ||
              (proto._props = PropertyMetaCollection.to([], /*declaringMetaCtor:*/this.constructor));
        },

        set props(propSpecs) {
          this.props.configure(propSpecs);
        }
        //endregion
      }
    }).implement({
      meta: bundle.structured.complex
    });

    return Complex;
  };
});
