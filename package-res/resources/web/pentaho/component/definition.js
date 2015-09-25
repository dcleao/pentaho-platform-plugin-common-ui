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
  "../util/Collection",
  "../util/arg",
  "../util/error",
  "../util/object",
  "./IconType"
], function(module, Base, Collection, arg, error, O, IconType) {

  var IconTypeCollection = Collection.extend({
    //region List implementation
    elemClass: IconType,
    //endregion

    _sortIcons: function() {
      this.sort(IconType.areaComparer);
    }
  });

  var Type = Base.extend("pentaho.component.Type", /** @lends pentaho.component.Type# */{

    /**
     * @name pentaho.component.Type
     *
     * @class
     * @implements pentaho.lang.ICollectionElement
     * @implements pentaho.lang.IConfigurable
     *
     * @classdesc The `Type` class is the base abstract class
     * of web component types in the Pentaho platform.
     *
     * A `Type` mostly contains  metadata about a type of component.
     * Information like: id, name, description, CSS-class, icons and properties.
     *
     * Specific component frameworks may define sub-classes of `Type`
     * to account for additional metadata, specialize existing metadata, or
     * override standard behavior.
     *
     * A `Type` also contains utility methods that
     * facilitate working with component types and components.
     *
     * @description Creates a component type with a given configuration.
     * @param {pentaho.component.ITypeConfigurationSpec} [config] A component type configuration specification.
     */
    constructor: function(config) {
      if(config) this.configure(config);
    },

    //region IListElement implementation
    elemName: "component type",
    //endregion

    //region IWithKey implementation
    keyName: "id",

    get key() {
      return this.id;
    },
    //endregion

    // IMPLEMENTATION NOTE: All of the following setters are used both at instance and class/prototype level.
    // In Type.extend, the class' prototype is assigned with the values of the given instance specification!

    //region enabled property
    _enabled: true,

    /**
     * Gets or sets a value that indicates if the component type is enabled.
     *
     * Disabled components should not be made available to users when creating new component instances.
     *
     * @type boolean
     * @default true
     */
    get enabled() {
      return this._enabled;
    },

    set enabled(value) {
      if(value !== undefined) {
        this._enabled = !!value;
      }
    },
    //endregion

    //region id property
    _id: undefined,

    /**
     * Gets the id of the component type.
     *
     * This property is shared by all instances of a component type
     * and cannot be changed for specific instances.
     *
     * @type string
     * @readonly
     */
    get id() {
      return this._id;
    },

    set id(value) {
      // Can only be called on the prototype of the class, once
      if(this !== this.constructor.prototype) throw error.operInvalid("'id' can only be called on the prototype.");
      if(O.hasOwn(this, "_id")) throw error.operInvalid("'id' can only be set once.");

      if(value !== undefined) {
        value = value && value.replace(/\/definition$/, "");
        if(!value) throw error.argRequired("id");

        this._id = value;
      }
    },
    //endregion

    //region "abstract" property
    _abstract: true, // default root class value...

    /**
     * Gets a value that indicates if the component type is abstract.
     *
     * An abstract component type is meant to be inherited from.
     * A component of this exact type cannot be instantiated.
     *
     * This property is shared by all instances of a component type
     * and cannot be changed for specific instances.
     *
     * The default value is `false`.
     *
     * @type boolean
     * @readonly
     * @default false
     */
    get "abstract"() {
      return this._abstract;
    },

    set "abstract"(value) {
      // Can only be called on the prototype of the class, once
      if(this !== this.constructor.prototype) throw error.operInvalid("'abstract' can only be called on the prototype.");
      if(O.hasOwn(this, "_id")) throw error.operInvalid("'abstract' can only be set once.");

      if(value !== undefined) {
        this._abstract = !!value;
      }
    },
    //endregion

    //region label property
    _label: undefined,

    /**
     * Gets or sets the label of the component type.
     *
     * The label is a human-readable, localized and short description of the component type.
     *
     * The label should be suitable for _identifying_ it in a menu, amongst others.
     *
     * The label cannot be null or empty.
     *
     * @type string
     */
    get label() {
      return this._label;
    },

    set label(value) {
      if(value !== undefined) {
        if(!value) throw error.argRequired("label");
        this._label = String(value);
      }
    },
    //endregion

    //region description property
    _description: undefined,

    /**
     * Gets or sets the description of the component type.
     *
     * The description is a human-readable, localized description of the component type.
     * It should be suitable for display in a tooltip.
     *
     * _Nully_ or empty values are converted to `undefined`.
     *
     * @type string|undefined
     * @default undefined
     */
    get description() {
      return this._description;
    },

    set description(value) {
      this._description = value != null && value !== "" ? String(value) : undefined;
    },
    //endregion

    //region className property
    _className: undefined,

    /**
     * Gets or sets the _CSS_ class name used to style components of this type.
     *
     * CSS class names should be spinal-case strings (e.g.: `"pentaho-component"`).
     *
     * A component inherits all of the defined _CSS_ classes in ancestor component types.
     *
     * _Nully_ or empty values are converted to `undefined`.
     *
     * @type string|undefined
     * @default undefined
     * @see pentaho.component.Type#inheritedClassNames
     */
    get className() {
      return this._className;
    },

    set className(value) {
      this._className = value || undefined;
    },

    /**
     * Gets an array with the own and inherited _CSS_ class names of the component type.
     *
     * The first entry is the own class name, the second that of its base component type, etc.
     *
     * @type !Array.<string>
     */
    get inheritedClassNames() {
      return O.getOwn(this, "_inheritedClassNames") || (this._inheritedClassNames = this._computeClassNames());
    },

    _computeClassNames: function() {
      var classNames = [],
          proto = this,
          rootProto = Type.prototype;
      do {
        var className = proto._className;
        if(className) classNames.push(className);
      } while((proto !== rootProto) && (proto = Object.getPrototypeOf(proto)));

      return classNames;
    },
    //endregion

    //region icons property

    // TODO: Need to review the whole icons thing
    // * If CSS scheme of placing all classNames works as thought
    // * How inheritance of icon types should actually work to make it useful to smart containers
    // * Is it worth the complexity?

    _icons: IconTypeCollection.to([]),

    /**
     * The array of icon types supported by the own _CSS_ class of the component type,
     * ordered by area.
     *
     * Declared icon types _should_ be supported by all of the component type's themes.
     *
     * By default, a component type has no icons.
     *
     * This option is only applicable if the component type has a defined own `className`.
     *
     * @type !pentaho.lang.Collection.<!pentaho.component.IconType>
     * @see pentaho.component.Type#className
     */
    get icons() {
      // Inherit base icons at first access.
      // Setting icons to null will reset.
      return O.getOwn(this, "_icons") ||
          (this._icons = IconTypeCollection.to(this._icons.slice()));
    },

    set icons(value) {
      var icons = this.icons;
      if(value == null) {
        // Reset
        icons.length = 0;
      } else {
        icons.addMany(value);
        icons._sortIcons();
      }
    },
    //endregion

    //region defaults property
    _defaults: {},

    /**
     * Gets or sets the default property values to use when designing new component instances.
     *
     * @type Object.<string, pentaho.component.PropertyValue>
     */
    get defaults() {
      return O.getOwn(this._defaults) || (this._defaults = O.cloneShallow(this._defaults));
    },

    set defaults(value) {
      if(value) {
        // merge
        O.assignOwnDefined(this.defaults, value);
      }
    }
    //endregion
  }, /** @lends pentaho.component.Type */{

    //region IListElement implementation
    elemName: "component type class",
    //endregion

    //region IWithKey implementation
    keyName: "id",

    get key() {
      return this.prototype.id;
    },
    //endregion

    //region IConfigurable implementation
    /**
     * Applies one or more configurations to the component type.
     *
     * @param {pentaho.component.TypeConfigurationSpec} config A component type configuration specification.
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
     * @param {pentaho.component.ITypeConfigurationSpec} config A component type configuration specification.
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
     * Creates a component type by sub-classing its base component type.
     *
     * @param {pentaho.component.ITypeSpec} instSpec The component type specification.
     * @param {Object} [classSpec] Class-level members of the component type class.
     */
    extend: function(instSpec, classSpec) {
      if(!instSpec) throw error.argRequired("instSpec");

      // Force validation to kick off in property setters.
      if(!("id"    in instSpec)) instSpec.id    = null;
      if(!("label" in instSpec)) instSpec.label = null;

      // Optional, but do not inherit base component type descriptions
      if(!("description" in instSpec)) instSpec.description = undefined;

      // Classes are not abstract by default. Force setting abstract. Default is `false`.
      instSpec["abstract"] = !!instSpec["abstract"];

      this.base(instSpec, classSpec);

      /**
       * Gets the instance specification used in the declaration of the component type.
       *
       * The argument `instSpec` of {@link pentaho.component.Type.extend}.
       *
       * @alias declaredSpec
       * @memberOf pentaho.component.Type
       * @type pentaho.component.ITypeSpec
       * @readonly
       */
      this.declaredSpec = instSpec;
    },

    /**
     * Updates the definition of properties based on their current values.
     *
     * @param {Object} [keyArgs] The keyword arguments object.
     * @param {string} [keyArgs.changedProp] The name of the property that has changed.
     *    When unspecified, it is assumed that all properties have changed.
     * @virtual
     */
    updateProperties: function(keyArgs) {

    },

    /**
     * Validates properties based on their current values.
     *
     * This implementation performs basic properties unit validation,
     * like "requiredness" and minimum occurrence,
     * by calling each property's {@link pentaho.component.PropertyType#validate) method.
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
    validateProperties: function(keyArgs) {
      return null;
    }
  });

  // NOTE: Already uses the just defined Class.extend method and prototype property setters.
  Type.implement({
    id: module.id,
    label: "Pentaho base component type",
    description: "Pentaho base and abstract component type.",
    "abstract": true,
    className: "pentaho-component",
    icons: IconType.wellKnown.slice()
  });

  return Type;
});