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
  "../lang/Base",
  "../util/fun"
], function(Base, fun) {

  var IconType = Base.extend("pentaho.component.IconType", /** @lends pentaho.component.IconType# */{
    /**
     * @classsesc The `IconType` class contains metadata about a type of icon
     * as well as static members with the well-known icon types.
     *
     * Each icon type has an intended use, specific dimensions and an associated CSS class.
     *
     * All icon types should have 32 bit of color depth and a transparent background.
     *
     * #### AMD
     *
     * To obtain the constructor of this class,
     * require the module `"pentaho/component/IconType"`.
     *
     * @alias IconType
     * @memberOf pentaho.component
     * @class
     *
     * @description Creates an icon type given an icon type specification.
     * @param {Object} spec The icon type specification.
     * @param {string} spec.name The name of the icon type.
     * @param {number} spec.width The width of the icon type.
     * @param {number} spec.height The height of the icon type.
     * @param {string} spec.className The CSS class name of the icon type.
     */
    constructor: function(spec) {
      /**
       * Gets the name of the icon type.
       * @type string
       * @readonly
       */
      this.name = spec.name;

      /**
       * Gets the width of the icon type.
       * @type number
       * @readonly
       */
      this.width = spec.width;

      /**
       * Gets the height of the icon type.
       * @type number
       * @readonly
       */
      this.height = spec.height;

      /**
       * Gets the CSS class name of the icon type
       * @string
       * @readonly
       */
      this.className = spec.className;
    },

    /**
     * Gets the area of the icon type.
     * @type number
     * @readonly
     */
    get area() {
      return this.width * this.height;
    }

  }, /** @lends pentaho.component.IconType */{
    /**
     * Gets the array of well known icon types,
     * ordered from smaller to larger area.
     *
     * @type !Array.<!pentaho.component.IconType>
     * @readonly
     */
    wellKnown: [],

    /**
     * A small-size, square icon: `"small"`.
     *
     * Used to represent a component type in a menu entry
     * or small toolbar button.
     *
     * **Dimensions** [w x h]: 16 x 16.
     *
     * **CSS class**: `component-icon-small`.
     *
     * @type !pentaho.component.IconType
     * @readonly
     */
    SMALL: new IconType({name: "small", width: 16, height: 16, className: "component-icon-small"}),

    /**
     * A medium-size, square icon: `"medium"`.
     *
     * Used to represent a component type in a small "icons" view.
     *
     * **Dimensions** [w x h]: 32 x 32.
     *
     * **CSS class**: `component-icon-medium`.
     *
     * @type !pentaho.component.IconType
     * @readonly
     */
    MEDIUM: new IconType({name: "medium", width: 32, height: 32, className: "component-icon-medium"}),

    /**
     * A large-size, square icon: `"large"`.
     *
     * Used to represent a component type
     * in a large "icons" view or in a standalone view.
     *
     * **Dimensions** [w x h]: 64 x 64.
     *
     * **CSS class**: `component-icon-large`.
     *
     * @type !pentaho.component.IconType
     * @readonly
     */
    LARGE: new IconType({name: "large", width: 64, height: 64, className: "component-icon-large"}),

    /**
     * A large-size, landscape-shape icon: `"landscape"`.
     *
     * Used to represent a component type in a standalone view.
     *
     * **Dimensions** [w x h]: 192 x 128 (3:2 aspect ratio)
     *
     * **CSS class**: `component-icon-landscape`.
     *
     * @type !pentaho.component.IconType
     * @readonly
     */
    LANDSCAPE: new IconType({name: "landscape", width: 192, height: 128, className: "landscape"}),

    /**
     * Converts a value to an icon type.
     *
     * If the value is an icon type, it is returned.
     *
     * If the value is a string,
     * it must be the name of a well-known icon type,
     * and that icon type is returned.
     *
     * Otherwise, the value _must_ be a icon type specification
     * used to create a new icon type that is then returned.
     *
     * @param {pentaho.component.IconType|string|Object} value The value to convert.
     * @return {pentaho.component.IconType} The corresponding icon type.
     * @throws {Error} When the specified value is a string and a
     *   a well-known icon type with that name does not exist.
     */
    to: function(value) {
      if(value instanceof IconType) return value;
      if(typeof value === "string") return IconType.wellKnown.get(value, true);
      return new IconType(value);
    },

    /**
     * Compares two icon types by area.
     *
     * @param {!pentaho.component.IconType} a The first icon type.
     * @param {!pentaho.component.IconType} b The second icon type.
     * @return {number} `-1` if the area of `a` is smaller than that of `b`,
     *    `1` if the area of `a` is greater than that of `b`,
     *     and `0` otherwise.
     */
    areaComparer: function(a, b) {
      return fun.compare(a.area, b.area);
    }
  });

  IconType.wellKnown.push(
    IconType.SMALL,
    IconType.MEDIUM,
    IconType.LARGE,
    IconType.LANDSCAPE
  );

  // Quick and dirty... Need Collection class.
  IconType.wellKnown.has = function(name) {
    return IconType[name] instanceof IconType;
  };

  IconType.wellKnown.includes = function(iconType) {
    return this.indexOf(iconType) >= 0;
  };

  IconType.wellKnown.get = function(name, assertExists) {
    var iconType = IconType[name];
    if(iconType instanceof IconType) return iconType;
    if(assertExists) throw new Error("Undefined icon type '" + name +  "'.");
    return null;
  };

  return IconType;
});