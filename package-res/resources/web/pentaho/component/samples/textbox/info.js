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
  "cdf/component/input/info",
  "pentaho/messages!info",
  "pentaho/theme!info"
], function(module, InputInfo, messages) {

  /**
   * @name pentaho.component.samples.TextBoxInfo
   * @class
   * @extends cdf.component.InputInfo
   *
   * @amd pentaho/component/samples/textBox/info
   */
  return InputInfo.extend(/** @lends pentaho.component.samples.TextBoxInfo# */{
    id: module.id,
    className: "pentaho-component-samples-textBox",
    // icons:

    // configurable info
    enabled:     true,
    label:       messages.get("label"),
    description: messages.get("description"),
    category:    messages.get("category"),
    helpUrl:     "http://pentaho.com/components/samples/textBox"
  });
});