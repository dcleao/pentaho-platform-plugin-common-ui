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
define([
  "./util/object"
], function(O) {

  "use strict";

  /* eslint no-use-before-define: 0 */

  /*
   * The DebugLevelsProto / DebugLevels separation is so that the parse method is not an own property of
   * DebugLevels - the enum values are its only own properties.
   */

  var DebugLevelsProto = {
    // Unfortunately, there's no way to document a method on a JsDoc enum... :-(
    parse: function DebugLevels_parse(level, defaultLevel) {
      if(level != null && level !== "") {
        var l = Math.floor(+level);
        if(!isNaN(l)) {
          return Math.max(DebugLevels.none, l);
        } else if((l = O.getOwn(DebugLevels, String(level).toLowerCase())) != null) {
          return l;
        }
      }
      return defaultLevel != null ? defaultLevel : DebugLevels.debug;
    }
  };

  /**
   * The `DebugLevels` enum is the class of names of well known _debugging levels_.
   *
   * The enum also exposes a `parse` method.
   *
   * @memberOf pentaho.util
   * @enum {number}
   * @readonly
   */
  var DebugLevels = {
    /**
     * The `none` debugging level represents the absence of information or not wanting to receive any.
     * @default
     */
    none: 0,

    /**
     * The `error` debugging level represents error events.
     * @default
     */
    error: 1,

    /**
     * The `exception` is an alias for the [error]{@link pentaho.util.DebugLevels#error} level.
     * @default
     */
    exception: 1,

    /**
     * The `warn` debugging level represents events that might be a problem or not.
     * @default
     */
    warn: 2,

    /**
     * The `info` debugging level represents general information.
     * @default
     */
    info: 3,

    /**
     * The `debug` debugging level represents information that is relevant to actually _debug_ an application.
     * @default
     */
    debug: 4,

    /**
     * The `log` debugging level is an alias for the [debug]{@link pentaho.util.DebugLevels#debug} level.
     * @default
     */
    log: 4,

    /**
     * The `trace` debugging level represents information with the same character as
     * the [debug]{@link pentaho.util.DebugLevels#debug} level, but more detailed.
     *
     * @default
     */
    trace: 5,

    /**
     * The `all` debugging level represents _all_ information.
     * @default
     */
    all: Infinity
  };

  return (DebugLevels = Object.freeze(O.assignOwn(Object.create(DebugLevelsProto), DebugLevels)));
});
