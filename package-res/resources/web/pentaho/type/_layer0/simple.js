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
  "../../i18n!../i18n/types"
], function(valueFactory, bundle) {

  "use strict";

  /**
   * Creates the `Simple` class for the given context.
   *
   * ### AMD
   *
   * Module Id: `pentaho/type/simple`
   *
   * @alias simpleFactory
   * @memberOf pentaho.type
   * @type pentaho.type.Factory
   * @amd pentaho/type/simple
   * @return {Class.<pentaho.type.Simple>} The `Simple` class of the given context.
   */
  return function(context) {

    var Value = context.get(valueFactory);

    /**
     * @name pentaho.type.Simple.Meta
     * @class
     * @extends pentaho.type.Value.Meta
     *
     * @classDesc The metadata class of {@link pentaho.type.Simple}.
     * @ignore
     */

    /**
     * @name pentaho.type.Simple
     * @class
     * @extends pentaho.type.Value
     *
     * @classDesc The base abstract class of un-structured, indivisible values.
     *
     * Simple type example:
     * ```javascript
     * define(["pentaho/type/simple"], function(simpleFactory) {
     *
     *   return function(context) {
     *
     *     var Simple = context.get(simpleFactory);
     *
     *     return Simple.extend({
     *
     *     });
     *   };
     * });
     * ```
     *
     * @description Creates a simple instance.
     */
    return Value.extend("pentaho.type.Simple", {
      meta: {
        id: "pentaho/type/simple",
        "abstract": true,
        styleClass: "pentaho-type-simple"
      }
    }).implement({
      meta: bundle.structured.simple
    });
  };
});
