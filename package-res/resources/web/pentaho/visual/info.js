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
  "../component/info",
  "../messages!info"
], function(module, TypeInfo, messages) {

  /**
   * @name pentaho.visual.TypeInfo
   *
   * @class
   * @extends pentaho.component.TypeInfo
   *
   * @classdesc The `pentaho.visual.Info` is the abstract base class of
   *    the _info_ classes of Visualization API components.
   */
  return TypeInfo.extend("pentaho.visual.Info", /** @lends pentaho.visual.Info# */{
    id: module.id,
    name: messages.get("name"),
    description: messages.get("description"),
    "abstract": true,

    /**
     * Applies a configuration to the visualization type.
     *
     * @param {!pentaho.visual.spec.ITypeConfig} config A visualization type configuration.
     */
    configure: function(config) {

      // TODO...
    }
  });
});
