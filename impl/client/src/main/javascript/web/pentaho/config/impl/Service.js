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
define([
  "module",
  "../../lang/Base",
  "../../util/spec",
  "../../util/object",
  "../../lang/ArgumentRequiredError",
  "../../lang/SortedList",
  "../../shim/es6-promise"
], function(module, Base, specUtil, O, ArgumentRequiredError, SortedList) {

  "use strict";

  /**
   * List of names of environment variables that are handled "generically" when sorting rules.
   * More specific first.
   *
   * @type {string[]}
   * @see pentaho.environment.IEnvironment
   * @see __ruleComparer
   * @see __ruleFilterer
   */
  var __selectCriteria = [
    "user", // TODO: is now user.id and will not have effect as is
    "theme",
    "locale",
    "application"
  ];

  /**
   * The ordinal value of the next rule that is registered.
   *
   * This is used as the fallback rule order.
   * Ensures sorting algorithm stability, because insertion order would be lost during a re-sort.
   *
   * @type {number}
   *
   * @see pentaho.config.IService#addRule
   */
  var __ruleCounter = 0;

  var ConfigurationService = Base.extend(module.id, /** @lends pentaho.config.impl.Service# */{

    /**
     * @classDesc The `Service` class is an in-memory implementation of
     * the {@link pentaho.config.IService} interface.
     *
     * @alias Service
     * @memberOf pentaho.config.impl
     * @class
     * @extends pentaho.lang.Base
     * @implements {pentaho.config.IService}
     *
     * @amd pentaho/config/impl/Service
     *
     * @description Creates a configuration service instance with no registrations for a given environment.
     *
     * @param {pentaho.environment.IEnvironment} environment - The environment used to select configuration rules.
     */
    constructor: function(environment) {

      /**
       * The environment used to select configuration rules.
       * @type {!pentaho.environment.IEnvironment}
       * @readOnly
       */
      this.__environment = environment || {};

      /**
       * A map connecting a type or instance identifier to the applicable configuration rules,
       * ordered from least to most specific.
       *
       * @type {!Object.<string, Array.<pentaho.config.spec.IRule>>}
       * @private
       */
      this.__ruleStore = Object.create(null);
    },

    /**
     * Adds a configuration rule set.
     *
     * @param {!pentaho.config.spec.IRuleSet} config - A configuration rule set to add.
     */
    add: function(config) {
      if(config && config.rules) {
        config.rules.forEach(function(rule) {
          this.addRule(rule);
        }, this);
      }
    },

    /**
     * Adds a configuration rule.
     *
     * The insertion order is used as the fallback rule order.
     * For more information on the specificity of rules,
     * see [config.spec.IRuleSet]{@link pentaho.config.spec.IRuleSet}.
     *
     * Note that the specified rule object may be slightly modified to serve
     * the service's internal needs.
     *
     * @param {!pentaho.config.spec.IRule} rule - The configuration rule to add.
     */
    addRule: function(rule) {
      // Assuming the Service takes ownership of the rules,
      // so mutating it directly is ok.
      rule._ordinal = __ruleCounter++;

      var select = rule.select || {};

      var itemKey;

      itemKey = "instance";
      var itemIds = select[itemKey];
      if(!itemIds) {
        itemKey = "type";
        itemIds = select[itemKey];
      }

      if(!itemIds) {
        throw new ArgumentRequiredError("rule.select.type");
      }

      if(!Array.isArray(itemIds)) {
        itemIds = [itemIds];
      }

      itemIds.forEach(function(itemId) {
        if(!itemId) {
          throw new ArgumentRequiredError("rule.select." + itemKey);
        }

        var fullItemId = itemKey + ":" + itemId;

        var list = this.__ruleStore[fullItemId];
        if(!list) {
          this.__ruleStore[fullItemId] = list = new SortedList({comparer: __ruleComparer});
        }

        list.push(rule);
      }, this);
    },

    /** @inheritDoc */
    selectType: function(typeId) {
      return this.__selectItem("type:" + typeId);
    },

    /** @inheritDoc */
    selectInstance: function(instanceId) {
      return this.__selectItem("instance:" + instanceId);
    },

    /**
     * Selects a type or instance given its full identifier.
     *
     * @param {string} fullItemId - The full identifier of the item.
     *
     * @return {Object} The configuration, if any; `null` otherwise.
     * @private
     */
    __selectItem: function(fullItemId) {

      var rules = O.getOwn(this.__ruleStore, fullItemId);
      if(!rules) {
        return null;
      }

      var filteredRules = rules.filter(__ruleFilterer, this.__environment);

      var configs = filteredRules.map(function(rule) {
        return rule.apply;
      });

      if(configs.length === 0) {
        return null;
      }

      // Merge configurations.
      return configs.reduce(specUtil.merge.bind(specUtil), {});
    }
  });

  return ConfigurationService;

  // region compare and select
  /**
   * Compares two type configuration rules according to specificity.
   *
   * @param {!pentaho.config.spec.IRule} r1 - The first type configuration rule.
   * @param {!pentaho.config.spec.IRule} r2 - The second type configuration rule.
   *
   * @return {number} `-1`, if `r1` is more specific than `r2`,
   * `1`, if `r2` is more specific than `r1`,
   * and `0` if they have the same specificity.
   */
  function __ruleComparer(r1, r2) {
    var priority1 = r1.priority || 0;
    var priority2 = r2.priority || 0;

    if(priority1 !== priority2) {
      return priority1 > priority2 ? 1 : -1;
    }

    var s1 = r1.select || {};
    var s2 = r2.select || {};

    for(var i = 0, ic = __selectCriteria.length; i !== ic; ++i) {
      var key = __selectCriteria[i];

      var isDefined1 = s1[key] != null;
      var isDefined2 = s2[key] != null;

      if(isDefined1 !== isDefined2) {
        return isDefined1 ? 1 : -1;
      }
    }

    return r1._ordinal > r2._ordinal ? 1 : -1;
  }

  /**
   * Determines if a given rule is selected by the current context.
   *
   * @this pentaho.environment.IEnvironment
   *
   * @param {!pentaho.config.spec.IRule} rule - A type configuration rule to check.
   *
   * @return {boolean} `true` if `rule` is selected, `false`, otherwise.
   */
  function __ruleFilterer(rule) {

    /* jshint validthis:true*/

    var select = rule.select;
    if(select) {
      // Doing it backwards because `application` is the most common criteria...
      var i = __selectCriteria.length;
      while(i--) {
        var key = __selectCriteria[i];

        var possibleValues = select[key];
        if(possibleValues != null) {

          var criteriaValue = this[key];

          if(Array.isArray(possibleValues)
              ? possibleValues.indexOf(criteriaValue) === -1
              : possibleValues !== criteriaValue) {
            return false;
          }
        }
      }
    }

    return true;
  }
  // endregion
});
