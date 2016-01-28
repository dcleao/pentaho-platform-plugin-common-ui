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
  "./RefinementMixin",
  "../i18n!types",
  "../util/error"
], function(Refinement, bundle, error) {

  "use strict";

  /**
   * @name pentaho.type.DomainRefinementMixin
   * @amd pentaho/type/DomainRefinementMixin
   * @class
   * @extends pentaho.type.RefinementMixin
   * @classDesc The _domain_ refinement mixin enables defining an abstract subtype
   *   whose domain is limited to a discrete number of the supertype's instances.
   *
   * @description The constructor is not used, as a mixin.
   */
  return Refinement.extend("pentaho.type.DomainRefinementMixin", /** @lends pentaho.type.DomainRefinementMixin# */{

    //region domain

    // TODO: Also defines the default natural ordering of the values?
    // When inherited, specified values must be a subset of those in the base class.
    // Although they can be in a different order...?
    _domain: null,

    /**
     * Gets the fixed domain of the type, if any, or `null`.
     *
     * The domain attribute refines a type to a set of discrete values
     * whose type is that of the unrefined type, {@link pentaho.type.Value.Meta#refinesType}.
     *
     * If the ancestor type is refined and has `domain` set,
     * the specified set of values must be a subset of those,
     * or an error is thrown.
     *
     * Setting to a {@link Nully} value,
     * clears the local value and inherits the ancestor's domain.
     *
     * Setting to an empty array, effectively creates an _empty refined type_.
     *
     * @type {?pentaho.type.List}
     * @readonly
     */
    get domain() {
      return this._domain;
    },

    set domain(value) {
      // The root is the direct descendant of the refinesType.
      var refinesType = this.refinesType,
          ancestor = Object.getPrototypeOf(this),
          isRoot = refinesType === ancestor,
          localDomain;

      // TODO: Either ancestors should be locked when deriving,
      //  or direct changes to domain should propagate downwards...
      if(value == null) {
        if(!isRoot) {
          // Inherit base list.
          delete this._domain;
          // localDomain = baseDomain && baseDomain.clone();
          return;
        }

        // At the root, resetting is setting to null.
        localDomain = null;
      } else {
        // An Array, a List, ...

        // Convert value to ListType.
        // A list of the refines type.
        var ListType = this.context.get([refinesType]);
        localDomain = new ListType(value);

        if(!isRoot) {
          var baseDomain = ancestor._domain;
          if(baseDomain) {
            // Validate that all elements exist in the base domain
            var i = localDomain.count, v0, v1;
            while(i--) {
              v1 = localDomain.at(i);
              v0 = baseDomain.get(v1.key);
              if(!v0)
                throw error.argInvalid("domain", bundle.structured.errors.type.domainIsNotSubsetOfBase);

              // Prefer using the base instances.
              if(v0 !== v1) {
                // TODO: Should be a single replace operation...
                localDomain.removeAt(i);
                localDomain.insert(v0, i);
              }
            }
          }
        }
      }

      // May be an empty list.
      this._domain = localDomain;
    }
  }, {
    validate: function(value) {
      var domain = this.domain;
      if(domain && !domain.has(value.key))
        return new Error(bundle.structured.errors.value.notInDomain);
      return null;
    }
  });
});