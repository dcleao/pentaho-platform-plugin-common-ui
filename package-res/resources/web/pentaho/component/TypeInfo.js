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
  "../util/Base",
  "../util/Collection",
  "../util/error",
  "../util/object",
  "./IconType"
], function(Base, Collection, error, O, IconType) {

  var IconTypeCollection = Collection.extend({
    //region List implementation
    elemClass: IconType,
    //endregion

    _sortIcons: function() {
      this.sort(IconType.areaComparer);
    }
  });

  var TypeInfo = Base.extend("pentaho.component.TypeInfo", /** @lends pentaho.component.TypeInfo# */{
    /**
     * @name pentaho.component.TypeInfo
     *
     * @class
     * @implements pentaho.lang.ICollectionElement
     * @implements pentaho.lang.IConfigurable
     * @implements pentaho.lang.ISpecifiable
     * @implements pentaho.lang.IAnnotatable
     *
     * @classdesc The `TypeInfo` class contains general metadata information about a component type.
     *
     * Information like its id, name, description, category, help URL, CSS-class and supported icon types.
     *
     * Specific component frameworks may define sub-classes of `TypeInfo`
     * to account for additional metadata or specialize existing one.
     *
     * Also, container-specific metadata can be specified as annotations.
     *
     * Every component type creates a `TypeInfo` sub-class,
     * by using the {@link pentaho.component.TypeInfo.extend} method,
     * and publishes it in the sub-module named **info**.
     *
     * The following example shows the contents of a module with the id `"my/components/textBox/info"`,
     * and how a new component type info class could be defined:
     *
     * ```javascript
     * define(["module", "pentaho/component/info"], function(module, TypeInfo) {
     *
     *   return TypeInfo.extend({
     *      id: module.id,
     *      label: "My TextBox",
     *      description: "A super-cool TextBox by My.",
     *      category: "Input",
     *      helpUrl: "http://my.components.example.com/textBox.html"
     *      className: "my-components-textBox"
     *   });
     *
     * });
     * ```
     *
     * @description Creates a component type info, optionally given a configuration.
     * @param {pentaho.component.spec.ITypeConfig} config A component type configuration.
     */
    constructor: function(config) {
      if(config) this.configure(config);
    },

    //region IListElement implementation
    elemName: "component type info",
    //endregion

    //region IWithKey implementation
    keyName: "component type id",

    get key() {
      return this.id;
    },
    //endregion

    //region IConfigurable implementation
    /**
     * Applies a configuration to the component type info.
     *
     * @param {!pentaho.component.spec.ITypeConfig} config A component type info configuration.
     */
    configure: function(config) {
      if(!config) throw error.argRequired("config");

      if(config.enabled     !== undefined) this.enabled     = config.enabled;
      if(config.label       !== undefined) this.label       = config.label;
      if(config.description !== undefined) this.description = config.description;
      if(config.category    !== undefined) this.category    = config.category;
    },
    //endregion

    // IMPLEMENTATION NOTE: All of the following setters are used both at instance and class/prototype level.
    // In TypeInfo.extend, the class' prototype is **assigned** with the values of the given instance specification!

    //region enabled property
    _enabled: true,

    /**
     * Gets or sets a value that indicates if the component type is enabled.
     *
     * Disabled component types should not be made available to users when creating new component instances.
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
        value = value && value.replace(/\/info$/, "");
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
     * The label is a localized, short description of the component type.
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
     * The _description_ is localized. It should be suitable for display in a tooltip.
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

    //region category property
    _category: undefined,

    /**
     * Gets or sets the category of the component type.
     *
     * A localized, short description of the category,
     * used to group component types in a designer user interface.
     *
     * This property is inherited from the info of the base component type.
     * The root component type has the category `"Miscellaneous"`.
     *
     * @type string
     */
    get category() {
      return this._category;
    },

    set category(value) {
      if(!value)
        // Inherit from base component type info.
        // TODO: validate not root...
        delete this._category;
      else
        this._category = String(value);
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
     * @see pentaho.component.Model#inheritedClassNames
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
          rootProto = TypeInfo.prototype;
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
     * @see pentaho.component.Model#className
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
    }
    //endregion
  }, /** @lends pentaho.component.TypeInfo */{

    //region IListElement implementation
    elemName: "component type info class",
    //endregion

    //region IWithKey implementation
    keyName: "component type id",

    get key() {
      return this.prototype.id;
    },
    //endregion

    /**
     * Creates a component type info class by sub-classing its base component type info class.
     *
     * @param {pentaho.component.spec.ITypeInfoExtend} instSpec The component type info specification.
     * @param {Object} [classSpec] Class-level members of the component type info class.
     * @return {Class.<pentaho.component.TypeInfo>} The created model sub-class.
     */
    extend: function(instSpec, classSpec) {
      if(!instSpec) throw error.argRequired("instSpec");

      // Not inherited
      if(!("id"          in instSpec)) instSpec.id          = null;
      if(!("label"       in instSpec)) instSpec.label       = null;
      if(!("description" in instSpec)) instSpec.description = null;

      instSpec["abstract"] = !!instSpec["abstract"];

      // Not supported on spec, only on config.
      if("enabled" in instSpec) delete instSpec.enabled;

      var SubClass = this.base(instSpec, classSpec);

      /**
       * Gets the instance specification used in the declaration of the component type info.
       *
       * The argument `instSpec` of {@link pentaho.component.Model.extend}.
       *
       * @alias declaredSpec
       * @memberOf pentaho.component.TypeInfo
       * @type pentaho.component.spec.ITypeInfoExtend
       * @readonly
       */
      SubClass.declaredSpec = instSpec;

      return SubClass;
    }
  });

  return TypeInfo;
});