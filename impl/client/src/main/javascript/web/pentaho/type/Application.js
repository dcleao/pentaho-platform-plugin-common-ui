/*!
 * Copyright 2010 - 2017 Hitachi Vantara. All rights reserved.
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
  "./Complex",
  "pentaho/i18n!types",
  "pentaho/config!"
], function(module, Complex, bundle, config) {

  "use strict";

  /**
   * @name pentaho.type.Application.Type
   * @class
   * @extends pentaho.type.Complex.Type
   *
   * @classDesc The base type class of application types.
   * For more information see {@link pentaho.type.Application}.
   */

  /**
   * @name pentaho.type.Application
   * @class
   * @extends pentaho.type.Complex
   *
   * @amd {pentaho.type.spec.UTypeModule<pentaho.type.Application>} pentaho/type/application
   *
   * @classDesc The base class of application types.
   *
   * @description Creates an application instance.
   *
   * @constructor
   * @param {pentaho.type.spec.IApplication} [spec] An application specification.
   */
  var Application = Complex.extend({
    $type: {
      id: module.id,
      alias: "application"
    }
  })
  .implement({$type: bundle.structured.application})
  .implement({$type: config});

  return Application;
});
