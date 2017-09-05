/*!
 * Copyright 2010 - 2017 Pentaho Corporation. All rights reserved.
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
  "pentaho/i18n!./i18n/model"
], function(module, bundle) {

  "use strict";

  return [
    "pentaho/visual/models/categoricalContinuousAbstract",
    "pentaho/visual/models/types/labelsOption",
    "pentaho/visual/models/mixins/multiCharted",
    "pentaho/visual/models/mixins/interpolated",
    function(BaseModel, LabelsOption, MultiChartedModel, InterpolatedModel) {

      return BaseModel.extend({
        $type: {
          id: module.id,
          isAbstract: true,
          mixins: [MultiChartedModel, InterpolatedModel],
          props: [
            {
              name: "rows", // VISUAL_ROLE
              base: "pentaho/visual/role/property",

              // Always a visual key, whatever the effective measurement level or data type.
              isVisualKey: true,

              getAttributesMaxLevelOf: function(model) {

                var mapping = model.get(this);

                // If the mapping contains a single `number` attribute,
                // consider it ordinal, and not quantitative as the base code does.
                var count = mapping.attributes.count;
                if(count === 1) {
                  var dataAttr = mapping.attributes.at(0).dataAttribute;
                  if(dataAttr && dataAttr.type === "number") {
                    return "ordinal";
                  }
                } else if(count > 1) {
                  return "ordinal";
                }

                return this.base(model);
              }
            },
            {
              name: "measures", // VISUAL_ROLE
              attributes: {isRequired: true},
              ordinal: 7
            },
            {
              name: "labelsOption",
              valueType: LabelsOption,
              domain: ["none", "center", "left", "right", "top", "bottom"],
              isRequired: true,
              defaultValue: "none"
            }
          ]
        }

      })
      .implement({$type: bundle.structured.pointAbstract});
    }
  ];
});
