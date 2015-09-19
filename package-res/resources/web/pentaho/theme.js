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

/*global active_theme:true */

/**
 * RequireJS loader plugin for loading local themes.
 *
 * This plugin depends on the "css" plugin.
 *
 * The plugin reads the "themes" module in the same module folder as
 * the module requesting the theme (relative paths are also possible, read below).
 *
 * The _themes_ file contains a set of local theme definitions.
 *
 * _Themes_ files can have multiple parts or a single part.
 * When multi-part, each theme has a set of parts which can be requested independently.
 * When single-part, each theme has a single, unnamed part.
 *
 * A theme part, is constituted by a list of style files.
 * Currently, only CSS files are supported.
 *
 * The following is a sample multi-part _themes_ module:
 * ```javascript
 *  define({
 *    // Root themes folder.
 *    // Each theme then lies in a subfolder of this one,
 *    // having the same name as the theme
 *    // (e.g.: "./themes/default/definition.css").
 *    // Default value is `"./themes"`.
 *    root: "./themes",
 *
 *    // Supported themes and their definition
 *    themes: {
 *      // The "default" theme is a special theme that is used instead of an unsupported theme.
 *      "default": {
 *
 *        // A theme part and the files it includes (relative to theme folder).
 *        "definition": [
 *          "../base/definition.css",
 *          "./definition.css"
 *        ],
 *
 *        "implementation": ["./implementation.css"]
 *      }
 *    }
 *  });
 * ```
 *
 * While the following is a sample single-part _themes_ module:
 * ```javascript
 *  define({
 *    // Root themes folder.
 *    root: "./themes",
 *
 *    // Supported themes and their definition
 *    themes: {
 *      // The "default" theme is a special theme that is used instead of an unsupported theme.
 *      // A single-part themes directly lists the files it includes (relative to theme folder).
 *      "default": [
 *        "../base/definition.css",
 *        "./definition.css"
 *      ]
 *    }
 *  });
 * ```
 *
 * Suppose that the following is module placed in the
 * same module directory as the just shown "themes" file.
 * Requesting a theme part is done by passing
 * the part name to the "pentaho/theme" plugin:
 *
 * ```javascript
 * define([
 *   "pentaho/theme!implementation"
 * ], function() {
 *
 * });
 * ```
 *
 * In a more complex scenario, the module that requests the
 * theme is in a directory different from that of the "themes" file.
 * When that is the case,
 * note that the argument to the "pentaho/theme" plugin
 * is generally composed of
 * the relative path to the themes file followed by
 * the part name.
 *
 * If the "themes" file were in a sub-folder "bar/gugu",
 * the theme part named `"implementation"`
 * would be requested like `"pentaho/theme!bar/gugu/implementation"`
 * If, however, it were in a grand-parent folder,
 * it would be requested like `"pentaho/theme!../../implementation"`.
 */
define([
  "./util/object",
  "css"
], function(O) {
  "use strict";

  function LoadThemeAction(require, onLoad) {
    this.require = require;
    this.onLoad  = onLoad;

    this.themesBase = null;
    this.themeName  = (typeof active_theme !== "undefined") ? active_theme : null;
    this.partName   = null;
  }

  LoadThemeAction.prototype.act = function(partPath) {
    this._setPartPath(partPath);

    this.require([this.themesBase + "/themes"], this._gotThemes.bind(this));
  };

  /**
   * From the given theme part path
   * determines the "themes" base module and the theme part name.
   *
   * @param {string} [partPath="single"] The theme part path.
   *
   * @throws {Error} If the specified theme part path has an invalid syntax.
   */
  LoadThemeAction.prototype._setPartPath = function(partPath) {
    if(!partPath) partPath = ""; // must be a single part theme!

    // Can only have an embedded relative path to the "themes" file location
    // if there is at least one "/" character.
    var i = partPath.lastIndexOf("/"),
        base, part;
    if(i < 0) {
      base = ".";
      part = partPath;
    } else {
      base = partPath.substr(0, i);
      part = partPath.substr(i + 1);

      if(!base) throw new Error("[pentaho/theme!] Part path argument cannot be absolute: '" + partPath + "'");

      // part can be empty!
      // e.g.: "mythemes/" has an empty part and denotes the
      //   single part theme whose "themes"" file is the module "./mythemes/themes".

      // Ensure to follow the AMD relative module ids convention.
      if(base[0] !== ".") base = "./" + base;
    }

    this.themesBase = base;
    this.partName   = part;
  };

  LoadThemeAction.prototype._gotThemes = function(themesSpec) {
    // Get active theme spec
    var themesMap = themesSpec.themes || {},
        themeSpec = this.themeName ? O.getOwn(themesMap, this.themeName) : null;

    if(!themeSpec) {
      if(!(themeSpec = O.getOwn(themesMap, "default")))
        return void this.onLoad();

      this.themeName = "default";
    }

    if(themeSpec instanceof Array) {
      // This is a single part theme. The single part name is "".
      themeSpec = {"": themeSpec};
    }

    // Get part files
    var styleFiles = O.getOwn(themeSpec, this.partName);
    if(!styleFiles || !styleFiles.length)
      return void this.onLoad();

    var base = "css!" + this.themesBase + "/" + (themesSpec.root || "themes") + "/" + this.themeName + "/";
    styleFiles = styleFiles.map(function(styleFile) { return base + styleFile; });

    this.require(styleFiles, function() { this.onLoad(); }.bind(this));
  };

  return {
    load: function(partPath, require, onLoad, config) {

      if(config.isBuild) {
        // Indicate that the optimizer should not wait for this resource and complete optimization.
        // This resource will be resolved dynamically during run time in the web browser.
        onload();
      } else {
        new LoadThemeAction(require, onLoad).act(partPath);
      }
    }
  };
});
