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
  "./definition",
  "../lang/Base",
  "../lang/Collection",
  "../util/error",
  "../util/object",
  "../util/fun",
  "es6-promise-shim"
], function(TypeDefinition, Base, Collection, error, O, fun) {

  /*global Promise:true*/

  var prevConfigId = 0,

      F_true = function() { return true; };

  var TypeDefinitionClassCollection = Collection.extend({

    // The class of TypeDefinition classes...
    elemClass: {
      to: function(v) { return v; },
      prototype: {
        elemName: TypeDefinition.elemName,
        keyName:  TypeDefinition.keyName
      }
    }
  });

  var TypeDefinitionCollection = Collection.extend({
    elemClass: TypeDefinition
  });

  return Base.extend("pentaho.component.TypeRegistry", /** @lends pentaho.component.TypeRegistry# */{

    /**
     * @alias TypeRegistry
     * @memberOf pentaho.component
     * @class
     * @amd pentaho/component/TypeRegistry
     * @see pentaho/component/registry
     *
     * @classdesc The `TypeRegistry` class represents a registry of
     * component type definitions and associated configurations.
     *
     * The component type registry is an intermediary between:
     * * component authors,
     * * component editor applications, and
     * * component users.
     *
     * Authors can delegate to it the management of configurations.
     * Editor applications can rely on it to look for existing component types.
     * Users can configure components _by context_ in which they are used.
     *
     * Usage contexts are typically tied to the editing or viewing application.
     * For example, the context id of Pentaho Analyzer is `"analyzer"`,
     * and that of the Community Dashboard Framework is `"cdf"`.
     *
     * ### Interface
     *
     * Definitions and configurations may be registered using the methods, respectively:
     * * {@link pentaho.component.TypeRegistry#add} and
     * * {@link pentaho.component.TypeRegistry#addConfig}.
     *
     * To obtain _configured_ component type definitions use the following methods:
     * * {@link pentaho.component.TypeRegistry#get} and
     * * {@link pentaho.component.TypeRegistry#getAll}.
     *
     * Both of these accept a `contextId` argument which, when specified,
     * causes obtaining definitions configured specifically for that context.
     *
     * ### AMD
     *
     * **Module Id**: `"pentaho/component/TypeRegistry"`
     *
     * @description Creates a component type registry.
     */
    constructor: function() {
      // -- Container Entries --

      // Collection.<Class.<TypeDefinition>>
      this._definitionClasses = new TypeDefinitionClassCollection();

      // -- Configs --

      // Map of config levels by priority.
      // @type Object.<string, IComponentConfigLevel>
      this._configLevelsMap  = {};

      // List of config levels ordered from less to greater priority.
      // IComponentConfigLevel[]
      this._configLevelsList = [];

      /*
       * Each config level:
       * {
       *   // Individual component configs
       *   //  (known to apply to a single visual type; their `id` is a string).
       *   // @type Object.<string, Array.<ITypeConfiguration>>
       *   indiv: {},
       *
       *   // Group component configs (apply to more than one component type)
       *   // @type Array.<ITypeConfiguration>
       *   group: []
       * }
       */

      // -- Configured definitions --

      // Holds configured and enabled component type definitions.
      // Context "" is the global context.
      this._definitionsByContext = {};
    },

    /**
     * Registers a component type definition class.
     *
     * An error is thrown if a component type having
     * the same _id_ is already registered.
     *
     * @param {Class.<pentaho.component.TypeDefinition>} TypeDef The component type definition class.
     * @return {pentaho.component.TypeRegistry} The component registry.
     */
    add: function(TypeDef) {
      if(!TypeDef) throw error.argRequired("TypeDef");
      if(!(TypeDef.prototype instanceof TypeDefinition))
        throw error.argInvalidType("TypeDef", "Not a sub-class of 'pentaho/component/definition'.");

      var CompTypeDef0 = this._definitionClasses.get(TypeDef.key);
      if(CompTypeDef0) {
        if(CompTypeDef0 === TypeDef) return this;

        throw error.argInvalid(
            "TypeDef",
            "A definition for the component type of id '" + TypeDef.key + "' is already registered.");
      }

      this._definitionClasses.push(TypeDef);

      // Invalidate contexts
      invalidateContext.call(this);

      return this;
    },

    /**
     * Gets a collection of the component type definitions
     * that are enabled, already with applied configuration.
     *
     * Optionally,
     * the id of the context in which the components will be used may also be specified.
     *
     * Do **not** modify the returned array or any of its elements.
     *
     * @param {string} [contextId] The context id.
     * @return {pentaho.lang.Collection.<pentaho.component.TypeDefinition>} A collection of component type definitions.
     */
    getAll: function(contextId) {
      return getContextDefinitions.call(this, contextId);
    },

    /**
     * Gets a component type definition, already configured, given its id,
     * or `null` if one is not registered or is disabled.
     *
     * Optionally,
     * the id of the context in which the components will be used may also be specified.
     *
     * Do **not** modify the returned object.
     *
     * @param {string} typeId The id of the component type.
     * @param {string} [contextId] The context id.
     * @param {boolean} [assertAvailable=false] Indicates if an error should be thrown
     *    if the specified component type is not registered or is disabled.
     * @return {?pentaho.component.TypeDefinition} A component type definition, or `null`.
     */
    get: function(typeId, contextId, assertAvailable) {
      if(!typeId) throw error.argRequired("typeId");

      var typeDef = this.getAll(contextId).get(typeId);
      if(!typeDef && assertAvailable)
        throw new Error(
          "A component type with id '" + typeId + "' is not registered, or is disabled" +
          (contextId ? (" for context '" +  contextId + "'") : "") +
          ".");

      return typeDef;
    },

    /**
     * Adds a component type configuration.
     *
     * @param {pentaho.component.ITypeConfiguration} config The component type configuration.
     * @return {pentaho.component.TypeRegistry} The component registry.
     */
    addConfig: function(config) {
      if(!config) throw error.argRequired("config");

      // Already added?
      if(config._id != null) return this;

      // Used to detect if a config has already been added and applied.
      // See #mapConfigs.
      config._id = ++prevConfigId;

      // Process the `priority` property.
      // May be +/-Infinity.
      var priority = +(config.priority || 0);
      if(isNaN(priority)) priority = 0;

      config.priority = priority;

      var me = this,
          _configLevel;

      function ensureConfigLevel() {
        return _configLevel || (_configLevel = getConfigLevel.call(me, priority));
      }

      // Process the `context` property.
      // Build a context predicate for it.
      var contextIds = config.context;
      if(contextIds) config._matchContext = createContextMatcher(contextIds);

      // Process the component type `id` property.
      var ids = config.id,
          reIds = [],
          hasAllGroup = false,
          processId = function(id) {
            if(id == null || id === "") {
              // All ids - like an all-group config.
              hasAllGroup = true;
              config._matchGroup = F_true;
              ensureConfigLevel().group.push(config);
            } else {
              if(typeof id === "string") {
                var configLevel = ensureConfigLevel();

                // Individual id
                (configLevel.indiv[id] || (configLevel.indiv[id] = []))
                  .push(config);
              } else if(id instanceof RegExp) {
                // Group id
                if(!hasAllGroup) reIds.push(id);
              } else {
                throw new Error("Invalid 'id' configuration property: " + id);
              }
            }
          };

      if(ids instanceof Array)
        ids.forEach(processId, this);
      else
        processId.call(this, ids);

      if(!hasAllGroup && reIds.length) {
        config._matchGroup = function(id) {
          return reIds.some(function(reId) { return reId.test(id); });
        };
        ensureConfigLevel().group.push(config);
      }

      // Invalidate cache
      invalidateContext.call(this, contextIds);

      return this;
    }
  });

  // -------

  // @private
  // @static
  function createContextMatcher(contextIds) {
    return (contextIds instanceof Array)
        ? function(c) { return contextIds.indexOf(c) >= 0; } // string[]
        : function(c) { return c === contextIds; }; // string
  }

  // Returns the configuration level corresponding to the given priority,
  // creating it, if necessary.
  // @private
  function getConfigLevel(priority) {
    var configLevel = O.getOwn(this._configLevelsMap, priority);
    if(!configLevel) {
      configLevel = this._configLevelsMap[priority] = { // @type pentaho.component.IComponentConfigLevel
        priority: priority,

        // All individual type configs
        // typeId -> configs
        // @type Object.<string, IComponentConfigLevel[]>
        indiv: {},

        // All group configs
        // @type IComponentConfigLevel[]
        group: []
      };

      this._configLevelsList.push(configLevel);

      // Not as good as an insert-sort but...
      this._configLevelsList.sort(function(ca, cb) {
        return fun.compare(ca.priority, cb.priority);
      });
    }

    return configLevel;
  }

  // @private
  function getContextDefinitions(contextId) {
    var cache = this._definitionsByContext;
    return (cache && O.getOwn(cache, contextId || "")) ||
           createContextDefinitions.call(this, contextId);
  }

  // @private
  function createContextDefinitions(contextId) {
    var typeDefCol = new TypeDefinitionCollection();

    // For every non-abstract TypeDefinition class
    this._definitionClasses.forEach(function(TypeDef) {
      if(!TypeDef.prototype["abstract"]) {

        var typeDef = createDefinitionForContext.call(this, TypeDef, contextId);
        if(typeDef.enabled)
          typeDefCol.push(typeDef);

      }
    }, this);

    var cache = this._definitionsByContext || (this._definitionsByContext = {});
    cache[contextId || ""] = typeDefCol;
    return typeDefCol;
  }

  /**
   * Creates a component type definition of the given class,
   * and for the given context id.
   *
   * @param {Class.<pentaho.component.TypeDefinition>} TypeDef A non-abstract component type definition class.
   * @param {function(pentaho.component.ITypeConfigurationRule)} fun The mapping function.
   * @return {pentaho.component.TypeDefinition} A new, configured component type definition.
   * @ignore
   */
  function createDefinitionForContext(TypeDef, contextId) {
    var typeDef = new TypeDef();

    mapConfigs.call(this, TypeDef, function(config) {
      var matches = !config._matchContext || // any context
          (contextId && config._matchContext(contextId)); // matches specific context
      if(matches) typeDef.configure(config);
    });

    return typeDef;
  }

  /**
   * Maps the configuration rules applicable to a given component type,
   * from lowest to highest precedence.
   *
   * @param {Class.<pentaho.component.TypeDefinition>} TypeDef The component type definition class.
   * @param {function(pentaho.component.ITypeConfigurationRule)} fun The mapping function.
   * @ignore
   */
  function mapConfigs(TypeDef, fun) {
    var levels = this._configLevelsList,
        i = -1,
        L = levels.length;
    while(++i < L) mapConfigsOfLevel.call(this, levels[i], TypeDef, fun);
  }

  /**
   * Maps the configuration rules of a configuration level,
   * applicable to a given component type,
   * from lowest to highest precedence.
   *
   * @param {pentaho.component.IComponentConfigLevel} configLevel The configuration level.
   * @param {Class.<pentaho.component.TypeDefinition>} TypeDef The component type definition class.
   * @param {function(pentaho.component.ITypeConfigurationRule)} fun The mapping function.
   * @ignore
   */
  function mapConfigsOfLevel(configLevel, TypeDef, fun) {
    var visitedConfigsMap  = {},
        configsList = [], // from highest to lowest precedence.
        me = this;

    function mapConfigList(configs, fun2) {
      if(configs) {
        var i = configs.length;
        while(i--)
          if(visitedConfigsMap[configs[i]._id] !== true)
            fun2.call(me, configs[i]);
      }
    }

    function addConfig(config) {
      visitedConfigsMap[config._id] = true;
      configsList.push(config);
    }

    function eachAncestorType(BaseTypeDef, fun) {
      // Walk-up the class hierarchy, until the root, TypeDefinition is found.
      do {
        fun(BaseTypeDef);
      } while((BaseTypeDef !== TypeDefinition) && (BaseTypeDef = BaseTypeDef.ancestor));
    }

    // The following needs to be done in two phases: individual and group.
    // Otherwise, a config that matches both individually and as a group (e.g.: an array of string and regexp)
    // could end up being placed in group position and loose precedence.

    // Process Individual configurations
    eachAncestorType(TypeDef, function(BaseTypeDef) {
      mapConfigList(configLevel.indiv[BaseTypeDef.key], addConfig);
    });

    // Process Group configurations
    eachAncestorType(TypeDef, function(BaseTypeDef) {
      var typeId = BaseTypeDef.key;

      mapConfigList(configLevel.group, function(config) {
        if(!config._matchGroup || config._matchGroup(typeId))
          addConfig(config);
      });
    });

    // ---

    // Finally, map (from lowest to highest precedence).
    var j = configsList.length;
    while(j--) fun.call(this, configsList[j]);
  }

  // @private
  function invalidateContext(contextIds) {
    var cache = this._definitionsByContext;
    if(!cache) return;

    if(!contextIds) {
      // Affects every context
      this._definitionsByContext = null;
      return;
    }

    var anyDeleted = false;

    function invalidateOne(c) {
      if(!c) c = "";
      var contextDefinitions = O.getOwn(cache, c);
      if(contextDefinitions) delete cache[c];
    }

    if(contextIds instanceof Array)
      contextIds.forEach(invalidateOne);
    else
      invalidateOne(contextIds);

    if(anyDeleted) {
      // If still some other context in the cache? Return
      for(var c1 in cache)
        if(O.hasOwn(cache, c1))
          return;

      // No contexts left. Clear the field.
      this._definitionsByContext = null;
    }
  }
});
