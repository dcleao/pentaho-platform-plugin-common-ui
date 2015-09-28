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
     * * provides a uniform view of components for designers, standing for the real component
     * * provides a way to design a component without having to instantiate the real component
     * * _can_ be used as the properties model object by the real component.
     *
     * Every component type defines its own component model class,
     * by sub-classing from its base component type model class.
     *
     * A component model sub-class can define additional properties,
     * change existing ones, or just change validation and update behavior.
     *
     * @description Creates a component model with a given configuration.
     * @param {pentaho.component.spec.IModelConfig} [config] A component model configuration specification.
     */
    constructor: function(config) {
      if(config) this.configure(config);
    },

    //region IConfigurable implementation
    /**
     * Applies one or more configurations to the component type.
     *
     * @param {pentaho.component.spec.IModelConfig} config A component model configuration specification.
     */
    configure: function(config) {
      if(!config) throw error.argRequired("config");

      if(config instanceof Array)
        config.forEach(this._configureOne, this);
      else
        this._configureOne(config);
    },

    /**
     * Applies a single configuration to the component type.
     *
     * @param {pentaho.component.spec.ITypeConfiguration} config A component type configuration specification.
     * @protected
     * @virtual
     */
    _configureOne: function(config) {
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
     * @param {pentaho.component.spec.IModel} instSpec The component model specification.
     * @param {Object} [classSpec] Class-level members of the component model class.
     * @return {Class.<pentaho.component.Model>} The created component model sub-class.
     */
    extend: function(instSpec, classSpec) {
      if(!instSpec) throw error.argRequired("instSpec");

      return this.base(instSpec, classSpec);
    }
  });
});