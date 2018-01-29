/*!
 * Copyright 2018 Hitachi Vantara. All rights reserved.
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
  "pentaho/i18n!./i18n/viz"
], function(module, bundle) {

  "use strict";

  return ["./abstract", function(BaseViz) {

    return BaseViz.extend({
      $type: {
        id: module.id,
        v2Id: "ccc_pie",
        category: "piechart",
        modelTypeId: "pentaho/visual/models/pie",
        viewTypeId: "pentaho/ccc/visual/pie"
      }
    })
    .implement({$type: bundle.structured.pie});
  }];
});
