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
  "../util/Base",
  "../util/arg",
  "../util/error",
  "../util/object"
], function(module, Base, arg) {

  return Base.extend("pentaho.component.PropertyTypeDefinition", /** @lends pentaho.component.PropertyTypeDefinition# */{
    /**
     * @alias PropertyTypeDefinition
     * @memberOf pentaho.component
     *
     * @class
     *
     * @classdesc The `PropertyTypeDefinition` class is the base abstract class
     *    of classes that represent a _type of property_ of a component type.
     *
     * @description Creates a property type definition given a specification.
     *
     * @param {pentaho.component.IPropertyTypeDefinition} spec The property type definition specification.
     */
    constructor: function(spec) {
      /**
       * Gets the id of the property type.
       *
       * A property with no id is called an anonymous property
       * and is used when a property type is defined inline
       * with a certain component type.
       *
       * Otherwise, the id of a property type is the id of the AMD/RequireJS module
       * that defines it.
       *
       * @type string|undefined
       * @readonly
       * @default undefined
       */
      this.id = arg.optional(spec, "id") || undefined;

      /**
       * Gets or sets the default label of the property type.
       *
       * @type string|undefined
       * @default undefined
       */
      this.label = arg.optional(spec, "label") || undefined;

      /**
       * Gets or sets the default description of the property type.
       *
       * @type string|undefined
       * @default undefined
       */
      this.description = arg.optional(spec, "description") || undefined;

      /**
       * Gets or sets the type of _atomic_ value that the property supports.
       *
       * When a property accepts multiple values the type of its "compound" value is an array of `valueType`.
       *
       * See {@link pentaho.component.PropertyTypeDefinition#allowMultiple}.
       *
       * @type string
       * @default "string"
       */
      this.valueType = arg.optional(spec, "valueType") || "string";

      // required and minOccur

      var required = arg.optional(spec, "required");
      var minOccur = parseNum(arg.optional(spec, "minOccur"));
      if(required == null) {
        if(minOccur == null) minOccur = 0;
      } else if(minOccur == null) {
        minOccur = required ? 1 : 0;
      } else if(!minOccur && required) {
        minOccur = 1;
      }

      this.minOccur = minOccur;

      // allowMultiple and maxOccur

      var allowMultiple = arg.optional(spec, "allowMultiple");
      var maxOccur = parseNum(arg.optional(spec, "maxOccur"));
      if(allowMultiple == null) {
        if(maxOccur == null) maxOccur = minOccur;
      } else if(maxOccur == null) {
        maxOccur = allowMultiple ? Infinity : minOccur;
      } else if(maxOccur > minOccur && !allowMultiple) {
        maxOccur = minOccur;
      }

      this.maxOccur = maxOccur;
    },

    /**
     * Gets or sets a value that indicates if this property must be specified.
     *
     * A value is considered unspecified if its value is one of the JavaScript values:
     * `undefined`, an empty string, `""`, or `NaN`.
     *
     * By definition, a property is required if `minOccur > 0`.
     *
     * @type boolean
     * @see pentaho.component.PropertyTypeDefinition#minOccur
     * @see pentaho.component.PropertyTypeDefinition#maxOccur
     * @see pentaho.component.PropertyTypeDefinition#allowMultiple
     */
    get required() {
      return this._minOccur > 0;
    },

    set required(value) {
      if(value !== undefined) {
        // Reset?
        //if(value == null) value = false;

        value = !!value;
        if(value !== this.required) {
          this.minOccur = value ? 1 : 0;
        }
      }
    },

    /**
     * Gets or sets a value that indicates if this property
     * can have
     * more than one value and
     * more than the minimum number of values.
     *
     * This is, it says that a property is a _list_ property (more than one element)
     * that has _variable_ value length.
     *
     * By definition, `allowMultiple = maxOccur > 1 && minOccur < maxOccur`.
     *
     * @type boolean
     * @see pentaho.component.PropertyTypeDefinition#maxOccur
     * @see pentaho.component.PropertyTypeDefinition#minOccur
     * @see pentaho.component.PropertyTypeDefinition#required
     */
    get allowMultiple() {
      return this._maxOccur > 1 && this._minOccur < this._maxOccur;
    },

    set allowMultiple(value) {
      if(value !== undefined) {
        // Reset?
        //if(value == null) value = false;

        value = !!value;
        if(value !== this.allowMultiple) {
          // 1 will be clipped to minOccur, when minOccur is > 1.
          this.maxOccur = value ? Infinity : 1;
        }
      }
    },

    /**
     * Gets or sets the minimum number of values that a property must have.
     *
     * A number greater than or equal to `0`.
     *
     * The default value depends on the default value of
     * {@link pentaho.component.PropertyTypeDefinition#required}.
     *
     * When `required` is not specified, then the default value is `0`.
     *
     * Otherwise,
     * when `required` is specified as `true`, then the default value is `1`,
     * and when specified as `false`, the default value is `0`.
     *
     * When both are specified, the most restrictive wins.
     * Thus, if `required` is specified as `true` and `minOccur` is specified as `0`,
     * then `minOccur` is set to `1`.
     *
     * @type number
     * @see pentaho.component.PropertyTypeDefinition#maxOccur
     * @see pentaho.component.PropertyTypeDefinition#required
     * @see pentaho.component.PropertyTypeDefinition#allowMultiple
     */
    get minOccur() {
      return this._minOccur;
    },

    set minOccur(value) {
      if(value !== undefined) {
        // Reset?
        if(value == null || value < 0) value = 0;

        this._minOccur = value;
      }
    },

    /**
     * Gets or sets the maximum number of values that a property can have.
     *
     * A number greater than or equal to `1`, possibly, `Infinity`.
     *
     * The default value depends on the specified value of
     * {@link pentaho.component.PropertyTypeDefinition#allowMultiple}.
     *
     * When `allowMultiple` is not specified,
     * then the default value is the greatest between `1` and `minOccur`.
     *
     * Otherwise,
     * when `allowMultiple` is specified as `true`,
     * then the default value is `Infinity`.
     *
     * When `allowMultiple` is specified as `false`,
     * then the default value is, again, the greatest between `1` and `minOccur`.
     *
     * @type number
     * @see pentaho.component.PropertyTypeDefinition#minOccur
     * @see pentaho.component.PropertyTypeDefinition#required
     * @see pentaho.component.PropertyTypeDefinition#allowMultiple
     */
    get maxOccur() {
      return this._maxOccur;
    },

    set maxOccur(value) {
      if(value !== undefined) {
        // Reset?
        if(value == null || value < 0) value = 1;

        this._maxOccur = Math.max(1, this._minOccur, value);
      }
    }
  });

  function parseNum(num, dv) {
    if(num != null) {
      num = +num;
      if(isNaN(num)) num = null;
    }
    return num != null ? num :
           dv  != null ? dv  :
           null;
  }
});