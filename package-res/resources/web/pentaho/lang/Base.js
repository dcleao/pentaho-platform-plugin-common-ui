/*!
 * Based on Base.js 1.1a (c) 2006-2010, Dean Edwards
 * Updated to pass JSHint and converted into a module by Kenneth Powers
 * License: http://www.opensource.org/licenses/mit-license.php
 */
/*!
 * Based on Base.js by Dean Edwards, and later edited by Kenneth Powers.
 *
 * Changes:
 * 1. Added support for the `instanceof` operator.
 * 2. Added support for ES5 get/set properties.
 * 3. Added support for "Array classes", through `Base.Array`.
 * 4. Improved support for mixins.
 *
 *    Namely, it is now possible to call the mixed-in class constructor
 *    to initialize an instance of another class.
 *
 * 5. `Class.init` is now inherited.
 * 6. Added the `Class.to` method.
 *
 *    Converts its arguments to an instance of `Class`, or throws if that is impossible.
 *
 *    The default implementation tests if the first argument is an instance of that type and returns it, if it is.
 *    Otherwise, it calls `Class` with the `new` operator and all of the given arguments and returns the result.
 *
 * 7. To support 4., the previous constructor behavior, for when invoked
 *    on a non-instance of it (possibly without using the `new` operator) was dropped.
 *    It would extend the first argument with the class' prototype.
 *    Now, it ends up initializing the global object...
 * 8. Removed `Class#forEach`.
 * 9. Instances no longer have an own "base" property,
 *    it is inherited from, and set on, the corresponding "Base" root prototype object.
 * 10. `Base._prototyping` and `Base#_constructing` are no longer needed to
 *     control Class constructor and inst_extend flow.
 * 11. Class.valueOf removed. No longer needed... ?
 * 12. `Base#__root_proto__` is a new constant, non-enumerable property, set at each "Base" root prototype.
 * 13. `Base#__init__` is a new constant, non-enumerable, property, set at the prototype of "Base" classes
 *      that have an own initialization method (specified with the `constructor` property).
 * 14. Added new Class.implementStatic method to allow to specify the class interface after extend.
 *     Is parallel to Class.implement.
 * 15. Any existing static methods are inherited (not only standard Base ones).
 */
