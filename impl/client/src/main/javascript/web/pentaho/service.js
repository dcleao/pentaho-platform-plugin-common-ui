/*!
 * Copyright 2010 - 2017 Hitachi Vantara. All rights reserved.
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

/**
 * The service locator of the JavaScript Pentaho platform.
 *
 * The service locator allows JavaScript components to declare dependency on other
 * components in terms of the name of a _logical_ service.
 * Other modules that provide such logical service should register as such.
 *
 * **AMD Plugin Usage**: `"pentaho/service!{service-type}?type&single&meta&ids"`
 *
 * 1. `{service-type}` — the base type of the desired service instances or types.
 * 2. `type` - if present, indicates that it is subtypes of `{service-type}` that are requested,
 *             and not instances of subtypes of `{service-type}`, the default.
 * 3. `single` — if present, the module resolves as a single value, the first declared dependency.
 * 4. `meta` — if present, the module resolves as an array where each member is an object with two properties,
 *             `moduleId` and `value`.
 * 5. `ids` - if present, the module resolves as an array of the identifiers of the registered modules
 *            and **does not load them**.
 *
 * When instances are requested,
 * the [Instance Info API]{@link pentaho.instanceInfo} is used to
 * query for modules which provide *instances* of the requested service type (or subtypes of).
 *
 * Otherwise,
 * when types are requested,
 * the [Type Info API]{@link pentaho.typeInfo} is used to
 * query for modules which provide *subtypes* of the requested service type.
 *
 * **Example**
 *
 * The following AMD/RequireJS configuration registers two instances,
 * `mine/homeScreen` and `yours/proHomeScreen`,
 * as providing the instances of the service type `IHomeScreen`:
 *
 * ```js
 * require.config({
 *   config: {
 *     "pentaho/instanceInfo": {
 *       "mine/homeScreen":     {type: "IHomeScreen"},
 *       "yours/proHomeScreen": {type: "IHomeScreen"}
 *     }
 *   }
 * });
 * ```
 *
 * Later, some other component can request for all registered instances of the
 * service type `IHomeScreen`:
 *
 * ```js
 * define(["pentaho/service!IHomeScreen"], function(arrayOfHomeScreens) {
 *
 *   arrayOfHomeScreens.forEach(function(homeScreen) {
 *     // ...
 *   });
 * });
 * ```
 *
 * @name locator
 * @memberOf pentaho.service
 * @type {IAmdLoaderPlugin}
 * @amd pentaho/service
 */
