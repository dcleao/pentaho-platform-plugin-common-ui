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
     * A nominal color palette of 12 dark colors.
     *
     * <table style="font-family:courier; width:120px;">
     * <colgroup><col width="20px"/><col />
     * <tr><td style="background-color:#002644"></td><td>#002644</td></tr>
     * <tr><td style="background-color:#014462"></td><td>#014462</td></tr>
     * <tr><td style="background-color:#663000"></td><td>#663000</td></tr>
     * <tr><td style="background-color:#604E1D"></td><td>#604E1D</td></tr>
     * <tr><td style="background-color:#261B4E"></td><td>#261B4E</td></tr>
     * <tr><td style="background-color:#3B2C58"></td><td>#3B2C58</td></tr>
     * <tr><td style="background-color:#003524"></td><td>#003524</td></tr>
     * <tr><td style="background-color:#094E34"></td><td>#094E34</td></tr>
     * <tr><td style="background-color:#668032"></td><td>#668032</td></tr>
     * <tr><td style="background-color:#74A611"></td><td>#74A611</td></tr>
     * <tr><td style="background-color:#490B0B"></td><td>#490B0B</td></tr>
     * <tr><td style="background-color:#632422"></td><td>#632422</td></tr>
     * </table>
     *
     * @name pentaho.visual.color.palettes.nominalDark
     * @type {pentaho.visual.color.Palette}
     * @amd pentaho/visual/color/palettes/nominalDark
     */
    return new Palette({
      level: "nominal",
      colors: [
        "#002644", "#014462", "#663000", "#604E1D", "#261B4E", "#3B2C58",
        "#003524", "#094E34", "#668032", "#74A611", "#490B0B", "#632422"
      ]
    });
  };
});
