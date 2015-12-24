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
  "../util/promise",
  "../util/arg",
  "../util/error",
  "../util/object"
], function(Base, promise, arg, error, O) {

  "use strict";

  /*global SESSION_NAME:false, SESSION_LOCALE:false, active_theme:false*/

  var _nextUid = 1,
      _baseMid = "pentaho/type/",

      // Default type, in a type specification.
      _defaultTypeMid = "string",

      // Default `base` type in a type specification.
      _defaultBaseTypeMid = "complex",

      // Standard types which can be assumed to already be loaded.
      _basicStandardTypes = {};

  ["value", "complex", "simple", "string", "number", "boolean", "date"].forEach(function(name) {
    _basicStandardTypes[_baseMid + name] = 1;
  });

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

    get: function(typeFactory) {
      return this._get(typeFactory, true);
    },

    getAsync: function(typeSpec) {
      return this._get(typeSpec, false);
    },

    _get: function(typeSpec, sync) {
      // Default property type is "string".
      if(!typeSpec) typeSpec = _defaultTypeMid;

      switch(typeof typeSpec) {
        case "string": return this._getById(typeSpec, sync);

        case "function":
          // Is it a ValueType directly?
          var context = typeSpec.prototype.context;
          if(context) {
            // Weak test. Assume it's a ValueType.
            if(context !== this) throw error.argInvalid("typeSpec", "'Value type' is from a different context.");
            typeSpec = this._linkType(typeSpec);
            return sync ? typeSpec : Promise.resolve(typeSpec);
          }

          // Assume it's a factory function.
          return this._getByFactory(typeSpec, sync);

        case "object":   return this._getByObject(typeSpec, sync);
      }

      throw error.argInvalid("typeSpec");
    },

    _getById: function(id, sync) {
      id = toAbsTypeId(id);

      return sync
          // This fails if a module with the id in the `typeSpec` var
          // is not already _loaded_.
          ? this._get(require(id), true)
          : promise.require([id]).then(this._get.bind(this));
    },

    _getByFactory: function(typeFactory, sync) {
      var uid = getUid(typeFactory),
          Type = O.getOwn(this._byFactoryUid, uid);

      if(!Type) {
        // TODO: validate the type of what the factory returns.
        this._byFactoryUid[uid] = Type = this._linkType(typeFactory(this));
      }

      return sync ? Type : Promise.resolve(Type);
    },

    _linkType: function(Type) {
      if(Type.id) {
        // TODO: ensure a type is not configured twice.
        var extendConfig = this._getConfig(Type.id);
        if(extendConfig) Type.implement(extendConfig);
      }
      return Type;
    },

    // Properties only: [string||{}, ...] or
    // Inline type spec: {[base: "complex", ] ... }
    _getByObject: function(typeSpec, sync) {

      if(typeSpec instanceof Array) typeSpec = {props: typeSpec};

      var baseTypeSpec = typeSpec.base || _defaultBaseTypeMid,
          resolveSync = function() {
              var BaseType = this._get(baseTypeSpec, /*sync:*/true);
              var Type = BaseType.extend(typeSpec);
              // TODO: analyze impact of id being supplied here (without a factory).
              return this._linkType(Type);
            }.bind(this);

      // When sync, it should be the case that every referenced id is already loaded,
      // or an error will be thrown when requiring these.
      if(sync) return resolveSync();

      // Collect the module ids of all custom types used within typeSpec.
      var customTypeIds = [];
      collectTypeIds(typeSpec, customTypeIds);

      // Require them all and only then invoke the synchronous BaseType.extend method.
      if(customTypeIds.length)
        return promise.require(customTypeIds).then(resolveSync);

      // All types are standard and can be assumed to be already loaded.
      // However, we should behave async as requested.
      return promise.call(resolveSync);
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

  // It's considered an AMD id only if it has at least one "/".
  // Otherwise, append pentaho's base amd id.
  function toAbsTypeId(id) {
    return id.indexOf("/") < 0 ? (_baseMid + id) : id;
  }

  // Recursively collect the module ids of all custom types used within typeSpec.
  function collectTypeIds(typeSpec, outIds) {
    if(!typeSpec) return;

    switch(typeof typeSpec) {
      case "string":
        // It's considered an AMD id only if it has at least one "/".
        // Otherwise, append pentaho's base amd id.
        if(typeSpec.indexOf("/") < 0) typeSpec = _baseMid + typeSpec;

        // A standard type that is surely loaded?
        if(_basicStandardTypes[typeSpec] === 1) return;

        outIds.push(typeSpec);
        return;

      case "object":
        // Properties only: [string||{}, ...] or
        // Inline type spec: {[base: "complex", ] ... }
        if(typeSpec instanceof Array) typeSpec = {props: typeSpec};

        collectTypeIds(typeSpec.base, outIds);

        if(typeSpec.props) typeSpec.props.forEach(function(propSpec) {
          collectTypeIds(propSpec && propSpec.type, outIds);
        });
        return;
    }
  }
});
