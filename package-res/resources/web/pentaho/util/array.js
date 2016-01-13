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
  "./object",
  "./fun"
], function(O, fun) {

  "use strict";

  return {
    isSubsetOf: function(sub, sup, key) {
      if(!key) key = fun.identity;

      var L1 = sup.length, L2 = sub.length, i, supIndex;
      if(L2 > L1) return false;

      supIndex = {};
      i = L1;
      while(i--) supIndex[key(sup[i])] = 1;

      i = L2;
      while(i--) if(!O.hasOwn(supIndex, key(sub[i]))) return false;

      return true;
    }
  };
});
