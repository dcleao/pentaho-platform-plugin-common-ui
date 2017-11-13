/*!
 * Copyright 2017 Hitachi Vantara. All rights reserved.
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
  "require",
  "module",
  "pentaho/lang/Base",
  "../SpecificationScope",
  "../SpecificationContext",
  "../util",
  "pentaho/typeInfo",
  "pentaho/instanceInfo",
  "pentaho/lang/SortedList",
  "pentaho/util/object",
  "pentaho/util/fun",
  "pentaho/util/promise",
  "pentaho/util/error"
],
// While the {typeof A} syntax is recognized by IntelliJ, eslint and jsdoc3 do not recognize it.
// see https://github.com/jsdoc3/jsdoc/issues/1349
// see https://youtrack.jetbrains.com/issue/WEB-17325
// see https://stackoverflow.com/questions/33150924/jsdoc-es6-and-param-constructor
//
// eslint-disable-next-line valid-jsdoc
/**
 * Constructs an `pentaho.type.impl.Loader` class.
 * @ignore
 * @param {require} localRequire - The AMD module contextual `require` function.
 * @param {module} module - The AMD module object.
 * @param {typeof pentaho.lang.Base} Base - The Base class.
 * @param {typeof pentaho.type.SpecificationScope} SpecificationScope - The `SpecificationScope` class.
 * @param {typeof pentaho.type.SpecificationContext} SpecificationContext - The `SpecificationContext` class.
 * @param {typeof pentaho.type.util} typeUtil - The type utility.
 * @param {typeof pentaho.typeInfo.service} typeInfo - The type information service.
 * @param {typeof pentaho.instanceInfo.service} instanceInfo - The instance information service.
 * @param {typeof pentaho.lang.SortedList} SortedList - The `SortedList` class.
 * @param {typeof pentaho.util.object} O - The object utility.
 * @param {typeof pentaho.util.fun} F - The function utility.
 * @param {typeof pentaho.util.promise} promiseUtil - The promise utility.
 * @param {typeof pentaho.util.error} error - The error utility.
 *
 * @return {typeof pentaho.type.impl.Loader} The `Loader` class.
 */