define([
  "../util/object",
  "../util/fun"
], function(O, fun) {
  "use strict";

  // ## Support variables

  // Used by `inst_extend_object`
  var _hidden = ["toString", "valueOf"],
      _hiddenClass = ["toString"],
      F_toString   = Function.prototype.toString,
      _extendProto = {
        toSource: null
        // Others from Object.prototype:
        // toString
        // valueOf
        // constructor
        // ...
      };

  var A_slice = Array.prototype.slice;

  return base_create();

  // -----------

  function base_create() {
    // The Base.Object root class is the base class for regular Object classes.
    var Base = base_root(Object, {}, "Base.Object");
    Base.version = "2.0";
    Base.Object = Base;

    // The Base.Array root class is the base class for Array classes.
    Base.Array = base_root(Array, [], "Base.Array");
    Base.Array.to = class_array_to;

    return Base;
  }

  // Creates a Base root class.
  function base_root(NativeBase, bootProto, baseRootName) {
    // Bootstrapping "Base" class.
    // Does not have the full "Base" class interface,
    // but only enough properties set to trick `class_extend`.
    // `BaseBoot` becomes accessible only by following the prototype chain,
    // finding `bootProto` along the way.
    var BaseBoot = function() {};

    if(bootProto) BaseBoot.prototype = bootProto;

    // Static interface that is inherited by all Base classes.
    BaseBoot.extend    = class_extend;
    BaseBoot._extend   = class_extend_core;
    BaseBoot.mix       = class_mix;
    BaseBoot.implement = class_implement;
    BaseBoot.implementStatic = class_implementStatic;
    BaseBoot.toString  = properFunToString;
    BaseBoot.to        = class_to;
    BaseBoot.init      = null;

    // Used by BaseBoot.extend, just below
    BaseBoot.prototype.extend = inst_extend;
    // ---

    var BaseRoot = BaseBoot.extend({
      // Cannot reuse constructor functions.
      constructor: function() {
        this.extend(arguments[0]);
      },
      base: inst_base
    }, {
      ancestor: NativeBase // Replaces BaseBoot by NativeBase
    });

    // The `__root_proto__` property is a cheap way to obtain
    // the correct Base-root prototype for setting the "base" property,
    // in `methodOverride`.
    // Create shared, hidden, constant `__root_proto__` property.
    Object.defineProperty(BaseRoot, "__root_proto__", {value: BaseRoot.prototype});

    setFunName(BaseRoot, baseRootName);

    return BaseRoot;
  }

  //region Class methods

  // Creates a sub-class of this class.
  // Static method of all "Base" constructors.
  function class_extend(name, instSpec, classSpec) {
    if(arguments.length < 3 && typeof name !== "string") {
      classSpec = instSpec;
      instSpec = name;
      name = null;
    }

    return this._extend(name, instSpec, classSpec);
  }

  function class_extend_core(name, instSpec, classSpec) {

    var SubClass = class_extend_subclass.call(this, name, instSpec);

    // Mix
    SubClass.mix(instSpec, classSpec);

    // Init
    if(fun.is(SubClass.init)) SubClass.init();

    return SubClass;
  }

  function class_extend_subclass(name, instSpec) {
    // Create PROTOTYPE and CONSTRUCTOR
    var subProto = Object.create(this.prototype),
        SubClass = class_extend_createCtor(subProto, instSpec);

    if(name) setFunName(SubClass, name);

    // Wire proto and constructor, so that the `instanceof` operator works.
    Object.defineProperty(subProto, "constructor", {
      configurable: true,
      writable: true,
      value: SubClass
    });
    SubClass.prototype = subProto;
    SubClass.ancestor  = this;

    // Inherit static _methods_ or getter/setters
    class_inherit_static.call(SubClass, this);

    return SubClass;
  }

  function class_extend_createCtor(proto, instSpec) {
    // When a `constructor` property has been specified:
    //   1. If it doesn't call base: use it as the constructor
    //   2. If it calls base: it's override wrapper is used as constructor
    //
    // Otherwise:
    //   1. If there is an inherited init: create a constructor that simply calls it
    //   2. Otherwise, create an empty constructor.
    var baseInit = proto.__init__,
        Class = class_extend_readCtor(instSpec);
    if(Class) {
      // If `init` calls base, it gets wrapped so that the `base` property gets set,
      // just like with all regular prototype methods.
      // Maybe override base constructor.
      Class = methodOverride(Class, baseInit, proto.__root_proto__);

      // Create shared, hidden, constant `__init__` property.
      Object.defineProperty(proto, "__init__", {value: Class});
    } else if(baseInit) {
      Class = class_extend_createCtorInit(baseInit);
    } else {
      Class = class_extend_createCtorNoInit();
    }

    return Class;
  }

  // Has a `constructor` property been specified (not Object#constructor!) ?
  // Should not be a get/set property, or it will be evaluated and the resulting value used instead.
  function class_extend_readCtor(instSpec) {
    var init = instSpec && instSpec.constructor;
    return init && init !== _extendProto.constructor && fun.is(init) ? init : null;
  }

  // When mixing in, init won't be available through this.__init__,
  // so the fixed `init` argument is actually required.
  function class_extend_createCtorInit(init) {
    return function() {
      init.apply(this, arguments);
    };
  }

  function class_extend_createCtorNoInit() {
    return function() {};
  }

  function class_to(v) {
    return (v instanceof this) ? v : O.make(this, arguments);
  }

  // Note that arrays of a certain sub-class cannot be newed up (in ES5, at least).
  // As such, a normal array must be created first and then "switched" to
  // inheriting from this class: var baseArray = BaseArray.to([]);
  function class_array_to(a) {
    // First, convert to an array.
    if(a === undefined)
      a = [];
    else if(a instanceof this)
      return a;
    else if(!(a instanceof Array))
      throw new Error("Cannot convert value to Base.Array.");

    return O.applyClass(a, this, A_slice.call(arguments, 1));
  }

  function class_mix(instSpec, classSpec) {
    if(fun.is(instSpec)) {
      if(arguments.length === 1) classSpec = instSpec;
      instSpec  = instSpec.prototype;
    }

    // Note: #extend implementations *must not* copy the `constructor` property!
    if(instSpec ) this.implement(instSpec);

    // Note: overriding static methods sets the special `.base()` property on the constructor...
    if(classSpec) this.implementStatic(classSpec);

    return this;
  }

  function class_implement() {
    var i = -1,
        L = arguments.length,
        proto = this.prototype,
        extend = proto.extend || inst_extend;

    while(++i < L) {
      var v = arguments[i];
      extend.call(proto, fun.is(v) ? v.prototype : v);
    }

    return this;
  }

  // Adapted from inst_extend_object to better handle the Class static inheritance case.
  function class_inherit_static(BaseClass) {

    // Do the "toString" and other methods manually.
    for(var i = 0; i < _hiddenClass.length; i++) {
      var h = _hiddenClass[i];
      if(BaseClass[h] !== _extendProto[h])
        inst_extend_propDesc.call(this, h, BaseClass, undefined, /*funOnly:*/true);
    }

    // Copy each of the BaseClass' properties to this object.
    for(var name in BaseClass)
      if(!_extendProto[name] &&
         name !== "ancestor" &&
         name !== "prototype" &&
         name !== "valueOf" &&
         name !== "Array" &&
         name !== "Object" &&
         name !== "base")
        inst_extend_propDesc.call(this, name, BaseClass, undefined, /*funOnly:*/true);
  }

  function class_implementStatic() {
    var i = -1,
        L = arguments.length;
    while(++i < L) {
      // Extend the constructor with `classSpec`.
      // (overriding static methods sets the `base` property on the constructor)
      var classSpec = arguments[i];
      if(classSpec) inst_extend_object.call(this, classSpec);
    }

    return this;
  }
  // endregion

  //region Instance methods
  function inst_base() {}

  function inst_extend(source, value) {

    if(arguments.length > 1) {
      inst_extend_propAssign.call(this, source, value, this.__root_proto__);
    } else if(source) {
      // Call `this.extend` method instead of this one, if it exists.
      if(!fun.is(this) && fun.is(this.extend) && this.extend !== inst_extend) {
        // Because in Base.js, Function#extend has a sub-classing semantics,
        // functions are not considered here, by testing `!fun.is(this)`.
        //
        // In the previous version of this code, the custom extend method was used
        // only for _assigning_ values to individual properties,
        // by using the `#extend(prop, value)` signature variant.
        // Manual properties and outer prop loop were still handled by `inst_extend_object`.
        //
        // Supporting get/set properties generally requires copying property descriptors,
        // and, not, assigning values, so the old `#extend(prop, value)` signature is
        // not adequate anymore for this particular scenario.
        //
        // The solution was to delegate to the foreign `extend` method directly at the
        // object level, through its `#extend(source)` signature variant,
        // and rely on the foreign `extend` method to mimic the semantics that would
        // otherwise be imposed by `inst_extend_object`.
        //
        // Note, also, that this path of code was (and is) not used by "Base"'s internal code.
        // It could (and can) only happen when `Base#extend` method is applied to some "foreign" object.
        this.extend(source);
      } else {
        inst_extend_object.call(this, source, this.__root_proto__);
      }
    }

    return this;
  }

  function inst_extend_object(source, rootProto) {

    // Do the "toString" and other methods manually.
    for(var i = 0; i < _hidden.length; i++) {
      var h = _hidden[i];
      if(source[h] !== _extendProto[h])
        inst_extend_propDesc.call(this, h, source, rootProto);
    }

    // Copy each of the source object's properties to this object.
    for(var name in source)
      if(!_extendProto[name])
        inst_extend_propDesc.call(this, name, source, rootProto);
  }

  function inst_extend_propDesc(name, source, rootProto, funOnly) {
    var desc = O.getPropertyDescriptor(source, name);
    if(desc.get || desc.set) {
      // Property getter/setter
      var baseDesc = O.getPropertyDescriptor(this, name);
      if(baseDesc) {
        // Specify null to block inheritance and, for example, make a property read-only.
        if((desc.get !== null) && (desc.get || baseDesc.get)) desc.get = methodOverride(desc.get, baseDesc.get, rootProto);
        if((desc.set !== null) && (desc.set || baseDesc.set)) desc.set = methodOverride(desc.set, baseDesc.set, rootProto);
      }

      Object.defineProperty(this, name, desc);
    } else {
      // Property value
      inst_extend_propAssign.call(this, name, desc.value, rootProto, funOnly);
    }
  }

  function inst_extend_propAssign(name, value, rootProto, funOnly) {
    if(fun.is(value)) {
      this[name] = methodOverride(value, this[name], rootProto);
    } else if(!funOnly) {
      this[name] = value;
    }
  }
  //endregion

  //region Method Override
  function methodOverride(value, baseValue, rootProto) {
    if(!value || !baseValue) return value || baseValue;

    // Get the unwrapped value.
    var method = value.valueOf();

    // valueOf() test is to avoid circular references
    if(!method ||
       (baseValue.valueOf && baseValue.valueOf() === method) ||
       !methodCallsBase(method))
      return value;

    value = methodOverrideWrap(method, baseValue, rootProto);

    // Returns the underlying, wrapped method
    value.valueOf = function(type) {
      return type === "object" ? value : method;
    };

    value.toString = properFunToString;

    return value;
  }

  function methodCallsBase(method) {
    return /\bbase\b/.test(method);
  }

  function methodOverrideWrap(method, baseMethod, rootProto) {
    if(rootProto)
      return function() {
        var previous = rootProto.base; rootProto.base = baseMethod;
        try {
          return method.apply(this, arguments);
        } finally { rootProto.base = previous; }
      };

    // float
    return function() {
      var previous = this.base; this.base = baseMethod;
      try {
        return method.apply(this, arguments);
      } finally { this.base = previous; }
    };
  }
  //endregion

  //region Helpers
  // The native String function or toString method do not call .valueOf() on its argument.
  // However, concatenating with a string does...
  function properFunToString() {
    return F_toString.call(this.valueOf());
  }

  // Because `Function#name` is non-writable but configurable it
  // can be set, but only through `Object.defineProperty`.
  function setFunName(fun, name) {
    fun.displayName = name;
    Object.defineProperty(fun, "name", {value: name, configurable: true});
  }
  //endregion
});