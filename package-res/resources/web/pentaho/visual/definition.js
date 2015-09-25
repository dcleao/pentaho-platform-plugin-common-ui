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
  "../component/definition",
  "../messages!definition",
  "../util/arg",
  "../util/error",
  "../util/object"
], function(module, ComponentType, messages, arg, error, O) {

  /**
   * @name Type
   * @memberOf pentaho.visual
   *
   * @class
   * @extends pentaho.component.Type
   *
   * @classdesc The `pentaho.visual.Type` is the base abstract class of
   *     the Visualization API component types.
   *
   * A visualization component type can also be called, simply, a **visualization type**.
   *
   * Visualization types are defined by creating a class that directly or indirectly inherits from this one.
   */
  return ComponentType.extend("pentaho.visual.Type", /** @lends pentaho.visual.Type# */{
    id: module.id,
    name: messages.get("name"),
    description: messages.get("description"),
    "abstract": true,

    /**
     * Applies a configuration to the visualization type.
     * @name pentaho.visual.Type#configure
     * @param {!pentaho.visual.ITypeConfigurationSpec|Array.<pentaho.visual.ITypeConfigurationSpec>} config A visualization type configuration.
     */

    // @override
    _configureOne: function(config) {
      this.base(config);

      // TODO...
    }
  });
});
