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
   * @name pentaho.type.String
   * @class
   * @abstract
   * @extends pentaho.type.Simple
   *
   * @classdesc A textual type.
   *
   * @description Creates a string type instance, for a given configuration.
   * @param {pentaho.type.spec.ISimpleConfig} [config] A simple type configuration.
   */
  return Simple.extend("pentaho.type.String", /** @lends pentaho.type.String# */{
    id: "pentaho/type/string",
    label: "String",
    labelPlural: "Strings",
    description: "A textual value.",

    validateNonEmpty: function(value) {
      return this.base(value) ||
        (typeof value !== "string"
          ? [new Error("Value is not of type 'string'.")]
          : null);
    }
  });
});
