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
  "pentaho/component/Info",
  "pentaho/messages!info",
  "pentaho/theme!info"
], function(module, Info, messages) {

  // Alternative name: index, Index

  /**
   * @name pentaho.component.samples.textBox.info
   * @type pentaho.component.Info
   * @amd pentaho/component/samples/textBox/info
   */
  return new Info({
    id: module.id,
    className: "pentaho-component-samples-textBox",

    // configurable info
    enabled:    true,
    label:       messages.get("label"),
    description: messages.get("description"),
    category:    messages.get("category")
  });
});