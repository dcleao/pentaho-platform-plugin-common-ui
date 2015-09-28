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
  "../SingleValueLabel",
  "../../util/Base",
  "../../util/Collection",
  "../../util/arg",
  "../../util/error",
  "../../util/object"
], function(module, SingleValueLabel, Base, Collection, arg, error, O) {

  var SingleValueLabelCollection = Collection.extend("pentaho.component.SingleValueLabelCollection", {
    //region List implementation
    elemClass: SingleValueLabel
    //endregion
  });

  /**
   * @name AnyModel
   * @memberOf pentaho.component.properties
   *
   * @class
   *
   * @amd pentaho/component/properties/any
   *
   * @classdesc The `AnyModel` class is the base class of property models.
   *
   * ### AMD
   *
   * **Module Id**: `"pentaho/component/properties/any"`
   *
   * @description Creates a property given a specification.
   * @param {pentaho.component.properties.spec.IAnyModel} spec The property model specification.
   */

  return Base.extend("pentaho.component.properties.AnyModel", /** @lends pentaho.component.properties.AnyModel# */{

    _isPrototype: function() {
      return this === this.constructor.prototype;
    },


    //region Identification and Informational properties

    //region id property

    // -> nonEmptyString, Optional, Shared, ReadOnly

    _id: null,

    /**
     * Gets or sets the id of the property type.
     *
     * Can only be specified when defining the property model class,
     * in {@link pentaho.component.properties.spec.IAnyModelExtend#id}.
     *
     * Once set, cannot be changed.
     *
     * Only properties which have an associated AMD/RequireJS module have an id.
     *
     * This property is not inherited.
     *
     * @type ?nonEmptystring
     */
    get id() {
      return this._id;
    },

    set id(value) {
      // Can only be called once, and on the class prototype.
      if(!this._isPrototype()) throw error.operInvalid("'id' can only be called on the prototype.");
      if(O.hasOwn(this, "_id")) throw error.operInvalid("'id' can only be set once.");

      this._id = value || null;
    },
    //endregion

    //region name property

    // -> nonEmptyString, Required, Inherited, ReadOnly

    _name: undefined,

    /**
     * Gets or sets the name of properties of this type, when used in a component.
     *
     * The default value is that specified when defining the property model class,
     * through {@link pentaho.component.properties.spec.IAnyModelExtend#name},
     * or is inherited from the base property model class.
     *
     * Set to `undefined` to reset the value to its default.
     *
     * Can only be set during construction of a property model instance
     * and becomes readonly afterwards.
     *
     * A property model must have a non-empty name, own or inherited.
     *
     * @type string
     */
    get name() {
      return this._name;
    },

    set name(name) {
      if(name === undefined) {
        delete this._name;
        // Ensure there is an inherited value.
        if(!this._name) throw error.argRequired("name");
      } else {
        if(!name) throw error.argRequired("name");
        this._name = name;
      }
    },
    //endregion

    //region browsable property

    // -> Optional(true), Inherited, Configurable, ReadOnlyAfterConfig,

    _browsable: true,

    /**
     * Gets or sets a value that indicates if properties of this type can be
     * displayed to the user in a component properties browser.
     *
     * The default value is that specified when defining the property model class,
     * through {@link pentaho.component.properties.spec.IAnyModelExtend#browsable},
     * or is inherited from the base property model class.
     *
     * Set to `undefined` to reset the value to its default.
     * Any other value is converted to boolean using `Boolean` (`null` included).
     *
     * The default value of the root property model class is `true`.
     *
     * Can be configured through {@link pentaho.component.properties.spec.InyModelConfig#browsable}.
     *
     * @type boolean
     */
    get browsable() {
      return this._browsable;
    },

    set browsable(value) {
      if(value === undefined) {
        delete this._browsable;
      } else {
        this._name = !!value;
      }
    },
    //endregion

    //region label property

    // -> nonEmptyString, Required, Inherited, Configurable, ReadOnlyAfterConfig, Localized

    _label: undefined,

    /**
     * Gets or sets the label of the properties of this type.
     *
     * The label is a localized, short description of the property type.
     * It should be suitable for display as a _label_, beside the property value.
     *
     * The default value is that specified when defining the property model class,
     * through {@link pentaho.component.properties.spec.IAnyModelExtend#label},
     * or is inherited from the base property model class.
     *
     * Set to `undefined` to reset the value to its default.
     *
     * A property model must have a non-empty label, own or inherited.
     *
     * Can be configured through {@link pentaho.component.properties.spec.IAnyModelConfig#label}.
     *
     * @type string
     */
    get label() {
      return this._label;
    },

    set label(value) {
      if(value === undefined) {
        delete this._label;
        // Ensure there is an inherited value.
        if(!this._label) throw error.argRequired("label");
      } else {
        // null || ""
        if(!value) throw error.argRequired("label");
        this._label = value;
      }
    },
    //endregion

    //region description property

    // -> nonEmptyString, Optional, Inherited, Configurable, ReadOnlyAfterConfig, Localized

    _description: null,

    /**
     * Gets or sets the description of the properties of this type.
     *
     * The description is localized.
     * It should be suitable for display in a tooltip.
     *
     * The default value is that specified when defining the property model class,
     * through {@link pentaho.component.properties.spec.IAnyModelExtend#description},
     * or is inherited from the base property model class.
     *
     * Set to `undefined` to reset the value to its default.
     *
     * Set to `null` or `""` to clear the description and force it to be `null`,
     * even if a non-empty description would be inherited.
     *
     * The default value of the root property model class is `null`.
     *
     * Can be configured through {@link pentaho.component.properties.spec.IAnyModelConfig#description}.
     *
     * @type null|nonEmptyString
     */
    get description() {
      return this._description;
    },

    set description(value) {
      if(value === undefined) {
        delete this._description;
      } else {
        this._description = value || null;
      }
    },
    //endregion

    //region category property

    // -> nonEmptyString, Required, Inherited, Configurable, ReadOnlyAfterConfig, Localized
    _category: null,

    /**
     * Gets or sets the category of the properties of this type.
     *
     * A localized, short description of the category,
     * used to group properties in a designer user interface.
     *
     * The default value is that specified when defining the property model class,
     * through {@link pentaho.component.properties.spec.IAnyModelExtend#category},
     * or is inherited from the base property model class.
     *
     * Set to `undefined` to reset the value to its default.
     *
     * A property model must have a non-empty category, own or inherited.
     *
     * The default value of the root property model class is `Miscellaneous`.
     *
     * Can be configured through {@link pentaho.component.properties.spec.IAnyModelConfig#category}.
     *
     * @type nonEmptyString
     */
    get category() {
      return this._category;
    },

    set category(value) {
      if(value === undefined) {
        delete this._category;
        // Ensure there is an inherited value.
        if(!this._category) throw error.argRequired("category");
      } else {
        // null || ""
        if(!value) throw error.argRequired("category");
        this._category = value;
      }
    },
    //endregion

    //region helpUrl property

    // -> nonEmptyString, Optional, Inherited, Configurable, ReadOnlyAfterConfig, Localized?

    _helpUrl: null,

    /**
     * Gets or sets the help url of the properties of this type.
     *
     * The default value is that specified when defining the property model class,
     * through {@link pentaho.component.properties.spec.IAnyModelExtend#description},
     * or is inherited from the base property model class.
     *
     * Set to `undefined` to reset the value to its default.
     *
     * Set to `null` or `""` to clear the help url and force it to be `null`,
     * even if a non-empty help url would be inherited.
     *
     * The default value of the root property model class is `null`.
     *
     * Can be configured through {@link pentaho.component.properties.spec.IAnyModelConfig#helpUrl}.
     *
     * @type null|nonEmptyString
     */
    get helpUrl() {
      return this._helpUrl;
    },

    set helpUrl(value) {
      if(value === undefined) {
        delete this._helpUrl;
      } else {
        this._helpUrl = value || null;
      }
    },

    //endregion

    //endregion

    //region countMin/Max properties

    //region required property
    /**
     * Gets or sets a value that indicates if the property must be specified.
     *
     * A value is considered unspecified if it is `undefined`.
     *
     * By definition, a property is required if `countMin > 0`.
     *
     * @type boolean
     * @see pentaho.component.properties.AnyModel#countMin
     * @see pentaho.component.properties.AnyModel#countMax
     * @see pentaho.component.properties.AnyModel#multiple
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
    //endregion

    //region multiple property
    /**
     * Gets or sets a value that indicates if the property
     * can have more than one value.
     *
     * By definition, `multiple = countMax > 1`.
     *
     * @type boolean
     * @see pentaho.component.properties.AnyModel#countMax
     * @see pentaho.component.properties.AnyModel#countMin
     * @see pentaho.component.properties.AnyModel#required
     */
    get multiple() {
      return this._countMax > 1;
    },

    set multiple(value) {
      if(value !== undefined) {
        // Reset?
        //if(value == null) value = false;

        value = !!value;
        if(value !== this.multiple) {
          // 1 will be clipped to countMin, when countMin is > 1.
          this.countMax = value ? Infinity : 1;
        }
      }
    },
    //endregion

    //region countMin property
    _countMin: 0,

    /**
     * Gets or sets the minimum number of values that a property must have.
     *
     * A number greater than or equal to `0`.
     *
     * #### Default value
     *
     * The default value depends on the default value of
     * {@link pentaho.component.properties.AnyModel#required}.
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
     * @see pentaho.component.properties.AnyModel#countMax
     * @see pentaho.component.properties.AnyModel#required
     * @see pentaho.component.properties.AnyModel#multiple
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
    //endregion

    //region countMax property
    _countMax: 1,

    /**
     * Gets or sets the maximum number of values that a property can have.
     *
     * A number greater than or equal to `1`, possibly, `Infinity`.
     *
     * #### Default value
     *
     * The default value depends on the specified value of
     * {@link pentaho.component.properties.AnyModel#multiple}.
     *
     * When `multiple` is not specified,
     * then the default value is the greatest between `1` and `countMin`.
     *
     * Otherwise,
     * when `multiple` is specified as `true`,
     * then the default value is `Infinity`.
     *
     * When `multiple` is specified as `false`,
     * then the default value is, again, the greatest between `1` and `countMin`.
     *
     * When both are specified, the most restrictive wins.
     * Thus, if `multiple` is specified as `false` and `countMax` is specified and greater than `1`,
     * then `countMax` is set to the minimum between `countMin` and `1`.
     *
     * @type number
     * @see pentaho.component.properties.AnyModel#countMin
     * @see pentaho.component.properties.AnyModel#required
     * @see pentaho.component.properties.AnyModel#multiple
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
    //endregion

    //endregion

    //region single-value validation-facet properties

    //region values property

    // -> Optional, Inherited, Configurable, Localized

    _values: null,

    /**
     * Gets or sets the collection of discrete possible single-values
     * that restrict the property's base single-value domain.
     *
     * Returns `null` when the base single-value domain is not restricted.
     * Otherwise, when a collection is returned, it is guaranteed to have at least one element.
     *
     * Can be set to an array of {@link pentaho.component.spec.SingleValueLabel},
     * as specified in {@link pentaho.component.properties.spec.IAnyModelExtend#values}.
     *
     * The single values should belong to the property's base single-value domain.
     * Otherwise, these have no effect.
     *
     * Set to `null` or an empty array, `[]`,
     * to clear the single-values and force it to be `null`,
     * even if defined single-values would be inherited.
     *
     * Set to `undefined` to reset the value to its default.
     *
     * The default value is that specified when defining the property model class,
     * through {@link pentaho.component.properties.spec.IAnyModelExtend#values},
     * or is inherited from the base property model class.
     *
     * The default value of the root property model class is `null`.
     *
     * Can be configured through {@link pentaho.component.properties.spec.IAnyModelConfig#values}.
     *
     * Do **not** modify the returned collection or its elements.
     *
     * @type ?pentaho.lang.Collection.<pentaho.component.SingleValueLabel>
     */
    get values() {
      return this._values;
    },

    set values(value) {
      if(value === undefined) {
        delete this._values;
      } else {
        // value !== null and value != []
        this._values = (value && value.length) ? SingleValueLabelCollection.to(value) : null;
      }
    },
    //endregion

    //region min property

    // -> Optional, Inherited, Configurable

    // -> Applies to comparable single value types

    _min: null,

    /**
     * Gets or sets the minimum single-value that the property can take.
     *
     * Applies only to properties whose {@link pentaho.component.properties.AnyModel#valueType}
     * can be meaningfully compared using the JavaScript's `<` and `>` operators,
     * like `number`, `string` and `Date`.
     *
     * This property allows restricting the base value domain of the property.
     * It has no effect if its value is outside of the property's base value domain.
     *
     * The default value is that specified when defining the property model class,
     * through {@link pentaho.component.properties.spec.IAnyModelExtend#min},
     * or is inherited from the base property model class.
     *
     * Set to `undefined` to reset the value to its default.
     *
     * Set to `null` to clear the value and force it to be `null`,
     * even if a non-null value would be inherited.
     *
     * The default value of the root property model class is `null`.
     *
     * Can be configured through {@link pentaho.component.properties.spec.IAnyModelConfig#min}.
     *
     * @type ?pentaho.component.SingleValue
     */
    get min() {
      return this._min;
    },

    set min(value) {
      if(value === undefined) {
        delete this._min;
      } else {
        // possibly null
        this._min = value;
      }
    },
    //endregion

    //region max property

    // -> Optional, Inherited, Configurable

    // -> Applies to comparable single value types

    _max: null,

    /**
     * Gets or sets the maximum single-value that the property can take.
     *
     * Applies only to properties whose {@link pentaho.component.properties.AnyModel#valueType}
     * can be meaningfully compared using the JavaScript's `<` and `>` operators,
     * like `number`, `string` and `Date`.
     *
     * This property allows restricting the base value domain of the property.
     * It has no effect if its value is outside of the property's base value domain.
     *
     * The default value is that specified when defining the property model class,
     * through {@link pentaho.component.properties.spec.IAnyModelExtend#max},
     * or is inherited from the base property model class.
     *
     * Set to `undefined` to reset the value to its default.
     *
     * Set to `null` to clear the value and force it to be `null`,
     * even if a non-null value would be inherited.
     *
     * The default value of the root property model class is `null`.
     *
     * Can be configured through {@link pentaho.component.properties.spec.IAnyModelConfig#max}.
     *
     * @type ?pentaho.component.SingleValue
     */
    get max() {
      return this._max;
    },

    set max(value) {
      if(value === undefined) {
        delete this._max;
      } else {
        // possibly null
        this._max = value;
      }
    },
    //endregion

    // lengthMin, lengthMax

    //endregion

    //region value, defaultValue, freeValue, calcValue

    //region defaultValue

    // TODO: must reset _computedDefaultValue when countMin, values or multiple change...

    // -> Optional, Inherited, Configurable
    // When specified...
    _defaultValue: undefined,

    // The computed default value.
    // undefined means not yet computed.
    _computedDefaultValue: undefined,

    /**
     * Gets or sets the default value of the properties of this type.
     *
     * Can be specified through {@link pentaho.component.properties.spec.IAnyModelExtend#defaultValue}.
     *
     * Set to `null` to clear the value and force it to be `null`,
     * even if a non-null value would be inherited.
     *
     * Set to `undefined` to reset the value to its default.
     *
     * The default default-value is:
     * 1. that specified at an ancestor property model class,
     * 2. that determined based on other local attributes (see below), when possible, or
     * 3. `null`.
     *
     * A sensible default default-value can be determined from the
     * {@link pentaho.component.properties.AnyModel#values} property, when not `null`,
     * and the {@link pentaho.component.properties.AnyModel#countMin}, when greater than 0.
     * The first _countMin_ values of _values_ are chosen as the default value.
     *
     * Can be configured through {@link pentaho.component.properties.spec.IAnyModelConfig#defaultValue}.
     *
     * @type ?pentaho.component.Value
     */
    get defaultValue() {
      var defaultValue = this._defaultValue; // inherited, when _specified_ at a base class
      return defaultValue !== undefined ? defaultValue : this._getComputedDefaultValue();
    },

    set defaultValue(value) {
      if(value === undefined) {
        delete this._defaultValue;
      } else {
        this.defaultValue = value;
      }
    },

    _getComputedDefaultValue: function() {
      var defaultValue = this._computedDefaultValue;
      return defaultValue !== undefined
          ? defaultValue
          : (this._computedDefaultValue = this._computeDefaultValue());
    },

    // Computes the default defaultValue based on other settings.
    // What to do: inherit default value or determine based on other values as perceived locally.
    // If the inherited value was specified then we should use it, otherwise, we should
    // ignore it
    // ~ countMin, multiple, values
    _computeDefaultValue: function() {
      var countMin = this.countMin,
          values   = this.values;

      if(!countMin || !values)
        return null;

      if(!this.multiple)
        return values[0].value;

      var i = -1,
          L = Math.max(countMin, values.length),
          defaultValue = new Array(L);

      while(++i < L) defaultValue[i] = values[i].value;

      return defaultValue;
    },
    //endregion

    //endregion

    /**
     * Validates the value of the property.
     *
     * This implementation performs basic value validations,
     * like validating its cardinality limits and each single-value.
     *
     * The returned `Error` objects should have a string `code` property with an error code and
     * a localized string `message` property.
     *
     * @param {Object} [keyArgs] The keyword arguments object.
     * @return {Error[]|null} A non-empty array of error objects, or `null`, when there are no validation errors.
     */
    validate: function() {

    },

    isSingleValueEmpty: function(singleValue) {

    },

    // Does not validate emptiness
    validateSingleValue: function(singleValue) {

    }
  }, /** @lends pentaho.component.properties.AnyModel */{
    /**
     * Creates a property model sub-class given a specification.
     *
     * @param {!pentaho.component.properties.spec.IAnyModelExtend} instSpec The property model _instance_ specification.
     * @param {Object} [classSpec] The property type _class_ specification.
     * @return {Class.<pentaho.component.properties.AnyModel>} The created property model sub-class.
     */
    extend: function(instSpec, classSpec) {
      if(!instSpec) throw error.argRequired("instSpec");

      // Optional. Force stopping inheritance.
      if(!("id" in instSpec)) instSpec.id = null;

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

      delete instSpec.required;
      instSpec.countMin = countMin;

      // multiple and countMax

      var multiple = instSpec.multiple;
      var countMax = parseNum(instSpec.countMax);
      if(multiple == null) {
        if(countMax == null) countMax = countMin;
      } else if(countMax == null) {
        countMax = multiple ? Infinity : countMin;
      } else if(!multiple && countMax > 1) {
        countMax = Math.max(1, countMin);
      } else if(countMin > countMax) {
        countMax = countMin;
      }

      delete instSpec.multiple;
      instSpec.countMax = countMax;

      // min, max

      var min = instSpec.min;
      var max = instSpec.max;
      if(min != null && max != null && min > max) instSpec.max = min;

      return this.base(instSpec, classSpec);
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