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
], function(localRequire, module, Base, SpecificationScope, SpecificationContext, typeUtil,
            typeInfo, instanceInfo, SortedList, O, F, promiseUtil, error) {

  "use strict";

  /* eslint dot-notation: 0 */

  var DEFAULT_BASE_TYPE = "pentaho/type/Complex";
  var INSTANCE_TYPE = "pentaho/type/Instance";

  var O_hasOwn = Object.prototype.hasOwnProperty;

  var __nextInstanceIndex = 1;

  var __Instance = null;
  var __String = null;
  var __Number = null;
  var __Boolean = null;

  var Loader = Base.extend(module.id, /** @lends pentaho.type.impl.Loader# */ {
    // region Initialization
    constructor: function(config) {
      /**
       * Map of instance infos by instance identifier.
       *
       * @type {!Object.<string, InstanceInfo>}
       * @private
       * @readOnly
       */
      this.__instanceById = Object.create(null);

      /**
       * Map from type id to a list of instance infos.
       *
       * @type {!Object.<string, Array.<InstanceInfo>>}
       * @private
       * @readonly
       */
      this.__instancesByType = Object.create(null);

      this.__importKnownInstances(config);
    },

    __importKnownInstances: function(config) {
      // We need to know the type of the instances.
      // So only those registered with instanceInfo are recognized and searched for in config.
      var instanceIds = instanceInfo.getAllByType(INSTANCE_TYPE, {includeDescendants: true});
      if(instanceIds) {
        instanceIds.forEach(function(instanceId) {
          var typeId = instanceInfo.getTypeOf(instanceId);
          var instanceDecl = O.getOwn(config, instanceId);

          this.__importKnownInstance(instanceId, typeId, instanceDecl);
        }, this);
      }
    },

    __importKnownInstance: function(id, typeId, instanceDecl) {

      if(O.getOwn(this.__instanceById, id))
        throw error.argInvalid("id", "An instance with identifier '" + id + "' is already defined.");

      var info = {
        id: id,
        index: __nextInstanceIndex++,
        typeId: typeInfo.getIdOf(typeId) || typeId,
        ranking: (instanceDecl && +instanceDecl.ranking) || 0
      };

      this.__instanceById[info.id] = info;

      var infos = (this.__instancesByType[info.typeId] ||
          (this.__instancesByType[info.typeId] = new SortedList({comparer: __infoComparer})));

      infos.push(info);
    },
    // endregion

    // region Type methods
    /**
     * Registers a type dynamically, given its instance constructor.
     *
     * The type is dynamically
     * registered with the [type info service]{@link pentaho.typeInfo.service} and
     * defined as an AMD module.
     *
     * Optionally, any existing configuration can be applied to the type.
     *
     * A type registered this way can be later resolved. The first resolution can be synchronous.
     *
     * @param {!Class.<pentaho.type.Instance>} InstCtor - The instance constructor of the type.
     * @param {Object} [keyArgs] - The keyword arguments.
     * @param {boolean} [keyArgs.configure=false] - Indicates that any existing configuration
     * should be applied to the type.
     *
     * @return {!Promise.<Class.<pentaho.type.Instance>>} A promise for the given instance constructor.
     */
    registerTypeAsync: function(InstCtor, keyArgs) {

      var id = InstCtor.type.id;

      // 1. Register in type info.
      __registerTypeInTypeInfo(InstCtor.type);

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

    /**
     * Resolves a type reference and returns its instance constructor.
     *
     * For more information on the `typeRef` argument,
     * see [UTypeReference]{@link pentaho.type.spec.UTypeReference}.
     *
     * If it is not known whether all types that are referenced by identifier have already been loaded,
     * the asynchronous method version, [getAsync]{@link pentaho.type.Type.getAsync},
     * should be used instead.
     *
     * @see pentaho.type.Type.getAsync
     *
     * @param {!pentaho.type.spec.UTypeReference} typeRef - A type reference.
     * @param {Object} [keyArgs] The keyword arguments.
     * @param {pentaho.type.spec.UTypeReference} [keyArgs.defaultBase] The default base type
     * of `typeRef` when it is an immediate generic object specification.
     *
     * @return {!Class.<pentaho.type.Instance>} The instance constructor.
     *
     * @throws {pentaho.lang.ArgumentRequiredError} When `typeRef` is an empty string or {@link Nully}.
     *
     * @throws {pentaho.lang.ArgumentInvalidError} When `typeRef` is of an unsupported JavaScript type:
     * not a string, function, array or object.
     *
     * @throws {pentaho.lang.ArgumentInvalidError} When `typeRef` is a type constructor
     * (e.g. [Type]{@link pentaho.type.Type})
     *
     * @throws {pentaho.lang.ArgumentInvalidError} When `typeRef` is an instance.
     *
     * @throws {Error} When the identifier of a type is not defined as a module in the AMD module system
     * (specified directly in `typeRef`, or present in an generic type specification).
     *
     * @throws {Error} When an identifier is of a module that the AMD module system
     * has not loaded yet (specified directly in `typeRef`, or present in an generic type specification).
     *
     * @throws {pentaho.lang.ArgumentInvalidError} When `typeRef` is, or contains, an array-shorthand,
     * list type specification that has more than one child element type specification.
     */
    resolveType: function(typeRef, keyArgs) {
      return this.__resolveType(typeRef, O.getOwn(keyArgs, "defaultBase"), true);
    },

    /**
     * Resolves a type reference, asynchronously, and returns a promise that
     * resolves to type's instance constructor.
     *
     * For more information on the `typeRef` argument,
     * see [UTypeReference]{@link pentaho.type.spec.UTypeReference}.
     *
     * This method can be used even if a generic type specification references types
     * whose modules have not yet been loaded by the AMD module system.
     *
     * @see pentaho.type.ILoader#resolveType
     *
     * @example
     * <caption>
     *   Getting an instance constructor, <b>asynchronously</b>.
     * </caption>
     *
     * require(["pentaho/type/loader"], function(loader) {
     *
     *   loader.getAsync("my/viz/chord").then(function(VizChordModel) {
     *
     *     var model = new VizChordModel({outerRadius: 200});
     *
     *     // ...
     *   });
     * });
     *
     * @param {!pentaho.type.spec.UTypeReference} typeRef - A type reference.
     * @param {Object} [keyArgs] The keyword arguments.
     * @param {pentaho.type.spec.UTypeReference} [keyArgs.defaultBase] The default base type
     * of `typeRef` when it is an immediate generic object specification.
     *
     * @return {!Promise.<!Class.<pentaho.type.Instance>>} A promise for the instance constructor.
     *
     * @rejects {pentaho.lang.ArgumentRequiredError} When `typeRef` is an empty string or {@link Nully}.
     *
     * @rejects {pentaho.lang.ArgumentInvalidError} When `typeRef` is of an unsupported JavaScript type:
     * not a string, function, array or object.
     *
     * @rejects {pentaho.lang.ArgumentInvalidError} When `typeRef` is a type constructor
     * (e.g. [Type]{@link pentaho.type.Type})
     *
     * @rejects {pentaho.lang.ArgumentInvalidError} When `typeRef` is an instance.
     *
     * @rejects {Error} When the identifier of a type is not defined as a module in the AMD module system
     * (specified directly in `typeRef`, or present in an generic type specification).
     *
     * @rejects {pentaho.lang.OperationInvalidError} When the value returned by a factory function is not
     * an instance constructor of a subtype of `Instance`
     * (specified directly in `typeRef`, or obtained indirectly by loading a type's module given its identifier).
     *
     * @rejects {pentaho.lang.ArgumentInvalidError} When `typeRef` is, or contains, a list type specification
     * with an invalid structure.
     *
     * @rejects {Error} When any other unexpected error occurs.
     */
    resolveTypeAsync: function(typeRef, keyArgs) {
      try {
        return this.__resolveType(typeRef, O.getOwn(keyArgs, "defaultBase"), false);
      } catch(ex) {
        /* istanbul ignore next : really hard to test safeguard */
        return Promise.reject(ex);
      }
    },

    /**
     * Gets the instance constructors of all of the types which are known to be subtypes of a given base type.
     *
     * This method is a synchronous version of {@link pentaho.type.ILoader#getSubtypesOfAsync}
     *
     * If it is not known whether all known subtypes of `baseTypeId` have already been loaded,
     * the asynchronous method version, `getSubtypesOfAsync`,
     * should be used instead.
     *
     * @example
     * <caption>
     *   Getting all browsable subtypes of <code>"my/component"</code>.
     * </caption>
     *
     * require(["pentaho/type/loader"], function(loader) {
     *
     *   var ComponentModels = loader.getSubtypesOf("my/component", {isBrowsable: true});
     *
     *   ComponentModels.forEach(function(ComponentModel) {
     *     console.log("Will display menu entry for: " + ComponentModel.type.label);
     *   });
     * });
     *
     * @param {string} baseTypeId - The identifier of the base type.
     * @param {object} [keyArgs] Keyword arguments.
     * @param {?boolean} [keyArgs.isBrowsable=null] - Indicates that only types with the specified
     *   [isBrowsable]{@link pentaho.type.Value.Type#isBrowsable} value are returned.
     * @param {?boolean} [keyArgs.isAbstract=null] - Indicates that only types with the specified
     *   [isAbstract]{@link pentaho.type.Value.Type#isAbstract} value are returned.
     *
     * @return {!Array.<Class.<pentaho.type.Value>>} An array of instance constructors.
     *
     * @throws {Error} When the identifier of a type is not defined as a module in the AMD module system.
     * @throws {Error} When the identifier of a **non-standard type** is from a module that the AMD module system
     * has not loaded yet.
     *
     * @see pentaho.type.ILoader#getSubtypesOfAsync
     * @see pentaho.type.ILoader#resolveType
     * @see pentaho.type.ILoader#resolveTypeAsync
     */
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

    /**
     * Gets a promise for the instance constructors of
     * all of the types which are known to be subtypes of a given base type.
     *
     * Any errors that occur result in a rejected promise.
     *
     * @example
     * <caption>
     *   Getting all browsable subtypes of <code>"my/component"</code>.
     * </caption>
     *
     * require(["pentaho/type/loader"], function(loader) {
     *
     *   loader.getSubtypesOfAsync("my/component", {isBrowsable: true})
     *     .then(function(ComponentModels) {
     *       ComponentModels.forEach(function(ComponentModel) {
     *         console.log("Will display menu entry for: " + ComponentModel.type.label);
     *       });
     *     });
     * });
     *
     * @param {string} baseTypeId - The identifier of the base type.
     * @param {object} [keyArgs] Keyword arguments.
     * @param {?boolean} [keyArgs.isBrowsable=null] - Indicates that only types with the specified
     *   [isBrowsable]{@link pentaho.type.Value.Type#isBrowsable} value are returned.
     * @param {?boolean} [keyArgs.isAbstract=null] - Indicates that only types with the specified
     *   [isAbstract]{@link pentaho.type.Value.Type#isAbstract} value are returned.
     *
     * @return {Promise.<Array.<Class.<pentaho.type.Instance>>>} A promise for an array of instance constructors.
     *
     * @see pentaho.type.ILoader#resolveType
     * @see pentaho.type.ILoader#resolveTypeAsync
     */
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

    /*
     * Example: a list of complex type elements
     *
     *  [{props: { ...}}]
     *  <=>
     *  {base: "list", of: {props: { ...}}}
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

    __resolveTypeByObject: function(typeSpec, defaultBase, sync) {

      if(typeSpec.constructor !== Object) {

        var Instance = __getInstanceClass();

        // An instance of Type ?
        if(typeSpec instanceof Instance.Type) {
          return promiseUtil["return"](typeSpec.instance.constructor, sync);
        }

        if(typeSpec instanceof Instance) {
          return promiseUtil.error(
              error.argInvalid("typeRef", "Instances are not supported as type references."), sync);
        }

        return promiseUtil.error(
            error.argInvalid("typeRef", "Object is not a 'pentaho.type.Type' instance or a plain object."), sync);
      }

      return this.__resolveTypeByObjectSpec(typeSpec, defaultBase, sync);
    },

    // Inline type spec: {[base: "complex"], [id: "_:1"]}
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
      return this.__getTypeSpecDependenciesAsync(typeSpec).then(function() {
        return this.__createTypeByObjectSpec(temporaryId, typeSpec, defaultBase);
      }.bind(this));
    },

    // Creates a type once its dependencies have been resolved.
    // Note the switch to sync mode here, whatever the outer `sync` value.
    // Only the outermost __resolveTypeByObjectSpec call may be async.
    // All following "reentries" will be sync.
    // So, it works to use the above introduced ambient specification context to
    // handle all contained temporary ids.
    __createTypeByObjectSpec: function(temporaryId, typeSpec, defaultBase) {

      // A root generic type spec initiates a specification context.
      // Each root generic type spec has a separate specification context.
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

    __getTypeSpecDependenciesAsync: function(typeSpec) {
      return __getSpecDependenciesAsync(this, typeSpec, __eachTypeSpecDependencies);
    },
    // endregion

    // region getInstance* methods
    /**
     * Resolves an instance reference.
     *
     * This method can be used for:
     *
     * * creating a new instance - when given an [instance specification]{@link pentaho.type.spec.UInstance}
     * * resolving instances from the instances' container -
     *   when given a [resolve instance specification]{@link pentaho.type.spec.IInstanceResolve}.
     *
     * @param {pentaho.type.spec.UInstanceReference} [instRef] - An instance reference.
     *
     * @param {Object} [instKeyArgs] - The keyword arguments passed to the instance constructor, when one is created.
     * @param {pentaho.type.Type} [typeBase] - The base type of which returned instances must be an instance and,
     * also, the default type used when type information is not available in `instRef`.
     *
     * @return {pentaho.type.Instance} An instance, or `null`
     *
     * @throws {pentaho.lang.OperationInvalidError} When it is not possible to determine the type of instance to create
     * based on `instRef` and `baseType` is not specified.
     *
     * @throws {pentaho.lang.OperationInvalidError} When an instance should be created but its determined type
     * is [abstract]{@link pentaho.type.Value.Type#isAbstract}.
     *
     * @throws {pentaho.lang.OperationInvalidError} When the special "resolve instance by type" syntax is used
     * but it is not possible to determine the type to resolve against and `baseType` is not specified.
     *
     * @throws {pentaho.lang.OperationInvalidError} When the special "resolve instance by type" syntax is used
     * but the corresponding "element type" is an anonymous type.
     *
     * @throws {pentaho.lang.OperationInvalidError} When the type of the resolved value is not a subtype of `typeBase`.
     *
     * @throws {Error} Other errors, as documented in:
     * [Type.get]{@link pentaho.type.Type.get},
     * [getById]{@link pentaho.type.Instance.getById} and
     * [getByType]{@link pentaho.type.Instance.getByType}.
     *
     * @see pentaho.type.Instance.getAsync
     * @see pentaho.type.Type#create
     */
    resolveInstance: function(instRef, instKeyArgs, typeBase) {

      var InstCtor;
      var typeRef;

      // Find either a special $instance or a specific InstCtor or fail

      if(instRef && typeof instRef === "object" && instRef.constructor === Object) {

        // 1. A special instance
        if(instRef.$instance) {
          return this.__getInstanceSpecial(instRef.$instance, instKeyArgs, typeBase, /* sync: */ true);
        }

        // 2. Type in inline type property {_: "type"}
        if((typeRef = instRef._)) {

          InstCtor = this.resolveType(typeRef);

          var type = InstCtor.type;
          if(typeBase) typeBase.__assertSubtype(type);

          if(type.isAbstract) { type.__throwAbstractType(); }
        }
      }

      // 3. Default the type from one of String, Number, or Boolean,
      //    if one of these is the type of `instRef` and typeBase is respected.
      if(!InstCtor) {
        if(!typeBase || typeBase.isAbstract) {

          /* eslint default-case: 0 */
          switch(typeof instRef) {
            case "string": InstCtor = __String || (__String = this.resolveType("string")); break;
            case "number": InstCtor = __Number || (__Number = this.resolveType("number")); break;
            case "boolean": InstCtor = __Boolean || (__Boolean = this.resolveType("boolean")); break;
          }

          // Must still respect the base type.
          if(InstCtor && typeBase && !InstCtor.type.isSubtypeOf(typeBase)) {
            InstCtor = null;
          }

          if(!InstCtor) {
            if(typeBase) {
              typeBase.__throwAbstractType();
            } else {
              throw error.operInvalid("Cannot create instance of unspecified type.");
            }
          }

          // These types are never abstract
        } else {
          InstCtor = typeBase.instance.constructor;
        }
      }

      // assert InstCtor

      return new InstCtor(instRef, instKeyArgs);
    },

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

    __getInstanceSpecDependenciesAsync: function(instSpec) {
      return __getSpecDependenciesAsync(this, instSpec, __eachInstanceSpecDependencies);
    },

    /**
     * Gets the highest ranking instance among the instances of the given type which are successfully loaded and
     * that, optionally, match a specified filter.
     *
     * @param {string|Class.<pentaho.type.Instance>|pentaho.type.Type} baseTypeId - The identifier of the base type or
     * the instance constructor or type of an identified type.
     * @param {Object} [keyArgs] - The keyword arguments.
     * @param {function(!pentaho.type.Instance) : boolean} [keyArgs.filter] - A predicate function that determines
     * whether an instance can be the result.
     * @param {boolean} [keyArgs.isRequired=false] - Indicates that an error should be thrown if there is no matching
     * result.
     *
     * @return {pentaho.type.Instance} A matching loaded instance, or `null`.
     *
     * @throws {pentaho.lang.ArgumentInvalidError} When `baseTypeId` is an instance constructor or type object of
     * an anonymous type.
     * @throws {pentaho.lang.OperationInvalidError} When `keyArgs.isRequired` is `true` and there is no matching result.
     */
    getInstanceOfType: function(baseTypeId, keyArgs) {

      baseTypeId = __processInstanceType(baseTypeId);

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

    /**
     * Gets all of the instances of the given type that, optionally, match a specified filter.
     *
     * @param {string|Class.<pentaho.type.Instance>|pentaho.type.Type} baseTypeId - The identifier of the base type or
     * the instance constructor or type of an identified type.
     *
     * @param {Object} [keyArgs] - The keyword arguments.
     * @param {function(!pentaho.type.Instance) : boolean} [keyArgs.filter] - A predicate function that determines
     * whether an instance can be part of the result.
     * @param {boolean} [keyArgs.isRequired=false] - Indicates that an error should be thrown if there are no matching
     * results.
     *
     * @return {!Array.<!pentaho.type.Instance>} An array of matching instances, possibly empty.
     *
     * @throws {pentaho.lang.ArgumentInvalidError} When `baseTypeId` is an instance constructor or type object of
     * an anonymous type.
     * @throws {pentaho.lang.OperationInvalidError} When there is no matching result and `keyArgs.isRequired` is `true`.
     */
    getInstancesOfType: function(baseTypeId, keyArgs) {

      baseTypeId = __processInstanceType(baseTypeId);

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

    /**
     * Resolves an instance reference, asynchronously.
     *
     * This method can be used for:
     *
     * * creating a new instance - when given an [instance specification]{@link pentaho.type.spec.UInstance}
     * * resolving instances by identifier or by type -
     *   when given a [resolve instance specification]{@link pentaho.type.spec.IInstanceResolve}.
     *
     * @param {pentaho.type.spec.UInstanceReference} [instSpec] - An instance reference.
     *
     * @param {Object} [instKeyArgs] - The keyword arguments passed to the instance constructor, when one is created.
     * @param {pentaho.type.Type} [typeBase] - The base type of which returned instances must be an instance and,
     * also, the default type used when type information is not available in `instSpec`.
     *
     * @return {!Promise.<pentaho.type.Instance>} A promise to an instance.
     *
     * @rejects {pentaho.lang.OperationInvalidError} When it is not possible to determine the type of instance to create
     * based on `instSpec` and `baseType` is not specified.
     *
     * @rejects {pentaho.lang.OperationInvalidError} When an instance should be created but its determined type
     * is [abstract]{@link pentaho.type.Value.Type#isAbstract}.
     *
     * @rejects {pentaho.lang.OperationInvalidError} When the special "resolve instance by type" syntax is used
     * but it is not possible to determine the type to resolve against and `baseType` is not specified.
     *
     * @rejects {pentaho.lang.OperationInvalidError} When the special "resolve instance by type" syntax is used
     * but the corresponding "element type" is an anonymous type.
     *
     * @rejects {pentaho.lang.OperationInvalidError} When the type of the resolved value is not a subtype of `typeBase`.
     *
     * @rejects {Error} Other errors, as documented in:
     * [ILoader#resolveType]{@link pentaho.type.ILoader#resolveType},
     * [ILoader#getDependencyAsync]{@link pentaho.type.ILoader#getDependencyAsync} and
     * [ILoader#getInstanceByTypeAsync]{@link pentaho.type.ILoader#.getInstanceByTypeAsync}.
     *
     * @see pentaho.type.Type#createAsync
     */
    resolveInstanceAsync: function(instSpec, instKeyArgs, typeBase) {

      if(instSpec && typeof instSpec === "object") {

        // A special $instance form
        if(instSpec.constructor === Object && instSpec.$instance) {
          return this.__getInstanceSpecial(instSpec.$instance, instKeyArgs, typeBase, /* sync: */ false);
        }

        // Follow the generic path of loading all found dependencies first and calling `resolveInstance` later.
        return this.__getInstanceSpecDependenciesAsync(instSpec).then(getSync.bind(this));
      }

      // Behave asynchronously as requested.
      return promiseUtil.wrapCall(getSync, this);

      function getSync() {
        return this.resolveInstance(instSpec, instKeyArgs, typeBase);
      }
    },

    /**
     * Gets a promise for the first instance of the given type and that, optionally, matches a specified filter.
     *
     * @param {string|Class.<pentaho.type.Instance>|pentaho.type.Type} baseTypeId - The identifier of the base type or
     * the instance constructor or type of an identified type.
     *
     * @param {Object} [keyArgs] - The keyword arguments.
     * @param {function(!pentaho.type.Instance) : boolean} [keyArgs.filter] - A predicate function that determines
     * whether an instance can be the result.
     * @param {boolean} [keyArgs.isRequired=false] - Indicates that the promise should be rejected
     * if there is no matching result.
     *
     * @return {!Promise.<pentaho.type.Instance>} A promise for: a matching instance or `null`.
     *
     * @rejects {pentaho.lang.ArgumentRequiredError} When `baseTypeId` is an empty string or {@link Nully}.
     * @rejects {pentaho.lang.ArgumentInvalidError} When `baseTypeId` is an instance constructor or type object of
     * an anonymous type.
     * @rejects {pentaho.lang.OperationInvalidError} When `keyArgs.isRequired` is `true` and
     * there is no matching result.
     */
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

    /**
     * Gets a promise for all of the instances of the given type and that, optionally, match a specified filter.
     *
     * @param {string|Class.<pentaho.type.Instance>|pentaho.type.Type} baseTypeId - The identifier of the base type or
     * the instance constructor or type of an identified type.
     *
     * @param {Object} [keyArgs] - The keyword arguments.
     * @param {function(!pentaho.type.Instance) : boolean} [keyArgs.filter] - A predicate function that determines
     * whether an instance can be part of the result.
     * @param {boolean} [keyArgs.isRequired=false] - Indicates that the promise should be rejected
     * if there is no matching result.
     *
     * @return {!Promise.<Array.<!pentaho.type.Instance>>} A promise for an array of matching instances, possibly empty.
     *
     * @rejects {pentaho.lang.ArgumentRequiredError} When `baseTypeId` is an empty string or {@link Nully}.
     * @rejects {pentaho.lang.ArgumentInvalidError} When `baseTypeId` is an instance constructor or type object of
     * an anonymous type.
     * @rejects {pentaho.lang.OperationInvalidError} When `keyArgs.isRequired` is `true` and
     * there are no matching results.
     */
    getInstancesOfTypeAsync: function(baseTypeId, keyArgs) {
      try {
        return this.__getInstancesOfTypeAsync(baseTypeId, keyArgs);
      } catch(ex) {
        return Promise.reject(ex);
      }
    },

    __getInstancesOfTypeAsync: function(baseTypeId, keyArgs) {

      baseTypeId = __processInstanceType(baseTypeId);

      var promiseAll;
      var isRequired = O.getOwn(keyArgs, "isRequired");

      var instanceInfos = this.__getInstanceInfos(baseTypeId);
      if(instanceInfos) {
        var predicate = __buildGetInstancePredicate(keyArgs);

        promiseAll = Promise.all(instanceInfos.map(function(instanceInfo) {

          var promise = promiseUtil.require(instanceInfo.id, localRequire);

          // Convert failed instances to null
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

    // Infos are already sorted by ranking.
    // It is assumed that the resulting array cannot be modified/made public.
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
              var infosClone = new SortedList({comparer: __infoComparer});
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
   * @return {!Class.<pentaho.type.Instance>} The instance constructor.
   */
  function __getInstanceClass() {
    return __Instance || (__Instance = localRequire(INSTANCE_TYPE));
  }

  // region get Type* support

  function __registerTypeInTypeInfo(type) {

    var id = type.id;

    if(typeInfo.getIdOf(id) === undefined) {

      // Find first base with an id.
      var baseType = type.ancestor;
      while(baseType !== null && !baseType.id) {
        baseType = baseType.ancestor;
      }

      if(baseType !== null) {
        __registerTypeInTypeInfo(baseType);

        typeInfo.declare(id, {base: baseType.id});
      }
    }
  }

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

  // region get Instance* support
  function __processInstanceType(baseTypeId) {

    if(!baseTypeId) throw error.argRequired("baseTypeId");

    switch(typeof baseTypeId) {
      case "string":
        return baseTypeId;

      case "function":
        if(baseTypeId.prototype instanceof __getInstanceClass()) {
          return __validateTypeId(baseTypeId.type.id);
        }
        break;

      case "object":
        if(baseTypeId instanceof __getInstanceClass().Type) {
          return __validateTypeId(baseTypeId.id);
        }
        break;
    }

    throw error.argInvalidType(
        "baseTypeId",
        ["string", "Class<pentaho.type.Instance>", "pentaho.type.Type"],
        typeof baseTypeId);
  }

  function __validateTypeId(baseTypeId) {
    if(!baseTypeId) throw error.argInvalid("baseTypeId", "Type is anonymous.");
    return baseTypeId;
  }

  function __createNoInstancesOfTypeError(baseTypeId) {
    return error.operInvalid("There is no defined matching instance of type '" + baseTypeId + "'.");
  }

  /**
   * Gets a function which filters instance results.
   *
   * @param {Object} [keyArgs] - The keyword arguments.
   * @param {function(!pentaho.type.Instance) : boolean} [keyArgs.filter] - A predicate function that determines
   * whether an instance can be the result.
   *
   * @return {function(!pentaho.type.Instance) : boolean} A function that returns `true` if the instance is selected
   * and returns `false`, otherwise.
   * @private
   */
  function __buildGetInstancePredicate(keyArgs) {

    var filter = O.getOwn(keyArgs, "filter");

    return function(instance) {
      return !!instance && (!filter || filter(instance));
    };
  }
  // endregion

  // region Spec Dependencies
  function __getSpecDependenciesAsync(loader, spec, eachMethod) {

    var depPromises = [];
    var depIdsSet = Object.create(null);

    eachMethod(spec, collectDependency);

    return Promise.all(depPromises);

    function collectDependency(isTypeDep, depSpec) {
      if(isTypeDep) {
        // Assume type id string
        if(!O_hasOwn.call(depIdsSet, depSpec)) {
          depIdsSet[depSpec] = 1;
          depPromises.push(loader.resolveTypeAsync(depSpec));
        }
      } else {
        // Assume special instance spec.
        depPromises.push(loader.resolveInstanceAsync(depSpec));
      }
    }
  }

  /**
   * Recursively collects the module ids of custom types used within a type specification.
   *
   * @memberOf pentaho.type.impl.Loader#
   * @param {pentaho.type.spec.ITypeProto} typeSpec - A type specification.
   *
   * @param {function(isTypeDep: boolean, depSpec: any)} depFun - A function that
   * is called for each dependency with two arguments,
   * a boolean that indicates if the dependency is a type or an instance,
   * and the type or instance specification.
   *
   * @private
   * @internal
   */
  function __eachTypeSpecDependencies(typeSpec, depFun) {
    if(!typeSpec) return;

    /* eslint default-case: 0 */
    switch(typeof typeSpec) {
      case "string":
        if(SpecificationContext.isIdTemporary(typeSpec)) return;

        // A standard type that is surely loaded?
        if(O_hasOwn.call(this.__byTypeId, typeSpec)) return;

        depFun(typeSpec);
        return;

      case "object":
        if(Array.isArray(typeSpec)) {
          // Shorthand list type notation
          // Example: [{props: { ...}}]
          if(typeSpec.length)
            __eachTypeSpecDependencies(typeSpec[0], depFun);
          return;
        }

        __eachTypeSpecDependenciesGeneric(typeSpec, depFun);
        return;
    }
  }

  function __eachTypeSpecDependenciesGeneric(typeSpec, depFun) {
    // TODO: this method only supports standard types deserialization.
    //   Custom types with own type attributes would need special handling.
    //   Something like a two phase protocol?

    // {[base: "complex", ] [of: "..."] , [props: []]}
    __eachTypeSpecDependencies(typeSpec.base, depFun);

    __eachTypeSpecDependencies(typeSpec.of, depFun);

    var props = typeSpec.props;
    if(props) {
      if(Array.isArray(props)) {
        props.forEach(function(propSpec) {
          if(propSpec) {
            __eachInstanceSpecDependencies(propSpec.defaultValue, depFun);

            __eachTypeSpecDependencies(propSpec.valueType, depFun);
            __eachTypeSpecDependencies(propSpec.base, depFun);
          }
        });
      } else {
        Object.keys(props).forEach(function(propName) {
          var propSpec = props[propName];
          if(propSpec) {
            __eachInstanceSpecDependencies(propSpec.defaultValue, depFun);

            __eachTypeSpecDependencies(propSpec.valueType, depFun);
            __eachTypeSpecDependencies(propSpec.base, depFun);
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
          __eachTypeSpecDependencies(mixinIdOrClass, depFun);
        }
      });
    }
  }

  function __eachInstanceSpecDependencies(instSpec, depFun) {

    if(instSpec && typeof instSpec === "object") {

      if(Array.isArray(instSpec)) {
        instSpec.forEach(function(elemRef) {
          __eachInstanceSpecDependencies(elemRef, depFun);
        }, this);
      } else if(instSpec.constructor === Object) {
        if(instSpec.$instance) {
          depFun(instSpec);
        } else {
          // A generic object instance specification.
          Object.keys(instSpec).forEach(function(name) {
            // Inline type.
            if(name === "_") {
              __eachTypeSpecDependencies(instSpec[name], depFun);
            } else {
              __eachInstanceSpecDependencies(instSpec[name], depFun);
            }
          });
        }
      }
    }
  }
  // endregion

  // By Descending ranking and then By Ascending definition index.
  function __infoComparer(infoA, infoB) {
    return F.compare(infoB.ranking, infoA.ranking) || F.compare(infoA.index, infoB.index);
  }
});
