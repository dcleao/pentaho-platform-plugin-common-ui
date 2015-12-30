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
  "./Abstract",
  "../../i18n!../i18n/types"
], function(Abstract, bundle) {

  "use strict";

  var _baseMid = "pentaho/type/";

  /**
   * Creates the root `Value` class of the given context.
   *
   * ### AMD
   *
   * Module Id: `pentaho/type/value`
   *
   * @alias valueFactory
   * @memberOf pentaho.type
   * @type pentaho.type.Factory<pentaho.type.Value>
   * @amd pentaho/type/value
   */
  return function(context) {

    /**
     * @name pentaho.type.Value.Meta
     * @class
     * @extends pentaho.type.Abstract.Meta
     *
     * @classDesc The base _metadata_ class of the types in a certain context.
     *
     * A metadata class is a _singleton_ class.
     * Each class' single instance is accessible through its `the` property,
     * {@link pentaho.type.Value.Meta.the}.
     */

    /**
     * @name pentaho.type.Value
     * @class
     * @extends pentaho.type.Abstract
     *
     * @classDesc
     *
     * Example type:
     * ```javascript
     * define(["pentaho/type/value"], function(valueFactory) {
     *
     *   return function(context) {
     *
     *     var Value = context.get(valueFactory);
     *
     *     return Value.extend({
     *       type: {
     *         // Label of a single element of this type of value.
     *         label: "Name",
     *
     *         // Category of the type of value or concept
     *         category: "foo",
     *
     *         // Description of the type of value
     *         description: "Foo",
     *
     *         helpUrl: "foo/bar"
     *
     *         // min, max - for _ordered_ types (number, string, any having compare specified?)
     *         // minOpen, maxOpen? false
     *         // lengthMin, lengthMax, pattern - facets for strings only
     *
     *         // Arbitrary metadata
     *         p: {
     *         },
     *
     *         // Closed domain of _values_ of this type.
     *         // When inherited, specified values must be a subset of those in the base class.
     *         // By default, the list is an undetermined, possibly infinite,
     *         // set of all values allowed in the base domain...
     *         // This also specifies the default natural ordering of the values.
     *         domain: [],
     *
     *         // Default formatting specification for values of this type
     *         format: {},
     *
     *         styleClass: ""
     *       }
     *     });
     *   };
     * });
     * ```
     *
     * @description Creates a value.
     */
    var Value = Abstract.extend("pentaho.type.Value", {
      meta: /** @lends pentaho.type.Value.Meta# */{
        //region context property

        // NOTE: any class extended from this one will return the same context...
        /**
         * Gets the context that defined this type class.
         * @type pentaho.type.IContext
         * @override
         */
        get context() {
          return context;
        },
        //endregion

        //region root property
        /**
         * Gets the (singleton) `Value.Meta` instance of the class' context.
         * @type pentaho.type.Value.Meta
         * @override
         * @see pentaho.type.Abstract.Meta#ancestor
         */
        get root() {
          return Value.meta;
        },
        //endregion

        id: _baseMid + "value",
        "abstract": true,
        styleClass: "pentaho-type-value"
      }
    }).implement({
      meta: bundle.structured.value
    });

    return Value;
  };
});
