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
  "../../i18n!types"
], function(Simple, bundle) {

  "use strict";

  /**
   * @name pentaho.type.Date
   * @class
   * @abstract
   * @extends pentaho.type.Simple
   *
   * @classdesc The class of the date type.
   *
   * @description Creates a date type instance, for a given configuration.
   * @param {pentaho.type.spec.ISimpleConfig} [config] A simple type configuration.
   */
  return Simple.extend("pentaho.type.Date", /** @lends pentaho.type.Date# */{
    id: "pentaho/type/date",

    styleClass: "pentaho-type-date",

    validateNonEmpty: function(value) {
      return this.base(value) ||
        ((value instanceof Date)
          ? null
          : [new Error("Value is not of type 'date'.")]);
    }
  }).configure(bundle.structured["date"]);
});
