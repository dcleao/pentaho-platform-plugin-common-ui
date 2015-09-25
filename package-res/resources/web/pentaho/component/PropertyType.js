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
  "./PropertyAtomicValueLabel",
  "../util/Base",
  "../util/arg"
], function(module, PropertyAtomicValueLabel, Base, arg) {

  var PropertyAtomicValueLabelCollection = Collection.extend("pentaho.component.PropertyAtomicValueLabelCollection", {
    //region List implementation
    elemClass: PropertyAtomicValueLabel
    //endregion
  });

  /**
   * @name PropertyType
   * @memberOf pentaho.component
   *
   * @class
   *
   * @classdesc The `PropertyType` class is the base abstract class
   *    of classes that represent a _type of property_ of a component type.
   *
   * @description Creates a property type given a specification.
   *
   * @param {pentaho.component.IPropertyTypeSpec} spec The property type specification.
   */

  return Base.extend("pentaho.component.PropertyType", /** @lends pentaho.component.PropertyType# */{

  }, /** @lends pentaho.component.PropertyType */{
    /**
     * @alias PropertyType
     * @memberOf pentaho.component
     *
     * @class
     *
     * @classdesc The `PropertyType` class is the base abstract class
     *    of classes that represent a _type of property_ of a component type.
     *
     * @description Creates a property type given a specification.
     *
     * @param {!pentaho.component.IPropertyTypeSpec} instSpec The property type _instance_ specification.
     * @param {Object} [classSpec] The property type _class_ specification.
     */
    extend: function(instSpec, classSpec) {
      if(!instSpec) throw error.argRequired("instSpec");

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
      instSpec.id = instSpec.id || undefined;

      /**
       * Gets or sets the default alias of the property type.
       *
       * @type string
       */
      this.alias = arg.required(instSpec, "alias", "instSpec");

      /**
       * Gets or sets the default label of the property type.
       *
       * @type string
       */
      this.label = arg.required(instSpec, "label", "instSpec");

      /**
       * Gets or sets the default description of the property type.
       *
       * @type string|undefined
       * @default undefined
       */
      this.description = instSpec.description || undefined;

      /**
       * Gets or sets the type of _atomic_ value that the property supports.
       *
       * When a property accepts multiple values the type of its
       * "compound" value is an array of `valueType`.
       *
       * @type string
       * @default "string"
       * @see pentaho.component.PropertyAtomicValue
       * @see pentaho.component.PropertyType#allowMultiple
       */
      this.valueType = instSpec.valueType || "string";

      // required and countMin

      var required = instSpec.required;
      var countMin = parseNum(instSpec.countMin);
      if(required == null) {
        if(countMin == null) countMin = 0;
      } else if(countMin == null) {
        countMin = required ? 1 : 0;
      } else if(!countMin && required) {
        countMin = 1;
      }

      this.countMin = countMin;

      // allowMultiple and countMax

      // allowMultiple => countMax > 1
      var allowMultiple = instSpec.allowMultiple;
      var countMax = parseNum(arg.optional(spec, "countMax"));
      if(allowMultiple == null) {
        if(countMax == null) countMax = countMin;
      } else if(countMax == null) {
        countMax = allowMultiple ? Infinity : countMin;
      } else if(!allowMultiple && countMax > 1) {
        countMax = Math.max(1, countMin);
      } else if(countMin > countMax) {
        countMax = countMin;
      }

      this.countMax = countMax;

      // min, max

      var min = arg.optional(spec, "min");
      var max = arg.optional(spec, "max");
      if(min != null && max != null && min > max) max = min;

      /**
       * The minimum value that the property can take as a value.
       *
       * Applies only to properties whose {@link pentaho.component.PropertyType#valueType}
       * can be meaningfully compared using the JavaScript's `<` and `>` operators.
       *
       * @type pentaho.component.PropertyAtomicValue|undefined
       * @default undefined
       * @see pentaho.component.PropertyType#max
       */
      this.min = min;

      /**
       * The maximum value that the property can take as a value.
       *
       * Applies only to properties whose {@link pentaho.component.PropertyType#valueType}
       * can be meaningfully compared using the JavaScript's `<` and `>` operators.
       *
       * @type pentaho.component.PropertyAtomicValue|undefined
       * @default undefined
       * @see pentaho.component.PropertyType#min
       */
      this.max = max;

      var values = arg.optional(spec, "values");

      /**
       * Gets the collection of possible values,
       * or `null` when there are no fixed values.
       *
       * The type of each value should be consistent with
       * the value of {@link pentaho.component.PropertyType#valueType}.
       *
       * @type ?pentaho.lang.Collection.<pentaho.component.PropertyAtomicValueLabel>
       */
      this.values = values && values.length ? PropertyAtomicValueLabelCollection.to(values) : null;

      // value

      var value = arg.optional(spec, "value");
      if(value === undefined && countMin > 0 && this.values) {
        if(this.allowMultiple) {
          var i = -1,
              L = Math.max(countMin, this.values.length);

          value = new Array(L);

          while(++i < L) value[i] = this.values[i].value;

        } else {
          value = this.values[0].value;
        }
      }

      /**
       * Gets or sets the default property value.
       *
       * When the property allows multiple values,
       * the value is an array, otherwise it is not.
       *
       * When a default value is not specified and the property is _required_,
       * as many values as the minimum required are chosen as default.
       *
       * Otherwise, the default value is `undefined`.
       *
       * @type pentaho.component.PropertyValue|undefined
       */
      this.value = value;
    },

    _countMax: 1,

    /**
     * Gets or sets a value that indicates if the property must be specified.
     *
     * A value is considered unspecified if it is `undefined`.
     *
     * By definition, a property is required if `countMin > 0`.
     *
     * @type boolean
     * @see pentaho.component.PropertyType#countMin
     * @see pentaho.component.PropertyType#countMax
     * @see pentaho.component.PropertyType#allowMultiple
     */
    get required() {
      return this._countMin > 0;
    },

    set required(value) {
      if(value !== undefined) {
        // Reset?
        //if(value == null) value = false;

        value = !!value;
        if(value !== this.required) {
          this.countMin = value ? 1 : 0;
        }
      }
    },

    /**
     * Gets or sets a value that indicates if the property
     * can have more than one value.
     *
     * By definition, `allowMultiple = countMax > 1`.
     *
     * @type boolean
     * @see pentaho.component.PropertyType#countMax
     * @see pentaho.component.PropertyType#countMin
     * @see pentaho.component.PropertyType#required
     */
    get allowMultiple() {
      return this._countMax > 1;
    },

    set allowMultiple(value) {
      if(value !== undefined) {
        // Reset?
        //if(value == null) value = false;

        value = !!value;
        if(value !== this.allowMultiple) {
          // 1 will be clipped to countMin, when countMin is > 1.
          this.countMax = value ? Infinity : 1;
        }
      }
    },

    /**
     * Gets or sets the minimum number of values that a property must have.
     *
     * A number greater than or equal to `0`.
     *
     * ### Default value
     *
     * The default value depends on the default value of
     * {@link pentaho.component.PropertyType#required}.
     *
     * When `required` is not specified, then the default value is `0`.
     *
     * Otherwise,
     * when `required` is specified as `true`, then the default value is `1`,
     * and when specified as `false`, the default value is `0`.
     *
     * When both are specified, the most restrictive wins.
     * Thus, if `required` is specified as `true` and `countMin` is specified as `0`,
     * then `countMin` is set to `1`.
     *
     * @type number
     * @see pentaho.component.PropertyType#countMax
     * @see pentaho.component.PropertyType#required
     * @see pentaho.component.PropertyType#allowMultiple
     */
    get countMin() {
      return this._countMin;
    },

    set countMin(value) {
      if(value !== undefined) {
        // Reset?
        if(value == null || value < 0 || !isFinite(value)) value = 0;

        this._countMin = value;

        // Maintain the invariant
        if(value > this._countMax) this._countMax = value;
      }
    },

    /**
     * Gets or sets the maximum number of values that a property can have.
     *
     * A number greater than or equal to `1`, possibly, `Infinity`.
     *
     * ### Default value
     *
     * The default value depends on the specified value of
     * {@link pentaho.component.PropertyType#allowMultiple}.
     *
     * When `allowMultiple` is not specified,
     * then the default value is the greatest between `1` and `countMin`.
     *
     * Otherwise,
     * when `allowMultiple` is specified as `true`,
     * then the default value is `Infinity`.
     *
     * When `allowMultiple` is specified as `false`,
     * then the default value is, again, the greatest between `1` and `countMin`.
     *
     * When both are specified, the most restrictive wins.
     * Thus, if `allowMultiple` is specified as `false` and `countMax` is specified and greater than `1`,
     * then `countMax` is set to the minimum between `countMin` and `1`.
     *
     * @type number
     * @see pentaho.component.PropertyType#countMin
     * @see pentaho.component.PropertyType#required
     * @see pentaho.component.PropertyType#allowMultiple
     */
    get countMax() {
      return this._countMax;
    },

    set countMax(value) {
      if(value !== undefined) {
        // Reset?
        if(value == null || value < 1) value = 1;

        this._countMax = value;

        // Keep the invariant.
        if(this._countMin > value) this._countMin = value;
      }
    },

    /**
     * Validates the value of the property.
     *
     * This implementation performs basic value validation,
     * like "requiredness" and minimum occurrence.
     *
     * The returned `Error` objects should have a string `code` property with an error code.
     *
     * @param {Object} [keyArgs] The keyword arguments object.
     * @return {Error[]|null} A non-empty array of error objects, or `null`, when there are no validation errors.
     */
    validate: function() {

    }
  });

  function parseNum(num, dv) {
    if(num != null) {
      num = +num;
      if(isNaN(num)) num = null;
    }
    return num != null          ? num :
           arguments.length > 1 ? dv  :
           null;
  }
});