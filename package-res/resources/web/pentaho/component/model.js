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
  "../util/error"
], function(module, Base, arg, error) {

  return Base.extend("pentaho.component.Model", /** @lends pentaho.component.Model# */{

    /**
     * @name pentaho.component.Model
     *
     * @class
     * @implements pentaho.lang.IConfigurable
     *
     * @classdesc The `Model` class is the abstract base class
     * of web component type models in the Pentaho platform.
     *
     * A component `Model` plays the following main roles:
     * * contains general metadata about each property supported by a component, like label, description and category
     * * contains logic for property update and validation
     * * provides a uniform view of components for editors, standing for the real component
     * * provides a way to design a component without having to instantiate the real component
     * * _can_ also be used as the properties model object by the real component.
     *
     * Every component type creates a `Model` sub-class,
     * by using the {@link pentaho.component.Model.extend} method,
     * and publishes it in the sub-module named **model**.
     *
     * This sub-class can define additional _component properties_ or change the existing, inherited ones.
     *
     * The following example shows the contents of a module with the id `"my/components/textBox/model"`,
     * and how a new component model class could be defined:
     *
     * ```javascript
     * define([
     *   "pentaho/component/model,
     *   "cdf/component/properties/parameter"
     * ], function(Model) {
     *
     *   return Model.extend({
     *      properties: [
     *        {
     *          type: "string",
     *          name: "placeholderText",
     *          label: "Placeholder text",
     *          description: "The text to show when the control is empty.",
     *          defaultValue: "Write here",
     *          category: "Style",
     *          helpUrl: "http://my.components.example.com/textBox.html#placeholderText"
     *        },
     *        {
     *          type: "cdf/component/properties/parameter",
     *        }
     *      ]
     *   });
     *
     * });
     * ```
     * @description Creates a component model with a given configuration.
     * @param {pentaho.component.spec.ITypeConfig} [config] A component type configuration.
     */
    constructor: function(config) {
      if(config) this.configure(config);
    },

    //region IConfigurable implementation
    /**
     * Applies a configuration to the model.
     *
     * @param {!pentaho.component.spec.ITypeConfig} config A component type configuration.
     */
    configure: function(config) {
      if(!config) throw error.argRequired("config");

      if(config.enabled !== undefined) this.enabled = config.enabled;
      if(config.label   !== undefined) this.label   = config.label;
      if(config.description) this.description = config.description;
    },
    //endregion

    /**
     * Updates the definition of properties based on their current values.
     *
     * @param {Object} [keyArgs] The keyword arguments object.
     * @param {string} [keyArgs.changedProp] The name of the property that has changed.
     *    When unspecified, it is assumed that all properties have changed.
     * @virtual
     */
    update: function(keyArgs) {

    },

    /**
     * Validates properties based on their current values.
     *
     * This implementation performs basic properties unit validation,
     * like "requiredness" and minimum occurrence,
     * by calling each property's {@link pentaho.component.properties.AnyModel#validate) method.
     *
     * Override this method to additionally perform cross-validation of properties.
     *
     * The returned `Error` objects should have a string `code` property with an error code.
     *
     * @param {Object} [keyArgs] The keyword arguments object.
     * @return {Error[]|null} A non-empty array of error objects, or `null`, when there are no validation errors.
     *
     * @virtual
     */
    validate: function(keyArgs) {
      return null;
    }
  }, /** @lends pentaho.component.Model */{

    /**
     * Creates a component model sub-class of this one.
     *
     * @param {pentaho.component.spec.IModelExtend} instSpec The component model extend specification.
     * @param {Object} [classSpec] Class-level members of the component model class.
     * @return {Class.<pentaho.component.Model>} The created component model sub-class.
     */
    extend: function(instSpec, classSpec) {
      if(!instSpec) throw error.argRequired("instSpec");

      return this.base(instSpec, classSpec);
    }
  });
});