function(localRequire, module, Base, SpecificationScope, SpecificationContext, typeUtil,
            typeInfo, instanceInfo, SortedList, O, F, promiseUtil, error) {

  "use strict";

  /* eslint dot-notation: 0 */

  var DEFAULT_BASE_TYPE = "pentaho/type/Complex";
  var INSTANCE_TYPE = "pentaho/type/Instance";

  var __nextInstanceIndex = 1;

  var __Instance = null;
  var __String = null;
  var __Number = null;
  var __Boolean = null;

  /**
   * @name pentaho.type.impl.IInstanceInfo
   * @interface
   * @private
   *
   * @property {string} id - The instance's identifier.
   * @property {number} index - The instance registration index.
   * @property {string} typeId - The identifier of the instance's type.
   * @property {number} ranking - The ranking of the instance.
   * An instance with a higher rank is given before one with a lower rank.
   */

  var Loader = Base.extend(module.id, /** @lends pentaho.type.impl.Loader# */ {

    // region Initialization

    /**
     * @classDesc The `ILoader` implementation.
     *
     * @alias Loader
     * @memberOf pentaho.type.impl
     *
     * @class
     * @extends pentaho.lang.Base
     * @implements {pentaho.type.ILoader}
     *
     * @constructor
     * @description Creates an instance.
     * @param {pentaho.type.spec.ILoaderConfiguration} [config] - The loader configuration.
     */
    constructor: function(config) {
      /**
       * Map of `InstanceInfo` by instance identifier.
       *
       * @type {!Object.<string, pentaho.type.impl.IInstanceInfo>}
       * @private
       * @readOnly
       */
      this.__instanceById = Object.create(null);

      /**
       * Map from type id to a list of instance infos.
       *
       * @type {!Object.<string, Array.<pentaho.type.impl.IInstanceInfo>>}
       * @private
       * @readonly
       */
      this.__instancesByType = Object.create(null);

      /* At the moment, only instances have a loader configuration.
       * However, it would also make sense for types to have a loader ranking.
       */

      this.__importKnownInstances(config && config.instances);
    },

    /**
     * Imports instances of subtypes of `pentaho.type.Instance` which are
     * declared with the Instance Info API, at this time.
     *
     * Its configuration for this loader, if any, as provided in `config`,
     * is used to configure the instance with this loader.
     *
     * @param {Object.<string, pentaho.type.spec.ILoaderInstanceConfiguration>} config - A map of
     * instance configurations by instance identifier.
     *
     * @private
     */
    __importKnownInstances: function(config) {
      // We need to know the type of the instances.
      // So only those registered with instanceInfo are recognized and searched for in config.
      var instanceIds = instanceInfo.getAllOfType(INSTANCE_TYPE, {includeDescendants: true});
      if(instanceIds) {
        instanceIds.forEach(function(instanceId) {
          var typeId = instanceInfo.getTypeOf(instanceId);
          var instanceConfig = O.getOwn(config, instanceId);

          this.__importKnownInstance(instanceId, typeId, instanceConfig);
        }, this);
      }
    },

    /**
     * Import an instance of a subtype of `pentaho.type.Instance`,
     * given its id, type id and loader configuration.
     *
     * Its configuration for this loader, if any, as provided in `instanceConfig`,
     * is used to configure the instance with this loader.
     *
     * @param {string} id - The instance identifier.
     * @param {string} typeId - The instance's type identifier.
     * @param {pentaho.type.spec.ILoaderInstanceConfiguration} instanceConfig - The instance configuration
     * for this loader.
     *
     * @private
     */
    __importKnownInstance: function(id, typeId, instanceConfig) {

      if(O.getOwn(this.__instanceById, id))
        throw error.argInvalid("id", "An instance with identifier '" + id + "' is already defined.");

      var info = /** @type pentaho.type.impl.IInstanceInfo */{
        id: id,
        index: __nextInstanceIndex++,
        typeId: typeInfo.getIdOf(typeId) || typeId,
        ranking: (instanceConfig && +instanceConfig.ranking) || 0
      };

      this.__instanceById[info.id] = info;

      var infos = (this.__instancesByType[info.typeId] ||
          (this.__instancesByType[info.typeId] = new SortedList({comparer: __instanceInformationComparer})));

      infos.push(info);
    },
    // endregion

    // region Type methods
    /** @inheritDoc */
    registerTypeAsync: function(InstCtor, keyArgs) {

      var id = InstCtor.type.id;

      // 1. Register in type info.
      __registerTypeWithTypeInfoApi(InstCtor.type);

      // 2. Define the AMD module.
      if(O.getOwn(keyArgs, "configure", false)) {

        define(id, ["pentaho/config!"], function(typeConfig) {
          return InstCtor.configure({$type: typeConfig});
        });
      } else {

        define(id, [], function() {
          return InstCtor;
        });
      }

      // 3. Capture the just defined module in the AMD context of localRequire.
      // Not calling this, would end up defining the module in the default AMD context.
      return promiseUtil.require(id, localRequire);
    },

    /** @inheritDoc */
    resolveType: function(typeRef, keyArgs) {
      return this.__resolveType(typeRef, O.getOwn(keyArgs, "defaultBase"), true);
    },

    /** @inheritDoc */
    resolveTypeAsync: function(typeRef, keyArgs) {
      try {
        return this.__resolveType(typeRef, O.getOwn(keyArgs, "defaultBase"), false);
      } catch(ex) {
        /* istanbul ignore next : really hard to test safeguard */
        return Promise.reject(ex);
      }
    },

    /** @inheritDoc */
    getSubtypesOf: function(baseTypeId, keyArgs) {
      if(!baseTypeId) throw error.argRequired("baseTypeId");

      var predicate = __buildGetSubtypesOfPredicate(keyArgs);

      var subtypeIds =
          typeInfo.getSubtypesOf(baseTypeId, {includeSelf: true, includeDescendants: true}) || [baseTypeId];

      // Throws if any subtype is not loaded.
      var InstCtors = subtypeIds.map(function(subtypeId) {
        return this.resolveType(subtypeId);
      }, this);

      if(predicate) {
        InstCtors = InstCtors.filter(function(InstCtor) {
          return predicate(InstCtor.type);
        });
      }

      return InstCtors;
    },

    /** @inheritDoc */
    getSubtypesOfAsync: function(baseTypeId, keyArgs) {
      try {
        if(!baseTypeId) return Promise.resolve(error.argRequired("baseTypeId"));

        var predicate = __buildGetSubtypesOfPredicate(keyArgs);

        var subtypeIds =
            typeInfo.getSubtypesOf(baseTypeId, {includeSelf: true, includeDescendants: true}) || [baseTypeId];

        var promises = subtypeIds.map(function(subtypeId) {
          return this.resolveTypeAsync(subtypeId);
        }, this);

        return Promise.all(promises).then(function(InstCtors) {

          if(predicate) {
            InstCtors = InstCtors.filter(function(InstCtor) {
              return predicate(InstCtor.type);
            });
          }

          return InstCtors;
        });

      } catch(ex) {
        return Promise.reject(ex);
      }
    },

    /**
     * Resolves a type reference.
     *
     * Internal get method shared by `resolveType` and `resolveTypeAsync`.
     * Uses `sync` argument to distinguish between the two modes.
     *
     * Main dispatcher according to the type and class of `typeRef`:
     * string, function or array or object.
     *
     * @param {pentaho.type.spec.UTypeReference} typeRef - A type reference.
     * @param {pentaho.type.spec.UTypeReference} defaultBase - A reference to the default base type.
     * @param {boolean} [sync=false] Whether to perform a synchronous get.
     *
     * @return {!Promise.<!Class.<pentaho.type.Instance>>|!Class.<pentaho.type.Instance>} When sync,
     *   returns the instance constructor; while, when async, returns a promise for it.
     *
     * @throws {pentaho.lang.ArgumentInvalidError} When `typeRef` is of an unsupported JavaScript type:
     * not a string, function, array or object.
     *
     * @private
     */
    __resolveType: function(typeRef, defaultBase, sync) {
      if(typeRef == null || typeRef === "") {
        return promiseUtil.error(error.argRequired("typeRef"), sync);
      }

      /* eslint default-case: 0 */
      switch(typeof typeRef) {
        case "string": return this.__getTypeById(typeRef, sync);
        case "function": return this.__getTypeByFun(typeRef, sync);
        case "object": return Array.isArray(typeRef)
            ? this.__resolveTypeByListSpec(typeRef, sync)
            : this.__resolveTypeByObject(typeRef, defaultBase, sync);
      }

      return promiseUtil.error(error.argInvalid("typeRef"), sync);
    },

    /**
     * Gets the instance constructor of a type given its identifier.
     *
     * If the identifier is a temporary identifier,
     * it must have already been loaded in the ambient specification context.
     *
     * Otherwise, the identifier is permanent.
     * If the identifier does not contain any "/" character,
     * it is considered relative to Pentaho's `pentaho/type` module.
     *
     * Checks if the identifier is already present in the `__byTypeId` map,
     * returning immediately (modulo sync) if it is.
     *
     * Otherwise, it requires the module, using either the sync or the async AMD form.
     *
     * If sync, AMD throws if a module with the given identifier is not yet loaded or is not defined.
     *
     * When the resulting module is returned by AMD,
     * its result is passed on, _recursively_, to `__resolveType`,
     * and, thus, the module can return any of the supported type reference formats.
     * The usual is to return a factory function.
     *
     * ### Ambient specification context
     *
     * This method uses the ambient specification context to support deserialization of
     * generic type specifications containing temporary identifiers for referencing anonymous types.
     *
     * When a temporary identifier is specified and
     * there is no ambient specification context or
     * no definition is contained for it,
     * an error is thrown.
     *
     * @param {string} id - The identifier of a type. It can be a temporary or permanent identifier.
     * In the latter case, it can be relative or absolute.
     *
     * @param {boolean} [sync=false] Whether to perform a synchronous get.
     *
     * @return {!Promise.<!Class.<pentaho.type.Instance>>|!Class.<pentaho.type.Instance>} When sync,
     *   returns the instance constructor; while, when async, returns a promise for it.
     *
     * @private
     */
    __getTypeById: function(id, sync) {

      if(SpecificationContext.isIdTemporary(id)) {
        var currentSpecContext = SpecificationContext.current;
        if(!currentSpecContext) {
          return promiseUtil.error(
              error.argInvalid("typeRef", "Temporary ids cannot occur outside of a generic type specification."),
              sync);
        }

        // Id must exist in the specification context, or it's invalid.
        var type = currentSpecContext.get(id);
        if(!type) {
          return promiseUtil.error(
              error.argInvalid("typeRef", "Temporary id does not correspond to a known type."),
              sync);
        }

        return promiseUtil["return"](type.instance.constructor, sync);
      }

      // Translate alias.
      id = typeInfo.getIdOf(id) || id;

      // Load.
      return sync ? localRequire(id) : promiseUtil.require(id, localRequire);
    },

    /**
     * Validates that the given function is the instance constructor of a type,
     * and returns it or rejects it.
     *
     * @param {function} fun - A function.
     * @param {boolean} [sync=false] Whether to perform a synchronous get.
     *
     * @return {!Promise.<!Class.<pentaho.type.Instance>>|!Class.<pentaho.type.Instance>} When sync,
     *   returns the instance constructor; while, when async, returns a promise for it.
     *
     * @throws {pentaho.lang.ArgumentInvalidError} When `fun` is not an `Instance` constructor.
     *
     * @private
     */
    __getTypeByFun: function(fun, sync) {

      if(!(fun.prototype instanceof __getInstanceClass())) {
        return promiseUtil.error(
            error.argInvalid("typeRef", "Function is not a 'pentaho.type.Instance' constructor."), sync);
      }

      return promiseUtil["return"](fun, sync);
    },

    /**
     * Resolves a type given by an array-shorthand specification.
     *
     * Example: a list of complex type elements
     *
     *  [{props: { ...}}]
     *  <=>
     *  {base: "list", of: {props: { ...}}}
     *
     * @param {Array} typeSpec - The list specification.
     * @param {boolean} [sync=false] Whether to perform a synchronous resolve.
     *
     * @return {!Promise.<!Class.<pentaho.type.Instance>>|!Class.<pentaho.type.Instance>} When sync,
     *   returns the instance constructor; while, when async, returns a promise for it.
     *
     * @throws {pentaho.lang.ArgumentInvalidError} When `typeRef` is, or contains, an array-shorthand,
     * list type specification that has more than one child element type specification.
     *
     * @private
     */
    __resolveTypeByListSpec: function(typeSpec, sync) {

      var elemTypeSpec;
      if(typeSpec.length !== 1 || !(elemTypeSpec = typeSpec[0]))
        return promiseUtil.error(
            error.argInvalid("typeRef", "List type specification must have a single child element type spec."),
            sync);

      // Expand compact list type spec syntax and delegate to the generic handler.
      return this.__resolveTypeByObjectSpec({base: "list", of: elemTypeSpec}, null, sync);
    },

    /**
     * Resolves a type given by an object: either a type object or
     * a generic object specification.
     *
     * @param {pentaho.type.spec.UTypeReference} typeRef - A type reference.
     * @param {pentaho.type.spec.UTypeReference} defaultBase - The default base type
     * of `typeRef` when it is a generic object specification.
     *
     * @param {boolean} [sync=false] Whether to perform a synchronous resolve.
     *
     * @return {!Promise.<!Class.<pentaho.type.Instance>>|!Class.<pentaho.type.Instance>} When sync,
     *   returns the instance constructor; while, when async, returns a promise for it.
     *
     * @throws {pentaho.lang.ArgumentInvalidError} When `typeRef` is an instance of `pentaho.type.Instance`.
     *
     * @private
     */
    __resolveTypeByObject: function(typeRef, defaultBase, sync) {

      if(typeRef.constructor !== Object) {

        var Instance = __getInstanceClass();

        // An instance of Type ?
        if(typeRef instanceof Instance.Type) {
          return promiseUtil["return"](typeRef.instance.constructor, sync);
        }

        if(typeRef instanceof Instance) {
          return promiseUtil.error(
              error.argInvalid("typeRef", "Instances are not supported as type references."), sync);
        }

        return promiseUtil.error(
            error.argInvalid("typeRef", "Object is not a 'pentaho.type.Type' instance or a plain object."), sync);
      }

      return this.__resolveTypeByObjectSpec(typeRef, defaultBase, sync);
    },

    /**
     * Resolves a type given a generic object specification of it.
     *
     * If the type specification contains an identifier,
     * then it must be a temporary identifier, and one which is not yet registered
     * with the ambient specification context.
     *
     * Example generic object type specification:
     *
     * ```json
     * {
     *   "id": "_:1",
     *   "base": "complex",
     *   ...
     * }
     * ```
     *
     * @param {!pentaho.type.spec.ITypeProto} typeSpec - A type specification.
     * @param {pentaho.type.spec.UTypeReference} defaultBase - The default base type.
     * @param {boolean} [sync=false] Whether to perform a synchronous resolve.
     *
     * @return {!Promise.<!Class.<pentaho.type.Instance>>|!Class.<pentaho.type.Instance>} When sync,
     *   returns the instance constructor; while, when async, returns a promise for it.
     *
     * @throws {pentaho.lang.ArgumentInvalidError} When `typeSpec` has a permanent identifier.
     *
     * @throws {pentaho.lang.ArgumentInvalidError} When `typeSpec` has a temporary identifier
     * which is already defined.
     *
     * @private
     */
    __resolveTypeByObjectSpec: function(typeSpec, defaultBase, sync) {

      var temporaryId = typeSpec.id || null;
      if(temporaryId !== null) {

        // Ensure this is a new temporary id.

        if(!SpecificationContext.isIdTemporary(temporaryId)) {
          return promiseUtil.error(
              error.argInvalid("typeRef", "Generic type specifications cannot have a permanent id."),
              sync);
        }

        var currentSpecContext = SpecificationContext.current;
        if(currentSpecContext !== null && currentSpecContext.get(temporaryId) !== null) {
          return promiseUtil.error(
            error.argInvalid("typeRef", "Temporary id '" + temporaryId + "' is already defined."),
            sync);
        }
      }

      if(sync) {
        // Throws if any referenced id is not already loaded.
        return this.__createTypeByObjectSpec(temporaryId, typeSpec, defaultBase);
      }

      // Get the referenced dependencies first and only then create the type.
      return this.__loadTypeDependenciesAsync(typeSpec).then(function() {
        return this.__createTypeByObjectSpec(temporaryId, typeSpec, defaultBase);
      }.bind(this));
    },

    /**
     * Synchronously creates a type with a given temporary identifier,
     * generic object reference and default base type.
     *
     * All dependencies must have been loaded.
     *
     * Ensures that an ambient specification context exists,
     * creating one if not.
     *
     * Note the switch to sync mode here, whatever the outer `sync` value.
     * Only the outermost __resolveTypeByObjectSpec call may be async.
     * All types created within a root type given by a generic object type specification
     * will use the ambient specification context installed by it.
     *
     * @param {?string} temporaryId - The temporary identifier of the type, if any.
     * @param {!pentaho.type.spec.ITypeProto} typeSpec - A type specification.
     * @param {pentaho.type.spec.UTypeReference} [defaultBase] - The default base type.
     *
     * @return {!pentaho.type.Instance} The type's instance constructor.
     *
     * @private
     */
    __createTypeByObjectSpec: function(temporaryId, typeSpec, defaultBase) {

      return O.using(new SpecificationScope(), function(specScope) {

        // Resolve the base type.
        var baseTypeSpec = typeSpec.base || defaultBase || DEFAULT_BASE_TYPE;

        var BaseInstCtor = this.__resolveType(baseTypeSpec, null, /* sync: */true);

        // Extend the base type.
        var InstCtor = BaseInstCtor.extend({$type: typeSpec});

        // Register the new type in the specification context.
        if(temporaryId !== null) {
          specScope.specContext.add(InstCtor.type, temporaryId);
        }

        return InstCtor;
      }, this);
    },

    /**
     * Gets a promise for the completion of the loading of all type or instance dependencies
     * present in a given type reference.
     *
     * @param {pentaho.type.spec.UTypeReference} typeRef - The type reference.
     *
     * @return {!Promise} The promise for all dependencies.
     *
     * @private
     */
    __loadTypeDependenciesAsync: function(typeRef) {
      return __loadDependenciesAsync(this, typeRef, __eachTypeDependency);
    },
    // endregion

    // region Instance methods
    /** @inheritDoc */
    resolveInstance: function(instRef, instKeyArgs, baseType) {

      var InstCtor;
      var typeRef;

      // Find either a special $instance or a specific InstCtor or fail

      if(instRef && typeof instRef === "object" && instRef.constructor === Object) {

        // 1. A special instance
        if(instRef.$instance) {
          return this.__getInstanceSpecial(instRef.$instance, instKeyArgs, baseType, /* sync: */ true);
        }

        // 2. Type in inline type property {_: "type"}
        if((typeRef = instRef._)) {

          InstCtor = this.resolveType(typeRef);

          var type = InstCtor.type;
          if(baseType) baseType.__assertSubtype(type);

          if(type.isAbstract) { type.__throwAbstractType(); }
        }
      }

      // 3. Default the type from one of String, Number, or Boolean,
      //    if one of these is the type of `instRef` and baseType is respected.
      if(!InstCtor) {
        if(!baseType || baseType.isAbstract) {

          /* eslint default-case: 0 */
          switch(typeof instRef) {
            case "string": InstCtor = __String || (__String = this.resolveType("string")); break;
            case "number": InstCtor = __Number || (__Number = this.resolveType("number")); break;
            case "boolean": InstCtor = __Boolean || (__Boolean = this.resolveType("boolean")); break;
          }

          // Must still respect the base type.
          if(InstCtor && baseType && !InstCtor.type.isSubtypeOf(baseType)) {
            InstCtor = null;
          }

          if(!InstCtor) {
            if(baseType) {
              baseType.__throwAbstractType();
            } else {
              throw error.operInvalid("Cannot create instance of unspecified type.");
            }
          }

          // These types are never abstract
        } else {
          InstCtor = baseType.instance.constructor;
        }
      }

      // assert InstCtor

      return new InstCtor(instRef, instKeyArgs);
    },

    /**
     * Gets the instance denoted by a given instance resolve specification.
     *
     * @param {pentaho.type.spec.IInstanceResolve} specialSpec - An instance resolve specification.
     *
     * @param {Object} instKeyArgs - The key arguments to pass a list constructor,
     * when list instance is requested.
     *
     * @param {pentaho.type.spec.UTypeReference} typeDefault The default instance type,
     * for when neither {@link pentaho.type.spec.IInstanceResolve#id} or
     * {@link pentaho.type.spec.IInstanceResolve#type} are specified.
     *
     * @param {boolean} [sync=false] Whether to perform a synchronous get.
     *
     * @return {!Promise.<pentaho.type.Instance>|!pentaho.type.Instance} When sync,
     *   returns an instance; while, when async, returns a promise for it.
     *
     * @throws {pentaho.lang.OperationInvalidError} When the special "resolve instance by type" syntax is used
     * but it is not possible to determine the type to resolve against and `typeDefault` is not specified.
     *
     * @throws {pentaho.lang.OperationInvalidError} When the special "resolve instance by type" syntax is used
     * but the corresponding "element type" is an anonymous type.
     *
     * @private
     */
    __getInstanceSpecial: function(specialSpec, instKeyArgs, typeDefault, sync) {

      var value;

      if((value = specialSpec.id)) {
        // specialSpec: {id}

        // Always required.
        return sync ? localRequire(value) : promiseUtil.require(value, localRequire);
      }

      if((value = specialSpec.type || typeDefault)) {

        // specialSpec: {type, isRequired, filter}

        // (Async) Take care not to `Type.get` a type given as a string (or an array-wrapped one)
        // as these may not be loaded. Always calling Type.get does not do.
        // In the end, note that only identified element types are supported.

        var elemTypeId;
        var listType;
        var isList;

        // "elemTypeId"
        // ["elemTypeId"]
        // [elementTypeInstance]
        // elementTypeInstance
        // listTypeInstance
        if(typeof value === "string") {

          // TODO: FIXME: this is not necessarily true; it may be the id of a list type...

          isList = false;
          elemTypeId = value;
        } else if(Array.isArray(value)) {
          isList = true;
          value = value[0];
          if(typeof value === "string") {
            elemTypeId = value;
          } else {
            // better not be a list type...
            elemTypeId = this.resolveType(value).type.id;
          }
        } else {
          // Assume a typeRef of some kind
          var type = this.resolveType(value).type;
          if(type.isList) {
            isList = true;
            listType = type;
            elemTypeId = type.of.id;
          } else {
            isList = false;
            elemTypeId = type.id;
          }
        }

        if(!elemTypeId) {
          return promiseUtil.error(error.operInvalid("Cannot resolve instance for an anonymous type."), sync);
        }

        if(isList) {
          // Must load the list type, even if there are 0 results...

          var getListCtorSync = function() {
            return listType
                ? listType.instance.constructor
                : this.resolveType([elemTypeId]);
          };

          var createList = function(ListCtor, results) {
            return new ListCtor(results, instKeyArgs);
          };

          if(sync) {
            return createList(getListCtorSync.call(this), this.getInstancesOfType(elemTypeId, specialSpec));
          }

          return Promise.all([elemTypeId, this.getInstancesOfTypeAsync(elemTypeId, specialSpec)])
              .then(function(values) {
                return createList(getListCtorSync.call(this), values[1]);
              });
        }

        return sync
            ? this.getInstanceOfType(elemTypeId, specialSpec)
            : this.getInstanceOfTypeAsync(elemTypeId, specialSpec);
      }

      return promiseUtil.error(error.operInvalid("Cannot resolve instance for an unspecified type."), sync);
    },

    /**
     * Gets a promise for the completion of the loading of all type or instance dependencies
     * present in a given instance reference.
     *
     * @param {pentaho.type.spec.UInstance} instRef - An instance reference.
     *
     * @return {!Promise} The promise for all dependencies.
     *
     * @private
     */
    __loadInstanceDependenciesAsync: function(instRef) {
      return __loadDependenciesAsync(this, instRef, __eachInstanceDependency);
    },

    /** @inheritDoc */
    getInstanceOfType: function(baseTypeRef, keyArgs) {

      var baseTypeId = __getInstanceBaseTypeId(baseTypeRef);

      var instanceInfos = this.__getInstanceInfos(baseTypeId);
      if(instanceInfos) {
        var predicate = __buildGetInstancePredicate(keyArgs);

        var L = instanceInfos.length;
        var i = -1;
        while(++i < L) {
          var instance = localRequire(instanceInfos[i].id);
          if(predicate(instance)) {
            return instance;
          }
        }
      }

      if(O.getOwn(keyArgs, "isRequired")) {
        throw __createNoInstancesOfTypeError(baseTypeId);
      }

      return null;
    },

    /** @inheritDoc */
    getInstancesOfType: function(baseTypeRef, keyArgs) {

      var baseTypeId = __getInstanceBaseTypeId(baseTypeRef);

      var instanceInfos = this.__getInstanceInfos(baseTypeId);
      if(instanceInfos) {
        var predicate = __buildGetInstancePredicate(keyArgs);

        var instances = instanceInfos
            .map(function(info) {
              return localRequire(info.id);
            })
            .filter(predicate);

        if(instances.length) {
          return instances;
        }
      }

      if(O.getOwn(keyArgs, "isRequired")) {
        throw __createNoInstancesOfTypeError(baseTypeId);
      }

      return [];
    },

    /** @inheritDoc */
    resolveInstanceAsync: function(instSpec, instKeyArgs, baseType) {

      if(instSpec && typeof instSpec === "object") {

        // A special $instance form
        if(instSpec.constructor === Object && instSpec.$instance) {
          return this.__getInstanceSpecial(instSpec.$instance, instKeyArgs, baseType, /* sync: */ false);
        }

        // Follow the generic path of loading all found dependencies first and calling `resolveInstance` later.
        return this.__loadInstanceDependenciesAsync(instSpec).then(getSync.bind(this));
      }

      // Behave asynchronously as requested.
      return promiseUtil.wrapCall(getSync, this);

      function getSync() {
        return this.resolveInstance(instSpec, instKeyArgs, baseType);
      }
    },

    /** @inheritDoc */
    getInstanceOfTypeAsync: function(baseTypeId, keyArgs) {
      try {
        // Loads all instances of type and then filters.
        return this.__getInstancesOfTypeAsync(baseTypeId, keyArgs).then(function(instances) {
          return instances.length ? instances[0] : null;
        });
      } catch(ex) {
        return Promise.reject(ex);
      }
    },

    /** @inheritDoc */
    getInstancesOfTypeAsync: function(baseTypeId, keyArgs) {
      try {
        return this.__getInstancesOfTypeAsync(baseTypeId, keyArgs);
      } catch(ex) {
        return Promise.reject(ex);
      }
    },

    /**
     * Core method of `getInstanceOfTypeAsync` and `getInstancesOfTypeAsync`.
     *
     * 1. Gets the instance information of all instances of types which are subtypes
     * of the given base type.
     *
     * 2. Obtains all instance modules through AMD.
     *
     * 3. Filters out instance modules that failed loading and which do not
     *    satisfy the given `filter` function, if any.
     *
     * 4. Throws if keyArgs.isRequired and there are no results.
     *
     * Instances are returned sorted by ranking and then by registration order.
     *
     * @param {string|Class.<pentaho.type.Instance>|pentaho.type.Type} baseTypeRef - The identifier of the base type or
     * the instance constructor or type of an *identified* type.
     *
     * @param {Object} [keyArgs] - The keyword arguments.
     * @param {function(!pentaho.type.Instance) : boolean} [keyArgs.filter] - A predicate function that determines
     * whether an instance can be part of the result.
     * @param {boolean} [keyArgs.isRequired=false] - Indicates that an error should be thrown if there are no matching
     * results.
     *
     * @return {!Promise.<pentaho.type.Instance[]>} A promise for an array of matching instances, possibly empty.
     *
     * @throws {pentaho.lang.ArgumentInvalidError} When `baseTypeId` is an instance constructor or type object of
     * an anonymous type.
     *
     * @throws {pentaho.lang.OperationInvalidError} When there is no matching result and `keyArgs.isRequired` is `true`.
     *
     * @private
     */
    __getInstancesOfTypeAsync: function(baseTypeRef, keyArgs) {

      var baseTypeId = __getInstanceBaseTypeId(baseTypeRef);

      var promiseAll;
      var isRequired = O.getOwn(keyArgs, "isRequired");

      var instanceInfos = this.__getInstanceInfos(baseTypeId);
      if(instanceInfos) {
        var predicate = __buildGetInstancePredicate(keyArgs);

        promiseAll = Promise.all(instanceInfos.map(function(instanceInfo) {

          var promise = promiseUtil.require(instanceInfo.id, localRequire);

          // Convert failed instances to null.
          return promise["catch"](function() { return null; });
        }))
        .then(function(instances) {

          instances = instances.filter(predicate);

          if(isRequired && !instances.length) {
            return Promise.reject(__createNoInstancesOfTypeError(baseTypeId));
          }

          return instances;
        });

      } else if(isRequired) {
        promiseAll = Promise.reject(__createNoInstancesOfTypeError(baseTypeId));
      } else {
        promiseAll = Promise.resolve([]);
      }

      return promiseAll;
    },

    /**
     * Gets an array with instance information of all instances of types which are subtypes
     * of the given base type.
     *
     * Infos are already sorted by ranking and then registration order.
     *
     * The resulting array cannot be modified/made public.
     *
     * @param {string} baseTypeId - The identifier of the base type.
     *
     * @return {pentaho.type.impl.IInstanceInfo[]} An array of instance information instances, or `null` if none.
     *
     * @private
     */
    __getInstanceInfos: function(baseTypeId) {

      var instsByType = this.__instancesByType;

      // Also automatically converts aliases to full type ids
      var typeIds = typeInfo.getSubtypesOf(baseTypeId, {includeSelf: true, includeDescendants: true}) || [baseTypeId];
      var hasCloned = false;

      return typeIds.reduce(function(instanceInfos, typeId) {
        var instanceInfosOfType = O.getOwn(instsByType, typeId);
        if(instanceInfosOfType) {
          if(instanceInfos) {
            // Don't modify a list stored in __instancesByType.
            if(!hasCloned) {
              hasCloned = true;
              var infosClone = new SortedList({comparer: __instanceInformationComparer});
              infosClone.addMany(instanceInfos);
              instanceInfos = infosClone;
            }

            instanceInfos.addMany(instanceInfosOfType);
          } else {
            // Use same instance if possible.
            instanceInfos = instanceInfosOfType;
          }
        }

        return instanceInfos;
      }, null);
    }
    // endregion
  });

  return Loader;

  /**
   * Gets the instance constructor of the `Instance` type.
   *
   * This must be obtained lazily, to break the cyclic dependency.
   * The `Loader` must be used from a context where `Instance` has been loaded.
   *
   * @memberOf pentaho.type.impl.Loader~
   *
   * @return {!Class.<pentaho.type.Instance>} The instance constructor.
   *
   * @private
   */
  function __getInstanceClass() {
    return __Instance || (__Instance = localRequire(INSTANCE_TYPE));
  }

  // region Type support
  /**
   * Registers a Type API type with the Type Information API.
   *
   * The type is registered with a base type which is its closest
   * ancestor type which is identified.
   * If the base type is not registered, the function is then called on it, recursively.
   *
   * @memberOf pentaho.type.impl.Loader~
   *
   * @param {!pentaho.type.Type} type - The type to register.
   *
   * @private
   */
  function __registerTypeWithTypeInfoApi(type) {

    var id = type.id;

    if(typeInfo.getIdOf(id) === undefined) {

      // Find first base with an id.
      var baseType = type.ancestor;
      while(baseType !== null && !baseType.id) {
        baseType = baseType.ancestor;
      }

      if(baseType !== null) {
        __registerTypeWithTypeInfoApi(baseType);

        typeInfo.declare(id, {base: baseType.id});
      }
    }
  }

  /**
   * Builds a function which filters type results for the getSubtypesOf* methods.
   *
   * @memberOf pentaho.type.impl.Loader~
   *
   * @param {Object} [keyArgs] - The keyword arguments.
   * @param {?boolean} [keyArgs.isBrowsable] - The desired `isBrowsable` value.
   * @param {?boolean} [keyArgs.isAbstract] - The desired `isAbstract` value.
   *
   * @return {?(function(!pentaho.type.Type) : boolean)} A function that returns `true` if the type is selected
   * and returns `false`, otherwise; or `null`, if no keyword arguments were specified.
   *
   * @private
   */
  function __buildGetSubtypesOfPredicate(keyArgs) {
    var filterSpec = null;
    if(keyArgs) {
      filterSpec = {};
      if(keyArgs.isBrowsable != null) { filterSpec.isBrowsable = keyArgs.isBrowsable; }
      if(keyArgs.isAbstract != null) { filterSpec.isAbstract = keyArgs.isAbstract; }
    }

    return F.predicate(filterSpec);
  }
  // endregion

  // region Instance support
  /**
   * Gets the identifier of an instance's base type, given a particular type of reference to it.
   *
   * @memberOf pentaho.type.impl.Loader~
   *
   * @param {string|Class.<pentaho.type.Instance>|pentaho.type.Type} baseTypeRef - The identifier of the base type or
   * the instance constructor or type of an *identified* type.
   *
   * @return {string} The identifier of the given type.
   *
   * @throws {pentaho.lang.ArgumentRequiredError} When `baseTypeRef` is an empty string or {@link Nully}.
   * @throws {pentaho.lang.ArgumentInvalidTypeError} When `baseTypeRef` is not a string,
   * an `Instance` constructor or `Type` instance.
   * @throws {pentaho.lang.ArgumentInvalidError} When `baseTypeRef` resolves to an anonymous type.
   *
   * @private
   */
  function __getInstanceBaseTypeId(baseTypeRef) {

    if(!baseTypeRef) throw error.argRequired("baseTypeRef");

    switch(typeof baseTypeRef) {
      case "string":
        return baseTypeRef;

      case "function":
        if(baseTypeRef.prototype instanceof __getInstanceClass()) {
          return __validateInstanceBaseTypeId(baseTypeRef.type.id);
        }
        break;

      case "object":
        if(baseTypeRef instanceof __getInstanceClass().Type) {
          return __validateInstanceBaseTypeId(baseTypeRef.id);
        }
        break;
    }

    throw error.argInvalidType(
        "baseTypeRef",
        ["string", "Class<pentaho.type.Instance>", "pentaho.type.Type"],
        typeof baseTypeRef);
  }

  /**
   * Validates the the given base type identifier is not `Nully`.
   *
   * @memberOf pentaho.type.impl.Loader~
   *
   * @param {?string} baseTypeId - A base type identifier.
   *
   * @return {string} The given identifier.
   *
   * @throws {pentaho.lang.ArgumentRequiredError} When `baseTypeId` is an empty string or {@link Nully}.
   *
   * @private
   */
  function __validateInstanceBaseTypeId(baseTypeId) {
    if(!baseTypeId) throw error.argInvalid("baseTypeRef", "Type is anonymous.");
    return baseTypeId;
  }

  /**
   * Creates an error for when there are no instances of a given type.
   *
   * @memberOf pentaho.type.impl.Loader~
   *
   * @param {string} baseTypeId - The type identifier.
   *
   * @return {!pentaho.lang.OperationInvalidError} The error instance.
   *
   * @private
   */
  function __createNoInstancesOfTypeError(baseTypeId) {
    return error.operInvalid("There is no defined matching instance of type '" + baseTypeId + "'.");
  }

  /**
   * Builds a function which filters instance results.
   *
   * @memberOf pentaho.type.impl.Loader~
   *
   * @param {Object} [keyArgs] - The keyword arguments.
   * @param {function(!pentaho.type.Instance) : boolean} [keyArgs.filter] - A predicate function that determines
   * whether an instance can be the result.
   *
   * @return {function(!pentaho.type.Instance) : boolean} A function that returns `true` if the instance is selected
   * and returns `false`, otherwise.
   *
   * @private
   */
  function __buildGetInstancePredicate(keyArgs) {

    var filter = O.getOwn(keyArgs, "filter");

    return function(instance) {
      return !!instance && (!filter || filter(instance));
    };
  }
  // endregion

  // region Ref Dependencies
  /**
   * Loads the dependencies of a given type or instance reference,
   * using a given dependency enumerator method.
   *
   * Helper method of `__loadInstanceDependenciesAsync` and `__loadTypeDependenciesAsync`.
   *
   * @memberOf pentaho.type.impl.Loader~
   *
   * @param {!pentaho.type.ILoader} loader - The loader.
   * @param {pentaho.type.spec.UTypeReference|pentaho.type.spec.UInstanceReference} reference -
   * The type or instance reference.
   * @param {function} eachMethod - One of `__eachTypeDependency` or `__eachInstanceDependency`.
   *
   * @return {!Promise} A promise that gets resolved when all dependencies have been loaded.
   *
   * @private
   */
  function __loadDependenciesAsync(loader, reference, eachMethod) {

    var depPromises = [];
    var depIdsSet = Object.create(null);

    eachMethod(reference, collectDependency);

    return Promise.all(depPromises).then(function() { return null; });

    function collectDependency(isTypeDep, depRef) {
      if(isTypeDep) {
        // Assume type id string
        if(!O.hasOwn(depIdsSet, depRef)) {
          depIdsSet[depRef] = 1;
          depPromises.push(loader.resolveTypeAsync(depRef));
        }
      } else {
        // Assume special instance spec.
        depPromises.push(loader.resolveInstanceAsync(depRef));
      }
    }
  }

  /**
   * Calls `depFun` for each dependency of `typeRef`.
   *
   * @memberOf pentaho.type.impl.Loader#
   *
   * @param {pentaho.type.spec.UTypeReference} typeRef - A type reference.
   *
   * @param {function(isTypeDep: boolean, depSpec: any)} depFun - A function that
   * is called for each dependency with two arguments,
   * a boolean that indicates if the dependency is a type or an instance,
   * and the type or instance specification.
   *
   * @private
   */
  function __eachTypeDependency(typeRef, depFun) {
    if(!typeRef) return;

    /* eslint default-case: 0 */
    switch(typeof typeRef) {
      case "string":
        if(SpecificationContext.isIdTemporary(typeRef)) return;

        // A standard type that is surely loaded?
        if(O.hasOwn(this.__byTypeId, typeRef)) return;

        depFun(typeRef);
        return;

      case "object":
        if(Array.isArray(typeRef)) {
          // Shorthand list type notation
          // Example: [{props: { ...}}]
          if(typeRef.length) {
            __eachTypeDependency(typeRef[0], depFun);
          }
          return;
        }

        if(typeRef.constructor === Object) {
          __eachTypeDependencyGeneric(typeRef, depFun);
        }
        return;
    }
  }

  /**
   * Calls `depFun` for each dependency of a generic object specification of a type, `typeSpec`.
   *
   * @memberOf pentaho.type.impl.Loader#
   *
   * @param {pentaho.type.spec.ITypeProto} typeSpec - A generic object type specification.
   *
   * @param {function(isTypeDep: boolean, depSpec: any)} depFun - A function that
   * is called for each dependency with two arguments,
   * a boolean that indicates if the dependency is a type or an instance,
   * and the type or instance specification.
   *
   * @private
   */
  function __eachTypeDependencyGeneric(typeSpec, depFun) {
    // TODO: this method only supports deserialization of standard types.
    //   Custom types with own type attributes would need special handling.
    //   Something like a two phase protocol?

    // {[base: "complex", ] [of: "..."] , [props: []]}
    __eachTypeDependency(typeSpec.base, depFun);

    __eachTypeDependency(typeSpec.of, depFun);

    var props = typeSpec.props;
    if(props) {
      if(Array.isArray(props)) {
        props.forEach(function(propSpec) {
          if(propSpec) {
            __eachInstanceDependency(propSpec.defaultValue, depFun);

            __eachTypeDependency(propSpec.valueType, depFun);
            __eachTypeDependency(propSpec.base, depFun);
          }
        });
      } else {
        Object.keys(props).forEach(function(propName) {
          var propSpec = props[propName];
          if(propSpec) {
            __eachInstanceDependency(propSpec.defaultValue, depFun);

            __eachTypeDependency(propSpec.valueType, depFun);
            __eachTypeDependency(propSpec.base, depFun);
          }
        });
      }
    }

    // These are either ids of AMD modules of type mixins or, directly, type mixins.
    var mixins = typeSpec.mixins;
    if(mixins) {
      if(!(Array.isArray(mixins))) {
        mixins = [mixins];
      }

      mixins.forEach(function(mixinIdOrClass) {
        if(typeof mixinIdOrClass === "string") {
          __eachTypeDependency(mixinIdOrClass, depFun);
        }
      });
    }
  }

  /**
   * Calls `depFun` for each dependency of `instRef`.
   *
   * @memberOf pentaho.type.impl.Loader#
   *
   * @param {pentaho.type.spec.UInstanceReference} instRef - An instance reference.
   *
   * @param {function(isTypeDep: boolean, depSpec: any)} depFun - A function that
   * is called for each dependency with two arguments,
   * a boolean that indicates if the dependency is a type or an instance,
   * and the type or instance specification.
   *
   * @private
   */
  function __eachInstanceDependency(instRef, depFun) {

    if(instRef && typeof instRef === "object") {

      if(Array.isArray(instRef)) {
        instRef.forEach(function(elemRef) {
          __eachInstanceDependency(elemRef, depFun);
        }, this);
      } else if(instRef.constructor === Object) {
        if(instRef.$instance) {
          depFun(instRef);
        } else {
          // A generic object instance specification.
          Object.keys(instRef).forEach(function(name) {
            // Inline type.
            if(name === "_") {
              __eachTypeDependency(instRef[name], depFun);
            } else {
              __eachInstanceDependency(instRef[name], depFun);
            }
          });
        }
      }
    }
  }
  // endregion

  /**
   * Compares two instance information objects.
   *
   * Orders by descending ranking and then by ascending registration index.
   *
   * @memberOf pentaho.type.impl.Loader#
   *
   * @param {!pentaho.type.impl.IInstanceInfo} infoA - The first instance information.
   * @param {!pentaho.type.impl.IInstanceInfo} infoB - The second instance information.
   *
   * @return {number} The numbers `-1`, `0`, or `1`.
   *
   * @private
   */
  function __instanceInformationComparer(infoA, infoB) {
    return F.compare(infoB.ranking, infoA.ranking) || F.compare(infoA.index, infoB.index);
  }
});
