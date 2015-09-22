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
  "cdf/component/input/implementation",
  "pentaho/messages!implementation",
  "pentaho/theme!implementation"
], function(InputComponent, messages) {

  return InputComponent.extend({
    /**
     * A CDF text box component.
     *
     * @alias TextBox
     * @memberOf pentaho.component.samples
     * @class
     * @extend cdf.component.Input
     */
    constructor: function(options) {
      // ...
    },

    update: function() {
      // ...
      if(!this.placeholderText)
        this.placeholderText = messages.get("defaultPlaceholderText");
    }
  });
});