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

/* AMD/requirejs configuration
 *
 * This file is loaded by the special "webcontext.js" resource,
 * which establishes the pentaho platform's context.
 */

/*global CONTEXT_PATH:true */

(function() {
  "use strict";

  var mid = "pentaho/component/samples/textBox",
      basePath = CONTEXT_PATH + "content/<myplugin>/resources/web/path/to/myComponent";

  requireCfg.paths[mid] = basePath;

  // Lib modules
  // ...

}());
