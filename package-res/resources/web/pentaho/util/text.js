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
define(function() {
  "use strict";

  var text = {
    // Ensures the first letter is upper case.
    firstUpperCase: function(s) {
      if(s) {
        var c  = s.charAt(0),
            cU = c.toUpperCase();
        if(c !== cU) s = cU + s.substr(1);
      }
      return s;
    },

    titleFromName: function(name) {
      return text.firstUpperCase(name).replace(/([a-z\d])([A-Z])/g, "$1 $2");
    }
  };

  return text;
});