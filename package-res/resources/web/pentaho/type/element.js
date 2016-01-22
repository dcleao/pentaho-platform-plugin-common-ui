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
  "./value",
  "../i18n!types",
  "../util/error",
  "../util/fun",
  "../util/array",
], function(module, valueFactory, bundle, error, fun, A) {

  "use strict";

  return function(context) {

    var _elemMeta = null;

    /**
     * @name pentaho.type.Element.Meta
     * @class
     * @extends pentaho.type.Value.Meta
     *
     * @classDesc The base _metadata_ class of *singular* value types.
     */

    var Value = context.get(valueFactory);

    /**
     * @name pentaho.type.Element
     * @class
     * @extends pentaho.type.Value
     * @amd pentaho/type/element
     *
     * @classDesc
     *
     * ### AMD
     *
     * Module Id: `pentaho/type/element`
     *
     * The AMD module returns the type's factory, a
     * {@link pentaho.type.Factory<pentaho.type.Element>}.
     *
     * @description Creates an element instance.
     */
    var Element = Value.extend("pentaho.type.Element", {
      meta: /** @lends pentaho.type.Element.Meta# */{

        id: module.id,

        styleClass: "pentaho-type-element",

        //region format

        // TODO: recursively inherit? clone? merge on set?

        // -> Optional({}), Inherited, Configurable
        _format: undefined,

        get format() {
          return this._format;
        },

        set format(value) {
          if(value == null) {
            if(this !== _elemMeta) {
              delete this._format;
            }
          } else {
            this._format = value || {};
          }
        },
        //endregion

        //region domain

        // TODO: Also defines the default natural ordering of the values?
        // When inherited, specified values must be a subset of those in the base class.
        // Although they can be in a different order...?
        _domain: null,

        /**
         * Gets or sets the fixed domain of the type.
         *
         * The domain attribute restricts a type
         * to a set of discrete values of the ancestor type.
         *
         * If the ancestor type also has `domain` set,
         * the specified set of values must be a subset of those,
         * or an error is thrown.
         *
         * Setting to a {@link nully} value or to an empty array,
         * clears the local value and inherits the ancestor's domain.
         *
         * NOTE: This attribute can only be used successfully on
         *  a type that has a non-abstract base type.
         *
         * @type {pentaho.type.List}
         */
        get domain() {
          return this._domain;
        },

        set domain(value) {
          if(value == null || !value.length) {
            // inherit unless we're the root
            if(this !== _elemMeta) {
              delete this._domain;
            }
          } else {
            var ancestor = this.ancestor;

            // assert !!ancestor
            // Because Value.prototype is defined as isRoot,
            // and ancestor is only null on the root, it is never null here.

            // validate and convert to ancestor type.
            value = value.map(function(valuei) {
              if(valuei == null)
                throw error.argInvalid("domain", bundle.structured.errors.type.domainHasNullElement);

              return ancestor.to(valuei);
            }, this);

            var baseDomain = Object.getPrototypeOf(this)._domain;
            if(baseDomain && !A.isSubsetOf(value, baseDomain, value_key))
              throw error.argInvalid("domain", bundle.structured.errors.type.domainIsNotSubsetOfBase);

            this._domain = value;
          }
        },
        //endregion

        //region compare method

        // TODO: document equals consistency and 0 result
        // Should be consistent with result of Value#equals
        // Should be consistent with result of Value#key
        // areEqual => compare -> 0
        // areEqual => key1 === key2

        // Configurable in a special way.
        // Setting always sets the core.
        // Getting always gets the wrapper.
        get compare() {
          return compareTop;
        },

        // NOTE: the argument cannot have the same name as the property setter
        // or PhantomJS 1.9.8 will throw a syntax error...
        set compare(_) {
          this._compare = _ || compareCore;
        },

        _compare: compareCore
        //endregion
      }
    }).implement({
      meta: bundle.structured.element
    });

    _elemMeta = Element.meta;

    return Element;
  };

  //region compare private methods
  // consistent with isEmpty and areEqual
  function compareTop(va, vb) {
    // Quick bailout test
    if(va ===  vb) return 0;
    if(va == null) return vb == null ? 0 : 1;
    if(vb == null) return -1;
    return (va.constructor === vb.constructor && va.equals(vb))
        ? 0
        : this._compare(va, vb);
  }

  // natural ascending comparer of non-equal, non-empty values
  function compareCore(va, vb) {
    return fun.compare(va, vb);
  }
  //endregion

  function value_key(value) {
    return value.key;
  }
});