define([
  "module",
  "pentaho/util/object",
  "pentaho/instanceInfo",
  "pentaho/typeInfo"
], function(module, O, instanceInfo, typeInfo) {
  "use strict";

  var A_slice = Array.prototype.slice;

  /**
   * A map from logical module names to identifiers of dependency modules.
   * @type Object.<string, string[]>
   */
  var __logicalModules = {};

  __processConfig();

  return {

    load: function(name, require, onLoad, config) {
      if(config.isBuild) {
        // Don't include dependencies in the build.
        // These are resolved dynamically in the "browser".
        // If a specific dependency should be included in the build,
        // it must be included explicitly and directly,
        // by specifying its AMD module id.
        onLoad();
      } else {
        var nameAndOptions = __parseNameAndOptions(name);
        var isType = nameAndOptions.options.type === "true";
        var modules = __lookupLogicalModule(nameAndOptions.name, isType);

        var modulesCount = modules.length;
        var isSingle = nameAndOptions.options.single === "true";
        if(isSingle) {
          if(modulesCount > 1) {
            modules = [modules[0]];
          } else if(modulesCount === 0) {
            onLoad(null);
            return;
          }
        }

        var isIds = nameAndOptions.options.ids === "true";
        if(isIds) {
          if(isSingle) {
            onLoad(modules[0]);
          } else {
            onLoad(modules.slice());
          }
          return;
        }

        // `require` is ok with resolving empty arrays as empty arrays.
        // Create any requested logical module, even if it has no registrations.
        // Empty name included, just to make the code simpler
        // (there's no way to register a dependency under an empty logical name).
        require(modules, function() {
          var values = A_slice.call(arguments);

          var withMeta = nameAndOptions.options.meta === "true";
          if(withMeta) {
            var toReturn = [];
            for(var i = 0, ic = modules.length; i !== ic; ++i) {
              toReturn.push({moduleId: modules[i], value: values[i]});
            }

            onLoad(isSingle ? toReturn[0] : toReturn);
          } else {
            // Pass the resolved modules to the original onLoad function,
            // as a single array argument.
            onLoad(isSingle ? values[0] : values);
          }
        });
      }
    },

    normalize: function(name, normalize) {
      var nameAndOptions = __parseNameAndOptions(name);

      return __stringifyNameAndOptions(nameAndOptions);
    }
  };

  /**
   * Gets the identifiers of modules registered as dependencies of a given logical module.
   *
   * @param {string} logicalModuleName - The name of the logical module.
   * @return {Array} An array of module identifiers, possibly empty.
   */
  function __getLogicalModule(logicalModuleName) {
    return O.getOwn(__logicalModules, logicalModuleName) ||
           (__logicalModules[logicalModuleName] = []);
  }

  function __lookupLogicalModule(logicalModuleName, isType) {

    var localIds = O.getOwn(__logicalModules, logicalModuleName) || [];

    // When isType, not including self because typically it is an interface...
    var otherIds = isType
        ? typeInfo.getSubtypesOf(logicalModuleName, {includeDescendants: true, includeSelf: false})
        : instanceInfo.getAllOfType(logicalModuleName, {includeDescendants: true});

    return localIds.concat(otherIds);
  }

  /**
   * Processes this module's AMD configuration,
   * which includes the registration of dependencies of logical modules.
   *
   * Ignores a _nully_ module configuration value.
   * Ignores _falsy_ physical and logical module identifiers.
   *
   * @deprecated
   */
  function __processConfig() {
    var config = module.config();
    var logicalModule;
    for(var absModuleId in config) { // nully tolerant
      if(absModuleId && (logicalModule = O.getOwn(config, absModuleId))) {
        __getLogicalModule(logicalModule).push(absModuleId);
      }
    }
  }

  /**
   * Retrieves the logical module name and parses the options that can
   * be provided to the service as query strings.
   *
   * For now only the 'meta' is known to the service and
   * is used to retrieve the moduleId together with the value.
   *
   * In the future could eventually be used to extend the query
   * capabilities of the service.
   *
   * @param {string} name - The name of the logical module.
   * @return {{name: string, options: Object.<string, string>}} The parsed name and options object.
   */
  function __parseNameAndOptions(name) {
    var logicalModuleName;
    var options = {};

    var parts = name.split("?");
    logicalModuleName = parts[0];

    parts = parts.length > 1 ? parts[1].split("&") : [];
    parts.forEach(function(part) {
      var option = part.split("=");
      if(option[0]) {
        // defaults to 'true' if no value is included
        options[decodeURIComponent(option[0])] = option.length > 1 ? decodeURIComponent(option[1]) : "true";
      }
    });

    return {
      name: logicalModuleName,
      options: options
    };
  }

  /**
   * Generates a normalized the moduleId from the logical module name
   * and the options, assuring the order doesn't affect the require's
   * cache of the values.
   *
   * @param {{name: string, options: Object.<string, string>}} nameAndOptions - The name and options object.
   * @return {string} The normalized module id.
   */
  function __stringifyNameAndOptions(nameAndOptions) {
    var options = [];

    for(var prop in nameAndOptions.options) {
      /* istanbul ignore else: almost impossible to test; browser dependent */
      if(nameAndOptions.options.hasOwnProperty(prop)) {
        options.push(encodeURIComponent(prop) + "=" + encodeURIComponent(nameAndOptions.options[prop]));
      }
    }

    options.sort();

    return nameAndOptions.name + (options.length ? "?" + options.join("&") : "");
  }
});
