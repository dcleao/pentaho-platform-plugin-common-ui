/*!
 * Copyright 2010 - 2017 Hitachi Vantara. All rights reserved.
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
  "module",
  "./Simple",
  "../i18n!types",
  "pentaho/config!"
], function(module, Simple, bundle, config) {

  "use strict";

  /**
   * @name pentaho.type.Number
   * @class
   * @extends pentaho.type.Simple
   * @amd {pentaho.type.spec.UTypeModule<pentaho.type.Number>} pentaho/type/number
   *
   * @classDesc The class of number values.
   *
   * @description Creates a number instance.
   */
  var PentahoNumber = Simple.extend(/** @lends pentaho.type.Number# */{
    /**
     * Gets the underlying number primitive of the value.
     * @name pentaho.type.Number#value
     * @type number
     * @readonly
     */

    $type: {
      id: module.id,
      alias: "number",

      cast: __toNumber
    }
  })
  .implement({$type: bundle.structured["number"]}) // eslint-disable-line dot-notation
  .implement({$type: config});

  return PentahoNumber;

  function __toNumber(v) {
    v = +v;
    return isNaN(v) ? null : v;
  }
});
