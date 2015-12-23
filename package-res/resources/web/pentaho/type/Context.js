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
  "../util/arg",
  "../util/error",
  "../util/object"
], function(Base, arg, error, O) {

  "use strict";

  /*global SESSION_NAME:false, SESSION_LOCALE:false, active_theme:false*/

  var _nextUid = 1,
      _baseMid = "pentaho/type/";

  /**
   * @name pentaho.type.Context
   *
   * @class
   * @implements pentaho.type.IContext
   * @classDesc The `Context` class contains `ValueType` classes _configured_ for a particular _context_.
   *
   * @constructor
   * @description Creates a `Context` whose variables default to pentaho's thin-client state variables.
   * @param {object} spec
   * @param {string?} [spec.container] The id of the container application.
   * @param {string?} [spec.user] The id of the user. Defaults to the current user.
   * @param {string?} [spec.theme] The id of the theme. Defaults to the current theme.
   * @param {string?} [spec.locale] The id of the locale. Defaults to the current locale.
   */
  return Base.extend(/** @lends pentaho.type.Context# */{

    constructor: function(spec) {
      this._container = arg.optional(spec, "container") || getCurrentContainer();
      this._user      = arg.optional(spec, "user")      || getCurrentUser();
      this._theme     = arg.optional(spec, "theme")     || getCurrentTheme();
      this._locale    = arg.optional(spec, "locale")    || getCurrentLocale();

      // Singleton instance by factory uid
      this._byFactoryUid = {};
    },

    //region context variables
    get container() {
      return this._container;
    },

    get user() {
      return this._user;
    },

    get theme() {
      return this._theme;
    },

    get locale() {
      return this._locale;
    },
    //endregion

    /**
     * Obtains the type class for a given type factory or type id.
     *
     * When a type id is specified, its corresponding AMD module must already
     * have been loaded or an error is thrown.
     *
     * @param {string|pentaho.type.TypeFactory} typeFactory The factory of the desired type or the type id.
     * @return {Class.<pentaho.type.ValueType>} The corresponding type class.
     */
    get: function(typeFactory) {
      if(!typeFactory) throw error.argRequired("typeFactory");

      if(typeof typeFactory === "string") {
        // It's considered an AMD id only if it has at least one "/".
        // Otherwise, append pentaho's base amd id.
        if(typeFactory.indexOf("/") < 0) {
          typeFactory = _baseMid + typeFactory;
        }

        // Throws when not yet loaded.
        typeFactory = require(typeFactory);
      }

      var uid = getUid(typeFactory),
          Type = O.getOwn(this._byFactoryUid, uid);

      if(!Type) {
        // TODO: validate the type of what the factory returns.
        Type = typeFactory(this);

        // Force this
        Type.prototype.context = this;
        if(Type.id) {
          var extendConfig = this._getConfig(Type.id);
          if(extendConfig) Type.implement(extendConfig);
        }

        this._byFactoryUid[uid] = Type;
      }

      return Type;
    },

    _getConfig: function(id) {
      // TODO: link to configuration service
      return null;
    }
  });

  function getCurrentContainer() {
    // TODO: should try to find webcontext.js in scripts collection?
    return null;
  }

  function getCurrentUser() {
    return typeof SESSION_NAME !== "undefined" ? SESSION_NAME : null;
  }

  function getCurrentTheme() {
    return typeof active_theme !== "undefined" ? active_theme : null;
  }

  function getCurrentLocale() {
    return typeof SESSION_LOCALE !== "undefined" ? SESSION_LOCALE : null;
  }

  function getUid(factory) {
    return factory.uid || (factory.uid = _nextUid++);
  }
});
