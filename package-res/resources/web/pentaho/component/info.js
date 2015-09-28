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
  "./TypeInfo",
  "./IconType",
  "../messages!info",
  "../theme!info"
], function(module, TypeInfo, IconType, messages) {

  // Actual root component type metadata/information.

  return TypeInfo.implement({
    id:          module.id,
    "abstract":  true,
    label:       messages.get("label"),
    description: messages.get("description"),
    category:    messages.get("category"),
    className:   "pentaho-component",
    icons:       IconType.wellKnown.slice()
  });
});