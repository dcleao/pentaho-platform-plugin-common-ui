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
], function(Type, Base, Collection, error, O, fun) {

  /*global Promise:true*/

  var prevConfigId = 0,

      F_true = function() { return true; };

  var TypeClassCollection = Collection.extend({

    // The class of Type classes...
    elemClass: {
      to: function(v) { return v; },
      prototype: {
        elemName: Type.elemName,
        keyName:  Type.keyName
      }
    }
  });

  var TypeCollection = Collection.extend({
    elemClass: Type
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
     * component types and their configurations.
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
     * Types and their configurations may be registered using the methods, respectively:
     * * {@link pentaho.component.TypeRegistry#add} and
     * * {@link pentaho.component.TypeRegistry#addConfig}.
     *
     * To obtain _configured_ component types, use the following methods:
     * * {@link pentaho.component.TypeRegistry#get} and
     * * {@link pentaho.component.TypeRegistry#getAll}.
     *
     * Both of these accept a `contextId` argument which, when specified,
     * causes obtaining component types configured specifically for that context.
     *
     * ### AMD
     *
     * **Module Id**: `"pentaho/component/TypeRegistry"`
     *
     * @description Creates a component type registry.
     */
    constructor: function() {
      // -- Container Entries --

      // Collection.<Class.<Type>>
      this._typeClasses = new TypeClassCollection();

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

      // -- Configured types --

      // Holds configured and enabled component types.
      // Context "" is the global context.
      this._typesByContext = {};
    },

    /**
     * Registers the class of a component type.
     *
     * An error is thrown if a component type having
     * the same _id_ is already registered.
     *
     * @param {Class.<pentaho.component.Type>} Type The component type class.
     * @return {pentaho.component.TypeRegistry} The component registry.
     */
    add: function(Type) {
      if(!Type) throw error.argRequired("Type");
      if(!(Type.prototype instanceof Type))
        throw error.argInvalidType("Type", "Not a sub-class of 'pentaho/component/definition'.");

      var Type0 = this._typeClasses.get(Type.key);
      if(Type0) {
        if(Type0 === Type) return this;

        throw error.argInvalid(
            "Type",
            "Another component type with id '" + Type.key + "' is already registered.");
      }

      this._typeClasses.push(Type);

      // Invalidate contexts
      invalidateContext.call(this);

      return this;
    },

    /**
     * Gets a collection with the configured component types that are enabled.
     *
     * Optionally,
     * the id of the context in which the components will be used may also be specified.
     *
     * Do **not** modify the returned array or any of its elements.
     *
     * @param {string} [contextId] The context id.
     * @return {pentaho.lang.Collection.<pentaho.component.Type>} A collection of component types.
     */
    getAll: function(contextId) {
      return getContextTypes.call(this, contextId);
    },

    /**
     * Gets a configured component type, given its id,
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
     * @return {?pentaho.component.Type} A component type or `null`.
     */
    get: function(typeId, contextId, assertAvailable) {
      if(!typeId) throw error.argRequired("typeId");

      var type = this.getAll(contextId).get(typeId);
      if(!type && assertAvailable)
        throw new Error(
          "A component type with id '" + typeId + "' is not registered, or is disabled" +
          (contextId ? (" for context '" +  contextId + "'") : "") +
          ".");

      return type;
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
  function getContextTypes(contextId) {
    var cache = this._typesByContext;
    return (cache && O.getOwn(cache, contextId || "")) ||
           createContextTypes.call(this, contextId);
  }

  // @private
  function createContextTypes(contextId) {
    var typeCol = new TypeCollection();

    // For every non-abstract Type class
    this._typeClasses.forEach(function(Type) {
      if(!Type.prototype["abstract"]) {

        var type = createTypeForContext.call(this, Type, contextId);
        if(type.enabled)
          typeCol.push(type);

      }
    }, this);

    var cache = this._typesByContext || (this._typesByContext = {});
    cache[contextId || ""] = typeCol;
    return typeCol;
  }

  /**
   * Creates a component type of the given class,
   * and for the given context id.
   *
   * @param {Class.<pentaho.component.Type>} Type A non-abstract component type class.
   * @param {function(pentaho.component.ITypeConfigurationSpec)} fun The mapping function.
   * @return {pentaho.component.Type} A new, configured component type.
   * @ignore
   */
  function createTypeForContext(Type, contextId) {
    var type = new Type();

    mapConfigs.call(this, Type, function(config) {
      var matches = !config._matchContext || // any context
          (contextId && config._matchContext(contextId)); // matches specific context
      if(matches) type.configure(config);
    });

    return type;
  }

  /**
   * Maps the configurations applicable to a given component type,
   * from lowest to highest precedence.
   *
   * @param {Class.<pentaho.component.Type>} Type The component type class.
   * @param {function(pentaho.component.ITypeConfigurationSpec)} fun The mapping function.
   * @ignore
   */
  function mapConfigs(Type, fun) {
    var levels = this._configLevelsList,
        i = -1,
        L = levels.length;
    while(++i < L) mapConfigsOfLevel.call(this, levels[i], Type, fun);
  }

  /**
   * Maps the configurations of a configuration level,
   * applicable to a given component type,
   * from lowest to highest precedence.
   *
   * @param {pentaho.component.IComponentConfigLevel} configLevel The configuration level.
   * @param {Class.<pentaho.component.Type>} Type The component type class.
   * @param {function(pentaho.component.ITypeConfigurationSpec)} fun The mapping function.
   * @ignore
   */
  function mapConfigsOfLevel(configLevel, Type, fun) {
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

    function eachAncestorType(BaseType, fun) {
      // Walk-up the class hierarchy, until the root, Type is found.
      do {
        fun(BaseType);
      } while((BaseType !== Type) && (BaseType = BaseType.ancestor));
    }

    // The following needs to be done in two phases: individual and group.
    // Otherwise, a config that matches both individually and as a group (e.g.: an array of string and regexp)
    // could end up being placed in group position and loose precedence.

    // Process Individual configurations
    eachAncestorType(Type, function(BaseType) {
      mapConfigList(configLevel.indiv[BaseType.key], addConfig);
    });

    // Process Group configurations
    eachAncestorType(Type, function(BaseType) {
      var typeId = BaseType.key;

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
    var cache = this._typesByContext;
    if(!cache) return;

    if(!contextIds) {
      // Affects every context
      this._typesByContext = null;
      return;
    }

    var anyDeleted = false;

    function invalidateOne(c) {
      if(!c) c = "";
      var contextTypes = O.getOwn(cache, c);
      if(contextTypes) delete cache[c];
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
      this._typesByContext = null;
    }
  }
});
