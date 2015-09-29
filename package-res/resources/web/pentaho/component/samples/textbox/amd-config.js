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

/* AMD/RequireJS configuration
 *
 * This file is loaded by the special "webcontext.js" resource,
 * which establishes the pentaho platform's context.
 */

/**
 * The run-time location is determined from the AMD module object properties, `module.id` or `module.uri`.
 *
 * ## Dependencies
 *
 * * need the new incremental config capabilities of requireJS.
 *
 * ## Advantages
 *
 * * No need to know the plugin id.
 * * No need to consume global variables (requireCfg, CONTEXT_PATH, etc...).
 * * Guides into not creating global variables.
 * * Environment independent.
 * * Location independence directly supports components' AMD requirements.
 * * The pentaho context require-js part could itself be a module, that requires each other sub-module.
 *   1. webcontext.js would include this automatically generated module
 *   2. require-js script would be included and would request this module as its main
 *
 *
 * Example `module.id` value, per environment:
 *
 * 1. In production, it is loaded like:
 *    "pentaho/content/common-ui/resources/web/pentaho/component/samples/textBox/amd-config"
 *
 * 2. In test, it is loaded like:
 *    ...?
 *
 * 3. In build, it is loaded like:
 *    ...?
 *
 * ## Disadvantages
 *
 * * each config looses access to the previously loaded require-js-cfg.js file
 *   and take "smart" decisions for not overriding something, if it is already defined.
 *   However, this has always been a bad practice as we have no way to know the order of require-js-cfg files...
 *
 * * load can no longer be synchronous? Configuration must be loaded before anything else is required.
 *
 * The dynamic file `webcontext.js` outputs the tag:
 * ```html
 * <script src="/pentaho/content/common-ui/resources/web/require.js" data-main="webcontext-amd-config.js"></script>
 * ```
 *
 * The `webcontext-amd-config.js` file, instead, is also automatically generated and _requires_ all plugins'
 * amd configuration modules:
 *
 * ```javascript
 * define([
 *    "pentaho/content/common-ui/resources/web/pentaho/component/samples/textBox/amd-config",
 *    "pentaho/content/common-ui/resources/web/amd-config",
 *    // ...
 * ]);
 * ```
 * A similar file can be built by the build process to enable the test and build environments to work seamlessly.
 *
 * The only way in which load could be synchronous with this scheme would be to inline all config modules (like r.js does),
 * so that a synchronous config file call, `require("webcontext-amd")`, could be made. But doing this in production,
 * would be challenging.
 * Or, we could assume the body of the amd.js script did not specify the AMD header, and we'd provide one
 * automatically, including creation of the basePath variable.
 * This would enable us to easily replace r.js with our own concat&amp;wrap composite amd-config file generator...
 */
define(["module"], function(module) {
  "use strict";

  // TODO: useDebug  = typeof document === "undefined" || document.location.href.indexOf("debug=true") > 0

  // module.id  -> "/pentaho/content/common-ui/resources/web/pentaho/component/samples/textBox/amd-config"
  // mudule.uri -> "http://localhost:8080/pentaho/content/common-ui/resources/web/pentaho/component/samples/textBox/amd-config.js"

  // Remove "/amd-config" from the end of the module id.
  // basePath, baseMid - in case you prefer to use the provided baseMid as well ?
  var basePath = module.id.replace(/\amd-config/, "");

  // ----------

  require({
    paths: {
      "my/company/textBox": basePath
    },

    config: {
      "pentaho/service": {
        "my/company/textBox/info": "pentaho.component.info"
      }
    }
  });
});