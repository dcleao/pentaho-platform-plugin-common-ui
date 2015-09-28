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
  "pentaho/messages!model"
], function(module, InputModel, messages) {

  /**
   * @name pentaho.component.samples.TextBoxModel
   * @class
   * @extends cdf.component.InputModel
   *
   * @amd pentaho/component/samples/textBox/model
   */
  return InputModel.extend(/** @lends pentaho.component.samples.TextBoxModel# */{
    properties: {

      // Property Usages
      "placeholderText" : {
        type: "string", // ~~> pentaho/component/properties/string

        // Override default label, description
        label: messages.get("placeholderText_label"),
        description: messages.get("placeholderText_description"),
        value: messages.get("placeholderText_default"),
      }
    }
  });
});