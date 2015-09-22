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
  "../util/object",
  "./IconType"
], function(module, Base, arg, error, O, IconType) {

  return Base.extend("pentaho.component.TypeDefinition", /** @lends pentaho.component.TypeDefinition# */{

    /**
     * @alias TypeDefinition
     * @memberOf pentaho.component
     * @class
     * @implements pentaho.lang.ICollectionElement
     * @implements pentaho.lang.IConfigurable
     *
     * @classdesc The `TypeDefinition` class is the base abstract class
     * of definitions of web component types in the Pentaho platform.
     * that represents the common concept of a web component type
     * in the Pentaho platform.
     *
     * A `TypeDefinition` mostly contains  metadata about a type of component.
     * Information like: id, name, description, CSS-class, icons and properties.
     *
     * Specific component frameworks may define sub-classes of `TypeDefinition`
     * to account for additional metadata, specialize existing metadata, or
     * override standard behavior.
     *
     * A `TypeDefinition` also contains utility methods that
     * facilitate working with component definitions and implementations.
     *
     * @description Creates a component definition instance with a given configuration.
     * @param {Object} config A component definition configuration.
     */
    constructor: function(config) {
      if(config) this.configure(config);
    },

    //region IListElement implementation
    elemName: "component type definition",
    //endregion

    //region IWithKey implementation
    keyName: "id",

    get key() {
      return this.id;
    }
    //endregion

  }, /** @lends pentaho.component.TypeDefinition */{

    //region IListElement implementation
    elemName: "component type definition class",
    //endregion

    //region IWithKey implementation
    keyName: "id",

    get key() {
      return this.prototype.id;
    },
    //endregion

    //region IConfigurable implementation
    /**
     * Applies a configuration to the component type.
     *
     * @param {pentaho.component.ITypeConfiguration} config A component type configuration.
     */
    configure: function(config) {
      if(!config) throw error.argRequired("config");

      if(config.enabled != null) this.enabled = config.enabled;

      if(config.label) this.label = String(config.label);
      if(config.description) this.description = String(config.description);
    },
    //endregion

    /**
     * Creates a component type by sub-classing its base component type.
     *
     * @param {pentaho.component.ITypeDefinition} instTypeDef The component type definition.
     * @param {Object} classTypeDef Class-level members of the definition class.
     */
    extend: function(instTypeDef, classTypeDef) {
      if(!instTypeDef) throw error.argRequired("instTypeDef");

      // Normalize/validate standard instance options.

      instTypeDef.id = arg.required(instTypeDef, "id").replace(/\/definition$/, "");
      instTypeDef.label = arg.required(instTypeDef, "label") || undefined;
      instTypeDef.description = instTypeDef.description || undefined;
      instTypeDef["abstract"] = !!instTypeDef["abstract"];

      instTypeDef.kind = instTypeDef.kind;

      var className = arg.optional(instTypeDef, "className");
      if(!className) {
        delete instTypeDef.className;
      } else {
        var iconTypes = instTypeDef.icons;
        instTypeDef.icons = (!iconTypes || !iconTypes.length)
            ? IconType.wellKnown.slice()
            : iconTypes.map(IconType.to).sort(IconType.areaComparer);
      }

      this.base(instTypeDef, classTypeDef);

      /**
       * Gets the definition used in the component type's declaration.
       *
       * The argument `instTypeDef` of {@link pentaho.component.TypeDefinition.extend}.
       *
       * @name declaredDefinition
       * @memberOf pentaho.component.TypeDefinition
       * @type pentaho.component.ITypeDefinition
       * @readonly
       */
      this.declaredDefinition = instTypeDef;
    }
  })
  .implement(/** @lends pentaho.component.TypeDefinition# */{
    /**
     * The id of the component type.
     *
     * @type string
     * @readonly
     */
    id: module.id,

    /**
     * A human-readable, localized and short description of the component type.
     *
     * The label of a component type
     * should be suitable for _identifying_ it in a menu,
     * amongst others.
     *
     * @type string
     * @readonly
     */
    label: "Pentaho base component type",

    /**
     * A human-readable, localized description of the component type.
     *
     * The description of a component type
     * should be suitable for being displayed in a tooltip.
     *
     * The values `null` and `""` are converted to `undefined`.
     *
     * When unspecified, the default value is `undefined`.
     *
     * @type string|undefined
     * @readonly
     */
    description: "Pentaho base and abstract component type.",

    /**
     * Indicates if the component type is abstract.
     *
     * An abstract component type is meant to be inherited from.
     * A component of this exact type cannot be instantiated.
     *
     * The default value is `false`.

     * @type boolean
     * @readonly
     */
    "abstract": true,

    /**
     * The _CSS_ class name used to style components of this type.
     *
     * CSS class names should be spinal-case strings (e.g.: `"pentaho-component"`).
     *
     * If a component type does not have an own _CSS_ class name,
     * it inherits the class name of its closest ancestor that has one.
     * Ultimately, the class name of the root component type, `"pentaho-component"`, is used.
     *
     * @type string
     * @readonly
     */
    className: "pentaho-component",

    /**
     * The array of icon types supported by _CSS_ class of the component type,
     * ordered by area.
     *
     * Just like with `className`, this property is inherited from the closest
     * ancestor that specifies it.
     *
     * Declared icon types must be supported by all of the themes
     * supported by the component type that declares the class name and icons.
     *
     * @type !Array.<!pentaho.component.IconType>
     * @readonly
     */
    icons: IconType.wellKnown.slice()
  });
});