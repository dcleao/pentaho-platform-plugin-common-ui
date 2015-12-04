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

  "use strict";
  
  /**
   * @name pentaho.type.Boolean
   * @class
   * @abstract
   * @extends pentaho.type.Simple
   *
   * @classdesc The class of the boolean type.
   *
   * @description Creates a boolean type instance, for a given configuration.
   * @param {pentaho.type.spec.ISimpleConfig} [config] A simple type configuration.
   */
  return Simple.extend("pentaho.type.Boolean", /** @lends pentaho.type.Boolean# */{
    id: "pentaho/type/boolean",
    label: "Boolean",
    labelPlural: "Booleans",
    description: "A boolean value.",

    // category, helpUrl,
    styleClass: "pentaho-type-boolean",

    validateNonEmpty: function(value) {
      return this.base(value) ||
        (typeof value !== "boolean"
          ? [new Error("Value is not of type 'boolean'.")]
          : null);
    }
  });
});
