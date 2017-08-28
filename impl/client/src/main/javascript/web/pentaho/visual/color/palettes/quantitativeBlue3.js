/*!
 * Copyright 2017 Pentaho Corporation. All rights reserved.
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
  "../palette"
], function(paletteFactory) {

  "use strict";

  return function(context) {

    var Palette = context.get(paletteFactory);

    /**
     * A quantitative color palette of 3 tones of blue.
     *
     * <table style="font-family:courier; width:120px;">
     * <colgroup><col width="20px"/><col />
     * <tr><td style="background-color:#CCDFED"></td><td>#CCDFED</td></tr>
     * <tr><td style="background-color:#6D85A4"></td><td>#6D85A4</td></tr>
     * <tr><td style="background-color:#0F2B5B"></td><td>#0F2B5B</td></tr>
     * </table>
     *
     * @name pentaho.visual.color.palettes.quantitativeBlue3
     * @type {pentaho.visual.color.Palette}
     * @amd pentaho/visual/color/palettes/quantitativeBlue3
     */
    return new Palette({
      level: "quantitative",
      colors: [
        "#CCDFED", "#6D85A4", "#0F2B5B"
      ]
    });
  };
});
