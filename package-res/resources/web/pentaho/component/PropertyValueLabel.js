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
  "../lang/Base",
], function(Base) {

  return Base.extend("pentaho.component.PropertyAtomicValueLabel", /** @lends pentaho.component.PropertyAtomicValueLabel# */{
    /**
     * @alias PropertyAtomicValueLabel
     * @memberOf pentaho.component
     *
     * @class
     *
     * @implements pentaho.lang.IListElement
     * @implements pentaho.lang.IWithKey
     *
     * @classdesc The `PropertyAtomicValueLabel` class represents
     * a pair of a property value and its label.
     *
     * ### AMD
     *
     * To obtain the constructor of this class,
     * require the module `"pentaho/component/PropertyAtomicValueLabel"`.
     *
     * @description Creates a property value/label pair given a specification or a property value.
     *
     * @param {*} spec A specification or property value.
     */
    constructor: function(spec) {
      if(spec != null) {
        if(typeof spec === "object" && ("v" in spec)) {
          this.value = spec.v;
          this.label = spec.f;
        } else {
          this.value = spec;
        }
      }
    },

    //region IListElement
    elemName: "value",
    //endregion

    //region IWithKey implementation
    keyName: "value",

    /**
     * Gets the key of the value/label.
     *
     * The key of the value/label is the string representation of its value.
     *
     * The value `null` has the key value `""`.
     *
     * @type string
     * @readonly
     */
    get key() {
      return this._v == null ? "" : this._v.toString();
    },
    //endregion

    /**
     * Gets or sets the value of the value/label pair.
     *
     * Note that the value cannot be `undefined`.
     *
     * @type pentaho.component.PropertyAtomicValue
     */
    get value() {
      return this._v;
    },

    set value(v) {
      this._v = v === undefined ? null : v;
    },

    /**
     * Gets or sets the label of the value/label pair.
     *
     * If `null` is specified, it is instead taken to be `undefined`.
     *
     * The default value is `undefined`.
     *
     * @type string|undefined
     */
    get label() {
      return this._f;
    },

    set label(f) {
      this._f = f == null ? undefined : String(f);
    },

    /**
     * Gets a best-effort string representation of the value/label pair.
     *
     * If `label` is defined, it is returned.
     *
     * Otherwise, the string representation of the `value` property is returned.
     *
     * @return {string} The value/label pair's string representation.
     */
    toString: function() {
      var f;
      return (f = this._f) != null ? f : this._v.toString();
    }
  });
});