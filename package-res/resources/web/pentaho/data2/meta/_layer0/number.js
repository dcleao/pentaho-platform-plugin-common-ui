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
  "./simple"
], function(Simple) {
  /**
   * @name pentaho.data.meta.Number
   * @class
   * @abstract
   * @extends pentaho.data.meta.Simple
   *
   * @classdesc The base metadata class of numeric types.
   *
   * @description Creates a numeric type metadata instance, for a given configuration.
   * @param {pentaho.data.spec.ISimpleConfig} [config] A simple type's metadata configuration.
   */
  return Simple.extend("pentaho.data.meta.Number", /** @lends pentaho.data.meta.Number# */{
    id: "pentaho/data/meta/number",
    name: "number",
    namePlural: "numbers",
    label: "Number",
    labelPlural: "Numbers",
    description: "A numeric value.",

    validateNonEmpty: function(value) {
      return this.base(value) ||
        (typeof value !== "number"
          ? [new Error("Value is not of type 'number'.")]
          : null);
    }
  });
});