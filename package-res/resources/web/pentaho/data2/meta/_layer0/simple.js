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
  "./type"
], function(Type) {
  /**
   * @name pentaho.data.meta.Simple
   * @class
   * @abstract
   * @extends pentaho.data.meta.Type
   *
   * @classdesc The base abstract class of metadata of un-structured, indivisible types.
   *
   * Example of the metadata of a simple type:
   * ```javascript
   * define(["pentaho/data/meta/Simple"], function(SimpleMeta) {
   *   return SimpleMeta.extend({
   *
   *   });
   * });
   * ```
   *
   * @description Creates a simple type metadata instance, given a configuration.
   * @param {pentaho.data.spec.ISimpleConfig} [config] A simple type's metadata configuration.
   */
  return Type.extend("pentaho.data.meta.Simple", /** @lends pentaho.data.meta.Simple# */{
    id: "pentaho/data/meta/simple",
    name: "simple",
    namePlural: "simples",
    label: "Simple",
    labelPlural: "Simples",
    description: "An unstructured, indivisible type of value, that has no properties."
  });
});