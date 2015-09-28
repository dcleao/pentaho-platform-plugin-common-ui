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
  "../component/model",
  "../messages!definition"
], function(module, ComponentModel, messages) {

  /**
   * @name pentaho.visual.Model
   *
   * @class
   * @extends pentaho.component.Model
   *
   * @classdesc The `pentaho.visual.Model` is the abstract base class of
   *    the models of Visualization API components.
   */
  return ComponentModel.extend("pentaho.visual.Model", /** @lends pentaho.visual.Model# */{
    id: module.id,
    name: messages.get("name"),
    description: messages.get("description"),
    "abstract": true,

    /**
     * Applies a configuration to the visualization type.
     * @name pentaho.visual.Type#configure
     * @param {!pentaho.visual.spec.ITypeConfiguration|Array.<pentaho.visual.spec.ITypeConfiguration>} config A visualization type configuration.
     */

    // @override
    _configureOne: function(config) {
      this.base(config);

      // TODO...
    }
  });
});
