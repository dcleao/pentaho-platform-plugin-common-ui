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
  "./value"
], function(Value) {

  "use strict";

  /**
   * @name pentaho.type.Simple
   * @class
   * @abstract
   * @extends pentaho.type.Value
   *
   * @classdesc The base abstract class of un-structured, indivisible types.
   *
   * Simple type example:
   * ```javascript
   * define(["pentaho/type/simple"], function(SimpleType) {
   *   return SimpleType.extend({
   *
   *   });
   * });
   * ```
   *
   * @description Creates a simple type instance, given a configuration.
   * @param {pentaho.type.spec.ISimpleConfig} [config] A simple type configuration.
   */
  return Value.extend("pentaho.type.Simple", /** @lends pentaho.type.Simple# */{
    id: "pentaho/type/simple",
    label: "Simple",
    labelPlural: "Simples",
    description: "An unstructured, indivisible type of value, that has no properties."
  });
});
