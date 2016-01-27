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
  "../lang/Base"
], function(Base) {

  "use strict";

  /**
   * @name pentaho.type.RestrictionMixin
   * @amd pentaho/type/RestrictionMixin
   * @class
   * @classDesc The restriction mixin is used to extend a value metadata class,
   * {@link pentaho.type.Value.Meta}, with attributes which, when specified, allow it to be restricted.
   *
   * To define an actual restriction, inherit from this class and:
   * 1. in the prototype, define any attributes that should be mixed into the target value metadata class
   * 2. implement the static {@link pentaho.type.RestrictionMixin.validate} method
   *    that will perform the actual validation on instances of the target class.
   *
   * @description The constructor is not used, as a mixin.
   * @abstract
   * @see pentaho.type.Value.Meta#restrictsType
   */
  return Base.extend("pentaho.type.RestrictionMixin", {
    /* mixin stuff */
  }, /** @lends pentaho.type.RestrictionMixin */{
    /**
     * Performs validation of a given value.
     *
     * This method is invoked **on** the restricted type metadata,
     *  an instance of {@link pentaho.type.Value.Meta}.
     *
     * The default implementation simply returns `null`.
     *
     * @param {!pentaho.type.Value} value The value to validate according to this restriction.
     *
     * @return {Error|Array.<!Error>|null} An `Error`, a non-empty array of `Error` or `null`.
     */
    validate: function(value) {
      return null;
    }
  });
});