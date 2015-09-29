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
  "module",
  "./any"
], function(module, AnyModel) {

  /**
   * @name StringModel
   * @memberOf pentaho.component.properties
   *
   * @class
   * @extends pentaho.component.properties.AnyModel
   *
   * @amd pentaho/component/properties/string
   *
   * @classdesc The `StringModel` class is the class of properties whose value is a string.
   *
   * ### AMD
   *
   * **Module Id**: `"pentaho/component/properties/string"`
   *
   * @description Creates a property given a specification.
   * @param {pentaho.component.properties.spec.IAnyModel} spec The property model specification.
   */
  return AnyModel.extend("pentaho.component.properties.StringModel", /** @lends pentaho.component.properties.StringModel# */{

    id: module.id,
    label: "string",
    description: null,
    helpUrl: null,

    // lengthMin, lengthMax

    isSingleValueEmpty: function(singleValue) {
      return !singleValue;
    },

    validateSingleValue: function(singleValue) {
      return typeof singleValue === "string" && this.base(singleValue);
    }
  });
});