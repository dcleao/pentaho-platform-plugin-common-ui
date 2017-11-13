/*!
 * Copyright 2017 Hitachi Vantara. All rights reserved.
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
  "pentaho/service!pentaho.config.IService?single",
  "../util/module"
], function(configService, moduleUtil) {

  "use strict";

  /**
   * An AMD loader plugin for loading the configuration of types.
   *
   * This plugin queries the [Configuration Service]{@link pentaho.config.IService}
   * for the configuration of a given type, whose id is given as the plugin's argument.
   *
   * **AMD Plugin Usage**: `"pentaho/config/type!{type-id}"`
   *
   * 1. `{type-id}` — the identifier of the type whose configuration is desired;
   *                  when unspecified, defaults to the requiring module;
   *                  when specified and relative,
   *                  it is relative to the requiring module's parent module.
   *
   * **Example**
   *
   * The following module is a type module and requests its own configuration:
   *
   * ```js
   * define(["pentaho/config/type!"], function(myConfig) {
   *
   *   if(myConfig !== null) {
   *     // ...
   *   }
   * });
   * ```
   *
   * @name type
   * @memberOf pentaho.config
   * @type {IAmdLoaderPlugin}
   * @amd pentaho/config/type
   *
   * @see pentaho.config.instance
   * @see pentaho.config.IService
   */
  return {
    load: function(typeId, localRequire, onLoad, config) {
      if(config.isBuild) {
        // Don't include configurations in the build.
        // These are resolved dynamically in the "browser".
        onLoad();
      } else {

        if(!typeId) {
          typeId = moduleUtil.getId(localRequire);
        } else if(typeId[0] === ".") {
          typeId = moduleUtil.absolutizeIdRelativeToSibling(typeId, moduleUtil.getId(localRequire));
        }

        onLoad(configService.selectType(typeId));
      }
    }
  };
});
