/*!
 * Copyright 2010 - 2016 Pentaho Corporation. All rights reserved.
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

  /**
   * The `KnownFilterKind` enum is the
   * class of names of the standard, concrete [filter]{@link pentaho.type.filter.Abstract} types.
   *
   * @memberOf pentaho.type.filter
   * @enum {string}
   * @readonly
   * @see pentaho.type.filter.Abstract#kind
   */
  var KnownFilterKind = {
    /**
     * The [And]{@link pentaho.type.filter.And} filter kind.
     * @default
     */
    AND: "and",

    /**
     * The [Or]{@link pentaho.type.filter.Or} filter kind.
     * @default
     */
    OR: "or",

    /**
     * The [Not]{@link pentaho.type.filter.And} filter kind.
     * @default
     */
    NOT: "not",

    /**
     * The [IsEqual]{@link pentaho.type.filter.IsEqual} filter kind.
     * @default
     */
    IS_EQUAL: "isEqual",

    /**
     * The [IsIn]{@link pentaho.type.filter.IsIn} filter kind.
     * @default
     */
    IS_IN: "isIn"
  };

  return KnownFilterKind;
});
