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
  "./util/domWindow"
], function(domWindow) {

  "use strict";

  // This singleton instance module does not use an intermediary interface to be resolved.
  // It is designed to be defined inline by the webcontext.js script itself,
  // at a bootstrapping phase, where AMD will not be fully configured, yet.
  // This module is a fallback that is used _only_ in a "standalone" scenario (like when testing).

  /**
   * The variables of the Client Platform's _main_ context.
   *
   * @name pentaho.contextVars
   * @type pentaho.spec.IContextVars
   * @amd pentaho/contextVars
   */

  return Object.freeze({
    basePath:      getVar("CONTEXT_PATH"),
    application:   getVar("PENTAHO_CONTEXT_NAME"),
    user:          getVar("SESSION_NAME"),
    userHome:      getVar("HOME_FOLDER"),
    theme:         getVar("active_theme"),
    locale:        getVar("SESSION_LOCALE"),
    reservedChars: getVar("RESERVED_CHARS"),
    reservedCharsDisplay: getVar("RESERVED_CHARS_DISPLAY"),
    reservedCharsPattern: getVar("RESERVED_CHARS_REGEX_PATTERN"),
    serverUrl:      getVar("FULL_QUALIFIED_URL"),
    serverProtocol: getVar("SERVER_PROTOCOL")
  });

  function getVar(name) {
    return domWindow[name] || null;
  }
});
