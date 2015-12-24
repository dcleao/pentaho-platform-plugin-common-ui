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
  "./simple",
  "../../i18n!../i18n/types"
], function(simpleFactory, bundle) {

  "use strict";

  /**
   * Creates the `BooleanType` class for the given context.
   *
   * ### AMD
   *
   * Module Id: `pentaho/type/boolean`
   *
   * @alias booleanFactory
   * @memberOf pentaho.type
   * @type pentaho.type.TypeFactory
   * @amd pentaho/type/boolean
   * @return {Class.<pentaho.type.BooleanType>} The `BooleanType` class of the given context.
   */
  return function(context) {

    var SimpleType = context.get(simpleFactory);

    /**
     * @name pentaho.type.BooleanType
     * @class
     * @extends pentaho.type.SimpleType
     *
     * @classDesc The class of the boolean type.
     * @description Creates a boolean type instance.
     */
    return SimpleType.extend("pentaho.type.BooleanType", /** @lends pentaho.type.BooleanType# */{
      id: "pentaho/type/boolean",

      styleClass: "pentaho-type-boolean",

      validateNonEmpty: function(value) {
        return this.base(value) ||
          (typeof value !== "boolean"
            ? [new Error("Value is not of type 'boolean'.")]
            : null);
      }
    }).implement(bundle.structured["boolean"]);
  };
});
