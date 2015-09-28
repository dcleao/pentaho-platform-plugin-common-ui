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
  "cdf/component/input/model",
  "pentaho/messages!model",
  "pentaho/theme!model"
], function(module, InputModel, messages) {

  /**
   * @name pentaho.component.samples.TextBoxModel
   * @class
   * @extends cdf.component.InputModel
   */
  return InputModel.extend(/** @lends pentaho.component.samples.TextBoxModel# */{
    properties: {
      // Property Usage
      "placeholderText" : {

        // pentaho/component/properties/any : AnyModel
        type: "pentaho/component/properties/string", // StringModel

        // Displayed in the property editor?
        // Can not change after being included/excluded from the editor...
        browsable:  true,

        // Is _currently_ applicable?
        applicable: true,

        // Is _currently_ editable?
        editable: true,

        required: false,
        allowMultiple: false,

        // countMin, countMax
        // min, max
        // values

        //valueType: "string", // number, date, boolean

        // Override default label, description
        label: messages.get("placeholderText_label"),
        description: messages.get("placeholderText_description"),
        value: messages.get("placeholderText_default"),
      }
    }
  });
});