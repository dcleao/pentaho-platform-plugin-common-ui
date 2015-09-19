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

  return Base.extend("pentaho.component.Definition", /** @lends pentaho.component.Definition# */{

    /**
     * @alias Definition
     * @memberOf pentaho.component
     * @class
     *
     * @classdesc The `Definition` class is the base abstract class
     * of definitions of web component types in the Pentaho platform.
     * that represents the common concept of a web component type
     * in the Pentaho platform.
     *
     * A `Definition` mostly contains  metadata about a type of component.
     * Information like: id, name, description, CSS-class, icons and properties.
     *
     * Specific component frameworks may define sub-classes of `component.Definition`
     * to account for additional metadata, specialize existing metadata, or
     * override standard behavior.
     *
     * A `component.Definition` also contains utility methods that
     * facilitate working with component definitions and implementations.
     *
     * @description Creates a component definition instance with a given configuration.
     * @param {Object} config A component definition configuration.
     */
    constructor: function(config) {

      // TODO: apply configuration

    }

  }, /** @lends pentaho.component.Definition */{

    /**
     * Creates a component type by sub-classing its base component type.
     *
     * @param {pentaho.component.IDefinitionSpec} instSpec A component definition _instance_ specification.
     * @param {Object} classSpec A component definition _class_ specification.
     */
    extend: function(instSpec, classSpec) {
      if(!instSpec) throw error.argRequired("instSpec");

      // Normalize/validate standard instance options.

      instSpec.id = arg.required(instSpec, "id").replace(/\/definition$/, "");
      instSpec.label = arg.required(instSpec, "label") || undefined;
      instSpec.description = instSpec.description || undefined;
      instSpec["abstract"] = !!instSpec["abstract"];

      instSpec.kind = instSpec.kind;

      var className = arg.optional(instSpec, "className");
      if(!className) {
        delete instSpec.className;
      } else {
        var iconTypes = instSpec.icons;
        instSpec.icons = (!iconTypes || !iconTypes.length)
            ? IconType.wellKnown.slice()
            : iconTypes.map(IconType.to).sort(IconType.areaComparer);
      }

      this.base(instSpec, classSpec);

      /**
       * Gets the component type's declared specification.
       *
       * The declared specification does not contains any inherited specification properties.
       * It is the instance specification passed to {@link pentaho.component.Definition.extend}.
       *
       * @name declarationSpec
       * @memberOf pentaho.component.Definition
       * @type pentaho.component.IDefinitionSpec
       * @readonly
       */
      this.prototype.declarationSpec = instSpec;
    }
  })
  .implement(/** @lends pentaho.component.Definition# */{
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
     * An abstract component type is meant to be inherited from
     * and a direct component of it cannot be created.
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