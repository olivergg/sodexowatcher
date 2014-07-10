'use strict';
/* Scala.js runtime support
 * Copyright 2013 LAMP/EPFL
 * Author: Sébastien Doeraene
 */

/* ---------------------------------- *
 * The top-level Scala.js environment *
 * ---------------------------------- */

var ScalaJS = {
  // Fields
  g: (typeof global === "object" && global && global["Object"] === Object) ? global : this, // Global scope
  e: (typeof __ScalaJSExportsNamespace === "object" && __ScalaJSExportsNamespace) ? __ScalaJSExportsNamespace : // Where to send exports
      ((typeof global === "object" && global && global["Object"] === Object) ? global : this),
  d: {},         // Data for types
  c: {},         // Scala.js constructors
  h: {},         // Inheritable constructors (without initialization code)
  i: {},         // Implementation class modules
  n: {},         // Module instances
  m: {},         // Module accessors
  is: {},        // isInstanceOf methods
  as: {},        // asInstanceOf methods
  isArrayOf: {}, // isInstanceOfArrayOf methods
  asArrayOf: {}, // asInstanceOfArrayOf methods

  // Core mechanism

  makeIsArrayOfPrimitive: function(primitiveData) {
    return function(obj, depth) {
      return !!(obj && obj.$classData &&
        (obj.$classData.arrayDepth === depth) &&
        (obj.$classData.arrayBase === primitiveData));
    }
  },

  makeAsArrayOfPrimitive: function(isInstanceOfFunction, arrayEncodedName) {
    return function(obj, depth) {
      if (isInstanceOfFunction(obj, depth) || (obj === null))
        return obj;
      else
        ScalaJS.throwArrayCastException(obj, arrayEncodedName, depth);
    }
  },

  /** Encode a property name for runtime manipulation
   *  Usage:
   *    env.propertyName({someProp:0})
   *  Returns:
   *    "someProp"
   *  Useful when the property is renamed by a global optimizer (like Closure)
   *  but we must still get hold of a string of that name for runtime
   * reflection.
   */
  propertyName: function(obj) {
    var result;
    for (var prop in obj)
      result = prop;
    return result;
  },

  // Runtime functions

  isScalaJSObject: function(obj) {
    return !!(obj && obj.$classData);
  },

  throwClassCastException: function(instance, classFullName) {
    throw new ScalaJS.c.jl_ClassCastException().init___T(
      instance + " is not an instance of " + classFullName);
  },

  throwArrayCastException: function(instance, classArrayEncodedName, depth) {
    for (; depth; --depth)
      classArrayEncodedName = "[" + classArrayEncodedName;
    ScalaJS.throwClassCastException(instance, classArrayEncodedName);
  },

  wrapJavaScriptException: function(exception) {
    if (ScalaJS.isScalaJSObject(exception))
      return exception;
    else
      return new ScalaJS.c.sjs_js_JavaScriptException()
        .init___sjs_js_Any(exception);
  },

  unwrapJavaScriptException: function(exception) {
    if (ScalaJS.is.sjs_js_JavaScriptException(exception))
      return exception.exception__sjs_js_Any();
    else
      return exception;
  },

  makeNativeArrayWrapper: function(arrayClassData, nativeArray) {
    return new arrayClassData.constr(nativeArray);
  },

  newArrayObject: function(arrayClassData, lengths) {
    return ScalaJS.newArrayObjectInternal(arrayClassData, lengths, 0);
  },

  newArrayObjectInternal: function(arrayClassData, lengths, lengthIndex) {
    var result = new arrayClassData.constr(lengths[lengthIndex]);

    if (lengthIndex < lengths.length-1) {
      var subArrayClassData = arrayClassData.componentData;
      var subLengthIndex = lengthIndex+1;
      var underlying = result.u;
      for (var i = 0; i < underlying.length; i++) {
        underlying[i] = ScalaJS.newArrayObjectInternal(
          subArrayClassData, lengths, subLengthIndex);
      }
    }

    return result;
  },

  /** Protect the argument against `this` forgery (see genPrimitiveJSCall()) */
  protect: function(x) {
    return x;
  },

  cloneObject: function(obj) {
    function Clone(from) {
      for (var field in from)
        if (from["hasOwnProperty"](field))
          this[field] = from[field];
    }
    Clone.prototype = ScalaJS.g["Object"]["getPrototypeOf"](obj);
    return new Clone(obj);
  },

  applyMethodWithVarargs: function(instance, methodName, argArray) {
    // Note: cannot be inlined because `instance` would be evaluated twice
    return instance[methodName].apply(instance, argArray);
  },

  newInstanceWithVarargs: function(constructor, argArray) {
    // Not really "possible" in JavaScript, so we emulate what it would be
    function c() {};
    c.prototype = constructor.prototype;
    var instance = new c;
    var result = constructor.apply(instance, argArray);
    switch (typeof result) {
      case "undefined":
      case "number":
      case "boolean":
      case "string":
        return instance;
      default:
        if (result === null)
          return instance;
        else
          return result;
    }
  },

  anyEqEq: function(lhs, rhs) {
    if (ScalaJS.isScalaJSObject(lhs) || typeof lhs === "number") {
      return ScalaJS.m.sr_BoxesRunTime().equals__O__O__Z(lhs, rhs);
    } else {
      return lhs === rhs;
    }
  },

  anyRefEqEq: function(lhs, rhs) {
    if (lhs === null)
      return rhs === null;
    else
      return ScalaJS.objectEquals(lhs, rhs);
  },

  objectToString: function(instance) {
    if (instance === void 0)
      return "undefined";
    else
      return instance.toString();
  },

  objectGetClass: function(instance) {
    switch (typeof instance) {
      case "string":
        return ScalaJS.d.T.getClassOf();
      case "number":
        if (ScalaJS.isInt(instance))
          return ScalaJS.d.jl_Integer.getClassOf();
        else
          return ScalaJS.d.jl_Double.getClassOf();
      case "boolean":
        return ScalaJS.d.jl_Boolean.getClassOf();
      case "undefined":
        return ScalaJS.d.sr_BoxedUnit.getClassOf();
      default:
        if (ScalaJS.is.sjsr_RuntimeLong(instance))
          return ScalaJS.d.jl_Long.getClassOf();
        else if (ScalaJS.isScalaJSObject(instance) || (instance === null))
          return instance.getClass__jl_Class();
        else
          return null; // Exception?
    }
  },

  objectClone: function(instance) {
    if (ScalaJS.isScalaJSObject(instance) || (instance === null))
      return instance.clone__O();
    else
      throw new ScalaJS.c.jl_CloneNotSupportedException().init___();
  },

  objectNotify: function(instance) {
    // final and no-op in java.lang.Object
    if (instance === null)
      instance.notify__V();
  },

  objectNotifyAll: function(instance) {
    // final and no-op in java.lang.Object
    if (instance === null)
      instance.notifyAll__V();
  },

  objectFinalize: function(instance) {
    if (ScalaJS.isScalaJSObject(instance) || (instance === null))
      instance.finalize__V();
    // else no-op
  },

  objectEquals: function(instance, rhs) {
    if (ScalaJS.isScalaJSObject(instance) || (instance === null))
      return instance.equals__O__Z(rhs);
    else if (typeof instance === "number")
      return typeof rhs === "number" && ScalaJS.numberEquals(instance, rhs);
    else
      return instance === rhs;
  },

  numberEquals: function(lhs, rhs) {
    return (
      lhs === rhs // 0.0 === -0.0 to prioritize the Int case over the Double case
    ) || (
      // are they both NaN?
      (lhs !== lhs) && (rhs !== rhs)
    );
  },

  objectHashCode: function(instance) {
    switch (typeof instance) {
      case "string":
        // calculate hash of String as specified by JavaDoc
        var n = instance["length"];
        var res = 0;
        var mul = 1; // holds pow(31, n-i-1)
        // multiplications with `mul` do never overflow the 52 bits of precision:
        // - we truncate `mul` to 32 bits on each operation
        // - 31 has 5 significant bits only
        // - s[i] has 16 significant bits max
        // 32 + max(5, 16) = 48 < 52 => no overflow
        for (var i = n-1; i >= 0; --i) {
          // calculate s[i] * pow(31, n-i-1)
          res = res + (instance["charCodeAt"](i) * mul | 0) | 0
          // update mul for next iteration
          mul = mul * 31 | 0
        }
        return res;
      case "number":
        return instance | 0;
      case "boolean":
        return instance ? 1231 : 1237;
      case "undefined":
        return 0;
      default:
        if (ScalaJS.isScalaJSObject(instance) || instance === null)
          return instance.hashCode__I();
        else
          return 42; // TODO?
    }
  },

  comparableCompareTo: function(instance, rhs) {
    switch (typeof instance) {
      case "string":
        ScalaJS.as.T(rhs);
        return instance === rhs ? 0 : (instance < rhs ? -1 : 1);
      case "number":
        ScalaJS.as.jl_Number(rhs);
        return ScalaJS.numberEquals(instance, rhs) ? 0 : (instance < rhs ? -1 : 1);
      case "boolean":
        ScalaJS.asBoolean(rhs);
        return instance - rhs; // yes, this gives the right result
      default:
        return instance.compareTo__O__I(rhs);
    }
  },

  charSequenceLength: function(instance) {
    if (typeof(instance) === "string")
      return instance["length"];
    else
      return instance.length__I();
  },

  charSequenceCharAt: function(instance, index) {
    if (typeof(instance) === "string")
      return instance["charCodeAt"](index);
    else
      return instance.charAt__I__C(index);
  },

  charSequenceSubSequence: function(instance, start, end) {
    if (typeof(instance) === "string")
      return instance["substring"](start, end);
    else
      return instance.subSequence__I__I__jl_CharSequence(start, end);
  },

  booleanBooleanValue: function(instance) {
    if (typeof instance === "boolean") return instance;
    else                               return instance.booleanValue__Z();
  },

  numberByteValue: function(instance) {
    if (typeof instance === "number") return (instance << 24) >> 24;
    else                              return instance.byteValue__B();
  },
  numberShortValue: function(instance) {
    if (typeof instance === "number") return (instance << 16) >> 16;
    else                              return instance.shortValue__S();
  },
  numberIntValue: function(instance) {
    if (typeof instance === "number") return instance | 0;
    else                              return instance.intValue__I();
  },
  numberLongValue: function(instance) {
    if (typeof instance === "number")
      return ScalaJS.m.sjsr_RuntimeLong().fromDouble__D__sjsr_RuntimeLong(instance);
    else
      return instance.longValue__J();
  },
  numberFloatValue: function(instance) {
    if (typeof instance === "number") return instance;
    else                              return instance.floatValue__F();
  },
  numberDoubleValue: function(instance) {
    if (typeof instance === "number") return instance;
    else                              return instance.doubleValue__D();
  },

  isNaN: function(instance) {
    return instance !== instance;
  },

  isInfinite: function(instance) {
    return !ScalaJS.g["isFinite"](instance) && !ScalaJS.isNaN(instance);
  },

  propertiesOf: function(obj) {
    var result = new Array();
    for (var prop in obj)
      result["push"](prop.toString());
    return result;
  },

  systemArraycopy: function(src, srcPos, dest, destPos, length) {
    var srcu = src.u;
    var destu = dest.u;
    if (srcu !== destu || destPos < srcPos || srcPos + length < destPos) {
      for (var i = 0; i < length; i++)
        destu[destPos+i] = srcu[srcPos+i];
    } else {
      for (var i = length-1; i >= 0; i--)
        destu[destPos+i] = srcu[srcPos+i];
    }
  },

  // is/as for hijacked boxed classes (the non-trivial ones)

  isByte: function(v) {
    return (v << 24 >> 24) === v;
  },

  isShort: function(v) {
    return (v << 16 >> 16) === v;
  },

  isInt: function(v) {
    return (v | 0) === v;
  },

  asUnit: function(v) {
    if (v === void 0)
      return v;
    else
      ScalaJS.throwClassCastException(v, "scala.runtime.BoxedUnit");
  },

  asBoolean: function(v) {
    if (typeof v === "boolean" || v === null)
      return v;
    else
      ScalaJS.throwClassCastException(v, "java.lang.Boolean");
  },

  asByte: function(v) {
    if (ScalaJS.isByte(v) || v === null)
      return v;
    else
      ScalaJS.throwClassCastException(v, "java.lang.Byte");
  },

  asShort: function(v) {
    if (ScalaJS.isShort(v) || v === null)
      return v;
    else
      ScalaJS.throwClassCastException(v, "java.lang.Short");
  },

  asInt: function(v) {
    if (ScalaJS.isInt(v) || v === null)
      return v;
    else
      ScalaJS.throwClassCastException(v, "java.lang.Integer");
  },

  asFloat: function(v) {
    if (typeof v === "number" || v === null)
      return v;
    else
      ScalaJS.throwClassCastException(v, "java.lang.Float");
  },

  asDouble: function(v) {
    if (typeof v === "number" || v === null)
      return v;
    else
      ScalaJS.throwClassCastException(v, "java.lang.Double");
  },

  // Boxes

  bC: function(value) {
    return new ScalaJS.c.jl_Character().init___C(value);
  },

  // Unboxes

  uZ: function(value) {
    return ScalaJS.asBoolean(value) || false;
  },
  uC: function(value) {
    return null === value ? 0 : ScalaJS.as.jl_Character(value).value$1;
  },
  uB: function(value) {
    return ScalaJS.asByte(value) || 0;
  },
  uS: function(value) {
    return ScalaJS.asShort(value) || 0;
  },
  uI: function(value) {
    return ScalaJS.asInt(value) || 0;
  },
  uJ: function(value) {
    return ScalaJS.as.sjsr_RuntimeLong(value) ||
      ScalaJS.m.sjsr_RuntimeLong().zero__sjsr_RuntimeLong();
  },
  uF: function(value) {
    // NaN || 0.0 is unfortunately 0.0
    return null === value ? 0.0 : ScalaJS.asFloat(value);
  },
  uD: function(value) {
    // NaN || 0.0 is unfortunately 0.0
    return null === value ? 0.0 : ScalaJS.asDouble(value);
  }
}

/* We have to force a non-elidable *read* of ScalaJS.e, otherwise Closure will
 * eliminate it altogether, along with all the exports, which is ... er ...
 * plain wrong.
 */
this["__ScalaJSExportsNamespace"] = ScalaJS.e;

// Type data constructors

/** @constructor */
ScalaJS.PrimitiveTypeData = function(zero, arrayEncodedName, displayName) {
  // Runtime support
  this.constr = undefined;
  this.parentData = undefined;
  this.ancestors = {};
  this.componentData = null;
  this.zero = zero;
  this.arrayEncodedName = arrayEncodedName;
  this._classOf = undefined;
  this._arrayOf = undefined;
  this.isArrayOf = function(obj, depth) { return false; };

  // java.lang.Class support
  this["name"] = displayName;
  this["isPrimitive"] = true;
  this["isInterface"] = false;
  this["isArrayClass"] = false;
  this["isInstance"] = function(obj) { return false; };
};

/** @constructor */
ScalaJS.ClassTypeData = function(internalNameObj, isInterface, fullName,
                                 parentData, ancestors, isInstance, isArrayOf) {
  var internalName = ScalaJS.propertyName(internalNameObj);

  isInstance = isInstance || function(obj) {
    return !!(obj && obj.$classData && obj.$classData.ancestors[internalName]);
  };

  isArrayOf = isArrayOf || function(obj, depth) {
    return !!(obj && obj.$classData && (obj.$classData.arrayDepth === depth)
      && obj.$classData.arrayBase.ancestors[internalName])
  };

  // Runtime support
  this.constr = undefined;
  this.parentData = parentData;
  this.ancestors = ancestors;
  this.componentData = null;
  this.zero = null;
  this.arrayEncodedName = "L"+fullName+";";
  this._classOf = undefined;
  this._arrayOf = undefined;
  this.isArrayOf = isArrayOf;

  // java.lang.Class support
  this["name"] = fullName;
  this["isPrimitive"] = false;
  this["isInterface"] = isInterface;
  this["isArrayClass"] = false;
  this["isInstance"] = isInstance;
};

/** @constructor */
ScalaJS.ArrayTypeData = function(componentData) {
  // The constructor

  var componentZero = componentData.zero;

  // The zero for the Long runtime representation
  // is a special case here, since the class has not
  // been defined yet, when this file is read
  if (componentZero == "longZero")
    componentZero = ScalaJS.m.sjsr_RuntimeLong().zero__sjsr_RuntimeLong();

  /** @constructor */
  var ArrayClass = function(arg) {
    if (typeof(arg) === "number") {
      // arg is the length of the array
      this.u = new Array(arg);
      for (var i = 0; i < arg; i++)
        this.u[i] = componentZero;
    } else {
      // arg is a native array that we wrap
      this.u = arg;
    }
  }
  ArrayClass.prototype = new ScalaJS.h.O;
  ArrayClass.prototype.constructor = ArrayClass;
  ArrayClass.prototype.$classData = this;

  ArrayClass.prototype.clone__O = function() {
    return new ArrayClass(this.u["slice"](0));
  };

  // Don't generate reflective call proxies. The compiler special cases
  // reflective calls to methods on scala.Array

  // The data

  var encodedName = "[" + componentData.arrayEncodedName;
  var componentBase = componentData.arrayBase || componentData;
  var componentDepth = componentData.arrayDepth || 0;
  var arrayDepth = componentDepth + 1;

  var isInstance = function(obj) {
    return componentBase.isArrayOf(obj, arrayDepth);
  }

  // Runtime support
  this.constr = ArrayClass;
  this.parentData = ScalaJS.d.O;
  this.ancestors = {O: 1};
  this.componentData = componentData;
  this.arrayBase = componentBase;
  this.arrayDepth = arrayDepth;
  this.zero = null;
  this.arrayEncodedName = encodedName;
  this._classOf = undefined;
  this._arrayOf = undefined;
  this.isArrayOf = undefined;

  // java.lang.Class support
  this["name"] = encodedName;
  this["isPrimitive"] = false;
  this["isInterface"] = false;
  this["isArrayClass"] = true;
  this["isInstance"] = isInstance;
};

ScalaJS.ClassTypeData.prototype.getClassOf = function() {
  if (!this._classOf)
    this._classOf = new ScalaJS.c.jl_Class().init___jl_ScalaJSClassData(this);
  return this._classOf;
};

ScalaJS.ClassTypeData.prototype.getArrayOf = function() {
  if (!this._arrayOf)
    this._arrayOf = new ScalaJS.ArrayTypeData(this);
  return this._arrayOf;
};

// java.lang.Class support

ScalaJS.ClassTypeData.prototype["getFakeInstance"] = function() {
  if (this === ScalaJS.d.T)
    return "some string";
  else if (this === ScalaJS.d.jl_Boolean)
    return false;
  else if (this === ScalaJS.d.jl_Byte ||
           this === ScalaJS.d.jl_Short ||
           this === ScalaJS.d.jl_Integer ||
           this === ScalaJS.d.jl_Float ||
           this === ScalaJS.d.jl_Double)
    return 0;
  else if (this === ScalaJS.d.jl_Long)
    return ScalaJS.m.sjsr_RuntimeLong().zero__sjsr_RuntimeLong();
  else if (this === ScalaJS.d.sr_BoxedUnit)
    return void 0;
  else
    return {$classData: this};
};

ScalaJS.ClassTypeData.prototype["getSuperclass"] = function() {
  return this.parentData ? this.parentData.getClassOf() : null;
};

ScalaJS.ClassTypeData.prototype["getComponentType"] = function() {
  return this.componentData ? this.componentData.getClassOf() : null;
};

ScalaJS.ClassTypeData.prototype["newArrayOfThisClass"] = function(lengths) {
  var arrayClassData = this;
  for (var i = 0; i < lengths.length; i++)
    arrayClassData = arrayClassData.getArrayOf();
  return ScalaJS.newArrayObject(arrayClassData, lengths);
};

ScalaJS.PrimitiveTypeData.prototype = ScalaJS.ClassTypeData.prototype;
ScalaJS.ArrayTypeData.prototype = ScalaJS.ClassTypeData.prototype;

// Create primitive types

ScalaJS.d.V = new ScalaJS.PrimitiveTypeData(undefined, "V", "void");
ScalaJS.d.Z = new ScalaJS.PrimitiveTypeData(false, "Z", "boolean");
ScalaJS.d.C = new ScalaJS.PrimitiveTypeData(0, "C", "char");
ScalaJS.d.B = new ScalaJS.PrimitiveTypeData(0, "B", "byte");
ScalaJS.d.S = new ScalaJS.PrimitiveTypeData(0, "S", "short");
ScalaJS.d.I = new ScalaJS.PrimitiveTypeData(0, "I", "int");
ScalaJS.d.J = new ScalaJS.PrimitiveTypeData("longZero", "J", "long");
ScalaJS.d.F = new ScalaJS.PrimitiveTypeData(0.0, "F", "float");
ScalaJS.d.D = new ScalaJS.PrimitiveTypeData(0.0, "D", "double");

// Instance tests for array of primitives

ScalaJS.isArrayOf.Z = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.Z);
ScalaJS.asArrayOf.Z = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.Z, "Z");
ScalaJS.d.Z.isArrayOf = ScalaJS.isArrayOf.Z;

ScalaJS.isArrayOf.C = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.C);
ScalaJS.asArrayOf.C = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.C, "C");
ScalaJS.d.C.isArrayOf = ScalaJS.isArrayOf.C;

ScalaJS.isArrayOf.B = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.B);
ScalaJS.asArrayOf.B = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.B, "B");
ScalaJS.d.B.isArrayOf = ScalaJS.isArrayOf.B;

ScalaJS.isArrayOf.S = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.S);
ScalaJS.asArrayOf.S = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.S, "S");
ScalaJS.d.S.isArrayOf = ScalaJS.isArrayOf.S;

ScalaJS.isArrayOf.I = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.I);
ScalaJS.asArrayOf.I = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.I, "I");
ScalaJS.d.I.isArrayOf = ScalaJS.isArrayOf.I;

ScalaJS.isArrayOf.J = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.J);
ScalaJS.asArrayOf.J = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.J, "J");
ScalaJS.d.J.isArrayOf = ScalaJS.isArrayOf.J;

ScalaJS.isArrayOf.F = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.F);
ScalaJS.asArrayOf.F = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.F, "F");
ScalaJS.d.F.isArrayOf = ScalaJS.isArrayOf.F;

ScalaJS.isArrayOf.D = ScalaJS.makeIsArrayOfPrimitive(ScalaJS.d.D);
ScalaJS.asArrayOf.D = ScalaJS.makeAsArrayOfPrimitive(ScalaJS.isArrayOf.D, "D");
ScalaJS.d.D.isArrayOf = ScalaJS.isArrayOf.D;

// Polyfills

ScalaJS.imul = ScalaJS.g["Math"]["imul"] || (function(a, b) {
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul
  var ah = (a >>> 16) & 0xffff;
  var al = a & 0xffff;
  var bh = (b >>> 16) & 0xffff;
  var bl = b & 0xffff;
  // the shift by 0 fixes the sign on the high part
  // the final |0 converts the unsigned value into a signed value
  return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0) | 0);
});
/** @constructor */
ScalaJS.c.O = (function() {
  /*<skip>*/
});
/** @constructor */
ScalaJS.h.O = (function() {
  /*<skip>*/
});
ScalaJS.h.O.prototype = ScalaJS.c.O.prototype;
ScalaJS.c.O.prototype.init___ = (function() {
  return this
});
ScalaJS.c.O.prototype.getClass__jl_Class = (function() {
  return this.$classData.getClassOf()
});
ScalaJS.c.O.prototype.hashCode__I = (function() {
  return 42
});
ScalaJS.c.O.prototype.equals__O__Z = (function(that) {
  return (this === that)
});
ScalaJS.c.O.prototype.toString__T = (function() {
  return ((this.getClass__jl_Class().getName__T() + "@") + (this.hashCode__I() >>> 0)["toString"](16))
});
ScalaJS.c.O.prototype["toString"] = (function() {
  return this.toString__T()
});
ScalaJS.is.O = (function(obj) {
  return (obj !== null)
});
ScalaJS.as.O = (function(obj) {
  return obj
});
ScalaJS.isArrayOf.O = (function(obj, depth) {
  var data = (obj && obj.$classData);
  if ((!data)) {
    return false
  } else {
    var arrayDepth = (data.arrayDepth || 0);
    if ((arrayDepth < depth)) {
      return false
    } else {
      if ((arrayDepth > depth)) {
        return true
      } else {
        return (!data.arrayBase["isPrimitive"])
      }
    }
  }
});
ScalaJS.asArrayOf.O = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.O(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.Object;", depth)
  }
});
ScalaJS.d.O = new ScalaJS.ClassTypeData({
  O: 0
}, false, "java.lang.Object", null, {
  O: 1
}, ScalaJS.is.O, ScalaJS.isArrayOf.O);
ScalaJS.c.O.prototype.$classData = ScalaJS.d.O;
/*<skip>*/;
ScalaJS.i.jl_JSConsoleBasedPrintStream$class__print__jl_JSConsoleBasedPrintStream__T__V = (function($$this, s) {
  if ((s === null)) {
    var rest = "null"
  } else {
    var rest = s
  };
  while ((!ScalaJS.i.sjsr_RuntimeString$class__isEmpty__sjsr_RuntimeString__Z(rest))) {
    var nlPos = ScalaJS.i.sjsr_RuntimeString$class__indexOf__sjsr_RuntimeString__T__I(rest, "\n");
    if ((nlPos < 0)) {
      $$this.java$lang$JSConsoleBasedPrintStream$$buffer$und$eq__T__V((("" + $$this.java$lang$JSConsoleBasedPrintStream$$buffer__T()) + rest));
      $$this.java$lang$JSConsoleBasedPrintStream$$flushed$und$eq__Z__V(false);
      rest = ""
    } else {
      $$this.doWriteLine__T__V((("" + $$this.java$lang$JSConsoleBasedPrintStream$$buffer__T()) + ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__I__T(rest, 0, nlPos)));
      $$this.java$lang$JSConsoleBasedPrintStream$$buffer$und$eq__T__V("");
      $$this.java$lang$JSConsoleBasedPrintStream$$flushed$und$eq__Z__V(true);
      rest = ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__T(rest, ((nlPos + 1) | 0))
    }
  }
});
ScalaJS.i.jl_JSConsoleBasedPrintStream$class__flush__jl_JSConsoleBasedPrintStream__V = (function($$this) {
  if ((!$$this.java$lang$JSConsoleBasedPrintStream$$flushed__Z())) {
    $$this.doWriteLine__T__V((("" + $$this.java$lang$JSConsoleBasedPrintStream$$buffer__T()) + $$this.java$lang$JSConsoleBasedPrintStream$$lineContEnd__T()));
    $$this.java$lang$JSConsoleBasedPrintStream$$buffer$und$eq__T__V($$this.java$lang$JSConsoleBasedPrintStream$$lineContStart__T());
    $$this.java$lang$JSConsoleBasedPrintStream$$flushed$und$eq__Z__V(true)
  }
});
ScalaJS.i.jl_JSConsoleBasedPrintStream$class__$init$__jl_JSConsoleBasedPrintStream__V = (function($$this) {
  $$this.java$lang$JSConsoleBasedPrintStream$$flushed$und$eq__Z__V(true);
  $$this.java$lang$JSConsoleBasedPrintStream$$buffer$und$eq__T__V("");
  $$this.java$lang$JSConsoleBasedPrintStream$$undsetter$und$java$lang$JSConsoleBasedPrintStream$$lineContEnd$und$eq__T__V("\u21a9");
  $$this.java$lang$JSConsoleBasedPrintStream$$undsetter$und$java$lang$JSConsoleBasedPrintStream$$lineContStart$und$eq__T__V("\u21aa")
});
ScalaJS.i.s_DeprecatedPredef$class__$init$__s_Predef$__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.s_Function0$class__toString__F0__T = (function($$this) {
  return "<function0>"
});
ScalaJS.i.s_Function0$class__$init$__F0__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.s_Function1$class__toString__F1__T = (function($$this) {
  return "<function1>"
});
ScalaJS.i.s_Function1$class__$init$__F1__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.s_PartialFunction$class__$init$__s_PartialFunction__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.s_Product$class__$init$__s_Product__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.s_Product2$class__productArity__s_Product2__I = (function($$this) {
  return 2
});
ScalaJS.i.s_Product2$class__productElement__s_Product2__I__O = (function($$this, n) {
  var x1 = n;
  switch (x1) {
    case 0:
      {
        return $$this.$$und1__O();
        break
      };
    case 1:
      {
        return $$this.$$und2__O();
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(n));
  }
});
ScalaJS.i.s_Product2$class__$init$__s_Product2__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.s_Product5$class__productArity__s_Product5__I = (function($$this) {
  return 5
});
ScalaJS.i.s_Product5$class__productElement__s_Product5__I__O = (function($$this, n) {
  var x1 = n;
  switch (x1) {
    case 0:
      {
        return $$this.$$und1__O();
        break
      };
    case 1:
      {
        return $$this.$$und2__O();
        break
      };
    case 2:
      {
        return $$this.$$und3__O();
        break
      };
    case 3:
      {
        return $$this.$$und4__O();
        break
      };
    case 4:
      {
        return $$this.$$und5__O();
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(n));
  }
});
ScalaJS.i.s_Product5$class__$init$__s_Product5__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.s_concurrent_ExecutionContext$class__prepare__s_concurrent_ExecutionContext__s_concurrent_ExecutionContext = (function($$this) {
  return $$this
});
ScalaJS.i.s_concurrent_ExecutionContext$class__$init$__s_concurrent_ExecutionContext__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.s_concurrent_Future$class__$init$__s_concurrent_Future__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.s_concurrent_Promise$class__complete__s_concurrent_Promise__s_util_Try__s_concurrent_Promise = (function($$this, result) {
  if ($$this.tryComplete__s_util_Try__Z(result)) {
    return $$this
  } else {
    throw new ScalaJS.c.jl_IllegalStateException().init___T("Promise already completed.")
  }
});
ScalaJS.i.s_concurrent_Promise$class__success__s_concurrent_Promise__O__s_concurrent_Promise = (function($$this, value) {
  return $$this.complete__s_util_Try__s_concurrent_Promise(new ScalaJS.c.s_util_Success().init___O(value))
});
ScalaJS.i.s_concurrent_Promise$class__failure__s_concurrent_Promise__jl_Throwable__s_concurrent_Promise = (function($$this, cause) {
  return $$this.complete__s_util_Try__s_concurrent_Promise(new ScalaJS.c.s_util_Failure().init___jl_Throwable(cause))
});
ScalaJS.i.s_concurrent_Promise$class__$init$__s_concurrent_Promise__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.s_concurrent_impl_Promise$class__future__s_concurrent_impl_Promise__s_concurrent_impl_Promise = (function($$this) {
  return $$this
});
ScalaJS.i.s_concurrent_impl_Promise$class__$init$__s_concurrent_impl_Promise__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.s_io_AnsiColor$class__$init$__s_io_AnsiColor__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.s_math_LowPriorityEquiv$class__$init$__s_math_Equiv$__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.s_math_LowPriorityOrderingImplicits$class__$init$__s_math_LowPriorityOrderingImplicits__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.s_math_Ordered$class__$init$__s_math_Ordered__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.s_reflect_ClassManifestDeprecatedApis$class__$init$__s_reflect_ClassTag__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.s_reflect_ClassTag$class__$init$__s_reflect_ClassTag__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.s_reflect_Manifest$class__$init$__s_reflect_Manifest__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.s_util_control_NoStackTrace$class__fillInStackTrace__s_util_control_NoStackTrace__jl_Throwable = (function($$this) {
  if (ScalaJS.m.s_util_control_NoStackTrace().noSuppression__Z()) {
    return $$this.scala$util$control$NoStackTrace$$super$fillInStackTrace__jl_Throwable()
  } else {
    return ScalaJS.as.jl_Throwable($$this)
  }
});
ScalaJS.i.s_util_control_NoStackTrace$class__$init$__s_util_control_NoStackTrace__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sc_BufferedIterator$class__$init$__sc_BufferedIterator__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sc_CustomParallelizable$class__$init$__sc_CustomParallelizable__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sc_GenIterable$class__$init$__sc_GenIterable__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sc_GenSeq$class__$init$__sc_GenSeq__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sc_GenSeqLike$class__equals__sc_GenSeqLike__O__Z = (function($$this, that) {
  var x1 = that;
  if (ScalaJS.is.sc_GenSeq(x1)) {
    var x2 = ScalaJS.as.sc_GenSeq(x1);
    return (x2.canEqual__O__Z($$this) && $$this.sameElements__sc_GenIterable__Z(x2))
  };
  return false
});
ScalaJS.i.sc_GenSeqLike$class__$init$__sc_GenSeqLike__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sc_GenTraversable$class__$init$__sc_GenTraversable__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sc_IndexedSeq$class__$init$__sc_IndexedSeq__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sc_IndexedSeqLike$class__hashCode__sc_IndexedSeqLike__I = (function($$this) {
  return ScalaJS.m.s_util_hashing_MurmurHash3().seqHash__sc_Seq__I($$this.seq__sc_IndexedSeq())
});
ScalaJS.i.sc_IndexedSeqLike$class__iterator__sc_IndexedSeqLike__sc_Iterator = (function($$this) {
  return new ScalaJS.c.sc_IndexedSeqLike$Elements().init___sc_IndexedSeqLike__I__I($$this, 0, $$this.length__I())
});
ScalaJS.i.sc_IndexedSeqLike$class__$init$__sc_IndexedSeqLike__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z = (function($$this) {
  return ($$this.length__I() === 0)
});
ScalaJS.i.sc_IndexedSeqOptimized$class__foreach__sc_IndexedSeqOptimized__F1__V = (function($$this, f) {
  var i = 0;
  var len = $$this.length__I();
  while ((i < len)) {
    f.apply__O__O($$this.apply__I__O(i));
    i = ((i + 1) | 0)
  }
});
ScalaJS.i.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z = (function($$this, that) {
  var x1 = that;
  if (ScalaJS.is.sc_IndexedSeq(x1)) {
    var x2 = ScalaJS.as.sc_IndexedSeq(x1);
    var len = $$this.length__I();
    if ((len === x2.length__I())) {
      var i = 0;
      while (((i < len) && ScalaJS.anyEqEq($$this.apply__I__O(i), x2.apply__I__O(i)))) {
        i = ((i + 1) | 0)
      };
      return (i === len)
    } else {
      return false
    }
  };
  return $$this.scala$collection$IndexedSeqOptimized$$super$sameElements__sc_GenIterable__Z(that)
});
ScalaJS.i.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I = (function($$this, len) {
  return (($$this.length__I() - len) | 0)
});
ScalaJS.i.sc_IndexedSeqOptimized$class__$init$__sc_IndexedSeqOptimized__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sc_Iterable$class__$init$__sc_Iterable__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sc_IterableLike$class__foreach__sc_IterableLike__F1__V = (function($$this, f) {
  $$this.iterator__sc_Iterator().foreach__F1__V(f)
});
ScalaJS.i.sc_IterableLike$class__sameElements__sc_IterableLike__sc_GenIterable__Z = (function($$this, that) {
  var these = $$this.iterator__sc_Iterator();
  var those = that.iterator__sc_Iterator();
  while ((these.hasNext__Z() && those.hasNext__Z())) {
    if ((!ScalaJS.anyEqEq(these.next__O(), those.next__O()))) {
      return false
    }
  };
  return ((!these.hasNext__Z()) && (!those.hasNext__Z()))
});
ScalaJS.i.sc_IterableLike$class__canEqual__sc_IterableLike__O__Z = (function($$this, that) {
  return true
});
ScalaJS.i.sc_IterableLike$class__$init$__sc_IterableLike__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sc_Iterator$class__isEmpty__sc_Iterator__Z = (function($$this) {
  return (!$$this.hasNext__Z())
});
ScalaJS.i.sc_Iterator$class__foreach__sc_Iterator__F1__V = (function($$this, f) {
  while ($$this.hasNext__Z()) {
    f.apply__O__O($$this.next__O())
  }
});
ScalaJS.i.sc_Iterator$class__toString__sc_Iterator__T = (function($$this) {
  if ($$this.hasNext__Z()) {
    var jsx$1 = "non-empty"
  } else {
    var jsx$1 = "empty"
  };
  return (jsx$1 + " iterator")
});
ScalaJS.i.sc_Iterator$class__$init$__sc_Iterator__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sc_LinearSeq$class__$init$__sc_LinearSeq__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sc_LinearSeqLike$class__hashCode__sc_LinearSeqLike__I = (function($$this) {
  return ScalaJS.m.s_util_hashing_MurmurHash3().seqHash__sc_Seq__I($$this.seq__sc_LinearSeq())
});
ScalaJS.i.sc_LinearSeqLike$class__iterator__sc_LinearSeqLike__sc_Iterator = (function($$this) {
  return new ScalaJS.c.sc_LinearSeqLike$$anon$1().init___sc_LinearSeqLike($$this)
});
ScalaJS.i.sc_LinearSeqLike$class__$init$__sc_LinearSeqLike__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sc_LinearSeqOptimized$class__length__sc_LinearSeqOptimized__I = (function($$this) {
  var these = $$this;
  var len = 0;
  while ((!these.isEmpty__Z())) {
    len = ((len + 1) | 0);
    these = ScalaJS.as.sc_LinearSeqOptimized(these.tail__O())
  };
  return len
});
ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O = (function($$this, n) {
  var rest = $$this.drop__I__sc_LinearSeqOptimized(n);
  if (((n < 0) || rest.isEmpty__Z())) {
    throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(("" + n))
  };
  return rest.head__O()
});
ScalaJS.i.sc_LinearSeqOptimized$class__foreach__sc_LinearSeqOptimized__F1__V = (function($$this, f) {
  var these = $$this;
  while ((!these.isEmpty__Z())) {
    f.apply__O__O(these.head__O());
    these = ScalaJS.as.sc_LinearSeqOptimized(these.tail__O())
  }
});
ScalaJS.i.sc_LinearSeqOptimized$class__drop__sc_LinearSeqOptimized__I__sc_LinearSeqOptimized = (function($$this, n) {
  var these = ScalaJS.as.sc_LinearSeqOptimized($$this.repr__O());
  var count = n;
  while (((!these.isEmpty__Z()) && (count > 0))) {
    these = ScalaJS.as.sc_LinearSeqOptimized(these.tail__O());
    count = ((count - 1) | 0)
  };
  return these
});
ScalaJS.i.sc_LinearSeqOptimized$class__sameElements__sc_LinearSeqOptimized__sc_GenIterable__Z = (function($$this, that) {
  var x1 = that;
  if (ScalaJS.is.sc_LinearSeq(x1)) {
    var x2 = ScalaJS.as.sc_LinearSeq(x1);
    var these = $$this;
    var those = x2;
    while ((((!these.isEmpty__Z()) && (!those.isEmpty__Z())) && ScalaJS.anyEqEq(these.head__O(), those.head__O()))) {
      these = ScalaJS.as.sc_LinearSeqOptimized(these.tail__O());
      those = ScalaJS.as.sc_LinearSeq(those.tail__O())
    };
    return (these.isEmpty__Z() && those.isEmpty__Z())
  };
  return $$this.scala$collection$LinearSeqOptimized$$super$sameElements__sc_GenIterable__Z(that)
});
ScalaJS.i.sc_LinearSeqOptimized$class__lengthCompare__sc_LinearSeqOptimized__I__I = (function($$this, len) {
  if ((len < 0)) {
    return 1
  } else {
    return ScalaJS.i.sc_LinearSeqOptimized$class__loop$1__sc_LinearSeqOptimized__I__sc_LinearSeqOptimized__I__I($$this, 0, $$this, len)
  }
});
ScalaJS.i.sc_LinearSeqOptimized$class__loop$1__sc_LinearSeqOptimized__I__sc_LinearSeqOptimized__I__I = (function($$this, i, xs, len$1) {
  tailCallLoop: while (true) {
    if ((i === len$1)) {
      if (xs.isEmpty__Z()) {
        return 0
      } else {
        return 1
      }
    } else {
      if (xs.isEmpty__Z()) {
        return -1
      } else {
        var temp$i = ((i + 1) | 0);
        var temp$xs = ScalaJS.as.sc_LinearSeqOptimized(xs.tail__O());
        i = temp$i;
        xs = temp$xs;
        continue tailCallLoop
      }
    }
  }
});
ScalaJS.i.sc_LinearSeqOptimized$class__$init$__sc_LinearSeqOptimized__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sc_Parallelizable$class__$init$__sc_Parallelizable__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sc_Seq$class__$init$__sc_Seq__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sc_SeqLike$class__lengthCompare__sc_SeqLike__I__I = (function($$this, len) {
  if ((len < 0)) {
    return 1
  } else {
    var i = 0;
    var it = $$this.iterator__sc_Iterator();
    while (it.hasNext__Z()) {
      if ((i === len)) {
        if (it.hasNext__Z()) {
          return 1
        } else {
          return 0
        }
      };
      it.next__O();
      i = ((i + 1) | 0)
    };
    return ((i - len) | 0)
  }
});
ScalaJS.i.sc_SeqLike$class__isEmpty__sc_SeqLike__Z = (function($$this) {
  return ($$this.lengthCompare__I__I(0) === 0)
});
ScalaJS.i.sc_SeqLike$class__size__sc_SeqLike__I = (function($$this) {
  return $$this.length__I()
});
ScalaJS.i.sc_SeqLike$class__toString__sc_SeqLike__T = (function($$this) {
  return ScalaJS.i.sc_TraversableLike$class__toString__sc_TraversableLike__T($$this)
});
ScalaJS.i.sc_SeqLike$class__$init$__sc_SeqLike__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sc_Traversable$class__$init$__sc_Traversable__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sc_TraversableLike$class__repr__sc_TraversableLike__O = (function($$this) {
  return $$this
});
ScalaJS.i.sc_TraversableLike$class__toString__sc_TraversableLike__T = (function($$this) {
  return $$this.mkString__T__T__T__T(($$this.stringPrefix__T() + "("), ", ", ")")
});
ScalaJS.i.sc_TraversableLike$class__stringPrefix__sc_TraversableLike__T = (function($$this) {
  var string = ScalaJS.objectGetClass($$this.repr__O()).getName__T();
  var idx1 = ScalaJS.i.sjsr_RuntimeString$class__lastIndexOf__sjsr_RuntimeString__I__I(string, 46);
  if ((idx1 !== -1)) {
    string = ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__T(string, ((idx1 + 1) | 0))
  };
  var idx2 = ScalaJS.i.sjsr_RuntimeString$class__indexOf__sjsr_RuntimeString__I__I(string, 36);
  if ((idx2 !== -1)) {
    string = ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__I__T(string, 0, idx2)
  };
  return string
});
ScalaJS.i.sc_TraversableLike$class__$init$__sc_TraversableLike__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sc_TraversableOnce$class__nonEmpty__sc_TraversableOnce__Z = (function($$this) {
  return (!$$this.isEmpty__Z())
});
ScalaJS.i.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T = (function($$this, start, sep, end) {
  return $$this.addString__scm_StringBuilder__T__T__T__scm_StringBuilder(new ScalaJS.c.scm_StringBuilder().init___(), start, sep, end).toString__T()
});
ScalaJS.i.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder = (function($$this, b, start, sep, end) {
  var first = ScalaJS.m.sr_BooleanRef().create__Z__sr_BooleanRef(true);
  b.append__T__scm_StringBuilder(start);
  $$this.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(x$2) {
    var x = ScalaJS.as.O(x$2);
    return ScalaJS.i.sc_TraversableOnce$class__$anonfun$16__sc_TraversableOnce__O__sr_BooleanRef__scm_StringBuilder__T__O($$this, x, first, b, sep)
  })));
  b.append__T__scm_StringBuilder(end);
  return b
});
ScalaJS.i.sc_TraversableOnce$class__$anonfun$16__sc_TraversableOnce__O__sr_BooleanRef__scm_StringBuilder__T__O = (function($$this, x, first$4, b$2, sep$1) {
  if (first$4.elem$1) {
    b$2.append__O__scm_StringBuilder(x);
    first$4.elem$1 = false;
    return undefined
  } else {
    b$2.append__T__scm_StringBuilder(sep$1);
    return b$2.append__O__scm_StringBuilder(x)
  }
});
ScalaJS.i.sc_TraversableOnce$class__$init$__sc_TraversableOnce__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.scg_GenericTraversableTemplate$class__$init$__scg_GenericTraversableTemplate__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.scg_Growable$class__$init$__scg_Growable__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sci_IndexedSeq$class__seq__sci_IndexedSeq__sci_IndexedSeq = (function($$this) {
  return $$this
});
ScalaJS.i.sci_IndexedSeq$class__$init$__sci_IndexedSeq__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sci_Iterable$class__$init$__sci_Iterable__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sci_LinearSeq$class__seq__sci_LinearSeq__sci_LinearSeq = (function($$this) {
  return $$this
});
ScalaJS.i.sci_LinearSeq$class__$init$__sci_LinearSeq__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sci_Seq$class__$init$__sci_Seq__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sci_StringLike$class__apply__sci_StringLike__I__C = (function($$this, n) {
  return ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C($$this.toString__T(), n)
});
ScalaJS.i.sci_StringLike$class__toInt__sci_StringLike__I = (function($$this) {
  return ScalaJS.m.jl_Integer().parseInt__T__I($$this.toString__T())
});
ScalaJS.i.sci_StringLike$class__$init$__sci_StringLike__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sci_Traversable$class__$init$__sci_Traversable__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sci_VectorPointer$class__initFrom__sci_VectorPointer__sci_VectorPointer__V = (function($$this, that) {
  $$this.initFrom__sci_VectorPointer__I__V(that, that.depth__I())
});
ScalaJS.i.sci_VectorPointer$class__initFrom__sci_VectorPointer__sci_VectorPointer__I__V = (function($$this, that, depth) {
  $$this.depth$und$eq__I__V(depth);
  var x1 = ((depth - 1) | 0);
  switch (x1) {
    case -1:
      break;
    case 0:
      {
        $$this.display0$und$eq__AO__V(that.display0__AO());
        break
      };
    case 1:
      {
        $$this.display1$und$eq__AO__V(that.display1__AO());
        $$this.display0$und$eq__AO__V(that.display0__AO());
        break
      };
    case 2:
      {
        $$this.display2$und$eq__AO__V(that.display2__AO());
        $$this.display1$und$eq__AO__V(that.display1__AO());
        $$this.display0$und$eq__AO__V(that.display0__AO());
        break
      };
    case 3:
      {
        $$this.display3$und$eq__AO__V(that.display3__AO());
        $$this.display2$und$eq__AO__V(that.display2__AO());
        $$this.display1$und$eq__AO__V(that.display1__AO());
        $$this.display0$und$eq__AO__V(that.display0__AO());
        break
      };
    case 4:
      {
        $$this.display4$und$eq__AO__V(that.display4__AO());
        $$this.display3$und$eq__AO__V(that.display3__AO());
        $$this.display2$und$eq__AO__V(that.display2__AO());
        $$this.display1$und$eq__AO__V(that.display1__AO());
        $$this.display0$und$eq__AO__V(that.display0__AO());
        break
      };
    case 5:
      {
        $$this.display5$und$eq__AO__V(that.display5__AO());
        $$this.display4$und$eq__AO__V(that.display4__AO());
        $$this.display3$und$eq__AO__V(that.display3__AO());
        $$this.display2$und$eq__AO__V(that.display2__AO());
        $$this.display1$und$eq__AO__V(that.display1__AO());
        $$this.display0$und$eq__AO__V(that.display0__AO());
        break
      };
    default:
      throw new ScalaJS.c.s_MatchError().init___O(x1);
  }
});
ScalaJS.i.sci_VectorPointer$class__getElem__sci_VectorPointer__I__I__O = (function($$this, index, xor) {
  if ((xor < 32)) {
    return $$this.display0__AO().u[(index & 31)]
  } else {
    if ((xor < 1024)) {
      return ScalaJS.asArrayOf.O($$this.display1__AO().u[((index >> 5) & 31)], 1).u[(index & 31)]
    } else {
      if ((xor < 32768)) {
        return ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O($$this.display2__AO().u[((index >> 10) & 31)], 1).u[((index >> 5) & 31)], 1).u[(index & 31)]
      } else {
        if ((xor < 1048576)) {
          return ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O($$this.display3__AO().u[((index >> 15) & 31)], 1).u[((index >> 10) & 31)], 1).u[((index >> 5) & 31)], 1).u[(index & 31)]
        } else {
          if ((xor < 33554432)) {
            return ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O($$this.display4__AO().u[((index >> 20) & 31)], 1).u[((index >> 15) & 31)], 1).u[((index >> 10) & 31)], 1).u[((index >> 5) & 31)], 1).u[(index & 31)]
          } else {
            if ((xor < 1073741824)) {
              return ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O(ScalaJS.asArrayOf.O($$this.display5__AO().u[((index >> 25) & 31)], 1).u[((index >> 20) & 31)], 1).u[((index >> 15) & 31)], 1).u[((index >> 10) & 31)], 1).u[((index >> 5) & 31)], 1).u[(index & 31)]
            } else {
              throw new ScalaJS.c.jl_IllegalArgumentException().init___()
            }
          }
        }
      }
    }
  }
});
ScalaJS.i.sci_VectorPointer$class__gotoPos__sci_VectorPointer__I__I__V = (function($$this, index, xor) {
  if ((xor < 32)) {
    /*<skip>*/
  } else {
    if ((xor < 1024)) {
      $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[((index >> 5) & 31)], 1))
    } else {
      if ((xor < 32768)) {
        $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[((index >> 10) & 31)], 1));
        $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[((index >> 5) & 31)], 1))
      } else {
        if ((xor < 1048576)) {
          $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[((index >> 15) & 31)], 1));
          $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[((index >> 10) & 31)], 1));
          $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[((index >> 5) & 31)], 1))
        } else {
          if ((xor < 33554432)) {
            $$this.display3$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display4__AO().u[((index >> 20) & 31)], 1));
            $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[((index >> 15) & 31)], 1));
            $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[((index >> 10) & 31)], 1));
            $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[((index >> 5) & 31)], 1))
          } else {
            if ((xor < 1073741824)) {
              $$this.display4$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display5__AO().u[((index >> 25) & 31)], 1));
              $$this.display3$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display4__AO().u[((index >> 20) & 31)], 1));
              $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[((index >> 15) & 31)], 1));
              $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[((index >> 10) & 31)], 1));
              $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[((index >> 5) & 31)], 1))
            } else {
              throw new ScalaJS.c.jl_IllegalArgumentException().init___()
            }
          }
        }
      }
    }
  }
});
ScalaJS.i.sci_VectorPointer$class__gotoNextBlockStart__sci_VectorPointer__I__I__V = (function($$this, index, xor) {
  if ((xor < 1024)) {
    $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[((index >> 5) & 31)], 1))
  } else {
    if ((xor < 32768)) {
      $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[((index >> 10) & 31)], 1));
      $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[0], 1))
    } else {
      if ((xor < 1048576)) {
        $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[((index >> 15) & 31)], 1));
        $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[0], 1));
        $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[0], 1))
      } else {
        if ((xor < 33554432)) {
          $$this.display3$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display4__AO().u[((index >> 20) & 31)], 1));
          $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[0], 1));
          $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[0], 1));
          $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[0], 1))
        } else {
          if ((xor < 1073741824)) {
            $$this.display4$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display5__AO().u[((index >> 25) & 31)], 1));
            $$this.display3$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display4__AO().u[0], 1));
            $$this.display2$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display3__AO().u[0], 1));
            $$this.display1$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display2__AO().u[0], 1));
            $$this.display0$und$eq__AO__V(ScalaJS.asArrayOf.O($$this.display1__AO().u[0], 1))
          } else {
            throw new ScalaJS.c.jl_IllegalArgumentException().init___()
          }
        }
      }
    }
  }
});
ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO = (function($$this, a) {
  if ((a === null)) {
    ScalaJS.m.s_Predef().println__O__V("NULL")
  };
  var b = ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [a.u["length"]]);
  ScalaJS.m.s_compat_Platform().arraycopy__O__I__O__I__I__V(a, 0, b, 0, a.u["length"]);
  return b
});
ScalaJS.i.sci_VectorPointer$class__stabilize__sci_VectorPointer__I__V = (function($$this, index) {
  var x1 = (($$this.depth__I() - 1) | 0);
  switch (x1) {
    case 5:
      {
        $$this.display5$und$eq__AO__V($$this.copyOf__AO__AO($$this.display5__AO()));
        $$this.display4$und$eq__AO__V($$this.copyOf__AO__AO($$this.display4__AO()));
        $$this.display3$und$eq__AO__V($$this.copyOf__AO__AO($$this.display3__AO()));
        $$this.display2$und$eq__AO__V($$this.copyOf__AO__AO($$this.display2__AO()));
        $$this.display1$und$eq__AO__V($$this.copyOf__AO__AO($$this.display1__AO()));
        $$this.display5__AO().u[((index >> 25) & 31)] = $$this.display4__AO();
        $$this.display4__AO().u[((index >> 20) & 31)] = $$this.display3__AO();
        $$this.display3__AO().u[((index >> 15) & 31)] = $$this.display2__AO();
        $$this.display2__AO().u[((index >> 10) & 31)] = $$this.display1__AO();
        $$this.display1__AO().u[((index >> 5) & 31)] = $$this.display0__AO();
        break
      };
    case 4:
      {
        $$this.display4$und$eq__AO__V($$this.copyOf__AO__AO($$this.display4__AO()));
        $$this.display3$und$eq__AO__V($$this.copyOf__AO__AO($$this.display3__AO()));
        $$this.display2$und$eq__AO__V($$this.copyOf__AO__AO($$this.display2__AO()));
        $$this.display1$und$eq__AO__V($$this.copyOf__AO__AO($$this.display1__AO()));
        $$this.display4__AO().u[((index >> 20) & 31)] = $$this.display3__AO();
        $$this.display3__AO().u[((index >> 15) & 31)] = $$this.display2__AO();
        $$this.display2__AO().u[((index >> 10) & 31)] = $$this.display1__AO();
        $$this.display1__AO().u[((index >> 5) & 31)] = $$this.display0__AO();
        break
      };
    case 3:
      {
        $$this.display3$und$eq__AO__V($$this.copyOf__AO__AO($$this.display3__AO()));
        $$this.display2$und$eq__AO__V($$this.copyOf__AO__AO($$this.display2__AO()));
        $$this.display1$und$eq__AO__V($$this.copyOf__AO__AO($$this.display1__AO()));
        $$this.display3__AO().u[((index >> 15) & 31)] = $$this.display2__AO();
        $$this.display2__AO().u[((index >> 10) & 31)] = $$this.display1__AO();
        $$this.display1__AO().u[((index >> 5) & 31)] = $$this.display0__AO();
        break
      };
    case 2:
      {
        $$this.display2$und$eq__AO__V($$this.copyOf__AO__AO($$this.display2__AO()));
        $$this.display1$und$eq__AO__V($$this.copyOf__AO__AO($$this.display1__AO()));
        $$this.display2__AO().u[((index >> 10) & 31)] = $$this.display1__AO();
        $$this.display1__AO().u[((index >> 5) & 31)] = $$this.display0__AO();
        break
      };
    case 1:
      {
        $$this.display1$und$eq__AO__V($$this.copyOf__AO__AO($$this.display1__AO()));
        $$this.display1__AO().u[((index >> 5) & 31)] = $$this.display0__AO();
        break
      };
    case 0:
      break;
    default:
      throw new ScalaJS.c.s_MatchError().init___O(x1);
  }
});
ScalaJS.i.sci_VectorPointer$class__$init$__sci_VectorPointer__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.scm_ArrayLike$class__$init$__scm_ArrayLike__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.scm_Builder$class__$init$__scm_Builder__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.scm_Cloneable$class__$init$__scm_Cloneable__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.scm_IndexedSeq$class__seq__scm_IndexedSeq__scm_IndexedSeq = (function($$this) {
  return $$this
});
ScalaJS.i.scm_IndexedSeq$class__$init$__scm_IndexedSeq__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.scm_IndexedSeqLike$class__$init$__scm_IndexedSeqLike__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.scm_Iterable$class__$init$__scm_Iterable__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.scm_LinearSeq$class__seq__scm_LinearSeq__scm_LinearSeq = (function($$this) {
  return $$this
});
ScalaJS.i.scm_LinearSeq$class__$init$__scm_LinearSeq__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.scm_LinkedListLike$class__isEmpty__scm_LinkedListLike__Z = (function($$this) {
  return ($$this.next__scm_Seq() === $$this)
});
ScalaJS.i.scm_LinkedListLike$class__length__scm_LinkedListLike__I = (function($$this) {
  return ScalaJS.i.scm_LinkedListLike$class__length0__scm_LinkedListLike__scm_Seq__I__I($$this, ScalaJS.as.scm_Seq($$this.repr__O()), 0)
});
ScalaJS.i.scm_LinkedListLike$class__length0__scm_LinkedListLike__scm_Seq__I__I = (function($$this, elem, acc) {
  tailCallLoop: while (true) {
    if (ScalaJS.as.scm_LinkedListLike(elem).isEmpty__Z()) {
      return acc
    } else {
      var temp$elem = ScalaJS.as.scm_LinkedListLike(elem).next__scm_Seq();
      var temp$acc = ((acc + 1) | 0);
      elem = temp$elem;
      acc = temp$acc;
      continue tailCallLoop
    }
  }
});
ScalaJS.i.scm_LinkedListLike$class__head__scm_LinkedListLike__O = (function($$this) {
  if ($$this.isEmpty__Z()) {
    throw new ScalaJS.c.ju_NoSuchElementException().init___()
  } else {
    return $$this.elem__O()
  }
});
ScalaJS.i.scm_LinkedListLike$class__tail__scm_LinkedListLike__scm_Seq = (function($$this) {
  ScalaJS.m.s_Predef().require__Z__F0__V($$this.nonEmpty__Z(), new ScalaJS.c.sjsr_AnonFunction0().init___sjs_js_Function0((function() {
    return ScalaJS.i.scm_LinkedListLike$class__$anonfun$1__scm_LinkedListLike__T($$this)
  })));
  return $$this.next__scm_Seq()
});
ScalaJS.i.scm_LinkedListLike$class__drop__scm_LinkedListLike__I__scm_Seq = (function($$this, n) {
  var i = 0;
  var these = ScalaJS.as.scm_Seq($$this.repr__O());
  while (((i < n) && (!ScalaJS.as.scm_LinkedListLike(these).isEmpty__Z()))) {
    these = ScalaJS.as.scm_LinkedListLike(these).next__scm_Seq();
    i = ((i + 1) | 0)
  };
  return these
});
ScalaJS.i.scm_LinkedListLike$class__atLocation__scm_LinkedListLike__I__F1__O = (function($$this, n, f) {
  var loc = $$this.drop__I__scm_Seq(n);
  if (loc.nonEmpty__Z()) {
    return f.apply__O__O(loc)
  } else {
    throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(n))
  }
});
ScalaJS.i.scm_LinkedListLike$class__apply__scm_LinkedListLike__I__O = (function($$this, n) {
  return ScalaJS.i.scm_LinkedListLike$class__atLocation__scm_LinkedListLike__I__F1__O($$this, n, new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(x$1$2) {
    var x$1 = ScalaJS.as.scm_Seq(x$1$2);
    return ScalaJS.i.scm_LinkedListLike$class__$anonfun$3__scm_LinkedListLike__scm_Seq__O($$this, x$1)
  })))
});
ScalaJS.i.scm_LinkedListLike$class__iterator__scm_LinkedListLike__sc_Iterator = (function($$this) {
  return new ScalaJS.c.scm_LinkedListLike$$anon$1().init___scm_LinkedListLike($$this)
});
ScalaJS.i.scm_LinkedListLike$class__foreach__scm_LinkedListLike__F1__V = (function($$this, f) {
  var these = $$this;
  while (these.nonEmpty__Z()) {
    f.apply__O__O(these.elem__O());
    these = ScalaJS.as.scm_LinkedListLike(these.next__scm_Seq())
  }
});
ScalaJS.i.scm_LinkedListLike$class__$anonfun$1__scm_LinkedListLike__T = (function($$this) {
  return "tail of empty list"
});
ScalaJS.i.scm_LinkedListLike$class__$anonfun$3__scm_LinkedListLike__scm_Seq__O = (function($$this, x$1) {
  return ScalaJS.as.scm_LinkedListLike(x$1).elem__O()
});
ScalaJS.i.scm_LinkedListLike$class__$init$__scm_LinkedListLike__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.scm_Seq$class__$init$__scm_Seq__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.scm_SeqLike$class__$init$__scm_SeqLike__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.scm_Traversable$class__$init$__scm_Traversable__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sjs_js_LowPrioAnyImplicits$class__$init$__sjs_js_LowPrioAnyImplicits__V = (function($$this) {
  /*<skip>*/
});
ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C = (function($$this, index) {
  return (ScalaJS.uD($$this["charCodeAt"](index)) & 65535)
});
ScalaJS.i.sjsr_RuntimeString$class__indexOf__sjsr_RuntimeString__I__I = (function($$this, ch) {
  var search = ScalaJS.as.T(ScalaJS.applyMethodWithVarargs(ScalaJS.g["String"], "fromCharCode", ScalaJS.m.sjs_js_Any().fromTraversableOnce__sc_TraversableOnce__sjs_js_Array(ScalaJS.m.s_Predef().wrapIntArray__AI__scm_WrappedArray(ScalaJS.makeNativeArrayWrapper(ScalaJS.d.I.getArrayOf(), [ch])))));
  return (ScalaJS.uD($$this["indexOf"](search)) | 0)
});
ScalaJS.i.sjsr_RuntimeString$class__indexOf__sjsr_RuntimeString__T__I = (function($$this, str) {
  return (ScalaJS.uD($$this["indexOf"](str)) | 0)
});
ScalaJS.i.sjsr_RuntimeString$class__isEmpty__sjsr_RuntimeString__Z = (function($$this) {
  return ((ScalaJS.uD($$this["length"]) | 0) === 0)
});
ScalaJS.i.sjsr_RuntimeString$class__lastIndexOf__sjsr_RuntimeString__I__I = (function($$this, ch) {
  var search = ScalaJS.as.T(ScalaJS.applyMethodWithVarargs(ScalaJS.g["String"], "fromCharCode", ScalaJS.m.sjs_js_Any().fromTraversableOnce__sc_TraversableOnce__sjs_js_Array(ScalaJS.m.s_Predef().wrapIntArray__AI__scm_WrappedArray(ScalaJS.makeNativeArrayWrapper(ScalaJS.d.I.getArrayOf(), [ch])))));
  return (ScalaJS.uD($$this["lastIndexOf"](search)) | 0)
});
ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I = (function($$this) {
  return (ScalaJS.uD($$this["length"]) | 0)
});
ScalaJS.i.sjsr_RuntimeString$class__replace__sjsr_RuntimeString__jl_CharSequence__jl_CharSequence__T = (function($$this, target, replacement) {
  return ScalaJS.as.T($$this["split"](ScalaJS.objectToString(target))["join"](ScalaJS.objectToString(replacement)))
});
ScalaJS.i.sjsr_RuntimeString$class__split__sjsr_RuntimeString__T__AT = (function($$this, regex) {
  return ScalaJS.i.sjsr_RuntimeString$class__split__sjsr_RuntimeString__T__I__AT(ScalaJS.as.T($$this), regex, 0)
});
ScalaJS.i.sjsr_RuntimeString$class__split__sjsr_RuntimeString__T__I__AT = (function($$this, regex, limit) {
  var pat = ScalaJS.m.ju_regex_Pattern().compile__T__ju_regex_Pattern(regex);
  return pat.split__jl_CharSequence__I__AT(ScalaJS.as.T($$this), limit)
});
ScalaJS.i.sjsr_RuntimeString$class__startsWith__sjsr_RuntimeString__T__Z = (function($$this, prefix) {
  return ScalaJS.i.sjsr_RuntimeString$class__startsWith__sjsr_RuntimeString__T__I__Z(ScalaJS.as.T($$this), prefix, 0)
});
ScalaJS.i.sjsr_RuntimeString$class__startsWith__sjsr_RuntimeString__T__I__Z = (function($$this, prefix, toffset) {
  return (prefix === $$this["substring"](toffset, ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I(prefix)))
});
ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__T = (function($$this, beginIndex) {
  return ScalaJS.as.T($$this["substring"](beginIndex))
});
ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__I__T = (function($$this, beginIndex, endIndex) {
  return ScalaJS.as.T($$this["substring"](beginIndex, endIndex))
});
/** @constructor */
ScalaJS.c.Lexample_SodexoResult = (function() {
  ScalaJS.c.O.call(this);
  this.occupancyRate$1 = 0;
  this.availableSeats$1 = 0;
  this.percent$1 = 0;
  this.placesDispo$1 = 0
});
ScalaJS.c.Lexample_SodexoResult.prototype = new ScalaJS.h.O();
ScalaJS.c.Lexample_SodexoResult.prototype.constructor = ScalaJS.c.Lexample_SodexoResult;
/** @constructor */
ScalaJS.h.Lexample_SodexoResult = (function() {
  /*<skip>*/
});
ScalaJS.h.Lexample_SodexoResult.prototype = ScalaJS.c.Lexample_SodexoResult.prototype;
ScalaJS.c.Lexample_SodexoResult.prototype.occupancyRate__I = (function() {
  return this.occupancyRate$1
});
ScalaJS.c.Lexample_SodexoResult.prototype.availableSeats__I = (function() {
  return this.availableSeats$1
});
ScalaJS.c.Lexample_SodexoResult.prototype.percent__I = (function() {
  return this.percent$1
});
ScalaJS.c.Lexample_SodexoResult.prototype.placesDispo__I = (function() {
  return this.placesDispo$1
});
ScalaJS.c.Lexample_SodexoResult.prototype.productPrefix__T = (function() {
  return "SodexoResult"
});
ScalaJS.c.Lexample_SodexoResult.prototype.productArity__I = (function() {
  return 2
});
ScalaJS.c.Lexample_SodexoResult.prototype.productElement__I__O = (function(x$1) {
  var x1 = x$1;
  switch (x1) {
    case 0:
      {
        return this.occupancyRate__I();
        break
      };
    case 1:
      {
        return this.availableSeats__I();
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lexample_SodexoResult.prototype.productIterator__sc_Iterator = (function() {
  return ScalaJS.m.sr_ScalaRunTime().typedProductIterator__s_Product__sc_Iterator(this)
});
ScalaJS.c.Lexample_SodexoResult.prototype.canEqual__O__Z = (function(x$1) {
  return ScalaJS.is.Lexample_SodexoResult(x$1)
});
ScalaJS.c.Lexample_SodexoResult.prototype.hashCode__I = (function() {
  var acc = -889275714;
  acc = ScalaJS.m.sr_Statics().mix__I__I__I(acc, this.occupancyRate__I());
  acc = ScalaJS.m.sr_Statics().mix__I__I__I(acc, this.availableSeats__I());
  return ScalaJS.m.sr_Statics().finalizeHash__I__I__I(acc, 2)
});
ScalaJS.c.Lexample_SodexoResult.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.Lexample_SodexoResult.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else {
    var x1 = x$1;
    matchEnd4: {
      if (ScalaJS.is.Lexample_SodexoResult(x1)) {
        var jsx$1 = true;
        break matchEnd4
      };
      var jsx$1 = false;
      break matchEnd4
    };
    if (jsx$1) {
      var SodexoResult$1 = ScalaJS.as.Lexample_SodexoResult(x$1);
      return (((this.occupancyRate__I() === SodexoResult$1.occupancyRate__I()) && (this.availableSeats__I() === SodexoResult$1.availableSeats__I())) && SodexoResult$1.canEqual__O__Z(this))
    } else {
      return false
    }
  }
});
ScalaJS.c.Lexample_SodexoResult.prototype.init___I__I = (function(occupancyRate, availableSeats) {
  this.occupancyRate$1 = occupancyRate;
  this.availableSeats$1 = availableSeats;
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.i.s_Product$class__$init$__s_Product__V(this);
  var x1 = occupancyRate;
  switch (x1) {
    default:
      if ((x1 <= 0)) {
        var jsx$1 = 0
      } else {
        if ((x1 >= 100)) {
          var jsx$1 = 100
        } else {
          var jsx$1 = occupancyRate
        }
      };
  };
  this.percent$1 = jsx$1;
  var x1$2 = availableSeats;
  switch (x1$2) {
    default:
      if ((x1$2 <= 0)) {
        var jsx$2 = 0
      } else {
        var jsx$2 = availableSeats
      };
  };
  this.placesDispo$1 = jsx$2;
  return this
});
/*<skip>*/;
ScalaJS.is.Lexample_SodexoResult = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lexample_SodexoResult)))
});
ScalaJS.as.Lexample_SodexoResult = (function(obj) {
  if ((ScalaJS.is.Lexample_SodexoResult(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "example.SodexoResult")
  }
});
ScalaJS.isArrayOf.Lexample_SodexoResult = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lexample_SodexoResult)))
});
ScalaJS.asArrayOf.Lexample_SodexoResult = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.Lexample_SodexoResult(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lexample.SodexoResult;", depth)
  }
});
ScalaJS.d.Lexample_SodexoResult = new ScalaJS.ClassTypeData({
  Lexample_SodexoResult: 0
}, false, "example.SodexoResult", ScalaJS.d.O, {
  Lexample_SodexoResult: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.Lexample_SodexoResult.prototype.$classData = ScalaJS.d.Lexample_SodexoResult;
/*<skip>*/;
/** @constructor */
ScalaJS.c.Lexample_SodexoWatcher$ = (function() {
  ScalaJS.c.O.call(this);
  this.COLOR0$1 = null;
  this.COLOR50$1 = null;
  this.COLOR51$1 = null;
  this.COLOR100$1 = null;
  this.DEFAULT$undURL$1 = null;
  this.lastSelectedUrl$1 = null;
  this.lastIntervalTimer$1 = 0;
  this.resultQueue$1 = null
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype = new ScalaJS.h.O();
ScalaJS.c.Lexample_SodexoWatcher$.prototype.constructor = ScalaJS.c.Lexample_SodexoWatcher$;
/** @constructor */
ScalaJS.h.Lexample_SodexoWatcher$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lexample_SodexoWatcher$.prototype = ScalaJS.c.Lexample_SodexoWatcher$.prototype;
ScalaJS.c.Lexample_SodexoWatcher$.prototype.mobile__sjs_js_Dynamic = (function() {
  return ScalaJS.g["$"]["mobile"]
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.Color__sjs_js_Dynamic = (function() {
  return ScalaJS.g["net"]["brehaut"]["Color"]
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.COLOR0__sjs_js_Dynamic = (function() {
  return this.COLOR0$1
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.COLOR50__sjs_js_Dynamic = (function() {
  return this.COLOR50$1
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.COLOR51__sjs_js_Dynamic = (function() {
  return this.COLOR51$1
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.COLOR100__sjs_js_Dynamic = (function() {
  return this.COLOR100$1
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.DEFAULT$undURL__T = (function() {
  return this.DEFAULT$undURL$1
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.lastSelectedUrl__T = (function() {
  return this.lastSelectedUrl$1
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.lastSelectedUrl$und$eq__T__V = (function(x$1) {
  this.lastSelectedUrl$1 = x$1
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.lastIntervalTimer__I = (function() {
  return this.lastIntervalTimer$1
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.lastIntervalTimer$und$eq__I__V = (function(x$1) {
  this.lastIntervalTimer$1 = x$1
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.resultQueue__scm_Queue = (function() {
  return this.resultQueue$1
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.example$SodexoWatcher$$storeResult__I__V = (function(perc) {
  this.resultQueue__scm_Queue().$$plus$eq__O__scm_MutableList(perc);
  if ((this.resultQueue__scm_Queue().size__I() > 4)) {
    this.resultQueue__scm_Queue().dequeue__O()
  }
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.example$SodexoWatcher$$actualize__T__V = (function(currentUrl) {
  if ((!ScalaJS.i.sjsr_RuntimeString$class__startsWith__sjsr_RuntimeString__T__Z(currentUrl, "http"))) {
    var randomResult = this.buildMockSodexoResult__p1__Lexample_SodexoResult();
    this.example$SodexoWatcher$$changeProgressBar__Lexample_SodexoResult__V(randomResult);
    this.example$SodexoWatcher$$storeResult__I__V(randomResult.percent__I());
    this.mobile__sjs_js_Dynamic()["loading"]("hide")
  } else {
    var x$1 = currentUrl;
    var x$2 = 60;
    var x$3 = ScalaJS.m.Lorg_scalajs_dom_extensions_Ajax().get$default$2__T();
    var x$4 = ScalaJS.m.Lorg_scalajs_dom_extensions_Ajax().get$default$4__sc_Seq();
    var x$5 = ScalaJS.m.Lorg_scalajs_dom_extensions_Ajax().get$default$5__Z();
    var jsx$1 = ScalaJS.m.Lorg_scalajs_dom_extensions_Ajax().get__T__T__I__sc_Seq__Z__s_concurrent_Future(x$1, x$3, x$2, x$4, x$5);
    jsx$1.onComplete__F1__s_concurrent_ExecutionContext__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function() {
      return (function(x0$1$2) {
        var x0$1 = ScalaJS.as.s_util_Try(x0$1$2);
        var x1 = x0$1;
        if (ScalaJS.is.s_util_Success(x1)) {
          var x2 = ScalaJS.as.s_util_Success(x1);
          var data = x2.value__O();
          if ((data !== null)) {
            var x4 = data;
            var jqData = ScalaJS.protect(ScalaJS.g["jQuery"])(ScalaJS.as.T(x4["responseText"]));
            var percentStr = ScalaJS.i.sjsr_RuntimeString$class__replace__sjsr_RuntimeString__jl_CharSequence__jl_CharSequence__T(ScalaJS.as.T(jqData["find"]("span.pourcentage")["text"]()), "%", "");
            var placesDispoStr = ScalaJS.as.T(jqData["find"]("div.litPlacesDispo")["text"]());
            var placesDispoTextArray = ScalaJS.i.sjsr_RuntimeString$class__split__sjsr_RuntimeString__T__AT(placesDispoStr, " ");
            var placesDispoInt = new ScalaJS.c.sci_StringOps().init___T(ScalaJS.m.s_Predef().augmentString__T__T(placesDispoTextArray.u[1])).toInt__I();
            var pourcentage = new ScalaJS.c.sci_StringOps().init___T(ScalaJS.m.s_Predef().augmentString__T__T(percentStr)).toInt__I();
            ScalaJS.m.Lexample_SodexoWatcher().example$SodexoWatcher$$changeProgressBar__Lexample_SodexoResult__V(new ScalaJS.c.Lexample_SodexoResult().init___I__I(pourcentage, placesDispoInt));
            ScalaJS.m.Lexample_SodexoWatcher().example$SodexoWatcher$$storeResult__I__V(pourcentage);
            return ScalaJS.m.Lexample_SodexoWatcher().mobile__sjs_js_Dynamic()["loading"]("hide")
          }
        };
        if (ScalaJS.is.s_util_Failure(x1)) {
          var x3 = ScalaJS.as.s_util_Failure(x1);
          var f = x3.exception__jl_Throwable();
          ScalaJS.m.Lexample_SodexoWatcher().example$SodexoWatcher$$showPopupMessage__T__sjs_js_Dynamic(("Erreur r\u00e9seau " + f));
          return ScalaJS.m.Lexample_SodexoWatcher().mobile__sjs_js_Dynamic()["loading"]("hide")
        };
        throw new ScalaJS.c.s_MatchError().init___O(x1)
      })
    })()), ScalaJS.m.sjs_concurrent_JSExecutionContext$Implicits().queue__s_concurrent_ExecutionContext())
  };
  ScalaJS.g["console"]["log"](("" + this.resultQueue__scm_Queue().toString__T()))
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.example$SodexoWatcher$$actualize$default$1__T = (function() {
  return this.DEFAULT$undURL__T()
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.buildMockSodexoResult__p1__Lexample_SodexoResult = (function() {
  var mockPercent = ScalaJS.m.s_util_Random().nextInt__I__I(100);
  var placesDispo = ((120 - (((mockPercent / 100.0) * 120) | 0)) | 0);
  return new ScalaJS.c.Lexample_SodexoResult().init___I__I(mockPercent, placesDispo)
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.example$SodexoWatcher$$changeProgressBar__Lexample_SodexoResult__V = (function(res) {
  ScalaJS.protect(ScalaJS.g["jQuery"])("#percentBar")["attr"]("style", this.getBackgroundGradientAdjusted__p1__I__T(res.percent__I()));
  var jsx$2 = ScalaJS.protect(ScalaJS.g["jQuery"])("#percentage");
  var x1 = res.placesDispo__I();
  switch (x1) {
    default:
      if ((x1 > 1)) {
        var jsx$1 = new ScalaJS.c.s_StringContext().init___sc_Seq(ScalaJS.m.s_Predef().wrapRefArray__AO__scm_WrappedArray(ScalaJS.asArrayOf.O(ScalaJS.makeNativeArrayWrapper(ScalaJS.d.T.getArrayOf(), ["", " places disponibles (", " %)"]), 1))).s__sc_Seq__T(ScalaJS.m.s_Predef().genericWrapArray__O__scm_WrappedArray(ScalaJS.makeNativeArrayWrapper(ScalaJS.d.O.getArrayOf(), [x1, res.percent__I()])))
      } else {
        if ((x1 === 1)) {
          var jsx$1 = new ScalaJS.c.s_StringContext().init___sc_Seq(ScalaJS.m.s_Predef().wrapRefArray__AO__scm_WrappedArray(ScalaJS.asArrayOf.O(ScalaJS.makeNativeArrayWrapper(ScalaJS.d.T.getArrayOf(), ["1 place disponible (", " %)"]), 1))).s__sc_Seq__T(ScalaJS.m.s_Predef().genericWrapArray__O__scm_WrappedArray(ScalaJS.makeNativeArrayWrapper(ScalaJS.d.O.getArrayOf(), [res.percent__I()])))
        } else {
          var jsx$1 = new ScalaJS.c.s_StringContext().init___sc_Seq(ScalaJS.m.s_Predef().wrapRefArray__AO__scm_WrappedArray(ScalaJS.asArrayOf.O(ScalaJS.makeNativeArrayWrapper(ScalaJS.d.T.getArrayOf(), ["Aucune place disponible (", " %)"]), 1))).s__sc_Seq__T(ScalaJS.m.s_Predef().genericWrapArray__O__scm_WrappedArray(ScalaJS.makeNativeArrayWrapper(ScalaJS.d.O.getArrayOf(), [res.percent__I()])))
        }
      };
  };
  jsx$2["text"](jsx$1)
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.getBackgroundGradientAdjusted__p1__I__T = (function(percent) {
  var color0AdjustedStr = ScalaJS.objectToString(this.adjustToRed__p1__sjs_js_Dynamic__I__sjs_js_Dynamic(this.COLOR0__sjs_js_Dynamic(), percent));
  var color50AdjustedStr = ScalaJS.objectToString(this.adjustToRed__p1__sjs_js_Dynamic__I__sjs_js_Dynamic(this.COLOR50__sjs_js_Dynamic(), percent));
  var color51AdjustedStr = ScalaJS.objectToString(this.adjustToRed__p1__sjs_js_Dynamic__I__sjs_js_Dynamic(this.COLOR51__sjs_js_Dynamic(), percent));
  var color100AdjustedStr = ScalaJS.objectToString(this.adjustToRed__p1__sjs_js_Dynamic__I__sjs_js_Dynamic(this.COLOR100__sjs_js_Dynamic(), percent));
  return new ScalaJS.c.s_StringContext().init___sc_Seq(ScalaJS.m.s_Predef().wrapRefArray__AO__scm_WrappedArray(ScalaJS.asArrayOf.O(ScalaJS.makeNativeArrayWrapper(ScalaJS.d.T.getArrayOf(), ["\n    width : ", "% ;\n    background : -webkit-linear-gradient(top, ", " 0%, ", " 50%, ", " 51%, ", " 100%); \n    background : linear-gradient(to bottom, ", " 0%, ", " 50%, ", " 51%, ", " 100%);"]), 1))).s__sc_Seq__T(ScalaJS.m.s_Predef().genericWrapArray__O__scm_WrappedArray(ScalaJS.makeNativeArrayWrapper(ScalaJS.d.O.getArrayOf(), [percent, color0AdjustedStr, color50AdjustedStr, color51AdjustedStr, color100AdjustedStr, color0AdjustedStr, color50AdjustedStr, color51AdjustedStr, color100AdjustedStr])))
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.adjustToRed__p1__sjs_js_Dynamic__I__sjs_js_Dynamic = (function(color, percent) {
  var targetHue = ((1 - ScalaJS.m.jl_Math().pow__D__D__D((percent / 100.0), 3.0)) * color["getHue"]());
  return color["setHue"](targetHue)
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.example$SodexoWatcher$$showPopupMessage__T__sjs_js_Dynamic = (function(message) {
  ScalaJS.protect(ScalaJS.g["jQuery"])("#popupMessage")["text"](message);
  return ScalaJS.g["jQuery"]("#popupBasic")["popup"]("open", {
    "transition": "flip"
  })
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.example$SodexoWatcher$$showLoading__sjs_js_Dynamic = (function() {
  var jsx$2 = this.mobile__sjs_js_Dynamic();
  var obj = {};
  var tup = ScalaJS.m.s_Predef$ArrowAssoc().$$minus$greater$extension__O__O__T2(ScalaJS.m.s_Predef().ArrowAssoc__O__O("text"), "loading");
  obj[tup.$$und1__O()] = tup.$$und2__O();
  var tup$2 = ScalaJS.m.s_Predef$ArrowAssoc().$$minus$greater$extension__O__O__T2(ScalaJS.m.s_Predef().ArrowAssoc__O__O("textVisible"), true);
  obj[tup$2.$$und1__O()] = tup$2.$$und2__O();
  var tup$3 = ScalaJS.m.s_Predef$ArrowAssoc().$$minus$greater$extension__O__O__T2(ScalaJS.m.s_Predef().ArrowAssoc__O__O("theme"), "a");
  obj[tup$3.$$und1__O()] = tup$3.$$und2__O();
  var tup$4 = ScalaJS.m.s_Predef$ArrowAssoc().$$minus$greater$extension__O__O__T2(ScalaJS.m.s_Predef().ArrowAssoc__O__O("textonly"), false);
  obj[tup$4.$$und1__O()] = tup$4.$$und2__O();
  var tup$5 = ScalaJS.m.s_Predef$ArrowAssoc().$$minus$greater$extension__O__O__T2(ScalaJS.m.s_Predef().ArrowAssoc__O__O("html"), "<h1>Chargement...</h1>");
  obj[tup$5.$$und1__O()] = tup$5.$$und2__O();
  var jsx$1 = obj;
  return jsx$2["loading"]("show", jsx$1)
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.example$SodexoWatcher$$initEventHandlers__V = (function() {
  ScalaJS.protect(ScalaJS.g["jQuery"])("#actualize, #percentBarContainer")["bind"]("tap", (function() {
    return (function(e$2) {
      var e = e$2;
      ScalaJS.m.Lexample_SodexoWatcher().example$SodexoWatcher$$showLoading__sjs_js_Dynamic();
      ScalaJS.m.Lexample_SodexoWatcher().example$SodexoWatcher$$actualize__T__V(ScalaJS.m.Lexample_SodexoWatcher().lastSelectedUrl__T())
    })
  })());
  ScalaJS.protect(ScalaJS.g["jQuery"])("select#select-custom-1")["change"]((function() {
    return (function(e$2) {
      var e = e$2;
      var selectedURL = ScalaJS.as.T(ScalaJS.protect(ScalaJS.g["jQuery"])(e["delegateTarget"])["find"](":selected")["val"]());
      ScalaJS.m.Lexample_SodexoWatcher().lastSelectedUrl$und$eq__T__V(selectedURL);
      ScalaJS.m.Lexample_SodexoWatcher().example$SodexoWatcher$$showLoading__sjs_js_Dynamic();
      ScalaJS.m.Lexample_SodexoWatcher().example$SodexoWatcher$$actualize__T__V(selectedURL)
    })
  })());
  ScalaJS.protect(ScalaJS.g["jQuery"])("select#flip-1")["change"]((function() {
    return (function(e$2) {
      var e = e$2;
      var x1 = ScalaJS.as.T(ScalaJS.protect(ScalaJS.g["jQuery"])(e["delegateTarget"])["find"](":selected")["val"]());
      if (ScalaJS.anyRefEqEq("on", x1)) {
        ScalaJS.protect(ScalaJS.g["jQuery"])("#autorefreshSliderContainer")["removeClass"]("hiddenBlock");
        ScalaJS.m.Lexample_SodexoWatcher().updateTimerDelay__V();
        return undefined
      };
      if (ScalaJS.anyRefEqEq("off", x1)) {
        ScalaJS.protect(ScalaJS.g["jQuery"])("#autorefreshSliderContainer")["addClass"]("hiddenBlock");
        ScalaJS.m.Lexample_SodexoWatcher().disableTimer__V();
        return undefined
      };
      return ScalaJS.g["console"]["log"]("wrong value in select slider")
    })
  })());
  ScalaJS.protect(ScalaJS.g["jQuery"])("#sliderAutoRefreshDelay")["bind"]("slidestop", (function() {
    return (function(e$2) {
      var e = e$2;
      ScalaJS.g["console"]["log"]("change slider value");
      ScalaJS.m.Lexample_SodexoWatcher().updateTimerDelay__V()
    })
  })())
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.disableTimer__V = (function() {
  ScalaJS.g["clearInterval"](this.lastIntervalTimer__I())
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.updateTimerDelay__V = (function() {
  this.disableTimer__V();
  var delaySec = ScalaJS.protect(ScalaJS.g["jQuery"])("#sliderAutoRefreshDelay")["val"]();
  this.lastIntervalTimer$und$eq__I__V(ScalaJS.uI(ScalaJS.g["setInterval"]((function() {
    return (function() {
      ScalaJS.m.Lexample_SodexoWatcher().example$SodexoWatcher$$showLoading__sjs_js_Dynamic();
      ScalaJS.m.Lexample_SodexoWatcher().example$SodexoWatcher$$actualize__T__V(ScalaJS.m.Lexample_SodexoWatcher().lastSelectedUrl__T())
    })
  })(), (delaySec * 1000))))
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.main__V = (function() {
  ScalaJS.g["console"]["log"]("START");
  ScalaJS.protect(ScalaJS.g["jQuery"])(ScalaJS.g["document"])["on"]("pageinit", "#mainPage", (function() {
    return (function() {
      ScalaJS.g["console"]["log"]("#mainPage is initialized");
      ScalaJS.m.Lexample_SodexoWatcher().example$SodexoWatcher$$initEventHandlers__V()
    })
  })());
  ScalaJS.g["document"]["addEventListener"]("deviceready", (function() {
    return (function(e$2) {
      var e = e$2;
      ScalaJS.m.Lexample_SodexoWatcher().example$SodexoWatcher$$showLoading__sjs_js_Dynamic();
      ScalaJS.protect(ScalaJS.g["jQuery"])("#devicereadyMonitor")["css"]("background", "green")["text"]("Device is ready");
      ScalaJS.m.Lexample_SodexoWatcher().example$SodexoWatcher$$showLoading__sjs_js_Dynamic();
      ScalaJS.m.Lexample_SodexoWatcher().example$SodexoWatcher$$actualize__T__V(ScalaJS.m.Lexample_SodexoWatcher().example$SodexoWatcher$$actualize$default$1__T())
    })
  })(), false);
  ScalaJS.g["console"]["log"]("END")
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.$$js$exported$meth$main__O = (function() {
  this.main__V()
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.Lexample_SodexoWatcher = this;
  this.COLOR0$1 = this.Color__sjs_js_Dynamic()("#bfd255")["saturateByRatio"](0.1);
  this.COLOR50$1 = this.Color__sjs_js_Dynamic()("#8eb92a")["lightenByRatio"](0.3);
  this.COLOR51$1 = this.Color__sjs_js_Dynamic()("#72aa00")["saturateByRatio"](0.1);
  this.COLOR100$1 = this.Color__sjs_js_Dynamic()("#9ecb2d")["saturateByRatio"](0.1);
  this.DEFAULT$undURL$1 = "https://sodexo-riemarcopolo.moneweb.fr/";
  this.lastSelectedUrl$1 = this.DEFAULT$undURL__T();
  this.lastIntervalTimer$1 = 0;
  this.resultQueue$1 = new ScalaJS.c.scm_Queue().init___();
  return this
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype["main"] = (function() {
  return this.$$js$exported$meth$main__O()
});
ScalaJS.is.Lexample_SodexoWatcher$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lexample_SodexoWatcher$)))
});
ScalaJS.as.Lexample_SodexoWatcher$ = (function(obj) {
  if ((ScalaJS.is.Lexample_SodexoWatcher$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "example.SodexoWatcher$")
  }
});
ScalaJS.isArrayOf.Lexample_SodexoWatcher$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lexample_SodexoWatcher$)))
});
ScalaJS.asArrayOf.Lexample_SodexoWatcher$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.Lexample_SodexoWatcher$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lexample.SodexoWatcher$;", depth)
  }
});
ScalaJS.d.Lexample_SodexoWatcher$ = new ScalaJS.ClassTypeData({
  Lexample_SodexoWatcher$: 0
}, false, "example.SodexoWatcher$", ScalaJS.d.O, {
  Lexample_SodexoWatcher$: 1,
  O: 1
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.$classData = ScalaJS.d.Lexample_SodexoWatcher$;
ScalaJS.n.Lexample_SodexoWatcher = undefined;
ScalaJS.m.Lexample_SodexoWatcher = (function() {
  if ((!ScalaJS.n.Lexample_SodexoWatcher)) {
    ScalaJS.n.Lexample_SodexoWatcher = new ScalaJS.c.Lexample_SodexoWatcher$().init___()
  };
  return ScalaJS.n.Lexample_SodexoWatcher
});
ScalaJS.e["SodexoWatcher"] = ScalaJS.m.Lexample_SodexoWatcher;
/** @constructor */
ScalaJS.c.Ljava_io_OutputStream = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Ljava_io_OutputStream.prototype = new ScalaJS.h.O();
ScalaJS.c.Ljava_io_OutputStream.prototype.constructor = ScalaJS.c.Ljava_io_OutputStream;
/** @constructor */
ScalaJS.h.Ljava_io_OutputStream = (function() {
  /*<skip>*/
});
ScalaJS.h.Ljava_io_OutputStream.prototype = ScalaJS.c.Ljava_io_OutputStream.prototype;
/*<skip>*/;
ScalaJS.is.Ljava_io_OutputStream = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Ljava_io_OutputStream)))
});
ScalaJS.as.Ljava_io_OutputStream = (function(obj) {
  if ((ScalaJS.is.Ljava_io_OutputStream(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.io.OutputStream")
  }
});
ScalaJS.isArrayOf.Ljava_io_OutputStream = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Ljava_io_OutputStream)))
});
ScalaJS.asArrayOf.Ljava_io_OutputStream = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.Ljava_io_OutputStream(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.io.OutputStream;", depth)
  }
});
ScalaJS.d.Ljava_io_OutputStream = new ScalaJS.ClassTypeData({
  Ljava_io_OutputStream: 0
}, false, "java.io.OutputStream", ScalaJS.d.O, {
  Ljava_io_OutputStream: 1,
  Ljava_io_Flushable: 1,
  Ljava_io_Closeable: 1,
  O: 1
});
ScalaJS.c.Ljava_io_OutputStream.prototype.$classData = ScalaJS.d.Ljava_io_OutputStream;
/*<skip>*/;
/** @constructor */
ScalaJS.c.Lorg_scalajs_dom_extensions_Ajax$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.Lorg_scalajs_dom_extensions_Ajax$.prototype = new ScalaJS.h.O();
ScalaJS.c.Lorg_scalajs_dom_extensions_Ajax$.prototype.constructor = ScalaJS.c.Lorg_scalajs_dom_extensions_Ajax$;
/** @constructor */
ScalaJS.h.Lorg_scalajs_dom_extensions_Ajax$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lorg_scalajs_dom_extensions_Ajax$.prototype = ScalaJS.c.Lorg_scalajs_dom_extensions_Ajax$.prototype;
ScalaJS.c.Lorg_scalajs_dom_extensions_Ajax$.prototype.get__T__T__I__sc_Seq__Z__s_concurrent_Future = (function(url, data, timeout, headers, withCredentials) {
  return this.apply__T__T__T__I__sc_Seq__Z__s_concurrent_Future("GET", url, data, timeout, headers, withCredentials)
});
ScalaJS.c.Lorg_scalajs_dom_extensions_Ajax$.prototype.get$default$2__T = (function() {
  return ""
});
ScalaJS.c.Lorg_scalajs_dom_extensions_Ajax$.prototype.get$default$4__sc_Seq = (function() {
  return ScalaJS.m.sci_Nil()
});
ScalaJS.c.Lorg_scalajs_dom_extensions_Ajax$.prototype.get$default$5__Z = (function() {
  return false
});
ScalaJS.c.Lorg_scalajs_dom_extensions_Ajax$.prototype.apply__T__T__T__I__sc_Seq__Z__s_concurrent_Future = (function(method, url, data, timeout, headers, withCredentials) {
  var req = new ScalaJS.g["XMLHttpRequest"]();
  var promise = ScalaJS.m.s_concurrent_Promise().apply__s_concurrent_Promise();
  req["onreadystatechange"] = (function(req$1, promise$1) {
    return (function(e$2) {
      var e = e$2;
      if ((ScalaJS.uI(req$1["readyState"]) === 4)) {
        if (((200 <= ScalaJS.uI(req$1["status"])) && (ScalaJS.uI(req$1["status"]) < 300))) {
          return promise$1.success__O__s_concurrent_Promise(req$1)
        } else {
          return promise$1.failure__jl_Throwable__s_concurrent_Promise(new ScalaJS.c.Lorg_scalajs_dom_extensions_AjaxException().init___Lorg_scalajs_dom_XMLHttpRequest(req$1))
        }
      } else {
        return undefined
      }
    })
  })(req, promise);
  req["open"](method, url);
  req["withCredentials"] = withCredentials;
  headers.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(req$1) {
    return (function(x$2) {
      var x = ScalaJS.as.T2(x$2);
      req$1["setRequestHeader"](ScalaJS.as.T(x.$$und1__O()), ScalaJS.as.T(x.$$und2__O()))
    })
  })(req)));
  req["send"](data);
  return promise.future__s_concurrent_Future()
});
/*<skip>*/;
ScalaJS.is.Lorg_scalajs_dom_extensions_Ajax$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lorg_scalajs_dom_extensions_Ajax$)))
});
ScalaJS.as.Lorg_scalajs_dom_extensions_Ajax$ = (function(obj) {
  if ((ScalaJS.is.Lorg_scalajs_dom_extensions_Ajax$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "org.scalajs.dom.extensions.Ajax$")
  }
});
ScalaJS.isArrayOf.Lorg_scalajs_dom_extensions_Ajax$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lorg_scalajs_dom_extensions_Ajax$)))
});
ScalaJS.asArrayOf.Lorg_scalajs_dom_extensions_Ajax$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.Lorg_scalajs_dom_extensions_Ajax$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lorg.scalajs.dom.extensions.Ajax$;", depth)
  }
});
ScalaJS.d.Lorg_scalajs_dom_extensions_Ajax$ = new ScalaJS.ClassTypeData({
  Lorg_scalajs_dom_extensions_Ajax$: 0
}, false, "org.scalajs.dom.extensions.Ajax$", ScalaJS.d.O, {
  Lorg_scalajs_dom_extensions_Ajax$: 1,
  O: 1
});
ScalaJS.c.Lorg_scalajs_dom_extensions_Ajax$.prototype.$classData = ScalaJS.d.Lorg_scalajs_dom_extensions_Ajax$;
ScalaJS.n.Lorg_scalajs_dom_extensions_Ajax = undefined;
ScalaJS.m.Lorg_scalajs_dom_extensions_Ajax = (function() {
  if ((!ScalaJS.n.Lorg_scalajs_dom_extensions_Ajax)) {
    ScalaJS.n.Lorg_scalajs_dom_extensions_Ajax = new ScalaJS.c.Lorg_scalajs_dom_extensions_Ajax$().init___()
  };
  return ScalaJS.n.Lorg_scalajs_dom_extensions_Ajax
});
/*<skip>*/;
ScalaJS.is.T = (function(obj) {
  return (typeof(obj) === "string")
});
ScalaJS.as.T = (function(obj) {
  if ((ScalaJS.is.T(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.String")
  }
});
ScalaJS.isArrayOf.T = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.T)))
});
ScalaJS.asArrayOf.T = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.T(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.String;", depth)
  }
});
ScalaJS.d.T = new ScalaJS.ClassTypeData({
  T: 0
}, false, "java.lang.String", ScalaJS.d.O, {
  T: 1,
  Ljava_io_Serializable: 1,
  jl_CharSequence: 1,
  jl_Comparable: 1,
  O: 1
}, ScalaJS.is.T);
/** @constructor */
ScalaJS.c.T2 = (function() {
  ScalaJS.c.O.call(this);
  this.$$und1$f = null;
  this.$$und2$f = null
});
ScalaJS.c.T2.prototype = new ScalaJS.h.O();
ScalaJS.c.T2.prototype.constructor = ScalaJS.c.T2;
/** @constructor */
ScalaJS.h.T2 = (function() {
  /*<skip>*/
});
ScalaJS.h.T2.prototype = ScalaJS.c.T2.prototype;
ScalaJS.c.T2.prototype.productArity__I = (function() {
  return ScalaJS.i.s_Product2$class__productArity__s_Product2__I(this)
});
ScalaJS.c.T2.prototype.productElement__I__O = (function(n) {
  return ScalaJS.i.s_Product2$class__productElement__s_Product2__I__O(this, n)
});
ScalaJS.c.T2.prototype.$$und1__O = (function() {
  return this.$$und1$f
});
ScalaJS.c.T2.prototype.$$und2__O = (function() {
  return this.$$und2$f
});
ScalaJS.c.T2.prototype.toString__T = (function() {
  return (((("(" + this.$$und1__O()) + ",") + this.$$und2__O()) + ")")
});
ScalaJS.c.T2.prototype.productPrefix__T = (function() {
  return "Tuple2"
});
ScalaJS.c.T2.prototype.productIterator__sc_Iterator = (function() {
  return ScalaJS.m.sr_ScalaRunTime().typedProductIterator__s_Product__sc_Iterator(this)
});
ScalaJS.c.T2.prototype.canEqual__O__Z = (function(x$1) {
  return ScalaJS.is.T2(x$1)
});
ScalaJS.c.T2.prototype.hashCode__I = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undhashCode__s_Product__I(this)
});
ScalaJS.c.T2.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else {
    var x1 = x$1;
    matchEnd4: {
      if (ScalaJS.is.T2(x1)) {
        var jsx$1 = true;
        break matchEnd4
      };
      var jsx$1 = false;
      break matchEnd4
    };
    if (jsx$1) {
      var Tuple2$1 = ScalaJS.as.T2(x$1);
      return ((ScalaJS.anyEqEq(this.$$und1__O(), Tuple2$1.$$und1__O()) && ScalaJS.anyEqEq(this.$$und2__O(), Tuple2$1.$$und2__O())) && Tuple2$1.canEqual__O__Z(this))
    } else {
      return false
    }
  }
});
ScalaJS.c.T2.prototype.init___O__O = (function(_1, _2) {
  this.$$und1$f = _1;
  this.$$und2$f = _2;
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.i.s_Product$class__$init$__s_Product__V(this);
  ScalaJS.i.s_Product2$class__$init$__s_Product2__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.T2 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.T2)))
});
ScalaJS.as.T2 = (function(obj) {
  if ((ScalaJS.is.T2(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.Tuple2")
  }
});
ScalaJS.isArrayOf.T2 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.T2)))
});
ScalaJS.asArrayOf.T2 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.T2(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.Tuple2;", depth)
  }
});
ScalaJS.d.T2 = new ScalaJS.ClassTypeData({
  T2: 0
}, false, "scala.Tuple2", ScalaJS.d.O, {
  T2: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product2: 1,
  s_Product: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.T2.prototype.$classData = ScalaJS.d.T2;
/*<skip>*/;
/** @constructor */
ScalaJS.c.T5 = (function() {
  ScalaJS.c.O.call(this);
  this.$$und1$1 = null;
  this.$$und2$1 = null;
  this.$$und3$1 = null;
  this.$$und4$1 = null;
  this.$$und5$1 = null
});
ScalaJS.c.T5.prototype = new ScalaJS.h.O();
ScalaJS.c.T5.prototype.constructor = ScalaJS.c.T5;
/** @constructor */
ScalaJS.h.T5 = (function() {
  /*<skip>*/
});
ScalaJS.h.T5.prototype = ScalaJS.c.T5.prototype;
ScalaJS.c.T5.prototype.productArity__I = (function() {
  return ScalaJS.i.s_Product5$class__productArity__s_Product5__I(this)
});
ScalaJS.c.T5.prototype.productElement__I__O = (function(n) {
  return ScalaJS.i.s_Product5$class__productElement__s_Product5__I__O(this, n)
});
ScalaJS.c.T5.prototype.$$und1__O = (function() {
  return this.$$und1$1
});
ScalaJS.c.T5.prototype.$$und2__O = (function() {
  return this.$$und2$1
});
ScalaJS.c.T5.prototype.$$und3__O = (function() {
  return this.$$und3$1
});
ScalaJS.c.T5.prototype.$$und4__O = (function() {
  return this.$$und4$1
});
ScalaJS.c.T5.prototype.$$und5__O = (function() {
  return this.$$und5$1
});
ScalaJS.c.T5.prototype.toString__T = (function() {
  return (((((((((("(" + this.$$und1__O()) + ",") + this.$$und2__O()) + ",") + this.$$und3__O()) + ",") + this.$$und4__O()) + ",") + this.$$und5__O()) + ")")
});
ScalaJS.c.T5.prototype.productPrefix__T = (function() {
  return "Tuple5"
});
ScalaJS.c.T5.prototype.productIterator__sc_Iterator = (function() {
  return ScalaJS.m.sr_ScalaRunTime().typedProductIterator__s_Product__sc_Iterator(this)
});
ScalaJS.c.T5.prototype.canEqual__O__Z = (function(x$1) {
  return ScalaJS.is.T5(x$1)
});
ScalaJS.c.T5.prototype.hashCode__I = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undhashCode__s_Product__I(this)
});
ScalaJS.c.T5.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else {
    var x1 = x$1;
    matchEnd4: {
      if (ScalaJS.is.T5(x1)) {
        var jsx$1 = true;
        break matchEnd4
      };
      var jsx$1 = false;
      break matchEnd4
    };
    if (jsx$1) {
      var Tuple5$1 = ScalaJS.as.T5(x$1);
      return (((((ScalaJS.anyEqEq(this.$$und1__O(), Tuple5$1.$$und1__O()) && ScalaJS.anyEqEq(this.$$und2__O(), Tuple5$1.$$und2__O())) && ScalaJS.anyEqEq(this.$$und3__O(), Tuple5$1.$$und3__O())) && ScalaJS.anyEqEq(this.$$und4__O(), Tuple5$1.$$und4__O())) && ScalaJS.anyEqEq(this.$$und5__O(), Tuple5$1.$$und5__O())) && Tuple5$1.canEqual__O__Z(this))
    } else {
      return false
    }
  }
});
ScalaJS.c.T5.prototype.init___O__O__O__O__O = (function(_1, _2, _3, _4, _5) {
  this.$$und1$1 = _1;
  this.$$und2$1 = _2;
  this.$$und3$1 = _3;
  this.$$und4$1 = _4;
  this.$$und5$1 = _5;
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.i.s_Product$class__$init$__s_Product__V(this);
  ScalaJS.i.s_Product5$class__$init$__s_Product5__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.T5 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.T5)))
});
ScalaJS.as.T5 = (function(obj) {
  if ((ScalaJS.is.T5(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.Tuple5")
  }
});
ScalaJS.isArrayOf.T5 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.T5)))
});
ScalaJS.asArrayOf.T5 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.T5(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.Tuple5;", depth)
  }
});
ScalaJS.d.T5 = new ScalaJS.ClassTypeData({
  T5: 0
}, false, "scala.Tuple5", ScalaJS.d.O, {
  T5: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product5: 1,
  s_Product: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.T5.prototype.$classData = ScalaJS.d.T5;
/*<skip>*/;
ScalaJS.isArrayOf.jl_Boolean = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Boolean)))
});
ScalaJS.asArrayOf.jl_Boolean = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_Boolean(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.Boolean;", depth)
  }
});
ScalaJS.d.jl_Boolean = new ScalaJS.ClassTypeData({
  jl_Boolean: 0
}, false, "java.lang.Boolean", undefined, {
  jl_Boolean: 1,
  jl_Comparable: 1,
  O: 1
}, (function(x) {
  return (typeof(x) === "boolean")
}));
/** @constructor */
ScalaJS.c.jl_Character = (function() {
  ScalaJS.c.O.call(this);
  this.value$1 = 0
});
ScalaJS.c.jl_Character.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_Character.prototype.constructor = ScalaJS.c.jl_Character;
/** @constructor */
ScalaJS.h.jl_Character = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Character.prototype = ScalaJS.c.jl_Character.prototype;
ScalaJS.c.jl_Character.prototype.value__p1__C = (function() {
  return this.value$1
});
ScalaJS.c.jl_Character.prototype.charValue__C = (function() {
  return this.value__p1__C()
});
ScalaJS.c.jl_Character.prototype.equals__O__Z = (function(that) {
  return (ScalaJS.is.jl_Character(that) && (this.value__p1__C() === ScalaJS.as.jl_Character(that).charValue__C()))
});
ScalaJS.c.jl_Character.prototype.toString__T = (function() {
  return ScalaJS.as.T(ScalaJS.applyMethodWithVarargs(ScalaJS.g["String"], "fromCharCode", ScalaJS.m.sjs_js_Any().fromTraversableOnce__sc_TraversableOnce__sjs_js_Array(ScalaJS.m.s_Predef().wrapIntArray__AI__scm_WrappedArray(ScalaJS.makeNativeArrayWrapper(ScalaJS.d.I.getArrayOf(), [this.value__p1__C()])))))
});
ScalaJS.c.jl_Character.prototype.hashCode__I = (function() {
  return this.value__p1__C()
});
ScalaJS.c.jl_Character.prototype.init___C = (function(value) {
  this.value$1 = value;
  ScalaJS.c.O.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.jl_Character = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_Character)))
});
ScalaJS.as.jl_Character = (function(obj) {
  if ((ScalaJS.is.jl_Character(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.Character")
  }
});
ScalaJS.isArrayOf.jl_Character = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Character)))
});
ScalaJS.asArrayOf.jl_Character = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_Character(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.Character;", depth)
  }
});
ScalaJS.d.jl_Character = new ScalaJS.ClassTypeData({
  jl_Character: 0
}, false, "java.lang.Character", ScalaJS.d.O, {
  jl_Character: 1,
  jl_Comparable: 1,
  O: 1
});
ScalaJS.c.jl_Character.prototype.$classData = ScalaJS.d.jl_Character;
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_Character$ = (function() {
  ScalaJS.c.O.call(this);
  this.TYPE$1 = null;
  this.MIN$undVALUE$1 = 0;
  this.MAX$undVALUE$1 = 0;
  this.LOWERCASE$undLETTER$1 = 0;
  this.UPPERCASE$undLETTER$1 = 0;
  this.OTHER$undLETTER$1 = 0;
  this.TITLECASE$undLETTER$1 = 0;
  this.LETTER$undNUMBER$1 = 0;
  this.COMBINING$undSPACING$undMARK$1 = 0;
  this.ENCLOSING$undMARK$1 = 0;
  this.NON$undSPACING$undMARK$1 = 0;
  this.MODIFIER$undLETTER$1 = 0;
  this.DECIMAL$undDIGIT$undNUMBER$1 = 0;
  this.SURROGATE$1 = 0;
  this.MIN$undRADIX$1 = 0;
  this.MAX$undRADIX$1 = 0;
  this.MIN$undHIGH$undSURROGATE$1 = 0;
  this.MAX$undHIGH$undSURROGATE$1 = 0;
  this.MIN$undLOW$undSURROGATE$1 = 0;
  this.MAX$undLOW$undSURROGATE$1 = 0;
  this.MIN$undSURROGATE$1 = 0;
  this.MAX$undSURROGATE$1 = 0
});
ScalaJS.c.jl_Character$.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_Character$.prototype.constructor = ScalaJS.c.jl_Character$;
/** @constructor */
ScalaJS.h.jl_Character$ = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Character$.prototype = ScalaJS.c.jl_Character$.prototype;
ScalaJS.c.jl_Character$.prototype.MIN$undRADIX__I = (function() {
  return this.MIN$undRADIX$1
});
ScalaJS.c.jl_Character$.prototype.MAX$undRADIX__I = (function() {
  return this.MAX$undRADIX$1
});
ScalaJS.c.jl_Character$.prototype.MIN$undHIGH$undSURROGATE__C = (function() {
  return this.MIN$undHIGH$undSURROGATE$1
});
ScalaJS.c.jl_Character$.prototype.MAX$undLOW$undSURROGATE__C = (function() {
  return this.MAX$undLOW$undSURROGATE$1
});
ScalaJS.c.jl_Character$.prototype.digit__C__I__I = (function(c, radix) {
  if (((radix > this.MAX$undRADIX__I()) || (radix < this.MIN$undRADIX__I()))) {
    return -1
  } else {
    if ((((c >= 48) && (c <= 57)) && (((c - 48) | 0) < radix))) {
      return ((c - 48) | 0)
    } else {
      if ((((c >= 65) && (c <= 90)) && (((c - 65) | 0) < ((radix - 10) | 0)))) {
        return ((((c - 65) | 0) + 10) | 0)
      } else {
        if ((((c >= 97) && (c <= 122)) && (((c - 97) | 0) < ((radix - 10) | 0)))) {
          return ((((c - 97) | 0) + 10) | 0)
        } else {
          if ((((c >= 65313) && (c <= 65338)) && (((c - 65313) | 0) < ((radix - 10) | 0)))) {
            return ((((c - 65313) | 0) + 10) | 0)
          } else {
            if ((((c >= 65345) && (c <= 65370)) && (((c - 65345) | 0) < ((radix - 10) | 0)))) {
              return ((((c - 65313) | 0) + 10) | 0)
            } else {
              return -1
            }
          }
        }
      }
    }
  }
});
ScalaJS.c.jl_Character$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.jl_Character = this;
  this.TYPE$1 = ScalaJS.d.C.getClassOf();
  this.MIN$undVALUE$1 = 0;
  this.MAX$undVALUE$1 = 255;
  this.LOWERCASE$undLETTER$1 = 0;
  this.UPPERCASE$undLETTER$1 = 0;
  this.OTHER$undLETTER$1 = 0;
  this.TITLECASE$undLETTER$1 = 0;
  this.LETTER$undNUMBER$1 = 0;
  this.COMBINING$undSPACING$undMARK$1 = 0;
  this.ENCLOSING$undMARK$1 = 0;
  this.NON$undSPACING$undMARK$1 = 0;
  this.MODIFIER$undLETTER$1 = 0;
  this.DECIMAL$undDIGIT$undNUMBER$1 = 0;
  this.SURROGATE$1 = 0;
  this.MIN$undRADIX$1 = 2;
  this.MAX$undRADIX$1 = 36;
  this.MIN$undHIGH$undSURROGATE$1 = 55296;
  this.MAX$undHIGH$undSURROGATE$1 = 56319;
  this.MIN$undLOW$undSURROGATE$1 = 56320;
  this.MAX$undLOW$undSURROGATE$1 = 57343;
  this.MIN$undSURROGATE$1 = this.MIN$undHIGH$undSURROGATE__C();
  this.MAX$undSURROGATE$1 = this.MAX$undLOW$undSURROGATE__C();
  return this
});
/*<skip>*/;
ScalaJS.is.jl_Character$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_Character$)))
});
ScalaJS.as.jl_Character$ = (function(obj) {
  if ((ScalaJS.is.jl_Character$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.Character$")
  }
});
ScalaJS.isArrayOf.jl_Character$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Character$)))
});
ScalaJS.asArrayOf.jl_Character$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_Character$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.Character$;", depth)
  }
});
ScalaJS.d.jl_Character$ = new ScalaJS.ClassTypeData({
  jl_Character$: 0
}, false, "java.lang.Character$", ScalaJS.d.O, {
  jl_Character$: 1,
  O: 1
});
ScalaJS.c.jl_Character$.prototype.$classData = ScalaJS.d.jl_Character$;
ScalaJS.n.jl_Character = undefined;
ScalaJS.m.jl_Character = (function() {
  if ((!ScalaJS.n.jl_Character)) {
    ScalaJS.n.jl_Character = new ScalaJS.c.jl_Character$().init___()
  };
  return ScalaJS.n.jl_Character
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_Class = (function() {
  ScalaJS.c.O.call(this);
  this.data$1 = null
});
ScalaJS.c.jl_Class.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_Class.prototype.constructor = ScalaJS.c.jl_Class;
/** @constructor */
ScalaJS.h.jl_Class = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Class.prototype = ScalaJS.c.jl_Class.prototype;
ScalaJS.c.jl_Class.prototype.toString__T = (function() {
  if (this.isInterface__Z()) {
    var jsx$1 = "interface "
  } else {
    if (this.isPrimitive__Z()) {
      var jsx$1 = ""
    } else {
      var jsx$1 = "class "
    }
  };
  return (("" + jsx$1) + this.getName__T())
});
ScalaJS.c.jl_Class.prototype.isInterface__Z = (function() {
  return ScalaJS.uZ(this.data$1["isInterface"])
});
ScalaJS.c.jl_Class.prototype.isPrimitive__Z = (function() {
  return ScalaJS.uZ(this.data$1["isPrimitive"])
});
ScalaJS.c.jl_Class.prototype.getName__T = (function() {
  return ScalaJS.as.T(this.data$1["name"])
});
ScalaJS.c.jl_Class.prototype.init___jl_ScalaJSClassData = (function(data) {
  this.data$1 = data;
  ScalaJS.c.O.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.jl_Class = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_Class)))
});
ScalaJS.as.jl_Class = (function(obj) {
  if ((ScalaJS.is.jl_Class(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.Class")
  }
});
ScalaJS.isArrayOf.jl_Class = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Class)))
});
ScalaJS.asArrayOf.jl_Class = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_Class(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.Class;", depth)
  }
});
ScalaJS.d.jl_Class = new ScalaJS.ClassTypeData({
  jl_Class: 0
}, false, "java.lang.Class", ScalaJS.d.O, {
  jl_Class: 1,
  O: 1
});
ScalaJS.c.jl_Class.prototype.$classData = ScalaJS.d.jl_Class;
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_Double$ = (function() {
  ScalaJS.c.O.call(this);
  this.TYPE$1 = null;
  this.POSITIVE$undINFINITY$1 = 0.0;
  this.NEGATIVE$undINFINITY$1 = 0.0;
  this.NaN$1 = 0.0;
  this.MAX$undVALUE$1 = 0.0;
  this.MIN$undNORMAL$1 = 0.0;
  this.MIN$undVALUE$1 = 0.0;
  this.MAX$undEXPONENT$1 = 0;
  this.MIN$undEXPONENT$1 = 0;
  this.SIZE$1 = 0
});
ScalaJS.c.jl_Double$.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_Double$.prototype.constructor = ScalaJS.c.jl_Double$;
/** @constructor */
ScalaJS.h.jl_Double$ = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Double$.prototype = ScalaJS.c.jl_Double$.prototype;
ScalaJS.c.jl_Double$.prototype.isNaN__D__Z = (function(v) {
  return ScalaJS.uZ(ScalaJS.g["isNaN"](v))
});
ScalaJS.c.jl_Double$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.jl_Double = this;
  this.TYPE$1 = ScalaJS.d.D.getClassOf();
  this.POSITIVE$undINFINITY$1 = ScalaJS.uD(ScalaJS.g["Number"]["POSITIVE_INFINITY"]);
  this.NEGATIVE$undINFINITY$1 = ScalaJS.uD(ScalaJS.g["Number"]["NEGATIVE_INFINITY"]);
  this.NaN$1 = ScalaJS.uD(ScalaJS.g["Number"]["NaN"]);
  this.MAX$undVALUE$1 = ScalaJS.uD(ScalaJS.g["Number"]["MAX_VALUE"]);
  this.MIN$undNORMAL$1 = 0.0;
  this.MIN$undVALUE$1 = ScalaJS.uD(ScalaJS.g["Number"]["MIN_VALUE"]);
  this.MAX$undEXPONENT$1 = 1023;
  this.MIN$undEXPONENT$1 = -1022;
  this.SIZE$1 = 64;
  return this
});
/*<skip>*/;
ScalaJS.is.jl_Double$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_Double$)))
});
ScalaJS.as.jl_Double$ = (function(obj) {
  if ((ScalaJS.is.jl_Double$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.Double$")
  }
});
ScalaJS.isArrayOf.jl_Double$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Double$)))
});
ScalaJS.asArrayOf.jl_Double$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_Double$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.Double$;", depth)
  }
});
ScalaJS.d.jl_Double$ = new ScalaJS.ClassTypeData({
  jl_Double$: 0
}, false, "java.lang.Double$", ScalaJS.d.O, {
  jl_Double$: 1,
  O: 1
});
ScalaJS.c.jl_Double$.prototype.$classData = ScalaJS.d.jl_Double$;
ScalaJS.n.jl_Double = undefined;
ScalaJS.m.jl_Double = (function() {
  if ((!ScalaJS.n.jl_Double)) {
    ScalaJS.n.jl_Double = new ScalaJS.c.jl_Double$().init___()
  };
  return ScalaJS.n.jl_Double
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_Integer$ = (function() {
  ScalaJS.c.O.call(this);
  this.TYPE$1 = null;
  this.MIN$undVALUE$1 = 0;
  this.MAX$undVALUE$1 = 0;
  this.SIZE$1 = 0
});
ScalaJS.c.jl_Integer$.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_Integer$.prototype.constructor = ScalaJS.c.jl_Integer$;
/** @constructor */
ScalaJS.h.jl_Integer$ = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Integer$.prototype = ScalaJS.c.jl_Integer$.prototype;
ScalaJS.c.jl_Integer$.prototype.MIN$undVALUE__I = (function() {
  return this.MIN$undVALUE$1
});
ScalaJS.c.jl_Integer$.prototype.MAX$undVALUE__I = (function() {
  return this.MAX$undVALUE$1
});
ScalaJS.c.jl_Integer$.prototype.parseInt__T__I = (function(s) {
  return this.parseInt__T__I__I(s, 10)
});
ScalaJS.c.jl_Integer$.prototype.parseInt__T__I__I = (function(s, radix) {
  if (((((s === null) || (new ScalaJS.c.sci_StringOps().init___T(ScalaJS.m.s_Predef().augmentString__T__T(s)).size__I() === 0)) || (radix < ScalaJS.m.jl_Character().MIN$undRADIX__I())) || (radix > ScalaJS.m.jl_Character().MAX$undRADIX__I()))) {
    this.fail$1__p1__T__sr_Nothing$(s)
  } else {
    if (((ScalaJS.m.sci_StringOps().apply$extension__T__I__C(ScalaJS.m.s_Predef().augmentString__T__T(s), 0) === 45) || (ScalaJS.m.sci_StringOps().apply$extension__T__I__C(ScalaJS.m.s_Predef().augmentString__T__T(s), 0) === 43))) {
      var i = 1
    } else {
      var i = 0
    };
    if ((new ScalaJS.c.sci_StringOps().init___T(ScalaJS.m.s_Predef().augmentString__T__T(s)).size__I() <= i)) {
      this.fail$1__p1__T__sr_Nothing$(s)
    } else {
      while ((i < new ScalaJS.c.sci_StringOps().init___T(ScalaJS.m.s_Predef().augmentString__T__T(s)).size__I())) {
        if ((ScalaJS.m.jl_Character().digit__C__I__I(ScalaJS.m.sci_StringOps().apply$extension__T__I__C(ScalaJS.m.s_Predef().augmentString__T__T(s), i), radix) < 0)) {
          this.fail$1__p1__T__sr_Nothing$(s)
        };
        i = ((i + 1) | 0)
      };
      var res = ScalaJS.uD(ScalaJS.g["parseInt"](s, radix));
      if (((ScalaJS.uZ(ScalaJS.g["isNaN"](res)) || (res > this.MAX$undVALUE__I())) || (res < this.MIN$undVALUE__I()))) {
        this.fail$1__p1__T__sr_Nothing$(s)
      } else {
        return (res | 0)
      }
    }
  }
});
ScalaJS.c.jl_Integer$.prototype.bitCount__I__I = (function(i) {
  var t1 = ((i - ((i >> 1) & 1431655765)) | 0);
  var t2 = (((t1 & 858993459) + ((t1 >> 2) & 858993459)) | 0);
  return (ScalaJS.imul((((t2 + (t2 >> 4)) | 0) & 252645135), 16843009) >> 24)
});
ScalaJS.c.jl_Integer$.prototype.rotateLeft__I__I__I = (function(i, distance) {
  return ((i << distance) | ((i >>> ((32 - distance) | 0)) | 0))
});
ScalaJS.c.jl_Integer$.prototype.numberOfLeadingZeros__I__I = (function(i) {
  var x = i;
  x = (x | ((x >>> 1) | 0));
  x = (x | ((x >>> 2) | 0));
  x = (x | ((x >>> 4) | 0));
  x = (x | ((x >>> 8) | 0));
  x = (x | ((x >>> 16) | 0));
  return ((32 - this.bitCount__I__I(x)) | 0)
});
ScalaJS.c.jl_Integer$.prototype.numberOfTrailingZeros__I__I = (function(i) {
  return this.bitCount__I__I((((i & (-i)) - 1) | 0))
});
ScalaJS.c.jl_Integer$.prototype.fail$1__p1__T__sr_Nothing$ = (function(s$1) {
  throw new ScalaJS.c.jl_NumberFormatException().init___T(new ScalaJS.c.s_StringContext().init___sc_Seq(ScalaJS.m.s_Predef().wrapRefArray__AO__scm_WrappedArray(ScalaJS.asArrayOf.O(ScalaJS.makeNativeArrayWrapper(ScalaJS.d.T.getArrayOf(), ["For input string: \"", "\""]), 1))).s__sc_Seq__T(ScalaJS.m.s_Predef().genericWrapArray__O__scm_WrappedArray(ScalaJS.makeNativeArrayWrapper(ScalaJS.d.O.getArrayOf(), [s$1]))))
});
ScalaJS.c.jl_Integer$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.jl_Integer = this;
  this.TYPE$1 = ScalaJS.d.I.getClassOf();
  this.MIN$undVALUE$1 = -2147483648;
  this.MAX$undVALUE$1 = 2147483647;
  this.SIZE$1 = 32;
  return this
});
/*<skip>*/;
ScalaJS.is.jl_Integer$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_Integer$)))
});
ScalaJS.as.jl_Integer$ = (function(obj) {
  if ((ScalaJS.is.jl_Integer$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.Integer$")
  }
});
ScalaJS.isArrayOf.jl_Integer$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Integer$)))
});
ScalaJS.asArrayOf.jl_Integer$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_Integer$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.Integer$;", depth)
  }
});
ScalaJS.d.jl_Integer$ = new ScalaJS.ClassTypeData({
  jl_Integer$: 0
}, false, "java.lang.Integer$", ScalaJS.d.O, {
  jl_Integer$: 1,
  O: 1
});
ScalaJS.c.jl_Integer$.prototype.$classData = ScalaJS.d.jl_Integer$;
ScalaJS.n.jl_Integer = undefined;
ScalaJS.m.jl_Integer = (function() {
  if ((!ScalaJS.n.jl_Integer)) {
    ScalaJS.n.jl_Integer = new ScalaJS.c.jl_Integer$().init___()
  };
  return ScalaJS.n.jl_Integer
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_Long$ = (function() {
  ScalaJS.c.O.call(this);
  this.TYPE$1 = null;
  this.MIN$undVALUE$1 = ScalaJS.m.sjsr_RuntimeLong().zero__sjsr_RuntimeLong();
  this.MAX$undVALUE$1 = ScalaJS.m.sjsr_RuntimeLong().zero__sjsr_RuntimeLong();
  this.SIZE$1 = 0
});
ScalaJS.c.jl_Long$.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_Long$.prototype.constructor = ScalaJS.c.jl_Long$;
/** @constructor */
ScalaJS.h.jl_Long$ = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Long$.prototype = ScalaJS.c.jl_Long$.prototype;
ScalaJS.c.jl_Long$.prototype.valueOf__J__jl_Long = (function(longValue) {
  return longValue
});
ScalaJS.c.jl_Long$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.jl_Long = this;
  this.TYPE$1 = ScalaJS.d.J.getClassOf();
  this.MIN$undVALUE$1 = ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong(0, 0, 524288);
  this.MAX$undVALUE$1 = ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong(4194303, 4194303, 524287);
  this.SIZE$1 = 64;
  return this
});
/*<skip>*/;
ScalaJS.is.jl_Long$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_Long$)))
});
ScalaJS.as.jl_Long$ = (function(obj) {
  if ((ScalaJS.is.jl_Long$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.Long$")
  }
});
ScalaJS.isArrayOf.jl_Long$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Long$)))
});
ScalaJS.asArrayOf.jl_Long$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_Long$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.Long$;", depth)
  }
});
ScalaJS.d.jl_Long$ = new ScalaJS.ClassTypeData({
  jl_Long$: 0
}, false, "java.lang.Long$", ScalaJS.d.O, {
  jl_Long$: 1,
  O: 1
});
ScalaJS.c.jl_Long$.prototype.$classData = ScalaJS.d.jl_Long$;
ScalaJS.n.jl_Long = undefined;
ScalaJS.m.jl_Long = (function() {
  if ((!ScalaJS.n.jl_Long)) {
    ScalaJS.n.jl_Long = new ScalaJS.c.jl_Long$().init___()
  };
  return ScalaJS.n.jl_Long
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_Math$ = (function() {
  ScalaJS.c.O.call(this);
  this.internalRandom$1 = null;
  this.E$1 = 0.0;
  this.PI$1 = 0.0;
  this.bitmap$0$1 = false
});
ScalaJS.c.jl_Math$.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_Math$.prototype.constructor = ScalaJS.c.jl_Math$;
/** @constructor */
ScalaJS.h.jl_Math$ = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Math$.prototype = ScalaJS.c.jl_Math$.prototype;
ScalaJS.c.jl_Math$.prototype.min__I__I__I = (function(a, b) {
  return ScalaJS.uI(ScalaJS.applyMethodWithVarargs(ScalaJS.g["Math"], "min", [a]["concat"](ScalaJS.m.sjs_js_Any().fromTraversableOnce__sc_TraversableOnce__sjs_js_Array(ScalaJS.m.s_Predef().wrapIntArray__AI__scm_WrappedArray(ScalaJS.makeNativeArrayWrapper(ScalaJS.d.I.getArrayOf(), [b]))))))
});
ScalaJS.c.jl_Math$.prototype.pow__D__D__D = (function(a, b) {
  return ScalaJS.uD(ScalaJS.g["Math"]["pow"](a, b))
});
ScalaJS.c.jl_Math$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.jl_Math = this;
  this.E$1 = ScalaJS.uD(ScalaJS.g["Math"]["E"]);
  this.PI$1 = ScalaJS.uD(ScalaJS.g["Math"]["PI"]);
  return this
});
/*<skip>*/;
ScalaJS.is.jl_Math$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_Math$)))
});
ScalaJS.as.jl_Math$ = (function(obj) {
  if ((ScalaJS.is.jl_Math$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.Math$")
  }
});
ScalaJS.isArrayOf.jl_Math$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Math$)))
});
ScalaJS.asArrayOf.jl_Math$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_Math$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.Math$;", depth)
  }
});
ScalaJS.d.jl_Math$ = new ScalaJS.ClassTypeData({
  jl_Math$: 0
}, false, "java.lang.Math$", ScalaJS.d.O, {
  jl_Math$: 1,
  O: 1
});
ScalaJS.c.jl_Math$.prototype.$classData = ScalaJS.d.jl_Math$;
ScalaJS.n.jl_Math = undefined;
ScalaJS.m.jl_Math = (function() {
  if ((!ScalaJS.n.jl_Math)) {
    ScalaJS.n.jl_Math = new ScalaJS.c.jl_Math$().init___()
  };
  return ScalaJS.n.jl_Math
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_Number = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.jl_Number.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_Number.prototype.constructor = ScalaJS.c.jl_Number;
/** @constructor */
ScalaJS.h.jl_Number = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Number.prototype = ScalaJS.c.jl_Number.prototype;
/*<skip>*/;
ScalaJS.is.jl_Number = (function(obj) {
  return (!(!(((obj && obj.$classData) && obj.$classData.ancestors.jl_Number) || (typeof(obj) === "number"))))
});
ScalaJS.as.jl_Number = (function(obj) {
  if ((ScalaJS.is.jl_Number(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.Number")
  }
});
ScalaJS.isArrayOf.jl_Number = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Number)))
});
ScalaJS.asArrayOf.jl_Number = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_Number(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.Number;", depth)
  }
});
ScalaJS.d.jl_Number = new ScalaJS.ClassTypeData({
  jl_Number: 0
}, false, "java.lang.Number", ScalaJS.d.O, {
  jl_Number: 1,
  O: 1
}, ScalaJS.is.jl_Number);
ScalaJS.c.jl_Number.prototype.$classData = ScalaJS.d.jl_Number;
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_StringBuilder = (function() {
  ScalaJS.c.O.call(this);
  this.content$1 = null
});
ScalaJS.c.jl_StringBuilder.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_StringBuilder.prototype.constructor = ScalaJS.c.jl_StringBuilder;
/** @constructor */
ScalaJS.h.jl_StringBuilder = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_StringBuilder.prototype = ScalaJS.c.jl_StringBuilder.prototype;
ScalaJS.c.jl_StringBuilder.prototype.content__p1__T = (function() {
  return this.content$1
});
ScalaJS.c.jl_StringBuilder.prototype.content$und$eq__p1__T__V = (function(x$1) {
  this.content$1 = x$1
});
ScalaJS.c.jl_StringBuilder.prototype.append__T__jl_StringBuilder = (function(s) {
  var jsx$3 = this.content__p1__T();
  if ((s === null)) {
    var jsx$2 = "null"
  } else {
    var jsx$2 = s
  };
  var jsx$1 = (("" + jsx$3) + jsx$2);
  this.content$und$eq__p1__T__V(jsx$1);
  return this
});
ScalaJS.c.jl_StringBuilder.prototype.append__C__jl_StringBuilder = (function(c) {
  return this.append__T__jl_StringBuilder(ScalaJS.objectToString(ScalaJS.bC(c)))
});
ScalaJS.c.jl_StringBuilder.prototype.append__O__jl_StringBuilder = (function(obj) {
  if ((obj === null)) {
    return this.append__T__jl_StringBuilder(null)
  } else {
    return this.append__T__jl_StringBuilder(ScalaJS.objectToString(obj))
  }
});
ScalaJS.c.jl_StringBuilder.prototype.append__jl_CharSequence__I__I__jl_StringBuilder = (function(csq, start, end) {
  if ((csq === null)) {
    return this.append__jl_CharSequence__I__I__jl_StringBuilder("null", start, end)
  } else {
    return this.append__T__jl_StringBuilder(ScalaJS.objectToString(ScalaJS.charSequenceSubSequence(csq, start, end)))
  }
});
ScalaJS.c.jl_StringBuilder.prototype.toString__T = (function() {
  return this.content__p1__T()
});
ScalaJS.c.jl_StringBuilder.prototype.length__I = (function() {
  return ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I(this.content__p1__T())
});
ScalaJS.c.jl_StringBuilder.prototype.charAt__I__C = (function(index) {
  return ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C(this.content__p1__T(), index)
});
ScalaJS.c.jl_StringBuilder.prototype.subSequence__I__I__jl_CharSequence = (function(start, end) {
  return this.substring__I__I__T(start, end)
});
ScalaJS.c.jl_StringBuilder.prototype.substring__I__I__T = (function(start, end) {
  return ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__I__T(this.content__p1__T(), start, end)
});
ScalaJS.c.jl_StringBuilder.prototype.init___T = (function(content) {
  this.content$1 = content;
  ScalaJS.c.O.prototype.init___.call(this);
  return this
});
ScalaJS.c.jl_StringBuilder.prototype.init___ = (function() {
  ScalaJS.c.jl_StringBuilder.prototype.init___T.call(this, "");
  return this
});
ScalaJS.c.jl_StringBuilder.prototype.init___I = (function(initialCapacity) {
  ScalaJS.c.jl_StringBuilder.prototype.init___T.call(this, "");
  return this
});
/*<skip>*/;
ScalaJS.is.jl_StringBuilder = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_StringBuilder)))
});
ScalaJS.as.jl_StringBuilder = (function(obj) {
  if ((ScalaJS.is.jl_StringBuilder(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.StringBuilder")
  }
});
ScalaJS.isArrayOf.jl_StringBuilder = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_StringBuilder)))
});
ScalaJS.asArrayOf.jl_StringBuilder = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_StringBuilder(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.StringBuilder;", depth)
  }
});
ScalaJS.d.jl_StringBuilder = new ScalaJS.ClassTypeData({
  jl_StringBuilder: 0
}, false, "java.lang.StringBuilder", ScalaJS.d.O, {
  jl_StringBuilder: 1,
  Ljava_io_Serializable: 1,
  jl_Appendable: 1,
  jl_CharSequence: 1,
  O: 1
});
ScalaJS.c.jl_StringBuilder.prototype.$classData = ScalaJS.d.jl_StringBuilder;
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_System$ = (function() {
  ScalaJS.c.O.call(this);
  this.out$1 = null;
  this.err$1 = null;
  this.in$1 = null;
  this.getHighPrecisionTime$1 = null
});
ScalaJS.c.jl_System$.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_System$.prototype.constructor = ScalaJS.c.jl_System$;
/** @constructor */
ScalaJS.h.jl_System$ = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_System$.prototype = ScalaJS.c.jl_System$.prototype;
ScalaJS.c.jl_System$.prototype.out__Ljava_io_PrintStream = (function() {
  return this.out$1
});
ScalaJS.c.jl_System$.prototype.err__Ljava_io_PrintStream = (function() {
  return this.err$1
});
ScalaJS.c.jl_System$.prototype.identityHashCode__O__I = (function(x) {
  return 42
});
ScalaJS.c.jl_System$.prototype.$$anonfun$1__p1__D = (function() {
  return ScalaJS.uD(ScalaJS.g["performance"]["now"]())
});
ScalaJS.c.jl_System$.prototype.$$anonfun$2__p1__D = (function() {
  return ScalaJS.uD(ScalaJS.g["performance"]["webkitNow"]())
});
ScalaJS.c.jl_System$.prototype.$$anonfun$3__p1__D = (function() {
  return ScalaJS.uD(new ScalaJS.g["Date"]()["getTime"]())
});
ScalaJS.c.jl_System$.prototype.$$anonfun$4__p1__D = (function() {
  return ScalaJS.uD(new ScalaJS.g["Date"]()["getTime"]())
});
ScalaJS.c.jl_System$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.jl_System = this;
  this.out$1 = ScalaJS.m.jl_StandardOutPrintStream();
  this.err$1 = ScalaJS.m.jl_StandardErrPrintStream();
  this.in$1 = null;
  if ((!ScalaJS.uZ((!ScalaJS.g["performance"])))) {
    if ((!ScalaJS.uZ((!ScalaJS.g["performance"]["now"])))) {
      var jsx$1 = (function() {
        return this.$$anonfun$1__p1__D()
      })["bind"](this)
    } else {
      if ((!ScalaJS.uZ((!ScalaJS.g["performance"]["webkitNow"])))) {
        var jsx$1 = (function() {
          return this.$$anonfun$2__p1__D()
        })["bind"](this)
      } else {
        var jsx$1 = (function() {
          return this.$$anonfun$3__p1__D()
        })["bind"](this)
      }
    }
  } else {
    var jsx$1 = (function() {
      return this.$$anonfun$4__p1__D()
    })["bind"](this)
  };
  this.getHighPrecisionTime$1 = jsx$1;
  return this
});
/*<skip>*/;
ScalaJS.is.jl_System$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_System$)))
});
ScalaJS.as.jl_System$ = (function(obj) {
  if ((ScalaJS.is.jl_System$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.System$")
  }
});
ScalaJS.isArrayOf.jl_System$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_System$)))
});
ScalaJS.asArrayOf.jl_System$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_System$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.System$;", depth)
  }
});
ScalaJS.d.jl_System$ = new ScalaJS.ClassTypeData({
  jl_System$: 0
}, false, "java.lang.System$", ScalaJS.d.O, {
  jl_System$: 1,
  O: 1
});
ScalaJS.c.jl_System$.prototype.$classData = ScalaJS.d.jl_System$;
ScalaJS.n.jl_System = undefined;
ScalaJS.m.jl_System = (function() {
  if ((!ScalaJS.n.jl_System)) {
    ScalaJS.n.jl_System = new ScalaJS.c.jl_System$().init___()
  };
  return ScalaJS.n.jl_System
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_ThreadLocal = (function() {
  ScalaJS.c.O.call(this);
  this.hasValue$1 = false;
  this.i$1 = null;
  this.v$1 = null;
  this.m$1 = null
});
ScalaJS.c.jl_ThreadLocal.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_ThreadLocal.prototype.constructor = ScalaJS.c.jl_ThreadLocal;
/** @constructor */
ScalaJS.h.jl_ThreadLocal = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_ThreadLocal.prototype = ScalaJS.c.jl_ThreadLocal.prototype;
ScalaJS.c.jl_ThreadLocal.prototype.hasValue__p1__Z = (function() {
  return this.hasValue$1
});
ScalaJS.c.jl_ThreadLocal.prototype.hasValue$und$eq__p1__Z__V = (function(x$1) {
  this.hasValue$1 = x$1
});
ScalaJS.c.jl_ThreadLocal.prototype.v__p1__O = (function() {
  return this.v$1
});
ScalaJS.c.jl_ThreadLocal.prototype.v$und$eq__p1__O__V = (function(x$1) {
  this.v$1 = x$1
});
ScalaJS.c.jl_ThreadLocal.prototype.get__O = (function() {
  if ((!this.hasValue__p1__Z())) {
    this.set__O__V(this.initialValue__O())
  };
  return this.v__p1__O()
});
ScalaJS.c.jl_ThreadLocal.prototype.set__O__V = (function(o) {
  this.v$und$eq__p1__O__V(o);
  this.hasValue$und$eq__p1__Z__V(true)
});
ScalaJS.c.jl_ThreadLocal.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  this.hasValue$1 = false;
  this.m$1 = new ScalaJS.c.jl_ThreadLocal$ThreadLocalMap().init___();
  return this
});
/*<skip>*/;
ScalaJS.is.jl_ThreadLocal = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_ThreadLocal)))
});
ScalaJS.as.jl_ThreadLocal = (function(obj) {
  if ((ScalaJS.is.jl_ThreadLocal(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.ThreadLocal")
  }
});
ScalaJS.isArrayOf.jl_ThreadLocal = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_ThreadLocal)))
});
ScalaJS.asArrayOf.jl_ThreadLocal = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_ThreadLocal(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.ThreadLocal;", depth)
  }
});
ScalaJS.d.jl_ThreadLocal = new ScalaJS.ClassTypeData({
  jl_ThreadLocal: 0
}, false, "java.lang.ThreadLocal", ScalaJS.d.O, {
  jl_ThreadLocal: 1,
  O: 1
});
ScalaJS.c.jl_ThreadLocal.prototype.$classData = ScalaJS.d.jl_ThreadLocal;
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_ThreadLocal$ThreadLocalMap = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.jl_ThreadLocal$ThreadLocalMap.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_ThreadLocal$ThreadLocalMap.prototype.constructor = ScalaJS.c.jl_ThreadLocal$ThreadLocalMap;
/** @constructor */
ScalaJS.h.jl_ThreadLocal$ThreadLocalMap = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_ThreadLocal$ThreadLocalMap.prototype = ScalaJS.c.jl_ThreadLocal$ThreadLocalMap.prototype;
/*<skip>*/;
ScalaJS.is.jl_ThreadLocal$ThreadLocalMap = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_ThreadLocal$ThreadLocalMap)))
});
ScalaJS.as.jl_ThreadLocal$ThreadLocalMap = (function(obj) {
  if ((ScalaJS.is.jl_ThreadLocal$ThreadLocalMap(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.ThreadLocal$ThreadLocalMap")
  }
});
ScalaJS.isArrayOf.jl_ThreadLocal$ThreadLocalMap = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_ThreadLocal$ThreadLocalMap)))
});
ScalaJS.asArrayOf.jl_ThreadLocal$ThreadLocalMap = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_ThreadLocal$ThreadLocalMap(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.ThreadLocal$ThreadLocalMap;", depth)
  }
});
ScalaJS.d.jl_ThreadLocal$ThreadLocalMap = new ScalaJS.ClassTypeData({
  jl_ThreadLocal$ThreadLocalMap: 0
}, false, "java.lang.ThreadLocal$ThreadLocalMap", ScalaJS.d.O, {
  jl_ThreadLocal$ThreadLocalMap: 1,
  O: 1
});
ScalaJS.c.jl_ThreadLocal$ThreadLocalMap.prototype.$classData = ScalaJS.d.jl_ThreadLocal$ThreadLocalMap;
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_Throwable = (function() {
  ScalaJS.c.O.call(this);
  this.s$1 = null;
  this.e$1 = null;
  this.stackTrace$1 = null
});
ScalaJS.c.jl_Throwable.prototype = new ScalaJS.h.O();
ScalaJS.c.jl_Throwable.prototype.constructor = ScalaJS.c.jl_Throwable;
/** @constructor */
ScalaJS.h.jl_Throwable = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Throwable.prototype = ScalaJS.c.jl_Throwable.prototype;
ScalaJS.c.jl_Throwable.prototype.getMessage__T = (function() {
  return this.s$1
});
ScalaJS.c.jl_Throwable.prototype.fillInStackTrace__jl_Throwable = (function() {
  ScalaJS.m.sjsr_StackTrace().captureState__jl_Throwable__V(this);
  return this
});
ScalaJS.c.jl_Throwable.prototype.toString__T = (function() {
  var className = ScalaJS.objectGetClass(this).getName__T();
  var message = this.getMessage__T();
  if ((message === null)) {
    return className
  } else {
    return ((className + ": ") + message)
  }
});
ScalaJS.c.jl_Throwable.prototype.init___T__jl_Throwable = (function(s, e) {
  this.s$1 = s;
  this.e$1 = e;
  ScalaJS.c.O.prototype.init___.call(this);
  this.fillInStackTrace__jl_Throwable();
  return this
});
ScalaJS.c.jl_Throwable.prototype.init___ = (function() {
  ScalaJS.c.jl_Throwable.prototype.init___T__jl_Throwable.call(this, null, null);
  return this
});
/*<skip>*/;
ScalaJS.is.jl_Throwable = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_Throwable)))
});
ScalaJS.as.jl_Throwable = (function(obj) {
  if ((ScalaJS.is.jl_Throwable(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.Throwable")
  }
});
ScalaJS.isArrayOf.jl_Throwable = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Throwable)))
});
ScalaJS.asArrayOf.jl_Throwable = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_Throwable(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.Throwable;", depth)
  }
});
ScalaJS.d.jl_Throwable = new ScalaJS.ClassTypeData({
  jl_Throwable: 0
}, false, "java.lang.Throwable", ScalaJS.d.O, {
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.jl_Throwable.prototype.$classData = ScalaJS.d.jl_Throwable;
/*<skip>*/;
/** @constructor */
ScalaJS.c.ju_Random = (function() {
  ScalaJS.c.O.call(this);
  this.seed$1 = ScalaJS.m.sjsr_RuntimeLong().zero__sjsr_RuntimeLong();
  this.nextNextGaussian$1 = 0.0;
  this.haveNextNextGaussian$1 = false
});
ScalaJS.c.ju_Random.prototype = new ScalaJS.h.O();
ScalaJS.c.ju_Random.prototype.constructor = ScalaJS.c.ju_Random;
/** @constructor */
ScalaJS.h.ju_Random = (function() {
  /*<skip>*/
});
ScalaJS.h.ju_Random.prototype = ScalaJS.c.ju_Random.prototype;
ScalaJS.c.ju_Random.prototype.seed__p1__J = (function() {
  return this.seed$1
});
ScalaJS.c.ju_Random.prototype.seed$und$eq__p1__J__V = (function(x$1) {
  this.seed$1 = x$1
});
ScalaJS.c.ju_Random.prototype.haveNextNextGaussian$und$eq__p1__Z__V = (function(x$1) {
  this.haveNextNextGaussian$1 = x$1
});
ScalaJS.c.ju_Random.prototype.setSeed__J__V = (function(seed_in) {
  this.seed$und$eq__p1__J__V(seed_in.$$up__sjsr_RuntimeLong__sjsr_RuntimeLong(ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong(2942573, 6011, 0)).$$amp__sjsr_RuntimeLong__sjsr_RuntimeLong(ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong(4194303, 4194303, 15)));
  this.haveNextNextGaussian$und$eq__p1__Z__V(false)
});
ScalaJS.c.ju_Random.prototype.next__I__I = (function(bits) {
  this.seed$und$eq__p1__J__V(this.seed__p1__J().$$times__sjsr_RuntimeLong__sjsr_RuntimeLong(ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong(2942573, 6011, 0)).$$plus__sjsr_RuntimeLong__sjsr_RuntimeLong(ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong(11, 0, 0)).$$amp__sjsr_RuntimeLong__sjsr_RuntimeLong(ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong(4194303, 4194303, 15)));
  return this.seed__p1__J().$$greater$greater$greater__I__sjsr_RuntimeLong(((48 - bits) | 0)).toInt__I()
});
ScalaJS.c.ju_Random.prototype.nextInt__I__I = (function(n) {
  if ((n <= 0)) {
    throw new ScalaJS.c.jl_IllegalArgumentException().init___T("n must be positive")
  };
  if (((n & (-n)) === n)) {
    return ScalaJS.m.sjsr_RuntimeLong().fromInt__I__sjsr_RuntimeLong(n).$$times__sjsr_RuntimeLong__sjsr_RuntimeLong(ScalaJS.m.sjsr_RuntimeLong().fromInt__I__sjsr_RuntimeLong(this.next__I__I(31))).$$greater$greater__I__sjsr_RuntimeLong(31).toInt__I()
  } else {
    return this.loop$1__p1__I__I(n)
  }
});
ScalaJS.c.ju_Random.prototype.loop$1__p1__I__I = (function(n$1) {
  var _$this = this;
  tailCallLoop: while (true) {
    var bits = _$this.next__I__I(31);
    var value = (bits % n$1);
    if ((((((bits - value) | 0) + ((n$1 - 1) | 0)) | 0) < 0)) {
      continue tailCallLoop
    } else {
      return value
    }
  }
});
ScalaJS.c.ju_Random.prototype.init___J = (function(seed_in) {
  ScalaJS.c.O.prototype.init___.call(this);
  this.haveNextNextGaussian$1 = false;
  this.setSeed__J__V(seed_in);
  return this
});
ScalaJS.c.ju_Random.prototype.init___ = (function() {
  ScalaJS.c.ju_Random.prototype.init___J.call(this, ScalaJS.m.ju_Random().java$util$Random$$randomSeed__J());
  return this
});
/*<skip>*/;
ScalaJS.is.ju_Random = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.ju_Random)))
});
ScalaJS.as.ju_Random = (function(obj) {
  if ((ScalaJS.is.ju_Random(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.util.Random")
  }
});
ScalaJS.isArrayOf.ju_Random = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.ju_Random)))
});
ScalaJS.asArrayOf.ju_Random = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.ju_Random(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.util.Random;", depth)
  }
});
ScalaJS.d.ju_Random = new ScalaJS.ClassTypeData({
  ju_Random: 0
}, false, "java.util.Random", ScalaJS.d.O, {
  ju_Random: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.ju_Random.prototype.$classData = ScalaJS.d.ju_Random;
/*<skip>*/;
/** @constructor */
ScalaJS.c.ju_Random$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.ju_Random$.prototype = new ScalaJS.h.O();
ScalaJS.c.ju_Random$.prototype.constructor = ScalaJS.c.ju_Random$;
/** @constructor */
ScalaJS.h.ju_Random$ = (function() {
  /*<skip>*/
});
ScalaJS.h.ju_Random$.prototype = ScalaJS.c.ju_Random$.prototype;
ScalaJS.c.ju_Random$.prototype.java$util$Random$$randomSeed__J = (function() {
  return ScalaJS.m.sjsr_RuntimeLong().fromInt__I__sjsr_RuntimeLong(this.randomInt__p1__I()).$$less$less__I__sjsr_RuntimeLong(32).$$bar__sjsr_RuntimeLong__sjsr_RuntimeLong(ScalaJS.m.sjsr_RuntimeLong().fromInt__I__sjsr_RuntimeLong(this.randomInt__p1__I()).$$amp__sjsr_RuntimeLong__sjsr_RuntimeLong(ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong(4194303, 1023, 0)))
});
ScalaJS.c.ju_Random$.prototype.randomInt__p1__I = (function() {
  return ((ScalaJS.uD(ScalaJS.g["Math"]["floor"]((ScalaJS.uD(ScalaJS.g["Math"]["random"]()) * 4.294967296E9))) - 2.147483648E9) | 0)
});
/*<skip>*/;
ScalaJS.is.ju_Random$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.ju_Random$)))
});
ScalaJS.as.ju_Random$ = (function(obj) {
  if ((ScalaJS.is.ju_Random$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.util.Random$")
  }
});
ScalaJS.isArrayOf.ju_Random$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.ju_Random$)))
});
ScalaJS.asArrayOf.ju_Random$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.ju_Random$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.util.Random$;", depth)
  }
});
ScalaJS.d.ju_Random$ = new ScalaJS.ClassTypeData({
  ju_Random$: 0
}, false, "java.util.Random$", ScalaJS.d.O, {
  ju_Random$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.ju_Random$.prototype.$classData = ScalaJS.d.ju_Random$;
ScalaJS.n.ju_Random = undefined;
ScalaJS.m.ju_Random = (function() {
  if ((!ScalaJS.n.ju_Random)) {
    ScalaJS.n.ju_Random = new ScalaJS.c.ju_Random$().init___()
  };
  return ScalaJS.n.ju_Random
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.ju_regex_Matcher = (function() {
  ScalaJS.c.O.call(this);
  this.pattern0$1 = null;
  this.input0$1 = null;
  this.regionStart0$1 = 0;
  this.regionEnd0$1 = 0;
  this.regexp$1 = null;
  this.inputstr$1 = null;
  this.lastMatch$1 = null;
  this.lastMatchIsValid$1 = false;
  this.canStillFind$1 = false;
  this.appendPos$1 = 0
});
ScalaJS.c.ju_regex_Matcher.prototype = new ScalaJS.h.O();
ScalaJS.c.ju_regex_Matcher.prototype.constructor = ScalaJS.c.ju_regex_Matcher;
/** @constructor */
ScalaJS.h.ju_regex_Matcher = (function() {
  /*<skip>*/
});
ScalaJS.h.ju_regex_Matcher.prototype = ScalaJS.c.ju_regex_Matcher.prototype;
ScalaJS.c.ju_regex_Matcher.prototype.pattern0__p1__ju_regex_Pattern = (function() {
  return this.pattern0$1
});
ScalaJS.c.ju_regex_Matcher.prototype.input0__p1__jl_CharSequence = (function() {
  return this.input0$1
});
ScalaJS.c.ju_regex_Matcher.prototype.regionStart0__p1__I = (function() {
  return this.regionStart0$1
});
ScalaJS.c.ju_regex_Matcher.prototype.regionEnd0__p1__I = (function() {
  return this.regionEnd0$1
});
ScalaJS.c.ju_regex_Matcher.prototype.regexp__p1__sjs_js_RegExp = (function() {
  return this.regexp$1
});
ScalaJS.c.ju_regex_Matcher.prototype.inputstr__p1__T = (function() {
  return this.inputstr$1
});
ScalaJS.c.ju_regex_Matcher.prototype.lastMatch__p1__sjs_js_RegExp$ExecResult = (function() {
  return this.lastMatch$1
});
ScalaJS.c.ju_regex_Matcher.prototype.lastMatch$und$eq__p1__sjs_js_RegExp$ExecResult__V = (function(x$1) {
  this.lastMatch$1 = x$1
});
ScalaJS.c.ju_regex_Matcher.prototype.lastMatchIsValid$und$eq__p1__Z__V = (function(x$1) {
  this.lastMatchIsValid$1 = x$1
});
ScalaJS.c.ju_regex_Matcher.prototype.canStillFind__p1__Z = (function() {
  return this.canStillFind$1
});
ScalaJS.c.ju_regex_Matcher.prototype.canStillFind$und$eq__p1__Z__V = (function(x$1) {
  this.canStillFind$1 = x$1
});
ScalaJS.c.ju_regex_Matcher.prototype.find__Z = (function() {
  if (this.canStillFind__p1__Z()) {
    this.lastMatchIsValid$und$eq__p1__Z__V(true);
    this.lastMatch$und$eq__p1__sjs_js_RegExp$ExecResult__V(this.regexp__p1__sjs_js_RegExp()["exec"](this.inputstr__p1__T()));
    if ((this.lastMatch__p1__sjs_js_RegExp$ExecResult() !== null)) {
      if (ScalaJS.i.sjsr_RuntimeString$class__isEmpty__sjsr_RuntimeString__Z(ScalaJS.as.T(ScalaJS.m.sjs_js_UndefOrOps().get$extension__sjs_js_UndefOr__O(ScalaJS.m.sjs_js_UndefOr().undefOr2ops__sjs_js_UndefOr__sjs_js_UndefOr(ScalaJS.as.O(this.lastMatch__p1__sjs_js_RegExp$ExecResult()[0])))))) {
        var ev$1 = this.regexp__p1__sjs_js_RegExp();
        ev$1["lastIndex"] = ((ScalaJS.uI(ev$1["lastIndex"]) + 1) | 0)
      }
    } else {
      this.canStillFind$und$eq__p1__Z__V(false)
    };
    return (this.lastMatch__p1__sjs_js_RegExp$ExecResult() !== null)
  } else {
    return false
  }
});
ScalaJS.c.ju_regex_Matcher.prototype.ensureLastMatch__p1__sjs_js_RegExp$ExecResult = (function() {
  if ((this.lastMatch__p1__sjs_js_RegExp$ExecResult() === null)) {
    throw new ScalaJS.c.jl_IllegalStateException().init___T("No match available")
  };
  return this.lastMatch__p1__sjs_js_RegExp$ExecResult()
});
ScalaJS.c.ju_regex_Matcher.prototype.start__I = (function() {
  return ScalaJS.uI(this.ensureLastMatch__p1__sjs_js_RegExp$ExecResult()["index"])
});
ScalaJS.c.ju_regex_Matcher.prototype.end__I = (function() {
  return ((this.start__I() + ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I(this.group__T())) | 0)
});
ScalaJS.c.ju_regex_Matcher.prototype.group__T = (function() {
  return ScalaJS.as.T(ScalaJS.m.sjs_js_UndefOrOps().get$extension__sjs_js_UndefOr__O(ScalaJS.m.sjs_js_UndefOr().undefOr2ops__sjs_js_UndefOr__sjs_js_UndefOr(ScalaJS.as.O(this.ensureLastMatch__p1__sjs_js_RegExp$ExecResult()[0]))))
});
ScalaJS.c.ju_regex_Matcher.prototype.init___ju_regex_Pattern__jl_CharSequence__I__I = (function(pattern0, input0, regionStart0, regionEnd0) {
  this.pattern0$1 = pattern0;
  this.input0$1 = input0;
  this.regionStart0$1 = regionStart0;
  this.regionEnd0$1 = regionEnd0;
  ScalaJS.c.O.prototype.init___.call(this);
  this.regexp$1 = new ScalaJS.g["RegExp"](this.pattern0__p1__ju_regex_Pattern().jspattern__T(), this.pattern0__p1__ju_regex_Pattern().jsflags__T());
  this.inputstr$1 = ScalaJS.objectToString(ScalaJS.charSequenceSubSequence(this.input0__p1__jl_CharSequence(), this.regionStart0__p1__I(), this.regionEnd0__p1__I()));
  this.lastMatch$1 = null;
  this.lastMatchIsValid$1 = false;
  this.canStillFind$1 = true;
  this.appendPos$1 = 0;
  return this
});
/*<skip>*/;
ScalaJS.is.ju_regex_Matcher = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.ju_regex_Matcher)))
});
ScalaJS.as.ju_regex_Matcher = (function(obj) {
  if ((ScalaJS.is.ju_regex_Matcher(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.util.regex.Matcher")
  }
});
ScalaJS.isArrayOf.ju_regex_Matcher = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.ju_regex_Matcher)))
});
ScalaJS.asArrayOf.ju_regex_Matcher = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.ju_regex_Matcher(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.util.regex.Matcher;", depth)
  }
});
ScalaJS.d.ju_regex_Matcher = new ScalaJS.ClassTypeData({
  ju_regex_Matcher: 0
}, false, "java.util.regex.Matcher", ScalaJS.d.O, {
  ju_regex_Matcher: 1,
  O: 1
});
ScalaJS.c.ju_regex_Matcher.prototype.$classData = ScalaJS.d.ju_regex_Matcher;
/*<skip>*/;
/** @constructor */
ScalaJS.c.ju_regex_Pattern = (function() {
  ScalaJS.c.O.call(this);
  this.pattern0$1 = null;
  this.flags0$1 = 0;
  this.jspattern$1 = null;
  this.jsflags$1 = null
});
ScalaJS.c.ju_regex_Pattern.prototype = new ScalaJS.h.O();
ScalaJS.c.ju_regex_Pattern.prototype.constructor = ScalaJS.c.ju_regex_Pattern;
/** @constructor */
ScalaJS.h.ju_regex_Pattern = (function() {
  /*<skip>*/
});
ScalaJS.h.ju_regex_Pattern.prototype = ScalaJS.c.ju_regex_Pattern.prototype;
ScalaJS.c.ju_regex_Pattern.prototype.flags__I = (function() {
  return this.flags0$1
});
ScalaJS.c.ju_regex_Pattern.prototype.jspattern__T = (function() {
  return this.jspattern$1
});
ScalaJS.c.ju_regex_Pattern.prototype.jsflags__T = (function() {
  return this.jsflags$1
});
ScalaJS.c.ju_regex_Pattern.prototype.toString__T = (function() {
  return this.pattern0$1
});
ScalaJS.c.ju_regex_Pattern.prototype.matcher__jl_CharSequence__ju_regex_Matcher = (function(input) {
  return new ScalaJS.c.ju_regex_Matcher().init___ju_regex_Pattern__jl_CharSequence__I__I(this, input, 0, ScalaJS.charSequenceLength(input))
});
ScalaJS.c.ju_regex_Pattern.prototype.split__jl_CharSequence__I__AT = (function(input, limit) {
  var hasLimit = (limit > 0);
  if (hasLimit) {
    var lim = limit
  } else {
    var lim = 2147483647
  };
  var result = new ScalaJS.g["Array"](0);
  var inputStr = ScalaJS.objectToString(input);
  var matcher = this.matcher__jl_CharSequence__ju_regex_Matcher(inputStr);
  var prevEnd = 0;
  while (((ScalaJS.uI(result["length"]) < ((lim - 1) | 0)) && matcher.find__Z())) {
    ScalaJS.uI(result["push"](ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__I__T(inputStr, prevEnd, matcher.start__I())));
    prevEnd = matcher.end__I()
  };
  ScalaJS.uI(result["push"](ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__T(inputStr, prevEnd)));
  var len = ScalaJS.uI(result["length"]);
  if ((limit === 0)) {
    while (((len > 0) && ScalaJS.i.sjsr_RuntimeString$class__isEmpty__sjsr_RuntimeString__Z(ScalaJS.as.T(ScalaJS.as.O(result[((len - 1) | 0)]))))) {
      len = ((len - 1) | 0)
    }
  };
  var actualResult = ScalaJS.newArrayObject(ScalaJS.d.T.getArrayOf(), [len]);
  var i = 0;
  while ((i < len)) {
    actualResult.u[i] = ScalaJS.as.T(ScalaJS.as.O(result[i]));
    i = ((i + 1) | 0)
  };
  return actualResult
});
ScalaJS.c.ju_regex_Pattern.prototype.init___T__I = (function(pattern0, flags0) {
  this.pattern0$1 = pattern0;
  this.flags0$1 = flags0;
  ScalaJS.c.O.prototype.init___.call(this);
  if (((flags0 & 16) !== 0)) {
    var jsx$1 = ScalaJS.m.ju_regex_Pattern().quote__T__T(pattern0)
  } else {
    var m = ScalaJS.m.ju_regex_Pattern().java$util$regex$Pattern$$splitHackPat__sjs_js_RegExp()["exec"](pattern0);
    if ((m !== null)) {
      var jsx$1 = ScalaJS.m.ju_regex_Pattern().quote__T__T(ScalaJS.as.T(ScalaJS.m.sjs_js_UndefOrOps().get$extension__sjs_js_UndefOr__O(ScalaJS.m.sjs_js_UndefOr().undefOr2ops__sjs_js_UndefOr__sjs_js_UndefOr(ScalaJS.as.O(m[1])))))
    } else {
      var jsx$1 = pattern0
    }
  };
  this.jspattern$1 = jsx$1;
  var f = "g";
  if (((this.flags__I() & 2) !== 0)) {
    f = (f + "i")
  };
  if (((this.flags__I() & 8) !== 0)) {
    f = (f + "m")
  };
  var jsx$2 = f;
  this.jsflags$1 = jsx$2;
  return this
});
/*<skip>*/;
ScalaJS.is.ju_regex_Pattern = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.ju_regex_Pattern)))
});
ScalaJS.as.ju_regex_Pattern = (function(obj) {
  if ((ScalaJS.is.ju_regex_Pattern(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.util.regex.Pattern")
  }
});
ScalaJS.isArrayOf.ju_regex_Pattern = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.ju_regex_Pattern)))
});
ScalaJS.asArrayOf.ju_regex_Pattern = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.ju_regex_Pattern(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.util.regex.Pattern;", depth)
  }
});
ScalaJS.d.ju_regex_Pattern = new ScalaJS.ClassTypeData({
  ju_regex_Pattern: 0
}, false, "java.util.regex.Pattern", ScalaJS.d.O, {
  ju_regex_Pattern: 1,
  O: 1
});
ScalaJS.c.ju_regex_Pattern.prototype.$classData = ScalaJS.d.ju_regex_Pattern;
/*<skip>*/;
/** @constructor */
ScalaJS.c.ju_regex_Pattern$ = (function() {
  ScalaJS.c.O.call(this);
  this.UNIX$undLINES$1 = 0;
  this.CASE$undINSENSITIVE$1 = 0;
  this.COMMENTS$1 = 0;
  this.MULTILINE$1 = 0;
  this.LITERAL$1 = 0;
  this.DOTALL$1 = 0;
  this.UNICODE$undCASE$1 = 0;
  this.CANON$undEQ$1 = 0;
  this.UNICODE$undCHARACTER$undCLASS$1 = 0;
  this.java$util$regex$Pattern$$splitHackPat$1 = null
});
ScalaJS.c.ju_regex_Pattern$.prototype = new ScalaJS.h.O();
ScalaJS.c.ju_regex_Pattern$.prototype.constructor = ScalaJS.c.ju_regex_Pattern$;
/** @constructor */
ScalaJS.h.ju_regex_Pattern$ = (function() {
  /*<skip>*/
});
ScalaJS.h.ju_regex_Pattern$.prototype = ScalaJS.c.ju_regex_Pattern$.prototype;
ScalaJS.c.ju_regex_Pattern$.prototype.compile__T__ju_regex_Pattern = (function(regex) {
  return new ScalaJS.c.ju_regex_Pattern().init___T__I(regex, 0)
});
ScalaJS.c.ju_regex_Pattern$.prototype.quote__T__T = (function(s) {
  var result = "";
  var i = 0;
  while ((i < ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I(s))) {
    var c = ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C(s, i);
    var jsx$2 = result;
    var x1 = c;
    switch (x1) {
      case 92:
        /*<skip>*/;
      case 46:
        /*<skip>*/;
      case 40:
        /*<skip>*/;
      case 41:
        /*<skip>*/;
      case 91:
        /*<skip>*/;
      case 93:
        /*<skip>*/;
      case 123:
        /*<skip>*/;
      case 125:
        /*<skip>*/;
      case 124:
        /*<skip>*/;
      case 63:
        /*<skip>*/;
      case 42:
        /*<skip>*/;
      case 43:
        /*<skip>*/;
      case 94:
        /*<skip>*/;
      case 36:
        {
          var jsx$1 = ("\\" + ScalaJS.bC(c));
          break
        };
      default:
        var jsx$1 = ScalaJS.bC(c);
    };
    result = (("" + jsx$2) + jsx$1);
    i = ((i + 1) | 0)
  };
  return result
});
ScalaJS.c.ju_regex_Pattern$.prototype.java$util$regex$Pattern$$splitHackPat__sjs_js_RegExp = (function() {
  return this.java$util$regex$Pattern$$splitHackPat$1
});
ScalaJS.c.ju_regex_Pattern$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.ju_regex_Pattern = this;
  this.java$util$regex$Pattern$$splitHackPat$1 = new ScalaJS.g["RegExp"]("^\\\\Q(.)\\\\E$");
  return this
});
/*<skip>*/;
ScalaJS.is.ju_regex_Pattern$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.ju_regex_Pattern$)))
});
ScalaJS.as.ju_regex_Pattern$ = (function(obj) {
  if ((ScalaJS.is.ju_regex_Pattern$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.util.regex.Pattern$")
  }
});
ScalaJS.isArrayOf.ju_regex_Pattern$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.ju_regex_Pattern$)))
});
ScalaJS.asArrayOf.ju_regex_Pattern$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.ju_regex_Pattern$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.util.regex.Pattern$;", depth)
  }
});
ScalaJS.d.ju_regex_Pattern$ = new ScalaJS.ClassTypeData({
  ju_regex_Pattern$: 0
}, false, "java.util.regex.Pattern$", ScalaJS.d.O, {
  ju_regex_Pattern$: 1,
  O: 1
});
ScalaJS.c.ju_regex_Pattern$.prototype.$classData = ScalaJS.d.ju_regex_Pattern$;
ScalaJS.n.ju_regex_Pattern = undefined;
ScalaJS.m.ju_regex_Pattern = (function() {
  if ((!ScalaJS.n.ju_regex_Pattern)) {
    ScalaJS.n.ju_regex_Pattern = new ScalaJS.c.ju_regex_Pattern$().init___()
  };
  return ScalaJS.n.ju_regex_Pattern
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_DeprecatedConsole = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_DeprecatedConsole.prototype = new ScalaJS.h.O();
ScalaJS.c.s_DeprecatedConsole.prototype.constructor = ScalaJS.c.s_DeprecatedConsole;
/** @constructor */
ScalaJS.h.s_DeprecatedConsole = (function() {
  /*<skip>*/
});
ScalaJS.h.s_DeprecatedConsole.prototype = ScalaJS.c.s_DeprecatedConsole.prototype;
/*<skip>*/;
ScalaJS.is.s_DeprecatedConsole = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_DeprecatedConsole)))
});
ScalaJS.as.s_DeprecatedConsole = (function(obj) {
  if ((ScalaJS.is.s_DeprecatedConsole(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.DeprecatedConsole")
  }
});
ScalaJS.isArrayOf.s_DeprecatedConsole = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_DeprecatedConsole)))
});
ScalaJS.asArrayOf.s_DeprecatedConsole = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_DeprecatedConsole(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.DeprecatedConsole;", depth)
  }
});
ScalaJS.d.s_DeprecatedConsole = new ScalaJS.ClassTypeData({
  s_DeprecatedConsole: 0
}, false, "scala.DeprecatedConsole", ScalaJS.d.O, {
  s_DeprecatedConsole: 1,
  O: 1
});
ScalaJS.c.s_DeprecatedConsole.prototype.$classData = ScalaJS.d.s_DeprecatedConsole;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_LowPriorityImplicits = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_LowPriorityImplicits.prototype = new ScalaJS.h.O();
ScalaJS.c.s_LowPriorityImplicits.prototype.constructor = ScalaJS.c.s_LowPriorityImplicits;
/** @constructor */
ScalaJS.h.s_LowPriorityImplicits = (function() {
  /*<skip>*/
});
ScalaJS.h.s_LowPriorityImplicits.prototype = ScalaJS.c.s_LowPriorityImplicits.prototype;
ScalaJS.c.s_LowPriorityImplicits.prototype.genericWrapArray__O__scm_WrappedArray = (function(xs) {
  if ((xs === null)) {
    return null
  } else {
    return ScalaJS.m.scm_WrappedArray().make__O__scm_WrappedArray(xs)
  }
});
ScalaJS.c.s_LowPriorityImplicits.prototype.wrapRefArray__AO__scm_WrappedArray = (function(xs) {
  if ((xs === null)) {
    return null
  } else {
    if ((xs.u["length"] === 0)) {
      return ScalaJS.m.scm_WrappedArray().empty__scm_WrappedArray()
    } else {
      return new ScalaJS.c.scm_WrappedArray$ofRef().init___AO(xs)
    }
  }
});
ScalaJS.c.s_LowPriorityImplicits.prototype.wrapIntArray__AI__scm_WrappedArray = (function(xs) {
  if ((xs !== null)) {
    return new ScalaJS.c.scm_WrappedArray$ofInt().init___AI(xs)
  } else {
    return null
  }
});
/*<skip>*/;
ScalaJS.is.s_LowPriorityImplicits = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_LowPriorityImplicits)))
});
ScalaJS.as.s_LowPriorityImplicits = (function(obj) {
  if ((ScalaJS.is.s_LowPriorityImplicits(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.LowPriorityImplicits")
  }
});
ScalaJS.isArrayOf.s_LowPriorityImplicits = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_LowPriorityImplicits)))
});
ScalaJS.asArrayOf.s_LowPriorityImplicits = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_LowPriorityImplicits(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.LowPriorityImplicits;", depth)
  }
});
ScalaJS.d.s_LowPriorityImplicits = new ScalaJS.ClassTypeData({
  s_LowPriorityImplicits: 0
}, false, "scala.LowPriorityImplicits", ScalaJS.d.O, {
  s_LowPriorityImplicits: 1,
  O: 1
});
ScalaJS.c.s_LowPriorityImplicits.prototype.$classData = ScalaJS.d.s_LowPriorityImplicits;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_Option = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_Option.prototype = new ScalaJS.h.O();
ScalaJS.c.s_Option.prototype.constructor = ScalaJS.c.s_Option;
/** @constructor */
ScalaJS.h.s_Option = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Option.prototype = ScalaJS.c.s_Option.prototype;
ScalaJS.c.s_Option.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.i.s_Product$class__$init$__s_Product__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.s_Option = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_Option)))
});
ScalaJS.as.s_Option = (function(obj) {
  if ((ScalaJS.is.s_Option(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.Option")
  }
});
ScalaJS.isArrayOf.s_Option = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_Option)))
});
ScalaJS.asArrayOf.s_Option = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_Option(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.Option;", depth)
  }
});
ScalaJS.d.s_Option = new ScalaJS.ClassTypeData({
  s_Option: 0
}, false, "scala.Option", ScalaJS.d.O, {
  s_Option: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.s_Option.prototype.$classData = ScalaJS.d.s_Option;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_Predef$$anon$3 = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_Predef$$anon$3.prototype = new ScalaJS.h.O();
ScalaJS.c.s_Predef$$anon$3.prototype.constructor = ScalaJS.c.s_Predef$$anon$3;
/** @constructor */
ScalaJS.h.s_Predef$$anon$3 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Predef$$anon$3.prototype = ScalaJS.c.s_Predef$$anon$3.prototype;
/*<skip>*/;
ScalaJS.is.s_Predef$$anon$3 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_Predef$$anon$3)))
});
ScalaJS.as.s_Predef$$anon$3 = (function(obj) {
  if ((ScalaJS.is.s_Predef$$anon$3(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.Predef$$anon$3")
  }
});
ScalaJS.isArrayOf.s_Predef$$anon$3 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_Predef$$anon$3)))
});
ScalaJS.asArrayOf.s_Predef$$anon$3 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_Predef$$anon$3(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.Predef$$anon$3;", depth)
  }
});
ScalaJS.d.s_Predef$$anon$3 = new ScalaJS.ClassTypeData({
  s_Predef$$anon$3: 0
}, false, "scala.Predef$$anon$3", ScalaJS.d.O, {
  s_Predef$$anon$3: 1,
  scg_CanBuildFrom: 1,
  O: 1
});
ScalaJS.c.s_Predef$$anon$3.prototype.$classData = ScalaJS.d.s_Predef$$anon$3;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_Predef$$eq$colon$eq = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_Predef$$eq$colon$eq.prototype = new ScalaJS.h.O();
ScalaJS.c.s_Predef$$eq$colon$eq.prototype.constructor = ScalaJS.c.s_Predef$$eq$colon$eq;
/** @constructor */
ScalaJS.h.s_Predef$$eq$colon$eq = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Predef$$eq$colon$eq.prototype = ScalaJS.c.s_Predef$$eq$colon$eq.prototype;
ScalaJS.c.s_Predef$$eq$colon$eq.prototype.toString__T = (function() {
  return ScalaJS.i.s_Function1$class__toString__F1__T(this)
});
ScalaJS.c.s_Predef$$eq$colon$eq.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.i.s_Function1$class__$init$__F1__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.s_Predef$$eq$colon$eq = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_Predef$$eq$colon$eq)))
});
ScalaJS.as.s_Predef$$eq$colon$eq = (function(obj) {
  if ((ScalaJS.is.s_Predef$$eq$colon$eq(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.Predef$$eq$colon$eq")
  }
});
ScalaJS.isArrayOf.s_Predef$$eq$colon$eq = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_Predef$$eq$colon$eq)))
});
ScalaJS.asArrayOf.s_Predef$$eq$colon$eq = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_Predef$$eq$colon$eq(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.Predef$$eq$colon$eq;", depth)
  }
});
ScalaJS.d.s_Predef$$eq$colon$eq = new ScalaJS.ClassTypeData({
  s_Predef$$eq$colon$eq: 0
}, false, "scala.Predef$$eq$colon$eq", ScalaJS.d.O, {
  s_Predef$$eq$colon$eq: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  F1: 1,
  O: 1
});
ScalaJS.c.s_Predef$$eq$colon$eq.prototype.$classData = ScalaJS.d.s_Predef$$eq$colon$eq;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_Predef$$less$colon$less = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_Predef$$less$colon$less.prototype = new ScalaJS.h.O();
ScalaJS.c.s_Predef$$less$colon$less.prototype.constructor = ScalaJS.c.s_Predef$$less$colon$less;
/** @constructor */
ScalaJS.h.s_Predef$$less$colon$less = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Predef$$less$colon$less.prototype = ScalaJS.c.s_Predef$$less$colon$less.prototype;
ScalaJS.c.s_Predef$$less$colon$less.prototype.toString__T = (function() {
  return ScalaJS.i.s_Function1$class__toString__F1__T(this)
});
ScalaJS.c.s_Predef$$less$colon$less.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.i.s_Function1$class__$init$__F1__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.s_Predef$$less$colon$less = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_Predef$$less$colon$less)))
});
ScalaJS.as.s_Predef$$less$colon$less = (function(obj) {
  if ((ScalaJS.is.s_Predef$$less$colon$less(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.Predef$$less$colon$less")
  }
});
ScalaJS.isArrayOf.s_Predef$$less$colon$less = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_Predef$$less$colon$less)))
});
ScalaJS.asArrayOf.s_Predef$$less$colon$less = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_Predef$$less$colon$less(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.Predef$$less$colon$less;", depth)
  }
});
ScalaJS.d.s_Predef$$less$colon$less = new ScalaJS.ClassTypeData({
  s_Predef$$less$colon$less: 0
}, false, "scala.Predef$$less$colon$less", ScalaJS.d.O, {
  s_Predef$$less$colon$less: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  F1: 1,
  O: 1
});
ScalaJS.c.s_Predef$$less$colon$less.prototype.$classData = ScalaJS.d.s_Predef$$less$colon$less;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_Predef$ArrowAssoc$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_Predef$ArrowAssoc$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_Predef$ArrowAssoc$.prototype.constructor = ScalaJS.c.s_Predef$ArrowAssoc$;
/** @constructor */
ScalaJS.h.s_Predef$ArrowAssoc$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Predef$ArrowAssoc$.prototype = ScalaJS.c.s_Predef$ArrowAssoc$.prototype;
ScalaJS.c.s_Predef$ArrowAssoc$.prototype.$$minus$greater$extension__O__O__T2 = (function($$this, y) {
  return new ScalaJS.c.T2().init___O__O($$this, y)
});
/*<skip>*/;
ScalaJS.is.s_Predef$ArrowAssoc$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_Predef$ArrowAssoc$)))
});
ScalaJS.as.s_Predef$ArrowAssoc$ = (function(obj) {
  if ((ScalaJS.is.s_Predef$ArrowAssoc$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.Predef$ArrowAssoc$")
  }
});
ScalaJS.isArrayOf.s_Predef$ArrowAssoc$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_Predef$ArrowAssoc$)))
});
ScalaJS.asArrayOf.s_Predef$ArrowAssoc$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_Predef$ArrowAssoc$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.Predef$ArrowAssoc$;", depth)
  }
});
ScalaJS.d.s_Predef$ArrowAssoc$ = new ScalaJS.ClassTypeData({
  s_Predef$ArrowAssoc$: 0
}, false, "scala.Predef$ArrowAssoc$", ScalaJS.d.O, {
  s_Predef$ArrowAssoc$: 1,
  O: 1
});
ScalaJS.c.s_Predef$ArrowAssoc$.prototype.$classData = ScalaJS.d.s_Predef$ArrowAssoc$;
ScalaJS.n.s_Predef$ArrowAssoc = undefined;
ScalaJS.m.s_Predef$ArrowAssoc = (function() {
  if ((!ScalaJS.n.s_Predef$ArrowAssoc)) {
    ScalaJS.n.s_Predef$ArrowAssoc = new ScalaJS.c.s_Predef$ArrowAssoc$().init___()
  };
  return ScalaJS.n.s_Predef$ArrowAssoc
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_StringContext = (function() {
  ScalaJS.c.O.call(this);
  this.parts$1 = null
});
ScalaJS.c.s_StringContext.prototype = new ScalaJS.h.O();
ScalaJS.c.s_StringContext.prototype.constructor = ScalaJS.c.s_StringContext;
/** @constructor */
ScalaJS.h.s_StringContext = (function() {
  /*<skip>*/
});
ScalaJS.h.s_StringContext.prototype = ScalaJS.c.s_StringContext.prototype;
ScalaJS.c.s_StringContext.prototype.parts__sc_Seq = (function() {
  return this.parts$1
});
ScalaJS.c.s_StringContext.prototype.checkLengths__sc_Seq__V = (function(args) {
  if ((this.parts__sc_Seq().length__I() !== ((args.length__I() + 1) | 0))) {
    throw new ScalaJS.c.jl_IllegalArgumentException().init___T((((("wrong number of arguments (" + args.length__I()) + ") for interpolated string with ") + this.parts__sc_Seq().length__I()) + " parts"))
  }
});
ScalaJS.c.s_StringContext.prototype.s__sc_Seq__T = (function(args) {
  return this.standardInterpolator__F1__sc_Seq__T(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(str$2) {
    var str = ScalaJS.as.T(str$2);
    return this.$$anonfun$1__p1__T__T(str)
  })["bind"](this)), args)
});
ScalaJS.c.s_StringContext.prototype.standardInterpolator__F1__sc_Seq__T = (function(process, args) {
  this.checkLengths__sc_Seq__V(args);
  var pi = this.parts__sc_Seq().iterator__sc_Iterator();
  var ai = args.iterator__sc_Iterator();
  var bldr = new ScalaJS.c.jl_StringBuilder().init___T(ScalaJS.as.T(process.apply__O__O(pi.next__O())));
  while (ai.hasNext__Z()) {
    bldr.append__O__jl_StringBuilder(ai.next__O());
    bldr.append__T__jl_StringBuilder(ScalaJS.as.T(process.apply__O__O(pi.next__O())))
  };
  return bldr.toString__T()
});
ScalaJS.c.s_StringContext.prototype.productPrefix__T = (function() {
  return "StringContext"
});
ScalaJS.c.s_StringContext.prototype.productArity__I = (function() {
  return 1
});
ScalaJS.c.s_StringContext.prototype.productElement__I__O = (function(x$1) {
  var x1 = x$1;
  switch (x1) {
    case 0:
      {
        return this.parts__sc_Seq();
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.s_StringContext.prototype.productIterator__sc_Iterator = (function() {
  return ScalaJS.m.sr_ScalaRunTime().typedProductIterator__s_Product__sc_Iterator(this)
});
ScalaJS.c.s_StringContext.prototype.canEqual__O__Z = (function(x$1) {
  return ScalaJS.is.s_StringContext(x$1)
});
ScalaJS.c.s_StringContext.prototype.hashCode__I = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undhashCode__s_Product__I(this)
});
ScalaJS.c.s_StringContext.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.s_StringContext.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else {
    var x1 = x$1;
    matchEnd4: {
      if (ScalaJS.is.s_StringContext(x1)) {
        var jsx$1 = true;
        break matchEnd4
      };
      var jsx$1 = false;
      break matchEnd4
    };
    if (jsx$1) {
      var StringContext$1 = ScalaJS.as.s_StringContext(x$1);
      return (ScalaJS.anyRefEqEq(this.parts__sc_Seq(), StringContext$1.parts__sc_Seq()) && StringContext$1.canEqual__O__Z(this))
    } else {
      return false
    }
  }
});
ScalaJS.c.s_StringContext.prototype.$$anonfun$1__p1__T__T = (function(str) {
  return ScalaJS.m.s_StringContext().treatEscapes__T__T(str)
});
ScalaJS.c.s_StringContext.prototype.init___sc_Seq = (function(parts) {
  this.parts$1 = parts;
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.i.s_Product$class__$init$__s_Product__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.s_StringContext = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_StringContext)))
});
ScalaJS.as.s_StringContext = (function(obj) {
  if ((ScalaJS.is.s_StringContext(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.StringContext")
  }
});
ScalaJS.isArrayOf.s_StringContext = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_StringContext)))
});
ScalaJS.asArrayOf.s_StringContext = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_StringContext(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.StringContext;", depth)
  }
});
ScalaJS.d.s_StringContext = new ScalaJS.ClassTypeData({
  s_StringContext: 0
}, false, "scala.StringContext", ScalaJS.d.O, {
  s_StringContext: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.s_StringContext.prototype.$classData = ScalaJS.d.s_StringContext;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_StringContext$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_StringContext$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_StringContext$.prototype.constructor = ScalaJS.c.s_StringContext$;
/** @constructor */
ScalaJS.h.s_StringContext$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_StringContext$.prototype = ScalaJS.c.s_StringContext$.prototype;
ScalaJS.c.s_StringContext$.prototype.treatEscapes__T__T = (function(str) {
  return this.treatEscapes0__p1__T__Z__T(str, false)
});
ScalaJS.c.s_StringContext$.prototype.treatEscapes0__p1__T__Z__T = (function(str, strict) {
  var bldr$lzy = ScalaJS.m.sr_ObjectRef().zero__sr_ObjectRef();
  var bitmap$0 = ScalaJS.m.sr_VolatileByteRef().create__B__sr_VolatileByteRef(0);
  var len = ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I(str);
  var start = ScalaJS.m.sr_IntRef().create__I__sr_IntRef(0);
  var cur = ScalaJS.m.sr_IntRef().create__I__sr_IntRef(0);
  var idx = ScalaJS.m.sr_IntRef().create__I__sr_IntRef(0);
  while ((idx.elem$1 < len)) {
    cur.elem$1 = idx.elem$1;
    if ((ScalaJS.m.sci_StringOps().apply$extension__T__I__C(ScalaJS.m.s_Predef().augmentString__T__T(str), idx.elem$1) === 92)) {
      idx.elem$1 = ((idx.elem$1 + 1) | 0);
      if ((idx.elem$1 >= len)) {
        throw new ScalaJS.c.s_StringContext$InvalidEscapeException().init___T__I(str, cur.elem$1)
      };
      if (((48 <= ScalaJS.m.sci_StringOps().apply$extension__T__I__C(ScalaJS.m.s_Predef().augmentString__T__T(str), idx.elem$1)) && (ScalaJS.m.sci_StringOps().apply$extension__T__I__C(ScalaJS.m.s_Predef().augmentString__T__T(str), idx.elem$1) <= 55))) {
        if (strict) {
          throw new ScalaJS.c.s_StringContext$InvalidEscapeException().init___T__I(str, cur.elem$1)
        };
        var leadch = ScalaJS.m.sci_StringOps().apply$extension__T__I__C(ScalaJS.m.s_Predef().augmentString__T__T(str), idx.elem$1);
        var oct = ((leadch - 48) | 0);
        idx.elem$1 = ((idx.elem$1 + 1) | 0);
        if ((((idx.elem$1 < len) && (48 <= ScalaJS.m.sci_StringOps().apply$extension__T__I__C(ScalaJS.m.s_Predef().augmentString__T__T(str), idx.elem$1))) && (ScalaJS.m.sci_StringOps().apply$extension__T__I__C(ScalaJS.m.s_Predef().augmentString__T__T(str), idx.elem$1) <= 55))) {
          oct = ((((ScalaJS.imul(oct, 8) + ScalaJS.m.sci_StringOps().apply$extension__T__I__C(ScalaJS.m.s_Predef().augmentString__T__T(str), idx.elem$1)) | 0) - 48) | 0);
          idx.elem$1 = ((idx.elem$1 + 1) | 0);
          if (((((idx.elem$1 < len) && (leadch <= 51)) && (48 <= ScalaJS.m.sci_StringOps().apply$extension__T__I__C(ScalaJS.m.s_Predef().augmentString__T__T(str), idx.elem$1))) && (ScalaJS.m.sci_StringOps().apply$extension__T__I__C(ScalaJS.m.s_Predef().augmentString__T__T(str), idx.elem$1) <= 55))) {
            oct = ((((ScalaJS.imul(oct, 8) + ScalaJS.m.sci_StringOps().apply$extension__T__I__C(ScalaJS.m.s_Predef().augmentString__T__T(str), idx.elem$1)) | 0) - 48) | 0);
            idx.elem$1 = ((idx.elem$1 + 1) | 0)
          }
        };
        this.output$1__p1__C__T__sr_ObjectRef__sr_IntRef__sr_IntRef__sr_IntRef__sr_VolatileByteRef__V((oct & 65535), str, bldr$lzy, start, cur, idx, bitmap$0)
      } else {
        var ch = ScalaJS.m.sci_StringOps().apply$extension__T__I__C(ScalaJS.m.s_Predef().augmentString__T__T(str), idx.elem$1);
        idx.elem$1 = ((idx.elem$1 + 1) | 0);
        var x1 = ch;
        switch (x1) {
          case 98:
            {
              var jsx$1 = 8;
              break
            };
          case 116:
            {
              var jsx$1 = 9;
              break
            };
          case 110:
            {
              var jsx$1 = 10;
              break
            };
          case 102:
            {
              var jsx$1 = 12;
              break
            };
          case 114:
            {
              var jsx$1 = 13;
              break
            };
          case 34:
            {
              var jsx$1 = 34;
              break
            };
          case 39:
            {
              var jsx$1 = 39;
              break
            };
          case 92:
            {
              var jsx$1 = 92;
              break
            };
          default:
            throw new ScalaJS.c.s_StringContext$InvalidEscapeException().init___T__I(str, cur.elem$1);
        };
        this.output$1__p1__C__T__sr_ObjectRef__sr_IntRef__sr_IntRef__sr_IntRef__sr_VolatileByteRef__V(jsx$1, str, bldr$lzy, start, cur, idx, bitmap$0)
      }
    } else {
      idx.elem$1 = ((idx.elem$1 + 1) | 0)
    }
  };
  if ((start.elem$1 === 0)) {
    return str
  } else {
    return this.bldr$1__p1__sr_ObjectRef__sr_VolatileByteRef__jl_StringBuilder(bldr$lzy, bitmap$0).append__jl_CharSequence__I__I__jl_StringBuilder(str, start.elem$1, idx.elem$1).toString__T()
  }
});
ScalaJS.c.s_StringContext$.prototype.bldr$lzycompute$1__p1__sr_ObjectRef__sr_VolatileByteRef__jl_StringBuilder = (function(bldr$lzy$1, bitmap$0$1) {
  if (((bitmap$0$1.elem$1 & 1) === 0)) {
    bldr$lzy$1.elem$1 = new ScalaJS.c.jl_StringBuilder().init___();
    bitmap$0$1.elem$1 = (bitmap$0$1.elem$1 | 1)
  };
  return ScalaJS.as.jl_StringBuilder(bldr$lzy$1.elem$1)
});
ScalaJS.c.s_StringContext$.prototype.bldr$1__p1__sr_ObjectRef__sr_VolatileByteRef__jl_StringBuilder = (function(bldr$lzy$1, bitmap$0$1) {
  if (((bitmap$0$1.elem$1 & 1) === 0)) {
    return this.bldr$lzycompute$1__p1__sr_ObjectRef__sr_VolatileByteRef__jl_StringBuilder(bldr$lzy$1, bitmap$0$1)
  } else {
    return ScalaJS.as.jl_StringBuilder(bldr$lzy$1.elem$1)
  }
});
ScalaJS.c.s_StringContext$.prototype.output$1__p1__C__T__sr_ObjectRef__sr_IntRef__sr_IntRef__sr_IntRef__sr_VolatileByteRef__V = (function(ch, str$1, bldr$lzy$1, start$1, cur$1, idx$1, bitmap$0$1) {
  this.bldr$1__p1__sr_ObjectRef__sr_VolatileByteRef__jl_StringBuilder(bldr$lzy$1, bitmap$0$1).append__jl_CharSequence__I__I__jl_StringBuilder(str$1, start$1.elem$1, cur$1.elem$1);
  this.bldr$1__p1__sr_ObjectRef__sr_VolatileByteRef__jl_StringBuilder(bldr$lzy$1, bitmap$0$1).append__C__jl_StringBuilder(ch);
  start$1.elem$1 = idx$1.elem$1
});
/*<skip>*/;
ScalaJS.is.s_StringContext$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_StringContext$)))
});
ScalaJS.as.s_StringContext$ = (function(obj) {
  if ((ScalaJS.is.s_StringContext$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.StringContext$")
  }
});
ScalaJS.isArrayOf.s_StringContext$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_StringContext$)))
});
ScalaJS.asArrayOf.s_StringContext$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_StringContext$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.StringContext$;", depth)
  }
});
ScalaJS.d.s_StringContext$ = new ScalaJS.ClassTypeData({
  s_StringContext$: 0
}, false, "scala.StringContext$", ScalaJS.d.O, {
  s_StringContext$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_StringContext$.prototype.$classData = ScalaJS.d.s_StringContext$;
ScalaJS.n.s_StringContext = undefined;
ScalaJS.m.s_StringContext = (function() {
  if ((!ScalaJS.n.s_StringContext)) {
    ScalaJS.n.s_StringContext = new ScalaJS.c.s_StringContext$().init___()
  };
  return ScalaJS.n.s_StringContext
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_compat_Platform$ = (function() {
  ScalaJS.c.O.call(this);
  this.EOL$1 = null
});
ScalaJS.c.s_compat_Platform$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_compat_Platform$.prototype.constructor = ScalaJS.c.s_compat_Platform$;
/** @constructor */
ScalaJS.h.s_compat_Platform$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_compat_Platform$.prototype = ScalaJS.c.s_compat_Platform$.prototype;
ScalaJS.c.s_compat_Platform$.prototype.arraycopy__O__I__O__I__I__V = (function(src, srcPos, dest, destPos, length) {
  ScalaJS.systemArraycopy(src, srcPos, dest, destPos, length)
});
ScalaJS.c.s_compat_Platform$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.s_compat_Platform = this;
  this.EOL$1 = "\n";
  return this
});
/*<skip>*/;
ScalaJS.is.s_compat_Platform$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_compat_Platform$)))
});
ScalaJS.as.s_compat_Platform$ = (function(obj) {
  if ((ScalaJS.is.s_compat_Platform$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.compat.Platform$")
  }
});
ScalaJS.isArrayOf.s_compat_Platform$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_compat_Platform$)))
});
ScalaJS.asArrayOf.s_compat_Platform$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_compat_Platform$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.compat.Platform$;", depth)
  }
});
ScalaJS.d.s_compat_Platform$ = new ScalaJS.ClassTypeData({
  s_compat_Platform$: 0
}, false, "scala.compat.Platform$", ScalaJS.d.O, {
  s_compat_Platform$: 1,
  O: 1
});
ScalaJS.c.s_compat_Platform$.prototype.$classData = ScalaJS.d.s_compat_Platform$;
ScalaJS.n.s_compat_Platform = undefined;
ScalaJS.m.s_compat_Platform = (function() {
  if ((!ScalaJS.n.s_compat_Platform)) {
    ScalaJS.n.s_compat_Platform = new ScalaJS.c.s_compat_Platform$().init___()
  };
  return ScalaJS.n.s_compat_Platform
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_concurrent_Promise$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_concurrent_Promise$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_concurrent_Promise$.prototype.constructor = ScalaJS.c.s_concurrent_Promise$;
/** @constructor */
ScalaJS.h.s_concurrent_Promise$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_concurrent_Promise$.prototype = ScalaJS.c.s_concurrent_Promise$.prototype;
ScalaJS.c.s_concurrent_Promise$.prototype.apply__s_concurrent_Promise = (function() {
  return new ScalaJS.c.s_concurrent_impl_Promise$DefaultPromise().init___()
});
/*<skip>*/;
ScalaJS.is.s_concurrent_Promise$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_concurrent_Promise$)))
});
ScalaJS.as.s_concurrent_Promise$ = (function(obj) {
  if ((ScalaJS.is.s_concurrent_Promise$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.concurrent.Promise$")
  }
});
ScalaJS.isArrayOf.s_concurrent_Promise$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_concurrent_Promise$)))
});
ScalaJS.asArrayOf.s_concurrent_Promise$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_concurrent_Promise$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.concurrent.Promise$;", depth)
  }
});
ScalaJS.d.s_concurrent_Promise$ = new ScalaJS.ClassTypeData({
  s_concurrent_Promise$: 0
}, false, "scala.concurrent.Promise$", ScalaJS.d.O, {
  s_concurrent_Promise$: 1,
  O: 1
});
ScalaJS.c.s_concurrent_Promise$.prototype.$classData = ScalaJS.d.s_concurrent_Promise$;
ScalaJS.n.s_concurrent_Promise = undefined;
ScalaJS.m.s_concurrent_Promise = (function() {
  if ((!ScalaJS.n.s_concurrent_Promise)) {
    ScalaJS.n.s_concurrent_Promise = new ScalaJS.c.s_concurrent_Promise$().init___()
  };
  return ScalaJS.n.s_concurrent_Promise
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_concurrent_impl_AbstractPromise = (function() {
  ScalaJS.c.O.call(this);
  this.state$1 = null
});
ScalaJS.c.s_concurrent_impl_AbstractPromise.prototype = new ScalaJS.h.O();
ScalaJS.c.s_concurrent_impl_AbstractPromise.prototype.constructor = ScalaJS.c.s_concurrent_impl_AbstractPromise;
/** @constructor */
ScalaJS.h.s_concurrent_impl_AbstractPromise = (function() {
  /*<skip>*/
});
ScalaJS.h.s_concurrent_impl_AbstractPromise.prototype = ScalaJS.c.s_concurrent_impl_AbstractPromise.prototype;
ScalaJS.c.s_concurrent_impl_AbstractPromise.prototype.state__p1__O = (function() {
  return this.state$1
});
ScalaJS.c.s_concurrent_impl_AbstractPromise.prototype.state$und$eq__p1__O__V = (function(x$1) {
  this.state$1 = x$1
});
ScalaJS.c.s_concurrent_impl_AbstractPromise.prototype.updateState__O__O__Z = (function(oldState, newState) {
  if ((this.state__p1__O() === oldState)) {
    this.state$und$eq__p1__O__V(newState);
    return true
  } else {
    return false
  }
});
ScalaJS.c.s_concurrent_impl_AbstractPromise.prototype.getState__O = (function() {
  return this.state__p1__O()
});
/*<skip>*/;
ScalaJS.is.s_concurrent_impl_AbstractPromise = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_concurrent_impl_AbstractPromise)))
});
ScalaJS.as.s_concurrent_impl_AbstractPromise = (function(obj) {
  if ((ScalaJS.is.s_concurrent_impl_AbstractPromise(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.concurrent.impl.AbstractPromise")
  }
});
ScalaJS.isArrayOf.s_concurrent_impl_AbstractPromise = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_concurrent_impl_AbstractPromise)))
});
ScalaJS.asArrayOf.s_concurrent_impl_AbstractPromise = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_concurrent_impl_AbstractPromise(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.concurrent.impl.AbstractPromise;", depth)
  }
});
ScalaJS.d.s_concurrent_impl_AbstractPromise = new ScalaJS.ClassTypeData({
  s_concurrent_impl_AbstractPromise: 0
}, false, "scala.concurrent.impl.AbstractPromise", ScalaJS.d.O, {
  s_concurrent_impl_AbstractPromise: 1,
  O: 1
});
ScalaJS.c.s_concurrent_impl_AbstractPromise.prototype.$classData = ScalaJS.d.s_concurrent_impl_AbstractPromise;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_concurrent_impl_CallbackRunnable = (function() {
  ScalaJS.c.O.call(this);
  this.executor$1 = null;
  this.onComplete$1 = null;
  this.value$1 = null
});
ScalaJS.c.s_concurrent_impl_CallbackRunnable.prototype = new ScalaJS.h.O();
ScalaJS.c.s_concurrent_impl_CallbackRunnable.prototype.constructor = ScalaJS.c.s_concurrent_impl_CallbackRunnable;
/** @constructor */
ScalaJS.h.s_concurrent_impl_CallbackRunnable = (function() {
  /*<skip>*/
});
ScalaJS.h.s_concurrent_impl_CallbackRunnable.prototype = ScalaJS.c.s_concurrent_impl_CallbackRunnable.prototype;
ScalaJS.c.s_concurrent_impl_CallbackRunnable.prototype.executor__s_concurrent_ExecutionContext = (function() {
  return this.executor$1
});
ScalaJS.c.s_concurrent_impl_CallbackRunnable.prototype.onComplete__F1 = (function() {
  return this.onComplete$1
});
ScalaJS.c.s_concurrent_impl_CallbackRunnable.prototype.value__s_util_Try = (function() {
  return this.value$1
});
ScalaJS.c.s_concurrent_impl_CallbackRunnable.prototype.value$und$eq__s_util_Try__V = (function(x$1) {
  this.value$1 = x$1
});
ScalaJS.c.s_concurrent_impl_CallbackRunnable.prototype.run__V = (function() {
  ScalaJS.m.s_Predef().require__Z__V((this.value__s_util_Try() !== null));
  try {
    this.onComplete__F1().apply__O__O(this.value__s_util_Try())
  } catch (ex) {
    ex = ScalaJS.wrapJavaScriptException(ex);
    if (ScalaJS.is.jl_Throwable(ex)) {
      var ex6 = ex;
      var x4 = ex6;
      matchEnd8: {
        var o11 = ScalaJS.m.s_util_control_NonFatal().unapply__jl_Throwable__s_Option(x4);
        if ((!o11.isEmpty__Z())) {
          var e = ScalaJS.as.jl_Throwable(o11.get__O());
          this.executor__s_concurrent_ExecutionContext().reportFailure__jl_Throwable__V(e);
          break matchEnd8
        };
        throw ScalaJS.unwrapJavaScriptException(ex6)
      }
    } else {
      throw ScalaJS.unwrapJavaScriptException(ex)
    }
  }
});
ScalaJS.c.s_concurrent_impl_CallbackRunnable.prototype.executeWithValue__s_util_Try__V = (function(v) {
  ScalaJS.m.s_Predef().require__Z__V((this.value__s_util_Try() === null));
  this.value$und$eq__s_util_Try__V(v);
  try {
    this.executor__s_concurrent_ExecutionContext().execute__jl_Runnable__V(this)
  } catch (ex) {
    ex = ScalaJS.wrapJavaScriptException(ex);
    if (ScalaJS.is.jl_Throwable(ex)) {
      var ex6 = ex;
      var x4 = ex6;
      matchEnd8: {
        var o11 = ScalaJS.m.s_util_control_NonFatal().unapply__jl_Throwable__s_Option(x4);
        if ((!o11.isEmpty__Z())) {
          var t = ScalaJS.as.jl_Throwable(o11.get__O());
          this.executor__s_concurrent_ExecutionContext().reportFailure__jl_Throwable__V(t);
          break matchEnd8
        };
        throw ScalaJS.unwrapJavaScriptException(ex6)
      }
    } else {
      throw ScalaJS.unwrapJavaScriptException(ex)
    }
  }
});
ScalaJS.c.s_concurrent_impl_CallbackRunnable.prototype.init___s_concurrent_ExecutionContext__F1 = (function(executor, onComplete) {
  this.executor$1 = executor;
  this.onComplete$1 = onComplete;
  ScalaJS.c.O.prototype.init___.call(this);
  this.value$1 = null;
  return this
});
/*<skip>*/;
ScalaJS.is.s_concurrent_impl_CallbackRunnable = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_concurrent_impl_CallbackRunnable)))
});
ScalaJS.as.s_concurrent_impl_CallbackRunnable = (function(obj) {
  if ((ScalaJS.is.s_concurrent_impl_CallbackRunnable(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.concurrent.impl.CallbackRunnable")
  }
});
ScalaJS.isArrayOf.s_concurrent_impl_CallbackRunnable = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_concurrent_impl_CallbackRunnable)))
});
ScalaJS.asArrayOf.s_concurrent_impl_CallbackRunnable = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_concurrent_impl_CallbackRunnable(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.concurrent.impl.CallbackRunnable;", depth)
  }
});
ScalaJS.d.s_concurrent_impl_CallbackRunnable = new ScalaJS.ClassTypeData({
  s_concurrent_impl_CallbackRunnable: 0
}, false, "scala.concurrent.impl.CallbackRunnable", ScalaJS.d.O, {
  s_concurrent_impl_CallbackRunnable: 1,
  s_concurrent_OnCompleteRunnable: 1,
  jl_Runnable: 1,
  O: 1
});
ScalaJS.c.s_concurrent_impl_CallbackRunnable.prototype.$classData = ScalaJS.d.s_concurrent_impl_CallbackRunnable;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_concurrent_impl_Promise$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_concurrent_impl_Promise$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_concurrent_impl_Promise$.prototype.constructor = ScalaJS.c.s_concurrent_impl_Promise$;
/** @constructor */
ScalaJS.h.s_concurrent_impl_Promise$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_concurrent_impl_Promise$.prototype = ScalaJS.c.s_concurrent_impl_Promise$.prototype;
ScalaJS.c.s_concurrent_impl_Promise$.prototype.scala$concurrent$impl$Promise$$resolveTry__s_util_Try__s_util_Try = (function(source) {
  var x1 = source;
  if (ScalaJS.is.s_util_Failure(x1)) {
    var x2 = ScalaJS.as.s_util_Failure(x1);
    var t = x2.exception__jl_Throwable();
    return this.resolver__p1__jl_Throwable__s_util_Try(t)
  };
  return source
});
ScalaJS.c.s_concurrent_impl_Promise$.prototype.resolver__p1__jl_Throwable__s_util_Try = (function(throwable) {
  var x1 = throwable;
  if (ScalaJS.is.sr_NonLocalReturnControl(x1)) {
    var x2 = ScalaJS.as.sr_NonLocalReturnControl(x1);
    return new ScalaJS.c.s_util_Success().init___O(x2.value__O())
  };
  if (ScalaJS.is.s_util_control_ControlThrowable(x1)) {
    var x3 = ScalaJS.as.s_util_control_ControlThrowable(x1);
    return new ScalaJS.c.s_util_Failure().init___jl_Throwable(new ScalaJS.c.ju_concurrent_ExecutionException().init___T__jl_Throwable("Boxed ControlThrowable", ScalaJS.as.jl_Throwable(x3)))
  };
  if (ScalaJS.is.jl_InterruptedException(x1)) {
    var x4 = ScalaJS.as.jl_InterruptedException(x1);
    return new ScalaJS.c.s_util_Failure().init___jl_Throwable(new ScalaJS.c.ju_concurrent_ExecutionException().init___T__jl_Throwable("Boxed InterruptedException", x4))
  };
  if (ScalaJS.is.jl_Error(x1)) {
    var x5 = ScalaJS.as.jl_Error(x1);
    return new ScalaJS.c.s_util_Failure().init___jl_Throwable(new ScalaJS.c.ju_concurrent_ExecutionException().init___T__jl_Throwable("Boxed Error", x5))
  };
  return new ScalaJS.c.s_util_Failure().init___jl_Throwable(x1)
});
/*<skip>*/;
ScalaJS.is.s_concurrent_impl_Promise$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_concurrent_impl_Promise$)))
});
ScalaJS.as.s_concurrent_impl_Promise$ = (function(obj) {
  if ((ScalaJS.is.s_concurrent_impl_Promise$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.concurrent.impl.Promise$")
  }
});
ScalaJS.isArrayOf.s_concurrent_impl_Promise$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_concurrent_impl_Promise$)))
});
ScalaJS.asArrayOf.s_concurrent_impl_Promise$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_concurrent_impl_Promise$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.concurrent.impl.Promise$;", depth)
  }
});
ScalaJS.d.s_concurrent_impl_Promise$ = new ScalaJS.ClassTypeData({
  s_concurrent_impl_Promise$: 0
}, false, "scala.concurrent.impl.Promise$", ScalaJS.d.O, {
  s_concurrent_impl_Promise$: 1,
  O: 1
});
ScalaJS.c.s_concurrent_impl_Promise$.prototype.$classData = ScalaJS.d.s_concurrent_impl_Promise$;
ScalaJS.n.s_concurrent_impl_Promise = undefined;
ScalaJS.m.s_concurrent_impl_Promise = (function() {
  if ((!ScalaJS.n.s_concurrent_impl_Promise)) {
    ScalaJS.n.s_concurrent_impl_Promise = new ScalaJS.c.s_concurrent_impl_Promise$().init___()
  };
  return ScalaJS.n.s_concurrent_impl_Promise
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_math_Equiv$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_math_Equiv$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_math_Equiv$.prototype.constructor = ScalaJS.c.s_math_Equiv$;
/** @constructor */
ScalaJS.h.s_math_Equiv$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_math_Equiv$.prototype = ScalaJS.c.s_math_Equiv$.prototype;
ScalaJS.c.s_math_Equiv$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.s_math_Equiv = this;
  ScalaJS.i.s_math_LowPriorityEquiv$class__$init$__s_math_Equiv$__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.s_math_Equiv$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_math_Equiv$)))
});
ScalaJS.as.s_math_Equiv$ = (function(obj) {
  if ((ScalaJS.is.s_math_Equiv$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.math.Equiv$")
  }
});
ScalaJS.isArrayOf.s_math_Equiv$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_math_Equiv$)))
});
ScalaJS.asArrayOf.s_math_Equiv$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_math_Equiv$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.math.Equiv$;", depth)
  }
});
ScalaJS.d.s_math_Equiv$ = new ScalaJS.ClassTypeData({
  s_math_Equiv$: 0
}, false, "scala.math.Equiv$", ScalaJS.d.O, {
  s_math_Equiv$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_math_LowPriorityEquiv: 1,
  O: 1
});
ScalaJS.c.s_math_Equiv$.prototype.$classData = ScalaJS.d.s_math_Equiv$;
ScalaJS.n.s_math_Equiv = undefined;
ScalaJS.m.s_math_Equiv = (function() {
  if ((!ScalaJS.n.s_math_Equiv)) {
    ScalaJS.n.s_math_Equiv = new ScalaJS.c.s_math_Equiv$().init___()
  };
  return ScalaJS.n.s_math_Equiv
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_math_Fractional$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_math_Fractional$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_math_Fractional$.prototype.constructor = ScalaJS.c.s_math_Fractional$;
/** @constructor */
ScalaJS.h.s_math_Fractional$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_math_Fractional$.prototype = ScalaJS.c.s_math_Fractional$.prototype;
/*<skip>*/;
ScalaJS.is.s_math_Fractional$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_math_Fractional$)))
});
ScalaJS.as.s_math_Fractional$ = (function(obj) {
  if ((ScalaJS.is.s_math_Fractional$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.math.Fractional$")
  }
});
ScalaJS.isArrayOf.s_math_Fractional$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_math_Fractional$)))
});
ScalaJS.asArrayOf.s_math_Fractional$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_math_Fractional$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.math.Fractional$;", depth)
  }
});
ScalaJS.d.s_math_Fractional$ = new ScalaJS.ClassTypeData({
  s_math_Fractional$: 0
}, false, "scala.math.Fractional$", ScalaJS.d.O, {
  s_math_Fractional$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_math_Fractional$.prototype.$classData = ScalaJS.d.s_math_Fractional$;
ScalaJS.n.s_math_Fractional = undefined;
ScalaJS.m.s_math_Fractional = (function() {
  if ((!ScalaJS.n.s_math_Fractional)) {
    ScalaJS.n.s_math_Fractional = new ScalaJS.c.s_math_Fractional$().init___()
  };
  return ScalaJS.n.s_math_Fractional
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_math_Integral$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_math_Integral$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_math_Integral$.prototype.constructor = ScalaJS.c.s_math_Integral$;
/** @constructor */
ScalaJS.h.s_math_Integral$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_math_Integral$.prototype = ScalaJS.c.s_math_Integral$.prototype;
/*<skip>*/;
ScalaJS.is.s_math_Integral$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_math_Integral$)))
});
ScalaJS.as.s_math_Integral$ = (function(obj) {
  if ((ScalaJS.is.s_math_Integral$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.math.Integral$")
  }
});
ScalaJS.isArrayOf.s_math_Integral$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_math_Integral$)))
});
ScalaJS.asArrayOf.s_math_Integral$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_math_Integral$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.math.Integral$;", depth)
  }
});
ScalaJS.d.s_math_Integral$ = new ScalaJS.ClassTypeData({
  s_math_Integral$: 0
}, false, "scala.math.Integral$", ScalaJS.d.O, {
  s_math_Integral$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_math_Integral$.prototype.$classData = ScalaJS.d.s_math_Integral$;
ScalaJS.n.s_math_Integral = undefined;
ScalaJS.m.s_math_Integral = (function() {
  if ((!ScalaJS.n.s_math_Integral)) {
    ScalaJS.n.s_math_Integral = new ScalaJS.c.s_math_Integral$().init___()
  };
  return ScalaJS.n.s_math_Integral
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_math_Numeric$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_math_Numeric$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_math_Numeric$.prototype.constructor = ScalaJS.c.s_math_Numeric$;
/** @constructor */
ScalaJS.h.s_math_Numeric$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_math_Numeric$.prototype = ScalaJS.c.s_math_Numeric$.prototype;
/*<skip>*/;
ScalaJS.is.s_math_Numeric$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_math_Numeric$)))
});
ScalaJS.as.s_math_Numeric$ = (function(obj) {
  if ((ScalaJS.is.s_math_Numeric$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.math.Numeric$")
  }
});
ScalaJS.isArrayOf.s_math_Numeric$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_math_Numeric$)))
});
ScalaJS.asArrayOf.s_math_Numeric$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_math_Numeric$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.math.Numeric$;", depth)
  }
});
ScalaJS.d.s_math_Numeric$ = new ScalaJS.ClassTypeData({
  s_math_Numeric$: 0
}, false, "scala.math.Numeric$", ScalaJS.d.O, {
  s_math_Numeric$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_math_Numeric$.prototype.$classData = ScalaJS.d.s_math_Numeric$;
ScalaJS.n.s_math_Numeric = undefined;
ScalaJS.m.s_math_Numeric = (function() {
  if ((!ScalaJS.n.s_math_Numeric)) {
    ScalaJS.n.s_math_Numeric = new ScalaJS.c.s_math_Numeric$().init___()
  };
  return ScalaJS.n.s_math_Numeric
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_math_Ordered$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_math_Ordered$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_math_Ordered$.prototype.constructor = ScalaJS.c.s_math_Ordered$;
/** @constructor */
ScalaJS.h.s_math_Ordered$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_math_Ordered$.prototype = ScalaJS.c.s_math_Ordered$.prototype;
/*<skip>*/;
ScalaJS.is.s_math_Ordered$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_math_Ordered$)))
});
ScalaJS.as.s_math_Ordered$ = (function(obj) {
  if ((ScalaJS.is.s_math_Ordered$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.math.Ordered$")
  }
});
ScalaJS.isArrayOf.s_math_Ordered$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_math_Ordered$)))
});
ScalaJS.asArrayOf.s_math_Ordered$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_math_Ordered$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.math.Ordered$;", depth)
  }
});
ScalaJS.d.s_math_Ordered$ = new ScalaJS.ClassTypeData({
  s_math_Ordered$: 0
}, false, "scala.math.Ordered$", ScalaJS.d.O, {
  s_math_Ordered$: 1,
  O: 1
});
ScalaJS.c.s_math_Ordered$.prototype.$classData = ScalaJS.d.s_math_Ordered$;
ScalaJS.n.s_math_Ordered = undefined;
ScalaJS.m.s_math_Ordered = (function() {
  if ((!ScalaJS.n.s_math_Ordered)) {
    ScalaJS.n.s_math_Ordered = new ScalaJS.c.s_math_Ordered$().init___()
  };
  return ScalaJS.n.s_math_Ordered
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_math_Ordering$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_math_Ordering$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_math_Ordering$.prototype.constructor = ScalaJS.c.s_math_Ordering$;
/** @constructor */
ScalaJS.h.s_math_Ordering$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_math_Ordering$.prototype = ScalaJS.c.s_math_Ordering$.prototype;
ScalaJS.c.s_math_Ordering$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.s_math_Ordering = this;
  ScalaJS.i.s_math_LowPriorityOrderingImplicits$class__$init$__s_math_LowPriorityOrderingImplicits__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.s_math_Ordering$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_math_Ordering$)))
});
ScalaJS.as.s_math_Ordering$ = (function(obj) {
  if ((ScalaJS.is.s_math_Ordering$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.math.Ordering$")
  }
});
ScalaJS.isArrayOf.s_math_Ordering$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_math_Ordering$)))
});
ScalaJS.asArrayOf.s_math_Ordering$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_math_Ordering$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.math.Ordering$;", depth)
  }
});
ScalaJS.d.s_math_Ordering$ = new ScalaJS.ClassTypeData({
  s_math_Ordering$: 0
}, false, "scala.math.Ordering$", ScalaJS.d.O, {
  s_math_Ordering$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_math_LowPriorityOrderingImplicits: 1,
  O: 1
});
ScalaJS.c.s_math_Ordering$.prototype.$classData = ScalaJS.d.s_math_Ordering$;
ScalaJS.n.s_math_Ordering = undefined;
ScalaJS.m.s_math_Ordering = (function() {
  if ((!ScalaJS.n.s_math_Ordering)) {
    ScalaJS.n.s_math_Ordering = new ScalaJS.c.s_math_Ordering$().init___()
  };
  return ScalaJS.n.s_math_Ordering
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_math_package$ = (function() {
  ScalaJS.c.O.call(this);
  this.E$1 = 0.0;
  this.Pi$1 = 0.0
});
ScalaJS.c.s_math_package$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_math_package$.prototype.constructor = ScalaJS.c.s_math_package$;
/** @constructor */
ScalaJS.h.s_math_package$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_math_package$.prototype = ScalaJS.c.s_math_package$.prototype;
ScalaJS.c.s_math_package$.prototype.min__I__I__I = (function(x, y) {
  return ScalaJS.m.jl_Math().min__I__I__I(x, y)
});
/*<skip>*/;
ScalaJS.is.s_math_package$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_math_package$)))
});
ScalaJS.as.s_math_package$ = (function(obj) {
  if ((ScalaJS.is.s_math_package$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.math.package$")
  }
});
ScalaJS.isArrayOf.s_math_package$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_math_package$)))
});
ScalaJS.asArrayOf.s_math_package$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_math_package$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.math.package$;", depth)
  }
});
ScalaJS.d.s_math_package$ = new ScalaJS.ClassTypeData({
  s_math_package$: 0
}, false, "scala.math.package$", ScalaJS.d.O, {
  s_math_package$: 1,
  O: 1
});
ScalaJS.c.s_math_package$.prototype.$classData = ScalaJS.d.s_math_package$;
ScalaJS.n.s_math_package = undefined;
ScalaJS.m.s_math_package = (function() {
  if ((!ScalaJS.n.s_math_package)) {
    ScalaJS.n.s_math_package = new ScalaJS.c.s_math_package$().init___()
  };
  return ScalaJS.n.s_math_package
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_package$ = (function() {
  ScalaJS.c.O.call(this);
  this.AnyRef$1 = null;
  this.Traversable$1 = null;
  this.Iterable$1 = null;
  this.Seq$1 = null;
  this.IndexedSeq$1 = null;
  this.Iterator$1 = null;
  this.List$1 = null;
  this.Nil$1 = null;
  this.$$colon$colon$1 = null;
  this.$$plus$colon$1 = null;
  this.$$colon$plus$1 = null;
  this.Stream$1 = null;
  this.$$hash$colon$colon$1 = null;
  this.Vector$1 = null;
  this.StringBuilder$1 = null;
  this.Range$1 = null;
  this.BigDecimal$1 = null;
  this.BigInt$1 = null;
  this.Equiv$1 = null;
  this.Fractional$1 = null;
  this.Integral$1 = null;
  this.Numeric$1 = null;
  this.Ordered$1 = null;
  this.Ordering$1 = null;
  this.Either$1 = null;
  this.Left$1 = null;
  this.Right$1 = null;
  this.bitmap$0$1 = 0
});
ScalaJS.c.s_package$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_package$.prototype.constructor = ScalaJS.c.s_package$;
/** @constructor */
ScalaJS.h.s_package$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_package$.prototype = ScalaJS.c.s_package$.prototype;
ScalaJS.c.s_package$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.s_package = this;
  this.AnyRef$1 = new ScalaJS.c.s_package$$anon$1().init___();
  this.Traversable$1 = ScalaJS.m.sc_Traversable();
  this.Iterable$1 = ScalaJS.m.sc_Iterable();
  this.Seq$1 = ScalaJS.m.sc_Seq();
  this.IndexedSeq$1 = ScalaJS.m.sc_IndexedSeq();
  this.Iterator$1 = ScalaJS.m.sc_Iterator();
  this.List$1 = ScalaJS.m.sci_List();
  this.Nil$1 = ScalaJS.m.sci_Nil();
  this.$$colon$colon$1 = ScalaJS.m.sci_$colon$colon();
  this.$$plus$colon$1 = ScalaJS.m.sc_$plus$colon();
  this.$$colon$plus$1 = ScalaJS.m.sc_$colon$plus();
  this.Stream$1 = ScalaJS.m.sci_Stream();
  this.$$hash$colon$colon$1 = ScalaJS.m.sci_Stream$$hash$colon$colon();
  this.Vector$1 = ScalaJS.m.sci_Vector();
  this.StringBuilder$1 = ScalaJS.m.scm_StringBuilder();
  this.Range$1 = ScalaJS.m.sci_Range();
  this.Equiv$1 = ScalaJS.m.s_math_Equiv();
  this.Fractional$1 = ScalaJS.m.s_math_Fractional();
  this.Integral$1 = ScalaJS.m.s_math_Integral();
  this.Numeric$1 = ScalaJS.m.s_math_Numeric();
  this.Ordered$1 = ScalaJS.m.s_math_Ordered();
  this.Ordering$1 = ScalaJS.m.s_math_Ordering();
  this.Either$1 = ScalaJS.m.s_util_Either();
  this.Left$1 = ScalaJS.m.s_util_Left();
  this.Right$1 = ScalaJS.m.s_util_Right();
  return this
});
/*<skip>*/;
ScalaJS.is.s_package$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_package$)))
});
ScalaJS.as.s_package$ = (function(obj) {
  if ((ScalaJS.is.s_package$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.package$")
  }
});
ScalaJS.isArrayOf.s_package$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_package$)))
});
ScalaJS.asArrayOf.s_package$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_package$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.package$;", depth)
  }
});
ScalaJS.d.s_package$ = new ScalaJS.ClassTypeData({
  s_package$: 0
}, false, "scala.package$", ScalaJS.d.O, {
  s_package$: 1,
  O: 1
});
ScalaJS.c.s_package$.prototype.$classData = ScalaJS.d.s_package$;
ScalaJS.n.s_package = undefined;
ScalaJS.m.s_package = (function() {
  if ((!ScalaJS.n.s_package)) {
    ScalaJS.n.s_package = new ScalaJS.c.s_package$().init___()
  };
  return ScalaJS.n.s_package
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_package$$anon$1 = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_package$$anon$1.prototype = new ScalaJS.h.O();
ScalaJS.c.s_package$$anon$1.prototype.constructor = ScalaJS.c.s_package$$anon$1;
/** @constructor */
ScalaJS.h.s_package$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_package$$anon$1.prototype = ScalaJS.c.s_package$$anon$1.prototype;
ScalaJS.c.s_package$$anon$1.prototype.toString__T = (function() {
  return "object AnyRef"
});
/*<skip>*/;
ScalaJS.is.s_package$$anon$1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_package$$anon$1)))
});
ScalaJS.as.s_package$$anon$1 = (function(obj) {
  if ((ScalaJS.is.s_package$$anon$1(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.package$$anon$1")
  }
});
ScalaJS.isArrayOf.s_package$$anon$1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_package$$anon$1)))
});
ScalaJS.asArrayOf.s_package$$anon$1 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_package$$anon$1(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.package$$anon$1;", depth)
  }
});
ScalaJS.d.s_package$$anon$1 = new ScalaJS.ClassTypeData({
  s_package$$anon$1: 0
}, false, "scala.package$$anon$1", ScalaJS.d.O, {
  s_package$$anon$1: 1,
  s_Specializable: 1,
  O: 1
});
ScalaJS.c.s_package$$anon$1.prototype.$classData = ScalaJS.d.s_package$$anon$1;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_reflect_AnyValManifest = (function() {
  ScalaJS.c.O.call(this);
  this.toString$1 = null;
  this.hashCode$1 = 0
});
ScalaJS.c.s_reflect_AnyValManifest.prototype = new ScalaJS.h.O();
ScalaJS.c.s_reflect_AnyValManifest.prototype.constructor = ScalaJS.c.s_reflect_AnyValManifest;
/** @constructor */
ScalaJS.h.s_reflect_AnyValManifest = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_AnyValManifest.prototype = ScalaJS.c.s_reflect_AnyValManifest.prototype;
ScalaJS.c.s_reflect_AnyValManifest.prototype.toString__T = (function() {
  return this.toString$1
});
ScalaJS.c.s_reflect_AnyValManifest.prototype.equals__O__Z = (function(that) {
  return (this === that)
});
ScalaJS.c.s_reflect_AnyValManifest.prototype.hashCode__I = (function() {
  return this.hashCode$1
});
ScalaJS.c.s_reflect_AnyValManifest.prototype.init___T = (function(toString) {
  this.toString$1 = toString;
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.i.s_reflect_ClassManifestDeprecatedApis$class__$init$__s_reflect_ClassTag__V(this);
  ScalaJS.i.s_reflect_ClassTag$class__$init$__s_reflect_ClassTag__V(this);
  ScalaJS.i.s_reflect_Manifest$class__$init$__s_reflect_Manifest__V(this);
  this.hashCode$1 = ScalaJS.m.jl_System().identityHashCode__O__I(this);
  return this
});
/*<skip>*/;
ScalaJS.is.s_reflect_AnyValManifest = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_AnyValManifest)))
});
ScalaJS.as.s_reflect_AnyValManifest = (function(obj) {
  if ((ScalaJS.is.s_reflect_AnyValManifest(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.reflect.AnyValManifest")
  }
});
ScalaJS.isArrayOf.s_reflect_AnyValManifest = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_AnyValManifest)))
});
ScalaJS.asArrayOf.s_reflect_AnyValManifest = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_reflect_AnyValManifest(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.reflect.AnyValManifest;", depth)
  }
});
ScalaJS.d.s_reflect_AnyValManifest = new ScalaJS.ClassTypeData({
  s_reflect_AnyValManifest: 0
}, false, "scala.reflect.AnyValManifest", ScalaJS.d.O, {
  s_reflect_AnyValManifest: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_Equals: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_reflect_AnyValManifest.prototype.$classData = ScalaJS.d.s_reflect_AnyValManifest;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_reflect_ClassManifestFactory$ = (function() {
  ScalaJS.c.O.call(this);
  this.Byte$1 = null;
  this.Short$1 = null;
  this.Char$1 = null;
  this.Int$1 = null;
  this.Long$1 = null;
  this.Float$1 = null;
  this.Double$1 = null;
  this.Boolean$1 = null;
  this.Unit$1 = null;
  this.Any$1 = null;
  this.Object$1 = null;
  this.AnyVal$1 = null;
  this.Nothing$1 = null;
  this.Null$1 = null
});
ScalaJS.c.s_reflect_ClassManifestFactory$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_reflect_ClassManifestFactory$.prototype.constructor = ScalaJS.c.s_reflect_ClassManifestFactory$;
/** @constructor */
ScalaJS.h.s_reflect_ClassManifestFactory$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ClassManifestFactory$.prototype = ScalaJS.c.s_reflect_ClassManifestFactory$.prototype;
ScalaJS.c.s_reflect_ClassManifestFactory$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.s_reflect_ClassManifestFactory = this;
  this.Byte$1 = ScalaJS.m.s_reflect_ManifestFactory().Byte__s_reflect_AnyValManifest();
  this.Short$1 = ScalaJS.m.s_reflect_ManifestFactory().Short__s_reflect_AnyValManifest();
  this.Char$1 = ScalaJS.m.s_reflect_ManifestFactory().Char__s_reflect_AnyValManifest();
  this.Int$1 = ScalaJS.m.s_reflect_ManifestFactory().Int__s_reflect_AnyValManifest();
  this.Long$1 = ScalaJS.m.s_reflect_ManifestFactory().Long__s_reflect_AnyValManifest();
  this.Float$1 = ScalaJS.m.s_reflect_ManifestFactory().Float__s_reflect_AnyValManifest();
  this.Double$1 = ScalaJS.m.s_reflect_ManifestFactory().Double__s_reflect_AnyValManifest();
  this.Boolean$1 = ScalaJS.m.s_reflect_ManifestFactory().Boolean__s_reflect_AnyValManifest();
  this.Unit$1 = ScalaJS.m.s_reflect_ManifestFactory().Unit__s_reflect_AnyValManifest();
  this.Any$1 = ScalaJS.m.s_reflect_ManifestFactory().Any__s_reflect_Manifest();
  this.Object$1 = ScalaJS.m.s_reflect_ManifestFactory().Object__s_reflect_Manifest();
  this.AnyVal$1 = ScalaJS.m.s_reflect_ManifestFactory().AnyVal__s_reflect_Manifest();
  this.Nothing$1 = ScalaJS.m.s_reflect_ManifestFactory().Nothing__s_reflect_Manifest();
  this.Null$1 = ScalaJS.m.s_reflect_ManifestFactory().Null__s_reflect_Manifest();
  return this
});
/*<skip>*/;
ScalaJS.is.s_reflect_ClassManifestFactory$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ClassManifestFactory$)))
});
ScalaJS.as.s_reflect_ClassManifestFactory$ = (function(obj) {
  if ((ScalaJS.is.s_reflect_ClassManifestFactory$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.reflect.ClassManifestFactory$")
  }
});
ScalaJS.isArrayOf.s_reflect_ClassManifestFactory$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ClassManifestFactory$)))
});
ScalaJS.asArrayOf.s_reflect_ClassManifestFactory$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_reflect_ClassManifestFactory$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ClassManifestFactory$;", depth)
  }
});
ScalaJS.d.s_reflect_ClassManifestFactory$ = new ScalaJS.ClassTypeData({
  s_reflect_ClassManifestFactory$: 0
}, false, "scala.reflect.ClassManifestFactory$", ScalaJS.d.O, {
  s_reflect_ClassManifestFactory$: 1,
  O: 1
});
ScalaJS.c.s_reflect_ClassManifestFactory$.prototype.$classData = ScalaJS.d.s_reflect_ClassManifestFactory$;
ScalaJS.n.s_reflect_ClassManifestFactory = undefined;
ScalaJS.m.s_reflect_ClassManifestFactory = (function() {
  if ((!ScalaJS.n.s_reflect_ClassManifestFactory)) {
    ScalaJS.n.s_reflect_ClassManifestFactory = new ScalaJS.c.s_reflect_ClassManifestFactory$().init___()
  };
  return ScalaJS.n.s_reflect_ClassManifestFactory
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$ = (function() {
  ScalaJS.c.O.call(this);
  this.Byte$1 = null;
  this.Short$1 = null;
  this.Char$1 = null;
  this.Int$1 = null;
  this.Long$1 = null;
  this.Float$1 = null;
  this.Double$1 = null;
  this.Boolean$1 = null;
  this.Unit$1 = null;
  this.scala$reflect$ManifestFactory$$ObjectTYPE$1 = null;
  this.scala$reflect$ManifestFactory$$NothingTYPE$1 = null;
  this.scala$reflect$ManifestFactory$$NullTYPE$1 = null;
  this.Any$1 = null;
  this.Object$1 = null;
  this.AnyRef$1 = null;
  this.AnyVal$1 = null;
  this.Null$1 = null;
  this.Nothing$1 = null
});
ScalaJS.c.s_reflect_ManifestFactory$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_reflect_ManifestFactory$.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$.prototype = ScalaJS.c.s_reflect_ManifestFactory$.prototype;
ScalaJS.c.s_reflect_ManifestFactory$.prototype.Byte__s_reflect_AnyValManifest = (function() {
  return this.Byte$1
});
ScalaJS.c.s_reflect_ManifestFactory$.prototype.Short__s_reflect_AnyValManifest = (function() {
  return this.Short$1
});
ScalaJS.c.s_reflect_ManifestFactory$.prototype.Char__s_reflect_AnyValManifest = (function() {
  return this.Char$1
});
ScalaJS.c.s_reflect_ManifestFactory$.prototype.Int__s_reflect_AnyValManifest = (function() {
  return this.Int$1
});
ScalaJS.c.s_reflect_ManifestFactory$.prototype.Long__s_reflect_AnyValManifest = (function() {
  return this.Long$1
});
ScalaJS.c.s_reflect_ManifestFactory$.prototype.Float__s_reflect_AnyValManifest = (function() {
  return this.Float$1
});
ScalaJS.c.s_reflect_ManifestFactory$.prototype.Double__s_reflect_AnyValManifest = (function() {
  return this.Double$1
});
ScalaJS.c.s_reflect_ManifestFactory$.prototype.Boolean__s_reflect_AnyValManifest = (function() {
  return this.Boolean$1
});
ScalaJS.c.s_reflect_ManifestFactory$.prototype.Unit__s_reflect_AnyValManifest = (function() {
  return this.Unit$1
});
ScalaJS.c.s_reflect_ManifestFactory$.prototype.scala$reflect$ManifestFactory$$ObjectTYPE__jl_Class = (function() {
  return this.scala$reflect$ManifestFactory$$ObjectTYPE$1
});
ScalaJS.c.s_reflect_ManifestFactory$.prototype.scala$reflect$ManifestFactory$$NothingTYPE__jl_Class = (function() {
  return this.scala$reflect$ManifestFactory$$NothingTYPE$1
});
ScalaJS.c.s_reflect_ManifestFactory$.prototype.scala$reflect$ManifestFactory$$NullTYPE__jl_Class = (function() {
  return this.scala$reflect$ManifestFactory$$NullTYPE$1
});
ScalaJS.c.s_reflect_ManifestFactory$.prototype.Any__s_reflect_Manifest = (function() {
  return this.Any$1
});
ScalaJS.c.s_reflect_ManifestFactory$.prototype.Object__s_reflect_Manifest = (function() {
  return this.Object$1
});
ScalaJS.c.s_reflect_ManifestFactory$.prototype.AnyVal__s_reflect_Manifest = (function() {
  return this.AnyVal$1
});
ScalaJS.c.s_reflect_ManifestFactory$.prototype.Null__s_reflect_Manifest = (function() {
  return this.Null$1
});
ScalaJS.c.s_reflect_ManifestFactory$.prototype.Nothing__s_reflect_Manifest = (function() {
  return this.Nothing$1
});
ScalaJS.c.s_reflect_ManifestFactory$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.s_reflect_ManifestFactory = this;
  this.Byte$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$6().init___();
  this.Short$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$7().init___();
  this.Char$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$8().init___();
  this.Int$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$9().init___();
  this.Long$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$10().init___();
  this.Float$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$11().init___();
  this.Double$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$12().init___();
  this.Boolean$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$13().init___();
  this.Unit$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$14().init___();
  this.scala$reflect$ManifestFactory$$ObjectTYPE$1 = ScalaJS.d.O.getClassOf();
  this.scala$reflect$ManifestFactory$$NothingTYPE$1 = ScalaJS.d.sr_Nothing$.getClassOf();
  this.scala$reflect$ManifestFactory$$NullTYPE$1 = ScalaJS.d.sr_Null$.getClassOf();
  this.Any$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$1().init___();
  this.Object$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$2().init___();
  this.AnyRef$1 = this.Object__s_reflect_Manifest();
  this.AnyVal$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$3().init___();
  this.Null$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$4().init___();
  this.Nothing$1 = new ScalaJS.c.s_reflect_ManifestFactory$$anon$5().init___();
  return this
});
/*<skip>*/;
ScalaJS.is.s_reflect_ManifestFactory$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ManifestFactory$)))
});
ScalaJS.as.s_reflect_ManifestFactory$ = (function(obj) {
  if ((ScalaJS.is.s_reflect_ManifestFactory$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.reflect.ManifestFactory$")
  }
});
ScalaJS.isArrayOf.s_reflect_ManifestFactory$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ManifestFactory$)))
});
ScalaJS.asArrayOf.s_reflect_ManifestFactory$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_reflect_ManifestFactory$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ManifestFactory$;", depth)
  }
});
ScalaJS.d.s_reflect_ManifestFactory$ = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$: 0
}, false, "scala.reflect.ManifestFactory$", ScalaJS.d.O, {
  s_reflect_ManifestFactory$: 1,
  O: 1
});
ScalaJS.c.s_reflect_ManifestFactory$.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$;
ScalaJS.n.s_reflect_ManifestFactory = undefined;
ScalaJS.m.s_reflect_ManifestFactory = (function() {
  if ((!ScalaJS.n.s_reflect_ManifestFactory)) {
    ScalaJS.n.s_reflect_ManifestFactory = new ScalaJS.c.s_reflect_ManifestFactory$().init___()
  };
  return ScalaJS.n.s_reflect_ManifestFactory
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest = (function() {
  ScalaJS.c.O.call(this);
  this.prefix$1 = null;
  this.runtimeClass$1 = null;
  this.typeArguments$1 = null
});
ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest.prototype = new ScalaJS.h.O();
ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$ClassTypeManifest = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$ClassTypeManifest.prototype = ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest.prototype;
ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest.prototype.init___s_Option__jl_Class__sci_List = (function(prefix, runtimeClass, typeArguments) {
  this.prefix$1 = prefix;
  this.runtimeClass$1 = runtimeClass;
  this.typeArguments$1 = typeArguments;
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.i.s_reflect_ClassManifestDeprecatedApis$class__$init$__s_reflect_ClassTag__V(this);
  ScalaJS.i.s_reflect_ClassTag$class__$init$__s_reflect_ClassTag__V(this);
  ScalaJS.i.s_reflect_Manifest$class__$init$__s_reflect_Manifest__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.s_reflect_ManifestFactory$ClassTypeManifest = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ManifestFactory$ClassTypeManifest)))
});
ScalaJS.as.s_reflect_ManifestFactory$ClassTypeManifest = (function(obj) {
  if ((ScalaJS.is.s_reflect_ManifestFactory$ClassTypeManifest(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.reflect.ManifestFactory$ClassTypeManifest")
  }
});
ScalaJS.isArrayOf.s_reflect_ManifestFactory$ClassTypeManifest = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ManifestFactory$ClassTypeManifest)))
});
ScalaJS.asArrayOf.s_reflect_ManifestFactory$ClassTypeManifest = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_reflect_ManifestFactory$ClassTypeManifest(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ManifestFactory$ClassTypeManifest;", depth)
  }
});
ScalaJS.d.s_reflect_ManifestFactory$ClassTypeManifest = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$ClassTypeManifest: 0
}, false, "scala.reflect.ManifestFactory$ClassTypeManifest", ScalaJS.d.O, {
  s_reflect_ManifestFactory$ClassTypeManifest: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_Equals: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$ClassTypeManifest;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_reflect_NoManifest$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_reflect_NoManifest$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_reflect_NoManifest$.prototype.constructor = ScalaJS.c.s_reflect_NoManifest$;
/** @constructor */
ScalaJS.h.s_reflect_NoManifest$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_NoManifest$.prototype = ScalaJS.c.s_reflect_NoManifest$.prototype;
ScalaJS.c.s_reflect_NoManifest$.prototype.toString__T = (function() {
  return "<?>"
});
/*<skip>*/;
ScalaJS.is.s_reflect_NoManifest$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_NoManifest$)))
});
ScalaJS.as.s_reflect_NoManifest$ = (function(obj) {
  if ((ScalaJS.is.s_reflect_NoManifest$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.reflect.NoManifest$")
  }
});
ScalaJS.isArrayOf.s_reflect_NoManifest$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_NoManifest$)))
});
ScalaJS.asArrayOf.s_reflect_NoManifest$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_reflect_NoManifest$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.reflect.NoManifest$;", depth)
  }
});
ScalaJS.d.s_reflect_NoManifest$ = new ScalaJS.ClassTypeData({
  s_reflect_NoManifest$: 0
}, false, "scala.reflect.NoManifest$", ScalaJS.d.O, {
  s_reflect_NoManifest$: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_reflect_NoManifest$.prototype.$classData = ScalaJS.d.s_reflect_NoManifest$;
ScalaJS.n.s_reflect_NoManifest = undefined;
ScalaJS.m.s_reflect_NoManifest = (function() {
  if ((!ScalaJS.n.s_reflect_NoManifest)) {
    ScalaJS.n.s_reflect_NoManifest = new ScalaJS.c.s_reflect_NoManifest$().init___()
  };
  return ScalaJS.n.s_reflect_NoManifest
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_reflect_package$ = (function() {
  ScalaJS.c.O.call(this);
  this.ClassManifest$1 = null;
  this.Manifest$1 = null
});
ScalaJS.c.s_reflect_package$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_reflect_package$.prototype.constructor = ScalaJS.c.s_reflect_package$;
/** @constructor */
ScalaJS.h.s_reflect_package$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_package$.prototype = ScalaJS.c.s_reflect_package$.prototype;
ScalaJS.c.s_reflect_package$.prototype.ClassManifest__s_reflect_ClassManifestFactory$ = (function() {
  return this.ClassManifest$1
});
ScalaJS.c.s_reflect_package$.prototype.Manifest__s_reflect_ManifestFactory$ = (function() {
  return this.Manifest$1
});
ScalaJS.c.s_reflect_package$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.s_reflect_package = this;
  this.ClassManifest$1 = ScalaJS.m.s_reflect_ClassManifestFactory();
  this.Manifest$1 = ScalaJS.m.s_reflect_ManifestFactory();
  return this
});
/*<skip>*/;
ScalaJS.is.s_reflect_package$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_package$)))
});
ScalaJS.as.s_reflect_package$ = (function(obj) {
  if ((ScalaJS.is.s_reflect_package$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.reflect.package$")
  }
});
ScalaJS.isArrayOf.s_reflect_package$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_package$)))
});
ScalaJS.asArrayOf.s_reflect_package$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_reflect_package$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.reflect.package$;", depth)
  }
});
ScalaJS.d.s_reflect_package$ = new ScalaJS.ClassTypeData({
  s_reflect_package$: 0
}, false, "scala.reflect.package$", ScalaJS.d.O, {
  s_reflect_package$: 1,
  O: 1
});
ScalaJS.c.s_reflect_package$.prototype.$classData = ScalaJS.d.s_reflect_package$;
ScalaJS.n.s_reflect_package = undefined;
ScalaJS.m.s_reflect_package = (function() {
  if ((!ScalaJS.n.s_reflect_package)) {
    ScalaJS.n.s_reflect_package = new ScalaJS.c.s_reflect_package$().init___()
  };
  return ScalaJS.n.s_reflect_package
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_util_DynamicVariable = (function() {
  ScalaJS.c.O.call(this);
  this.scala$util$DynamicVariable$$init$f = null;
  this.tl$1 = null
});
ScalaJS.c.s_util_DynamicVariable.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_DynamicVariable.prototype.constructor = ScalaJS.c.s_util_DynamicVariable;
/** @constructor */
ScalaJS.h.s_util_DynamicVariable = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_DynamicVariable.prototype = ScalaJS.c.s_util_DynamicVariable.prototype;
ScalaJS.c.s_util_DynamicVariable.prototype.tl__p1__jl_InheritableThreadLocal = (function() {
  return this.tl$1
});
ScalaJS.c.s_util_DynamicVariable.prototype.value__O = (function() {
  return this.tl__p1__jl_InheritableThreadLocal().get__O()
});
ScalaJS.c.s_util_DynamicVariable.prototype.toString__T = (function() {
  return (("DynamicVariable(" + this.value__O()) + ")")
});
ScalaJS.c.s_util_DynamicVariable.prototype.init___O = (function(init) {
  this.scala$util$DynamicVariable$$init$f = init;
  ScalaJS.c.O.prototype.init___.call(this);
  this.tl$1 = new ScalaJS.c.s_util_DynamicVariable$$anon$1().init___s_util_DynamicVariable(this);
  return this
});
/*<skip>*/;
ScalaJS.is.s_util_DynamicVariable = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_DynamicVariable)))
});
ScalaJS.as.s_util_DynamicVariable = (function(obj) {
  if ((ScalaJS.is.s_util_DynamicVariable(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.util.DynamicVariable")
  }
});
ScalaJS.isArrayOf.s_util_DynamicVariable = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_DynamicVariable)))
});
ScalaJS.asArrayOf.s_util_DynamicVariable = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_util_DynamicVariable(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.util.DynamicVariable;", depth)
  }
});
ScalaJS.d.s_util_DynamicVariable = new ScalaJS.ClassTypeData({
  s_util_DynamicVariable: 0
}, false, "scala.util.DynamicVariable", ScalaJS.d.O, {
  s_util_DynamicVariable: 1,
  O: 1
});
ScalaJS.c.s_util_DynamicVariable.prototype.$classData = ScalaJS.d.s_util_DynamicVariable;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_util_Either$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_util_Either$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_Either$.prototype.constructor = ScalaJS.c.s_util_Either$;
/** @constructor */
ScalaJS.h.s_util_Either$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_Either$.prototype = ScalaJS.c.s_util_Either$.prototype;
/*<skip>*/;
ScalaJS.is.s_util_Either$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_Either$)))
});
ScalaJS.as.s_util_Either$ = (function(obj) {
  if ((ScalaJS.is.s_util_Either$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.util.Either$")
  }
});
ScalaJS.isArrayOf.s_util_Either$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_Either$)))
});
ScalaJS.asArrayOf.s_util_Either$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_util_Either$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.util.Either$;", depth)
  }
});
ScalaJS.d.s_util_Either$ = new ScalaJS.ClassTypeData({
  s_util_Either$: 0
}, false, "scala.util.Either$", ScalaJS.d.O, {
  s_util_Either$: 1,
  O: 1
});
ScalaJS.c.s_util_Either$.prototype.$classData = ScalaJS.d.s_util_Either$;
ScalaJS.n.s_util_Either = undefined;
ScalaJS.m.s_util_Either = (function() {
  if ((!ScalaJS.n.s_util_Either)) {
    ScalaJS.n.s_util_Either = new ScalaJS.c.s_util_Either$().init___()
  };
  return ScalaJS.n.s_util_Either
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_util_Left$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_util_Left$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_Left$.prototype.constructor = ScalaJS.c.s_util_Left$;
/** @constructor */
ScalaJS.h.s_util_Left$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_Left$.prototype = ScalaJS.c.s_util_Left$.prototype;
ScalaJS.c.s_util_Left$.prototype.toString__T = (function() {
  return "Left"
});
/*<skip>*/;
ScalaJS.is.s_util_Left$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_Left$)))
});
ScalaJS.as.s_util_Left$ = (function(obj) {
  if ((ScalaJS.is.s_util_Left$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.util.Left$")
  }
});
ScalaJS.isArrayOf.s_util_Left$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_Left$)))
});
ScalaJS.asArrayOf.s_util_Left$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_util_Left$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.util.Left$;", depth)
  }
});
ScalaJS.d.s_util_Left$ = new ScalaJS.ClassTypeData({
  s_util_Left$: 0
}, false, "scala.util.Left$", ScalaJS.d.O, {
  s_util_Left$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_util_Left$.prototype.$classData = ScalaJS.d.s_util_Left$;
ScalaJS.n.s_util_Left = undefined;
ScalaJS.m.s_util_Left = (function() {
  if ((!ScalaJS.n.s_util_Left)) {
    ScalaJS.n.s_util_Left = new ScalaJS.c.s_util_Left$().init___()
  };
  return ScalaJS.n.s_util_Left
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_util_Random = (function() {
  ScalaJS.c.O.call(this);
  this.self$1 = null
});
ScalaJS.c.s_util_Random.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_Random.prototype.constructor = ScalaJS.c.s_util_Random;
/** @constructor */
ScalaJS.h.s_util_Random = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_Random.prototype = ScalaJS.c.s_util_Random.prototype;
ScalaJS.c.s_util_Random.prototype.self__ju_Random = (function() {
  return this.self$1
});
ScalaJS.c.s_util_Random.prototype.nextInt__I__I = (function(n) {
  return this.self__ju_Random().nextInt__I__I(n)
});
ScalaJS.c.s_util_Random.prototype.init___ju_Random = (function(self) {
  this.self$1 = self;
  ScalaJS.c.O.prototype.init___.call(this);
  return this
});
ScalaJS.c.s_util_Random.prototype.init___ = (function() {
  ScalaJS.c.s_util_Random.prototype.init___ju_Random.call(this, new ScalaJS.c.ju_Random().init___());
  return this
});
/*<skip>*/;
ScalaJS.is.s_util_Random = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_Random)))
});
ScalaJS.as.s_util_Random = (function(obj) {
  if ((ScalaJS.is.s_util_Random(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.util.Random")
  }
});
ScalaJS.isArrayOf.s_util_Random = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_Random)))
});
ScalaJS.asArrayOf.s_util_Random = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_util_Random(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.util.Random;", depth)
  }
});
ScalaJS.d.s_util_Random = new ScalaJS.ClassTypeData({
  s_util_Random: 0
}, false, "scala.util.Random", ScalaJS.d.O, {
  s_util_Random: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_util_Random.prototype.$classData = ScalaJS.d.s_util_Random;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_util_Right$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_util_Right$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_Right$.prototype.constructor = ScalaJS.c.s_util_Right$;
/** @constructor */
ScalaJS.h.s_util_Right$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_Right$.prototype = ScalaJS.c.s_util_Right$.prototype;
ScalaJS.c.s_util_Right$.prototype.toString__T = (function() {
  return "Right"
});
/*<skip>*/;
ScalaJS.is.s_util_Right$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_Right$)))
});
ScalaJS.as.s_util_Right$ = (function(obj) {
  if ((ScalaJS.is.s_util_Right$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.util.Right$")
  }
});
ScalaJS.isArrayOf.s_util_Right$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_Right$)))
});
ScalaJS.asArrayOf.s_util_Right$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_util_Right$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.util.Right$;", depth)
  }
});
ScalaJS.d.s_util_Right$ = new ScalaJS.ClassTypeData({
  s_util_Right$: 0
}, false, "scala.util.Right$", ScalaJS.d.O, {
  s_util_Right$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_util_Right$.prototype.$classData = ScalaJS.d.s_util_Right$;
ScalaJS.n.s_util_Right = undefined;
ScalaJS.m.s_util_Right = (function() {
  if ((!ScalaJS.n.s_util_Right)) {
    ScalaJS.n.s_util_Right = new ScalaJS.c.s_util_Right$().init___()
  };
  return ScalaJS.n.s_util_Right
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_util_Try = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_util_Try.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_Try.prototype.constructor = ScalaJS.c.s_util_Try;
/** @constructor */
ScalaJS.h.s_util_Try = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_Try.prototype = ScalaJS.c.s_util_Try.prototype;
/*<skip>*/;
ScalaJS.is.s_util_Try = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_Try)))
});
ScalaJS.as.s_util_Try = (function(obj) {
  if ((ScalaJS.is.s_util_Try(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.util.Try")
  }
});
ScalaJS.isArrayOf.s_util_Try = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_Try)))
});
ScalaJS.asArrayOf.s_util_Try = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_util_Try(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.util.Try;", depth)
  }
});
ScalaJS.d.s_util_Try = new ScalaJS.ClassTypeData({
  s_util_Try: 0
}, false, "scala.util.Try", ScalaJS.d.O, {
  s_util_Try: 1,
  O: 1
});
ScalaJS.c.s_util_Try.prototype.$classData = ScalaJS.d.s_util_Try;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_util_control_Breaks = (function() {
  ScalaJS.c.O.call(this);
  this.scala$util$control$Breaks$$breakException$1 = null
});
ScalaJS.c.s_util_control_Breaks.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_control_Breaks.prototype.constructor = ScalaJS.c.s_util_control_Breaks;
/** @constructor */
ScalaJS.h.s_util_control_Breaks = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_control_Breaks.prototype = ScalaJS.c.s_util_control_Breaks.prototype;
ScalaJS.c.s_util_control_Breaks.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  this.scala$util$control$Breaks$$breakException$1 = new ScalaJS.c.s_util_control_BreakControl().init___();
  return this
});
/*<skip>*/;
ScalaJS.is.s_util_control_Breaks = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_control_Breaks)))
});
ScalaJS.as.s_util_control_Breaks = (function(obj) {
  if ((ScalaJS.is.s_util_control_Breaks(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.util.control.Breaks")
  }
});
ScalaJS.isArrayOf.s_util_control_Breaks = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_control_Breaks)))
});
ScalaJS.asArrayOf.s_util_control_Breaks = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_util_control_Breaks(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.util.control.Breaks;", depth)
  }
});
ScalaJS.d.s_util_control_Breaks = new ScalaJS.ClassTypeData({
  s_util_control_Breaks: 0
}, false, "scala.util.control.Breaks", ScalaJS.d.O, {
  s_util_control_Breaks: 1,
  O: 1
});
ScalaJS.c.s_util_control_Breaks.prototype.$classData = ScalaJS.d.s_util_control_Breaks;
/*<skip>*/;
ScalaJS.is.s_util_control_ControlThrowable = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_control_ControlThrowable)))
});
ScalaJS.as.s_util_control_ControlThrowable = (function(obj) {
  if ((ScalaJS.is.s_util_control_ControlThrowable(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.util.control.ControlThrowable")
  }
});
ScalaJS.isArrayOf.s_util_control_ControlThrowable = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_control_ControlThrowable)))
});
ScalaJS.asArrayOf.s_util_control_ControlThrowable = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_util_control_ControlThrowable(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.util.control.ControlThrowable;", depth)
  }
});
ScalaJS.d.s_util_control_ControlThrowable = new ScalaJS.ClassTypeData({
  s_util_control_ControlThrowable: 0
}, true, "scala.util.control.ControlThrowable", undefined, {
  s_util_control_ControlThrowable: 1,
  s_util_control_NoStackTrace: 1,
  O: 1
});
/** @constructor */
ScalaJS.c.s_util_control_NoStackTrace$ = (function() {
  ScalaJS.c.O.call(this);
  this.$$undnoSuppression$1 = false
});
ScalaJS.c.s_util_control_NoStackTrace$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_control_NoStackTrace$.prototype.constructor = ScalaJS.c.s_util_control_NoStackTrace$;
/** @constructor */
ScalaJS.h.s_util_control_NoStackTrace$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_control_NoStackTrace$.prototype = ScalaJS.c.s_util_control_NoStackTrace$.prototype;
ScalaJS.c.s_util_control_NoStackTrace$.prototype.noSuppression__Z = (function() {
  return this.$$undnoSuppression__p1__Z()
});
ScalaJS.c.s_util_control_NoStackTrace$.prototype.$$undnoSuppression__p1__Z = (function() {
  return this.$$undnoSuppression$1
});
ScalaJS.c.s_util_control_NoStackTrace$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.s_util_control_NoStackTrace = this;
  this.$$undnoSuppression$1 = false;
  return this
});
/*<skip>*/;
ScalaJS.is.s_util_control_NoStackTrace$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_control_NoStackTrace$)))
});
ScalaJS.as.s_util_control_NoStackTrace$ = (function(obj) {
  if ((ScalaJS.is.s_util_control_NoStackTrace$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.util.control.NoStackTrace$")
  }
});
ScalaJS.isArrayOf.s_util_control_NoStackTrace$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_control_NoStackTrace$)))
});
ScalaJS.asArrayOf.s_util_control_NoStackTrace$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_util_control_NoStackTrace$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.util.control.NoStackTrace$;", depth)
  }
});
ScalaJS.d.s_util_control_NoStackTrace$ = new ScalaJS.ClassTypeData({
  s_util_control_NoStackTrace$: 0
}, false, "scala.util.control.NoStackTrace$", ScalaJS.d.O, {
  s_util_control_NoStackTrace$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_util_control_NoStackTrace$.prototype.$classData = ScalaJS.d.s_util_control_NoStackTrace$;
ScalaJS.n.s_util_control_NoStackTrace = undefined;
ScalaJS.m.s_util_control_NoStackTrace = (function() {
  if ((!ScalaJS.n.s_util_control_NoStackTrace)) {
    ScalaJS.n.s_util_control_NoStackTrace = new ScalaJS.c.s_util_control_NoStackTrace$().init___()
  };
  return ScalaJS.n.s_util_control_NoStackTrace
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_util_control_NonFatal$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_util_control_NonFatal$.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_control_NonFatal$.prototype.constructor = ScalaJS.c.s_util_control_NonFatal$;
/** @constructor */
ScalaJS.h.s_util_control_NonFatal$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_control_NonFatal$.prototype = ScalaJS.c.s_util_control_NonFatal$.prototype;
ScalaJS.c.s_util_control_NonFatal$.prototype.apply__jl_Throwable__Z = (function(t) {
  var x1 = t;
  matchEnd11: {
    if (ScalaJS.is.jl_VirtualMachineError(x1)) {
      var jsx$1 = true;
      break matchEnd11
    };
    if (ScalaJS.is.jl_ThreadDeath(x1)) {
      var jsx$1 = true;
      break matchEnd11
    };
    if (ScalaJS.is.jl_InterruptedException(x1)) {
      var jsx$1 = true;
      break matchEnd11
    };
    if (ScalaJS.is.jl_LinkageError(x1)) {
      var jsx$1 = true;
      break matchEnd11
    };
    if (ScalaJS.is.s_util_control_ControlThrowable(x1)) {
      var jsx$1 = true;
      break matchEnd11
    };
    var jsx$1 = false;
    break matchEnd11
  };
  if (jsx$1) {
    return false
  };
  return true
});
ScalaJS.c.s_util_control_NonFatal$.prototype.unapply__jl_Throwable__s_Option = (function(t) {
  if (this.apply__jl_Throwable__Z(t)) {
    return new ScalaJS.c.s_Some().init___O(t)
  } else {
    return ScalaJS.m.s_None()
  }
});
/*<skip>*/;
ScalaJS.is.s_util_control_NonFatal$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_control_NonFatal$)))
});
ScalaJS.as.s_util_control_NonFatal$ = (function(obj) {
  if ((ScalaJS.is.s_util_control_NonFatal$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.util.control.NonFatal$")
  }
});
ScalaJS.isArrayOf.s_util_control_NonFatal$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_control_NonFatal$)))
});
ScalaJS.asArrayOf.s_util_control_NonFatal$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_util_control_NonFatal$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.util.control.NonFatal$;", depth)
  }
});
ScalaJS.d.s_util_control_NonFatal$ = new ScalaJS.ClassTypeData({
  s_util_control_NonFatal$: 0
}, false, "scala.util.control.NonFatal$", ScalaJS.d.O, {
  s_util_control_NonFatal$: 1,
  O: 1
});
ScalaJS.c.s_util_control_NonFatal$.prototype.$classData = ScalaJS.d.s_util_control_NonFatal$;
ScalaJS.n.s_util_control_NonFatal = undefined;
ScalaJS.m.s_util_control_NonFatal = (function() {
  if ((!ScalaJS.n.s_util_control_NonFatal)) {
    ScalaJS.n.s_util_control_NonFatal = new ScalaJS.c.s_util_control_NonFatal$().init___()
  };
  return ScalaJS.n.s_util_control_NonFatal
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_util_hashing_MurmurHash3 = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype = new ScalaJS.h.O();
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.constructor = ScalaJS.c.s_util_hashing_MurmurHash3;
/** @constructor */
ScalaJS.h.s_util_hashing_MurmurHash3 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_hashing_MurmurHash3.prototype = ScalaJS.c.s_util_hashing_MurmurHash3.prototype;
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.mix__I__I__I = (function(hash, data) {
  var h = this.mixLast__I__I__I(hash, data);
  h = ScalaJS.m.jl_Integer().rotateLeft__I__I__I(h, 13);
  return ((ScalaJS.imul(h, 5) + -430675100) | 0)
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.mixLast__I__I__I = (function(hash, data) {
  var k = data;
  k = ScalaJS.imul(k, -862048943);
  k = ScalaJS.m.jl_Integer().rotateLeft__I__I__I(k, 15);
  k = ScalaJS.imul(k, 461845907);
  return (hash ^ k)
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.finalizeHash__I__I__I = (function(hash, length) {
  return this.avalanche__p1__I__I((hash ^ length))
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.avalanche__p1__I__I = (function(hash) {
  var h = hash;
  h = (h ^ ((h >>> 16) | 0));
  h = ScalaJS.imul(h, -2048144789);
  h = (h ^ ((h >>> 13) | 0));
  h = ScalaJS.imul(h, -1028477387);
  h = (h ^ ((h >>> 16) | 0));
  return h
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.productHash__s_Product__I__I = (function(x, seed) {
  var arr = x.productArity__I();
  if ((arr === 0)) {
    return ScalaJS.objectHashCode(x.productPrefix__T())
  } else {
    var h = seed;
    var i = 0;
    while ((i < arr)) {
      h = this.mix__I__I__I(h, ScalaJS.m.sr_ScalaRunTime().hash__O__I(x.productElement__I__O(i)));
      i = ((i + 1) | 0)
    };
    return this.finalizeHash__I__I__I(h, arr)
  }
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.orderedHash__sc_TraversableOnce__I__I = (function(xs, seed) {
  var n = ScalaJS.m.sr_IntRef().create__I__sr_IntRef(0);
  var h = ScalaJS.m.sr_IntRef().create__I__sr_IntRef(seed);
  xs.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(x$2) {
    var x = ScalaJS.as.O(x$2);
    this.$$anonfun$2__p1__O__sr_IntRef__sr_IntRef__V(x, n, h)
  })["bind"](this)));
  return this.finalizeHash__I__I__I(h.elem$1, n.elem$1)
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.listHash__sci_List__I__I = (function(xs, seed) {
  var n = 0;
  var h = seed;
  var elems = xs;
  while ((!elems.isEmpty__Z())) {
    var head = elems.head__O();
    var tail = ScalaJS.as.sci_List(elems.tail__O());
    h = this.mix__I__I__I(h, ScalaJS.m.sr_ScalaRunTime().hash__O__I(head));
    n = ((n + 1) | 0);
    elems = tail
  };
  return this.finalizeHash__I__I__I(h, n)
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.$$anonfun$2__p1__O__sr_IntRef__sr_IntRef__V = (function(x, n$2, h$1) {
  h$1.elem$1 = this.mix__I__I__I(h$1.elem$1, ScalaJS.m.sr_ScalaRunTime().hash__O__I(x));
  n$2.elem$1 = ((n$2.elem$1 + 1) | 0)
});
/*<skip>*/;
ScalaJS.is.s_util_hashing_MurmurHash3 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_hashing_MurmurHash3)))
});
ScalaJS.as.s_util_hashing_MurmurHash3 = (function(obj) {
  if ((ScalaJS.is.s_util_hashing_MurmurHash3(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.util.hashing.MurmurHash3")
  }
});
ScalaJS.isArrayOf.s_util_hashing_MurmurHash3 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_hashing_MurmurHash3)))
});
ScalaJS.asArrayOf.s_util_hashing_MurmurHash3 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_util_hashing_MurmurHash3(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.util.hashing.MurmurHash3;", depth)
  }
});
ScalaJS.d.s_util_hashing_MurmurHash3 = new ScalaJS.ClassTypeData({
  s_util_hashing_MurmurHash3: 0
}, false, "scala.util.hashing.MurmurHash3", ScalaJS.d.O, {
  s_util_hashing_MurmurHash3: 1,
  O: 1
});
ScalaJS.c.s_util_hashing_MurmurHash3.prototype.$classData = ScalaJS.d.s_util_hashing_MurmurHash3;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sc_$colon$plus$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sc_$colon$plus$.prototype = new ScalaJS.h.O();
ScalaJS.c.sc_$colon$plus$.prototype.constructor = ScalaJS.c.sc_$colon$plus$;
/** @constructor */
ScalaJS.h.sc_$colon$plus$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_$colon$plus$.prototype = ScalaJS.c.sc_$colon$plus$.prototype;
/*<skip>*/;
ScalaJS.is.sc_$colon$plus$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_$colon$plus$)))
});
ScalaJS.as.sc_$colon$plus$ = (function(obj) {
  if ((ScalaJS.is.sc_$colon$plus$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.$colon$plus$")
  }
});
ScalaJS.isArrayOf.sc_$colon$plus$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_$colon$plus$)))
});
ScalaJS.asArrayOf.sc_$colon$plus$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sc_$colon$plus$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.$colon$plus$;", depth)
  }
});
ScalaJS.d.sc_$colon$plus$ = new ScalaJS.ClassTypeData({
  sc_$colon$plus$: 0
}, false, "scala.collection.$colon$plus$", ScalaJS.d.O, {
  sc_$colon$plus$: 1,
  O: 1
});
ScalaJS.c.sc_$colon$plus$.prototype.$classData = ScalaJS.d.sc_$colon$plus$;
ScalaJS.n.sc_$colon$plus = undefined;
ScalaJS.m.sc_$colon$plus = (function() {
  if ((!ScalaJS.n.sc_$colon$plus)) {
    ScalaJS.n.sc_$colon$plus = new ScalaJS.c.sc_$colon$plus$().init___()
  };
  return ScalaJS.n.sc_$colon$plus
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sc_$plus$colon$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sc_$plus$colon$.prototype = new ScalaJS.h.O();
ScalaJS.c.sc_$plus$colon$.prototype.constructor = ScalaJS.c.sc_$plus$colon$;
/** @constructor */
ScalaJS.h.sc_$plus$colon$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_$plus$colon$.prototype = ScalaJS.c.sc_$plus$colon$.prototype;
/*<skip>*/;
ScalaJS.is.sc_$plus$colon$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_$plus$colon$)))
});
ScalaJS.as.sc_$plus$colon$ = (function(obj) {
  if ((ScalaJS.is.sc_$plus$colon$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.$plus$colon$")
  }
});
ScalaJS.isArrayOf.sc_$plus$colon$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_$plus$colon$)))
});
ScalaJS.asArrayOf.sc_$plus$colon$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sc_$plus$colon$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.$plus$colon$;", depth)
  }
});
ScalaJS.d.sc_$plus$colon$ = new ScalaJS.ClassTypeData({
  sc_$plus$colon$: 0
}, false, "scala.collection.$plus$colon$", ScalaJS.d.O, {
  sc_$plus$colon$: 1,
  O: 1
});
ScalaJS.c.sc_$plus$colon$.prototype.$classData = ScalaJS.d.sc_$plus$colon$;
ScalaJS.n.sc_$plus$colon = undefined;
ScalaJS.m.sc_$plus$colon = (function() {
  if ((!ScalaJS.n.sc_$plus$colon)) {
    ScalaJS.n.sc_$plus$colon = new ScalaJS.c.sc_$plus$colon$().init___()
  };
  return ScalaJS.n.sc_$plus$colon
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sc_AbstractIterator = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sc_AbstractIterator.prototype = new ScalaJS.h.O();
ScalaJS.c.sc_AbstractIterator.prototype.constructor = ScalaJS.c.sc_AbstractIterator;
/** @constructor */
ScalaJS.h.sc_AbstractIterator = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_AbstractIterator.prototype = ScalaJS.c.sc_AbstractIterator.prototype;
ScalaJS.c.sc_AbstractIterator.prototype.isEmpty__Z = (function() {
  return ScalaJS.i.sc_Iterator$class__isEmpty__sc_Iterator__Z(this)
});
ScalaJS.c.sc_AbstractIterator.prototype.foreach__F1__V = (function(f) {
  ScalaJS.i.sc_Iterator$class__foreach__sc_Iterator__F1__V(this, f)
});
ScalaJS.c.sc_AbstractIterator.prototype.toString__T = (function() {
  return ScalaJS.i.sc_Iterator$class__toString__sc_Iterator__T(this)
});
ScalaJS.c.sc_AbstractIterator.prototype.mkString__T__T__T__T = (function(start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T(this, start, sep, end)
});
ScalaJS.c.sc_AbstractIterator.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this, b, start, sep, end)
});
ScalaJS.c.sc_AbstractIterator.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.i.sc_TraversableOnce$class__$init$__sc_TraversableOnce__V(this);
  ScalaJS.i.sc_Iterator$class__$init$__sc_Iterator__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.sc_AbstractIterator = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_AbstractIterator)))
});
ScalaJS.as.sc_AbstractIterator = (function(obj) {
  if ((ScalaJS.is.sc_AbstractIterator(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.AbstractIterator")
  }
});
ScalaJS.isArrayOf.sc_AbstractIterator = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_AbstractIterator)))
});
ScalaJS.asArrayOf.sc_AbstractIterator = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sc_AbstractIterator(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.AbstractIterator;", depth)
  }
});
ScalaJS.d.sc_AbstractIterator = new ScalaJS.ClassTypeData({
  sc_AbstractIterator: 0
}, false, "scala.collection.AbstractIterator", ScalaJS.d.O, {
  sc_AbstractIterator: 1,
  sc_Iterator: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  O: 1
});
ScalaJS.c.sc_AbstractIterator.prototype.$classData = ScalaJS.d.sc_AbstractIterator;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sc_AbstractTraversable = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sc_AbstractTraversable.prototype = new ScalaJS.h.O();
ScalaJS.c.sc_AbstractTraversable.prototype.constructor = ScalaJS.c.sc_AbstractTraversable;
/** @constructor */
ScalaJS.h.sc_AbstractTraversable = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_AbstractTraversable.prototype = ScalaJS.c.sc_AbstractTraversable.prototype;
ScalaJS.c.sc_AbstractTraversable.prototype.repr__O = (function() {
  return ScalaJS.i.sc_TraversableLike$class__repr__sc_TraversableLike__O(this)
});
ScalaJS.c.sc_AbstractTraversable.prototype.stringPrefix__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__stringPrefix__sc_TraversableLike__T(this)
});
ScalaJS.c.sc_AbstractTraversable.prototype.nonEmpty__Z = (function() {
  return ScalaJS.i.sc_TraversableOnce$class__nonEmpty__sc_TraversableOnce__Z(this)
});
ScalaJS.c.sc_AbstractTraversable.prototype.mkString__T__T__T__T = (function(start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T(this, start, sep, end)
});
ScalaJS.c.sc_AbstractTraversable.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this, b, start, sep, end)
});
ScalaJS.c.sc_AbstractTraversable.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.i.sc_TraversableOnce$class__$init$__sc_TraversableOnce__V(this);
  ScalaJS.i.sc_Parallelizable$class__$init$__sc_Parallelizable__V(this);
  ScalaJS.i.sc_TraversableLike$class__$init$__sc_TraversableLike__V(this);
  ScalaJS.i.scg_GenericTraversableTemplate$class__$init$__scg_GenericTraversableTemplate__V(this);
  ScalaJS.i.sc_GenTraversable$class__$init$__sc_GenTraversable__V(this);
  ScalaJS.i.sc_Traversable$class__$init$__sc_Traversable__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.sc_AbstractTraversable = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_AbstractTraversable)))
});
ScalaJS.as.sc_AbstractTraversable = (function(obj) {
  if ((ScalaJS.is.sc_AbstractTraversable(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.AbstractTraversable")
  }
});
ScalaJS.isArrayOf.sc_AbstractTraversable = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_AbstractTraversable)))
});
ScalaJS.asArrayOf.sc_AbstractTraversable = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sc_AbstractTraversable(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.AbstractTraversable;", depth)
  }
});
ScalaJS.d.sc_AbstractTraversable = new ScalaJS.ClassTypeData({
  sc_AbstractTraversable: 0
}, false, "scala.collection.AbstractTraversable", ScalaJS.d.O, {
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.sc_AbstractTraversable.prototype.$classData = ScalaJS.d.sc_AbstractTraversable;
/*<skip>*/;
ScalaJS.is.sc_GenSeq = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_GenSeq)))
});
ScalaJS.as.sc_GenSeq = (function(obj) {
  if ((ScalaJS.is.sc_GenSeq(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.GenSeq")
  }
});
ScalaJS.isArrayOf.sc_GenSeq = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_GenSeq)))
});
ScalaJS.asArrayOf.sc_GenSeq = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sc_GenSeq(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.GenSeq;", depth)
  }
});
ScalaJS.d.sc_GenSeq = new ScalaJS.ClassTypeData({
  sc_GenSeq: 0
}, true, "scala.collection.GenSeq", undefined, {
  sc_GenSeq: 1,
  sc_GenIterable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  scg_HasNewBuilder: 1,
  sc_GenSeqLike: 1,
  s_Equals: 1,
  sc_GenIterableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_GenTraversableOnce: 1,
  O: 1
});
ScalaJS.is.sc_IndexedSeq = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_IndexedSeq)))
});
ScalaJS.as.sc_IndexedSeq = (function(obj) {
  if ((ScalaJS.is.sc_IndexedSeq(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.IndexedSeq")
  }
});
ScalaJS.isArrayOf.sc_IndexedSeq = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_IndexedSeq)))
});
ScalaJS.asArrayOf.sc_IndexedSeq = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sc_IndexedSeq(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.IndexedSeq;", depth)
  }
});
ScalaJS.d.sc_IndexedSeq = new ScalaJS.ClassTypeData({
  sc_IndexedSeq: 0
}, true, "scala.collection.IndexedSeq", undefined, {
  sc_IndexedSeq: 1,
  sc_IndexedSeqLike: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_PartialFunction: 1,
  F1: 1,
  O: 1
});
/** @constructor */
ScalaJS.c.sc_Iterator$ = (function() {
  ScalaJS.c.O.call(this);
  this.empty$1 = null
});
ScalaJS.c.sc_Iterator$.prototype = new ScalaJS.h.O();
ScalaJS.c.sc_Iterator$.prototype.constructor = ScalaJS.c.sc_Iterator$;
/** @constructor */
ScalaJS.h.sc_Iterator$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_Iterator$.prototype = ScalaJS.c.sc_Iterator$.prototype;
ScalaJS.c.sc_Iterator$.prototype.empty__sc_Iterator = (function() {
  return this.empty$1
});
ScalaJS.c.sc_Iterator$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.sc_Iterator = this;
  this.empty$1 = new ScalaJS.c.sc_Iterator$$anon$2().init___();
  return this
});
/*<skip>*/;
ScalaJS.is.sc_Iterator$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_Iterator$)))
});
ScalaJS.as.sc_Iterator$ = (function(obj) {
  if ((ScalaJS.is.sc_Iterator$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.Iterator$")
  }
});
ScalaJS.isArrayOf.sc_Iterator$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_Iterator$)))
});
ScalaJS.asArrayOf.sc_Iterator$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sc_Iterator$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.Iterator$;", depth)
  }
});
ScalaJS.d.sc_Iterator$ = new ScalaJS.ClassTypeData({
  sc_Iterator$: 0
}, false, "scala.collection.Iterator$", ScalaJS.d.O, {
  sc_Iterator$: 1,
  O: 1
});
ScalaJS.c.sc_Iterator$.prototype.$classData = ScalaJS.d.sc_Iterator$;
ScalaJS.n.sc_Iterator = undefined;
ScalaJS.m.sc_Iterator = (function() {
  if ((!ScalaJS.n.sc_Iterator)) {
    ScalaJS.n.sc_Iterator = new ScalaJS.c.sc_Iterator$().init___()
  };
  return ScalaJS.n.sc_Iterator
});
/*<skip>*/;
ScalaJS.is.sc_LinearSeq = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_LinearSeq)))
});
ScalaJS.as.sc_LinearSeq = (function(obj) {
  if ((ScalaJS.is.sc_LinearSeq(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.LinearSeq")
  }
});
ScalaJS.isArrayOf.sc_LinearSeq = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_LinearSeq)))
});
ScalaJS.asArrayOf.sc_LinearSeq = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sc_LinearSeq(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.LinearSeq;", depth)
  }
});
ScalaJS.d.sc_LinearSeq = new ScalaJS.ClassTypeData({
  sc_LinearSeq: 0
}, true, "scala.collection.LinearSeq", undefined, {
  sc_LinearSeq: 1,
  sc_LinearSeqLike: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_PartialFunction: 1,
  F1: 1,
  O: 1
});
ScalaJS.is.sc_LinearSeqLike = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_LinearSeqLike)))
});
ScalaJS.as.sc_LinearSeqLike = (function(obj) {
  if ((ScalaJS.is.sc_LinearSeqLike(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.LinearSeqLike")
  }
});
ScalaJS.isArrayOf.sc_LinearSeqLike = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_LinearSeqLike)))
});
ScalaJS.asArrayOf.sc_LinearSeqLike = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sc_LinearSeqLike(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.LinearSeqLike;", depth)
  }
});
ScalaJS.d.sc_LinearSeqLike = new ScalaJS.ClassTypeData({
  sc_LinearSeqLike: 0
}, true, "scala.collection.LinearSeqLike", undefined, {
  sc_LinearSeqLike: 1,
  sc_SeqLike: 1,
  sc_GenSeqLike: 1,
  sc_IterableLike: 1,
  sc_GenIterableLike: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.is.sc_LinearSeqOptimized = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_LinearSeqOptimized)))
});
ScalaJS.as.sc_LinearSeqOptimized = (function(obj) {
  if ((ScalaJS.is.sc_LinearSeqOptimized(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.LinearSeqOptimized")
  }
});
ScalaJS.isArrayOf.sc_LinearSeqOptimized = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_LinearSeqOptimized)))
});
ScalaJS.asArrayOf.sc_LinearSeqOptimized = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sc_LinearSeqOptimized(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.LinearSeqOptimized;", depth)
  }
});
ScalaJS.d.sc_LinearSeqOptimized = new ScalaJS.ClassTypeData({
  sc_LinearSeqOptimized: 0
}, true, "scala.collection.LinearSeqOptimized", undefined, {
  sc_LinearSeqOptimized: 1,
  sc_LinearSeqLike: 1,
  sc_SeqLike: 1,
  sc_GenSeqLike: 1,
  sc_IterableLike: 1,
  sc_GenIterableLike: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_Equals: 1,
  O: 1
});
/** @constructor */
ScalaJS.c.scg_GenMapFactory = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scg_GenMapFactory.prototype = new ScalaJS.h.O();
ScalaJS.c.scg_GenMapFactory.prototype.constructor = ScalaJS.c.scg_GenMapFactory;
/** @constructor */
ScalaJS.h.scg_GenMapFactory = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_GenMapFactory.prototype = ScalaJS.c.scg_GenMapFactory.prototype;
/*<skip>*/;
ScalaJS.is.scg_GenMapFactory = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scg_GenMapFactory)))
});
ScalaJS.as.scg_GenMapFactory = (function(obj) {
  if ((ScalaJS.is.scg_GenMapFactory(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.generic.GenMapFactory")
  }
});
ScalaJS.isArrayOf.scg_GenMapFactory = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scg_GenMapFactory)))
});
ScalaJS.asArrayOf.scg_GenMapFactory = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scg_GenMapFactory(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.generic.GenMapFactory;", depth)
  }
});
ScalaJS.d.scg_GenMapFactory = new ScalaJS.ClassTypeData({
  scg_GenMapFactory: 0
}, false, "scala.collection.generic.GenMapFactory", ScalaJS.d.O, {
  scg_GenMapFactory: 1,
  O: 1
});
ScalaJS.c.scg_GenMapFactory.prototype.$classData = ScalaJS.d.scg_GenMapFactory;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom = (function() {
  ScalaJS.c.O.call(this);
  this.$$outer$f = null
});
ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.prototype = new ScalaJS.h.O();
ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.prototype.constructor = ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom;
/** @constructor */
ScalaJS.h.scg_GenTraversableFactory$GenericCanBuildFrom = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_GenTraversableFactory$GenericCanBuildFrom.prototype = ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.prototype;
ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.prototype.init___scg_GenTraversableFactory = (function($$outer) {
  if (($$outer === null)) {
    throw ScalaJS.unwrapJavaScriptException(null)
  } else {
    this.$$outer$f = $$outer
  };
  ScalaJS.c.O.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.scg_GenTraversableFactory$GenericCanBuildFrom = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scg_GenTraversableFactory$GenericCanBuildFrom)))
});
ScalaJS.as.scg_GenTraversableFactory$GenericCanBuildFrom = (function(obj) {
  if ((ScalaJS.is.scg_GenTraversableFactory$GenericCanBuildFrom(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.generic.GenTraversableFactory$GenericCanBuildFrom")
  }
});
ScalaJS.isArrayOf.scg_GenTraversableFactory$GenericCanBuildFrom = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scg_GenTraversableFactory$GenericCanBuildFrom)))
});
ScalaJS.asArrayOf.scg_GenTraversableFactory$GenericCanBuildFrom = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scg_GenTraversableFactory$GenericCanBuildFrom(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.generic.GenTraversableFactory$GenericCanBuildFrom;", depth)
  }
});
ScalaJS.d.scg_GenTraversableFactory$GenericCanBuildFrom = new ScalaJS.ClassTypeData({
  scg_GenTraversableFactory$GenericCanBuildFrom: 0
}, false, "scala.collection.generic.GenTraversableFactory$GenericCanBuildFrom", ScalaJS.d.O, {
  scg_GenTraversableFactory$GenericCanBuildFrom: 1,
  scg_CanBuildFrom: 1,
  O: 1
});
ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.prototype.$classData = ScalaJS.d.scg_GenTraversableFactory$GenericCanBuildFrom;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scg_GenericCompanion = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scg_GenericCompanion.prototype = new ScalaJS.h.O();
ScalaJS.c.scg_GenericCompanion.prototype.constructor = ScalaJS.c.scg_GenericCompanion;
/** @constructor */
ScalaJS.h.scg_GenericCompanion = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_GenericCompanion.prototype = ScalaJS.c.scg_GenericCompanion.prototype;
/*<skip>*/;
ScalaJS.is.scg_GenericCompanion = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scg_GenericCompanion)))
});
ScalaJS.as.scg_GenericCompanion = (function(obj) {
  if ((ScalaJS.is.scg_GenericCompanion(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.generic.GenericCompanion")
  }
});
ScalaJS.isArrayOf.scg_GenericCompanion = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scg_GenericCompanion)))
});
ScalaJS.asArrayOf.scg_GenericCompanion = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scg_GenericCompanion(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.generic.GenericCompanion;", depth)
  }
});
ScalaJS.d.scg_GenericCompanion = new ScalaJS.ClassTypeData({
  scg_GenericCompanion: 0
}, false, "scala.collection.generic.GenericCompanion", ScalaJS.d.O, {
  scg_GenericCompanion: 1,
  O: 1
});
ScalaJS.c.scg_GenericCompanion.prototype.$classData = ScalaJS.d.scg_GenericCompanion;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sci_$colon$colon$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sci_$colon$colon$.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_$colon$colon$.prototype.constructor = ScalaJS.c.sci_$colon$colon$;
/** @constructor */
ScalaJS.h.sci_$colon$colon$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_$colon$colon$.prototype = ScalaJS.c.sci_$colon$colon$.prototype;
ScalaJS.c.sci_$colon$colon$.prototype.toString__T = (function() {
  return "::"
});
/*<skip>*/;
ScalaJS.is.sci_$colon$colon$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_$colon$colon$)))
});
ScalaJS.as.sci_$colon$colon$ = (function(obj) {
  if ((ScalaJS.is.sci_$colon$colon$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.immutable.$colon$colon$")
  }
});
ScalaJS.isArrayOf.sci_$colon$colon$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_$colon$colon$)))
});
ScalaJS.asArrayOf.sci_$colon$colon$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sci_$colon$colon$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.$colon$colon$;", depth)
  }
});
ScalaJS.d.sci_$colon$colon$ = new ScalaJS.ClassTypeData({
  sci_$colon$colon$: 0
}, false, "scala.collection.immutable.$colon$colon$", ScalaJS.d.O, {
  sci_$colon$colon$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.sci_$colon$colon$.prototype.$classData = ScalaJS.d.sci_$colon$colon$;
ScalaJS.n.sci_$colon$colon = undefined;
ScalaJS.m.sci_$colon$colon = (function() {
  if ((!ScalaJS.n.sci_$colon$colon)) {
    ScalaJS.n.sci_$colon$colon = new ScalaJS.c.sci_$colon$colon$().init___()
  };
  return ScalaJS.n.sci_$colon$colon
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sci_List$$anon$1 = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sci_List$$anon$1.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_List$$anon$1.prototype.constructor = ScalaJS.c.sci_List$$anon$1;
/** @constructor */
ScalaJS.h.sci_List$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_List$$anon$1.prototype = ScalaJS.c.sci_List$$anon$1.prototype;
ScalaJS.c.sci_List$$anon$1.prototype.toString__T = (function() {
  return ScalaJS.i.s_Function1$class__toString__F1__T(this)
});
ScalaJS.c.sci_List$$anon$1.prototype.apply__O__O = (function(x) {
  return this
});
ScalaJS.c.sci_List$$anon$1.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.i.s_Function1$class__$init$__F1__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.sci_List$$anon$1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_List$$anon$1)))
});
ScalaJS.as.sci_List$$anon$1 = (function(obj) {
  if ((ScalaJS.is.sci_List$$anon$1(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.immutable.List$$anon$1")
  }
});
ScalaJS.isArrayOf.sci_List$$anon$1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_List$$anon$1)))
});
ScalaJS.asArrayOf.sci_List$$anon$1 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sci_List$$anon$1(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.List$$anon$1;", depth)
  }
});
ScalaJS.d.sci_List$$anon$1 = new ScalaJS.ClassTypeData({
  sci_List$$anon$1: 0
}, false, "scala.collection.immutable.List$$anon$1", ScalaJS.d.O, {
  sci_List$$anon$1: 1,
  F1: 1,
  O: 1
});
ScalaJS.c.sci_List$$anon$1.prototype.$classData = ScalaJS.d.sci_List$$anon$1;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sci_Range$ = (function() {
  ScalaJS.c.O.call(this);
  this.MAX$undPRINT$1 = 0
});
ScalaJS.c.sci_Range$.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_Range$.prototype.constructor = ScalaJS.c.sci_Range$;
/** @constructor */
ScalaJS.h.sci_Range$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Range$.prototype = ScalaJS.c.sci_Range$.prototype;
ScalaJS.c.sci_Range$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.sci_Range = this;
  this.MAX$undPRINT$1 = 512;
  return this
});
/*<skip>*/;
ScalaJS.is.sci_Range$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_Range$)))
});
ScalaJS.as.sci_Range$ = (function(obj) {
  if ((ScalaJS.is.sci_Range$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.immutable.Range$")
  }
});
ScalaJS.isArrayOf.sci_Range$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_Range$)))
});
ScalaJS.asArrayOf.sci_Range$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sci_Range$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.Range$;", depth)
  }
});
ScalaJS.d.sci_Range$ = new ScalaJS.ClassTypeData({
  sci_Range$: 0
}, false, "scala.collection.immutable.Range$", ScalaJS.d.O, {
  sci_Range$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.sci_Range$.prototype.$classData = ScalaJS.d.sci_Range$;
ScalaJS.n.sci_Range = undefined;
ScalaJS.m.sci_Range = (function() {
  if ((!ScalaJS.n.sci_Range)) {
    ScalaJS.n.sci_Range = new ScalaJS.c.sci_Range$().init___()
  };
  return ScalaJS.n.sci_Range
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sci_Stream$$hash$colon$colon$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sci_Stream$$hash$colon$colon$.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_Stream$$hash$colon$colon$.prototype.constructor = ScalaJS.c.sci_Stream$$hash$colon$colon$;
/** @constructor */
ScalaJS.h.sci_Stream$$hash$colon$colon$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Stream$$hash$colon$colon$.prototype = ScalaJS.c.sci_Stream$$hash$colon$colon$.prototype;
/*<skip>*/;
ScalaJS.is.sci_Stream$$hash$colon$colon$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_Stream$$hash$colon$colon$)))
});
ScalaJS.as.sci_Stream$$hash$colon$colon$ = (function(obj) {
  if ((ScalaJS.is.sci_Stream$$hash$colon$colon$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.immutable.Stream$$hash$colon$colon$")
  }
});
ScalaJS.isArrayOf.sci_Stream$$hash$colon$colon$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_Stream$$hash$colon$colon$)))
});
ScalaJS.asArrayOf.sci_Stream$$hash$colon$colon$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sci_Stream$$hash$colon$colon$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.Stream$$hash$colon$colon$;", depth)
  }
});
ScalaJS.d.sci_Stream$$hash$colon$colon$ = new ScalaJS.ClassTypeData({
  sci_Stream$$hash$colon$colon$: 0
}, false, "scala.collection.immutable.Stream$$hash$colon$colon$", ScalaJS.d.O, {
  sci_Stream$$hash$colon$colon$: 1,
  O: 1
});
ScalaJS.c.sci_Stream$$hash$colon$colon$.prototype.$classData = ScalaJS.d.sci_Stream$$hash$colon$colon$;
ScalaJS.n.sci_Stream$$hash$colon$colon = undefined;
ScalaJS.m.sci_Stream$$hash$colon$colon = (function() {
  if ((!ScalaJS.n.sci_Stream$$hash$colon$colon)) {
    ScalaJS.n.sci_Stream$$hash$colon$colon = new ScalaJS.c.sci_Stream$$hash$colon$colon$().init___()
  };
  return ScalaJS.n.sci_Stream$$hash$colon$colon
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sci_StringOps = (function() {
  ScalaJS.c.O.call(this);
  this.repr$1 = null
});
ScalaJS.c.sci_StringOps.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_StringOps.prototype.constructor = ScalaJS.c.sci_StringOps;
/** @constructor */
ScalaJS.h.sci_StringOps = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_StringOps.prototype = ScalaJS.c.sci_StringOps.prototype;
ScalaJS.c.sci_StringOps.prototype.toInt__I = (function() {
  return ScalaJS.i.sci_StringLike$class__toInt__sci_StringLike__I(this)
});
ScalaJS.c.sci_StringOps.prototype.scala$collection$IndexedSeqOptimized$$super$sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_IterableLike$class__sameElements__sc_IterableLike__sc_GenIterable__Z(this, that)
});
ScalaJS.c.sci_StringOps.prototype.isEmpty__Z = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z(this)
});
ScalaJS.c.sci_StringOps.prototype.foreach__F1__V = (function(f) {
  ScalaJS.i.sc_IndexedSeqOptimized$class__foreach__sc_IndexedSeqOptimized__F1__V(this, f)
});
ScalaJS.c.sci_StringOps.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.sci_StringOps.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I(this, len)
});
ScalaJS.c.sci_StringOps.prototype.iterator__sc_Iterator = (function() {
  return ScalaJS.i.sc_IndexedSeqLike$class__iterator__sc_IndexedSeqLike__sc_Iterator(this)
});
ScalaJS.c.sci_StringOps.prototype.size__I = (function() {
  return ScalaJS.i.sc_SeqLike$class__size__sc_SeqLike__I(this)
});
ScalaJS.c.sci_StringOps.prototype.stringPrefix__T = (function() {
  return ScalaJS.i.sc_TraversableLike$class__stringPrefix__sc_TraversableLike__T(this)
});
ScalaJS.c.sci_StringOps.prototype.mkString__T__T__T__T = (function(start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__mkString__sc_TraversableOnce__T__T__T__T(this, start, sep, end)
});
ScalaJS.c.sci_StringOps.prototype.addString__scm_StringBuilder__T__T__T__scm_StringBuilder = (function(b, start, sep, end) {
  return ScalaJS.i.sc_TraversableOnce$class__addString__sc_TraversableOnce__scm_StringBuilder__T__T__T__scm_StringBuilder(this, b, start, sep, end)
});
ScalaJS.c.sci_StringOps.prototype.repr__T = (function() {
  return this.repr$1
});
ScalaJS.c.sci_StringOps.prototype.toString__T = (function() {
  return ScalaJS.m.sci_StringOps().toString$extension__T__T(this.repr__T())
});
ScalaJS.c.sci_StringOps.prototype.length__I = (function() {
  return ScalaJS.m.sci_StringOps().length$extension__T__I(this.repr__T())
});
ScalaJS.c.sci_StringOps.prototype.hashCode__I = (function() {
  return ScalaJS.m.sci_StringOps().hashCode$extension__T__I(this.repr__T())
});
ScalaJS.c.sci_StringOps.prototype.equals__O__Z = (function(x$1) {
  return ScalaJS.m.sci_StringOps().equals$extension__T__O__Z(this.repr__T(), x$1)
});
ScalaJS.c.sci_StringOps.prototype.seq__sc_IndexedSeq = (function() {
  return ScalaJS.m.sci_StringOps().seq$extension__T__sci_WrappedString(this.repr__T())
});
ScalaJS.c.sci_StringOps.prototype.apply__I__O = (function(idx) {
  return ScalaJS.bC(ScalaJS.m.sci_StringOps().apply$extension__T__I__C(this.repr__T(), idx))
});
ScalaJS.c.sci_StringOps.prototype.repr__O = (function() {
  return this.repr__T()
});
ScalaJS.c.sci_StringOps.prototype.init___T = (function(repr) {
  this.repr$1 = repr;
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.i.sc_TraversableOnce$class__$init$__sc_TraversableOnce__V(this);
  ScalaJS.i.sc_Parallelizable$class__$init$__sc_Parallelizable__V(this);
  ScalaJS.i.sc_TraversableLike$class__$init$__sc_TraversableLike__V(this);
  ScalaJS.i.sc_IterableLike$class__$init$__sc_IterableLike__V(this);
  ScalaJS.i.sc_GenSeqLike$class__$init$__sc_GenSeqLike__V(this);
  ScalaJS.i.sc_SeqLike$class__$init$__sc_SeqLike__V(this);
  ScalaJS.i.sc_IndexedSeqLike$class__$init$__sc_IndexedSeqLike__V(this);
  ScalaJS.i.sc_IndexedSeqOptimized$class__$init$__sc_IndexedSeqOptimized__V(this);
  ScalaJS.i.s_math_Ordered$class__$init$__s_math_Ordered__V(this);
  ScalaJS.i.sci_StringLike$class__$init$__sci_StringLike__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.sci_StringOps = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_StringOps)))
});
ScalaJS.as.sci_StringOps = (function(obj) {
  if ((ScalaJS.is.sci_StringOps(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.immutable.StringOps")
  }
});
ScalaJS.isArrayOf.sci_StringOps = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_StringOps)))
});
ScalaJS.asArrayOf.sci_StringOps = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sci_StringOps(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.StringOps;", depth)
  }
});
ScalaJS.d.sci_StringOps = new ScalaJS.ClassTypeData({
  sci_StringOps: 0
}, false, "scala.collection.immutable.StringOps", ScalaJS.d.O, {
  sci_StringOps: 1,
  sci_StringLike: 1,
  s_math_Ordered: 1,
  jl_Comparable: 1,
  sc_IndexedSeqOptimized: 1,
  sc_IndexedSeqLike: 1,
  sc_SeqLike: 1,
  sc_GenSeqLike: 1,
  sc_IterableLike: 1,
  sc_GenIterableLike: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.sci_StringOps.prototype.$classData = ScalaJS.d.sci_StringOps;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sci_StringOps$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sci_StringOps$.prototype = new ScalaJS.h.O();
ScalaJS.c.sci_StringOps$.prototype.constructor = ScalaJS.c.sci_StringOps$;
/** @constructor */
ScalaJS.h.sci_StringOps$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_StringOps$.prototype = ScalaJS.c.sci_StringOps$.prototype;
ScalaJS.c.sci_StringOps$.prototype.apply$extension__T__I__C = (function($$this, index) {
  return ScalaJS.i.sjsr_RuntimeString$class__charAt__sjsr_RuntimeString__I__C($$this, index)
});
ScalaJS.c.sci_StringOps$.prototype.toString$extension__T__T = (function($$this) {
  return $$this
});
ScalaJS.c.sci_StringOps$.prototype.length$extension__T__I = (function($$this) {
  return ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I($$this)
});
ScalaJS.c.sci_StringOps$.prototype.seq$extension__T__sci_WrappedString = (function($$this) {
  return new ScalaJS.c.sci_WrappedString().init___T($$this)
});
ScalaJS.c.sci_StringOps$.prototype.hashCode$extension__T__I = (function($$this) {
  return ScalaJS.objectHashCode($$this)
});
ScalaJS.c.sci_StringOps$.prototype.equals$extension__T__O__Z = (function($$this, x$1) {
  var x1 = x$1;
  matchEnd4: {
    if (ScalaJS.is.sci_StringOps(x1)) {
      var jsx$1 = true;
      break matchEnd4
    };
    var jsx$1 = false;
    break matchEnd4
  };
  if (jsx$1) {
    if ((x$1 === null)) {
      var StringOps$1 = null
    } else {
      var StringOps$1 = ScalaJS.as.sci_StringOps(x$1).repr__T()
    };
    return ScalaJS.anyRefEqEq($$this, StringOps$1)
  } else {
    return false
  }
});
/*<skip>*/;
ScalaJS.is.sci_StringOps$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_StringOps$)))
});
ScalaJS.as.sci_StringOps$ = (function(obj) {
  if ((ScalaJS.is.sci_StringOps$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.immutable.StringOps$")
  }
});
ScalaJS.isArrayOf.sci_StringOps$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_StringOps$)))
});
ScalaJS.asArrayOf.sci_StringOps$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sci_StringOps$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.StringOps$;", depth)
  }
});
ScalaJS.d.sci_StringOps$ = new ScalaJS.ClassTypeData({
  sci_StringOps$: 0
}, false, "scala.collection.immutable.StringOps$", ScalaJS.d.O, {
  sci_StringOps$: 1,
  O: 1
});
ScalaJS.c.sci_StringOps$.prototype.$classData = ScalaJS.d.sci_StringOps$;
ScalaJS.n.sci_StringOps = undefined;
ScalaJS.m.sci_StringOps = (function() {
  if ((!ScalaJS.n.sci_StringOps)) {
    ScalaJS.n.sci_StringOps = new ScalaJS.c.sci_StringOps$().init___()
  };
  return ScalaJS.n.sci_StringOps
});
/*<skip>*/;
ScalaJS.is.scm_LinkedListLike = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_LinkedListLike)))
});
ScalaJS.as.scm_LinkedListLike = (function(obj) {
  if ((ScalaJS.is.scm_LinkedListLike(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.mutable.LinkedListLike")
  }
});
ScalaJS.isArrayOf.scm_LinkedListLike = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_LinkedListLike)))
});
ScalaJS.asArrayOf.scm_LinkedListLike = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scm_LinkedListLike(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.LinkedListLike;", depth)
  }
});
ScalaJS.d.scm_LinkedListLike = new ScalaJS.ClassTypeData({
  scm_LinkedListLike: 0
}, true, "scala.collection.mutable.LinkedListLike", undefined, {
  scm_LinkedListLike: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  sc_SeqLike: 1,
  sc_GenSeqLike: 1,
  sc_IterableLike: 1,
  sc_GenIterableLike: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.is.scm_Seq = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_Seq)))
});
ScalaJS.as.scm_Seq = (function(obj) {
  if ((ScalaJS.is.scm_Seq(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.mutable.Seq")
  }
});
ScalaJS.isArrayOf.scm_Seq = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_Seq)))
});
ScalaJS.asArrayOf.scm_Seq = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scm_Seq(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.Seq;", depth)
  }
});
ScalaJS.d.scm_Seq = new ScalaJS.ClassTypeData({
  scm_Seq: 0
}, true, "scala.collection.mutable.Seq", undefined, {
  scm_Seq: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  scm_Iterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
/** @constructor */
ScalaJS.c.scm_StringBuilder$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.scm_StringBuilder$.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_StringBuilder$.prototype.constructor = ScalaJS.c.scm_StringBuilder$;
/** @constructor */
ScalaJS.h.scm_StringBuilder$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_StringBuilder$.prototype = ScalaJS.c.scm_StringBuilder$.prototype;
/*<skip>*/;
ScalaJS.is.scm_StringBuilder$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_StringBuilder$)))
});
ScalaJS.as.scm_StringBuilder$ = (function(obj) {
  if ((ScalaJS.is.scm_StringBuilder$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.mutable.StringBuilder$")
  }
});
ScalaJS.isArrayOf.scm_StringBuilder$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_StringBuilder$)))
});
ScalaJS.asArrayOf.scm_StringBuilder$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scm_StringBuilder$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.StringBuilder$;", depth)
  }
});
ScalaJS.d.scm_StringBuilder$ = new ScalaJS.ClassTypeData({
  scm_StringBuilder$: 0
}, false, "scala.collection.mutable.StringBuilder$", ScalaJS.d.O, {
  scm_StringBuilder$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.scm_StringBuilder$.prototype.$classData = ScalaJS.d.scm_StringBuilder$;
ScalaJS.n.scm_StringBuilder = undefined;
ScalaJS.m.scm_StringBuilder = (function() {
  if ((!ScalaJS.n.scm_StringBuilder)) {
    ScalaJS.n.scm_StringBuilder = new ScalaJS.c.scm_StringBuilder$().init___()
  };
  return ScalaJS.n.scm_StringBuilder
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.scm_WrappedArray$ = (function() {
  ScalaJS.c.O.call(this);
  this.EmptyWrappedArray$1 = null
});
ScalaJS.c.scm_WrappedArray$.prototype = new ScalaJS.h.O();
ScalaJS.c.scm_WrappedArray$.prototype.constructor = ScalaJS.c.scm_WrappedArray$;
/** @constructor */
ScalaJS.h.scm_WrappedArray$ = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_WrappedArray$.prototype = ScalaJS.c.scm_WrappedArray$.prototype;
ScalaJS.c.scm_WrappedArray$.prototype.EmptyWrappedArray__p1__scm_WrappedArray$ofRef = (function() {
  return this.EmptyWrappedArray$1
});
ScalaJS.c.scm_WrappedArray$.prototype.empty__scm_WrappedArray = (function() {
  return this.EmptyWrappedArray__p1__scm_WrappedArray$ofRef()
});
ScalaJS.c.scm_WrappedArray$.prototype.make__O__scm_WrappedArray = (function(x) {
  var x1 = x;
  if ((null === x1)) {
    return null
  };
  if (ScalaJS.isArrayOf.O(x1, 1)) {
    var x3 = ScalaJS.asArrayOf.O(x1, 1);
    return new ScalaJS.c.scm_WrappedArray$ofRef().init___AO(x3)
  };
  if (ScalaJS.isArrayOf.I(x1, 1)) {
    var x4 = ScalaJS.asArrayOf.I(x1, 1);
    return new ScalaJS.c.scm_WrappedArray$ofInt().init___AI(x4)
  };
  if (ScalaJS.isArrayOf.D(x1, 1)) {
    var x5 = ScalaJS.asArrayOf.D(x1, 1);
    return new ScalaJS.c.scm_WrappedArray$ofDouble().init___AD(x5)
  };
  if (ScalaJS.isArrayOf.J(x1, 1)) {
    var x6 = ScalaJS.asArrayOf.J(x1, 1);
    return new ScalaJS.c.scm_WrappedArray$ofLong().init___AJ(x6)
  };
  if (ScalaJS.isArrayOf.F(x1, 1)) {
    var x7 = ScalaJS.asArrayOf.F(x1, 1);
    return new ScalaJS.c.scm_WrappedArray$ofFloat().init___AF(x7)
  };
  if (ScalaJS.isArrayOf.C(x1, 1)) {
    var x8 = ScalaJS.asArrayOf.C(x1, 1);
    return new ScalaJS.c.scm_WrappedArray$ofChar().init___AC(x8)
  };
  if (ScalaJS.isArrayOf.B(x1, 1)) {
    var x9 = ScalaJS.asArrayOf.B(x1, 1);
    return new ScalaJS.c.scm_WrappedArray$ofByte().init___AB(x9)
  };
  if (ScalaJS.isArrayOf.S(x1, 1)) {
    var x10 = ScalaJS.asArrayOf.S(x1, 1);
    return new ScalaJS.c.scm_WrappedArray$ofShort().init___AS(x10)
  };
  if (ScalaJS.isArrayOf.Z(x1, 1)) {
    var x11 = ScalaJS.asArrayOf.Z(x1, 1);
    return new ScalaJS.c.scm_WrappedArray$ofBoolean().init___AZ(x11)
  };
  if (ScalaJS.isArrayOf.sr_BoxedUnit(x1, 1)) {
    var x12 = ScalaJS.asArrayOf.sr_BoxedUnit(x1, 1);
    return new ScalaJS.c.scm_WrappedArray$ofUnit().init___Asr_BoxedUnit(x12)
  };
  throw new ScalaJS.c.s_MatchError().init___O(x1)
});
ScalaJS.c.scm_WrappedArray$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.scm_WrappedArray = this;
  this.EmptyWrappedArray$1 = new ScalaJS.c.scm_WrappedArray$ofRef().init___AO(ScalaJS.newArrayObject(ScalaJS.d.O.getArrayOf(), [0]));
  return this
});
/*<skip>*/;
ScalaJS.is.scm_WrappedArray$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_WrappedArray$)))
});
ScalaJS.as.scm_WrappedArray$ = (function(obj) {
  if ((ScalaJS.is.scm_WrappedArray$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.mutable.WrappedArray$")
  }
});
ScalaJS.isArrayOf.scm_WrappedArray$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_WrappedArray$)))
});
ScalaJS.asArrayOf.scm_WrappedArray$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scm_WrappedArray$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.WrappedArray$;", depth)
  }
});
ScalaJS.d.scm_WrappedArray$ = new ScalaJS.ClassTypeData({
  scm_WrappedArray$: 0
}, false, "scala.collection.mutable.WrappedArray$", ScalaJS.d.O, {
  scm_WrappedArray$: 1,
  O: 1
});
ScalaJS.c.scm_WrappedArray$.prototype.$classData = ScalaJS.d.scm_WrappedArray$;
ScalaJS.n.scm_WrappedArray = undefined;
ScalaJS.m.scm_WrappedArray = (function() {
  if ((!ScalaJS.n.scm_WrappedArray)) {
    ScalaJS.n.scm_WrappedArray = new ScalaJS.c.scm_WrappedArray$().init___()
  };
  return ScalaJS.n.scm_WrappedArray
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sjs_concurrent_JSExecutionContext$ = (function() {
  ScalaJS.c.O.call(this);
  this.runNow$1 = null;
  this.queue$1 = null
});
ScalaJS.c.sjs_concurrent_JSExecutionContext$.prototype = new ScalaJS.h.O();
ScalaJS.c.sjs_concurrent_JSExecutionContext$.prototype.constructor = ScalaJS.c.sjs_concurrent_JSExecutionContext$;
/** @constructor */
ScalaJS.h.sjs_concurrent_JSExecutionContext$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sjs_concurrent_JSExecutionContext$.prototype = ScalaJS.c.sjs_concurrent_JSExecutionContext$.prototype;
ScalaJS.c.sjs_concurrent_JSExecutionContext$.prototype.runNow__sjs_concurrent_RunNowExecutionContext$ = (function() {
  return this.runNow$1
});
ScalaJS.c.sjs_concurrent_JSExecutionContext$.prototype.queue__sjs_concurrent_QueueExecutionContext$ = (function() {
  return this.queue$1
});
ScalaJS.c.sjs_concurrent_JSExecutionContext$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.sjs_concurrent_JSExecutionContext = this;
  this.runNow$1 = ScalaJS.m.sjs_concurrent_RunNowExecutionContext();
  this.queue$1 = ScalaJS.m.sjs_concurrent_QueueExecutionContext();
  return this
});
/*<skip>*/;
ScalaJS.is.sjs_concurrent_JSExecutionContext$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sjs_concurrent_JSExecutionContext$)))
});
ScalaJS.as.sjs_concurrent_JSExecutionContext$ = (function(obj) {
  if ((ScalaJS.is.sjs_concurrent_JSExecutionContext$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.scalajs.concurrent.JSExecutionContext$")
  }
});
ScalaJS.isArrayOf.sjs_concurrent_JSExecutionContext$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sjs_concurrent_JSExecutionContext$)))
});
ScalaJS.asArrayOf.sjs_concurrent_JSExecutionContext$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sjs_concurrent_JSExecutionContext$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.scalajs.concurrent.JSExecutionContext$;", depth)
  }
});
ScalaJS.d.sjs_concurrent_JSExecutionContext$ = new ScalaJS.ClassTypeData({
  sjs_concurrent_JSExecutionContext$: 0
}, false, "scala.scalajs.concurrent.JSExecutionContext$", ScalaJS.d.O, {
  sjs_concurrent_JSExecutionContext$: 1,
  O: 1
});
ScalaJS.c.sjs_concurrent_JSExecutionContext$.prototype.$classData = ScalaJS.d.sjs_concurrent_JSExecutionContext$;
ScalaJS.n.sjs_concurrent_JSExecutionContext = undefined;
ScalaJS.m.sjs_concurrent_JSExecutionContext = (function() {
  if ((!ScalaJS.n.sjs_concurrent_JSExecutionContext)) {
    ScalaJS.n.sjs_concurrent_JSExecutionContext = new ScalaJS.c.sjs_concurrent_JSExecutionContext$().init___()
  };
  return ScalaJS.n.sjs_concurrent_JSExecutionContext
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sjs_concurrent_JSExecutionContext$Implicits$ = (function() {
  ScalaJS.c.O.call(this);
  this.runNow$1 = null;
  this.queue$1 = null
});
ScalaJS.c.sjs_concurrent_JSExecutionContext$Implicits$.prototype = new ScalaJS.h.O();
ScalaJS.c.sjs_concurrent_JSExecutionContext$Implicits$.prototype.constructor = ScalaJS.c.sjs_concurrent_JSExecutionContext$Implicits$;
/** @constructor */
ScalaJS.h.sjs_concurrent_JSExecutionContext$Implicits$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sjs_concurrent_JSExecutionContext$Implicits$.prototype = ScalaJS.c.sjs_concurrent_JSExecutionContext$Implicits$.prototype;
ScalaJS.c.sjs_concurrent_JSExecutionContext$Implicits$.prototype.queue__s_concurrent_ExecutionContext = (function() {
  return this.queue$1
});
ScalaJS.c.sjs_concurrent_JSExecutionContext$Implicits$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.sjs_concurrent_JSExecutionContext$Implicits = this;
  this.runNow$1 = ScalaJS.m.sjs_concurrent_JSExecutionContext().runNow__sjs_concurrent_RunNowExecutionContext$();
  this.queue$1 = ScalaJS.m.sjs_concurrent_JSExecutionContext().queue__sjs_concurrent_QueueExecutionContext$();
  return this
});
/*<skip>*/;
ScalaJS.is.sjs_concurrent_JSExecutionContext$Implicits$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sjs_concurrent_JSExecutionContext$Implicits$)))
});
ScalaJS.as.sjs_concurrent_JSExecutionContext$Implicits$ = (function(obj) {
  if ((ScalaJS.is.sjs_concurrent_JSExecutionContext$Implicits$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.scalajs.concurrent.JSExecutionContext$Implicits$")
  }
});
ScalaJS.isArrayOf.sjs_concurrent_JSExecutionContext$Implicits$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sjs_concurrent_JSExecutionContext$Implicits$)))
});
ScalaJS.asArrayOf.sjs_concurrent_JSExecutionContext$Implicits$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sjs_concurrent_JSExecutionContext$Implicits$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.scalajs.concurrent.JSExecutionContext$Implicits$;", depth)
  }
});
ScalaJS.d.sjs_concurrent_JSExecutionContext$Implicits$ = new ScalaJS.ClassTypeData({
  sjs_concurrent_JSExecutionContext$Implicits$: 0
}, false, "scala.scalajs.concurrent.JSExecutionContext$Implicits$", ScalaJS.d.O, {
  sjs_concurrent_JSExecutionContext$Implicits$: 1,
  O: 1
});
ScalaJS.c.sjs_concurrent_JSExecutionContext$Implicits$.prototype.$classData = ScalaJS.d.sjs_concurrent_JSExecutionContext$Implicits$;
ScalaJS.n.sjs_concurrent_JSExecutionContext$Implicits = undefined;
ScalaJS.m.sjs_concurrent_JSExecutionContext$Implicits = (function() {
  if ((!ScalaJS.n.sjs_concurrent_JSExecutionContext$Implicits)) {
    ScalaJS.n.sjs_concurrent_JSExecutionContext$Implicits = new ScalaJS.c.sjs_concurrent_JSExecutionContext$Implicits$().init___()
  };
  return ScalaJS.n.sjs_concurrent_JSExecutionContext$Implicits
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sjs_concurrent_QueueExecutionContext$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sjs_concurrent_QueueExecutionContext$.prototype = new ScalaJS.h.O();
ScalaJS.c.sjs_concurrent_QueueExecutionContext$.prototype.constructor = ScalaJS.c.sjs_concurrent_QueueExecutionContext$;
/** @constructor */
ScalaJS.h.sjs_concurrent_QueueExecutionContext$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sjs_concurrent_QueueExecutionContext$.prototype = ScalaJS.c.sjs_concurrent_QueueExecutionContext$.prototype;
ScalaJS.c.sjs_concurrent_QueueExecutionContext$.prototype.prepare__s_concurrent_ExecutionContext = (function() {
  return ScalaJS.i.s_concurrent_ExecutionContext$class__prepare__s_concurrent_ExecutionContext__s_concurrent_ExecutionContext(this)
});
ScalaJS.c.sjs_concurrent_QueueExecutionContext$.prototype.execute__jl_Runnable__V = (function(runnable) {
  var lambda = (function() {
    this.$$anonfun$1__p1__jl_Runnable__V(runnable)
  })["bind"](this);
  ScalaJS.g["setTimeout"](lambda, 0)
});
ScalaJS.c.sjs_concurrent_QueueExecutionContext$.prototype.reportFailure__jl_Throwable__V = (function(t) {
  ScalaJS.m.s_Console().err__Ljava_io_PrintStream().println__T__V(("Failure in async execution: " + t))
});
ScalaJS.c.sjs_concurrent_QueueExecutionContext$.prototype.$$anonfun$1__p1__jl_Runnable__V = (function(runnable$1) {
  try {
    runnable$1.run__V()
  } catch (ex) {
    ex = ScalaJS.wrapJavaScriptException(ex);
    if (ScalaJS.is.jl_Throwable(ex)) {
      var t = ex;
      this.reportFailure__jl_Throwable__V(t)
    } else {
      throw ScalaJS.unwrapJavaScriptException(ex)
    }
  }
});
ScalaJS.c.sjs_concurrent_QueueExecutionContext$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.sjs_concurrent_QueueExecutionContext = this;
  ScalaJS.i.s_concurrent_ExecutionContext$class__$init$__s_concurrent_ExecutionContext__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.sjs_concurrent_QueueExecutionContext$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sjs_concurrent_QueueExecutionContext$)))
});
ScalaJS.as.sjs_concurrent_QueueExecutionContext$ = (function(obj) {
  if ((ScalaJS.is.sjs_concurrent_QueueExecutionContext$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.scalajs.concurrent.QueueExecutionContext$")
  }
});
ScalaJS.isArrayOf.sjs_concurrent_QueueExecutionContext$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sjs_concurrent_QueueExecutionContext$)))
});
ScalaJS.asArrayOf.sjs_concurrent_QueueExecutionContext$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sjs_concurrent_QueueExecutionContext$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.scalajs.concurrent.QueueExecutionContext$;", depth)
  }
});
ScalaJS.d.sjs_concurrent_QueueExecutionContext$ = new ScalaJS.ClassTypeData({
  sjs_concurrent_QueueExecutionContext$: 0
}, false, "scala.scalajs.concurrent.QueueExecutionContext$", ScalaJS.d.O, {
  sjs_concurrent_QueueExecutionContext$: 1,
  s_concurrent_ExecutionContext: 1,
  O: 1
});
ScalaJS.c.sjs_concurrent_QueueExecutionContext$.prototype.$classData = ScalaJS.d.sjs_concurrent_QueueExecutionContext$;
ScalaJS.n.sjs_concurrent_QueueExecutionContext = undefined;
ScalaJS.m.sjs_concurrent_QueueExecutionContext = (function() {
  if ((!ScalaJS.n.sjs_concurrent_QueueExecutionContext)) {
    ScalaJS.n.sjs_concurrent_QueueExecutionContext = new ScalaJS.c.sjs_concurrent_QueueExecutionContext$().init___()
  };
  return ScalaJS.n.sjs_concurrent_QueueExecutionContext
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sjs_concurrent_RunNowExecutionContext$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sjs_concurrent_RunNowExecutionContext$.prototype = new ScalaJS.h.O();
ScalaJS.c.sjs_concurrent_RunNowExecutionContext$.prototype.constructor = ScalaJS.c.sjs_concurrent_RunNowExecutionContext$;
/** @constructor */
ScalaJS.h.sjs_concurrent_RunNowExecutionContext$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sjs_concurrent_RunNowExecutionContext$.prototype = ScalaJS.c.sjs_concurrent_RunNowExecutionContext$.prototype;
ScalaJS.c.sjs_concurrent_RunNowExecutionContext$.prototype.prepare__s_concurrent_ExecutionContext = (function() {
  return ScalaJS.i.s_concurrent_ExecutionContext$class__prepare__s_concurrent_ExecutionContext__s_concurrent_ExecutionContext(this)
});
ScalaJS.c.sjs_concurrent_RunNowExecutionContext$.prototype.execute__jl_Runnable__V = (function(runnable) {
  try {
    runnable.run__V()
  } catch (ex) {
    ex = ScalaJS.wrapJavaScriptException(ex);
    if (ScalaJS.is.jl_Throwable(ex)) {
      var t = ex;
      this.reportFailure__jl_Throwable__V(t)
    } else {
      throw ScalaJS.unwrapJavaScriptException(ex)
    }
  }
});
ScalaJS.c.sjs_concurrent_RunNowExecutionContext$.prototype.reportFailure__jl_Throwable__V = (function(t) {
  ScalaJS.m.s_Console().err__Ljava_io_PrintStream().println__T__V(("Failure in async execution: " + t))
});
ScalaJS.c.sjs_concurrent_RunNowExecutionContext$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.sjs_concurrent_RunNowExecutionContext = this;
  ScalaJS.i.s_concurrent_ExecutionContext$class__$init$__s_concurrent_ExecutionContext__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.sjs_concurrent_RunNowExecutionContext$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sjs_concurrent_RunNowExecutionContext$)))
});
ScalaJS.as.sjs_concurrent_RunNowExecutionContext$ = (function(obj) {
  if ((ScalaJS.is.sjs_concurrent_RunNowExecutionContext$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.scalajs.concurrent.RunNowExecutionContext$")
  }
});
ScalaJS.isArrayOf.sjs_concurrent_RunNowExecutionContext$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sjs_concurrent_RunNowExecutionContext$)))
});
ScalaJS.asArrayOf.sjs_concurrent_RunNowExecutionContext$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sjs_concurrent_RunNowExecutionContext$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.scalajs.concurrent.RunNowExecutionContext$;", depth)
  }
});
ScalaJS.d.sjs_concurrent_RunNowExecutionContext$ = new ScalaJS.ClassTypeData({
  sjs_concurrent_RunNowExecutionContext$: 0
}, false, "scala.scalajs.concurrent.RunNowExecutionContext$", ScalaJS.d.O, {
  sjs_concurrent_RunNowExecutionContext$: 1,
  s_concurrent_ExecutionContext: 1,
  O: 1
});
ScalaJS.c.sjs_concurrent_RunNowExecutionContext$.prototype.$classData = ScalaJS.d.sjs_concurrent_RunNowExecutionContext$;
ScalaJS.n.sjs_concurrent_RunNowExecutionContext = undefined;
ScalaJS.m.sjs_concurrent_RunNowExecutionContext = (function() {
  if ((!ScalaJS.n.sjs_concurrent_RunNowExecutionContext)) {
    ScalaJS.n.sjs_concurrent_RunNowExecutionContext = new ScalaJS.c.sjs_concurrent_RunNowExecutionContext$().init___()
  };
  return ScalaJS.n.sjs_concurrent_RunNowExecutionContext
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sjs_js_Any$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sjs_js_Any$.prototype = new ScalaJS.h.O();
ScalaJS.c.sjs_js_Any$.prototype.constructor = ScalaJS.c.sjs_js_Any$;
/** @constructor */
ScalaJS.h.sjs_js_Any$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sjs_js_Any$.prototype = ScalaJS.c.sjs_js_Any$.prototype;
ScalaJS.c.sjs_js_Any$.prototype.fromTraversableOnce__sc_TraversableOnce__sjs_js_Array = (function(col) {
  var result = new ScalaJS.g["Array"]();
  col.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(x$2) {
    var x = ScalaJS.as.O(x$2);
    return this.$$anonfun$1__p1__O__sjs_js_Array__I(x, result)
  })["bind"](this)));
  return result
});
ScalaJS.c.sjs_js_Any$.prototype.$$anonfun$1__p1__O__sjs_js_Array__I = (function(x, result$1) {
  return ScalaJS.uI(result$1["push"](x))
});
ScalaJS.c.sjs_js_Any$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.sjs_js_Any = this;
  ScalaJS.i.sjs_js_LowPrioAnyImplicits$class__$init$__sjs_js_LowPrioAnyImplicits__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.sjs_js_Any$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sjs_js_Any$)))
});
ScalaJS.as.sjs_js_Any$ = (function(obj) {
  if ((ScalaJS.is.sjs_js_Any$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.scalajs.js.Any$")
  }
});
ScalaJS.isArrayOf.sjs_js_Any$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sjs_js_Any$)))
});
ScalaJS.asArrayOf.sjs_js_Any$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sjs_js_Any$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.scalajs.js.Any$;", depth)
  }
});
ScalaJS.d.sjs_js_Any$ = new ScalaJS.ClassTypeData({
  sjs_js_Any$: 0
}, false, "scala.scalajs.js.Any$", ScalaJS.d.O, {
  sjs_js_Any$: 1,
  sjs_js_LowPrioAnyImplicits: 1,
  O: 1
});
ScalaJS.c.sjs_js_Any$.prototype.$classData = ScalaJS.d.sjs_js_Any$;
ScalaJS.n.sjs_js_Any = undefined;
ScalaJS.m.sjs_js_Any = (function() {
  if ((!ScalaJS.n.sjs_js_Any)) {
    ScalaJS.n.sjs_js_Any = new ScalaJS.c.sjs_js_Any$().init___()
  };
  return ScalaJS.n.sjs_js_Any
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sjs_js_UndefOr$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sjs_js_UndefOr$.prototype = new ScalaJS.h.O();
ScalaJS.c.sjs_js_UndefOr$.prototype.constructor = ScalaJS.c.sjs_js_UndefOr$;
/** @constructor */
ScalaJS.h.sjs_js_UndefOr$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sjs_js_UndefOr$.prototype = ScalaJS.c.sjs_js_UndefOr$.prototype;
ScalaJS.c.sjs_js_UndefOr$.prototype.undefOr2ops__sjs_js_UndefOr__sjs_js_UndefOr = (function(value) {
  return value
});
/*<skip>*/;
ScalaJS.is.sjs_js_UndefOr$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sjs_js_UndefOr$)))
});
ScalaJS.as.sjs_js_UndefOr$ = (function(obj) {
  if ((ScalaJS.is.sjs_js_UndefOr$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.scalajs.js.UndefOr$")
  }
});
ScalaJS.isArrayOf.sjs_js_UndefOr$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sjs_js_UndefOr$)))
});
ScalaJS.asArrayOf.sjs_js_UndefOr$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sjs_js_UndefOr$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.scalajs.js.UndefOr$;", depth)
  }
});
ScalaJS.d.sjs_js_UndefOr$ = new ScalaJS.ClassTypeData({
  sjs_js_UndefOr$: 0
}, false, "scala.scalajs.js.UndefOr$", ScalaJS.d.O, {
  sjs_js_UndefOr$: 1,
  O: 1
});
ScalaJS.c.sjs_js_UndefOr$.prototype.$classData = ScalaJS.d.sjs_js_UndefOr$;
ScalaJS.n.sjs_js_UndefOr = undefined;
ScalaJS.m.sjs_js_UndefOr = (function() {
  if ((!ScalaJS.n.sjs_js_UndefOr)) {
    ScalaJS.n.sjs_js_UndefOr = new ScalaJS.c.sjs_js_UndefOr$().init___()
  };
  return ScalaJS.n.sjs_js_UndefOr
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sjs_js_UndefOrOps$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sjs_js_UndefOrOps$.prototype = new ScalaJS.h.O();
ScalaJS.c.sjs_js_UndefOrOps$.prototype.constructor = ScalaJS.c.sjs_js_UndefOrOps$;
/** @constructor */
ScalaJS.h.sjs_js_UndefOrOps$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sjs_js_UndefOrOps$.prototype = ScalaJS.c.sjs_js_UndefOrOps$.prototype;
ScalaJS.c.sjs_js_UndefOrOps$.prototype.isEmpty$extension__sjs_js_UndefOr__Z = (function($$this) {
  return ($$this === undefined)
});
ScalaJS.c.sjs_js_UndefOrOps$.prototype.get$extension__sjs_js_UndefOr__O = (function($$this) {
  if (this.isEmpty$extension__sjs_js_UndefOr__Z($$this)) {
    throw new ScalaJS.c.ju_NoSuchElementException().init___T("undefined.get")
  } else {
    return $$this
  }
});
/*<skip>*/;
ScalaJS.is.sjs_js_UndefOrOps$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sjs_js_UndefOrOps$)))
});
ScalaJS.as.sjs_js_UndefOrOps$ = (function(obj) {
  if ((ScalaJS.is.sjs_js_UndefOrOps$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.scalajs.js.UndefOrOps$")
  }
});
ScalaJS.isArrayOf.sjs_js_UndefOrOps$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sjs_js_UndefOrOps$)))
});
ScalaJS.asArrayOf.sjs_js_UndefOrOps$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sjs_js_UndefOrOps$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.scalajs.js.UndefOrOps$;", depth)
  }
});
ScalaJS.d.sjs_js_UndefOrOps$ = new ScalaJS.ClassTypeData({
  sjs_js_UndefOrOps$: 0
}, false, "scala.scalajs.js.UndefOrOps$", ScalaJS.d.O, {
  sjs_js_UndefOrOps$: 1,
  O: 1
});
ScalaJS.c.sjs_js_UndefOrOps$.prototype.$classData = ScalaJS.d.sjs_js_UndefOrOps$;
ScalaJS.n.sjs_js_UndefOrOps = undefined;
ScalaJS.m.sjs_js_UndefOrOps = (function() {
  if ((!ScalaJS.n.sjs_js_UndefOrOps)) {
    ScalaJS.n.sjs_js_UndefOrOps = new ScalaJS.c.sjs_js_UndefOrOps$().init___()
  };
  return ScalaJS.n.sjs_js_UndefOrOps
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sjsr_RuntimeLong$ = (function() {
  ScalaJS.c.O.call(this);
  this.BITS$1 = 0;
  this.BITS01$1 = 0;
  this.BITS2$1 = 0;
  this.MASK$1 = 0;
  this.MASK$und2$1 = 0;
  this.SIGN$undBIT$1 = 0;
  this.SIGN$undBIT$undVALUE$1 = 0;
  this.TWO$undPWR$und15$undDBL$1 = 0.0;
  this.TWO$undPWR$und16$undDBL$1 = 0.0;
  this.TWO$undPWR$und22$undDBL$1 = 0.0;
  this.TWO$undPWR$und31$undDBL$1 = 0.0;
  this.TWO$undPWR$und32$undDBL$1 = 0.0;
  this.TWO$undPWR$und44$undDBL$1 = 0.0;
  this.TWO$undPWR$und63$undDBL$1 = 0.0;
  this.zero$1 = null;
  this.one$1 = null;
  this.MinValue$1 = null;
  this.MaxValue$1 = null
});
ScalaJS.c.sjsr_RuntimeLong$.prototype = new ScalaJS.h.O();
ScalaJS.c.sjsr_RuntimeLong$.prototype.constructor = ScalaJS.c.sjsr_RuntimeLong$;
/** @constructor */
ScalaJS.h.sjsr_RuntimeLong$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sjsr_RuntimeLong$.prototype = ScalaJS.c.sjsr_RuntimeLong$.prototype;
ScalaJS.c.sjsr_RuntimeLong$.prototype.zero__sjsr_RuntimeLong = (function() {
  return this.zero$1
});
ScalaJS.c.sjsr_RuntimeLong$.prototype.one__sjsr_RuntimeLong = (function() {
  return this.one$1
});
ScalaJS.c.sjsr_RuntimeLong$.prototype.fromChar__C__sjsr_RuntimeLong = (function(value) {
  return this.fromInt__I__sjsr_RuntimeLong(value)
});
ScalaJS.c.sjsr_RuntimeLong$.prototype.fromInt__I__sjsr_RuntimeLong = (function(value) {
  var a0 = (value & 4194303);
  var a1 = ((value >> 22) & 4194303);
  if ((value < 0)) {
    var a2 = 1048575
  } else {
    var a2 = 0
  };
  return ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong(a0, a1, a2)
});
ScalaJS.c.sjsr_RuntimeLong$.prototype.fromDouble__D__sjsr_RuntimeLong = (function(value) {
  if (ScalaJS.m.jl_Double().isNaN__D__Z(value)) {
    return this.zero__sjsr_RuntimeLong()
  } else {
    if ((value < (-9.223372036854776E18))) {
      return this.MinValue__sjsr_RuntimeLong()
    } else {
      if ((value >= 9.223372036854776E18)) {
        return this.MaxValue__sjsr_RuntimeLong()
      } else {
        if ((value < 0)) {
          return this.fromDouble__D__sjsr_RuntimeLong((-value)).unary$und$minus__sjsr_RuntimeLong()
        } else {
          var acc = value;
          if ((acc >= 1.7592186044416E13)) {
            var a2 = ((acc / 1.7592186044416E13) | 0)
          } else {
            var a2 = 0
          };
          acc = (acc - (a2 * 1.7592186044416E13));
          if ((acc >= 4194304.0)) {
            var a1 = ((acc / 4194304.0) | 0)
          } else {
            var a1 = 0
          };
          acc = (acc - (a1 * 4194304.0));
          var a0 = (acc | 0);
          return ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong(a0, a1, a2)
        }
      }
    }
  }
});
ScalaJS.c.sjsr_RuntimeLong$.prototype.masked__I__I__I__sjsr_RuntimeLong = (function(l, m, h) {
  return ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong((l & 4194303), (m & 4194303), (h & 1048575))
});
ScalaJS.c.sjsr_RuntimeLong$.prototype.apply__I__I__I__sjsr_RuntimeLong = (function(l, m, h) {
  return new ScalaJS.c.sjsr_RuntimeLong().init___I__I__I(l, m, h)
});
ScalaJS.c.sjsr_RuntimeLong$.prototype.scala$scalajs$runtime$RuntimeLong$$divModHelper__sjsr_RuntimeLong__sjsr_RuntimeLong__Z__Z__Z__sjs_js_Array = (function(x, y, xNegative, yNegative, xMinValue) {
  var shift = ((y.numberOfLeadingZeros__I() - x.numberOfLeadingZeros__I()) | 0);
  var yShift = y.$$less$less__I__sjsr_RuntimeLong(shift);
  var absQuotRem = this.divide0$1__p1__I__sjsr_RuntimeLong__sjsr_RuntimeLong__sjsr_RuntimeLong__sjs_js_Array(shift, yShift, x, this.zero__sjsr_RuntimeLong());
  var absQuot = ScalaJS.as.sjsr_RuntimeLong(ScalaJS.as.O(absQuotRem[0]));
  var absRem = ScalaJS.as.sjsr_RuntimeLong(ScalaJS.as.O(absQuotRem[1]));
  if ((!(!(xNegative ^ yNegative)))) {
    var quot = absQuot.unary$und$minus__sjsr_RuntimeLong()
  } else {
    var quot = absQuot
  };
  if ((xNegative && xMinValue)) {
    var rem = absRem.unary$und$minus__sjsr_RuntimeLong().$$minus__sjsr_RuntimeLong__sjsr_RuntimeLong(this.one__sjsr_RuntimeLong())
  } else {
    if (xNegative) {
      var rem = absRem.unary$und$minus__sjsr_RuntimeLong()
    } else {
      var rem = absRem
    }
  };
  return [quot, rem]
});
ScalaJS.c.sjsr_RuntimeLong$.prototype.MinValue__sjsr_RuntimeLong = (function() {
  return this.MinValue$1
});
ScalaJS.c.sjsr_RuntimeLong$.prototype.MaxValue__sjsr_RuntimeLong = (function() {
  return this.MaxValue$1
});
ScalaJS.c.sjsr_RuntimeLong$.prototype.divide0$1__p1__I__sjsr_RuntimeLong__sjsr_RuntimeLong__sjsr_RuntimeLong__sjs_js_Array = (function(shift, yShift, curX, quot) {
  var _$this = this;
  tailCallLoop: while (true) {
    if (((shift < 0) || curX.scala$scalajs$runtime$RuntimeLong$$isZero__Z())) {
      return [quot, curX]
    } else {
      var newX = curX.$$minus__sjsr_RuntimeLong__sjsr_RuntimeLong(yShift);
      if ((!newX.scala$scalajs$runtime$RuntimeLong$$isNegative__Z())) {
        var temp$shift = ((shift - 1) | 0);
        var temp$yShift = yShift.$$greater$greater__I__sjsr_RuntimeLong(1);
        var temp$curX = newX;
        var temp$quot = quot.scala$scalajs$runtime$RuntimeLong$$setBit__I__sjsr_RuntimeLong(shift);
        shift = temp$shift;
        yShift = temp$yShift;
        curX = temp$curX;
        quot = temp$quot;
        continue tailCallLoop
      } else {
        var temp$shift$2 = ((shift - 1) | 0);
        var temp$yShift$2 = yShift.$$greater$greater__I__sjsr_RuntimeLong(1);
        shift = temp$shift$2;
        yShift = temp$yShift$2;
        continue tailCallLoop
      }
    }
  }
});
ScalaJS.c.sjsr_RuntimeLong$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.sjsr_RuntimeLong = this;
  this.zero$1 = ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong(0, 0, 0);
  this.one$1 = ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong(1, 0, 0);
  this.MinValue$1 = ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong(0, 0, 524288);
  this.MaxValue$1 = ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong(4194303, 4194303, 524287);
  return this
});
/*<skip>*/;
ScalaJS.is.sjsr_RuntimeLong$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sjsr_RuntimeLong$)))
});
ScalaJS.as.sjsr_RuntimeLong$ = (function(obj) {
  if ((ScalaJS.is.sjsr_RuntimeLong$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.scalajs.runtime.RuntimeLong$")
  }
});
ScalaJS.isArrayOf.sjsr_RuntimeLong$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sjsr_RuntimeLong$)))
});
ScalaJS.asArrayOf.sjsr_RuntimeLong$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sjsr_RuntimeLong$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.scalajs.runtime.RuntimeLong$;", depth)
  }
});
ScalaJS.d.sjsr_RuntimeLong$ = new ScalaJS.ClassTypeData({
  sjsr_RuntimeLong$: 0
}, false, "scala.scalajs.runtime.RuntimeLong$", ScalaJS.d.O, {
  sjsr_RuntimeLong$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.sjsr_RuntimeLong$.prototype.$classData = ScalaJS.d.sjsr_RuntimeLong$;
ScalaJS.n.sjsr_RuntimeLong = undefined;
ScalaJS.m.sjsr_RuntimeLong = (function() {
  if ((!ScalaJS.n.sjsr_RuntimeLong)) {
    ScalaJS.n.sjsr_RuntimeLong = new ScalaJS.c.sjsr_RuntimeLong$().init___()
  };
  return ScalaJS.n.sjsr_RuntimeLong
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sjsr_RuntimeString$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sjsr_RuntimeString$.prototype = new ScalaJS.h.O();
ScalaJS.c.sjsr_RuntimeString$.prototype.constructor = ScalaJS.c.sjsr_RuntimeString$;
/** @constructor */
ScalaJS.h.sjsr_RuntimeString$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sjsr_RuntimeString$.prototype = ScalaJS.c.sjsr_RuntimeString$.prototype;
ScalaJS.c.sjsr_RuntimeString$.prototype.valueOf__Z__T = (function(value) {
  return value.toString()
});
ScalaJS.c.sjsr_RuntimeString$.prototype.valueOf__I__T = (function(value) {
  return value.toString()
});
ScalaJS.c.sjsr_RuntimeString$.prototype.valueOf__O__T = (function(value) {
  if ((value === null)) {
    return "null"
  } else {
    return ScalaJS.objectToString(value)
  }
});
/*<skip>*/;
ScalaJS.is.sjsr_RuntimeString$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sjsr_RuntimeString$)))
});
ScalaJS.as.sjsr_RuntimeString$ = (function(obj) {
  if ((ScalaJS.is.sjsr_RuntimeString$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.scalajs.runtime.RuntimeString$")
  }
});
ScalaJS.isArrayOf.sjsr_RuntimeString$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sjsr_RuntimeString$)))
});
ScalaJS.asArrayOf.sjsr_RuntimeString$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sjsr_RuntimeString$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.scalajs.runtime.RuntimeString$;", depth)
  }
});
ScalaJS.d.sjsr_RuntimeString$ = new ScalaJS.ClassTypeData({
  sjsr_RuntimeString$: 0
}, false, "scala.scalajs.runtime.RuntimeString$", ScalaJS.d.O, {
  sjsr_RuntimeString$: 1,
  O: 1
});
ScalaJS.c.sjsr_RuntimeString$.prototype.$classData = ScalaJS.d.sjsr_RuntimeString$;
ScalaJS.n.sjsr_RuntimeString = undefined;
ScalaJS.m.sjsr_RuntimeString = (function() {
  if ((!ScalaJS.n.sjsr_RuntimeString)) {
    ScalaJS.n.sjsr_RuntimeString = new ScalaJS.c.sjsr_RuntimeString$().init___()
  };
  return ScalaJS.n.sjsr_RuntimeString
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sjsr_StackTrace$ = (function() {
  ScalaJS.c.O.call(this);
  this.isRhino$1 = false;
  this.decompressedClasses$1 = null;
  this.decompressedPrefixes$1 = null;
  this.compressedPrefixes$1 = null;
  this.bitmap$0$1 = false
});
ScalaJS.c.sjsr_StackTrace$.prototype = new ScalaJS.h.O();
ScalaJS.c.sjsr_StackTrace$.prototype.constructor = ScalaJS.c.sjsr_StackTrace$;
/** @constructor */
ScalaJS.h.sjsr_StackTrace$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sjsr_StackTrace$.prototype = ScalaJS.c.sjsr_StackTrace$.prototype;
ScalaJS.c.sjsr_StackTrace$.prototype.captureState__jl_Throwable__V = (function(throwable) {
  this.captureState__jl_Throwable__sjs_js_Any__V(throwable, this.createException__p1__sjs_js_Any())
});
ScalaJS.c.sjsr_StackTrace$.prototype.createException__p1__sjs_js_Any = (function() {
  try {
    return this["undef"]()
  } catch (ex) {
    ex = ScalaJS.wrapJavaScriptException(ex);
    if (ScalaJS.is.jl_Throwable(ex)) {
      var ex6 = ex;
      var x4 = ex6;
      if (ScalaJS.is.sjs_js_JavaScriptException(x4)) {
        var x5 = ScalaJS.as.sjs_js_JavaScriptException(x4);
        var e = x5.exception__sjs_js_Any();
        return e
      };
      throw ScalaJS.unwrapJavaScriptException(ex6)
    } else {
      throw ScalaJS.unwrapJavaScriptException(ex)
    }
  }
});
ScalaJS.c.sjsr_StackTrace$.prototype.captureState__jl_Throwable__sjs_js_Any__V = (function(throwable, e) {
  throwable["stackdata"] = e
});
ScalaJS.c.sjsr_StackTrace$.prototype.decompressedPrefixes__p1__sjs_js_Dictionary = (function() {
  return this.decompressedPrefixes$1
});
ScalaJS.c.sjsr_StackTrace$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.sjsr_StackTrace = this;
  var dict = {
    "O": "java_lang_Object",
    "T": "java_lang_String",
    "V": "scala_Unit",
    "Z": "scala_Boolean",
    "C": "scala_Char",
    "B": "scala_Byte",
    "S": "scala_Short",
    "I": "scala_Int",
    "J": "scala_Long",
    "F": "scala_Float",
    "D": "scala_Double"
  };
  var index = 0;
  while ((index <= 22)) {
    if ((index >= 2)) {
      dict[("T" + index)] = ("scala_Tuple" + index)
    };
    dict[("F" + index)] = ("scala_Function" + index);
    index = ((index + 1) | 0)
  };
  var jsx$1 = dict;
  this.decompressedClasses$1 = jsx$1;
  this.decompressedPrefixes$1 = {
    "sjsr_": "scala_scalajs_runtime_",
    "sjs_": "scala_scalajs_",
    "sci_": "scala_collection_immutable_",
    "scm_": "scala_collection_mutable_",
    "scg_": "scala_collection_generic_",
    "sc_": "scala_collection_",
    "sr_": "scala_runtime_",
    "s_": "scala_",
    "jl_": "java_lang_",
    "ju_": "java_util_"
  };
  this.compressedPrefixes$1 = ScalaJS.g["Object"]["keys"](this.decompressedPrefixes__p1__sjs_js_Dictionary());
  return this
});
/*<skip>*/;
ScalaJS.is.sjsr_StackTrace$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sjsr_StackTrace$)))
});
ScalaJS.as.sjsr_StackTrace$ = (function(obj) {
  if ((ScalaJS.is.sjsr_StackTrace$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.scalajs.runtime.StackTrace$")
  }
});
ScalaJS.isArrayOf.sjsr_StackTrace$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sjsr_StackTrace$)))
});
ScalaJS.asArrayOf.sjsr_StackTrace$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sjsr_StackTrace$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.scalajs.runtime.StackTrace$;", depth)
  }
});
ScalaJS.d.sjsr_StackTrace$ = new ScalaJS.ClassTypeData({
  sjsr_StackTrace$: 0
}, false, "scala.scalajs.runtime.StackTrace$", ScalaJS.d.O, {
  sjsr_StackTrace$: 1,
  O: 1
});
ScalaJS.c.sjsr_StackTrace$.prototype.$classData = ScalaJS.d.sjsr_StackTrace$;
ScalaJS.n.sjsr_StackTrace = undefined;
ScalaJS.m.sjsr_StackTrace = (function() {
  if ((!ScalaJS.n.sjsr_StackTrace)) {
    ScalaJS.n.sjsr_StackTrace = new ScalaJS.c.sjsr_StackTrace$().init___()
  };
  return ScalaJS.n.sjsr_StackTrace
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sr_AbstractFunction0 = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sr_AbstractFunction0.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_AbstractFunction0.prototype.constructor = ScalaJS.c.sr_AbstractFunction0;
/** @constructor */
ScalaJS.h.sr_AbstractFunction0 = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_AbstractFunction0.prototype = ScalaJS.c.sr_AbstractFunction0.prototype;
ScalaJS.c.sr_AbstractFunction0.prototype.toString__T = (function() {
  return ScalaJS.i.s_Function0$class__toString__F0__T(this)
});
ScalaJS.c.sr_AbstractFunction0.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.i.s_Function0$class__$init$__F0__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.sr_AbstractFunction0 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sr_AbstractFunction0)))
});
ScalaJS.as.sr_AbstractFunction0 = (function(obj) {
  if ((ScalaJS.is.sr_AbstractFunction0(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.runtime.AbstractFunction0")
  }
});
ScalaJS.isArrayOf.sr_AbstractFunction0 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sr_AbstractFunction0)))
});
ScalaJS.asArrayOf.sr_AbstractFunction0 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sr_AbstractFunction0(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.runtime.AbstractFunction0;", depth)
  }
});
ScalaJS.d.sr_AbstractFunction0 = new ScalaJS.ClassTypeData({
  sr_AbstractFunction0: 0
}, false, "scala.runtime.AbstractFunction0", ScalaJS.d.O, {
  sr_AbstractFunction0: 1,
  F0: 1,
  O: 1
});
ScalaJS.c.sr_AbstractFunction0.prototype.$classData = ScalaJS.d.sr_AbstractFunction0;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sr_AbstractFunction1 = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sr_AbstractFunction1.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_AbstractFunction1.prototype.constructor = ScalaJS.c.sr_AbstractFunction1;
/** @constructor */
ScalaJS.h.sr_AbstractFunction1 = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_AbstractFunction1.prototype = ScalaJS.c.sr_AbstractFunction1.prototype;
ScalaJS.c.sr_AbstractFunction1.prototype.toString__T = (function() {
  return ScalaJS.i.s_Function1$class__toString__F1__T(this)
});
ScalaJS.c.sr_AbstractFunction1.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.i.s_Function1$class__$init$__F1__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.sr_AbstractFunction1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sr_AbstractFunction1)))
});
ScalaJS.as.sr_AbstractFunction1 = (function(obj) {
  if ((ScalaJS.is.sr_AbstractFunction1(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.runtime.AbstractFunction1")
  }
});
ScalaJS.isArrayOf.sr_AbstractFunction1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sr_AbstractFunction1)))
});
ScalaJS.asArrayOf.sr_AbstractFunction1 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sr_AbstractFunction1(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.runtime.AbstractFunction1;", depth)
  }
});
ScalaJS.d.sr_AbstractFunction1 = new ScalaJS.ClassTypeData({
  sr_AbstractFunction1: 0
}, false, "scala.runtime.AbstractFunction1", ScalaJS.d.O, {
  sr_AbstractFunction1: 1,
  F1: 1,
  O: 1
});
ScalaJS.c.sr_AbstractFunction1.prototype.$classData = ScalaJS.d.sr_AbstractFunction1;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sr_BooleanRef = (function() {
  ScalaJS.c.O.call(this);
  this.elem$1 = false
});
ScalaJS.c.sr_BooleanRef.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_BooleanRef.prototype.constructor = ScalaJS.c.sr_BooleanRef;
/** @constructor */
ScalaJS.h.sr_BooleanRef = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_BooleanRef.prototype = ScalaJS.c.sr_BooleanRef.prototype;
ScalaJS.c.sr_BooleanRef.prototype.elem__Z = (function() {
  return this.elem$1
});
ScalaJS.c.sr_BooleanRef.prototype.toString__T = (function() {
  return ScalaJS.m.sjsr_RuntimeString().valueOf__Z__T(this.elem__Z())
});
ScalaJS.c.sr_BooleanRef.prototype.init___Z = (function(elem) {
  this.elem$1 = elem;
  ScalaJS.c.O.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.sr_BooleanRef = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sr_BooleanRef)))
});
ScalaJS.as.sr_BooleanRef = (function(obj) {
  if ((ScalaJS.is.sr_BooleanRef(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.runtime.BooleanRef")
  }
});
ScalaJS.isArrayOf.sr_BooleanRef = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sr_BooleanRef)))
});
ScalaJS.asArrayOf.sr_BooleanRef = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sr_BooleanRef(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.runtime.BooleanRef;", depth)
  }
});
ScalaJS.d.sr_BooleanRef = new ScalaJS.ClassTypeData({
  sr_BooleanRef: 0
}, false, "scala.runtime.BooleanRef", ScalaJS.d.O, {
  sr_BooleanRef: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.sr_BooleanRef.prototype.$classData = ScalaJS.d.sr_BooleanRef;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sr_BooleanRef$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sr_BooleanRef$.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_BooleanRef$.prototype.constructor = ScalaJS.c.sr_BooleanRef$;
/** @constructor */
ScalaJS.h.sr_BooleanRef$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_BooleanRef$.prototype = ScalaJS.c.sr_BooleanRef$.prototype;
ScalaJS.c.sr_BooleanRef$.prototype.create__Z__sr_BooleanRef = (function(elem) {
  return new ScalaJS.c.sr_BooleanRef().init___Z(elem)
});
/*<skip>*/;
ScalaJS.is.sr_BooleanRef$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sr_BooleanRef$)))
});
ScalaJS.as.sr_BooleanRef$ = (function(obj) {
  if ((ScalaJS.is.sr_BooleanRef$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.runtime.BooleanRef$")
  }
});
ScalaJS.isArrayOf.sr_BooleanRef$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sr_BooleanRef$)))
});
ScalaJS.asArrayOf.sr_BooleanRef$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sr_BooleanRef$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.runtime.BooleanRef$;", depth)
  }
});
ScalaJS.d.sr_BooleanRef$ = new ScalaJS.ClassTypeData({
  sr_BooleanRef$: 0
}, false, "scala.runtime.BooleanRef$", ScalaJS.d.O, {
  sr_BooleanRef$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.sr_BooleanRef$.prototype.$classData = ScalaJS.d.sr_BooleanRef$;
ScalaJS.n.sr_BooleanRef = undefined;
ScalaJS.m.sr_BooleanRef = (function() {
  if ((!ScalaJS.n.sr_BooleanRef)) {
    ScalaJS.n.sr_BooleanRef = new ScalaJS.c.sr_BooleanRef$().init___()
  };
  return ScalaJS.n.sr_BooleanRef
});
/*<skip>*/;
ScalaJS.isArrayOf.sr_BoxedUnit = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sr_BoxedUnit)))
});
ScalaJS.asArrayOf.sr_BoxedUnit = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sr_BoxedUnit(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.runtime.BoxedUnit;", depth)
  }
});
ScalaJS.d.sr_BoxedUnit = new ScalaJS.ClassTypeData({
  sr_BoxedUnit: 0
}, false, "scala.runtime.BoxedUnit", undefined, {
  sr_BoxedUnit: 1,
  O: 1
}, (function(x) {
  return (x === undefined)
}));
/** @constructor */
ScalaJS.c.sr_BoxesRunTime$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sr_BoxesRunTime$.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_BoxesRunTime$.prototype.constructor = ScalaJS.c.sr_BoxesRunTime$;
/** @constructor */
ScalaJS.h.sr_BoxesRunTime$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_BoxesRunTime$.prototype = ScalaJS.c.sr_BoxesRunTime$.prototype;
ScalaJS.c.sr_BoxesRunTime$.prototype.equals__O__O__Z = (function(x, y) {
  if ((x === y)) {
    return true
  } else {
    return this.equals2__O__O__Z(x, y)
  }
});
ScalaJS.c.sr_BoxesRunTime$.prototype.equals2__O__O__Z = (function(x, y) {
  var x1 = x;
  if (ScalaJS.is.jl_Number(x1)) {
    var x2 = ScalaJS.as.jl_Number(x1);
    return this.equalsNumObject__jl_Number__O__Z(x2, y)
  };
  if (ScalaJS.is.jl_Character(x1)) {
    var x3 = ScalaJS.as.jl_Character(x1);
    return this.equalsCharObject__jl_Character__O__Z(x3, y)
  };
  if ((x1 === null)) {
    return (y === null)
  } else {
    return ScalaJS.objectEquals(x1, y)
  }
});
ScalaJS.c.sr_BoxesRunTime$.prototype.equalsNumObject__jl_Number__O__Z = (function(xn, y) {
  var x1 = y;
  if (ScalaJS.is.jl_Number(x1)) {
    var x2 = ScalaJS.as.jl_Number(x1);
    return this.equalsNumNum__jl_Number__jl_Number__Z(xn, x2)
  };
  if (ScalaJS.is.jl_Character(x1)) {
    var x3 = ScalaJS.as.jl_Character(x1);
    return this.equalsNumChar__p1__jl_Number__jl_Character__Z(xn, x3)
  };
  if ((xn === null)) {
    return (x1 === null)
  } else {
    return ScalaJS.objectEquals(xn, x1)
  }
});
ScalaJS.c.sr_BoxesRunTime$.prototype.eqTypeCode__p1__jl_Number__I = (function(a) {
  var x1 = a;
  if (ScalaJS.isInt(x1)) {
    return ScalaJS.m.sr_BoxesRunTime$Codes().INT__I()
  };
  if (ScalaJS.isByte(x1)) {
    return ScalaJS.m.sr_BoxesRunTime$Codes().INT__I()
  };
  if (ScalaJS.is.sjsr_RuntimeLong(x1)) {
    return ScalaJS.m.sr_BoxesRunTime$Codes().LONG__I()
  };
  if ((typeof(x1) === "number")) {
    return ScalaJS.m.sr_BoxesRunTime$Codes().DOUBLE__I()
  };
  if (ScalaJS.isShort(x1)) {
    return ScalaJS.m.sr_BoxesRunTime$Codes().INT__I()
  };
  if ((typeof(x1) === "number")) {
    return ScalaJS.m.sr_BoxesRunTime$Codes().FLOAT__I()
  };
  return ScalaJS.m.sr_BoxesRunTime$Codes().OTHER__I()
});
ScalaJS.c.sr_BoxesRunTime$.prototype.equalsNumNum__jl_Number__jl_Number__Z = (function(xn, yn) {
  var xcode = this.eqTypeCode__p1__jl_Number__I(xn);
  var ycode = this.eqTypeCode__p1__jl_Number__I(yn);
  if ((ycode > xcode)) {
    var dcode = ycode
  } else {
    var dcode = xcode
  };
  var x1 = dcode;
  switch (x1) {
    default:
      if ((x1 === ScalaJS.m.sr_BoxesRunTime$Codes().INT__I())) {
        return (ScalaJS.numberIntValue(xn) === ScalaJS.numberIntValue(yn))
      } else {
        if ((x1 === ScalaJS.m.sr_BoxesRunTime$Codes().LONG__I())) {
          return ScalaJS.numberLongValue(xn).equals__O__Z(ScalaJS.numberLongValue(yn))
        } else {
          if ((x1 === ScalaJS.m.sr_BoxesRunTime$Codes().FLOAT__I())) {
            return (ScalaJS.numberFloatValue(xn) === ScalaJS.numberFloatValue(yn))
          } else {
            if ((x1 === ScalaJS.m.sr_BoxesRunTime$Codes().DOUBLE__I())) {
              return (ScalaJS.numberDoubleValue(xn) === ScalaJS.numberDoubleValue(yn))
            } else {
              if ((ScalaJS.is.s_math_ScalaNumber(yn) && (!ScalaJS.is.s_math_ScalaNumber(xn)))) {
                return ScalaJS.objectEquals(yn, xn)
              } else {
                if ((xn === null)) {
                  return (yn === null)
                } else {
                  return ScalaJS.objectEquals(xn, yn)
                }
              }
            }
          }
        }
      };
  }
});
ScalaJS.c.sr_BoxesRunTime$.prototype.equalsCharObject__jl_Character__O__Z = (function(xc, y) {
  var x1 = y;
  if (ScalaJS.is.jl_Character(x1)) {
    var x2 = ScalaJS.as.jl_Character(x1);
    return (xc.charValue__C() === x2.charValue__C())
  };
  if (ScalaJS.is.jl_Number(x1)) {
    var x3 = ScalaJS.as.jl_Number(x1);
    return this.equalsNumChar__p1__jl_Number__jl_Character__Z(x3, xc)
  };
  if ((xc === null)) {
    return (y === null)
  } else {
    return xc.equals__O__Z(y)
  }
});
ScalaJS.c.sr_BoxesRunTime$.prototype.equalsNumChar__p1__jl_Number__jl_Character__Z = (function(xn, yc) {
  var ch = yc.charValue__C();
  var x1 = this.eqTypeCode__p1__jl_Number__I(xn);
  switch (x1) {
    default:
      if ((x1 === ScalaJS.m.sr_BoxesRunTime$Codes().INT__I())) {
        return (ScalaJS.numberIntValue(xn) === ch)
      } else {
        if ((x1 === ScalaJS.m.sr_BoxesRunTime$Codes().LONG__I())) {
          return ScalaJS.numberLongValue(xn).equals__O__Z(ScalaJS.m.sjsr_RuntimeLong().fromChar__C__sjsr_RuntimeLong(ch))
        } else {
          if ((x1 === ScalaJS.m.sr_BoxesRunTime$Codes().FLOAT__I())) {
            return (ScalaJS.numberFloatValue(xn) === ch)
          } else {
            if ((x1 === ScalaJS.m.sr_BoxesRunTime$Codes().DOUBLE__I())) {
              return (ScalaJS.numberDoubleValue(xn) === ch)
            } else {
              if ((xn === null)) {
                return (yc === null)
              } else {
                return ScalaJS.objectEquals(xn, yc)
              }
            }
          }
        }
      };
  }
});
ScalaJS.c.sr_BoxesRunTime$.prototype.hashFromLong__jl_Long__I = (function(n) {
  var iv = ScalaJS.numberIntValue(n);
  if (ScalaJS.m.sjsr_RuntimeLong().fromInt__I__sjsr_RuntimeLong(iv).equals__O__Z(ScalaJS.numberLongValue(n))) {
    return iv
  } else {
    return ScalaJS.objectHashCode(n)
  }
});
ScalaJS.c.sr_BoxesRunTime$.prototype.hashFromDouble__jl_Double__I = (function(n) {
  var iv = ScalaJS.numberIntValue(n);
  var dv = ScalaJS.numberDoubleValue(n);
  var lv = ScalaJS.numberLongValue(n);
  if ((iv === dv)) {
    return iv
  } else {
    if ((lv.toDouble__D() === dv)) {
      return ScalaJS.objectHashCode(ScalaJS.m.jl_Long().valueOf__J__jl_Long(lv))
    } else {
      return ScalaJS.objectHashCode(n)
    }
  }
});
ScalaJS.c.sr_BoxesRunTime$.prototype.hashFromFloat__jl_Float__I = (function(n) {
  var iv = ScalaJS.numberIntValue(n);
  var fv = ScalaJS.numberFloatValue(n);
  var lv = ScalaJS.numberLongValue(n);
  if ((iv === fv)) {
    return iv
  } else {
    if ((lv.toDouble__D() === fv)) {
      return ScalaJS.objectHashCode(ScalaJS.m.jl_Long().valueOf__J__jl_Long(lv))
    } else {
      return ScalaJS.objectHashCode(n)
    }
  }
});
ScalaJS.c.sr_BoxesRunTime$.prototype.hashFromNumber__jl_Number__I = (function(n) {
  var x1 = n;
  if (ScalaJS.is.sjsr_RuntimeLong(x1)) {
    var x2 = ScalaJS.as.sjsr_RuntimeLong(x1);
    return this.hashFromLong__jl_Long__I(x2)
  };
  if ((typeof(x1) === "number")) {
    var x3 = ScalaJS.asDouble(x1);
    return this.hashFromDouble__jl_Double__I(x3)
  };
  if ((typeof(x1) === "number")) {
    var x4 = ScalaJS.asFloat(x1);
    return this.hashFromFloat__jl_Float__I(x4)
  };
  return ScalaJS.objectHashCode(x1)
});
/*<skip>*/;
ScalaJS.is.sr_BoxesRunTime$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sr_BoxesRunTime$)))
});
ScalaJS.as.sr_BoxesRunTime$ = (function(obj) {
  if ((ScalaJS.is.sr_BoxesRunTime$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.runtime.BoxesRunTime$")
  }
});
ScalaJS.isArrayOf.sr_BoxesRunTime$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sr_BoxesRunTime$)))
});
ScalaJS.asArrayOf.sr_BoxesRunTime$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sr_BoxesRunTime$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.runtime.BoxesRunTime$;", depth)
  }
});
ScalaJS.d.sr_BoxesRunTime$ = new ScalaJS.ClassTypeData({
  sr_BoxesRunTime$: 0
}, false, "scala.runtime.BoxesRunTime$", ScalaJS.d.O, {
  sr_BoxesRunTime$: 1,
  O: 1
});
ScalaJS.c.sr_BoxesRunTime$.prototype.$classData = ScalaJS.d.sr_BoxesRunTime$;
ScalaJS.n.sr_BoxesRunTime = undefined;
ScalaJS.m.sr_BoxesRunTime = (function() {
  if ((!ScalaJS.n.sr_BoxesRunTime)) {
    ScalaJS.n.sr_BoxesRunTime = new ScalaJS.c.sr_BoxesRunTime$().init___()
  };
  return ScalaJS.n.sr_BoxesRunTime
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sr_BoxesRunTime$Codes$ = (function() {
  ScalaJS.c.O.call(this);
  this.CHAR$1 = 0;
  this.BYTE$1 = 0;
  this.SHORT$1 = 0;
  this.INT$1 = 0;
  this.LONG$1 = 0;
  this.FLOAT$1 = 0;
  this.DOUBLE$1 = 0;
  this.OTHER$1 = 0
});
ScalaJS.c.sr_BoxesRunTime$Codes$.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_BoxesRunTime$Codes$.prototype.constructor = ScalaJS.c.sr_BoxesRunTime$Codes$;
/** @constructor */
ScalaJS.h.sr_BoxesRunTime$Codes$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_BoxesRunTime$Codes$.prototype = ScalaJS.c.sr_BoxesRunTime$Codes$.prototype;
ScalaJS.c.sr_BoxesRunTime$Codes$.prototype.INT__I = (function() {
  return this.INT$1
});
ScalaJS.c.sr_BoxesRunTime$Codes$.prototype.LONG__I = (function() {
  return this.LONG$1
});
ScalaJS.c.sr_BoxesRunTime$Codes$.prototype.FLOAT__I = (function() {
  return this.FLOAT$1
});
ScalaJS.c.sr_BoxesRunTime$Codes$.prototype.DOUBLE__I = (function() {
  return this.DOUBLE$1
});
ScalaJS.c.sr_BoxesRunTime$Codes$.prototype.OTHER__I = (function() {
  return this.OTHER$1
});
ScalaJS.c.sr_BoxesRunTime$Codes$.prototype.init___ = (function() {
  ScalaJS.c.O.prototype.init___.call(this);
  ScalaJS.n.sr_BoxesRunTime$Codes = this;
  this.CHAR$1 = 0;
  this.BYTE$1 = 1;
  this.SHORT$1 = 2;
  this.INT$1 = 3;
  this.LONG$1 = 4;
  this.FLOAT$1 = 5;
  this.DOUBLE$1 = 6;
  this.OTHER$1 = 7;
  return this
});
/*<skip>*/;
ScalaJS.is.sr_BoxesRunTime$Codes$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sr_BoxesRunTime$Codes$)))
});
ScalaJS.as.sr_BoxesRunTime$Codes$ = (function(obj) {
  if ((ScalaJS.is.sr_BoxesRunTime$Codes$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.runtime.BoxesRunTime$Codes$")
  }
});
ScalaJS.isArrayOf.sr_BoxesRunTime$Codes$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sr_BoxesRunTime$Codes$)))
});
ScalaJS.asArrayOf.sr_BoxesRunTime$Codes$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sr_BoxesRunTime$Codes$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.runtime.BoxesRunTime$Codes$;", depth)
  }
});
ScalaJS.d.sr_BoxesRunTime$Codes$ = new ScalaJS.ClassTypeData({
  sr_BoxesRunTime$Codes$: 0
}, false, "scala.runtime.BoxesRunTime$Codes$", ScalaJS.d.O, {
  sr_BoxesRunTime$Codes$: 1,
  O: 1
});
ScalaJS.c.sr_BoxesRunTime$Codes$.prototype.$classData = ScalaJS.d.sr_BoxesRunTime$Codes$;
ScalaJS.n.sr_BoxesRunTime$Codes = undefined;
ScalaJS.m.sr_BoxesRunTime$Codes = (function() {
  if ((!ScalaJS.n.sr_BoxesRunTime$Codes)) {
    ScalaJS.n.sr_BoxesRunTime$Codes = new ScalaJS.c.sr_BoxesRunTime$Codes$().init___()
  };
  return ScalaJS.n.sr_BoxesRunTime$Codes
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sr_IntRef = (function() {
  ScalaJS.c.O.call(this);
  this.elem$1 = 0
});
ScalaJS.c.sr_IntRef.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_IntRef.prototype.constructor = ScalaJS.c.sr_IntRef;
/** @constructor */
ScalaJS.h.sr_IntRef = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_IntRef.prototype = ScalaJS.c.sr_IntRef.prototype;
ScalaJS.c.sr_IntRef.prototype.elem__I = (function() {
  return this.elem$1
});
ScalaJS.c.sr_IntRef.prototype.toString__T = (function() {
  return ScalaJS.m.sjsr_RuntimeString().valueOf__I__T(this.elem__I())
});
ScalaJS.c.sr_IntRef.prototype.init___I = (function(elem) {
  this.elem$1 = elem;
  ScalaJS.c.O.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.sr_IntRef = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sr_IntRef)))
});
ScalaJS.as.sr_IntRef = (function(obj) {
  if ((ScalaJS.is.sr_IntRef(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.runtime.IntRef")
  }
});
ScalaJS.isArrayOf.sr_IntRef = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sr_IntRef)))
});
ScalaJS.asArrayOf.sr_IntRef = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sr_IntRef(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.runtime.IntRef;", depth)
  }
});
ScalaJS.d.sr_IntRef = new ScalaJS.ClassTypeData({
  sr_IntRef: 0
}, false, "scala.runtime.IntRef", ScalaJS.d.O, {
  sr_IntRef: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.sr_IntRef.prototype.$classData = ScalaJS.d.sr_IntRef;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sr_IntRef$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sr_IntRef$.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_IntRef$.prototype.constructor = ScalaJS.c.sr_IntRef$;
/** @constructor */
ScalaJS.h.sr_IntRef$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_IntRef$.prototype = ScalaJS.c.sr_IntRef$.prototype;
ScalaJS.c.sr_IntRef$.prototype.create__I__sr_IntRef = (function(elem) {
  return new ScalaJS.c.sr_IntRef().init___I(elem)
});
/*<skip>*/;
ScalaJS.is.sr_IntRef$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sr_IntRef$)))
});
ScalaJS.as.sr_IntRef$ = (function(obj) {
  if ((ScalaJS.is.sr_IntRef$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.runtime.IntRef$")
  }
});
ScalaJS.isArrayOf.sr_IntRef$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sr_IntRef$)))
});
ScalaJS.asArrayOf.sr_IntRef$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sr_IntRef$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.runtime.IntRef$;", depth)
  }
});
ScalaJS.d.sr_IntRef$ = new ScalaJS.ClassTypeData({
  sr_IntRef$: 0
}, false, "scala.runtime.IntRef$", ScalaJS.d.O, {
  sr_IntRef$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.sr_IntRef$.prototype.$classData = ScalaJS.d.sr_IntRef$;
ScalaJS.n.sr_IntRef = undefined;
ScalaJS.m.sr_IntRef = (function() {
  if ((!ScalaJS.n.sr_IntRef)) {
    ScalaJS.n.sr_IntRef = new ScalaJS.c.sr_IntRef$().init___()
  };
  return ScalaJS.n.sr_IntRef
});
/*<skip>*/;
ScalaJS.is.sr_Null$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sr_Null$)))
});
ScalaJS.as.sr_Null$ = (function(obj) {
  if ((ScalaJS.is.sr_Null$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.runtime.Null$")
  }
});
ScalaJS.isArrayOf.sr_Null$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sr_Null$)))
});
ScalaJS.asArrayOf.sr_Null$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sr_Null$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.runtime.Null$;", depth)
  }
});
ScalaJS.d.sr_Null$ = new ScalaJS.ClassTypeData({
  sr_Null$: 0
}, false, "scala.runtime.Null$", ScalaJS.d.O, {
  sr_Null$: 1,
  O: 1
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sr_ObjectRef = (function() {
  ScalaJS.c.O.call(this);
  this.elem$1 = null
});
ScalaJS.c.sr_ObjectRef.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_ObjectRef.prototype.constructor = ScalaJS.c.sr_ObjectRef;
/** @constructor */
ScalaJS.h.sr_ObjectRef = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_ObjectRef.prototype = ScalaJS.c.sr_ObjectRef.prototype;
ScalaJS.c.sr_ObjectRef.prototype.elem__O = (function() {
  return this.elem$1
});
ScalaJS.c.sr_ObjectRef.prototype.toString__T = (function() {
  return ScalaJS.m.sjsr_RuntimeString().valueOf__O__T(this.elem__O())
});
ScalaJS.c.sr_ObjectRef.prototype.init___O = (function(elem) {
  this.elem$1 = elem;
  ScalaJS.c.O.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.sr_ObjectRef = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sr_ObjectRef)))
});
ScalaJS.as.sr_ObjectRef = (function(obj) {
  if ((ScalaJS.is.sr_ObjectRef(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.runtime.ObjectRef")
  }
});
ScalaJS.isArrayOf.sr_ObjectRef = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sr_ObjectRef)))
});
ScalaJS.asArrayOf.sr_ObjectRef = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sr_ObjectRef(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.runtime.ObjectRef;", depth)
  }
});
ScalaJS.d.sr_ObjectRef = new ScalaJS.ClassTypeData({
  sr_ObjectRef: 0
}, false, "scala.runtime.ObjectRef", ScalaJS.d.O, {
  sr_ObjectRef: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.sr_ObjectRef.prototype.$classData = ScalaJS.d.sr_ObjectRef;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sr_ObjectRef$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sr_ObjectRef$.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_ObjectRef$.prototype.constructor = ScalaJS.c.sr_ObjectRef$;
/** @constructor */
ScalaJS.h.sr_ObjectRef$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_ObjectRef$.prototype = ScalaJS.c.sr_ObjectRef$.prototype;
ScalaJS.c.sr_ObjectRef$.prototype.zero__sr_ObjectRef = (function() {
  return new ScalaJS.c.sr_ObjectRef().init___O(null)
});
/*<skip>*/;
ScalaJS.is.sr_ObjectRef$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sr_ObjectRef$)))
});
ScalaJS.as.sr_ObjectRef$ = (function(obj) {
  if ((ScalaJS.is.sr_ObjectRef$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.runtime.ObjectRef$")
  }
});
ScalaJS.isArrayOf.sr_ObjectRef$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sr_ObjectRef$)))
});
ScalaJS.asArrayOf.sr_ObjectRef$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sr_ObjectRef$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.runtime.ObjectRef$;", depth)
  }
});
ScalaJS.d.sr_ObjectRef$ = new ScalaJS.ClassTypeData({
  sr_ObjectRef$: 0
}, false, "scala.runtime.ObjectRef$", ScalaJS.d.O, {
  sr_ObjectRef$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.sr_ObjectRef$.prototype.$classData = ScalaJS.d.sr_ObjectRef$;
ScalaJS.n.sr_ObjectRef = undefined;
ScalaJS.m.sr_ObjectRef = (function() {
  if ((!ScalaJS.n.sr_ObjectRef)) {
    ScalaJS.n.sr_ObjectRef = new ScalaJS.c.sr_ObjectRef$().init___()
  };
  return ScalaJS.n.sr_ObjectRef
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sr_ScalaRunTime$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sr_ScalaRunTime$.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_ScalaRunTime$.prototype.constructor = ScalaJS.c.sr_ScalaRunTime$;
/** @constructor */
ScalaJS.h.sr_ScalaRunTime$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_ScalaRunTime$.prototype = ScalaJS.c.sr_ScalaRunTime$.prototype;
ScalaJS.c.sr_ScalaRunTime$.prototype.$$undtoString__s_Product__T = (function(x) {
  return x.productIterator__sc_Iterator().mkString__T__T__T__T((x.productPrefix__T() + "("), ",", ")")
});
ScalaJS.c.sr_ScalaRunTime$.prototype.$$undhashCode__s_Product__I = (function(x) {
  return ScalaJS.m.s_util_hashing_MurmurHash3().productHash__s_Product__I(x)
});
ScalaJS.c.sr_ScalaRunTime$.prototype.typedProductIterator__s_Product__sc_Iterator = (function(x) {
  return new ScalaJS.c.sr_ScalaRunTime$$anon$1().init___s_Product(x)
});
ScalaJS.c.sr_ScalaRunTime$.prototype.hash__O__I = (function(x) {
  if ((x === null)) {
    return 0
  } else {
    if (ScalaJS.is.jl_Number(x)) {
      return ScalaJS.m.sr_BoxesRunTime().hashFromNumber__jl_Number__I(ScalaJS.as.jl_Number(x))
    } else {
      return ScalaJS.objectHashCode(x)
    }
  }
});
/*<skip>*/;
ScalaJS.is.sr_ScalaRunTime$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sr_ScalaRunTime$)))
});
ScalaJS.as.sr_ScalaRunTime$ = (function(obj) {
  if ((ScalaJS.is.sr_ScalaRunTime$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.runtime.ScalaRunTime$")
  }
});
ScalaJS.isArrayOf.sr_ScalaRunTime$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sr_ScalaRunTime$)))
});
ScalaJS.asArrayOf.sr_ScalaRunTime$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sr_ScalaRunTime$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.runtime.ScalaRunTime$;", depth)
  }
});
ScalaJS.d.sr_ScalaRunTime$ = new ScalaJS.ClassTypeData({
  sr_ScalaRunTime$: 0
}, false, "scala.runtime.ScalaRunTime$", ScalaJS.d.O, {
  sr_ScalaRunTime$: 1,
  O: 1
});
ScalaJS.c.sr_ScalaRunTime$.prototype.$classData = ScalaJS.d.sr_ScalaRunTime$;
ScalaJS.n.sr_ScalaRunTime = undefined;
ScalaJS.m.sr_ScalaRunTime = (function() {
  if ((!ScalaJS.n.sr_ScalaRunTime)) {
    ScalaJS.n.sr_ScalaRunTime = new ScalaJS.c.sr_ScalaRunTime$().init___()
  };
  return ScalaJS.n.sr_ScalaRunTime
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sr_Statics$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sr_Statics$.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_Statics$.prototype.constructor = ScalaJS.c.sr_Statics$;
/** @constructor */
ScalaJS.h.sr_Statics$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_Statics$.prototype = ScalaJS.c.sr_Statics$.prototype;
ScalaJS.c.sr_Statics$.prototype.mix__I__I__I = (function(hash, data) {
  var h = this.mixLast__I__I__I(hash, data);
  h = ScalaJS.m.jl_Integer().rotateLeft__I__I__I(h, 13);
  return ((ScalaJS.imul(h, 5) + -430675100) | 0)
});
ScalaJS.c.sr_Statics$.prototype.mixLast__I__I__I = (function(hash, data) {
  var k = data;
  k = ScalaJS.imul(k, -862048943);
  k = ScalaJS.m.jl_Integer().rotateLeft__I__I__I(k, 15);
  k = ScalaJS.imul(k, 461845907);
  return (hash ^ k)
});
ScalaJS.c.sr_Statics$.prototype.finalizeHash__I__I__I = (function(hash, length) {
  return this.avalanche__I__I((hash ^ length))
});
ScalaJS.c.sr_Statics$.prototype.avalanche__I__I = (function(h0) {
  var h = h0;
  h = (h ^ ((h >>> 16) | 0));
  h = ScalaJS.imul(h, -2048144789);
  h = (h ^ ((h >>> 13) | 0));
  h = ScalaJS.imul(h, -1028477387);
  h = (h ^ ((h >>> 16) | 0));
  return h
});
/*<skip>*/;
ScalaJS.is.sr_Statics$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sr_Statics$)))
});
ScalaJS.as.sr_Statics$ = (function(obj) {
  if ((ScalaJS.is.sr_Statics$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.runtime.Statics$")
  }
});
ScalaJS.isArrayOf.sr_Statics$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sr_Statics$)))
});
ScalaJS.asArrayOf.sr_Statics$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sr_Statics$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.runtime.Statics$;", depth)
  }
});
ScalaJS.d.sr_Statics$ = new ScalaJS.ClassTypeData({
  sr_Statics$: 0
}, false, "scala.runtime.Statics$", ScalaJS.d.O, {
  sr_Statics$: 1,
  O: 1
});
ScalaJS.c.sr_Statics$.prototype.$classData = ScalaJS.d.sr_Statics$;
ScalaJS.n.sr_Statics = undefined;
ScalaJS.m.sr_Statics = (function() {
  if ((!ScalaJS.n.sr_Statics)) {
    ScalaJS.n.sr_Statics = new ScalaJS.c.sr_Statics$().init___()
  };
  return ScalaJS.n.sr_Statics
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sr_VolatileByteRef = (function() {
  ScalaJS.c.O.call(this);
  this.elem$1 = 0
});
ScalaJS.c.sr_VolatileByteRef.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_VolatileByteRef.prototype.constructor = ScalaJS.c.sr_VolatileByteRef;
/** @constructor */
ScalaJS.h.sr_VolatileByteRef = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_VolatileByteRef.prototype = ScalaJS.c.sr_VolatileByteRef.prototype;
ScalaJS.c.sr_VolatileByteRef.prototype.elem__B = (function() {
  return this.elem$1
});
ScalaJS.c.sr_VolatileByteRef.prototype.toString__T = (function() {
  return ScalaJS.m.sjsr_RuntimeString().valueOf__I__T(this.elem__B())
});
ScalaJS.c.sr_VolatileByteRef.prototype.init___B = (function(elem) {
  this.elem$1 = elem;
  ScalaJS.c.O.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.sr_VolatileByteRef = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sr_VolatileByteRef)))
});
ScalaJS.as.sr_VolatileByteRef = (function(obj) {
  if ((ScalaJS.is.sr_VolatileByteRef(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.runtime.VolatileByteRef")
  }
});
ScalaJS.isArrayOf.sr_VolatileByteRef = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sr_VolatileByteRef)))
});
ScalaJS.asArrayOf.sr_VolatileByteRef = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sr_VolatileByteRef(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.runtime.VolatileByteRef;", depth)
  }
});
ScalaJS.d.sr_VolatileByteRef = new ScalaJS.ClassTypeData({
  sr_VolatileByteRef: 0
}, false, "scala.runtime.VolatileByteRef", ScalaJS.d.O, {
  sr_VolatileByteRef: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.sr_VolatileByteRef.prototype.$classData = ScalaJS.d.sr_VolatileByteRef;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sr_VolatileByteRef$ = (function() {
  ScalaJS.c.O.call(this)
});
ScalaJS.c.sr_VolatileByteRef$.prototype = new ScalaJS.h.O();
ScalaJS.c.sr_VolatileByteRef$.prototype.constructor = ScalaJS.c.sr_VolatileByteRef$;
/** @constructor */
ScalaJS.h.sr_VolatileByteRef$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_VolatileByteRef$.prototype = ScalaJS.c.sr_VolatileByteRef$.prototype;
ScalaJS.c.sr_VolatileByteRef$.prototype.create__B__sr_VolatileByteRef = (function(elem) {
  return new ScalaJS.c.sr_VolatileByteRef().init___B(elem)
});
/*<skip>*/;
ScalaJS.is.sr_VolatileByteRef$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sr_VolatileByteRef$)))
});
ScalaJS.as.sr_VolatileByteRef$ = (function(obj) {
  if ((ScalaJS.is.sr_VolatileByteRef$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.runtime.VolatileByteRef$")
  }
});
ScalaJS.isArrayOf.sr_VolatileByteRef$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sr_VolatileByteRef$)))
});
ScalaJS.asArrayOf.sr_VolatileByteRef$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sr_VolatileByteRef$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.runtime.VolatileByteRef$;", depth)
  }
});
ScalaJS.d.sr_VolatileByteRef$ = new ScalaJS.ClassTypeData({
  sr_VolatileByteRef$: 0
}, false, "scala.runtime.VolatileByteRef$", ScalaJS.d.O, {
  sr_VolatileByteRef$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.sr_VolatileByteRef$.prototype.$classData = ScalaJS.d.sr_VolatileByteRef$;
ScalaJS.n.sr_VolatileByteRef = undefined;
ScalaJS.m.sr_VolatileByteRef = (function() {
  if ((!ScalaJS.n.sr_VolatileByteRef)) {
    ScalaJS.n.sr_VolatileByteRef = new ScalaJS.c.sr_VolatileByteRef$().init___()
  };
  return ScalaJS.n.sr_VolatileByteRef
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.Ljava_io_FilterOutputStream = (function() {
  ScalaJS.c.Ljava_io_OutputStream.call(this);
  this.out$2 = null
});
ScalaJS.c.Ljava_io_FilterOutputStream.prototype = new ScalaJS.h.Ljava_io_OutputStream();
ScalaJS.c.Ljava_io_FilterOutputStream.prototype.constructor = ScalaJS.c.Ljava_io_FilterOutputStream;
/** @constructor */
ScalaJS.h.Ljava_io_FilterOutputStream = (function() {
  /*<skip>*/
});
ScalaJS.h.Ljava_io_FilterOutputStream.prototype = ScalaJS.c.Ljava_io_FilterOutputStream.prototype;
ScalaJS.c.Ljava_io_FilterOutputStream.prototype.init___Ljava_io_OutputStream = (function(out) {
  this.out$2 = out;
  ScalaJS.c.Ljava_io_OutputStream.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.Ljava_io_FilterOutputStream = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Ljava_io_FilterOutputStream)))
});
ScalaJS.as.Ljava_io_FilterOutputStream = (function(obj) {
  if ((ScalaJS.is.Ljava_io_FilterOutputStream(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.io.FilterOutputStream")
  }
});
ScalaJS.isArrayOf.Ljava_io_FilterOutputStream = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Ljava_io_FilterOutputStream)))
});
ScalaJS.asArrayOf.Ljava_io_FilterOutputStream = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.Ljava_io_FilterOutputStream(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.io.FilterOutputStream;", depth)
  }
});
ScalaJS.d.Ljava_io_FilterOutputStream = new ScalaJS.ClassTypeData({
  Ljava_io_FilterOutputStream: 0
}, false, "java.io.FilterOutputStream", ScalaJS.d.Ljava_io_OutputStream, {
  Ljava_io_FilterOutputStream: 1,
  Ljava_io_OutputStream: 1,
  Ljava_io_Flushable: 1,
  Ljava_io_Closeable: 1,
  O: 1
});
ScalaJS.c.Ljava_io_FilterOutputStream.prototype.$classData = ScalaJS.d.Ljava_io_FilterOutputStream;
/*<skip>*/;
ScalaJS.isArrayOf.jl_Byte = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Byte)))
});
ScalaJS.asArrayOf.jl_Byte = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_Byte(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.Byte;", depth)
  }
});
ScalaJS.d.jl_Byte = new ScalaJS.ClassTypeData({
  jl_Byte: 0
}, false, "java.lang.Byte", undefined, {
  jl_Byte: 1,
  jl_Comparable: 1,
  jl_Number: 1,
  O: 1
}, (function(x) {
  return ScalaJS.isByte(x)
}));
ScalaJS.isArrayOf.jl_Double = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Double)))
});
ScalaJS.asArrayOf.jl_Double = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_Double(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.Double;", depth)
  }
});
ScalaJS.d.jl_Double = new ScalaJS.ClassTypeData({
  jl_Double: 0
}, false, "java.lang.Double", undefined, {
  jl_Double: 1,
  jl_Comparable: 1,
  jl_Number: 1,
  O: 1
}, (function(x) {
  return (typeof(x) === "number")
}));
/** @constructor */
ScalaJS.c.jl_Error = (function() {
  ScalaJS.c.jl_Throwable.call(this)
});
ScalaJS.c.jl_Error.prototype = new ScalaJS.h.jl_Throwable();
ScalaJS.c.jl_Error.prototype.constructor = ScalaJS.c.jl_Error;
/** @constructor */
ScalaJS.h.jl_Error = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Error.prototype = ScalaJS.c.jl_Error.prototype;
ScalaJS.c.jl_Error.prototype.init___T = (function(s) {
  ScalaJS.c.jl_Error.prototype.init___T__jl_Throwable.call(this, s, null);
  return this
});
/*<skip>*/;
ScalaJS.is.jl_Error = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_Error)))
});
ScalaJS.as.jl_Error = (function(obj) {
  if ((ScalaJS.is.jl_Error(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.Error")
  }
});
ScalaJS.isArrayOf.jl_Error = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Error)))
});
ScalaJS.asArrayOf.jl_Error = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_Error(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.Error;", depth)
  }
});
ScalaJS.d.jl_Error = new ScalaJS.ClassTypeData({
  jl_Error: 0
}, false, "java.lang.Error", ScalaJS.d.jl_Throwable, {
  jl_Error: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.jl_Error.prototype.$classData = ScalaJS.d.jl_Error;
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_Exception = (function() {
  ScalaJS.c.jl_Throwable.call(this)
});
ScalaJS.c.jl_Exception.prototype = new ScalaJS.h.jl_Throwable();
ScalaJS.c.jl_Exception.prototype.constructor = ScalaJS.c.jl_Exception;
/** @constructor */
ScalaJS.h.jl_Exception = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_Exception.prototype = ScalaJS.c.jl_Exception.prototype;
ScalaJS.c.jl_Exception.prototype.init___ = (function() {
  ScalaJS.c.jl_Exception.prototype.init___T__jl_Throwable.call(this, null, null);
  return this
});
/*<skip>*/;
ScalaJS.is.jl_Exception = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_Exception)))
});
ScalaJS.as.jl_Exception = (function(obj) {
  if ((ScalaJS.is.jl_Exception(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.Exception")
  }
});
ScalaJS.isArrayOf.jl_Exception = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Exception)))
});
ScalaJS.asArrayOf.jl_Exception = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_Exception(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.Exception;", depth)
  }
});
ScalaJS.d.jl_Exception = new ScalaJS.ClassTypeData({
  jl_Exception: 0
}, false, "java.lang.Exception", ScalaJS.d.jl_Throwable, {
  jl_Exception: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.jl_Exception.prototype.$classData = ScalaJS.d.jl_Exception;
/*<skip>*/;
ScalaJS.isArrayOf.jl_Float = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Float)))
});
ScalaJS.asArrayOf.jl_Float = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_Float(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.Float;", depth)
  }
});
ScalaJS.d.jl_Float = new ScalaJS.ClassTypeData({
  jl_Float: 0
}, false, "java.lang.Float", undefined, {
  jl_Float: 1,
  jl_Comparable: 1,
  jl_Number: 1,
  O: 1
}, (function(x) {
  return (typeof(x) === "number")
}));
/** @constructor */
ScalaJS.c.jl_InheritableThreadLocal = (function() {
  ScalaJS.c.jl_ThreadLocal.call(this)
});
ScalaJS.c.jl_InheritableThreadLocal.prototype = new ScalaJS.h.jl_ThreadLocal();
ScalaJS.c.jl_InheritableThreadLocal.prototype.constructor = ScalaJS.c.jl_InheritableThreadLocal;
/** @constructor */
ScalaJS.h.jl_InheritableThreadLocal = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_InheritableThreadLocal.prototype = ScalaJS.c.jl_InheritableThreadLocal.prototype;
/*<skip>*/;
ScalaJS.is.jl_InheritableThreadLocal = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_InheritableThreadLocal)))
});
ScalaJS.as.jl_InheritableThreadLocal = (function(obj) {
  if ((ScalaJS.is.jl_InheritableThreadLocal(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.InheritableThreadLocal")
  }
});
ScalaJS.isArrayOf.jl_InheritableThreadLocal = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_InheritableThreadLocal)))
});
ScalaJS.asArrayOf.jl_InheritableThreadLocal = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_InheritableThreadLocal(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.InheritableThreadLocal;", depth)
  }
});
ScalaJS.d.jl_InheritableThreadLocal = new ScalaJS.ClassTypeData({
  jl_InheritableThreadLocal: 0
}, false, "java.lang.InheritableThreadLocal", ScalaJS.d.jl_ThreadLocal, {
  jl_InheritableThreadLocal: 1,
  jl_ThreadLocal: 1,
  O: 1
});
ScalaJS.c.jl_InheritableThreadLocal.prototype.$classData = ScalaJS.d.jl_InheritableThreadLocal;
/*<skip>*/;
ScalaJS.isArrayOf.jl_Integer = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Integer)))
});
ScalaJS.asArrayOf.jl_Integer = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_Integer(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.Integer;", depth)
  }
});
ScalaJS.d.jl_Integer = new ScalaJS.ClassTypeData({
  jl_Integer: 0
}, false, "java.lang.Integer", undefined, {
  jl_Integer: 1,
  jl_Comparable: 1,
  jl_Number: 1,
  O: 1
}, (function(x) {
  return ScalaJS.isInt(x)
}));
ScalaJS.isArrayOf.jl_Long = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Long)))
});
ScalaJS.asArrayOf.jl_Long = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_Long(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.Long;", depth)
  }
});
ScalaJS.d.jl_Long = new ScalaJS.ClassTypeData({
  jl_Long: 0
}, false, "java.lang.Long", undefined, {
  jl_Long: 1,
  jl_Comparable: 1,
  jl_Number: 1,
  O: 1
}, (function(x) {
  return ScalaJS.is.sjsr_RuntimeLong(x)
}));
ScalaJS.isArrayOf.jl_Short = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_Short)))
});
ScalaJS.asArrayOf.jl_Short = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_Short(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.Short;", depth)
  }
});
ScalaJS.d.jl_Short = new ScalaJS.ClassTypeData({
  jl_Short: 0
}, false, "java.lang.Short", undefined, {
  jl_Short: 1,
  jl_Comparable: 1,
  jl_Number: 1,
  O: 1
}, (function(x) {
  return ScalaJS.isShort(x)
}));
/** @constructor */
ScalaJS.c.jl_StandardErr$ = (function() {
  ScalaJS.c.Ljava_io_OutputStream.call(this)
});
ScalaJS.c.jl_StandardErr$.prototype = new ScalaJS.h.Ljava_io_OutputStream();
ScalaJS.c.jl_StandardErr$.prototype.constructor = ScalaJS.c.jl_StandardErr$;
/** @constructor */
ScalaJS.h.jl_StandardErr$ = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_StandardErr$.prototype = ScalaJS.c.jl_StandardErr$.prototype;
ScalaJS.c.jl_StandardErr$.prototype.write__I__V = (function(b) {
  ScalaJS.m.jl_StandardErrPrintStream().print__T__V(ScalaJS.objectToString(ScalaJS.bC((b & 65535))))
});
/*<skip>*/;
ScalaJS.is.jl_StandardErr$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_StandardErr$)))
});
ScalaJS.as.jl_StandardErr$ = (function(obj) {
  if ((ScalaJS.is.jl_StandardErr$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.StandardErr$")
  }
});
ScalaJS.isArrayOf.jl_StandardErr$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_StandardErr$)))
});
ScalaJS.asArrayOf.jl_StandardErr$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_StandardErr$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.StandardErr$;", depth)
  }
});
ScalaJS.d.jl_StandardErr$ = new ScalaJS.ClassTypeData({
  jl_StandardErr$: 0
}, false, "java.lang.StandardErr$", ScalaJS.d.Ljava_io_OutputStream, {
  jl_StandardErr$: 1,
  Ljava_io_OutputStream: 1,
  Ljava_io_Flushable: 1,
  Ljava_io_Closeable: 1,
  O: 1
});
ScalaJS.c.jl_StandardErr$.prototype.$classData = ScalaJS.d.jl_StandardErr$;
ScalaJS.n.jl_StandardErr = undefined;
ScalaJS.m.jl_StandardErr = (function() {
  if ((!ScalaJS.n.jl_StandardErr)) {
    ScalaJS.n.jl_StandardErr = new ScalaJS.c.jl_StandardErr$().init___()
  };
  return ScalaJS.n.jl_StandardErr
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_StandardOut$ = (function() {
  ScalaJS.c.Ljava_io_OutputStream.call(this)
});
ScalaJS.c.jl_StandardOut$.prototype = new ScalaJS.h.Ljava_io_OutputStream();
ScalaJS.c.jl_StandardOut$.prototype.constructor = ScalaJS.c.jl_StandardOut$;
/** @constructor */
ScalaJS.h.jl_StandardOut$ = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_StandardOut$.prototype = ScalaJS.c.jl_StandardOut$.prototype;
ScalaJS.c.jl_StandardOut$.prototype.write__I__V = (function(b) {
  ScalaJS.m.jl_StandardOutPrintStream().print__T__V(ScalaJS.objectToString(ScalaJS.bC((b & 65535))))
});
/*<skip>*/;
ScalaJS.is.jl_StandardOut$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_StandardOut$)))
});
ScalaJS.as.jl_StandardOut$ = (function(obj) {
  if ((ScalaJS.is.jl_StandardOut$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.StandardOut$")
  }
});
ScalaJS.isArrayOf.jl_StandardOut$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_StandardOut$)))
});
ScalaJS.asArrayOf.jl_StandardOut$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_StandardOut$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.StandardOut$;", depth)
  }
});
ScalaJS.d.jl_StandardOut$ = new ScalaJS.ClassTypeData({
  jl_StandardOut$: 0
}, false, "java.lang.StandardOut$", ScalaJS.d.Ljava_io_OutputStream, {
  jl_StandardOut$: 1,
  Ljava_io_OutputStream: 1,
  Ljava_io_Flushable: 1,
  Ljava_io_Closeable: 1,
  O: 1
});
ScalaJS.c.jl_StandardOut$.prototype.$classData = ScalaJS.d.jl_StandardOut$;
ScalaJS.n.jl_StandardOut = undefined;
ScalaJS.m.jl_StandardOut = (function() {
  if ((!ScalaJS.n.jl_StandardOut)) {
    ScalaJS.n.jl_StandardOut = new ScalaJS.c.jl_StandardOut$().init___()
  };
  return ScalaJS.n.jl_StandardOut
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_Console$ = (function() {
  ScalaJS.c.s_DeprecatedConsole.call(this);
  this.outVar$2 = null;
  this.errVar$2 = null;
  this.inVar$2 = null
});
ScalaJS.c.s_Console$.prototype = new ScalaJS.h.s_DeprecatedConsole();
ScalaJS.c.s_Console$.prototype.constructor = ScalaJS.c.s_Console$;
/** @constructor */
ScalaJS.h.s_Console$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Console$.prototype = ScalaJS.c.s_Console$.prototype;
ScalaJS.c.s_Console$.prototype.outVar__p2__s_util_DynamicVariable = (function() {
  return this.outVar$2
});
ScalaJS.c.s_Console$.prototype.errVar__p2__s_util_DynamicVariable = (function() {
  return this.errVar$2
});
ScalaJS.c.s_Console$.prototype.out__Ljava_io_PrintStream = (function() {
  return ScalaJS.as.Ljava_io_PrintStream(this.outVar__p2__s_util_DynamicVariable().value__O())
});
ScalaJS.c.s_Console$.prototype.err__Ljava_io_PrintStream = (function() {
  return ScalaJS.as.Ljava_io_PrintStream(this.errVar__p2__s_util_DynamicVariable().value__O())
});
ScalaJS.c.s_Console$.prototype.println__O__V = (function(x) {
  this.out__Ljava_io_PrintStream().println__O__V(x)
});
ScalaJS.c.s_Console$.prototype.init___ = (function() {
  ScalaJS.c.s_DeprecatedConsole.prototype.init___.call(this);
  ScalaJS.n.s_Console = this;
  ScalaJS.i.s_io_AnsiColor$class__$init$__s_io_AnsiColor__V(this);
  this.outVar$2 = new ScalaJS.c.s_util_DynamicVariable().init___O(ScalaJS.m.jl_System().out__Ljava_io_PrintStream());
  this.errVar$2 = new ScalaJS.c.s_util_DynamicVariable().init___O(ScalaJS.m.jl_System().err__Ljava_io_PrintStream());
  this.inVar$2 = new ScalaJS.c.s_util_DynamicVariable().init___O(null);
  return this
});
/*<skip>*/;
ScalaJS.is.s_Console$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_Console$)))
});
ScalaJS.as.s_Console$ = (function(obj) {
  if ((ScalaJS.is.s_Console$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.Console$")
  }
});
ScalaJS.isArrayOf.s_Console$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_Console$)))
});
ScalaJS.asArrayOf.s_Console$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_Console$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.Console$;", depth)
  }
});
ScalaJS.d.s_Console$ = new ScalaJS.ClassTypeData({
  s_Console$: 0
}, false, "scala.Console$", ScalaJS.d.s_DeprecatedConsole, {
  s_Console$: 1,
  s_io_AnsiColor: 1,
  s_DeprecatedConsole: 1,
  O: 1
});
ScalaJS.c.s_Console$.prototype.$classData = ScalaJS.d.s_Console$;
ScalaJS.n.s_Console = undefined;
ScalaJS.m.s_Console = (function() {
  if ((!ScalaJS.n.s_Console)) {
    ScalaJS.n.s_Console = new ScalaJS.c.s_Console$().init___()
  };
  return ScalaJS.n.s_Console
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_None$ = (function() {
  ScalaJS.c.s_Option.call(this)
});
ScalaJS.c.s_None$.prototype = new ScalaJS.h.s_Option();
ScalaJS.c.s_None$.prototype.constructor = ScalaJS.c.s_None$;
/** @constructor */
ScalaJS.h.s_None$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_None$.prototype = ScalaJS.c.s_None$.prototype;
ScalaJS.c.s_None$.prototype.isEmpty__Z = (function() {
  return true
});
ScalaJS.c.s_None$.prototype.get__sr_Nothing$ = (function() {
  throw new ScalaJS.c.ju_NoSuchElementException().init___T("None.get")
});
ScalaJS.c.s_None$.prototype.productPrefix__T = (function() {
  return "None"
});
ScalaJS.c.s_None$.prototype.productArity__I = (function() {
  return 0
});
ScalaJS.c.s_None$.prototype.productElement__I__O = (function(x$1) {
  var x1 = x$1;
  throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1))
});
ScalaJS.c.s_None$.prototype.productIterator__sc_Iterator = (function() {
  return ScalaJS.m.sr_ScalaRunTime().typedProductIterator__s_Product__sc_Iterator(this)
});
ScalaJS.c.s_None$.prototype.hashCode__I = (function() {
  return 2433880
});
ScalaJS.c.s_None$.prototype.toString__T = (function() {
  return "None"
});
ScalaJS.c.s_None$.prototype.get__O = (function() {
  this.get__sr_Nothing$()
});
/*<skip>*/;
ScalaJS.is.s_None$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_None$)))
});
ScalaJS.as.s_None$ = (function(obj) {
  if ((ScalaJS.is.s_None$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.None$")
  }
});
ScalaJS.isArrayOf.s_None$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_None$)))
});
ScalaJS.asArrayOf.s_None$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_None$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.None$;", depth)
  }
});
ScalaJS.d.s_None$ = new ScalaJS.ClassTypeData({
  s_None$: 0
}, false, "scala.None$", ScalaJS.d.s_Option, {
  s_None$: 1,
  s_Option: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.s_None$.prototype.$classData = ScalaJS.d.s_None$;
ScalaJS.n.s_None = undefined;
ScalaJS.m.s_None = (function() {
  if ((!ScalaJS.n.s_None)) {
    ScalaJS.n.s_None = new ScalaJS.c.s_None$().init___()
  };
  return ScalaJS.n.s_None
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_Predef$ = (function() {
  ScalaJS.c.s_LowPriorityImplicits.call(this);
  this.Map$2 = null;
  this.Set$2 = null;
  this.ClassManifest$2 = null;
  this.Manifest$2 = null;
  this.NoManifest$2 = null;
  this.StringCanBuildFrom$2 = null;
  this.singleton$und$less$colon$less$2 = null;
  this.scala$Predef$$singleton$und$eq$colon$eq$f = null
});
ScalaJS.c.s_Predef$.prototype = new ScalaJS.h.s_LowPriorityImplicits();
ScalaJS.c.s_Predef$.prototype.constructor = ScalaJS.c.s_Predef$;
/** @constructor */
ScalaJS.h.s_Predef$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Predef$.prototype = ScalaJS.c.s_Predef$.prototype;
ScalaJS.c.s_Predef$.prototype.assert__Z__V = (function(assertion) {
  if ((!assertion)) {
    throw new ScalaJS.c.jl_AssertionError().init___O("assertion failed")
  }
});
ScalaJS.c.s_Predef$.prototype.require__Z__V = (function(requirement) {
  if ((!requirement)) {
    throw new ScalaJS.c.jl_IllegalArgumentException().init___T("requirement failed")
  }
});
ScalaJS.c.s_Predef$.prototype.require__Z__F0__V = (function(requirement, message) {
  if ((!requirement)) {
    throw new ScalaJS.c.jl_IllegalArgumentException().init___T(("requirement failed: " + message.apply__O()))
  }
});
ScalaJS.c.s_Predef$.prototype.ArrowAssoc__O__O = (function(self) {
  return self
});
ScalaJS.c.s_Predef$.prototype.augmentString__T__T = (function(x) {
  return x
});
ScalaJS.c.s_Predef$.prototype.println__O__V = (function(x) {
  ScalaJS.m.s_Console().println__O__V(x)
});
ScalaJS.c.s_Predef$.prototype.init___ = (function() {
  ScalaJS.c.s_LowPriorityImplicits.prototype.init___.call(this);
  ScalaJS.n.s_Predef = this;
  ScalaJS.i.s_DeprecatedPredef$class__$init$__s_Predef$__V(this);
  ScalaJS.m.s_package();
  ScalaJS.m.sci_List();
  this.Map$2 = ScalaJS.m.sci_Map();
  this.Set$2 = ScalaJS.m.sci_Set();
  this.ClassManifest$2 = ScalaJS.m.s_reflect_package().ClassManifest__s_reflect_ClassManifestFactory$();
  this.Manifest$2 = ScalaJS.m.s_reflect_package().Manifest__s_reflect_ManifestFactory$();
  this.NoManifest$2 = ScalaJS.m.s_reflect_NoManifest();
  this.StringCanBuildFrom$2 = new ScalaJS.c.s_Predef$$anon$3().init___();
  this.singleton$und$less$colon$less$2 = new ScalaJS.c.s_Predef$$anon$1().init___();
  this.scala$Predef$$singleton$und$eq$colon$eq$f = new ScalaJS.c.s_Predef$$anon$2().init___();
  return this
});
/*<skip>*/;
ScalaJS.is.s_Predef$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_Predef$)))
});
ScalaJS.as.s_Predef$ = (function(obj) {
  if ((ScalaJS.is.s_Predef$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.Predef$")
  }
});
ScalaJS.isArrayOf.s_Predef$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_Predef$)))
});
ScalaJS.asArrayOf.s_Predef$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_Predef$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.Predef$;", depth)
  }
});
ScalaJS.d.s_Predef$ = new ScalaJS.ClassTypeData({
  s_Predef$: 0
}, false, "scala.Predef$", ScalaJS.d.s_LowPriorityImplicits, {
  s_Predef$: 1,
  s_DeprecatedPredef: 1,
  s_LowPriorityImplicits: 1,
  O: 1
});
ScalaJS.c.s_Predef$.prototype.$classData = ScalaJS.d.s_Predef$;
ScalaJS.n.s_Predef = undefined;
ScalaJS.m.s_Predef = (function() {
  if ((!ScalaJS.n.s_Predef)) {
    ScalaJS.n.s_Predef = new ScalaJS.c.s_Predef$().init___()
  };
  return ScalaJS.n.s_Predef
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_Predef$$anon$1 = (function() {
  ScalaJS.c.s_Predef$$less$colon$less.call(this)
});
ScalaJS.c.s_Predef$$anon$1.prototype = new ScalaJS.h.s_Predef$$less$colon$less();
ScalaJS.c.s_Predef$$anon$1.prototype.constructor = ScalaJS.c.s_Predef$$anon$1;
/** @constructor */
ScalaJS.h.s_Predef$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Predef$$anon$1.prototype = ScalaJS.c.s_Predef$$anon$1.prototype;
ScalaJS.c.s_Predef$$anon$1.prototype.apply__O__O = (function(x) {
  return x
});
/*<skip>*/;
ScalaJS.is.s_Predef$$anon$1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_Predef$$anon$1)))
});
ScalaJS.as.s_Predef$$anon$1 = (function(obj) {
  if ((ScalaJS.is.s_Predef$$anon$1(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.Predef$$anon$1")
  }
});
ScalaJS.isArrayOf.s_Predef$$anon$1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_Predef$$anon$1)))
});
ScalaJS.asArrayOf.s_Predef$$anon$1 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_Predef$$anon$1(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.Predef$$anon$1;", depth)
  }
});
ScalaJS.d.s_Predef$$anon$1 = new ScalaJS.ClassTypeData({
  s_Predef$$anon$1: 0
}, false, "scala.Predef$$anon$1", ScalaJS.d.s_Predef$$less$colon$less, {
  s_Predef$$anon$1: 1,
  s_Predef$$less$colon$less: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  F1: 1,
  O: 1
});
ScalaJS.c.s_Predef$$anon$1.prototype.$classData = ScalaJS.d.s_Predef$$anon$1;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_Predef$$anon$2 = (function() {
  ScalaJS.c.s_Predef$$eq$colon$eq.call(this)
});
ScalaJS.c.s_Predef$$anon$2.prototype = new ScalaJS.h.s_Predef$$eq$colon$eq();
ScalaJS.c.s_Predef$$anon$2.prototype.constructor = ScalaJS.c.s_Predef$$anon$2;
/** @constructor */
ScalaJS.h.s_Predef$$anon$2 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Predef$$anon$2.prototype = ScalaJS.c.s_Predef$$anon$2.prototype;
ScalaJS.c.s_Predef$$anon$2.prototype.apply__O__O = (function(x) {
  return x
});
/*<skip>*/;
ScalaJS.is.s_Predef$$anon$2 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_Predef$$anon$2)))
});
ScalaJS.as.s_Predef$$anon$2 = (function(obj) {
  if ((ScalaJS.is.s_Predef$$anon$2(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.Predef$$anon$2")
  }
});
ScalaJS.isArrayOf.s_Predef$$anon$2 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_Predef$$anon$2)))
});
ScalaJS.asArrayOf.s_Predef$$anon$2 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_Predef$$anon$2(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.Predef$$anon$2;", depth)
  }
});
ScalaJS.d.s_Predef$$anon$2 = new ScalaJS.ClassTypeData({
  s_Predef$$anon$2: 0
}, false, "scala.Predef$$anon$2", ScalaJS.d.s_Predef$$eq$colon$eq, {
  s_Predef$$anon$2: 1,
  s_Predef$$eq$colon$eq: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  F1: 1,
  O: 1
});
ScalaJS.c.s_Predef$$anon$2.prototype.$classData = ScalaJS.d.s_Predef$$anon$2;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_Some = (function() {
  ScalaJS.c.s_Option.call(this);
  this.x$2 = null
});
ScalaJS.c.s_Some.prototype = new ScalaJS.h.s_Option();
ScalaJS.c.s_Some.prototype.constructor = ScalaJS.c.s_Some;
/** @constructor */
ScalaJS.h.s_Some = (function() {
  /*<skip>*/
});
ScalaJS.h.s_Some.prototype = ScalaJS.c.s_Some.prototype;
ScalaJS.c.s_Some.prototype.x__O = (function() {
  return this.x$2
});
ScalaJS.c.s_Some.prototype.isEmpty__Z = (function() {
  return false
});
ScalaJS.c.s_Some.prototype.get__O = (function() {
  return this.x__O()
});
ScalaJS.c.s_Some.prototype.productPrefix__T = (function() {
  return "Some"
});
ScalaJS.c.s_Some.prototype.productArity__I = (function() {
  return 1
});
ScalaJS.c.s_Some.prototype.productElement__I__O = (function(x$1) {
  var x1 = x$1;
  switch (x1) {
    case 0:
      {
        return this.x__O();
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.s_Some.prototype.productIterator__sc_Iterator = (function() {
  return ScalaJS.m.sr_ScalaRunTime().typedProductIterator__s_Product__sc_Iterator(this)
});
ScalaJS.c.s_Some.prototype.hashCode__I = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undhashCode__s_Product__I(this)
});
ScalaJS.c.s_Some.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.s_Some.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else {
    var x1 = x$1;
    matchEnd4: {
      if (ScalaJS.is.s_Some(x1)) {
        var jsx$1 = true;
        break matchEnd4
      };
      var jsx$1 = false;
      break matchEnd4
    };
    if (jsx$1) {
      var Some$1 = ScalaJS.as.s_Some(x$1);
      return ScalaJS.anyEqEq(this.x__O(), Some$1.x__O())
    } else {
      return false
    }
  }
});
ScalaJS.c.s_Some.prototype.init___O = (function(x) {
  this.x$2 = x;
  ScalaJS.c.s_Option.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.s_Some = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_Some)))
});
ScalaJS.as.s_Some = (function(obj) {
  if ((ScalaJS.is.s_Some(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.Some")
  }
});
ScalaJS.isArrayOf.s_Some = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_Some)))
});
ScalaJS.asArrayOf.s_Some = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_Some(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.Some;", depth)
  }
});
ScalaJS.d.s_Some = new ScalaJS.ClassTypeData({
  s_Some: 0
}, false, "scala.Some", ScalaJS.d.s_Option, {
  s_Some: 1,
  s_Option: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  O: 1
});
ScalaJS.c.s_Some.prototype.$classData = ScalaJS.d.s_Some;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_concurrent_impl_Promise$DefaultPromise = (function() {
  ScalaJS.c.s_concurrent_impl_AbstractPromise.call(this)
});
ScalaJS.c.s_concurrent_impl_Promise$DefaultPromise.prototype = new ScalaJS.h.s_concurrent_impl_AbstractPromise();
ScalaJS.c.s_concurrent_impl_Promise$DefaultPromise.prototype.constructor = ScalaJS.c.s_concurrent_impl_Promise$DefaultPromise;
/** @constructor */
ScalaJS.h.s_concurrent_impl_Promise$DefaultPromise = (function() {
  /*<skip>*/
});
ScalaJS.h.s_concurrent_impl_Promise$DefaultPromise.prototype = ScalaJS.c.s_concurrent_impl_Promise$DefaultPromise.prototype;
ScalaJS.c.s_concurrent_impl_Promise$DefaultPromise.prototype.future__s_concurrent_impl_Promise = (function() {
  return ScalaJS.i.s_concurrent_impl_Promise$class__future__s_concurrent_impl_Promise__s_concurrent_impl_Promise(this)
});
ScalaJS.c.s_concurrent_impl_Promise$DefaultPromise.prototype.complete__s_util_Try__s_concurrent_Promise = (function(result) {
  return ScalaJS.i.s_concurrent_Promise$class__complete__s_concurrent_Promise__s_util_Try__s_concurrent_Promise(this, result)
});
ScalaJS.c.s_concurrent_impl_Promise$DefaultPromise.prototype.success__O__s_concurrent_Promise = (function(value) {
  return ScalaJS.i.s_concurrent_Promise$class__success__s_concurrent_Promise__O__s_concurrent_Promise(this, value)
});
ScalaJS.c.s_concurrent_impl_Promise$DefaultPromise.prototype.failure__jl_Throwable__s_concurrent_Promise = (function(cause) {
  return ScalaJS.i.s_concurrent_Promise$class__failure__s_concurrent_Promise__jl_Throwable__s_concurrent_Promise(this, cause)
});
ScalaJS.c.s_concurrent_impl_Promise$DefaultPromise.prototype.compressedRoot__p2__s_concurrent_impl_Promise$DefaultPromise = (function() {
  var _$this = this;
  tailCallLoop: while (true) {
    var x1 = _$this.getState__O();
    if (ScalaJS.is.s_concurrent_impl_Promise$DefaultPromise(x1)) {
      var x2 = ScalaJS.as.s_concurrent_impl_Promise$DefaultPromise(x1);
      var target = x2.root__p2__s_concurrent_impl_Promise$DefaultPromise();
      if ((x2 === target)) {
        return target
      } else {
        if (_$this.updateState__O__O__Z(x2, target)) {
          return target
        } else {
          continue tailCallLoop
        }
      }
    };
    return _$this
  }
});
ScalaJS.c.s_concurrent_impl_Promise$DefaultPromise.prototype.root__p2__s_concurrent_impl_Promise$DefaultPromise = (function() {
  var _$this = this;
  tailCallLoop: while (true) {
    var x1 = _$this.getState__O();
    if (ScalaJS.is.s_concurrent_impl_Promise$DefaultPromise(x1)) {
      var x2 = ScalaJS.as.s_concurrent_impl_Promise$DefaultPromise(x1);
      _$this = x2;
      continue tailCallLoop
    };
    return _$this
  }
});
ScalaJS.c.s_concurrent_impl_Promise$DefaultPromise.prototype.tryComplete__s_util_Try__Z = (function(value) {
  var resolved = ScalaJS.m.s_concurrent_impl_Promise().scala$concurrent$impl$Promise$$resolveTry__s_util_Try__s_util_Try(value);
  var x1 = this.tryCompleteAndGetListeners__p2__s_util_Try__sci_List(resolved);
  if ((null === x1)) {
    return false
  };
  if (x1.isEmpty__Z()) {
    return true
  };
  x1.foreach__F1__V(new ScalaJS.c.sjsr_AnonFunction1().init___sjs_js_Function1((function(r$2) {
    var r = ScalaJS.as.s_concurrent_impl_CallbackRunnable(r$2);
    this.$$anonfun$1__p2__s_concurrent_impl_CallbackRunnable__s_util_Try__V(r, resolved)
  })["bind"](this)));
  return true
});
ScalaJS.c.s_concurrent_impl_Promise$DefaultPromise.prototype.tryCompleteAndGetListeners__p2__s_util_Try__sci_List = (function(v) {
  var _$this = this;
  tailCallLoop: while (true) {
    var x1 = _$this.getState__O();
    if (ScalaJS.is.sci_List(x1)) {
      var x2 = ScalaJS.as.sci_List(x1);
      var cur = x2;
      if (_$this.updateState__O__O__Z(cur, v)) {
        return cur
      } else {
        continue tailCallLoop
      }
    };
    if (ScalaJS.is.s_concurrent_impl_Promise$DefaultPromise(x1)) {
      _$this = _$this.compressedRoot__p2__s_concurrent_impl_Promise$DefaultPromise();
      continue tailCallLoop
    };
    return null
  }
});
ScalaJS.c.s_concurrent_impl_Promise$DefaultPromise.prototype.onComplete__F1__s_concurrent_ExecutionContext__V = (function(func, executor) {
  var preparedEC = executor.prepare__s_concurrent_ExecutionContext();
  var runnable = new ScalaJS.c.s_concurrent_impl_CallbackRunnable().init___s_concurrent_ExecutionContext__F1(preparedEC, func);
  this.dispatchOrAddCallback__p2__s_concurrent_impl_CallbackRunnable__V(runnable)
});
ScalaJS.c.s_concurrent_impl_Promise$DefaultPromise.prototype.dispatchOrAddCallback__p2__s_concurrent_impl_CallbackRunnable__V = (function(runnable) {
  var _$this = this;
  tailCallLoop: while (true) {
    var x1 = _$this.getState__O();
    matchEnd6: {
      if (ScalaJS.is.s_util_Try(x1)) {
        var x2 = ScalaJS.as.s_util_Try(x1);
        runnable.executeWithValue__s_util_Try__V(x2);
        break matchEnd6
      };
      if (ScalaJS.is.s_concurrent_impl_Promise$DefaultPromise(x1)) {
        _$this = _$this.compressedRoot__p2__s_concurrent_impl_Promise$DefaultPromise();
        continue tailCallLoop;
        break matchEnd6
      };
      if (ScalaJS.is.sci_List(x1)) {
        var x4 = ScalaJS.as.sci_List(x1);
        var x$1 = runnable;
        var jsx$2 = x4.$$colon$colon__O__sci_List(x$1);
        var jsx$1 = _$this.updateState__O__O__Z(x4, jsx$2);
        if (jsx$1) {
          break matchEnd6
        } else {
          continue tailCallLoop;
          break matchEnd6
        }
      };
      throw new ScalaJS.c.s_MatchError().init___O(x1)
    };
    return undefined
  }
});
ScalaJS.c.s_concurrent_impl_Promise$DefaultPromise.prototype.future__s_concurrent_Future = (function() {
  return this.future__s_concurrent_impl_Promise()
});
ScalaJS.c.s_concurrent_impl_Promise$DefaultPromise.prototype.$$anonfun$1__p2__s_concurrent_impl_CallbackRunnable__s_util_Try__V = (function(r, resolved$1) {
  r.executeWithValue__s_util_Try__V(resolved$1)
});
ScalaJS.c.s_concurrent_impl_Promise$DefaultPromise.prototype.init___ = (function() {
  ScalaJS.c.s_concurrent_impl_AbstractPromise.prototype.init___.call(this);
  ScalaJS.i.s_concurrent_Promise$class__$init$__s_concurrent_Promise__V(this);
  ScalaJS.i.s_concurrent_Future$class__$init$__s_concurrent_Future__V(this);
  ScalaJS.i.s_concurrent_impl_Promise$class__$init$__s_concurrent_impl_Promise__V(this);
  this.updateState__O__O__Z(null, ScalaJS.m.sci_Nil());
  return this
});
/*<skip>*/;
ScalaJS.is.s_concurrent_impl_Promise$DefaultPromise = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_concurrent_impl_Promise$DefaultPromise)))
});
ScalaJS.as.s_concurrent_impl_Promise$DefaultPromise = (function(obj) {
  if ((ScalaJS.is.s_concurrent_impl_Promise$DefaultPromise(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.concurrent.impl.Promise$DefaultPromise")
  }
});
ScalaJS.isArrayOf.s_concurrent_impl_Promise$DefaultPromise = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_concurrent_impl_Promise$DefaultPromise)))
});
ScalaJS.asArrayOf.s_concurrent_impl_Promise$DefaultPromise = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_concurrent_impl_Promise$DefaultPromise(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.concurrent.impl.Promise$DefaultPromise;", depth)
  }
});
ScalaJS.d.s_concurrent_impl_Promise$DefaultPromise = new ScalaJS.ClassTypeData({
  s_concurrent_impl_Promise$DefaultPromise: 0
}, false, "scala.concurrent.impl.Promise$DefaultPromise", ScalaJS.d.s_concurrent_impl_AbstractPromise, {
  s_concurrent_impl_Promise$DefaultPromise: 1,
  s_concurrent_impl_Promise: 1,
  s_concurrent_Future: 1,
  s_concurrent_Awaitable: 1,
  s_concurrent_Promise: 1,
  s_concurrent_impl_AbstractPromise: 1,
  O: 1
});
ScalaJS.c.s_concurrent_impl_Promise$DefaultPromise.prototype.$classData = ScalaJS.d.s_concurrent_impl_Promise$DefaultPromise;
/*<skip>*/;
ScalaJS.is.s_math_ScalaNumber = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_math_ScalaNumber)))
});
ScalaJS.as.s_math_ScalaNumber = (function(obj) {
  if ((ScalaJS.is.s_math_ScalaNumber(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.math.ScalaNumber")
  }
});
ScalaJS.isArrayOf.s_math_ScalaNumber = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_math_ScalaNumber)))
});
ScalaJS.asArrayOf.s_math_ScalaNumber = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_math_ScalaNumber(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.math.ScalaNumber;", depth)
  }
});
ScalaJS.d.s_math_ScalaNumber = new ScalaJS.ClassTypeData({
  s_math_ScalaNumber: 0
}, false, "scala.math.ScalaNumber", ScalaJS.d.jl_Number, {
  s_math_ScalaNumber: 1,
  jl_Number: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$10 = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$10.prototype = new ScalaJS.h.s_reflect_AnyValManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$10.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$10;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$10 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$10.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$10.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$10.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.prototype.init___T.call(this, "Long");
  return this
});
/*<skip>*/;
ScalaJS.is.s_reflect_ManifestFactory$$anon$10 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ManifestFactory$$anon$10)))
});
ScalaJS.as.s_reflect_ManifestFactory$$anon$10 = (function(obj) {
  if ((ScalaJS.is.s_reflect_ManifestFactory$$anon$10(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.reflect.ManifestFactory$$anon$10")
  }
});
ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$10 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ManifestFactory$$anon$10)))
});
ScalaJS.asArrayOf.s_reflect_ManifestFactory$$anon$10 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$10(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ManifestFactory$$anon$10;", depth)
  }
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$10 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$10: 0
}, false, "scala.reflect.ManifestFactory$$anon$10", ScalaJS.d.s_reflect_AnyValManifest, {
  s_reflect_ManifestFactory$$anon$10: 1,
  s_reflect_AnyValManifest: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_Equals: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$10.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$10;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$11 = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$11.prototype = new ScalaJS.h.s_reflect_AnyValManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$11.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$11;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$11 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$11.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$11.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$11.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.prototype.init___T.call(this, "Float");
  return this
});
/*<skip>*/;
ScalaJS.is.s_reflect_ManifestFactory$$anon$11 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ManifestFactory$$anon$11)))
});
ScalaJS.as.s_reflect_ManifestFactory$$anon$11 = (function(obj) {
  if ((ScalaJS.is.s_reflect_ManifestFactory$$anon$11(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.reflect.ManifestFactory$$anon$11")
  }
});
ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$11 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ManifestFactory$$anon$11)))
});
ScalaJS.asArrayOf.s_reflect_ManifestFactory$$anon$11 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$11(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ManifestFactory$$anon$11;", depth)
  }
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$11 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$11: 0
}, false, "scala.reflect.ManifestFactory$$anon$11", ScalaJS.d.s_reflect_AnyValManifest, {
  s_reflect_ManifestFactory$$anon$11: 1,
  s_reflect_AnyValManifest: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_Equals: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$11.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$11;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$12 = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$12.prototype = new ScalaJS.h.s_reflect_AnyValManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$12.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$12;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$12 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$12.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$12.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$12.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.prototype.init___T.call(this, "Double");
  return this
});
/*<skip>*/;
ScalaJS.is.s_reflect_ManifestFactory$$anon$12 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ManifestFactory$$anon$12)))
});
ScalaJS.as.s_reflect_ManifestFactory$$anon$12 = (function(obj) {
  if ((ScalaJS.is.s_reflect_ManifestFactory$$anon$12(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.reflect.ManifestFactory$$anon$12")
  }
});
ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$12 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ManifestFactory$$anon$12)))
});
ScalaJS.asArrayOf.s_reflect_ManifestFactory$$anon$12 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$12(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ManifestFactory$$anon$12;", depth)
  }
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$12 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$12: 0
}, false, "scala.reflect.ManifestFactory$$anon$12", ScalaJS.d.s_reflect_AnyValManifest, {
  s_reflect_ManifestFactory$$anon$12: 1,
  s_reflect_AnyValManifest: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_Equals: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$12.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$12;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$13 = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$13.prototype = new ScalaJS.h.s_reflect_AnyValManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$13.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$13;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$13 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$13.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$13.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$13.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.prototype.init___T.call(this, "Boolean");
  return this
});
/*<skip>*/;
ScalaJS.is.s_reflect_ManifestFactory$$anon$13 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ManifestFactory$$anon$13)))
});
ScalaJS.as.s_reflect_ManifestFactory$$anon$13 = (function(obj) {
  if ((ScalaJS.is.s_reflect_ManifestFactory$$anon$13(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.reflect.ManifestFactory$$anon$13")
  }
});
ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$13 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ManifestFactory$$anon$13)))
});
ScalaJS.asArrayOf.s_reflect_ManifestFactory$$anon$13 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$13(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ManifestFactory$$anon$13;", depth)
  }
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$13 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$13: 0
}, false, "scala.reflect.ManifestFactory$$anon$13", ScalaJS.d.s_reflect_AnyValManifest, {
  s_reflect_ManifestFactory$$anon$13: 1,
  s_reflect_AnyValManifest: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_Equals: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$13.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$13;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$14 = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$14.prototype = new ScalaJS.h.s_reflect_AnyValManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$14.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$14;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$14 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$14.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$14.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$14.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.prototype.init___T.call(this, "Unit");
  return this
});
/*<skip>*/;
ScalaJS.is.s_reflect_ManifestFactory$$anon$14 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ManifestFactory$$anon$14)))
});
ScalaJS.as.s_reflect_ManifestFactory$$anon$14 = (function(obj) {
  if ((ScalaJS.is.s_reflect_ManifestFactory$$anon$14(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.reflect.ManifestFactory$$anon$14")
  }
});
ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$14 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ManifestFactory$$anon$14)))
});
ScalaJS.asArrayOf.s_reflect_ManifestFactory$$anon$14 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$14(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ManifestFactory$$anon$14;", depth)
  }
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$14 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$14: 0
}, false, "scala.reflect.ManifestFactory$$anon$14", ScalaJS.d.s_reflect_AnyValManifest, {
  s_reflect_ManifestFactory$$anon$14: 1,
  s_reflect_AnyValManifest: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_Equals: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$14.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$14;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$6 = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$6.prototype = new ScalaJS.h.s_reflect_AnyValManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$6.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$6;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$6 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$6.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$6.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$6.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.prototype.init___T.call(this, "Byte");
  return this
});
/*<skip>*/;
ScalaJS.is.s_reflect_ManifestFactory$$anon$6 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ManifestFactory$$anon$6)))
});
ScalaJS.as.s_reflect_ManifestFactory$$anon$6 = (function(obj) {
  if ((ScalaJS.is.s_reflect_ManifestFactory$$anon$6(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.reflect.ManifestFactory$$anon$6")
  }
});
ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$6 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ManifestFactory$$anon$6)))
});
ScalaJS.asArrayOf.s_reflect_ManifestFactory$$anon$6 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$6(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ManifestFactory$$anon$6;", depth)
  }
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$6 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$6: 0
}, false, "scala.reflect.ManifestFactory$$anon$6", ScalaJS.d.s_reflect_AnyValManifest, {
  s_reflect_ManifestFactory$$anon$6: 1,
  s_reflect_AnyValManifest: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_Equals: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$6.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$6;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$7 = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$7.prototype = new ScalaJS.h.s_reflect_AnyValManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$7.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$7;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$7 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$7.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$7.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$7.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.prototype.init___T.call(this, "Short");
  return this
});
/*<skip>*/;
ScalaJS.is.s_reflect_ManifestFactory$$anon$7 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ManifestFactory$$anon$7)))
});
ScalaJS.as.s_reflect_ManifestFactory$$anon$7 = (function(obj) {
  if ((ScalaJS.is.s_reflect_ManifestFactory$$anon$7(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.reflect.ManifestFactory$$anon$7")
  }
});
ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$7 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ManifestFactory$$anon$7)))
});
ScalaJS.asArrayOf.s_reflect_ManifestFactory$$anon$7 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$7(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ManifestFactory$$anon$7;", depth)
  }
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$7 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$7: 0
}, false, "scala.reflect.ManifestFactory$$anon$7", ScalaJS.d.s_reflect_AnyValManifest, {
  s_reflect_ManifestFactory$$anon$7: 1,
  s_reflect_AnyValManifest: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_Equals: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$7.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$7;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$8 = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$8.prototype = new ScalaJS.h.s_reflect_AnyValManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$8.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$8;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$8 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$8.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$8.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$8.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.prototype.init___T.call(this, "Char");
  return this
});
/*<skip>*/;
ScalaJS.is.s_reflect_ManifestFactory$$anon$8 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ManifestFactory$$anon$8)))
});
ScalaJS.as.s_reflect_ManifestFactory$$anon$8 = (function(obj) {
  if ((ScalaJS.is.s_reflect_ManifestFactory$$anon$8(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.reflect.ManifestFactory$$anon$8")
  }
});
ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$8 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ManifestFactory$$anon$8)))
});
ScalaJS.asArrayOf.s_reflect_ManifestFactory$$anon$8 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$8(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ManifestFactory$$anon$8;", depth)
  }
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$8 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$8: 0
}, false, "scala.reflect.ManifestFactory$$anon$8", ScalaJS.d.s_reflect_AnyValManifest, {
  s_reflect_ManifestFactory$$anon$8: 1,
  s_reflect_AnyValManifest: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_Equals: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$8.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$8;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$9 = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$9.prototype = new ScalaJS.h.s_reflect_AnyValManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$9.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$9;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$9 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$9.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$9.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$9.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_AnyValManifest.prototype.init___T.call(this, "Int");
  return this
});
/*<skip>*/;
ScalaJS.is.s_reflect_ManifestFactory$$anon$9 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ManifestFactory$$anon$9)))
});
ScalaJS.as.s_reflect_ManifestFactory$$anon$9 = (function(obj) {
  if ((ScalaJS.is.s_reflect_ManifestFactory$$anon$9(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.reflect.ManifestFactory$$anon$9")
  }
});
ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$9 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ManifestFactory$$anon$9)))
});
ScalaJS.asArrayOf.s_reflect_ManifestFactory$$anon$9 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$9(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ManifestFactory$$anon$9;", depth)
  }
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$9 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$9: 0
}, false, "scala.reflect.ManifestFactory$$anon$9", ScalaJS.d.s_reflect_AnyValManifest, {
  s_reflect_ManifestFactory$$anon$9: 1,
  s_reflect_AnyValManifest: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_Equals: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$9.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$9;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest = (function() {
  ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest.call(this);
  this.toString$2 = null;
  this.hashCode$2 = 0
});
ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype = new ScalaJS.h.s_reflect_ManifestFactory$ClassTypeManifest();
ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$PhantomManifest = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$PhantomManifest.prototype = ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype;
ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype.toString__T = (function() {
  return this.toString$2
});
ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype.equals__O__Z = (function(that) {
  return (this === that)
});
ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype.hashCode__I = (function() {
  return this.hashCode$2
});
ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype.init___jl_Class__T = (function(_runtimeClass, toString) {
  this.toString$2 = toString;
  ScalaJS.c.s_reflect_ManifestFactory$ClassTypeManifest.prototype.init___s_Option__jl_Class__sci_List.call(this, ScalaJS.m.s_None(), _runtimeClass, ScalaJS.m.sci_Nil());
  this.hashCode$2 = ScalaJS.m.jl_System().identityHashCode__O__I(this);
  return this
});
/*<skip>*/;
ScalaJS.is.s_reflect_ManifestFactory$PhantomManifest = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ManifestFactory$PhantomManifest)))
});
ScalaJS.as.s_reflect_ManifestFactory$PhantomManifest = (function(obj) {
  if ((ScalaJS.is.s_reflect_ManifestFactory$PhantomManifest(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.reflect.ManifestFactory$PhantomManifest")
  }
});
ScalaJS.isArrayOf.s_reflect_ManifestFactory$PhantomManifest = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ManifestFactory$PhantomManifest)))
});
ScalaJS.asArrayOf.s_reflect_ManifestFactory$PhantomManifest = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_reflect_ManifestFactory$PhantomManifest(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ManifestFactory$PhantomManifest;", depth)
  }
});
ScalaJS.d.s_reflect_ManifestFactory$PhantomManifest = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$PhantomManifest: 0
}, false, "scala.reflect.ManifestFactory$PhantomManifest", ScalaJS.d.s_reflect_ManifestFactory$ClassTypeManifest, {
  s_reflect_ManifestFactory$PhantomManifest: 1,
  s_reflect_ManifestFactory$ClassTypeManifest: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_Equals: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$PhantomManifest;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_util_Failure = (function() {
  ScalaJS.c.s_util_Try.call(this);
  this.exception$2 = null
});
ScalaJS.c.s_util_Failure.prototype = new ScalaJS.h.s_util_Try();
ScalaJS.c.s_util_Failure.prototype.constructor = ScalaJS.c.s_util_Failure;
/** @constructor */
ScalaJS.h.s_util_Failure = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_Failure.prototype = ScalaJS.c.s_util_Failure.prototype;
ScalaJS.c.s_util_Failure.prototype.exception__jl_Throwable = (function() {
  return this.exception$2
});
ScalaJS.c.s_util_Failure.prototype.productPrefix__T = (function() {
  return "Failure"
});
ScalaJS.c.s_util_Failure.prototype.productArity__I = (function() {
  return 1
});
ScalaJS.c.s_util_Failure.prototype.productElement__I__O = (function(x$1) {
  var x1 = x$1;
  switch (x1) {
    case 0:
      {
        return this.exception__jl_Throwable();
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.s_util_Failure.prototype.productIterator__sc_Iterator = (function() {
  return ScalaJS.m.sr_ScalaRunTime().typedProductIterator__s_Product__sc_Iterator(this)
});
ScalaJS.c.s_util_Failure.prototype.hashCode__I = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undhashCode__s_Product__I(this)
});
ScalaJS.c.s_util_Failure.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.s_util_Failure.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else {
    var x1 = x$1;
    matchEnd4: {
      if (ScalaJS.is.s_util_Failure(x1)) {
        var jsx$1 = true;
        break matchEnd4
      };
      var jsx$1 = false;
      break matchEnd4
    };
    if (jsx$1) {
      var Failure$1 = ScalaJS.as.s_util_Failure(x$1);
      return ScalaJS.anyRefEqEq(this.exception__jl_Throwable(), Failure$1.exception__jl_Throwable())
    } else {
      return false
    }
  }
});
ScalaJS.c.s_util_Failure.prototype.init___jl_Throwable = (function(exception) {
  this.exception$2 = exception;
  ScalaJS.c.s_util_Try.prototype.init___.call(this);
  ScalaJS.i.s_Product$class__$init$__s_Product__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.s_util_Failure = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_Failure)))
});
ScalaJS.as.s_util_Failure = (function(obj) {
  if ((ScalaJS.is.s_util_Failure(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.util.Failure")
  }
});
ScalaJS.isArrayOf.s_util_Failure = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_Failure)))
});
ScalaJS.asArrayOf.s_util_Failure = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_util_Failure(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.util.Failure;", depth)
  }
});
ScalaJS.d.s_util_Failure = new ScalaJS.ClassTypeData({
  s_util_Failure: 0
}, false, "scala.util.Failure", ScalaJS.d.s_util_Try, {
  s_util_Failure: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  s_util_Try: 1,
  O: 1
});
ScalaJS.c.s_util_Failure.prototype.$classData = ScalaJS.d.s_util_Failure;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_util_Random$ = (function() {
  ScalaJS.c.s_util_Random.call(this)
});
ScalaJS.c.s_util_Random$.prototype = new ScalaJS.h.s_util_Random();
ScalaJS.c.s_util_Random$.prototype.constructor = ScalaJS.c.s_util_Random$;
/** @constructor */
ScalaJS.h.s_util_Random$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_Random$.prototype = ScalaJS.c.s_util_Random$.prototype;
/*<skip>*/;
ScalaJS.is.s_util_Random$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_Random$)))
});
ScalaJS.as.s_util_Random$ = (function(obj) {
  if ((ScalaJS.is.s_util_Random$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.util.Random$")
  }
});
ScalaJS.isArrayOf.s_util_Random$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_Random$)))
});
ScalaJS.asArrayOf.s_util_Random$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_util_Random$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.util.Random$;", depth)
  }
});
ScalaJS.d.s_util_Random$ = new ScalaJS.ClassTypeData({
  s_util_Random$: 0
}, false, "scala.util.Random$", ScalaJS.d.s_util_Random, {
  s_util_Random$: 1,
  s_util_Random: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_util_Random$.prototype.$classData = ScalaJS.d.s_util_Random$;
ScalaJS.n.s_util_Random = undefined;
ScalaJS.m.s_util_Random = (function() {
  if ((!ScalaJS.n.s_util_Random)) {
    ScalaJS.n.s_util_Random = new ScalaJS.c.s_util_Random$().init___()
  };
  return ScalaJS.n.s_util_Random
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_util_Success = (function() {
  ScalaJS.c.s_util_Try.call(this);
  this.value$2 = null
});
ScalaJS.c.s_util_Success.prototype = new ScalaJS.h.s_util_Try();
ScalaJS.c.s_util_Success.prototype.constructor = ScalaJS.c.s_util_Success;
/** @constructor */
ScalaJS.h.s_util_Success = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_Success.prototype = ScalaJS.c.s_util_Success.prototype;
ScalaJS.c.s_util_Success.prototype.value__O = (function() {
  return this.value$2
});
ScalaJS.c.s_util_Success.prototype.productPrefix__T = (function() {
  return "Success"
});
ScalaJS.c.s_util_Success.prototype.productArity__I = (function() {
  return 1
});
ScalaJS.c.s_util_Success.prototype.productElement__I__O = (function(x$1) {
  var x1 = x$1;
  switch (x1) {
    case 0:
      {
        return this.value__O();
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.s_util_Success.prototype.productIterator__sc_Iterator = (function() {
  return ScalaJS.m.sr_ScalaRunTime().typedProductIterator__s_Product__sc_Iterator(this)
});
ScalaJS.c.s_util_Success.prototype.hashCode__I = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undhashCode__s_Product__I(this)
});
ScalaJS.c.s_util_Success.prototype.toString__T = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undtoString__s_Product__T(this)
});
ScalaJS.c.s_util_Success.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else {
    var x1 = x$1;
    matchEnd4: {
      if (ScalaJS.is.s_util_Success(x1)) {
        var jsx$1 = true;
        break matchEnd4
      };
      var jsx$1 = false;
      break matchEnd4
    };
    if (jsx$1) {
      var Success$1 = ScalaJS.as.s_util_Success(x$1);
      return ScalaJS.anyEqEq(this.value__O(), Success$1.value__O())
    } else {
      return false
    }
  }
});
ScalaJS.c.s_util_Success.prototype.init___O = (function(value) {
  this.value$2 = value;
  ScalaJS.c.s_util_Try.prototype.init___.call(this);
  ScalaJS.i.s_Product$class__$init$__s_Product__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.s_util_Success = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_Success)))
});
ScalaJS.as.s_util_Success = (function(obj) {
  if ((ScalaJS.is.s_util_Success(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.util.Success")
  }
});
ScalaJS.isArrayOf.s_util_Success = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_Success)))
});
ScalaJS.asArrayOf.s_util_Success = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_util_Success(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.util.Success;", depth)
  }
});
ScalaJS.d.s_util_Success = new ScalaJS.ClassTypeData({
  s_util_Success: 0
}, false, "scala.util.Success", ScalaJS.d.s_util_Try, {
  s_util_Success: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  s_util_Try: 1,
  O: 1
});
ScalaJS.c.s_util_Success.prototype.$classData = ScalaJS.d.s_util_Success;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_util_control_BreakControl = (function() {
  ScalaJS.c.jl_Throwable.call(this)
});
ScalaJS.c.s_util_control_BreakControl.prototype = new ScalaJS.h.jl_Throwable();
ScalaJS.c.s_util_control_BreakControl.prototype.constructor = ScalaJS.c.s_util_control_BreakControl;
/** @constructor */
ScalaJS.h.s_util_control_BreakControl = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_control_BreakControl.prototype = ScalaJS.c.s_util_control_BreakControl.prototype;
ScalaJS.c.s_util_control_BreakControl.prototype.scala$util$control$NoStackTrace$$super$fillInStackTrace__jl_Throwable = (function() {
  return ScalaJS.c.jl_Throwable.prototype.fillInStackTrace__jl_Throwable.call(this)
});
ScalaJS.c.s_util_control_BreakControl.prototype.fillInStackTrace__jl_Throwable = (function() {
  return ScalaJS.i.s_util_control_NoStackTrace$class__fillInStackTrace__s_util_control_NoStackTrace__jl_Throwable(this)
});
ScalaJS.c.s_util_control_BreakControl.prototype.init___ = (function() {
  ScalaJS.c.jl_Throwable.prototype.init___.call(this);
  ScalaJS.i.s_util_control_NoStackTrace$class__$init$__s_util_control_NoStackTrace__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.s_util_control_BreakControl = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_control_BreakControl)))
});
ScalaJS.as.s_util_control_BreakControl = (function(obj) {
  if ((ScalaJS.is.s_util_control_BreakControl(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.util.control.BreakControl")
  }
});
ScalaJS.isArrayOf.s_util_control_BreakControl = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_control_BreakControl)))
});
ScalaJS.asArrayOf.s_util_control_BreakControl = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_util_control_BreakControl(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.util.control.BreakControl;", depth)
  }
});
ScalaJS.d.s_util_control_BreakControl = new ScalaJS.ClassTypeData({
  s_util_control_BreakControl: 0
}, false, "scala.util.control.BreakControl", ScalaJS.d.jl_Throwable, {
  s_util_control_BreakControl: 1,
  s_util_control_ControlThrowable: 1,
  s_util_control_NoStackTrace: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_util_control_BreakControl.prototype.$classData = ScalaJS.d.s_util_control_BreakControl;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_util_hashing_MurmurHash3$ = (function() {
  ScalaJS.c.s_util_hashing_MurmurHash3.call(this);
  this.arraySeed$2 = 0;
  this.stringSeed$2 = 0;
  this.productSeed$2 = 0;
  this.symmetricSeed$2 = 0;
  this.traversableSeed$2 = 0;
  this.seqSeed$2 = 0;
  this.mapSeed$2 = 0;
  this.setSeed$2 = 0
});
ScalaJS.c.s_util_hashing_MurmurHash3$.prototype = new ScalaJS.h.s_util_hashing_MurmurHash3();
ScalaJS.c.s_util_hashing_MurmurHash3$.prototype.constructor = ScalaJS.c.s_util_hashing_MurmurHash3$;
/** @constructor */
ScalaJS.h.s_util_hashing_MurmurHash3$ = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_hashing_MurmurHash3$.prototype = ScalaJS.c.s_util_hashing_MurmurHash3$.prototype;
ScalaJS.c.s_util_hashing_MurmurHash3$.prototype.seqSeed__I = (function() {
  return this.seqSeed$2
});
ScalaJS.c.s_util_hashing_MurmurHash3$.prototype.productHash__s_Product__I = (function(x) {
  return this.productHash__s_Product__I__I(x, -889275714)
});
ScalaJS.c.s_util_hashing_MurmurHash3$.prototype.seqHash__sc_Seq__I = (function(xs) {
  var x1 = xs;
  if (ScalaJS.is.sci_List(x1)) {
    var x2 = ScalaJS.as.sci_List(x1);
    return this.listHash__sci_List__I__I(x2, this.seqSeed__I())
  };
  return this.orderedHash__sc_TraversableOnce__I__I(x1, this.seqSeed__I())
});
ScalaJS.c.s_util_hashing_MurmurHash3$.prototype.init___ = (function() {
  ScalaJS.c.s_util_hashing_MurmurHash3.prototype.init___.call(this);
  ScalaJS.n.s_util_hashing_MurmurHash3 = this;
  this.seqSeed$2 = ScalaJS.objectHashCode("Seq");
  this.mapSeed$2 = ScalaJS.objectHashCode("Map");
  this.setSeed$2 = ScalaJS.objectHashCode("Set");
  return this
});
/*<skip>*/;
ScalaJS.is.s_util_hashing_MurmurHash3$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_hashing_MurmurHash3$)))
});
ScalaJS.as.s_util_hashing_MurmurHash3$ = (function(obj) {
  if ((ScalaJS.is.s_util_hashing_MurmurHash3$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.util.hashing.MurmurHash3$")
  }
});
ScalaJS.isArrayOf.s_util_hashing_MurmurHash3$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_hashing_MurmurHash3$)))
});
ScalaJS.asArrayOf.s_util_hashing_MurmurHash3$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_util_hashing_MurmurHash3$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.util.hashing.MurmurHash3$;", depth)
  }
});
ScalaJS.d.s_util_hashing_MurmurHash3$ = new ScalaJS.ClassTypeData({
  s_util_hashing_MurmurHash3$: 0
}, false, "scala.util.hashing.MurmurHash3$", ScalaJS.d.s_util_hashing_MurmurHash3, {
  s_util_hashing_MurmurHash3$: 1,
  s_util_hashing_MurmurHash3: 1,
  O: 1
});
ScalaJS.c.s_util_hashing_MurmurHash3$.prototype.$classData = ScalaJS.d.s_util_hashing_MurmurHash3$;
ScalaJS.n.s_util_hashing_MurmurHash3 = undefined;
ScalaJS.m.s_util_hashing_MurmurHash3 = (function() {
  if ((!ScalaJS.n.s_util_hashing_MurmurHash3)) {
    ScalaJS.n.s_util_hashing_MurmurHash3 = new ScalaJS.c.s_util_hashing_MurmurHash3$().init___()
  };
  return ScalaJS.n.s_util_hashing_MurmurHash3
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sc_AbstractIterable = (function() {
  ScalaJS.c.sc_AbstractTraversable.call(this)
});
ScalaJS.c.sc_AbstractIterable.prototype = new ScalaJS.h.sc_AbstractTraversable();
ScalaJS.c.sc_AbstractIterable.prototype.constructor = ScalaJS.c.sc_AbstractIterable;
/** @constructor */
ScalaJS.h.sc_AbstractIterable = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_AbstractIterable.prototype = ScalaJS.c.sc_AbstractIterable.prototype;
ScalaJS.c.sc_AbstractIterable.prototype.foreach__F1__V = (function(f) {
  ScalaJS.i.sc_IterableLike$class__foreach__sc_IterableLike__F1__V(this, f)
});
ScalaJS.c.sc_AbstractIterable.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_IterableLike$class__sameElements__sc_IterableLike__sc_GenIterable__Z(this, that)
});
ScalaJS.c.sc_AbstractIterable.prototype.canEqual__O__Z = (function(that) {
  return ScalaJS.i.sc_IterableLike$class__canEqual__sc_IterableLike__O__Z(this, that)
});
ScalaJS.c.sc_AbstractIterable.prototype.init___ = (function() {
  ScalaJS.c.sc_AbstractTraversable.prototype.init___.call(this);
  ScalaJS.i.sc_GenIterable$class__$init$__sc_GenIterable__V(this);
  ScalaJS.i.sc_IterableLike$class__$init$__sc_IterableLike__V(this);
  ScalaJS.i.sc_Iterable$class__$init$__sc_Iterable__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.sc_AbstractIterable = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_AbstractIterable)))
});
ScalaJS.as.sc_AbstractIterable = (function(obj) {
  if ((ScalaJS.is.sc_AbstractIterable(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.AbstractIterable")
  }
});
ScalaJS.isArrayOf.sc_AbstractIterable = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_AbstractIterable)))
});
ScalaJS.asArrayOf.sc_AbstractIterable = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sc_AbstractIterable(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.AbstractIterable;", depth)
  }
});
ScalaJS.d.sc_AbstractIterable = new ScalaJS.ClassTypeData({
  sc_AbstractIterable: 0
}, false, "scala.collection.AbstractIterable", ScalaJS.d.sc_AbstractTraversable, {
  sc_AbstractIterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.sc_AbstractIterable.prototype.$classData = ScalaJS.d.sc_AbstractIterable;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sc_IndexedSeq$$anon$1 = (function() {
  ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.call(this)
});
ScalaJS.c.sc_IndexedSeq$$anon$1.prototype = new ScalaJS.h.scg_GenTraversableFactory$GenericCanBuildFrom();
ScalaJS.c.sc_IndexedSeq$$anon$1.prototype.constructor = ScalaJS.c.sc_IndexedSeq$$anon$1;
/** @constructor */
ScalaJS.h.sc_IndexedSeq$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_IndexedSeq$$anon$1.prototype = ScalaJS.c.sc_IndexedSeq$$anon$1.prototype;
ScalaJS.c.sc_IndexedSeq$$anon$1.prototype.init___ = (function() {
  ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.prototype.init___scg_GenTraversableFactory.call(this, ScalaJS.m.sc_IndexedSeq());
  return this
});
/*<skip>*/;
ScalaJS.is.sc_IndexedSeq$$anon$1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_IndexedSeq$$anon$1)))
});
ScalaJS.as.sc_IndexedSeq$$anon$1 = (function(obj) {
  if ((ScalaJS.is.sc_IndexedSeq$$anon$1(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.IndexedSeq$$anon$1")
  }
});
ScalaJS.isArrayOf.sc_IndexedSeq$$anon$1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_IndexedSeq$$anon$1)))
});
ScalaJS.asArrayOf.sc_IndexedSeq$$anon$1 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sc_IndexedSeq$$anon$1(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.IndexedSeq$$anon$1;", depth)
  }
});
ScalaJS.d.sc_IndexedSeq$$anon$1 = new ScalaJS.ClassTypeData({
  sc_IndexedSeq$$anon$1: 0
}, false, "scala.collection.IndexedSeq$$anon$1", ScalaJS.d.scg_GenTraversableFactory$GenericCanBuildFrom, {
  sc_IndexedSeq$$anon$1: 1,
  scg_GenTraversableFactory$GenericCanBuildFrom: 1,
  scg_CanBuildFrom: 1,
  O: 1
});
ScalaJS.c.sc_IndexedSeq$$anon$1.prototype.$classData = ScalaJS.d.sc_IndexedSeq$$anon$1;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sc_IndexedSeqLike$Elements = (function() {
  ScalaJS.c.sc_AbstractIterator.call(this);
  this.end$2 = 0;
  this.index$2 = 0;
  this.$$outer$f = null
});
ScalaJS.c.sc_IndexedSeqLike$Elements.prototype = new ScalaJS.h.sc_AbstractIterator();
ScalaJS.c.sc_IndexedSeqLike$Elements.prototype.constructor = ScalaJS.c.sc_IndexedSeqLike$Elements;
/** @constructor */
ScalaJS.h.sc_IndexedSeqLike$Elements = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_IndexedSeqLike$Elements.prototype = ScalaJS.c.sc_IndexedSeqLike$Elements.prototype;
ScalaJS.c.sc_IndexedSeqLike$Elements.prototype.index__p2__I = (function() {
  return this.index$2
});
ScalaJS.c.sc_IndexedSeqLike$Elements.prototype.index$und$eq__p2__I__V = (function(x$1) {
  this.index$2 = x$1
});
ScalaJS.c.sc_IndexedSeqLike$Elements.prototype.hasNext__Z = (function() {
  return (this.index__p2__I() < this.end$2)
});
ScalaJS.c.sc_IndexedSeqLike$Elements.prototype.next__O = (function() {
  if ((this.index__p2__I() >= this.end$2)) {
    ScalaJS.m.sc_Iterator().empty__sc_Iterator().next__O()
  };
  var x = this.scala$collection$IndexedSeqLike$Elements$$$outer__sc_IndexedSeqLike().apply__I__O(this.index__p2__I());
  this.index$und$eq__p2__I__V(((this.index__p2__I() + 1) | 0));
  return x
});
ScalaJS.c.sc_IndexedSeqLike$Elements.prototype.scala$collection$IndexedSeqLike$Elements$$$outer__sc_IndexedSeqLike = (function() {
  return this.$$outer$f
});
ScalaJS.c.sc_IndexedSeqLike$Elements.prototype.init___sc_IndexedSeqLike__I__I = (function($$outer, start, end) {
  this.end$2 = end;
  if (($$outer === null)) {
    throw ScalaJS.unwrapJavaScriptException(null)
  } else {
    this.$$outer$f = $$outer
  };
  ScalaJS.c.sc_AbstractIterator.prototype.init___.call(this);
  ScalaJS.i.sc_BufferedIterator$class__$init$__sc_BufferedIterator__V(this);
  this.index$2 = start;
  return this
});
/*<skip>*/;
ScalaJS.is.sc_IndexedSeqLike$Elements = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_IndexedSeqLike$Elements)))
});
ScalaJS.as.sc_IndexedSeqLike$Elements = (function(obj) {
  if ((ScalaJS.is.sc_IndexedSeqLike$Elements(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.IndexedSeqLike$Elements")
  }
});
ScalaJS.isArrayOf.sc_IndexedSeqLike$Elements = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_IndexedSeqLike$Elements)))
});
ScalaJS.asArrayOf.sc_IndexedSeqLike$Elements = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sc_IndexedSeqLike$Elements(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.IndexedSeqLike$Elements;", depth)
  }
});
ScalaJS.d.sc_IndexedSeqLike$Elements = new ScalaJS.ClassTypeData({
  sc_IndexedSeqLike$Elements: 0
}, false, "scala.collection.IndexedSeqLike$Elements", ScalaJS.d.sc_AbstractIterator, {
  sc_IndexedSeqLike$Elements: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  sc_BufferedIterator: 1,
  sc_AbstractIterator: 1,
  sc_Iterator: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  O: 1
});
ScalaJS.c.sc_IndexedSeqLike$Elements.prototype.$classData = ScalaJS.d.sc_IndexedSeqLike$Elements;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sc_Iterator$$anon$2 = (function() {
  ScalaJS.c.sc_AbstractIterator.call(this)
});
ScalaJS.c.sc_Iterator$$anon$2.prototype = new ScalaJS.h.sc_AbstractIterator();
ScalaJS.c.sc_Iterator$$anon$2.prototype.constructor = ScalaJS.c.sc_Iterator$$anon$2;
/** @constructor */
ScalaJS.h.sc_Iterator$$anon$2 = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_Iterator$$anon$2.prototype = ScalaJS.c.sc_Iterator$$anon$2.prototype;
ScalaJS.c.sc_Iterator$$anon$2.prototype.hasNext__Z = (function() {
  return false
});
ScalaJS.c.sc_Iterator$$anon$2.prototype.next__sr_Nothing$ = (function() {
  throw new ScalaJS.c.ju_NoSuchElementException().init___T("next on empty iterator")
});
ScalaJS.c.sc_Iterator$$anon$2.prototype.next__O = (function() {
  this.next__sr_Nothing$()
});
/*<skip>*/;
ScalaJS.is.sc_Iterator$$anon$2 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_Iterator$$anon$2)))
});
ScalaJS.as.sc_Iterator$$anon$2 = (function(obj) {
  if ((ScalaJS.is.sc_Iterator$$anon$2(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.Iterator$$anon$2")
  }
});
ScalaJS.isArrayOf.sc_Iterator$$anon$2 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_Iterator$$anon$2)))
});
ScalaJS.asArrayOf.sc_Iterator$$anon$2 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sc_Iterator$$anon$2(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.Iterator$$anon$2;", depth)
  }
});
ScalaJS.d.sc_Iterator$$anon$2 = new ScalaJS.ClassTypeData({
  sc_Iterator$$anon$2: 0
}, false, "scala.collection.Iterator$$anon$2", ScalaJS.d.sc_AbstractIterator, {
  sc_Iterator$$anon$2: 1,
  sc_AbstractIterator: 1,
  sc_Iterator: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  O: 1
});
ScalaJS.c.sc_Iterator$$anon$2.prototype.$classData = ScalaJS.d.sc_Iterator$$anon$2;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sc_LinearSeqLike$$anon$1 = (function() {
  ScalaJS.c.sc_AbstractIterator.call(this);
  this.these$2 = null;
  this.$$outer$2 = null
});
ScalaJS.c.sc_LinearSeqLike$$anon$1.prototype = new ScalaJS.h.sc_AbstractIterator();
ScalaJS.c.sc_LinearSeqLike$$anon$1.prototype.constructor = ScalaJS.c.sc_LinearSeqLike$$anon$1;
/** @constructor */
ScalaJS.h.sc_LinearSeqLike$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_LinearSeqLike$$anon$1.prototype = ScalaJS.c.sc_LinearSeqLike$$anon$1.prototype;
ScalaJS.c.sc_LinearSeqLike$$anon$1.prototype.these__p2__sc_LinearSeqLike = (function() {
  return this.these$2
});
ScalaJS.c.sc_LinearSeqLike$$anon$1.prototype.these$und$eq__p2__sc_LinearSeqLike__V = (function(x$1) {
  this.these$2 = x$1
});
ScalaJS.c.sc_LinearSeqLike$$anon$1.prototype.hasNext__Z = (function() {
  return (!this.these__p2__sc_LinearSeqLike().isEmpty__Z())
});
ScalaJS.c.sc_LinearSeqLike$$anon$1.prototype.next__O = (function() {
  if (this.hasNext__Z()) {
    var result = this.these__p2__sc_LinearSeqLike().head__O();
    this.these$und$eq__p2__sc_LinearSeqLike__V(ScalaJS.as.sc_LinearSeqLike(this.these__p2__sc_LinearSeqLike().tail__O()));
    return result
  } else {
    return ScalaJS.m.sc_Iterator().empty__sc_Iterator().next__O()
  }
});
ScalaJS.c.sc_LinearSeqLike$$anon$1.prototype.init___sc_LinearSeqLike = (function($$outer) {
  if (($$outer === null)) {
    throw ScalaJS.unwrapJavaScriptException(null)
  } else {
    this.$$outer$2 = $$outer
  };
  ScalaJS.c.sc_AbstractIterator.prototype.init___.call(this);
  this.these$2 = $$outer;
  return this
});
/*<skip>*/;
ScalaJS.is.sc_LinearSeqLike$$anon$1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_LinearSeqLike$$anon$1)))
});
ScalaJS.as.sc_LinearSeqLike$$anon$1 = (function(obj) {
  if ((ScalaJS.is.sc_LinearSeqLike$$anon$1(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.LinearSeqLike$$anon$1")
  }
});
ScalaJS.isArrayOf.sc_LinearSeqLike$$anon$1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_LinearSeqLike$$anon$1)))
});
ScalaJS.asArrayOf.sc_LinearSeqLike$$anon$1 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sc_LinearSeqLike$$anon$1(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.LinearSeqLike$$anon$1;", depth)
  }
});
ScalaJS.d.sc_LinearSeqLike$$anon$1 = new ScalaJS.ClassTypeData({
  sc_LinearSeqLike$$anon$1: 0
}, false, "scala.collection.LinearSeqLike$$anon$1", ScalaJS.d.sc_AbstractIterator, {
  sc_LinearSeqLike$$anon$1: 1,
  sc_AbstractIterator: 1,
  sc_Iterator: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  O: 1
});
ScalaJS.c.sc_LinearSeqLike$$anon$1.prototype.$classData = ScalaJS.d.sc_LinearSeqLike$$anon$1;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scg_GenSetFactory = (function() {
  ScalaJS.c.scg_GenericCompanion.call(this)
});
ScalaJS.c.scg_GenSetFactory.prototype = new ScalaJS.h.scg_GenericCompanion();
ScalaJS.c.scg_GenSetFactory.prototype.constructor = ScalaJS.c.scg_GenSetFactory;
/** @constructor */
ScalaJS.h.scg_GenSetFactory = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_GenSetFactory.prototype = ScalaJS.c.scg_GenSetFactory.prototype;
/*<skip>*/;
ScalaJS.is.scg_GenSetFactory = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scg_GenSetFactory)))
});
ScalaJS.as.scg_GenSetFactory = (function(obj) {
  if ((ScalaJS.is.scg_GenSetFactory(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.generic.GenSetFactory")
  }
});
ScalaJS.isArrayOf.scg_GenSetFactory = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scg_GenSetFactory)))
});
ScalaJS.asArrayOf.scg_GenSetFactory = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scg_GenSetFactory(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.generic.GenSetFactory;", depth)
  }
});
ScalaJS.d.scg_GenSetFactory = new ScalaJS.ClassTypeData({
  scg_GenSetFactory: 0
}, false, "scala.collection.generic.GenSetFactory", ScalaJS.d.scg_GenericCompanion, {
  scg_GenSetFactory: 1,
  scg_GenericCompanion: 1,
  O: 1
});
ScalaJS.c.scg_GenSetFactory.prototype.$classData = ScalaJS.d.scg_GenSetFactory;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scg_GenTraversableFactory = (function() {
  ScalaJS.c.scg_GenericCompanion.call(this);
  this.ReusableCBFInstance$2 = null
});
ScalaJS.c.scg_GenTraversableFactory.prototype = new ScalaJS.h.scg_GenericCompanion();
ScalaJS.c.scg_GenTraversableFactory.prototype.constructor = ScalaJS.c.scg_GenTraversableFactory;
/** @constructor */
ScalaJS.h.scg_GenTraversableFactory = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_GenTraversableFactory.prototype = ScalaJS.c.scg_GenTraversableFactory.prototype;
ScalaJS.c.scg_GenTraversableFactory.prototype.init___ = (function() {
  ScalaJS.c.scg_GenericCompanion.prototype.init___.call(this);
  this.ReusableCBFInstance$2 = new ScalaJS.c.scg_GenTraversableFactory$$anon$1().init___scg_GenTraversableFactory(this);
  return this
});
/*<skip>*/;
ScalaJS.is.scg_GenTraversableFactory = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scg_GenTraversableFactory)))
});
ScalaJS.as.scg_GenTraversableFactory = (function(obj) {
  if ((ScalaJS.is.scg_GenTraversableFactory(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.generic.GenTraversableFactory")
  }
});
ScalaJS.isArrayOf.scg_GenTraversableFactory = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scg_GenTraversableFactory)))
});
ScalaJS.asArrayOf.scg_GenTraversableFactory = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scg_GenTraversableFactory(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.generic.GenTraversableFactory;", depth)
  }
});
ScalaJS.d.scg_GenTraversableFactory = new ScalaJS.ClassTypeData({
  scg_GenTraversableFactory: 0
}, false, "scala.collection.generic.GenTraversableFactory", ScalaJS.d.scg_GenericCompanion, {
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1
});
ScalaJS.c.scg_GenTraversableFactory.prototype.$classData = ScalaJS.d.scg_GenTraversableFactory;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scg_GenTraversableFactory$$anon$1 = (function() {
  ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.call(this);
  this.$$outer$2 = null
});
ScalaJS.c.scg_GenTraversableFactory$$anon$1.prototype = new ScalaJS.h.scg_GenTraversableFactory$GenericCanBuildFrom();
ScalaJS.c.scg_GenTraversableFactory$$anon$1.prototype.constructor = ScalaJS.c.scg_GenTraversableFactory$$anon$1;
/** @constructor */
ScalaJS.h.scg_GenTraversableFactory$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_GenTraversableFactory$$anon$1.prototype = ScalaJS.c.scg_GenTraversableFactory$$anon$1.prototype;
ScalaJS.c.scg_GenTraversableFactory$$anon$1.prototype.init___scg_GenTraversableFactory = (function($$outer) {
  if (($$outer === null)) {
    throw ScalaJS.unwrapJavaScriptException(null)
  } else {
    this.$$outer$2 = $$outer
  };
  ScalaJS.c.scg_GenTraversableFactory$GenericCanBuildFrom.prototype.init___scg_GenTraversableFactory.call(this, $$outer);
  return this
});
/*<skip>*/;
ScalaJS.is.scg_GenTraversableFactory$$anon$1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scg_GenTraversableFactory$$anon$1)))
});
ScalaJS.as.scg_GenTraversableFactory$$anon$1 = (function(obj) {
  if ((ScalaJS.is.scg_GenTraversableFactory$$anon$1(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.generic.GenTraversableFactory$$anon$1")
  }
});
ScalaJS.isArrayOf.scg_GenTraversableFactory$$anon$1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scg_GenTraversableFactory$$anon$1)))
});
ScalaJS.asArrayOf.scg_GenTraversableFactory$$anon$1 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scg_GenTraversableFactory$$anon$1(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.generic.GenTraversableFactory$$anon$1;", depth)
  }
});
ScalaJS.d.scg_GenTraversableFactory$$anon$1 = new ScalaJS.ClassTypeData({
  scg_GenTraversableFactory$$anon$1: 0
}, false, "scala.collection.generic.GenTraversableFactory$$anon$1", ScalaJS.d.scg_GenTraversableFactory$GenericCanBuildFrom, {
  scg_GenTraversableFactory$$anon$1: 1,
  scg_GenTraversableFactory$GenericCanBuildFrom: 1,
  scg_CanBuildFrom: 1,
  O: 1
});
ScalaJS.c.scg_GenTraversableFactory$$anon$1.prototype.$classData = ScalaJS.d.scg_GenTraversableFactory$$anon$1;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scg_MapFactory = (function() {
  ScalaJS.c.scg_GenMapFactory.call(this)
});
ScalaJS.c.scg_MapFactory.prototype = new ScalaJS.h.scg_GenMapFactory();
ScalaJS.c.scg_MapFactory.prototype.constructor = ScalaJS.c.scg_MapFactory;
/** @constructor */
ScalaJS.h.scg_MapFactory = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_MapFactory.prototype = ScalaJS.c.scg_MapFactory.prototype;
/*<skip>*/;
ScalaJS.is.scg_MapFactory = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scg_MapFactory)))
});
ScalaJS.as.scg_MapFactory = (function(obj) {
  if ((ScalaJS.is.scg_MapFactory(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.generic.MapFactory")
  }
});
ScalaJS.isArrayOf.scg_MapFactory = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scg_MapFactory)))
});
ScalaJS.asArrayOf.scg_MapFactory = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scg_MapFactory(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.generic.MapFactory;", depth)
  }
});
ScalaJS.d.scg_MapFactory = new ScalaJS.ClassTypeData({
  scg_MapFactory: 0
}, false, "scala.collection.generic.MapFactory", ScalaJS.d.scg_GenMapFactory, {
  scg_MapFactory: 1,
  scg_GenMapFactory: 1,
  O: 1
});
ScalaJS.c.scg_MapFactory.prototype.$classData = ScalaJS.d.scg_MapFactory;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sci_VectorIterator = (function() {
  ScalaJS.c.sc_AbstractIterator.call(this);
  this.endIndex$2 = 0;
  this.blockIndex$2 = 0;
  this.lo$2 = 0;
  this.endLo$2 = 0;
  this.$$undhasNext$2 = false;
  this.depth$2 = 0;
  this.display0$2 = null;
  this.display1$2 = null;
  this.display2$2 = null;
  this.display3$2 = null;
  this.display4$2 = null;
  this.display5$2 = null
});
ScalaJS.c.sci_VectorIterator.prototype = new ScalaJS.h.sc_AbstractIterator();
ScalaJS.c.sci_VectorIterator.prototype.constructor = ScalaJS.c.sci_VectorIterator;
/** @constructor */
ScalaJS.h.sci_VectorIterator = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_VectorIterator.prototype = ScalaJS.c.sci_VectorIterator.prototype;
ScalaJS.c.sci_VectorIterator.prototype.depth__I = (function() {
  return this.depth$2
});
ScalaJS.c.sci_VectorIterator.prototype.depth$und$eq__I__V = (function(x$1) {
  this.depth$2 = x$1
});
ScalaJS.c.sci_VectorIterator.prototype.display0__AO = (function() {
  return this.display0$2
});
ScalaJS.c.sci_VectorIterator.prototype.display0$und$eq__AO__V = (function(x$1) {
  this.display0$2 = x$1
});
ScalaJS.c.sci_VectorIterator.prototype.display1__AO = (function() {
  return this.display1$2
});
ScalaJS.c.sci_VectorIterator.prototype.display1$und$eq__AO__V = (function(x$1) {
  this.display1$2 = x$1
});
ScalaJS.c.sci_VectorIterator.prototype.display2__AO = (function() {
  return this.display2$2
});
ScalaJS.c.sci_VectorIterator.prototype.display2$und$eq__AO__V = (function(x$1) {
  this.display2$2 = x$1
});
ScalaJS.c.sci_VectorIterator.prototype.display3__AO = (function() {
  return this.display3$2
});
ScalaJS.c.sci_VectorIterator.prototype.display3$und$eq__AO__V = (function(x$1) {
  this.display3$2 = x$1
});
ScalaJS.c.sci_VectorIterator.prototype.display4__AO = (function() {
  return this.display4$2
});
ScalaJS.c.sci_VectorIterator.prototype.display4$und$eq__AO__V = (function(x$1) {
  this.display4$2 = x$1
});
ScalaJS.c.sci_VectorIterator.prototype.display5__AO = (function() {
  return this.display5$2
});
ScalaJS.c.sci_VectorIterator.prototype.display5$und$eq__AO__V = (function(x$1) {
  this.display5$2 = x$1
});
ScalaJS.c.sci_VectorIterator.prototype.initFrom__sci_VectorPointer__V = (function(that) {
  ScalaJS.i.sci_VectorPointer$class__initFrom__sci_VectorPointer__sci_VectorPointer__V(this, that)
});
ScalaJS.c.sci_VectorIterator.prototype.initFrom__sci_VectorPointer__I__V = (function(that, depth) {
  ScalaJS.i.sci_VectorPointer$class__initFrom__sci_VectorPointer__sci_VectorPointer__I__V(this, that, depth)
});
ScalaJS.c.sci_VectorIterator.prototype.gotoPos__I__I__V = (function(index, xor) {
  ScalaJS.i.sci_VectorPointer$class__gotoPos__sci_VectorPointer__I__I__V(this, index, xor)
});
ScalaJS.c.sci_VectorIterator.prototype.gotoNextBlockStart__I__I__V = (function(index, xor) {
  ScalaJS.i.sci_VectorPointer$class__gotoNextBlockStart__sci_VectorPointer__I__I__V(this, index, xor)
});
ScalaJS.c.sci_VectorIterator.prototype.copyOf__AO__AO = (function(a) {
  return ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO(this, a)
});
ScalaJS.c.sci_VectorIterator.prototype.stabilize__I__V = (function(index) {
  ScalaJS.i.sci_VectorPointer$class__stabilize__sci_VectorPointer__I__V(this, index)
});
ScalaJS.c.sci_VectorIterator.prototype.blockIndex__p2__I = (function() {
  return this.blockIndex$2
});
ScalaJS.c.sci_VectorIterator.prototype.blockIndex$und$eq__p2__I__V = (function(x$1) {
  this.blockIndex$2 = x$1
});
ScalaJS.c.sci_VectorIterator.prototype.lo__p2__I = (function() {
  return this.lo$2
});
ScalaJS.c.sci_VectorIterator.prototype.lo$und$eq__p2__I__V = (function(x$1) {
  this.lo$2 = x$1
});
ScalaJS.c.sci_VectorIterator.prototype.endLo__p2__I = (function() {
  return this.endLo$2
});
ScalaJS.c.sci_VectorIterator.prototype.endLo$und$eq__p2__I__V = (function(x$1) {
  this.endLo$2 = x$1
});
ScalaJS.c.sci_VectorIterator.prototype.hasNext__Z = (function() {
  return this.$$undhasNext__p2__Z()
});
ScalaJS.c.sci_VectorIterator.prototype.$$undhasNext__p2__Z = (function() {
  return this.$$undhasNext$2
});
ScalaJS.c.sci_VectorIterator.prototype.$$undhasNext$und$eq__p2__Z__V = (function(x$1) {
  this.$$undhasNext$2 = x$1
});
ScalaJS.c.sci_VectorIterator.prototype.next__O = (function() {
  if ((!this.$$undhasNext__p2__Z())) {
    throw new ScalaJS.c.ju_NoSuchElementException().init___T("reached iterator end")
  };
  var res = this.display0__AO().u[this.lo__p2__I()];
  this.lo$und$eq__p2__I__V(((this.lo__p2__I() + 1) | 0));
  if ((this.lo__p2__I() === this.endLo__p2__I())) {
    if ((((this.blockIndex__p2__I() + this.lo__p2__I()) | 0) < this.endIndex$2)) {
      var newBlockIndex = ((this.blockIndex__p2__I() + 32) | 0);
      this.gotoNextBlockStart__I__I__V(newBlockIndex, (this.blockIndex__p2__I() ^ newBlockIndex));
      this.blockIndex$und$eq__p2__I__V(newBlockIndex);
      this.endLo$und$eq__p2__I__V(ScalaJS.m.s_math_package().min__I__I__I(((this.endIndex$2 - this.blockIndex__p2__I()) | 0), 32));
      this.lo$und$eq__p2__I__V(0)
    } else {
      this.$$undhasNext$und$eq__p2__Z__V(false)
    }
  };
  return res
});
ScalaJS.c.sci_VectorIterator.prototype.init___I__I = (function(_startIndex, endIndex) {
  this.endIndex$2 = endIndex;
  ScalaJS.c.sc_AbstractIterator.prototype.init___.call(this);
  ScalaJS.i.sci_VectorPointer$class__$init$__sci_VectorPointer__V(this);
  this.blockIndex$2 = (_startIndex & (~31));
  this.lo$2 = (_startIndex & 31);
  this.endLo$2 = ScalaJS.m.s_math_package().min__I__I__I(((endIndex - this.blockIndex__p2__I()) | 0), 32);
  this.$$undhasNext$2 = (((this.blockIndex__p2__I() + this.lo__p2__I()) | 0) < endIndex);
  return this
});
/*<skip>*/;
ScalaJS.is.sci_VectorIterator = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_VectorIterator)))
});
ScalaJS.as.sci_VectorIterator = (function(obj) {
  if ((ScalaJS.is.sci_VectorIterator(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.immutable.VectorIterator")
  }
});
ScalaJS.isArrayOf.sci_VectorIterator = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_VectorIterator)))
});
ScalaJS.asArrayOf.sci_VectorIterator = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sci_VectorIterator(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.VectorIterator;", depth)
  }
});
ScalaJS.d.sci_VectorIterator = new ScalaJS.ClassTypeData({
  sci_VectorIterator: 0
}, false, "scala.collection.immutable.VectorIterator", ScalaJS.d.sc_AbstractIterator, {
  sci_VectorIterator: 1,
  sci_VectorPointer: 1,
  sc_AbstractIterator: 1,
  sc_Iterator: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  O: 1
});
ScalaJS.c.sci_VectorIterator.prototype.$classData = ScalaJS.d.sci_VectorIterator;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scm_LinkedListLike$$anon$1 = (function() {
  ScalaJS.c.sc_AbstractIterator.call(this);
  this.elems$2 = null
});
ScalaJS.c.scm_LinkedListLike$$anon$1.prototype = new ScalaJS.h.sc_AbstractIterator();
ScalaJS.c.scm_LinkedListLike$$anon$1.prototype.constructor = ScalaJS.c.scm_LinkedListLike$$anon$1;
/** @constructor */
ScalaJS.h.scm_LinkedListLike$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_LinkedListLike$$anon$1.prototype = ScalaJS.c.scm_LinkedListLike$$anon$1.prototype;
ScalaJS.c.scm_LinkedListLike$$anon$1.prototype.elems__p2__scm_LinkedListLike = (function() {
  return this.elems$2
});
ScalaJS.c.scm_LinkedListLike$$anon$1.prototype.elems$und$eq__p2__scm_LinkedListLike__V = (function(x$1) {
  this.elems$2 = x$1
});
ScalaJS.c.scm_LinkedListLike$$anon$1.prototype.hasNext__Z = (function() {
  return this.elems__p2__scm_LinkedListLike().nonEmpty__Z()
});
ScalaJS.c.scm_LinkedListLike$$anon$1.prototype.next__O = (function() {
  var res = this.elems__p2__scm_LinkedListLike().elem__O();
  this.elems$und$eq__p2__scm_LinkedListLike__V(ScalaJS.as.scm_LinkedListLike(this.elems__p2__scm_LinkedListLike().next__scm_Seq()));
  return res
});
ScalaJS.c.scm_LinkedListLike$$anon$1.prototype.init___scm_LinkedListLike = (function($$outer) {
  ScalaJS.c.sc_AbstractIterator.prototype.init___.call(this);
  this.elems$2 = $$outer;
  return this
});
/*<skip>*/;
ScalaJS.is.scm_LinkedListLike$$anon$1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_LinkedListLike$$anon$1)))
});
ScalaJS.as.scm_LinkedListLike$$anon$1 = (function(obj) {
  if ((ScalaJS.is.scm_LinkedListLike$$anon$1(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.mutable.LinkedListLike$$anon$1")
  }
});
ScalaJS.isArrayOf.scm_LinkedListLike$$anon$1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_LinkedListLike$$anon$1)))
});
ScalaJS.asArrayOf.scm_LinkedListLike$$anon$1 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scm_LinkedListLike$$anon$1(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.LinkedListLike$$anon$1;", depth)
  }
});
ScalaJS.d.scm_LinkedListLike$$anon$1 = new ScalaJS.ClassTypeData({
  scm_LinkedListLike$$anon$1: 0
}, false, "scala.collection.mutable.LinkedListLike$$anon$1", ScalaJS.d.sc_AbstractIterator, {
  scm_LinkedListLike$$anon$1: 1,
  sc_AbstractIterator: 1,
  sc_Iterator: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  O: 1
});
ScalaJS.c.scm_LinkedListLike$$anon$1.prototype.$classData = ScalaJS.d.scm_LinkedListLike$$anon$1;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sjsr_AnonFunction0 = (function() {
  ScalaJS.c.sr_AbstractFunction0.call(this);
  this.f$2 = null
});
ScalaJS.c.sjsr_AnonFunction0.prototype = new ScalaJS.h.sr_AbstractFunction0();
ScalaJS.c.sjsr_AnonFunction0.prototype.constructor = ScalaJS.c.sjsr_AnonFunction0;
/** @constructor */
ScalaJS.h.sjsr_AnonFunction0 = (function() {
  /*<skip>*/
});
ScalaJS.h.sjsr_AnonFunction0.prototype = ScalaJS.c.sjsr_AnonFunction0.prototype;
ScalaJS.c.sjsr_AnonFunction0.prototype.apply__O = (function() {
  return ScalaJS.as.O(this.f$2())
});
ScalaJS.c.sjsr_AnonFunction0.prototype.init___sjs_js_Function0 = (function(f) {
  this.f$2 = f;
  ScalaJS.c.sr_AbstractFunction0.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.sjsr_AnonFunction0 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sjsr_AnonFunction0)))
});
ScalaJS.as.sjsr_AnonFunction0 = (function(obj) {
  if ((ScalaJS.is.sjsr_AnonFunction0(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.scalajs.runtime.AnonFunction0")
  }
});
ScalaJS.isArrayOf.sjsr_AnonFunction0 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sjsr_AnonFunction0)))
});
ScalaJS.asArrayOf.sjsr_AnonFunction0 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sjsr_AnonFunction0(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.scalajs.runtime.AnonFunction0;", depth)
  }
});
ScalaJS.d.sjsr_AnonFunction0 = new ScalaJS.ClassTypeData({
  sjsr_AnonFunction0: 0
}, false, "scala.scalajs.runtime.AnonFunction0", ScalaJS.d.sr_AbstractFunction0, {
  sjsr_AnonFunction0: 1,
  sr_AbstractFunction0: 1,
  F0: 1,
  O: 1
});
ScalaJS.c.sjsr_AnonFunction0.prototype.$classData = ScalaJS.d.sjsr_AnonFunction0;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sjsr_AnonFunction1 = (function() {
  ScalaJS.c.sr_AbstractFunction1.call(this);
  this.f$2 = null
});
ScalaJS.c.sjsr_AnonFunction1.prototype = new ScalaJS.h.sr_AbstractFunction1();
ScalaJS.c.sjsr_AnonFunction1.prototype.constructor = ScalaJS.c.sjsr_AnonFunction1;
/** @constructor */
ScalaJS.h.sjsr_AnonFunction1 = (function() {
  /*<skip>*/
});
ScalaJS.h.sjsr_AnonFunction1.prototype = ScalaJS.c.sjsr_AnonFunction1.prototype;
ScalaJS.c.sjsr_AnonFunction1.prototype.apply__O__O = (function(arg1) {
  return ScalaJS.as.O(this.f$2(arg1))
});
ScalaJS.c.sjsr_AnonFunction1.prototype.init___sjs_js_Function1 = (function(f) {
  this.f$2 = f;
  ScalaJS.c.sr_AbstractFunction1.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.sjsr_AnonFunction1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sjsr_AnonFunction1)))
});
ScalaJS.as.sjsr_AnonFunction1 = (function(obj) {
  if ((ScalaJS.is.sjsr_AnonFunction1(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.scalajs.runtime.AnonFunction1")
  }
});
ScalaJS.isArrayOf.sjsr_AnonFunction1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sjsr_AnonFunction1)))
});
ScalaJS.asArrayOf.sjsr_AnonFunction1 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sjsr_AnonFunction1(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.scalajs.runtime.AnonFunction1;", depth)
  }
});
ScalaJS.d.sjsr_AnonFunction1 = new ScalaJS.ClassTypeData({
  sjsr_AnonFunction1: 0
}, false, "scala.scalajs.runtime.AnonFunction1", ScalaJS.d.sr_AbstractFunction1, {
  sjsr_AnonFunction1: 1,
  sr_AbstractFunction1: 1,
  F1: 1,
  O: 1
});
ScalaJS.c.sjsr_AnonFunction1.prototype.$classData = ScalaJS.d.sjsr_AnonFunction1;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sjsr_RuntimeLong = (function() {
  ScalaJS.c.jl_Number.call(this);
  this.l$2 = 0;
  this.m$2 = 0;
  this.h$2 = 0
});
ScalaJS.c.sjsr_RuntimeLong.prototype = new ScalaJS.h.jl_Number();
ScalaJS.c.sjsr_RuntimeLong.prototype.constructor = ScalaJS.c.sjsr_RuntimeLong;
/** @constructor */
ScalaJS.h.sjsr_RuntimeLong = (function() {
  /*<skip>*/
});
ScalaJS.h.sjsr_RuntimeLong.prototype = ScalaJS.c.sjsr_RuntimeLong.prototype;
ScalaJS.c.sjsr_RuntimeLong.prototype.l__I = (function() {
  return this.l$2
});
ScalaJS.c.sjsr_RuntimeLong.prototype.m__I = (function() {
  return this.m$2
});
ScalaJS.c.sjsr_RuntimeLong.prototype.h__I = (function() {
  return this.h$2
});
ScalaJS.c.sjsr_RuntimeLong.prototype.toInt__I = (function() {
  return (this.l__I() | (this.m__I() << 22))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.toFloat__F = (function() {
  return this.toDouble__D()
});
ScalaJS.c.sjsr_RuntimeLong.prototype.toDouble__D = (function() {
  if (this.isMinValue__p2__Z()) {
    return -9.223372036854776E18
  } else {
    if (this.scala$scalajs$runtime$RuntimeLong$$isNegative__Z()) {
      return (-this.unary$und$minus__sjsr_RuntimeLong().toDouble__D())
    } else {
      return ((this.l__I() + (this.m__I() * 4194304.0)) + (this.h__I() * 1.7592186044416E13))
    }
  }
});
ScalaJS.c.sjsr_RuntimeLong.prototype.intValue__I = (function() {
  return this.toInt__I()
});
ScalaJS.c.sjsr_RuntimeLong.prototype.longValue__J = (function() {
  return this
});
ScalaJS.c.sjsr_RuntimeLong.prototype.floatValue__F = (function() {
  return this.toFloat__F()
});
ScalaJS.c.sjsr_RuntimeLong.prototype.doubleValue__D = (function() {
  return this.toDouble__D()
});
ScalaJS.c.sjsr_RuntimeLong.prototype.unary$und$minus__sjsr_RuntimeLong = (function() {
  var neg0 = ((((~this.l__I()) + 1) | 0) & 4194303);
  var jsx$3 = (~this.m__I());
  if ((neg0 === 0)) {
    var jsx$2 = 1
  } else {
    var jsx$2 = 0
  };
  var jsx$1 = ((jsx$3 + jsx$2) | 0);
  var neg1 = (jsx$1 & 4194303);
  var jsx$6 = (~this.h__I());
  if (((neg0 === 0) && (neg1 === 0))) {
    var jsx$5 = 1
  } else {
    var jsx$5 = 0
  };
  var jsx$4 = ((jsx$6 + jsx$5) | 0);
  var neg2 = (jsx$4 & 1048575);
  return ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong(neg0, neg1, neg2)
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$less$less__I__sjsr_RuntimeLong = (function(n_in) {
  var n = (n_in & 63);
  if ((n < 22)) {
    var remBits = ((22 - n) | 0);
    return ScalaJS.m.sjsr_RuntimeLong().masked__I__I__I__sjsr_RuntimeLong((this.l__I() << n), ((this.m__I() << n) | (this.l__I() >> remBits)), ((this.h__I() << n) | (this.m__I() >> remBits)))
  } else {
    if ((n < 44)) {
      var shfBits = ((n - 22) | 0);
      var remBits$2 = ((44 - n) | 0);
      return ScalaJS.m.sjsr_RuntimeLong().masked__I__I__I__sjsr_RuntimeLong(0, (this.l__I() << shfBits), ((this.m__I() << shfBits) | (this.l__I() >> remBits$2)))
    } else {
      return ScalaJS.m.sjsr_RuntimeLong().masked__I__I__I__sjsr_RuntimeLong(0, 0, (this.l__I() << ((n - 44) | 0)))
    }
  }
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$greater$greater$greater__I__sjsr_RuntimeLong = (function(n_in) {
  ScalaJS.m.s_Predef().assert__Z__V((this.h__I() === (this.h__I() & 1048575)));
  var n = (n_in & 63);
  if ((n < 22)) {
    var remBits = ((22 - n) | 0);
    return ScalaJS.m.sjsr_RuntimeLong().masked__I__I__I__sjsr_RuntimeLong(((this.l__I() >> n) | (this.m__I() << remBits)), ((this.m__I() >> n) | (this.h__I() << remBits)), ((this.h__I() >>> n) | 0))
  } else {
    if ((n < 44)) {
      var shfBits = ((n - 22) | 0);
      var remBits$2 = ((44 - n) | 0);
      return ScalaJS.m.sjsr_RuntimeLong().masked__I__I__I__sjsr_RuntimeLong(((this.m__I() >> shfBits) | (this.h__I() << remBits$2)), ((this.h__I() >>> shfBits) | 0), 0)
    } else {
      return ScalaJS.m.sjsr_RuntimeLong().masked__I__I__I__sjsr_RuntimeLong(((this.h__I() >>> ((n - 44) | 0)) | 0), 0, 0)
    }
  }
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$greater$greater__I__sjsr_RuntimeLong = (function(n_in) {
  var n = (n_in & 63);
  var negative = ((this.h__I() & 524288) !== 0);
  if (negative) {
    var xh = (this.h__I() | (~1048575))
  } else {
    var xh = this.h__I()
  };
  if ((n < 22)) {
    var remBits = ((22 - n) | 0);
    return ScalaJS.m.sjsr_RuntimeLong().masked__I__I__I__sjsr_RuntimeLong(((this.l__I() >> n) | (this.m__I() << remBits)), ((this.m__I() >> n) | (xh << remBits)), (xh >> n))
  } else {
    if ((n < 44)) {
      var shfBits = ((n - 22) | 0);
      var remBits$2 = ((44 - n) | 0);
      var jsx$3 = ScalaJS.m.sjsr_RuntimeLong();
      var jsx$2 = ((this.m__I() >> shfBits) | (xh << remBits$2));
      if (negative) {
        var jsx$1 = 1048575
      } else {
        var jsx$1 = 0
      };
      return jsx$3.masked__I__I__I__sjsr_RuntimeLong(jsx$2, (xh >> shfBits), jsx$1)
    } else {
      var jsx$6 = ScalaJS.m.sjsr_RuntimeLong();
      if (negative) {
        var jsx$5 = 4194303
      } else {
        var jsx$5 = 0
      };
      if (negative) {
        var jsx$4 = 1048575
      } else {
        var jsx$4 = 0
      };
      return jsx$6.masked__I__I__I__sjsr_RuntimeLong((xh >> ((n - 44) | 0)), jsx$5, jsx$4)
    }
  }
});
ScalaJS.c.sjsr_RuntimeLong.prototype.equals__O__Z = (function(that) {
  var x1 = that;
  if (ScalaJS.is.sjsr_RuntimeLong(x1)) {
    var x2 = ScalaJS.as.sjsr_RuntimeLong(x1);
    return (((this.l__I() === x2.l__I()) && (this.m__I() === x2.m__I())) && (this.h__I() === x2.h__I()))
  };
  return false
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$less__sjsr_RuntimeLong__Z = (function(y) {
  return (!this.$$greater$eq__sjsr_RuntimeLong__Z(y))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$greater__sjsr_RuntimeLong__Z = (function(y) {
  var signx = this.sign__p2__I();
  var signy = y.sign__p2__I();
  if ((signx === 0)) {
    return ((((signy !== 0) || (this.h__I() > y.h__I())) || ((this.h__I() === y.h__I()) && (this.m__I() > y.m__I()))) || (((this.h__I() === y.h__I()) && (this.m__I() === y.m__I())) && (this.l__I() > y.l__I())))
  } else {
    return (!((((signy === 0) || (this.h__I() < y.h__I())) || ((this.h__I() === y.h__I()) && (this.m__I() < y.m__I()))) || (((this.h__I() === y.h__I()) && (this.m__I() === y.m__I())) && (this.l__I() <= y.l__I()))))
  }
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$greater$eq__sjsr_RuntimeLong__Z = (function(y) {
  return (ScalaJS.anyRefEqEq(this, y) || this.$$greater__sjsr_RuntimeLong__Z(y))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$bar__sjsr_RuntimeLong__sjsr_RuntimeLong = (function(y) {
  return ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong((this.l__I() | y.l__I()), (this.m__I() | y.m__I()), (this.h__I() | y.h__I()))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$amp__sjsr_RuntimeLong__sjsr_RuntimeLong = (function(y) {
  return ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong((this.l__I() & y.l__I()), (this.m__I() & y.m__I()), (this.h__I() & y.h__I()))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$up__sjsr_RuntimeLong__sjsr_RuntimeLong = (function(y) {
  return ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong((this.l__I() ^ y.l__I()), (this.m__I() ^ y.m__I()), (this.h__I() ^ y.h__I()))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$plus__sjsr_RuntimeLong__sjsr_RuntimeLong = (function(y) {
  var sum0 = ((this.l__I() + y.l__I()) | 0);
  var sum1 = ((((this.m__I() + y.m__I()) | 0) + (sum0 >> 22)) | 0);
  var sum2 = ((((this.h__I() + y.h__I()) | 0) + (sum1 >> 22)) | 0);
  return ScalaJS.m.sjsr_RuntimeLong().masked__I__I__I__sjsr_RuntimeLong(sum0, sum1, sum2)
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$minus__sjsr_RuntimeLong__sjsr_RuntimeLong = (function(y) {
  return this.$$plus__sjsr_RuntimeLong__sjsr_RuntimeLong(y.unary$und$minus__sjsr_RuntimeLong())
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$$times__sjsr_RuntimeLong__sjsr_RuntimeLong = (function(y) {
  var x1 = this.chunk13$1__p2__sjsr_RuntimeLong__T5(this);
  matchEnd3: {
    if ((x1 !== null)) {
      var a0 = ScalaJS.uI(x1.$$und1__O());
      var a1 = ScalaJS.uI(x1.$$und2__O());
      var a2 = ScalaJS.uI(x1.$$und3__O());
      var a3 = ScalaJS.uI(x1.$$und4__O());
      var a4 = ScalaJS.uI(x1.$$und5__O());
      var x$1 = new ScalaJS.c.T5().init___O__O__O__O__O(a0, a1, a2, a3, a4);
      break matchEnd3
    };
    throw new ScalaJS.c.s_MatchError().init___O(x1)
  };
  var a0$2 = ScalaJS.uI(x$1.$$und1__O());
  var a1$2 = ScalaJS.uI(x$1.$$und2__O());
  var a2$2 = ScalaJS.uI(x$1.$$und3__O());
  var a3$2 = ScalaJS.uI(x$1.$$und4__O());
  var a4$2 = ScalaJS.uI(x$1.$$und5__O());
  var x1$2 = this.chunk13$1__p2__sjsr_RuntimeLong__T5(y);
  matchEnd3$2: {
    if ((x1$2 !== null)) {
      var b0 = ScalaJS.uI(x1$2.$$und1__O());
      var b1 = ScalaJS.uI(x1$2.$$und2__O());
      var b2 = ScalaJS.uI(x1$2.$$und3__O());
      var b3 = ScalaJS.uI(x1$2.$$und4__O());
      var b4 = ScalaJS.uI(x1$2.$$und5__O());
      var x$2 = new ScalaJS.c.T5().init___O__O__O__O__O(b0, b1, b2, b3, b4);
      break matchEnd3$2
    };
    throw new ScalaJS.c.s_MatchError().init___O(x1$2)
  };
  var b0$2 = ScalaJS.uI(x$2.$$und1__O());
  var b1$2 = ScalaJS.uI(x$2.$$und2__O());
  var b2$2 = ScalaJS.uI(x$2.$$und3__O());
  var b3$2 = ScalaJS.uI(x$2.$$und4__O());
  var b4$2 = ScalaJS.uI(x$2.$$und5__O());
  var p0 = ScalaJS.imul(a0$2, b0$2);
  var p1 = ScalaJS.imul(a1$2, b0$2);
  var p2 = ScalaJS.imul(a2$2, b0$2);
  var p3 = ScalaJS.imul(a3$2, b0$2);
  var p4 = ScalaJS.imul(a4$2, b0$2);
  if ((b1$2 !== 0)) {
    p1 = ((p1 + ScalaJS.imul(a0$2, b1$2)) | 0);
    p2 = ((p2 + ScalaJS.imul(a1$2, b1$2)) | 0);
    p3 = ((p3 + ScalaJS.imul(a2$2, b1$2)) | 0);
    p4 = ((p4 + ScalaJS.imul(a3$2, b1$2)) | 0)
  };
  if ((b2$2 !== 0)) {
    p2 = ((p2 + ScalaJS.imul(a0$2, b2$2)) | 0);
    p3 = ((p3 + ScalaJS.imul(a1$2, b2$2)) | 0);
    p4 = ((p4 + ScalaJS.imul(a2$2, b2$2)) | 0)
  };
  if ((b3$2 !== 0)) {
    p3 = ((p3 + ScalaJS.imul(a0$2, b3$2)) | 0);
    p4 = ((p4 + ScalaJS.imul(a1$2, b3$2)) | 0)
  };
  if ((b4$2 !== 0)) {
    p4 = ((p4 + ScalaJS.imul(a0$2, b4$2)) | 0)
  };
  var c00 = (p0 & 4194303);
  var c01 = ((p1 & 511) << 13);
  var c0 = ((c00 + c01) | 0);
  var c10 = (p0 >> 22);
  var c11 = (p1 >> 9);
  var c12 = ((p2 & 262143) << 4);
  var c13 = ((p3 & 31) << 17);
  var c1 = ((((((c10 + c11) | 0) + c12) | 0) + c13) | 0);
  var c22 = (p2 >> 18);
  var c23 = (p3 >> 5);
  var c24 = ((p4 & 4095) << 8);
  var c2 = ((((c22 + c23) | 0) + c24) | 0);
  var c1n = ((c1 + (c0 >> 22)) | 0);
  return ScalaJS.m.sjsr_RuntimeLong().masked__I__I__I__sjsr_RuntimeLong(c0, c1n, ((c2 + (c1n >> 22)) | 0))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.toString__T = (function() {
  if (this.scala$scalajs$runtime$RuntimeLong$$isZero__Z()) {
    return "0"
  } else {
    if (this.isMinValue__p2__Z()) {
      return "-9223372036854775808"
    } else {
      if (this.scala$scalajs$runtime$RuntimeLong$$isNegative__Z()) {
        return ("-" + this.unary$und$minus__sjsr_RuntimeLong().toString__T())
      } else {
        var tenPowL = ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong(1755648, 238, 0);
        return this.toString0$1__p2__sjsr_RuntimeLong__T__sjsr_RuntimeLong__T(this, "", tenPowL)
      }
    }
  }
});
ScalaJS.c.sjsr_RuntimeLong.prototype.sign__p2__I = (function() {
  return (this.h__I() >> 19)
});
ScalaJS.c.sjsr_RuntimeLong.prototype.scala$scalajs$runtime$RuntimeLong$$isZero__Z = (function() {
  return (((this.l__I() === 0) && (this.m__I() === 0)) && (this.h__I() === 0))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.isMinValue__p2__Z = (function() {
  return ScalaJS.anyRefEqEq(this, ScalaJS.m.sjsr_RuntimeLong().MinValue__sjsr_RuntimeLong())
});
ScalaJS.c.sjsr_RuntimeLong.prototype.scala$scalajs$runtime$RuntimeLong$$isNegative__Z = (function() {
  return (this.sign__p2__I() !== 0)
});
ScalaJS.c.sjsr_RuntimeLong.prototype.abs__p2__sjsr_RuntimeLong = (function() {
  if ((this.sign__p2__I() === 1)) {
    return this.unary$und$minus__sjsr_RuntimeLong()
  } else {
    return this
  }
});
ScalaJS.c.sjsr_RuntimeLong.prototype.numberOfLeadingZeros__I = (function() {
  if (((this.h__I() === 0) && (this.m__I() === 0))) {
    return ((((ScalaJS.m.jl_Integer().numberOfLeadingZeros__I__I(this.l__I()) - 10) | 0) + 42) | 0)
  } else {
    if ((this.h__I() === 0)) {
      return ((((ScalaJS.m.jl_Integer().numberOfLeadingZeros__I__I(this.m__I()) - 10) | 0) + 20) | 0)
    } else {
      return ((ScalaJS.m.jl_Integer().numberOfLeadingZeros__I__I(this.h__I()) - 12) | 0)
    }
  }
});
ScalaJS.c.sjsr_RuntimeLong.prototype.powerOfTwo__p2__I = (function() {
  if (((((this.h__I() === 0) && (this.m__I() === 0)) && (this.l__I() !== 0)) && ((this.l__I() & ((this.l__I() - 1) | 0)) === 0))) {
    return ScalaJS.m.jl_Integer().numberOfTrailingZeros__I__I(this.l__I())
  } else {
    if (((((this.h__I() === 0) && (this.m__I() !== 0)) && (this.l__I() === 0)) && ((this.m__I() & ((this.m__I() - 1) | 0)) === 0))) {
      return ((ScalaJS.m.jl_Integer().numberOfTrailingZeros__I__I(this.m__I()) + 22) | 0)
    } else {
      if (((((this.h__I() !== 0) && (this.m__I() === 0)) && (this.l__I() === 0)) && ((this.h__I() & ((this.h__I() - 1) | 0)) === 0))) {
        return ((ScalaJS.m.jl_Integer().numberOfTrailingZeros__I__I(this.h__I()) + 44) | 0)
      } else {
        return -1
      }
    }
  }
});
ScalaJS.c.sjsr_RuntimeLong.prototype.scala$scalajs$runtime$RuntimeLong$$setBit__I__sjsr_RuntimeLong = (function(bit) {
  if ((bit < 22)) {
    return ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong((this.l__I() | (1 << bit)), this.m__I(), this.h__I())
  } else {
    if ((bit < 44)) {
      return ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong(this.l__I(), (this.m__I() | (1 << ((bit - 22) | 0))), this.h__I())
    } else {
      return ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong(this.l__I(), this.m__I(), (this.h__I() | (1 << ((bit - 44) | 0))))
    }
  }
});
ScalaJS.c.sjsr_RuntimeLong.prototype.divMod__p2__sjsr_RuntimeLong__sjs_js_Array = (function(y) {
  if (y.scala$scalajs$runtime$RuntimeLong$$isZero__Z()) {
    throw new ScalaJS.c.jl_ArithmeticException().init___T("/ by zero")
  } else {
    if (this.scala$scalajs$runtime$RuntimeLong$$isZero__Z()) {
      return [ScalaJS.m.sjsr_RuntimeLong().zero__sjsr_RuntimeLong(), ScalaJS.m.sjsr_RuntimeLong().zero__sjsr_RuntimeLong()]
    } else {
      if (y.isMinValue__p2__Z()) {
        if (this.isMinValue__p2__Z()) {
          return [ScalaJS.m.sjsr_RuntimeLong().one__sjsr_RuntimeLong(), ScalaJS.m.sjsr_RuntimeLong().zero__sjsr_RuntimeLong()]
        } else {
          return [ScalaJS.m.sjsr_RuntimeLong().zero__sjsr_RuntimeLong(), this]
        }
      } else {
        var xNegative = this.scala$scalajs$runtime$RuntimeLong$$isNegative__Z();
        var yNegative = y.scala$scalajs$runtime$RuntimeLong$$isNegative__Z();
        var xMinValue = this.isMinValue__p2__Z();
        var absX = this.abs__p2__sjsr_RuntimeLong();
        var absY = y.abs__p2__sjsr_RuntimeLong();
        var pow = y.powerOfTwo__p2__I();
        if ((pow >= 0)) {
          if (xMinValue) {
            var z = this.$$greater$greater__I__sjsr_RuntimeLong(pow);
            if (yNegative) {
              var jsx$1 = z.unary$und$minus__sjsr_RuntimeLong()
            } else {
              var jsx$1 = z
            };
            return [jsx$1, ScalaJS.m.sjsr_RuntimeLong().zero__sjsr_RuntimeLong()]
          } else {
            var absZ = absX.$$greater$greater__I__sjsr_RuntimeLong(pow);
            if ((!(!(xNegative ^ yNegative)))) {
              var z$2 = absZ.unary$und$minus__sjsr_RuntimeLong()
            } else {
              var z$2 = absZ
            };
            var remAbs = absX.maskRight__p2__I__sjsr_RuntimeLong(pow);
            if (xNegative) {
              var rem = remAbs.unary$und$minus__sjsr_RuntimeLong()
            } else {
              var rem = remAbs
            };
            return [z$2, rem]
          }
        } else {
          if (xMinValue) {
            return ScalaJS.m.sjsr_RuntimeLong().scala$scalajs$runtime$RuntimeLong$$divModHelper__sjsr_RuntimeLong__sjsr_RuntimeLong__Z__Z__Z__sjs_js_Array(ScalaJS.m.sjsr_RuntimeLong().MaxValue__sjsr_RuntimeLong(), absY, xNegative, yNegative, true)
          } else {
            if (absX.$$less__sjsr_RuntimeLong__Z(absY)) {
              return [ScalaJS.m.sjsr_RuntimeLong().zero__sjsr_RuntimeLong(), this]
            } else {
              return ScalaJS.m.sjsr_RuntimeLong().scala$scalajs$runtime$RuntimeLong$$divModHelper__sjsr_RuntimeLong__sjsr_RuntimeLong__Z__Z__Z__sjs_js_Array(absX, absY, xNegative, yNegative, false)
            }
          }
        }
      }
    }
  }
});
ScalaJS.c.sjsr_RuntimeLong.prototype.maskRight__p2__I__sjsr_RuntimeLong = (function(bits) {
  if ((bits <= 22)) {
    return ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong((this.l__I() & (((1 << bits) - 1) | 0)), 0, 0)
  } else {
    if ((bits <= 44)) {
      return ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong(this.l__I(), (this.m__I() & (((1 << ((bits - 22) | 0)) - 1) | 0)), 0)
    } else {
      return ScalaJS.m.sjsr_RuntimeLong().apply__I__I__I__sjsr_RuntimeLong(this.l__I(), this.m__I(), (this.h__I() & (((1 << ((bits - 44) | 0)) - 1) | 0)))
    }
  }
});
ScalaJS.c.sjsr_RuntimeLong.prototype.chunk13$1__p2__sjsr_RuntimeLong__T5 = (function(v) {
  return new ScalaJS.c.T5().init___O__O__O__O__O((v.l__I() & 8191), ((v.l__I() >> 13) | ((v.m__I() & 15) << 9)), ((v.m__I() >> 4) & 8191), ((v.m__I() >> 17) | ((v.h__I() & 255) << 5)), ((v.h__I() & 1048320) >> 8))
});
ScalaJS.c.sjsr_RuntimeLong.prototype.toString0$1__p2__sjsr_RuntimeLong__T__sjsr_RuntimeLong__T = (function(v, acc, tenPowL$1) {
  var _$this = this;
  tailCallLoop: while (true) {
    if (v.scala$scalajs$runtime$RuntimeLong$$isZero__Z()) {
      return acc
    } else {
      var quotRem = v.divMod__p2__sjsr_RuntimeLong__sjs_js_Array(tenPowL$1);
      var quot = ScalaJS.as.sjsr_RuntimeLong(ScalaJS.as.O(quotRem[0]));
      var rem = ScalaJS.as.sjsr_RuntimeLong(ScalaJS.as.O(quotRem[1]));
      var digits = ScalaJS.objectToString(rem.toInt__I());
      if (quot.scala$scalajs$runtime$RuntimeLong$$isZero__Z()) {
        var zeroPrefix = ""
      } else {
        var zeroPrefix = ScalaJS.i.sjsr_RuntimeString$class__substring__sjsr_RuntimeString__I__T("000000000", ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I(digits))
      };
      var temp$v = quot;
      var temp$acc = ((("" + zeroPrefix) + digits) + acc);
      v = temp$v;
      acc = temp$acc;
      continue tailCallLoop
    }
  }
});
ScalaJS.c.sjsr_RuntimeLong.prototype.init___I__I__I = (function(l, m, h) {
  this.l$2 = l;
  this.m$2 = m;
  this.h$2 = h;
  ScalaJS.c.jl_Number.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.sjsr_RuntimeLong = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sjsr_RuntimeLong)))
});
ScalaJS.as.sjsr_RuntimeLong = (function(obj) {
  if ((ScalaJS.is.sjsr_RuntimeLong(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.scalajs.runtime.RuntimeLong")
  }
});
ScalaJS.isArrayOf.sjsr_RuntimeLong = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sjsr_RuntimeLong)))
});
ScalaJS.asArrayOf.sjsr_RuntimeLong = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sjsr_RuntimeLong(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.scalajs.runtime.RuntimeLong;", depth)
  }
});
ScalaJS.d.sjsr_RuntimeLong = new ScalaJS.ClassTypeData({
  sjsr_RuntimeLong: 0
}, false, "scala.scalajs.runtime.RuntimeLong", ScalaJS.d.jl_Number, {
  sjsr_RuntimeLong: 1,
  jl_Comparable: 1,
  jl_Number: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.sjsr_RuntimeLong.prototype.$classData = ScalaJS.d.sjsr_RuntimeLong;
/*<skip>*/;
ScalaJS.is.sr_NonLocalReturnControl = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sr_NonLocalReturnControl)))
});
ScalaJS.as.sr_NonLocalReturnControl = (function(obj) {
  if ((ScalaJS.is.sr_NonLocalReturnControl(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.runtime.NonLocalReturnControl")
  }
});
ScalaJS.isArrayOf.sr_NonLocalReturnControl = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sr_NonLocalReturnControl)))
});
ScalaJS.asArrayOf.sr_NonLocalReturnControl = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sr_NonLocalReturnControl(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.runtime.NonLocalReturnControl;", depth)
  }
});
ScalaJS.d.sr_NonLocalReturnControl = new ScalaJS.ClassTypeData({
  sr_NonLocalReturnControl: 0
}, false, "scala.runtime.NonLocalReturnControl", ScalaJS.d.jl_Throwable, {
  sr_NonLocalReturnControl: 1,
  s_util_control_ControlThrowable: 1,
  s_util_control_NoStackTrace: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
/*<skip>*/;
ScalaJS.is.sr_Nothing$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sr_Nothing$)))
});
ScalaJS.as.sr_Nothing$ = (function(obj) {
  if ((ScalaJS.is.sr_Nothing$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.runtime.Nothing$")
  }
});
ScalaJS.isArrayOf.sr_Nothing$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sr_Nothing$)))
});
ScalaJS.asArrayOf.sr_Nothing$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sr_Nothing$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.runtime.Nothing$;", depth)
  }
});
ScalaJS.d.sr_Nothing$ = new ScalaJS.ClassTypeData({
  sr_Nothing$: 0
}, false, "scala.runtime.Nothing$", ScalaJS.d.jl_Throwable, {
  sr_Nothing$: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sr_ScalaRunTime$$anon$1 = (function() {
  ScalaJS.c.sc_AbstractIterator.call(this);
  this.c$2 = 0;
  this.cmax$2 = 0;
  this.x$2$2 = null
});
ScalaJS.c.sr_ScalaRunTime$$anon$1.prototype = new ScalaJS.h.sc_AbstractIterator();
ScalaJS.c.sr_ScalaRunTime$$anon$1.prototype.constructor = ScalaJS.c.sr_ScalaRunTime$$anon$1;
/** @constructor */
ScalaJS.h.sr_ScalaRunTime$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.sr_ScalaRunTime$$anon$1.prototype = ScalaJS.c.sr_ScalaRunTime$$anon$1.prototype;
ScalaJS.c.sr_ScalaRunTime$$anon$1.prototype.c__p2__I = (function() {
  return this.c$2
});
ScalaJS.c.sr_ScalaRunTime$$anon$1.prototype.c$und$eq__p2__I__V = (function(x$1) {
  this.c$2 = x$1
});
ScalaJS.c.sr_ScalaRunTime$$anon$1.prototype.cmax__p2__I = (function() {
  return this.cmax$2
});
ScalaJS.c.sr_ScalaRunTime$$anon$1.prototype.hasNext__Z = (function() {
  return (this.c__p2__I() < this.cmax__p2__I())
});
ScalaJS.c.sr_ScalaRunTime$$anon$1.prototype.next__O = (function() {
  var result = this.x$2$2.productElement__I__O(this.c__p2__I());
  this.c$und$eq__p2__I__V(((this.c__p2__I() + 1) | 0));
  return result
});
ScalaJS.c.sr_ScalaRunTime$$anon$1.prototype.init___s_Product = (function(x$2) {
  this.x$2$2 = x$2;
  ScalaJS.c.sc_AbstractIterator.prototype.init___.call(this);
  this.c$2 = 0;
  this.cmax$2 = x$2.productArity__I();
  return this
});
/*<skip>*/;
ScalaJS.is.sr_ScalaRunTime$$anon$1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sr_ScalaRunTime$$anon$1)))
});
ScalaJS.as.sr_ScalaRunTime$$anon$1 = (function(obj) {
  if ((ScalaJS.is.sr_ScalaRunTime$$anon$1(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.runtime.ScalaRunTime$$anon$1")
  }
});
ScalaJS.isArrayOf.sr_ScalaRunTime$$anon$1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sr_ScalaRunTime$$anon$1)))
});
ScalaJS.asArrayOf.sr_ScalaRunTime$$anon$1 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sr_ScalaRunTime$$anon$1(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.runtime.ScalaRunTime$$anon$1;", depth)
  }
});
ScalaJS.d.sr_ScalaRunTime$$anon$1 = new ScalaJS.ClassTypeData({
  sr_ScalaRunTime$$anon$1: 0
}, false, "scala.runtime.ScalaRunTime$$anon$1", ScalaJS.d.sc_AbstractIterator, {
  sr_ScalaRunTime$$anon$1: 1,
  sc_AbstractIterator: 1,
  sc_Iterator: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  O: 1
});
ScalaJS.c.sr_ScalaRunTime$$anon$1.prototype.$classData = ScalaJS.d.sr_ScalaRunTime$$anon$1;
/*<skip>*/;
/** @constructor */
ScalaJS.c.Ljava_io_PrintStream = (function() {
  ScalaJS.c.Ljava_io_FilterOutputStream.call(this);
  this.$$undout$3 = null;
  this.autoFlush$3 = false;
  this.hasError$3 = false
});
ScalaJS.c.Ljava_io_PrintStream.prototype = new ScalaJS.h.Ljava_io_FilterOutputStream();
ScalaJS.c.Ljava_io_PrintStream.prototype.constructor = ScalaJS.c.Ljava_io_PrintStream;
/** @constructor */
ScalaJS.h.Ljava_io_PrintStream = (function() {
  /*<skip>*/
});
ScalaJS.h.Ljava_io_PrintStream.prototype = ScalaJS.c.Ljava_io_PrintStream.prototype;
ScalaJS.c.Ljava_io_PrintStream.prototype.write__I__V = (function(b) {
  this.$$undout$3.write__I__V(b);
  if ((this.autoFlush$3 && (b === 10))) {
    this.flush__V()
  }
});
ScalaJS.c.Ljava_io_PrintStream.prototype.print__O__V = (function(o) {
  if ((o === null)) {
    this.print__T__V("null")
  } else {
    this.print__T__V(ScalaJS.objectToString(o))
  }
});
ScalaJS.c.Ljava_io_PrintStream.prototype.println__V = (function() {
  this.write__I__V(10)
});
ScalaJS.c.Ljava_io_PrintStream.prototype.println__T__V = (function(x) {
  this.print__T__V(x);
  this.println__V()
});
ScalaJS.c.Ljava_io_PrintStream.prototype.println__O__V = (function(x) {
  this.print__O__V(x);
  this.println__V()
});
ScalaJS.c.Ljava_io_PrintStream.prototype.init___Ljava_io_OutputStream__Z__T = (function(_out, autoFlush, ecoding) {
  this.$$undout$3 = _out;
  this.autoFlush$3 = autoFlush;
  ScalaJS.c.Ljava_io_FilterOutputStream.prototype.init___Ljava_io_OutputStream.call(this, _out);
  this.hasError$3 = false;
  return this
});
ScalaJS.c.Ljava_io_PrintStream.prototype.init___Ljava_io_OutputStream__Z = (function(out, autoFlush) {
  ScalaJS.c.Ljava_io_PrintStream.prototype.init___Ljava_io_OutputStream__Z__T.call(this, out, autoFlush, "");
  return this
});
/*<skip>*/;
ScalaJS.is.Ljava_io_PrintStream = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Ljava_io_PrintStream)))
});
ScalaJS.as.Ljava_io_PrintStream = (function(obj) {
  if ((ScalaJS.is.Ljava_io_PrintStream(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.io.PrintStream")
  }
});
ScalaJS.isArrayOf.Ljava_io_PrintStream = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Ljava_io_PrintStream)))
});
ScalaJS.asArrayOf.Ljava_io_PrintStream = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.Ljava_io_PrintStream(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.io.PrintStream;", depth)
  }
});
ScalaJS.d.Ljava_io_PrintStream = new ScalaJS.ClassTypeData({
  Ljava_io_PrintStream: 0
}, false, "java.io.PrintStream", ScalaJS.d.Ljava_io_FilterOutputStream, {
  Ljava_io_PrintStream: 1,
  jl_Appendable: 1,
  Ljava_io_FilterOutputStream: 1,
  Ljava_io_OutputStream: 1,
  Ljava_io_Flushable: 1,
  Ljava_io_Closeable: 1,
  O: 1
});
ScalaJS.c.Ljava_io_PrintStream.prototype.$classData = ScalaJS.d.Ljava_io_PrintStream;
/*<skip>*/;
/** @constructor */
ScalaJS.c.Lorg_scalajs_dom_extensions_AjaxException = (function() {
  ScalaJS.c.jl_Exception.call(this);
  this.xhr$3 = null
});
ScalaJS.c.Lorg_scalajs_dom_extensions_AjaxException.prototype = new ScalaJS.h.jl_Exception();
ScalaJS.c.Lorg_scalajs_dom_extensions_AjaxException.prototype.constructor = ScalaJS.c.Lorg_scalajs_dom_extensions_AjaxException;
/** @constructor */
ScalaJS.h.Lorg_scalajs_dom_extensions_AjaxException = (function() {
  /*<skip>*/
});
ScalaJS.h.Lorg_scalajs_dom_extensions_AjaxException.prototype = ScalaJS.c.Lorg_scalajs_dom_extensions_AjaxException.prototype;
ScalaJS.c.Lorg_scalajs_dom_extensions_AjaxException.prototype.xhr__Lorg_scalajs_dom_XMLHttpRequest = (function() {
  return this.xhr$3
});
ScalaJS.c.Lorg_scalajs_dom_extensions_AjaxException.prototype.productPrefix__T = (function() {
  return "AjaxException"
});
ScalaJS.c.Lorg_scalajs_dom_extensions_AjaxException.prototype.productArity__I = (function() {
  return 1
});
ScalaJS.c.Lorg_scalajs_dom_extensions_AjaxException.prototype.productElement__I__O = (function(x$1) {
  var x1 = x$1;
  switch (x1) {
    case 0:
      {
        return this.xhr__Lorg_scalajs_dom_XMLHttpRequest();
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.Lorg_scalajs_dom_extensions_AjaxException.prototype.productIterator__sc_Iterator = (function() {
  return ScalaJS.m.sr_ScalaRunTime().typedProductIterator__s_Product__sc_Iterator(this)
});
ScalaJS.c.Lorg_scalajs_dom_extensions_AjaxException.prototype.canEqual__O__Z = (function(x$1) {
  return ScalaJS.is.Lorg_scalajs_dom_extensions_AjaxException(x$1)
});
ScalaJS.c.Lorg_scalajs_dom_extensions_AjaxException.prototype.hashCode__I = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undhashCode__s_Product__I(this)
});
ScalaJS.c.Lorg_scalajs_dom_extensions_AjaxException.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else {
    var x1 = x$1;
    matchEnd4: {
      if (ScalaJS.is.Lorg_scalajs_dom_extensions_AjaxException(x1)) {
        var jsx$1 = true;
        break matchEnd4
      };
      var jsx$1 = false;
      break matchEnd4
    };
    if (jsx$1) {
      var AjaxException$1 = ScalaJS.as.Lorg_scalajs_dom_extensions_AjaxException(x$1);
      return ((this.xhr__Lorg_scalajs_dom_XMLHttpRequest() === AjaxException$1.xhr__Lorg_scalajs_dom_XMLHttpRequest()) && AjaxException$1.canEqual__O__Z(this))
    } else {
      return false
    }
  }
});
ScalaJS.c.Lorg_scalajs_dom_extensions_AjaxException.prototype.init___Lorg_scalajs_dom_XMLHttpRequest = (function(xhr) {
  this.xhr$3 = xhr;
  ScalaJS.c.jl_Exception.prototype.init___.call(this);
  ScalaJS.i.s_Product$class__$init$__s_Product__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.Lorg_scalajs_dom_extensions_AjaxException = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lorg_scalajs_dom_extensions_AjaxException)))
});
ScalaJS.as.Lorg_scalajs_dom_extensions_AjaxException = (function(obj) {
  if ((ScalaJS.is.Lorg_scalajs_dom_extensions_AjaxException(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "org.scalajs.dom.extensions.AjaxException")
  }
});
ScalaJS.isArrayOf.Lorg_scalajs_dom_extensions_AjaxException = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lorg_scalajs_dom_extensions_AjaxException)))
});
ScalaJS.asArrayOf.Lorg_scalajs_dom_extensions_AjaxException = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.Lorg_scalajs_dom_extensions_AjaxException(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lorg.scalajs.dom.extensions.AjaxException;", depth)
  }
});
ScalaJS.d.Lorg_scalajs_dom_extensions_AjaxException = new ScalaJS.ClassTypeData({
  Lorg_scalajs_dom_extensions_AjaxException: 0
}, false, "org.scalajs.dom.extensions.AjaxException", ScalaJS.d.jl_Exception, {
  Lorg_scalajs_dom_extensions_AjaxException: 1,
  s_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.Lorg_scalajs_dom_extensions_AjaxException.prototype.$classData = ScalaJS.d.Lorg_scalajs_dom_extensions_AjaxException;
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_AssertionError = (function() {
  ScalaJS.c.jl_Error.call(this)
});
ScalaJS.c.jl_AssertionError.prototype = new ScalaJS.h.jl_Error();
ScalaJS.c.jl_AssertionError.prototype.constructor = ScalaJS.c.jl_AssertionError;
/** @constructor */
ScalaJS.h.jl_AssertionError = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_AssertionError.prototype = ScalaJS.c.jl_AssertionError.prototype;
ScalaJS.c.jl_AssertionError.prototype.init___O = (function(o) {
  ScalaJS.c.jl_AssertionError.prototype.init___T.call(this, ScalaJS.objectToString(o));
  return this
});
/*<skip>*/;
ScalaJS.is.jl_AssertionError = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_AssertionError)))
});
ScalaJS.as.jl_AssertionError = (function(obj) {
  if ((ScalaJS.is.jl_AssertionError(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.AssertionError")
  }
});
ScalaJS.isArrayOf.jl_AssertionError = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_AssertionError)))
});
ScalaJS.asArrayOf.jl_AssertionError = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_AssertionError(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.AssertionError;", depth)
  }
});
ScalaJS.d.jl_AssertionError = new ScalaJS.ClassTypeData({
  jl_AssertionError: 0
}, false, "java.lang.AssertionError", ScalaJS.d.jl_Error, {
  jl_AssertionError: 1,
  jl_Error: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.jl_AssertionError.prototype.$classData = ScalaJS.d.jl_AssertionError;
/*<skip>*/;
ScalaJS.is.jl_InterruptedException = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_InterruptedException)))
});
ScalaJS.as.jl_InterruptedException = (function(obj) {
  if ((ScalaJS.is.jl_InterruptedException(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.InterruptedException")
  }
});
ScalaJS.isArrayOf.jl_InterruptedException = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_InterruptedException)))
});
ScalaJS.asArrayOf.jl_InterruptedException = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_InterruptedException(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.InterruptedException;", depth)
  }
});
ScalaJS.d.jl_InterruptedException = new ScalaJS.ClassTypeData({
  jl_InterruptedException: 0
}, false, "java.lang.InterruptedException", ScalaJS.d.jl_Exception, {
  jl_InterruptedException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
/*<skip>*/;
ScalaJS.is.jl_LinkageError = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_LinkageError)))
});
ScalaJS.as.jl_LinkageError = (function(obj) {
  if ((ScalaJS.is.jl_LinkageError(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.LinkageError")
  }
});
ScalaJS.isArrayOf.jl_LinkageError = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_LinkageError)))
});
ScalaJS.asArrayOf.jl_LinkageError = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_LinkageError(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.LinkageError;", depth)
  }
});
ScalaJS.d.jl_LinkageError = new ScalaJS.ClassTypeData({
  jl_LinkageError: 0
}, false, "java.lang.LinkageError", ScalaJS.d.jl_Error, {
  jl_LinkageError: 1,
  jl_Error: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_RuntimeException = (function() {
  ScalaJS.c.jl_Exception.call(this)
});
ScalaJS.c.jl_RuntimeException.prototype = new ScalaJS.h.jl_Exception();
ScalaJS.c.jl_RuntimeException.prototype.constructor = ScalaJS.c.jl_RuntimeException;
/** @constructor */
ScalaJS.h.jl_RuntimeException = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_RuntimeException.prototype = ScalaJS.c.jl_RuntimeException.prototype;
ScalaJS.c.jl_RuntimeException.prototype.init___T = (function(s) {
  ScalaJS.c.jl_RuntimeException.prototype.init___T__jl_Throwable.call(this, s, null);
  return this
});
ScalaJS.c.jl_RuntimeException.prototype.init___ = (function() {
  ScalaJS.c.jl_RuntimeException.prototype.init___T__jl_Throwable.call(this, null, null);
  return this
});
/*<skip>*/;
ScalaJS.is.jl_RuntimeException = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_RuntimeException)))
});
ScalaJS.as.jl_RuntimeException = (function(obj) {
  if ((ScalaJS.is.jl_RuntimeException(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.RuntimeException")
  }
});
ScalaJS.isArrayOf.jl_RuntimeException = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_RuntimeException)))
});
ScalaJS.asArrayOf.jl_RuntimeException = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_RuntimeException(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.RuntimeException;", depth)
  }
});
ScalaJS.d.jl_RuntimeException = new ScalaJS.ClassTypeData({
  jl_RuntimeException: 0
}, false, "java.lang.RuntimeException", ScalaJS.d.jl_Exception, {
  jl_RuntimeException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.jl_RuntimeException.prototype.$classData = ScalaJS.d.jl_RuntimeException;
/*<skip>*/;
ScalaJS.is.jl_ThreadDeath = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_ThreadDeath)))
});
ScalaJS.as.jl_ThreadDeath = (function(obj) {
  if ((ScalaJS.is.jl_ThreadDeath(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.ThreadDeath")
  }
});
ScalaJS.isArrayOf.jl_ThreadDeath = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_ThreadDeath)))
});
ScalaJS.asArrayOf.jl_ThreadDeath = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_ThreadDeath(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.ThreadDeath;", depth)
  }
});
ScalaJS.d.jl_ThreadDeath = new ScalaJS.ClassTypeData({
  jl_ThreadDeath: 0
}, false, "java.lang.ThreadDeath", ScalaJS.d.jl_Error, {
  jl_ThreadDeath: 1,
  jl_Error: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
/*<skip>*/;
ScalaJS.is.jl_VirtualMachineError = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_VirtualMachineError)))
});
ScalaJS.as.jl_VirtualMachineError = (function(obj) {
  if ((ScalaJS.is.jl_VirtualMachineError(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.VirtualMachineError")
  }
});
ScalaJS.isArrayOf.jl_VirtualMachineError = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_VirtualMachineError)))
});
ScalaJS.asArrayOf.jl_VirtualMachineError = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_VirtualMachineError(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.VirtualMachineError;", depth)
  }
});
ScalaJS.d.jl_VirtualMachineError = new ScalaJS.ClassTypeData({
  jl_VirtualMachineError: 0
}, false, "java.lang.VirtualMachineError", ScalaJS.d.jl_Error, {
  jl_VirtualMachineError: 1,
  jl_Error: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.ju_concurrent_ExecutionException = (function() {
  ScalaJS.c.jl_Exception.call(this)
});
ScalaJS.c.ju_concurrent_ExecutionException.prototype = new ScalaJS.h.jl_Exception();
ScalaJS.c.ju_concurrent_ExecutionException.prototype.constructor = ScalaJS.c.ju_concurrent_ExecutionException;
/** @constructor */
ScalaJS.h.ju_concurrent_ExecutionException = (function() {
  /*<skip>*/
});
ScalaJS.h.ju_concurrent_ExecutionException.prototype = ScalaJS.c.ju_concurrent_ExecutionException.prototype;
/*<skip>*/;
ScalaJS.is.ju_concurrent_ExecutionException = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.ju_concurrent_ExecutionException)))
});
ScalaJS.as.ju_concurrent_ExecutionException = (function(obj) {
  if ((ScalaJS.is.ju_concurrent_ExecutionException(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.util.concurrent.ExecutionException")
  }
});
ScalaJS.isArrayOf.ju_concurrent_ExecutionException = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.ju_concurrent_ExecutionException)))
});
ScalaJS.asArrayOf.ju_concurrent_ExecutionException = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.ju_concurrent_ExecutionException(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.util.concurrent.ExecutionException;", depth)
  }
});
ScalaJS.d.ju_concurrent_ExecutionException = new ScalaJS.ClassTypeData({
  ju_concurrent_ExecutionException: 0
}, false, "java.util.concurrent.ExecutionException", ScalaJS.d.jl_Exception, {
  ju_concurrent_ExecutionException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.ju_concurrent_ExecutionException.prototype.$classData = ScalaJS.d.ju_concurrent_ExecutionException;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$1 = (function() {
  ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$1.prototype = new ScalaJS.h.s_reflect_ManifestFactory$PhantomManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$1.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$1;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$1.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$1.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$1.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype.init___jl_Class__T.call(this, ScalaJS.m.s_reflect_ManifestFactory().scala$reflect$ManifestFactory$$ObjectTYPE__jl_Class(), "Any");
  return this
});
/*<skip>*/;
ScalaJS.is.s_reflect_ManifestFactory$$anon$1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ManifestFactory$$anon$1)))
});
ScalaJS.as.s_reflect_ManifestFactory$$anon$1 = (function(obj) {
  if ((ScalaJS.is.s_reflect_ManifestFactory$$anon$1(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.reflect.ManifestFactory$$anon$1")
  }
});
ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ManifestFactory$$anon$1)))
});
ScalaJS.asArrayOf.s_reflect_ManifestFactory$$anon$1 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$1(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ManifestFactory$$anon$1;", depth)
  }
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$1 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$1: 0
}, false, "scala.reflect.ManifestFactory$$anon$1", ScalaJS.d.s_reflect_ManifestFactory$PhantomManifest, {
  s_reflect_ManifestFactory$$anon$1: 1,
  s_reflect_ManifestFactory$PhantomManifest: 1,
  s_reflect_ManifestFactory$ClassTypeManifest: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_Equals: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$1.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$1;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$2 = (function() {
  ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$2.prototype = new ScalaJS.h.s_reflect_ManifestFactory$PhantomManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$2.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$2;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$2 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$2.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$2.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$2.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype.init___jl_Class__T.call(this, ScalaJS.m.s_reflect_ManifestFactory().scala$reflect$ManifestFactory$$ObjectTYPE__jl_Class(), "Object");
  return this
});
/*<skip>*/;
ScalaJS.is.s_reflect_ManifestFactory$$anon$2 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ManifestFactory$$anon$2)))
});
ScalaJS.as.s_reflect_ManifestFactory$$anon$2 = (function(obj) {
  if ((ScalaJS.is.s_reflect_ManifestFactory$$anon$2(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.reflect.ManifestFactory$$anon$2")
  }
});
ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$2 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ManifestFactory$$anon$2)))
});
ScalaJS.asArrayOf.s_reflect_ManifestFactory$$anon$2 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$2(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ManifestFactory$$anon$2;", depth)
  }
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$2 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$2: 0
}, false, "scala.reflect.ManifestFactory$$anon$2", ScalaJS.d.s_reflect_ManifestFactory$PhantomManifest, {
  s_reflect_ManifestFactory$$anon$2: 1,
  s_reflect_ManifestFactory$PhantomManifest: 1,
  s_reflect_ManifestFactory$ClassTypeManifest: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_Equals: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$2.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$2;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$3 = (function() {
  ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$3.prototype = new ScalaJS.h.s_reflect_ManifestFactory$PhantomManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$3.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$3;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$3 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$3.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$3.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$3.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype.init___jl_Class__T.call(this, ScalaJS.m.s_reflect_ManifestFactory().scala$reflect$ManifestFactory$$ObjectTYPE__jl_Class(), "AnyVal");
  return this
});
/*<skip>*/;
ScalaJS.is.s_reflect_ManifestFactory$$anon$3 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ManifestFactory$$anon$3)))
});
ScalaJS.as.s_reflect_ManifestFactory$$anon$3 = (function(obj) {
  if ((ScalaJS.is.s_reflect_ManifestFactory$$anon$3(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.reflect.ManifestFactory$$anon$3")
  }
});
ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$3 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ManifestFactory$$anon$3)))
});
ScalaJS.asArrayOf.s_reflect_ManifestFactory$$anon$3 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$3(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ManifestFactory$$anon$3;", depth)
  }
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$3 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$3: 0
}, false, "scala.reflect.ManifestFactory$$anon$3", ScalaJS.d.s_reflect_ManifestFactory$PhantomManifest, {
  s_reflect_ManifestFactory$$anon$3: 1,
  s_reflect_ManifestFactory$PhantomManifest: 1,
  s_reflect_ManifestFactory$ClassTypeManifest: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_Equals: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$3.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$3;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$4 = (function() {
  ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$4.prototype = new ScalaJS.h.s_reflect_ManifestFactory$PhantomManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$4.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$4;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$4 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$4.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$4.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$4.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype.init___jl_Class__T.call(this, ScalaJS.m.s_reflect_ManifestFactory().scala$reflect$ManifestFactory$$NullTYPE__jl_Class(), "Null");
  return this
});
/*<skip>*/;
ScalaJS.is.s_reflect_ManifestFactory$$anon$4 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ManifestFactory$$anon$4)))
});
ScalaJS.as.s_reflect_ManifestFactory$$anon$4 = (function(obj) {
  if ((ScalaJS.is.s_reflect_ManifestFactory$$anon$4(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.reflect.ManifestFactory$$anon$4")
  }
});
ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$4 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ManifestFactory$$anon$4)))
});
ScalaJS.asArrayOf.s_reflect_ManifestFactory$$anon$4 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$4(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ManifestFactory$$anon$4;", depth)
  }
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$4 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$4: 0
}, false, "scala.reflect.ManifestFactory$$anon$4", ScalaJS.d.s_reflect_ManifestFactory$PhantomManifest, {
  s_reflect_ManifestFactory$$anon$4: 1,
  s_reflect_ManifestFactory$PhantomManifest: 1,
  s_reflect_ManifestFactory$ClassTypeManifest: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_Equals: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$4.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$4;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_reflect_ManifestFactory$$anon$5 = (function() {
  ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.call(this)
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$5.prototype = new ScalaJS.h.s_reflect_ManifestFactory$PhantomManifest();
ScalaJS.c.s_reflect_ManifestFactory$$anon$5.prototype.constructor = ScalaJS.c.s_reflect_ManifestFactory$$anon$5;
/** @constructor */
ScalaJS.h.s_reflect_ManifestFactory$$anon$5 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_reflect_ManifestFactory$$anon$5.prototype = ScalaJS.c.s_reflect_ManifestFactory$$anon$5.prototype;
ScalaJS.c.s_reflect_ManifestFactory$$anon$5.prototype.init___ = (function() {
  ScalaJS.c.s_reflect_ManifestFactory$PhantomManifest.prototype.init___jl_Class__T.call(this, ScalaJS.m.s_reflect_ManifestFactory().scala$reflect$ManifestFactory$$NothingTYPE__jl_Class(), "Nothing");
  return this
});
/*<skip>*/;
ScalaJS.is.s_reflect_ManifestFactory$$anon$5 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_reflect_ManifestFactory$$anon$5)))
});
ScalaJS.as.s_reflect_ManifestFactory$$anon$5 = (function(obj) {
  if ((ScalaJS.is.s_reflect_ManifestFactory$$anon$5(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.reflect.ManifestFactory$$anon$5")
  }
});
ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$5 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_reflect_ManifestFactory$$anon$5)))
});
ScalaJS.asArrayOf.s_reflect_ManifestFactory$$anon$5 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_reflect_ManifestFactory$$anon$5(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.reflect.ManifestFactory$$anon$5;", depth)
  }
});
ScalaJS.d.s_reflect_ManifestFactory$$anon$5 = new ScalaJS.ClassTypeData({
  s_reflect_ManifestFactory$$anon$5: 0
}, false, "scala.reflect.ManifestFactory$$anon$5", ScalaJS.d.s_reflect_ManifestFactory$PhantomManifest, {
  s_reflect_ManifestFactory$$anon$5: 1,
  s_reflect_ManifestFactory$PhantomManifest: 1,
  s_reflect_ManifestFactory$ClassTypeManifest: 1,
  s_reflect_Manifest: 1,
  s_reflect_ClassTag: 1,
  s_Equals: 1,
  s_reflect_ClassManifestDeprecatedApis: 1,
  s_reflect_OptManifest: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_reflect_ManifestFactory$$anon$5.prototype.$classData = ScalaJS.d.s_reflect_ManifestFactory$$anon$5;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_util_DynamicVariable$$anon$1 = (function() {
  ScalaJS.c.jl_InheritableThreadLocal.call(this);
  this.$$outer$3 = null
});
ScalaJS.c.s_util_DynamicVariable$$anon$1.prototype = new ScalaJS.h.jl_InheritableThreadLocal();
ScalaJS.c.s_util_DynamicVariable$$anon$1.prototype.constructor = ScalaJS.c.s_util_DynamicVariable$$anon$1;
/** @constructor */
ScalaJS.h.s_util_DynamicVariable$$anon$1 = (function() {
  /*<skip>*/
});
ScalaJS.h.s_util_DynamicVariable$$anon$1.prototype = ScalaJS.c.s_util_DynamicVariable$$anon$1.prototype;
ScalaJS.c.s_util_DynamicVariable$$anon$1.prototype.initialValue__O = (function() {
  return this.$$outer$3.scala$util$DynamicVariable$$init$f
});
ScalaJS.c.s_util_DynamicVariable$$anon$1.prototype.init___s_util_DynamicVariable = (function($$outer) {
  if (($$outer === null)) {
    throw ScalaJS.unwrapJavaScriptException(null)
  } else {
    this.$$outer$3 = $$outer
  };
  ScalaJS.c.jl_InheritableThreadLocal.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.s_util_DynamicVariable$$anon$1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_util_DynamicVariable$$anon$1)))
});
ScalaJS.as.s_util_DynamicVariable$$anon$1 = (function(obj) {
  if ((ScalaJS.is.s_util_DynamicVariable$$anon$1(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.util.DynamicVariable$$anon$1")
  }
});
ScalaJS.isArrayOf.s_util_DynamicVariable$$anon$1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_util_DynamicVariable$$anon$1)))
});
ScalaJS.asArrayOf.s_util_DynamicVariable$$anon$1 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_util_DynamicVariable$$anon$1(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.util.DynamicVariable$$anon$1;", depth)
  }
});
ScalaJS.d.s_util_DynamicVariable$$anon$1 = new ScalaJS.ClassTypeData({
  s_util_DynamicVariable$$anon$1: 0
}, false, "scala.util.DynamicVariable$$anon$1", ScalaJS.d.jl_InheritableThreadLocal, {
  s_util_DynamicVariable$$anon$1: 1,
  jl_InheritableThreadLocal: 1,
  jl_ThreadLocal: 1,
  O: 1
});
ScalaJS.c.s_util_DynamicVariable$$anon$1.prototype.$classData = ScalaJS.d.s_util_DynamicVariable$$anon$1;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sc_AbstractSeq = (function() {
  ScalaJS.c.sc_AbstractIterable.call(this)
});
ScalaJS.c.sc_AbstractSeq.prototype = new ScalaJS.h.sc_AbstractIterable();
ScalaJS.c.sc_AbstractSeq.prototype.constructor = ScalaJS.c.sc_AbstractSeq;
/** @constructor */
ScalaJS.h.sc_AbstractSeq = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_AbstractSeq.prototype = ScalaJS.c.sc_AbstractSeq.prototype;
ScalaJS.c.sc_AbstractSeq.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.i.sc_SeqLike$class__lengthCompare__sc_SeqLike__I__I(this, len)
});
ScalaJS.c.sc_AbstractSeq.prototype.isEmpty__Z = (function() {
  return ScalaJS.i.sc_SeqLike$class__isEmpty__sc_SeqLike__Z(this)
});
ScalaJS.c.sc_AbstractSeq.prototype.size__I = (function() {
  return ScalaJS.i.sc_SeqLike$class__size__sc_SeqLike__I(this)
});
ScalaJS.c.sc_AbstractSeq.prototype.toString__T = (function() {
  return ScalaJS.i.sc_SeqLike$class__toString__sc_SeqLike__T(this)
});
ScalaJS.c.sc_AbstractSeq.prototype.equals__O__Z = (function(that) {
  return ScalaJS.i.sc_GenSeqLike$class__equals__sc_GenSeqLike__O__Z(this, that)
});
ScalaJS.c.sc_AbstractSeq.prototype.init___ = (function() {
  ScalaJS.c.sc_AbstractIterable.prototype.init___.call(this);
  ScalaJS.i.s_Function1$class__$init$__F1__V(this);
  ScalaJS.i.s_PartialFunction$class__$init$__s_PartialFunction__V(this);
  ScalaJS.i.sc_GenSeqLike$class__$init$__sc_GenSeqLike__V(this);
  ScalaJS.i.sc_GenSeq$class__$init$__sc_GenSeq__V(this);
  ScalaJS.i.sc_SeqLike$class__$init$__sc_SeqLike__V(this);
  ScalaJS.i.sc_Seq$class__$init$__sc_Seq__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.sc_AbstractSeq = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_AbstractSeq)))
});
ScalaJS.as.sc_AbstractSeq = (function(obj) {
  if ((ScalaJS.is.sc_AbstractSeq(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.AbstractSeq")
  }
});
ScalaJS.isArrayOf.sc_AbstractSeq = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_AbstractSeq)))
});
ScalaJS.asArrayOf.sc_AbstractSeq = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sc_AbstractSeq(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.AbstractSeq;", depth)
  }
});
ScalaJS.d.sc_AbstractSeq = new ScalaJS.ClassTypeData({
  sc_AbstractSeq: 0
}, false, "scala.collection.AbstractSeq", ScalaJS.d.sc_AbstractIterable, {
  sc_AbstractSeq: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_AbstractIterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.sc_AbstractSeq.prototype.$classData = ScalaJS.d.sc_AbstractSeq;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sc_Iterable$ = (function() {
  ScalaJS.c.scg_GenTraversableFactory.call(this)
});
ScalaJS.c.sc_Iterable$.prototype = new ScalaJS.h.scg_GenTraversableFactory();
ScalaJS.c.sc_Iterable$.prototype.constructor = ScalaJS.c.sc_Iterable$;
/** @constructor */
ScalaJS.h.sc_Iterable$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_Iterable$.prototype = ScalaJS.c.sc_Iterable$.prototype;
/*<skip>*/;
ScalaJS.is.sc_Iterable$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_Iterable$)))
});
ScalaJS.as.sc_Iterable$ = (function(obj) {
  if ((ScalaJS.is.sc_Iterable$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.Iterable$")
  }
});
ScalaJS.isArrayOf.sc_Iterable$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_Iterable$)))
});
ScalaJS.asArrayOf.sc_Iterable$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sc_Iterable$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.Iterable$;", depth)
  }
});
ScalaJS.d.sc_Iterable$ = new ScalaJS.ClassTypeData({
  sc_Iterable$: 0
}, false, "scala.collection.Iterable$", ScalaJS.d.scg_GenTraversableFactory, {
  sc_Iterable$: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1
});
ScalaJS.c.sc_Iterable$.prototype.$classData = ScalaJS.d.sc_Iterable$;
ScalaJS.n.sc_Iterable = undefined;
ScalaJS.m.sc_Iterable = (function() {
  if ((!ScalaJS.n.sc_Iterable)) {
    ScalaJS.n.sc_Iterable = new ScalaJS.c.sc_Iterable$().init___()
  };
  return ScalaJS.n.sc_Iterable
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sc_Traversable$ = (function() {
  ScalaJS.c.scg_GenTraversableFactory.call(this);
  this.breaks$3 = null
});
ScalaJS.c.sc_Traversable$.prototype = new ScalaJS.h.scg_GenTraversableFactory();
ScalaJS.c.sc_Traversable$.prototype.constructor = ScalaJS.c.sc_Traversable$;
/** @constructor */
ScalaJS.h.sc_Traversable$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_Traversable$.prototype = ScalaJS.c.sc_Traversable$.prototype;
ScalaJS.c.sc_Traversable$.prototype.init___ = (function() {
  ScalaJS.c.scg_GenTraversableFactory.prototype.init___.call(this);
  ScalaJS.n.sc_Traversable = this;
  this.breaks$3 = new ScalaJS.c.s_util_control_Breaks().init___();
  return this
});
/*<skip>*/;
ScalaJS.is.sc_Traversable$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_Traversable$)))
});
ScalaJS.as.sc_Traversable$ = (function(obj) {
  if ((ScalaJS.is.sc_Traversable$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.Traversable$")
  }
});
ScalaJS.isArrayOf.sc_Traversable$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_Traversable$)))
});
ScalaJS.asArrayOf.sc_Traversable$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sc_Traversable$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.Traversable$;", depth)
  }
});
ScalaJS.d.sc_Traversable$ = new ScalaJS.ClassTypeData({
  sc_Traversable$: 0
}, false, "scala.collection.Traversable$", ScalaJS.d.scg_GenTraversableFactory, {
  sc_Traversable$: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1
});
ScalaJS.c.sc_Traversable$.prototype.$classData = ScalaJS.d.sc_Traversable$;
ScalaJS.n.sc_Traversable = undefined;
ScalaJS.m.sc_Traversable = (function() {
  if ((!ScalaJS.n.sc_Traversable)) {
    ScalaJS.n.sc_Traversable = new ScalaJS.c.sc_Traversable$().init___()
  };
  return ScalaJS.n.sc_Traversable
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.scg_GenSeqFactory = (function() {
  ScalaJS.c.scg_GenTraversableFactory.call(this)
});
ScalaJS.c.scg_GenSeqFactory.prototype = new ScalaJS.h.scg_GenTraversableFactory();
ScalaJS.c.scg_GenSeqFactory.prototype.constructor = ScalaJS.c.scg_GenSeqFactory;
/** @constructor */
ScalaJS.h.scg_GenSeqFactory = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_GenSeqFactory.prototype = ScalaJS.c.scg_GenSeqFactory.prototype;
/*<skip>*/;
ScalaJS.is.scg_GenSeqFactory = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scg_GenSeqFactory)))
});
ScalaJS.as.scg_GenSeqFactory = (function(obj) {
  if ((ScalaJS.is.scg_GenSeqFactory(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.generic.GenSeqFactory")
  }
});
ScalaJS.isArrayOf.scg_GenSeqFactory = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scg_GenSeqFactory)))
});
ScalaJS.asArrayOf.scg_GenSeqFactory = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scg_GenSeqFactory(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.generic.GenSeqFactory;", depth)
  }
});
ScalaJS.d.scg_GenSeqFactory = new ScalaJS.ClassTypeData({
  scg_GenSeqFactory: 0
}, false, "scala.collection.generic.GenSeqFactory", ScalaJS.d.scg_GenTraversableFactory, {
  scg_GenSeqFactory: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1
});
ScalaJS.c.scg_GenSeqFactory.prototype.$classData = ScalaJS.d.scg_GenSeqFactory;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scg_ImmutableMapFactory = (function() {
  ScalaJS.c.scg_MapFactory.call(this)
});
ScalaJS.c.scg_ImmutableMapFactory.prototype = new ScalaJS.h.scg_MapFactory();
ScalaJS.c.scg_ImmutableMapFactory.prototype.constructor = ScalaJS.c.scg_ImmutableMapFactory;
/** @constructor */
ScalaJS.h.scg_ImmutableMapFactory = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_ImmutableMapFactory.prototype = ScalaJS.c.scg_ImmutableMapFactory.prototype;
/*<skip>*/;
ScalaJS.is.scg_ImmutableMapFactory = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scg_ImmutableMapFactory)))
});
ScalaJS.as.scg_ImmutableMapFactory = (function(obj) {
  if ((ScalaJS.is.scg_ImmutableMapFactory(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.generic.ImmutableMapFactory")
  }
});
ScalaJS.isArrayOf.scg_ImmutableMapFactory = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scg_ImmutableMapFactory)))
});
ScalaJS.asArrayOf.scg_ImmutableMapFactory = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scg_ImmutableMapFactory(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.generic.ImmutableMapFactory;", depth)
  }
});
ScalaJS.d.scg_ImmutableMapFactory = new ScalaJS.ClassTypeData({
  scg_ImmutableMapFactory: 0
}, false, "scala.collection.generic.ImmutableMapFactory", ScalaJS.d.scg_MapFactory, {
  scg_ImmutableMapFactory: 1,
  scg_MapFactory: 1,
  scg_GenMapFactory: 1,
  O: 1
});
ScalaJS.c.scg_ImmutableMapFactory.prototype.$classData = ScalaJS.d.scg_ImmutableMapFactory;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scg_SetFactory = (function() {
  ScalaJS.c.scg_GenSetFactory.call(this)
});
ScalaJS.c.scg_SetFactory.prototype = new ScalaJS.h.scg_GenSetFactory();
ScalaJS.c.scg_SetFactory.prototype.constructor = ScalaJS.c.scg_SetFactory;
/** @constructor */
ScalaJS.h.scg_SetFactory = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_SetFactory.prototype = ScalaJS.c.scg_SetFactory.prototype;
/*<skip>*/;
ScalaJS.is.scg_SetFactory = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scg_SetFactory)))
});
ScalaJS.as.scg_SetFactory = (function(obj) {
  if ((ScalaJS.is.scg_SetFactory(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.generic.SetFactory")
  }
});
ScalaJS.isArrayOf.scg_SetFactory = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scg_SetFactory)))
});
ScalaJS.asArrayOf.scg_SetFactory = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scg_SetFactory(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.generic.SetFactory;", depth)
  }
});
ScalaJS.d.scg_SetFactory = new ScalaJS.ClassTypeData({
  scg_SetFactory: 0
}, false, "scala.collection.generic.SetFactory", ScalaJS.d.scg_GenSetFactory, {
  scg_SetFactory: 1,
  scg_GenericSeqCompanion: 1,
  scg_GenSetFactory: 1,
  scg_GenericCompanion: 1,
  O: 1
});
ScalaJS.c.scg_SetFactory.prototype.$classData = ScalaJS.d.scg_SetFactory;
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_ArithmeticException = (function() {
  ScalaJS.c.jl_RuntimeException.call(this)
});
ScalaJS.c.jl_ArithmeticException.prototype = new ScalaJS.h.jl_RuntimeException();
ScalaJS.c.jl_ArithmeticException.prototype.constructor = ScalaJS.c.jl_ArithmeticException;
/** @constructor */
ScalaJS.h.jl_ArithmeticException = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_ArithmeticException.prototype = ScalaJS.c.jl_ArithmeticException.prototype;
/*<skip>*/;
ScalaJS.is.jl_ArithmeticException = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_ArithmeticException)))
});
ScalaJS.as.jl_ArithmeticException = (function(obj) {
  if ((ScalaJS.is.jl_ArithmeticException(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.ArithmeticException")
  }
});
ScalaJS.isArrayOf.jl_ArithmeticException = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_ArithmeticException)))
});
ScalaJS.asArrayOf.jl_ArithmeticException = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_ArithmeticException(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.ArithmeticException;", depth)
  }
});
ScalaJS.d.jl_ArithmeticException = new ScalaJS.ClassTypeData({
  jl_ArithmeticException: 0
}, false, "java.lang.ArithmeticException", ScalaJS.d.jl_RuntimeException, {
  jl_ArithmeticException: 1,
  jl_RuntimeException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.jl_ArithmeticException.prototype.$classData = ScalaJS.d.jl_ArithmeticException;
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_ClassCastException = (function() {
  ScalaJS.c.jl_RuntimeException.call(this)
});
ScalaJS.c.jl_ClassCastException.prototype = new ScalaJS.h.jl_RuntimeException();
ScalaJS.c.jl_ClassCastException.prototype.constructor = ScalaJS.c.jl_ClassCastException;
/** @constructor */
ScalaJS.h.jl_ClassCastException = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_ClassCastException.prototype = ScalaJS.c.jl_ClassCastException.prototype;
/*<skip>*/;
ScalaJS.is.jl_ClassCastException = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_ClassCastException)))
});
ScalaJS.as.jl_ClassCastException = (function(obj) {
  if ((ScalaJS.is.jl_ClassCastException(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.ClassCastException")
  }
});
ScalaJS.isArrayOf.jl_ClassCastException = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_ClassCastException)))
});
ScalaJS.asArrayOf.jl_ClassCastException = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_ClassCastException(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.ClassCastException;", depth)
  }
});
ScalaJS.d.jl_ClassCastException = new ScalaJS.ClassTypeData({
  jl_ClassCastException: 0
}, false, "java.lang.ClassCastException", ScalaJS.d.jl_RuntimeException, {
  jl_ClassCastException: 1,
  jl_RuntimeException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.jl_ClassCastException.prototype.$classData = ScalaJS.d.jl_ClassCastException;
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_IllegalArgumentException = (function() {
  ScalaJS.c.jl_RuntimeException.call(this)
});
ScalaJS.c.jl_IllegalArgumentException.prototype = new ScalaJS.h.jl_RuntimeException();
ScalaJS.c.jl_IllegalArgumentException.prototype.constructor = ScalaJS.c.jl_IllegalArgumentException;
/** @constructor */
ScalaJS.h.jl_IllegalArgumentException = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_IllegalArgumentException.prototype = ScalaJS.c.jl_IllegalArgumentException.prototype;
ScalaJS.c.jl_IllegalArgumentException.prototype.init___T = (function(s) {
  ScalaJS.c.jl_IllegalArgumentException.prototype.init___T__jl_Throwable.call(this, s, null);
  return this
});
ScalaJS.c.jl_IllegalArgumentException.prototype.init___ = (function() {
  ScalaJS.c.jl_IllegalArgumentException.prototype.init___T__jl_Throwable.call(this, null, null);
  return this
});
/*<skip>*/;
ScalaJS.is.jl_IllegalArgumentException = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_IllegalArgumentException)))
});
ScalaJS.as.jl_IllegalArgumentException = (function(obj) {
  if ((ScalaJS.is.jl_IllegalArgumentException(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.IllegalArgumentException")
  }
});
ScalaJS.isArrayOf.jl_IllegalArgumentException = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_IllegalArgumentException)))
});
ScalaJS.asArrayOf.jl_IllegalArgumentException = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_IllegalArgumentException(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.IllegalArgumentException;", depth)
  }
});
ScalaJS.d.jl_IllegalArgumentException = new ScalaJS.ClassTypeData({
  jl_IllegalArgumentException: 0
}, false, "java.lang.IllegalArgumentException", ScalaJS.d.jl_RuntimeException, {
  jl_IllegalArgumentException: 1,
  jl_RuntimeException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.jl_IllegalArgumentException.prototype.$classData = ScalaJS.d.jl_IllegalArgumentException;
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_IllegalStateException = (function() {
  ScalaJS.c.jl_RuntimeException.call(this)
});
ScalaJS.c.jl_IllegalStateException.prototype = new ScalaJS.h.jl_RuntimeException();
ScalaJS.c.jl_IllegalStateException.prototype.constructor = ScalaJS.c.jl_IllegalStateException;
/** @constructor */
ScalaJS.h.jl_IllegalStateException = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_IllegalStateException.prototype = ScalaJS.c.jl_IllegalStateException.prototype;
ScalaJS.c.jl_IllegalStateException.prototype.init___T = (function(s) {
  ScalaJS.c.jl_IllegalStateException.prototype.init___T__jl_Throwable.call(this, s, null);
  return this
});
/*<skip>*/;
ScalaJS.is.jl_IllegalStateException = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_IllegalStateException)))
});
ScalaJS.as.jl_IllegalStateException = (function(obj) {
  if ((ScalaJS.is.jl_IllegalStateException(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.IllegalStateException")
  }
});
ScalaJS.isArrayOf.jl_IllegalStateException = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_IllegalStateException)))
});
ScalaJS.asArrayOf.jl_IllegalStateException = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_IllegalStateException(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.IllegalStateException;", depth)
  }
});
ScalaJS.d.jl_IllegalStateException = new ScalaJS.ClassTypeData({
  jl_IllegalStateException: 0
}, false, "java.lang.IllegalStateException", ScalaJS.d.jl_RuntimeException, {
  jl_IllegalStateException: 1,
  jl_RuntimeException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.jl_IllegalStateException.prototype.$classData = ScalaJS.d.jl_IllegalStateException;
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_IndexOutOfBoundsException = (function() {
  ScalaJS.c.jl_RuntimeException.call(this)
});
ScalaJS.c.jl_IndexOutOfBoundsException.prototype = new ScalaJS.h.jl_RuntimeException();
ScalaJS.c.jl_IndexOutOfBoundsException.prototype.constructor = ScalaJS.c.jl_IndexOutOfBoundsException;
/** @constructor */
ScalaJS.h.jl_IndexOutOfBoundsException = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_IndexOutOfBoundsException.prototype = ScalaJS.c.jl_IndexOutOfBoundsException.prototype;
/*<skip>*/;
ScalaJS.is.jl_IndexOutOfBoundsException = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_IndexOutOfBoundsException)))
});
ScalaJS.as.jl_IndexOutOfBoundsException = (function(obj) {
  if ((ScalaJS.is.jl_IndexOutOfBoundsException(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.IndexOutOfBoundsException")
  }
});
ScalaJS.isArrayOf.jl_IndexOutOfBoundsException = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_IndexOutOfBoundsException)))
});
ScalaJS.asArrayOf.jl_IndexOutOfBoundsException = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_IndexOutOfBoundsException(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.IndexOutOfBoundsException;", depth)
  }
});
ScalaJS.d.jl_IndexOutOfBoundsException = new ScalaJS.ClassTypeData({
  jl_IndexOutOfBoundsException: 0
}, false, "java.lang.IndexOutOfBoundsException", ScalaJS.d.jl_RuntimeException, {
  jl_IndexOutOfBoundsException: 1,
  jl_RuntimeException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.jl_IndexOutOfBoundsException.prototype.$classData = ScalaJS.d.jl_IndexOutOfBoundsException;
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_StandardErrPrintStream$ = (function() {
  ScalaJS.c.Ljava_io_PrintStream.call(this);
  this.java$lang$JSConsoleBasedPrintStream$$flushed$4 = false;
  this.java$lang$JSConsoleBasedPrintStream$$buffer$4 = null;
  this.java$lang$JSConsoleBasedPrintStream$$lineContEnd$4 = null;
  this.java$lang$JSConsoleBasedPrintStream$$lineContStart$4 = null
});
ScalaJS.c.jl_StandardErrPrintStream$.prototype = new ScalaJS.h.Ljava_io_PrintStream();
ScalaJS.c.jl_StandardErrPrintStream$.prototype.constructor = ScalaJS.c.jl_StandardErrPrintStream$;
/** @constructor */
ScalaJS.h.jl_StandardErrPrintStream$ = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_StandardErrPrintStream$.prototype = ScalaJS.c.jl_StandardErrPrintStream$.prototype;
ScalaJS.c.jl_StandardErrPrintStream$.prototype.java$lang$JSConsoleBasedPrintStream$$flushed__Z = (function() {
  return this.java$lang$JSConsoleBasedPrintStream$$flushed$4
});
ScalaJS.c.jl_StandardErrPrintStream$.prototype.java$lang$JSConsoleBasedPrintStream$$flushed$und$eq__Z__V = (function(x$1) {
  this.java$lang$JSConsoleBasedPrintStream$$flushed$4 = x$1
});
ScalaJS.c.jl_StandardErrPrintStream$.prototype.java$lang$JSConsoleBasedPrintStream$$buffer__T = (function() {
  return this.java$lang$JSConsoleBasedPrintStream$$buffer$4
});
ScalaJS.c.jl_StandardErrPrintStream$.prototype.java$lang$JSConsoleBasedPrintStream$$buffer$und$eq__T__V = (function(x$1) {
  this.java$lang$JSConsoleBasedPrintStream$$buffer$4 = x$1
});
ScalaJS.c.jl_StandardErrPrintStream$.prototype.java$lang$JSConsoleBasedPrintStream$$lineContEnd__T = (function() {
  return this.java$lang$JSConsoleBasedPrintStream$$lineContEnd$4
});
ScalaJS.c.jl_StandardErrPrintStream$.prototype.java$lang$JSConsoleBasedPrintStream$$lineContStart__T = (function() {
  return this.java$lang$JSConsoleBasedPrintStream$$lineContStart$4
});
ScalaJS.c.jl_StandardErrPrintStream$.prototype.java$lang$JSConsoleBasedPrintStream$$undsetter$und$java$lang$JSConsoleBasedPrintStream$$lineContEnd$und$eq__T__V = (function(x$1) {
  this.java$lang$JSConsoleBasedPrintStream$$lineContEnd$4 = x$1
});
ScalaJS.c.jl_StandardErrPrintStream$.prototype.java$lang$JSConsoleBasedPrintStream$$undsetter$und$java$lang$JSConsoleBasedPrintStream$$lineContStart$und$eq__T__V = (function(x$1) {
  this.java$lang$JSConsoleBasedPrintStream$$lineContStart$4 = x$1
});
ScalaJS.c.jl_StandardErrPrintStream$.prototype.print__T__V = (function(s) {
  ScalaJS.i.jl_JSConsoleBasedPrintStream$class__print__jl_JSConsoleBasedPrintStream__T__V(this, s)
});
ScalaJS.c.jl_StandardErrPrintStream$.prototype.flush__V = (function() {
  ScalaJS.i.jl_JSConsoleBasedPrintStream$class__flush__jl_JSConsoleBasedPrintStream__V(this)
});
ScalaJS.c.jl_StandardErrPrintStream$.prototype.doWriteLine__T__V = (function(line) {
  if ((!ScalaJS.uZ((!ScalaJS.g["console"])))) {
    if ((!ScalaJS.uZ((!ScalaJS.g["console"]["error"])))) {
      ScalaJS.g["console"]["error"](line)
    } else {
      ScalaJS.g["console"]["log"](line)
    }
  }
});
ScalaJS.c.jl_StandardErrPrintStream$.prototype.init___ = (function() {
  ScalaJS.c.Ljava_io_PrintStream.prototype.init___Ljava_io_OutputStream__Z.call(this, ScalaJS.m.jl_StandardErr(), true);
  ScalaJS.n.jl_StandardErrPrintStream = this;
  ScalaJS.i.jl_JSConsoleBasedPrintStream$class__$init$__jl_JSConsoleBasedPrintStream__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.jl_StandardErrPrintStream$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_StandardErrPrintStream$)))
});
ScalaJS.as.jl_StandardErrPrintStream$ = (function(obj) {
  if ((ScalaJS.is.jl_StandardErrPrintStream$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.StandardErrPrintStream$")
  }
});
ScalaJS.isArrayOf.jl_StandardErrPrintStream$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_StandardErrPrintStream$)))
});
ScalaJS.asArrayOf.jl_StandardErrPrintStream$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_StandardErrPrintStream$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.StandardErrPrintStream$;", depth)
  }
});
ScalaJS.d.jl_StandardErrPrintStream$ = new ScalaJS.ClassTypeData({
  jl_StandardErrPrintStream$: 0
}, false, "java.lang.StandardErrPrintStream$", ScalaJS.d.Ljava_io_PrintStream, {
  jl_StandardErrPrintStream$: 1,
  jl_JSConsoleBasedPrintStream: 1,
  Ljava_io_PrintStream: 1,
  jl_Appendable: 1,
  Ljava_io_FilterOutputStream: 1,
  Ljava_io_OutputStream: 1,
  Ljava_io_Flushable: 1,
  Ljava_io_Closeable: 1,
  O: 1
});
ScalaJS.c.jl_StandardErrPrintStream$.prototype.$classData = ScalaJS.d.jl_StandardErrPrintStream$;
ScalaJS.n.jl_StandardErrPrintStream = undefined;
ScalaJS.m.jl_StandardErrPrintStream = (function() {
  if ((!ScalaJS.n.jl_StandardErrPrintStream)) {
    ScalaJS.n.jl_StandardErrPrintStream = new ScalaJS.c.jl_StandardErrPrintStream$().init___()
  };
  return ScalaJS.n.jl_StandardErrPrintStream
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_StandardOutPrintStream$ = (function() {
  ScalaJS.c.Ljava_io_PrintStream.call(this);
  this.java$lang$JSConsoleBasedPrintStream$$flushed$4 = false;
  this.java$lang$JSConsoleBasedPrintStream$$buffer$4 = null;
  this.java$lang$JSConsoleBasedPrintStream$$lineContEnd$4 = null;
  this.java$lang$JSConsoleBasedPrintStream$$lineContStart$4 = null
});
ScalaJS.c.jl_StandardOutPrintStream$.prototype = new ScalaJS.h.Ljava_io_PrintStream();
ScalaJS.c.jl_StandardOutPrintStream$.prototype.constructor = ScalaJS.c.jl_StandardOutPrintStream$;
/** @constructor */
ScalaJS.h.jl_StandardOutPrintStream$ = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_StandardOutPrintStream$.prototype = ScalaJS.c.jl_StandardOutPrintStream$.prototype;
ScalaJS.c.jl_StandardOutPrintStream$.prototype.java$lang$JSConsoleBasedPrintStream$$flushed__Z = (function() {
  return this.java$lang$JSConsoleBasedPrintStream$$flushed$4
});
ScalaJS.c.jl_StandardOutPrintStream$.prototype.java$lang$JSConsoleBasedPrintStream$$flushed$und$eq__Z__V = (function(x$1) {
  this.java$lang$JSConsoleBasedPrintStream$$flushed$4 = x$1
});
ScalaJS.c.jl_StandardOutPrintStream$.prototype.java$lang$JSConsoleBasedPrintStream$$buffer__T = (function() {
  return this.java$lang$JSConsoleBasedPrintStream$$buffer$4
});
ScalaJS.c.jl_StandardOutPrintStream$.prototype.java$lang$JSConsoleBasedPrintStream$$buffer$und$eq__T__V = (function(x$1) {
  this.java$lang$JSConsoleBasedPrintStream$$buffer$4 = x$1
});
ScalaJS.c.jl_StandardOutPrintStream$.prototype.java$lang$JSConsoleBasedPrintStream$$lineContEnd__T = (function() {
  return this.java$lang$JSConsoleBasedPrintStream$$lineContEnd$4
});
ScalaJS.c.jl_StandardOutPrintStream$.prototype.java$lang$JSConsoleBasedPrintStream$$lineContStart__T = (function() {
  return this.java$lang$JSConsoleBasedPrintStream$$lineContStart$4
});
ScalaJS.c.jl_StandardOutPrintStream$.prototype.java$lang$JSConsoleBasedPrintStream$$undsetter$und$java$lang$JSConsoleBasedPrintStream$$lineContEnd$und$eq__T__V = (function(x$1) {
  this.java$lang$JSConsoleBasedPrintStream$$lineContEnd$4 = x$1
});
ScalaJS.c.jl_StandardOutPrintStream$.prototype.java$lang$JSConsoleBasedPrintStream$$undsetter$und$java$lang$JSConsoleBasedPrintStream$$lineContStart$und$eq__T__V = (function(x$1) {
  this.java$lang$JSConsoleBasedPrintStream$$lineContStart$4 = x$1
});
ScalaJS.c.jl_StandardOutPrintStream$.prototype.print__T__V = (function(s) {
  ScalaJS.i.jl_JSConsoleBasedPrintStream$class__print__jl_JSConsoleBasedPrintStream__T__V(this, s)
});
ScalaJS.c.jl_StandardOutPrintStream$.prototype.flush__V = (function() {
  ScalaJS.i.jl_JSConsoleBasedPrintStream$class__flush__jl_JSConsoleBasedPrintStream__V(this)
});
ScalaJS.c.jl_StandardOutPrintStream$.prototype.doWriteLine__T__V = (function(line) {
  if ((!ScalaJS.uZ((!ScalaJS.g["console"])))) {
    ScalaJS.g["console"]["log"](line)
  }
});
ScalaJS.c.jl_StandardOutPrintStream$.prototype.init___ = (function() {
  ScalaJS.c.Ljava_io_PrintStream.prototype.init___Ljava_io_OutputStream__Z.call(this, ScalaJS.m.jl_StandardOut(), true);
  ScalaJS.n.jl_StandardOutPrintStream = this;
  ScalaJS.i.jl_JSConsoleBasedPrintStream$class__$init$__jl_JSConsoleBasedPrintStream__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.jl_StandardOutPrintStream$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_StandardOutPrintStream$)))
});
ScalaJS.as.jl_StandardOutPrintStream$ = (function(obj) {
  if ((ScalaJS.is.jl_StandardOutPrintStream$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.StandardOutPrintStream$")
  }
});
ScalaJS.isArrayOf.jl_StandardOutPrintStream$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_StandardOutPrintStream$)))
});
ScalaJS.asArrayOf.jl_StandardOutPrintStream$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_StandardOutPrintStream$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.StandardOutPrintStream$;", depth)
  }
});
ScalaJS.d.jl_StandardOutPrintStream$ = new ScalaJS.ClassTypeData({
  jl_StandardOutPrintStream$: 0
}, false, "java.lang.StandardOutPrintStream$", ScalaJS.d.Ljava_io_PrintStream, {
  jl_StandardOutPrintStream$: 1,
  jl_JSConsoleBasedPrintStream: 1,
  Ljava_io_PrintStream: 1,
  jl_Appendable: 1,
  Ljava_io_FilterOutputStream: 1,
  Ljava_io_OutputStream: 1,
  Ljava_io_Flushable: 1,
  Ljava_io_Closeable: 1,
  O: 1
});
ScalaJS.c.jl_StandardOutPrintStream$.prototype.$classData = ScalaJS.d.jl_StandardOutPrintStream$;
ScalaJS.n.jl_StandardOutPrintStream = undefined;
ScalaJS.m.jl_StandardOutPrintStream = (function() {
  if ((!ScalaJS.n.jl_StandardOutPrintStream)) {
    ScalaJS.n.jl_StandardOutPrintStream = new ScalaJS.c.jl_StandardOutPrintStream$().init___()
  };
  return ScalaJS.n.jl_StandardOutPrintStream
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_UnsupportedOperationException = (function() {
  ScalaJS.c.jl_RuntimeException.call(this)
});
ScalaJS.c.jl_UnsupportedOperationException.prototype = new ScalaJS.h.jl_RuntimeException();
ScalaJS.c.jl_UnsupportedOperationException.prototype.constructor = ScalaJS.c.jl_UnsupportedOperationException;
/** @constructor */
ScalaJS.h.jl_UnsupportedOperationException = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_UnsupportedOperationException.prototype = ScalaJS.c.jl_UnsupportedOperationException.prototype;
ScalaJS.c.jl_UnsupportedOperationException.prototype.init___T = (function(s) {
  ScalaJS.c.jl_UnsupportedOperationException.prototype.init___T__jl_Throwable.call(this, s, null);
  return this
});
/*<skip>*/;
ScalaJS.is.jl_UnsupportedOperationException = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_UnsupportedOperationException)))
});
ScalaJS.as.jl_UnsupportedOperationException = (function(obj) {
  if ((ScalaJS.is.jl_UnsupportedOperationException(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.UnsupportedOperationException")
  }
});
ScalaJS.isArrayOf.jl_UnsupportedOperationException = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_UnsupportedOperationException)))
});
ScalaJS.asArrayOf.jl_UnsupportedOperationException = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_UnsupportedOperationException(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.UnsupportedOperationException;", depth)
  }
});
ScalaJS.d.jl_UnsupportedOperationException = new ScalaJS.ClassTypeData({
  jl_UnsupportedOperationException: 0
}, false, "java.lang.UnsupportedOperationException", ScalaJS.d.jl_RuntimeException, {
  jl_UnsupportedOperationException: 1,
  jl_RuntimeException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.jl_UnsupportedOperationException.prototype.$classData = ScalaJS.d.jl_UnsupportedOperationException;
/*<skip>*/;
/** @constructor */
ScalaJS.c.ju_NoSuchElementException = (function() {
  ScalaJS.c.jl_RuntimeException.call(this)
});
ScalaJS.c.ju_NoSuchElementException.prototype = new ScalaJS.h.jl_RuntimeException();
ScalaJS.c.ju_NoSuchElementException.prototype.constructor = ScalaJS.c.ju_NoSuchElementException;
/** @constructor */
ScalaJS.h.ju_NoSuchElementException = (function() {
  /*<skip>*/
});
ScalaJS.h.ju_NoSuchElementException.prototype = ScalaJS.c.ju_NoSuchElementException.prototype;
ScalaJS.c.ju_NoSuchElementException.prototype.init___ = (function() {
  ScalaJS.c.ju_NoSuchElementException.prototype.init___T.call(this, null);
  return this
});
/*<skip>*/;
ScalaJS.is.ju_NoSuchElementException = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.ju_NoSuchElementException)))
});
ScalaJS.as.ju_NoSuchElementException = (function(obj) {
  if ((ScalaJS.is.ju_NoSuchElementException(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.util.NoSuchElementException")
  }
});
ScalaJS.isArrayOf.ju_NoSuchElementException = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.ju_NoSuchElementException)))
});
ScalaJS.asArrayOf.ju_NoSuchElementException = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.ju_NoSuchElementException(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.util.NoSuchElementException;", depth)
  }
});
ScalaJS.d.ju_NoSuchElementException = new ScalaJS.ClassTypeData({
  ju_NoSuchElementException: 0
}, false, "java.util.NoSuchElementException", ScalaJS.d.jl_RuntimeException, {
  ju_NoSuchElementException: 1,
  jl_RuntimeException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.ju_NoSuchElementException.prototype.$classData = ScalaJS.d.ju_NoSuchElementException;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_MatchError = (function() {
  ScalaJS.c.jl_RuntimeException.call(this);
  this.obj$4 = null;
  this.objString$4 = null;
  this.bitmap$0$4 = false
});
ScalaJS.c.s_MatchError.prototype = new ScalaJS.h.jl_RuntimeException();
ScalaJS.c.s_MatchError.prototype.constructor = ScalaJS.c.s_MatchError;
/** @constructor */
ScalaJS.h.s_MatchError = (function() {
  /*<skip>*/
});
ScalaJS.h.s_MatchError.prototype = ScalaJS.c.s_MatchError.prototype;
ScalaJS.c.s_MatchError.prototype.objString$lzycompute__p4__T = (function() {
  if ((!this.bitmap$0$4)) {
    if ((this.obj$4 === null)) {
      var jsx$1 = "null"
    } else {
      var jsx$1 = this.liftedTree1$1__p4__T()
    };
    this.objString$4 = jsx$1;
    this.bitmap$0$4 = true
  };
  return this.objString$4
});
ScalaJS.c.s_MatchError.prototype.objString__p4__T = (function() {
  if ((!this.bitmap$0$4)) {
    return this.objString$lzycompute__p4__T()
  } else {
    return this.objString$4
  }
});
ScalaJS.c.s_MatchError.prototype.getMessage__T = (function() {
  return this.objString__p4__T()
});
ScalaJS.c.s_MatchError.prototype.ofClass$1__p4__T = (function() {
  return ("of class " + ScalaJS.objectGetClass(this.obj$4).getName__T())
});
ScalaJS.c.s_MatchError.prototype.liftedTree1$1__p4__T = (function() {
  try {
    return (((ScalaJS.objectToString(this.obj$4) + " (") + this.ofClass$1__p4__T()) + ")")
  } catch (ex) {
    ex = ScalaJS.wrapJavaScriptException(ex);
    if (ScalaJS.is.jl_Throwable(ex)) {
      return ("an instance " + this.ofClass$1__p4__T())
    } else {
      throw ScalaJS.unwrapJavaScriptException(ex)
    }
  }
});
ScalaJS.c.s_MatchError.prototype.init___O = (function(obj) {
  this.obj$4 = obj;
  ScalaJS.c.jl_RuntimeException.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.s_MatchError = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_MatchError)))
});
ScalaJS.as.s_MatchError = (function(obj) {
  if ((ScalaJS.is.s_MatchError(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.MatchError")
  }
});
ScalaJS.isArrayOf.s_MatchError = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_MatchError)))
});
ScalaJS.asArrayOf.s_MatchError = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_MatchError(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.MatchError;", depth)
  }
});
ScalaJS.d.s_MatchError = new ScalaJS.ClassTypeData({
  s_MatchError: 0
}, false, "scala.MatchError", ScalaJS.d.jl_RuntimeException, {
  s_MatchError: 1,
  jl_RuntimeException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_MatchError.prototype.$classData = ScalaJS.d.s_MatchError;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scg_ImmutableSetFactory = (function() {
  ScalaJS.c.scg_SetFactory.call(this)
});
ScalaJS.c.scg_ImmutableSetFactory.prototype = new ScalaJS.h.scg_SetFactory();
ScalaJS.c.scg_ImmutableSetFactory.prototype.constructor = ScalaJS.c.scg_ImmutableSetFactory;
/** @constructor */
ScalaJS.h.scg_ImmutableSetFactory = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_ImmutableSetFactory.prototype = ScalaJS.c.scg_ImmutableSetFactory.prototype;
/*<skip>*/;
ScalaJS.is.scg_ImmutableSetFactory = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scg_ImmutableSetFactory)))
});
ScalaJS.as.scg_ImmutableSetFactory = (function(obj) {
  if ((ScalaJS.is.scg_ImmutableSetFactory(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.generic.ImmutableSetFactory")
  }
});
ScalaJS.isArrayOf.scg_ImmutableSetFactory = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scg_ImmutableSetFactory)))
});
ScalaJS.asArrayOf.scg_ImmutableSetFactory = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scg_ImmutableSetFactory(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.generic.ImmutableSetFactory;", depth)
  }
});
ScalaJS.d.scg_ImmutableSetFactory = new ScalaJS.ClassTypeData({
  scg_ImmutableSetFactory: 0
}, false, "scala.collection.generic.ImmutableSetFactory", ScalaJS.d.scg_SetFactory, {
  scg_ImmutableSetFactory: 1,
  scg_SetFactory: 1,
  scg_GenericSeqCompanion: 1,
  scg_GenSetFactory: 1,
  scg_GenericCompanion: 1,
  O: 1
});
ScalaJS.c.scg_ImmutableSetFactory.prototype.$classData = ScalaJS.d.scg_ImmutableSetFactory;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scg_SeqFactory = (function() {
  ScalaJS.c.scg_GenSeqFactory.call(this)
});
ScalaJS.c.scg_SeqFactory.prototype = new ScalaJS.h.scg_GenSeqFactory();
ScalaJS.c.scg_SeqFactory.prototype.constructor = ScalaJS.c.scg_SeqFactory;
/** @constructor */
ScalaJS.h.scg_SeqFactory = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_SeqFactory.prototype = ScalaJS.c.scg_SeqFactory.prototype;
/*<skip>*/;
ScalaJS.is.scg_SeqFactory = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scg_SeqFactory)))
});
ScalaJS.as.scg_SeqFactory = (function(obj) {
  if ((ScalaJS.is.scg_SeqFactory(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.generic.SeqFactory")
  }
});
ScalaJS.isArrayOf.scg_SeqFactory = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scg_SeqFactory)))
});
ScalaJS.asArrayOf.scg_SeqFactory = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scg_SeqFactory(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.generic.SeqFactory;", depth)
  }
});
ScalaJS.d.scg_SeqFactory = new ScalaJS.ClassTypeData({
  scg_SeqFactory: 0
}, false, "scala.collection.generic.SeqFactory", ScalaJS.d.scg_GenSeqFactory, {
  scg_SeqFactory: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1,
  scg_GenSeqFactory: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1
});
ScalaJS.c.scg_SeqFactory.prototype.$classData = ScalaJS.d.scg_SeqFactory;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sci_List = (function() {
  ScalaJS.c.sc_AbstractSeq.call(this)
});
ScalaJS.c.sci_List.prototype = new ScalaJS.h.sc_AbstractSeq();
ScalaJS.c.sci_List.prototype.constructor = ScalaJS.c.sci_List;
/** @constructor */
ScalaJS.h.sci_List = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_List.prototype = ScalaJS.c.sci_List.prototype;
ScalaJS.c.sci_List.prototype.scala$collection$LinearSeqOptimized$$super$sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_IterableLike$class__sameElements__sc_IterableLike__sc_GenIterable__Z(this, that)
});
ScalaJS.c.sci_List.prototype.length__I = (function() {
  return ScalaJS.i.sc_LinearSeqOptimized$class__length__sc_LinearSeqOptimized__I(this)
});
ScalaJS.c.sci_List.prototype.apply__I__O = (function(n) {
  return ScalaJS.i.sc_LinearSeqOptimized$class__apply__sc_LinearSeqOptimized__I__O(this, n)
});
ScalaJS.c.sci_List.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_LinearSeqOptimized$class__sameElements__sc_LinearSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.sci_List.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.i.sc_LinearSeqOptimized$class__lengthCompare__sc_LinearSeqOptimized__I__I(this, len)
});
ScalaJS.c.sci_List.prototype.seq__sci_LinearSeq = (function() {
  return ScalaJS.i.sci_LinearSeq$class__seq__sci_LinearSeq__sci_LinearSeq(this)
});
ScalaJS.c.sci_List.prototype.hashCode__I = (function() {
  return ScalaJS.i.sc_LinearSeqLike$class__hashCode__sc_LinearSeqLike__I(this)
});
ScalaJS.c.sci_List.prototype.iterator__sc_Iterator = (function() {
  return ScalaJS.i.sc_LinearSeqLike$class__iterator__sc_LinearSeqLike__sc_Iterator(this)
});
ScalaJS.c.sci_List.prototype.$$colon$colon__O__sci_List = (function(x) {
  return new ScalaJS.c.sci_$colon$colon().init___O__sci_List(x, this)
});
ScalaJS.c.sci_List.prototype.drop__I__sci_List = (function(n) {
  var these = this;
  var count = n;
  while (((!these.isEmpty__Z()) && (count > 0))) {
    these = ScalaJS.as.sci_List(these.tail__O());
    count = ((count - 1) | 0)
  };
  return these
});
ScalaJS.c.sci_List.prototype.foreach__F1__V = (function(f) {
  var these = this;
  while ((!these.isEmpty__Z())) {
    f.apply__O__O(these.head__O());
    these = ScalaJS.as.sci_List(these.tail__O())
  }
});
ScalaJS.c.sci_List.prototype.stringPrefix__T = (function() {
  return "List"
});
ScalaJS.c.sci_List.prototype.seq__sc_LinearSeq = (function() {
  return this.seq__sci_LinearSeq()
});
ScalaJS.c.sci_List.prototype.apply__O__O = (function(v1) {
  return this.apply__I__O(ScalaJS.uI(v1))
});
ScalaJS.c.sci_List.prototype.drop__I__sc_LinearSeqOptimized = (function(n) {
  return this.drop__I__sci_List(n)
});
ScalaJS.c.sci_List.prototype.init___ = (function() {
  ScalaJS.c.sc_AbstractSeq.prototype.init___.call(this);
  ScalaJS.i.sci_Traversable$class__$init$__sci_Traversable__V(this);
  ScalaJS.i.sci_Iterable$class__$init$__sci_Iterable__V(this);
  ScalaJS.i.sci_Seq$class__$init$__sci_Seq__V(this);
  ScalaJS.i.sc_LinearSeqLike$class__$init$__sc_LinearSeqLike__V(this);
  ScalaJS.i.sc_LinearSeq$class__$init$__sc_LinearSeq__V(this);
  ScalaJS.i.sci_LinearSeq$class__$init$__sci_LinearSeq__V(this);
  ScalaJS.i.s_Product$class__$init$__s_Product__V(this);
  ScalaJS.i.sc_LinearSeqOptimized$class__$init$__sc_LinearSeqOptimized__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.sci_List = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_List)))
});
ScalaJS.as.sci_List = (function(obj) {
  if ((ScalaJS.is.sci_List(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.immutable.List")
  }
});
ScalaJS.isArrayOf.sci_List = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_List)))
});
ScalaJS.asArrayOf.sci_List = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sci_List(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.List;", depth)
  }
});
ScalaJS.d.sci_List = new ScalaJS.ClassTypeData({
  sci_List: 0
}, false, "scala.collection.immutable.List", ScalaJS.d.sc_AbstractSeq, {
  sci_List: 1,
  Ljava_io_Serializable: 1,
  sc_LinearSeqOptimized: 1,
  s_Product: 1,
  sci_LinearSeq: 1,
  sc_LinearSeq: 1,
  sc_LinearSeqLike: 1,
  sci_Seq: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sc_AbstractSeq: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_AbstractIterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.sci_List.prototype.$classData = ScalaJS.d.sci_List;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sci_Map$ = (function() {
  ScalaJS.c.scg_ImmutableMapFactory.call(this)
});
ScalaJS.c.sci_Map$.prototype = new ScalaJS.h.scg_ImmutableMapFactory();
ScalaJS.c.sci_Map$.prototype.constructor = ScalaJS.c.sci_Map$;
/** @constructor */
ScalaJS.h.sci_Map$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Map$.prototype = ScalaJS.c.sci_Map$.prototype;
/*<skip>*/;
ScalaJS.is.sci_Map$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_Map$)))
});
ScalaJS.as.sci_Map$ = (function(obj) {
  if ((ScalaJS.is.sci_Map$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.immutable.Map$")
  }
});
ScalaJS.isArrayOf.sci_Map$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_Map$)))
});
ScalaJS.asArrayOf.sci_Map$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sci_Map$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.Map$;", depth)
  }
});
ScalaJS.d.sci_Map$ = new ScalaJS.ClassTypeData({
  sci_Map$: 0
}, false, "scala.collection.immutable.Map$", ScalaJS.d.scg_ImmutableMapFactory, {
  sci_Map$: 1,
  scg_ImmutableMapFactory: 1,
  scg_MapFactory: 1,
  scg_GenMapFactory: 1,
  O: 1
});
ScalaJS.c.sci_Map$.prototype.$classData = ScalaJS.d.sci_Map$;
ScalaJS.n.sci_Map = undefined;
ScalaJS.m.sci_Map = (function() {
  if ((!ScalaJS.n.sci_Map)) {
    ScalaJS.n.sci_Map = new ScalaJS.c.sci_Map$().init___()
  };
  return ScalaJS.n.sci_Map
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sci_Vector = (function() {
  ScalaJS.c.sc_AbstractSeq.call(this);
  this.startIndex$4 = 0;
  this.endIndex$4 = 0;
  this.focus$4 = 0;
  this.dirty$4 = false;
  this.depth$4 = 0;
  this.display0$4 = null;
  this.display1$4 = null;
  this.display2$4 = null;
  this.display3$4 = null;
  this.display4$4 = null;
  this.display5$4 = null
});
ScalaJS.c.sci_Vector.prototype = new ScalaJS.h.sc_AbstractSeq();
ScalaJS.c.sci_Vector.prototype.constructor = ScalaJS.c.sci_Vector;
/** @constructor */
ScalaJS.h.sci_Vector = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Vector.prototype = ScalaJS.c.sci_Vector.prototype;
ScalaJS.c.sci_Vector.prototype.depth__I = (function() {
  return this.depth$4
});
ScalaJS.c.sci_Vector.prototype.depth$und$eq__I__V = (function(x$1) {
  this.depth$4 = x$1
});
ScalaJS.c.sci_Vector.prototype.display0__AO = (function() {
  return this.display0$4
});
ScalaJS.c.sci_Vector.prototype.display0$und$eq__AO__V = (function(x$1) {
  this.display0$4 = x$1
});
ScalaJS.c.sci_Vector.prototype.display1__AO = (function() {
  return this.display1$4
});
ScalaJS.c.sci_Vector.prototype.display1$und$eq__AO__V = (function(x$1) {
  this.display1$4 = x$1
});
ScalaJS.c.sci_Vector.prototype.display2__AO = (function() {
  return this.display2$4
});
ScalaJS.c.sci_Vector.prototype.display2$und$eq__AO__V = (function(x$1) {
  this.display2$4 = x$1
});
ScalaJS.c.sci_Vector.prototype.display3__AO = (function() {
  return this.display3$4
});
ScalaJS.c.sci_Vector.prototype.display3$und$eq__AO__V = (function(x$1) {
  this.display3$4 = x$1
});
ScalaJS.c.sci_Vector.prototype.display4__AO = (function() {
  return this.display4$4
});
ScalaJS.c.sci_Vector.prototype.display4$und$eq__AO__V = (function(x$1) {
  this.display4$4 = x$1
});
ScalaJS.c.sci_Vector.prototype.display5__AO = (function() {
  return this.display5$4
});
ScalaJS.c.sci_Vector.prototype.display5$und$eq__AO__V = (function(x$1) {
  this.display5$4 = x$1
});
ScalaJS.c.sci_Vector.prototype.initFrom__sci_VectorPointer__I__V = (function(that, depth) {
  ScalaJS.i.sci_VectorPointer$class__initFrom__sci_VectorPointer__sci_VectorPointer__I__V(this, that, depth)
});
ScalaJS.c.sci_Vector.prototype.getElem__I__I__O = (function(index, xor) {
  return ScalaJS.i.sci_VectorPointer$class__getElem__sci_VectorPointer__I__I__O(this, index, xor)
});
ScalaJS.c.sci_Vector.prototype.copyOf__AO__AO = (function(a) {
  return ScalaJS.i.sci_VectorPointer$class__copyOf__sci_VectorPointer__AO__AO(this, a)
});
ScalaJS.c.sci_Vector.prototype.seq__sci_IndexedSeq = (function() {
  return ScalaJS.i.sci_IndexedSeq$class__seq__sci_IndexedSeq__sci_IndexedSeq(this)
});
ScalaJS.c.sci_Vector.prototype.hashCode__I = (function() {
  return ScalaJS.i.sc_IndexedSeqLike$class__hashCode__sc_IndexedSeqLike__I(this)
});
ScalaJS.c.sci_Vector.prototype.startIndex__I = (function() {
  return this.startIndex$4
});
ScalaJS.c.sci_Vector.prototype.endIndex__I = (function() {
  return this.endIndex$4
});
ScalaJS.c.sci_Vector.prototype.dirty__Z = (function() {
  return this.dirty$4
});
ScalaJS.c.sci_Vector.prototype.length__I = (function() {
  return ((this.endIndex__I() - this.startIndex__I()) | 0)
});
ScalaJS.c.sci_Vector.prototype.lengthCompare__I__I = (function(len) {
  return ((this.length__I() - len) | 0)
});
ScalaJS.c.sci_Vector.prototype.initIterator__sci_VectorIterator__V = (function(s) {
  s.initFrom__sci_VectorPointer__V(this);
  if (this.dirty__Z()) {
    s.stabilize__I__V(this.focus$4)
  };
  if ((s.depth__I() > 1)) {
    s.gotoPos__I__I__V(this.startIndex__I(), (this.startIndex__I() ^ this.focus$4))
  }
});
ScalaJS.c.sci_Vector.prototype.iterator__sci_VectorIterator = (function() {
  var s = new ScalaJS.c.sci_VectorIterator().init___I__I(this.startIndex__I(), this.endIndex__I());
  this.initIterator__sci_VectorIterator__V(s);
  return s
});
ScalaJS.c.sci_Vector.prototype.apply__I__O = (function(index) {
  var idx = this.checkRangeConvert__p4__I__I(index);
  return this.getElem__I__I__O(idx, (idx ^ this.focus$4))
});
ScalaJS.c.sci_Vector.prototype.checkRangeConvert__p4__I__I = (function(index) {
  var idx = ((index + this.startIndex__I()) | 0);
  if (((0 <= index) && (idx < this.endIndex__I()))) {
    return idx
  } else {
    throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(index))
  }
});
ScalaJS.c.sci_Vector.prototype.seq__sc_IndexedSeq = (function() {
  return this.seq__sci_IndexedSeq()
});
ScalaJS.c.sci_Vector.prototype.apply__O__O = (function(v1) {
  return this.apply__I__O(ScalaJS.uI(v1))
});
ScalaJS.c.sci_Vector.prototype.iterator__sc_Iterator = (function() {
  return this.iterator__sci_VectorIterator()
});
ScalaJS.c.sci_Vector.prototype.init___I__I__I = (function(startIndex, endIndex, focus) {
  this.startIndex$4 = startIndex;
  this.endIndex$4 = endIndex;
  this.focus$4 = focus;
  ScalaJS.c.sc_AbstractSeq.prototype.init___.call(this);
  ScalaJS.i.sci_Traversable$class__$init$__sci_Traversable__V(this);
  ScalaJS.i.sci_Iterable$class__$init$__sci_Iterable__V(this);
  ScalaJS.i.sci_Seq$class__$init$__sci_Seq__V(this);
  ScalaJS.i.sc_IndexedSeqLike$class__$init$__sc_IndexedSeqLike__V(this);
  ScalaJS.i.sc_IndexedSeq$class__$init$__sc_IndexedSeq__V(this);
  ScalaJS.i.sci_IndexedSeq$class__$init$__sci_IndexedSeq__V(this);
  ScalaJS.i.sci_VectorPointer$class__$init$__sci_VectorPointer__V(this);
  ScalaJS.i.sc_CustomParallelizable$class__$init$__sc_CustomParallelizable__V(this);
  this.dirty$4 = false;
  return this
});
/*<skip>*/;
ScalaJS.is.sci_Vector = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_Vector)))
});
ScalaJS.as.sci_Vector = (function(obj) {
  if ((ScalaJS.is.sci_Vector(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.immutable.Vector")
  }
});
ScalaJS.isArrayOf.sci_Vector = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_Vector)))
});
ScalaJS.asArrayOf.sci_Vector = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sci_Vector(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.Vector;", depth)
  }
});
ScalaJS.d.sci_Vector = new ScalaJS.ClassTypeData({
  sci_Vector: 0
}, false, "scala.collection.immutable.Vector", ScalaJS.d.sc_AbstractSeq, {
  sci_Vector: 1,
  sc_CustomParallelizable: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  sci_VectorPointer: 1,
  sci_IndexedSeq: 1,
  sc_IndexedSeq: 1,
  sc_IndexedSeqLike: 1,
  sci_Seq: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sc_AbstractSeq: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_AbstractIterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.sci_Vector.prototype.$classData = ScalaJS.d.sci_Vector;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sci_WrappedString = (function() {
  ScalaJS.c.sc_AbstractSeq.call(this);
  this.self$4 = null
});
ScalaJS.c.sci_WrappedString.prototype = new ScalaJS.h.sc_AbstractSeq();
ScalaJS.c.sci_WrappedString.prototype.constructor = ScalaJS.c.sci_WrappedString;
/** @constructor */
ScalaJS.h.sci_WrappedString = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_WrappedString.prototype = ScalaJS.c.sci_WrappedString.prototype;
ScalaJS.c.sci_WrappedString.prototype.apply__I__C = (function(n) {
  return ScalaJS.i.sci_StringLike$class__apply__sci_StringLike__I__C(this, n)
});
ScalaJS.c.sci_WrappedString.prototype.scala$collection$IndexedSeqOptimized$$super$sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_IterableLike$class__sameElements__sc_IterableLike__sc_GenIterable__Z(this, that)
});
ScalaJS.c.sci_WrappedString.prototype.isEmpty__Z = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z(this)
});
ScalaJS.c.sci_WrappedString.prototype.foreach__F1__V = (function(f) {
  ScalaJS.i.sc_IndexedSeqOptimized$class__foreach__sc_IndexedSeqOptimized__F1__V(this, f)
});
ScalaJS.c.sci_WrappedString.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.sci_WrappedString.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I(this, len)
});
ScalaJS.c.sci_WrappedString.prototype.seq__sci_IndexedSeq = (function() {
  return ScalaJS.i.sci_IndexedSeq$class__seq__sci_IndexedSeq__sci_IndexedSeq(this)
});
ScalaJS.c.sci_WrappedString.prototype.hashCode__I = (function() {
  return ScalaJS.i.sc_IndexedSeqLike$class__hashCode__sc_IndexedSeqLike__I(this)
});
ScalaJS.c.sci_WrappedString.prototype.iterator__sc_Iterator = (function() {
  return ScalaJS.i.sc_IndexedSeqLike$class__iterator__sc_IndexedSeqLike__sc_Iterator(this)
});
ScalaJS.c.sci_WrappedString.prototype.self__T = (function() {
  return this.self$4
});
ScalaJS.c.sci_WrappedString.prototype.length__I = (function() {
  return ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I(this.self__T())
});
ScalaJS.c.sci_WrappedString.prototype.toString__T = (function() {
  return this.self__T()
});
ScalaJS.c.sci_WrappedString.prototype.seq__sc_IndexedSeq = (function() {
  return this.seq__sci_IndexedSeq()
});
ScalaJS.c.sci_WrappedString.prototype.apply__O__O = (function(v1) {
  return ScalaJS.bC(this.apply__I__C(ScalaJS.uI(v1)))
});
ScalaJS.c.sci_WrappedString.prototype.apply__I__O = (function(idx) {
  return ScalaJS.bC(this.apply__I__C(idx))
});
ScalaJS.c.sci_WrappedString.prototype.init___T = (function(self) {
  this.self$4 = self;
  ScalaJS.c.sc_AbstractSeq.prototype.init___.call(this);
  ScalaJS.i.sci_Traversable$class__$init$__sci_Traversable__V(this);
  ScalaJS.i.sci_Iterable$class__$init$__sci_Iterable__V(this);
  ScalaJS.i.sci_Seq$class__$init$__sci_Seq__V(this);
  ScalaJS.i.sc_IndexedSeqLike$class__$init$__sc_IndexedSeqLike__V(this);
  ScalaJS.i.sc_IndexedSeq$class__$init$__sc_IndexedSeq__V(this);
  ScalaJS.i.sci_IndexedSeq$class__$init$__sci_IndexedSeq__V(this);
  ScalaJS.i.sc_IndexedSeqOptimized$class__$init$__sc_IndexedSeqOptimized__V(this);
  ScalaJS.i.s_math_Ordered$class__$init$__s_math_Ordered__V(this);
  ScalaJS.i.sci_StringLike$class__$init$__sci_StringLike__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.sci_WrappedString = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_WrappedString)))
});
ScalaJS.as.sci_WrappedString = (function(obj) {
  if ((ScalaJS.is.sci_WrappedString(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.immutable.WrappedString")
  }
});
ScalaJS.isArrayOf.sci_WrappedString = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_WrappedString)))
});
ScalaJS.asArrayOf.sci_WrappedString = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sci_WrappedString(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.WrappedString;", depth)
  }
});
ScalaJS.d.sci_WrappedString = new ScalaJS.ClassTypeData({
  sci_WrappedString: 0
}, false, "scala.collection.immutable.WrappedString", ScalaJS.d.sc_AbstractSeq, {
  sci_WrappedString: 1,
  sci_StringLike: 1,
  s_math_Ordered: 1,
  jl_Comparable: 1,
  sc_IndexedSeqOptimized: 1,
  sci_IndexedSeq: 1,
  sc_IndexedSeq: 1,
  sc_IndexedSeqLike: 1,
  sci_Seq: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sc_AbstractSeq: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_AbstractIterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.sci_WrappedString.prototype.$classData = ScalaJS.d.sci_WrappedString;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scm_AbstractSeq = (function() {
  ScalaJS.c.sc_AbstractSeq.call(this)
});
ScalaJS.c.scm_AbstractSeq.prototype = new ScalaJS.h.sc_AbstractSeq();
ScalaJS.c.scm_AbstractSeq.prototype.constructor = ScalaJS.c.scm_AbstractSeq;
/** @constructor */
ScalaJS.h.scm_AbstractSeq = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_AbstractSeq.prototype = ScalaJS.c.scm_AbstractSeq.prototype;
ScalaJS.c.scm_AbstractSeq.prototype.init___ = (function() {
  ScalaJS.c.sc_AbstractSeq.prototype.init___.call(this);
  ScalaJS.i.scm_Traversable$class__$init$__scm_Traversable__V(this);
  ScalaJS.i.scm_Iterable$class__$init$__scm_Iterable__V(this);
  ScalaJS.i.scm_Cloneable$class__$init$__scm_Cloneable__V(this);
  ScalaJS.i.scm_SeqLike$class__$init$__scm_SeqLike__V(this);
  ScalaJS.i.scm_Seq$class__$init$__scm_Seq__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.scm_AbstractSeq = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_AbstractSeq)))
});
ScalaJS.as.scm_AbstractSeq = (function(obj) {
  if ((ScalaJS.is.scm_AbstractSeq(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.mutable.AbstractSeq")
  }
});
ScalaJS.isArrayOf.scm_AbstractSeq = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_AbstractSeq)))
});
ScalaJS.asArrayOf.scm_AbstractSeq = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scm_AbstractSeq(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.AbstractSeq;", depth)
  }
});
ScalaJS.d.scm_AbstractSeq = new ScalaJS.ClassTypeData({
  scm_AbstractSeq: 0
}, false, "scala.collection.mutable.AbstractSeq", ScalaJS.d.sc_AbstractSeq, {
  scm_AbstractSeq: 1,
  scm_Seq: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  scm_Iterable: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  sc_AbstractSeq: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_AbstractIterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.scm_AbstractSeq.prototype.$classData = ScalaJS.d.scm_AbstractSeq;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sjs_js_JavaScriptException = (function() {
  ScalaJS.c.jl_RuntimeException.call(this);
  this.exception$4 = null
});
ScalaJS.c.sjs_js_JavaScriptException.prototype = new ScalaJS.h.jl_RuntimeException();
ScalaJS.c.sjs_js_JavaScriptException.prototype.constructor = ScalaJS.c.sjs_js_JavaScriptException;
/** @constructor */
ScalaJS.h.sjs_js_JavaScriptException = (function() {
  /*<skip>*/
});
ScalaJS.h.sjs_js_JavaScriptException.prototype = ScalaJS.c.sjs_js_JavaScriptException.prototype;
ScalaJS.c.sjs_js_JavaScriptException.prototype.exception__sjs_js_Any = (function() {
  return this.exception$4
});
ScalaJS.c.sjs_js_JavaScriptException.prototype.toString__T = (function() {
  return ScalaJS.objectToString(this.exception__sjs_js_Any())
});
ScalaJS.c.sjs_js_JavaScriptException.prototype.fillInStackTrace__jl_Throwable = (function() {
  ScalaJS.m.sjsr_StackTrace().captureState__jl_Throwable__sjs_js_Any__V(this, this.exception__sjs_js_Any());
  return this
});
ScalaJS.c.sjs_js_JavaScriptException.prototype.productPrefix__T = (function() {
  return "JavaScriptException"
});
ScalaJS.c.sjs_js_JavaScriptException.prototype.productArity__I = (function() {
  return 1
});
ScalaJS.c.sjs_js_JavaScriptException.prototype.productElement__I__O = (function(x$1) {
  var x1 = x$1;
  switch (x1) {
    case 0:
      {
        return this.exception__sjs_js_Any();
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.sjs_js_JavaScriptException.prototype.productIterator__sc_Iterator = (function() {
  return ScalaJS.m.sr_ScalaRunTime().typedProductIterator__s_Product__sc_Iterator(this)
});
ScalaJS.c.sjs_js_JavaScriptException.prototype.canEqual__O__Z = (function(x$1) {
  return ScalaJS.is.sjs_js_JavaScriptException(x$1)
});
ScalaJS.c.sjs_js_JavaScriptException.prototype.hashCode__I = (function() {
  return ScalaJS.m.sr_ScalaRunTime().$$undhashCode__s_Product__I(this)
});
ScalaJS.c.sjs_js_JavaScriptException.prototype.equals__O__Z = (function(x$1) {
  if ((this === x$1)) {
    return true
  } else {
    var x1 = x$1;
    matchEnd4: {
      if (ScalaJS.is.sjs_js_JavaScriptException(x1)) {
        var jsx$1 = true;
        break matchEnd4
      };
      var jsx$1 = false;
      break matchEnd4
    };
    if (jsx$1) {
      var JavaScriptException$1 = ScalaJS.as.sjs_js_JavaScriptException(x$1);
      return ((this.exception__sjs_js_Any() === JavaScriptException$1.exception__sjs_js_Any()) && JavaScriptException$1.canEqual__O__Z(this))
    } else {
      return false
    }
  }
});
ScalaJS.c.sjs_js_JavaScriptException.prototype.init___sjs_js_Any = (function(exception) {
  this.exception$4 = exception;
  ScalaJS.c.jl_RuntimeException.prototype.init___.call(this);
  ScalaJS.i.s_Product$class__$init$__s_Product__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.sjs_js_JavaScriptException = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sjs_js_JavaScriptException)))
});
ScalaJS.as.sjs_js_JavaScriptException = (function(obj) {
  if ((ScalaJS.is.sjs_js_JavaScriptException(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.scalajs.js.JavaScriptException")
  }
});
ScalaJS.isArrayOf.sjs_js_JavaScriptException = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sjs_js_JavaScriptException)))
});
ScalaJS.asArrayOf.sjs_js_JavaScriptException = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sjs_js_JavaScriptException(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.scalajs.js.JavaScriptException;", depth)
  }
});
ScalaJS.d.sjs_js_JavaScriptException = new ScalaJS.ClassTypeData({
  sjs_js_JavaScriptException: 0
}, false, "scala.scalajs.js.JavaScriptException", ScalaJS.d.jl_RuntimeException, {
  sjs_js_JavaScriptException: 1,
  s_Serializable: 1,
  s_Product: 1,
  s_Equals: 1,
  jl_RuntimeException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.sjs_js_JavaScriptException.prototype.$classData = ScalaJS.d.sjs_js_JavaScriptException;
/*<skip>*/;
/** @constructor */
ScalaJS.c.jl_NumberFormatException = (function() {
  ScalaJS.c.jl_IllegalArgumentException.call(this)
});
ScalaJS.c.jl_NumberFormatException.prototype = new ScalaJS.h.jl_IllegalArgumentException();
ScalaJS.c.jl_NumberFormatException.prototype.constructor = ScalaJS.c.jl_NumberFormatException;
/** @constructor */
ScalaJS.h.jl_NumberFormatException = (function() {
  /*<skip>*/
});
ScalaJS.h.jl_NumberFormatException.prototype = ScalaJS.c.jl_NumberFormatException.prototype;
/*<skip>*/;
ScalaJS.is.jl_NumberFormatException = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.jl_NumberFormatException)))
});
ScalaJS.as.jl_NumberFormatException = (function(obj) {
  if ((ScalaJS.is.jl_NumberFormatException(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "java.lang.NumberFormatException")
  }
});
ScalaJS.isArrayOf.jl_NumberFormatException = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.jl_NumberFormatException)))
});
ScalaJS.asArrayOf.jl_NumberFormatException = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.jl_NumberFormatException(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Ljava.lang.NumberFormatException;", depth)
  }
});
ScalaJS.d.jl_NumberFormatException = new ScalaJS.ClassTypeData({
  jl_NumberFormatException: 0
}, false, "java.lang.NumberFormatException", ScalaJS.d.jl_IllegalArgumentException, {
  jl_NumberFormatException: 1,
  jl_IllegalArgumentException: 1,
  jl_RuntimeException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.jl_NumberFormatException.prototype.$classData = ScalaJS.d.jl_NumberFormatException;
/*<skip>*/;
/** @constructor */
ScalaJS.c.s_StringContext$InvalidEscapeException = (function() {
  ScalaJS.c.jl_IllegalArgumentException.call(this);
  this.index$5 = 0
});
ScalaJS.c.s_StringContext$InvalidEscapeException.prototype = new ScalaJS.h.jl_IllegalArgumentException();
ScalaJS.c.s_StringContext$InvalidEscapeException.prototype.constructor = ScalaJS.c.s_StringContext$InvalidEscapeException;
/** @constructor */
ScalaJS.h.s_StringContext$InvalidEscapeException = (function() {
  /*<skip>*/
});
ScalaJS.h.s_StringContext$InvalidEscapeException.prototype = ScalaJS.c.s_StringContext$InvalidEscapeException.prototype;
ScalaJS.c.s_StringContext$InvalidEscapeException.prototype.init___T__I = (function(str, index) {
  this.index$5 = index;
  ScalaJS.c.jl_IllegalArgumentException.prototype.init___T.call(this, (((("invalid escape character at index " + index) + " in \"") + str) + "\""));
  return this
});
/*<skip>*/;
ScalaJS.is.s_StringContext$InvalidEscapeException = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.s_StringContext$InvalidEscapeException)))
});
ScalaJS.as.s_StringContext$InvalidEscapeException = (function(obj) {
  if ((ScalaJS.is.s_StringContext$InvalidEscapeException(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.StringContext$InvalidEscapeException")
  }
});
ScalaJS.isArrayOf.s_StringContext$InvalidEscapeException = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.s_StringContext$InvalidEscapeException)))
});
ScalaJS.asArrayOf.s_StringContext$InvalidEscapeException = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.s_StringContext$InvalidEscapeException(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.StringContext$InvalidEscapeException;", depth)
  }
});
ScalaJS.d.s_StringContext$InvalidEscapeException = new ScalaJS.ClassTypeData({
  s_StringContext$InvalidEscapeException: 0
}, false, "scala.StringContext$InvalidEscapeException", ScalaJS.d.jl_IllegalArgumentException, {
  s_StringContext$InvalidEscapeException: 1,
  jl_IllegalArgumentException: 1,
  jl_RuntimeException: 1,
  jl_Exception: 1,
  jl_Throwable: 1,
  Ljava_io_Serializable: 1,
  O: 1
});
ScalaJS.c.s_StringContext$InvalidEscapeException.prototype.$classData = ScalaJS.d.s_StringContext$InvalidEscapeException;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sc_Seq$ = (function() {
  ScalaJS.c.scg_SeqFactory.call(this)
});
ScalaJS.c.sc_Seq$.prototype = new ScalaJS.h.scg_SeqFactory();
ScalaJS.c.sc_Seq$.prototype.constructor = ScalaJS.c.sc_Seq$;
/** @constructor */
ScalaJS.h.sc_Seq$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_Seq$.prototype = ScalaJS.c.sc_Seq$.prototype;
/*<skip>*/;
ScalaJS.is.sc_Seq$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_Seq$)))
});
ScalaJS.as.sc_Seq$ = (function(obj) {
  if ((ScalaJS.is.sc_Seq$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.Seq$")
  }
});
ScalaJS.isArrayOf.sc_Seq$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_Seq$)))
});
ScalaJS.asArrayOf.sc_Seq$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sc_Seq$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.Seq$;", depth)
  }
});
ScalaJS.d.sc_Seq$ = new ScalaJS.ClassTypeData({
  sc_Seq$: 0
}, false, "scala.collection.Seq$", ScalaJS.d.scg_SeqFactory, {
  sc_Seq$: 1,
  scg_SeqFactory: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1,
  scg_GenSeqFactory: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1
});
ScalaJS.c.sc_Seq$.prototype.$classData = ScalaJS.d.sc_Seq$;
ScalaJS.n.sc_Seq = undefined;
ScalaJS.m.sc_Seq = (function() {
  if ((!ScalaJS.n.sc_Seq)) {
    ScalaJS.n.sc_Seq = new ScalaJS.c.sc_Seq$().init___()
  };
  return ScalaJS.n.sc_Seq
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.scg_IndexedSeqFactory = (function() {
  ScalaJS.c.scg_SeqFactory.call(this)
});
ScalaJS.c.scg_IndexedSeqFactory.prototype = new ScalaJS.h.scg_SeqFactory();
ScalaJS.c.scg_IndexedSeqFactory.prototype.constructor = ScalaJS.c.scg_IndexedSeqFactory;
/** @constructor */
ScalaJS.h.scg_IndexedSeqFactory = (function() {
  /*<skip>*/
});
ScalaJS.h.scg_IndexedSeqFactory.prototype = ScalaJS.c.scg_IndexedSeqFactory.prototype;
/*<skip>*/;
ScalaJS.is.scg_IndexedSeqFactory = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scg_IndexedSeqFactory)))
});
ScalaJS.as.scg_IndexedSeqFactory = (function(obj) {
  if ((ScalaJS.is.scg_IndexedSeqFactory(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.generic.IndexedSeqFactory")
  }
});
ScalaJS.isArrayOf.scg_IndexedSeqFactory = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scg_IndexedSeqFactory)))
});
ScalaJS.asArrayOf.scg_IndexedSeqFactory = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scg_IndexedSeqFactory(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.generic.IndexedSeqFactory;", depth)
  }
});
ScalaJS.d.scg_IndexedSeqFactory = new ScalaJS.ClassTypeData({
  scg_IndexedSeqFactory: 0
}, false, "scala.collection.generic.IndexedSeqFactory", ScalaJS.d.scg_SeqFactory, {
  scg_IndexedSeqFactory: 1,
  scg_SeqFactory: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1,
  scg_GenSeqFactory: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1
});
ScalaJS.c.scg_IndexedSeqFactory.prototype.$classData = ScalaJS.d.scg_IndexedSeqFactory;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sci_$colon$colon = (function() {
  ScalaJS.c.sci_List.call(this);
  this.head$5 = null;
  this.tl$5 = null
});
ScalaJS.c.sci_$colon$colon.prototype = new ScalaJS.h.sci_List();
ScalaJS.c.sci_$colon$colon.prototype.constructor = ScalaJS.c.sci_$colon$colon;
/** @constructor */
ScalaJS.h.sci_$colon$colon = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_$colon$colon.prototype = ScalaJS.c.sci_$colon$colon.prototype;
ScalaJS.c.sci_$colon$colon.prototype.tl$1__sci_List = (function() {
  return this.tl$5
});
ScalaJS.c.sci_$colon$colon.prototype.head__O = (function() {
  return this.head$5
});
ScalaJS.c.sci_$colon$colon.prototype.tl__sci_List = (function() {
  return this.tl$5
});
ScalaJS.c.sci_$colon$colon.prototype.tail__sci_List = (function() {
  return this.tl__sci_List()
});
ScalaJS.c.sci_$colon$colon.prototype.isEmpty__Z = (function() {
  return false
});
ScalaJS.c.sci_$colon$colon.prototype.productPrefix__T = (function() {
  return "::"
});
ScalaJS.c.sci_$colon$colon.prototype.productArity__I = (function() {
  return 2
});
ScalaJS.c.sci_$colon$colon.prototype.productElement__I__O = (function(x$1) {
  var x1 = x$1;
  switch (x1) {
    case 0:
      {
        return this.head__O();
        break
      };
    case 1:
      {
        return this.tl$1__sci_List();
        break
      };
    default:
      throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1));
  }
});
ScalaJS.c.sci_$colon$colon.prototype.productIterator__sc_Iterator = (function() {
  return ScalaJS.m.sr_ScalaRunTime().typedProductIterator__s_Product__sc_Iterator(this)
});
ScalaJS.c.sci_$colon$colon.prototype.tail__O = (function() {
  return this.tail__sci_List()
});
ScalaJS.c.sci_$colon$colon.prototype.init___O__sci_List = (function(head, tl) {
  this.head$5 = head;
  this.tl$5 = tl;
  ScalaJS.c.sci_List.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.sci_$colon$colon = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_$colon$colon)))
});
ScalaJS.as.sci_$colon$colon = (function(obj) {
  if ((ScalaJS.is.sci_$colon$colon(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.immutable.$colon$colon")
  }
});
ScalaJS.isArrayOf.sci_$colon$colon = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_$colon$colon)))
});
ScalaJS.asArrayOf.sci_$colon$colon = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sci_$colon$colon(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.$colon$colon;", depth)
  }
});
ScalaJS.d.sci_$colon$colon = new ScalaJS.ClassTypeData({
  sci_$colon$colon: 0
}, false, "scala.collection.immutable.$colon$colon", ScalaJS.d.sci_List, {
  sci_$colon$colon: 1,
  s_Serializable: 1,
  sci_List: 1,
  Ljava_io_Serializable: 1,
  sc_LinearSeqOptimized: 1,
  s_Product: 1,
  sci_LinearSeq: 1,
  sc_LinearSeq: 1,
  sc_LinearSeqLike: 1,
  sci_Seq: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sc_AbstractSeq: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_AbstractIterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.sci_$colon$colon.prototype.$classData = ScalaJS.d.sci_$colon$colon;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sci_List$ = (function() {
  ScalaJS.c.scg_SeqFactory.call(this);
  this.partialNotApplied$5 = null
});
ScalaJS.c.sci_List$.prototype = new ScalaJS.h.scg_SeqFactory();
ScalaJS.c.sci_List$.prototype.constructor = ScalaJS.c.sci_List$;
/** @constructor */
ScalaJS.h.sci_List$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_List$.prototype = ScalaJS.c.sci_List$.prototype;
ScalaJS.c.sci_List$.prototype.init___ = (function() {
  ScalaJS.c.scg_SeqFactory.prototype.init___.call(this);
  ScalaJS.n.sci_List = this;
  this.partialNotApplied$5 = new ScalaJS.c.sci_List$$anon$1().init___();
  return this
});
/*<skip>*/;
ScalaJS.is.sci_List$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_List$)))
});
ScalaJS.as.sci_List$ = (function(obj) {
  if ((ScalaJS.is.sci_List$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.immutable.List$")
  }
});
ScalaJS.isArrayOf.sci_List$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_List$)))
});
ScalaJS.asArrayOf.sci_List$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sci_List$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.List$;", depth)
  }
});
ScalaJS.d.sci_List$ = new ScalaJS.ClassTypeData({
  sci_List$: 0
}, false, "scala.collection.immutable.List$", ScalaJS.d.scg_SeqFactory, {
  sci_List$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  scg_SeqFactory: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1,
  scg_GenSeqFactory: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1
});
ScalaJS.c.sci_List$.prototype.$classData = ScalaJS.d.sci_List$;
ScalaJS.n.sci_List = undefined;
ScalaJS.m.sci_List = (function() {
  if ((!ScalaJS.n.sci_List)) {
    ScalaJS.n.sci_List = new ScalaJS.c.sci_List$().init___()
  };
  return ScalaJS.n.sci_List
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sci_Nil$ = (function() {
  ScalaJS.c.sci_List.call(this)
});
ScalaJS.c.sci_Nil$.prototype = new ScalaJS.h.sci_List();
ScalaJS.c.sci_Nil$.prototype.constructor = ScalaJS.c.sci_Nil$;
/** @constructor */
ScalaJS.h.sci_Nil$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Nil$.prototype = ScalaJS.c.sci_Nil$.prototype;
ScalaJS.c.sci_Nil$.prototype.isEmpty__Z = (function() {
  return true
});
ScalaJS.c.sci_Nil$.prototype.head__sr_Nothing$ = (function() {
  throw new ScalaJS.c.ju_NoSuchElementException().init___T("head of empty list")
});
ScalaJS.c.sci_Nil$.prototype.tail__sci_List = (function() {
  throw new ScalaJS.c.jl_UnsupportedOperationException().init___T("tail of empty list")
});
ScalaJS.c.sci_Nil$.prototype.equals__O__Z = (function(that) {
  var x1 = that;
  if (ScalaJS.is.sc_GenSeq(x1)) {
    var x2 = ScalaJS.as.sc_GenSeq(x1);
    return x2.isEmpty__Z()
  };
  return false
});
ScalaJS.c.sci_Nil$.prototype.productPrefix__T = (function() {
  return "Nil"
});
ScalaJS.c.sci_Nil$.prototype.productArity__I = (function() {
  return 0
});
ScalaJS.c.sci_Nil$.prototype.productElement__I__O = (function(x$1) {
  var x1 = x$1;
  throw new ScalaJS.c.jl_IndexOutOfBoundsException().init___T(ScalaJS.objectToString(x$1))
});
ScalaJS.c.sci_Nil$.prototype.productIterator__sc_Iterator = (function() {
  return ScalaJS.m.sr_ScalaRunTime().typedProductIterator__s_Product__sc_Iterator(this)
});
ScalaJS.c.sci_Nil$.prototype.tail__O = (function() {
  return this.tail__sci_List()
});
ScalaJS.c.sci_Nil$.prototype.head__O = (function() {
  this.head__sr_Nothing$()
});
/*<skip>*/;
ScalaJS.is.sci_Nil$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_Nil$)))
});
ScalaJS.as.sci_Nil$ = (function(obj) {
  if ((ScalaJS.is.sci_Nil$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.immutable.Nil$")
  }
});
ScalaJS.isArrayOf.sci_Nil$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_Nil$)))
});
ScalaJS.asArrayOf.sci_Nil$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sci_Nil$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.Nil$;", depth)
  }
});
ScalaJS.d.sci_Nil$ = new ScalaJS.ClassTypeData({
  sci_Nil$: 0
}, false, "scala.collection.immutable.Nil$", ScalaJS.d.sci_List, {
  sci_Nil$: 1,
  s_Serializable: 1,
  sci_List: 1,
  Ljava_io_Serializable: 1,
  sc_LinearSeqOptimized: 1,
  s_Product: 1,
  sci_LinearSeq: 1,
  sc_LinearSeq: 1,
  sc_LinearSeqLike: 1,
  sci_Seq: 1,
  sci_Iterable: 1,
  sci_Traversable: 1,
  s_Immutable: 1,
  sc_AbstractSeq: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_AbstractIterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.sci_Nil$.prototype.$classData = ScalaJS.d.sci_Nil$;
ScalaJS.n.sci_Nil = undefined;
ScalaJS.m.sci_Nil = (function() {
  if ((!ScalaJS.n.sci_Nil)) {
    ScalaJS.n.sci_Nil = new ScalaJS.c.sci_Nil$().init___()
  };
  return ScalaJS.n.sci_Nil
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sci_Set$ = (function() {
  ScalaJS.c.scg_ImmutableSetFactory.call(this)
});
ScalaJS.c.sci_Set$.prototype = new ScalaJS.h.scg_ImmutableSetFactory();
ScalaJS.c.sci_Set$.prototype.constructor = ScalaJS.c.sci_Set$;
/** @constructor */
ScalaJS.h.sci_Set$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Set$.prototype = ScalaJS.c.sci_Set$.prototype;
/*<skip>*/;
ScalaJS.is.sci_Set$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_Set$)))
});
ScalaJS.as.sci_Set$ = (function(obj) {
  if ((ScalaJS.is.sci_Set$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.immutable.Set$")
  }
});
ScalaJS.isArrayOf.sci_Set$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_Set$)))
});
ScalaJS.asArrayOf.sci_Set$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sci_Set$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.Set$;", depth)
  }
});
ScalaJS.d.sci_Set$ = new ScalaJS.ClassTypeData({
  sci_Set$: 0
}, false, "scala.collection.immutable.Set$", ScalaJS.d.scg_ImmutableSetFactory, {
  sci_Set$: 1,
  scg_ImmutableSetFactory: 1,
  scg_SetFactory: 1,
  scg_GenericSeqCompanion: 1,
  scg_GenSetFactory: 1,
  scg_GenericCompanion: 1,
  O: 1
});
ScalaJS.c.sci_Set$.prototype.$classData = ScalaJS.d.sci_Set$;
ScalaJS.n.sci_Set = undefined;
ScalaJS.m.sci_Set = (function() {
  if ((!ScalaJS.n.sci_Set)) {
    ScalaJS.n.sci_Set = new ScalaJS.c.sci_Set$().init___()
  };
  return ScalaJS.n.sci_Set
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sci_Stream$ = (function() {
  ScalaJS.c.scg_SeqFactory.call(this)
});
ScalaJS.c.sci_Stream$.prototype = new ScalaJS.h.scg_SeqFactory();
ScalaJS.c.sci_Stream$.prototype.constructor = ScalaJS.c.sci_Stream$;
/** @constructor */
ScalaJS.h.sci_Stream$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Stream$.prototype = ScalaJS.c.sci_Stream$.prototype;
/*<skip>*/;
ScalaJS.is.sci_Stream$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_Stream$)))
});
ScalaJS.as.sci_Stream$ = (function(obj) {
  if ((ScalaJS.is.sci_Stream$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.immutable.Stream$")
  }
});
ScalaJS.isArrayOf.sci_Stream$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_Stream$)))
});
ScalaJS.asArrayOf.sci_Stream$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sci_Stream$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.Stream$;", depth)
  }
});
ScalaJS.d.sci_Stream$ = new ScalaJS.ClassTypeData({
  sci_Stream$: 0
}, false, "scala.collection.immutable.Stream$", ScalaJS.d.scg_SeqFactory, {
  sci_Stream$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  scg_SeqFactory: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1,
  scg_GenSeqFactory: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1
});
ScalaJS.c.sci_Stream$.prototype.$classData = ScalaJS.d.sci_Stream$;
ScalaJS.n.sci_Stream = undefined;
ScalaJS.m.sci_Stream = (function() {
  if ((!ScalaJS.n.sci_Stream)) {
    ScalaJS.n.sci_Stream = new ScalaJS.c.sci_Stream$().init___()
  };
  return ScalaJS.n.sci_Stream
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.scm_LinkedList = (function() {
  ScalaJS.c.scm_AbstractSeq.call(this);
  this.elem$5 = null;
  this.next$5 = null
});
ScalaJS.c.scm_LinkedList.prototype = new ScalaJS.h.scm_AbstractSeq();
ScalaJS.c.scm_LinkedList.prototype.constructor = ScalaJS.c.scm_LinkedList;
/** @constructor */
ScalaJS.h.scm_LinkedList = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_LinkedList.prototype = ScalaJS.c.scm_LinkedList.prototype;
ScalaJS.c.scm_LinkedList.prototype.elem__O = (function() {
  return this.elem$5
});
ScalaJS.c.scm_LinkedList.prototype.elem$und$eq__O__V = (function(x$1) {
  this.elem$5 = x$1
});
ScalaJS.c.scm_LinkedList.prototype.next__scm_Seq = (function() {
  return this.next$5
});
ScalaJS.c.scm_LinkedList.prototype.next$und$eq__scm_Seq__V = (function(x$1) {
  this.next$5 = x$1
});
ScalaJS.c.scm_LinkedList.prototype.isEmpty__Z = (function() {
  return ScalaJS.i.scm_LinkedListLike$class__isEmpty__scm_LinkedListLike__Z(this)
});
ScalaJS.c.scm_LinkedList.prototype.length__I = (function() {
  return ScalaJS.i.scm_LinkedListLike$class__length__scm_LinkedListLike__I(this)
});
ScalaJS.c.scm_LinkedList.prototype.head__O = (function() {
  return ScalaJS.i.scm_LinkedListLike$class__head__scm_LinkedListLike__O(this)
});
ScalaJS.c.scm_LinkedList.prototype.tail__scm_Seq = (function() {
  return ScalaJS.i.scm_LinkedListLike$class__tail__scm_LinkedListLike__scm_Seq(this)
});
ScalaJS.c.scm_LinkedList.prototype.drop__I__scm_Seq = (function(n) {
  return ScalaJS.i.scm_LinkedListLike$class__drop__scm_LinkedListLike__I__scm_Seq(this, n)
});
ScalaJS.c.scm_LinkedList.prototype.apply__I__O = (function(n) {
  return ScalaJS.i.scm_LinkedListLike$class__apply__scm_LinkedListLike__I__O(this, n)
});
ScalaJS.c.scm_LinkedList.prototype.iterator__sc_Iterator = (function() {
  return ScalaJS.i.scm_LinkedListLike$class__iterator__scm_LinkedListLike__sc_Iterator(this)
});
ScalaJS.c.scm_LinkedList.prototype.foreach__F1__V = (function(f) {
  ScalaJS.i.scm_LinkedListLike$class__foreach__scm_LinkedListLike__F1__V(this, f)
});
ScalaJS.c.scm_LinkedList.prototype.seq__scm_LinearSeq = (function() {
  return ScalaJS.i.scm_LinearSeq$class__seq__scm_LinearSeq__scm_LinearSeq(this)
});
ScalaJS.c.scm_LinkedList.prototype.hashCode__I = (function() {
  return ScalaJS.i.sc_LinearSeqLike$class__hashCode__sc_LinearSeqLike__I(this)
});
ScalaJS.c.scm_LinkedList.prototype.seq__sc_LinearSeq = (function() {
  return this.seq__scm_LinearSeq()
});
ScalaJS.c.scm_LinkedList.prototype.apply__O__O = (function(v1) {
  return this.apply__I__O(ScalaJS.uI(v1))
});
ScalaJS.c.scm_LinkedList.prototype.tail__O = (function() {
  return this.tail__scm_Seq()
});
ScalaJS.c.scm_LinkedList.prototype.init___ = (function() {
  ScalaJS.c.scm_AbstractSeq.prototype.init___.call(this);
  ScalaJS.i.sc_LinearSeqLike$class__$init$__sc_LinearSeqLike__V(this);
  ScalaJS.i.sc_LinearSeq$class__$init$__sc_LinearSeq__V(this);
  ScalaJS.i.scm_LinearSeq$class__$init$__scm_LinearSeq__V(this);
  ScalaJS.i.scm_LinkedListLike$class__$init$__scm_LinkedListLike__V(this);
  this.next$und$eq__scm_Seq__V(this);
  return this
});
ScalaJS.c.scm_LinkedList.prototype.init___O__scm_LinkedList = (function(elem, next) {
  ScalaJS.c.scm_LinkedList.prototype.init___.call(this);
  if ((next !== null)) {
    this.elem$und$eq__O__V(elem);
    this.next$und$eq__scm_Seq__V(next)
  };
  return this
});
/*<skip>*/;
ScalaJS.is.scm_LinkedList = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_LinkedList)))
});
ScalaJS.as.scm_LinkedList = (function(obj) {
  if ((ScalaJS.is.scm_LinkedList(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.mutable.LinkedList")
  }
});
ScalaJS.isArrayOf.scm_LinkedList = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_LinkedList)))
});
ScalaJS.asArrayOf.scm_LinkedList = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scm_LinkedList(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.LinkedList;", depth)
  }
});
ScalaJS.d.scm_LinkedList = new ScalaJS.ClassTypeData({
  scm_LinkedList: 0
}, false, "scala.collection.mutable.LinkedList", ScalaJS.d.scm_AbstractSeq, {
  scm_LinkedList: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  scm_LinkedListLike: 1,
  scm_LinearSeq: 1,
  sc_LinearSeq: 1,
  sc_LinearSeqLike: 1,
  scm_AbstractSeq: 1,
  scm_Seq: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  scm_Iterable: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  sc_AbstractSeq: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_AbstractIterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.scm_LinkedList.prototype.$classData = ScalaJS.d.scm_LinkedList;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scm_MutableList = (function() {
  ScalaJS.c.scm_AbstractSeq.call(this);
  this.first0$5 = null;
  this.last0$5 = null;
  this.len$5 = 0
});
ScalaJS.c.scm_MutableList.prototype = new ScalaJS.h.scm_AbstractSeq();
ScalaJS.c.scm_MutableList.prototype.constructor = ScalaJS.c.scm_MutableList;
/** @constructor */
ScalaJS.h.scm_MutableList = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_MutableList.prototype = ScalaJS.c.scm_MutableList.prototype;
ScalaJS.c.scm_MutableList.prototype.scala$collection$LinearSeqOptimized$$super$sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_IterableLike$class__sameElements__sc_IterableLike__sc_GenIterable__Z(this, that)
});
ScalaJS.c.scm_MutableList.prototype.foreach__F1__V = (function(f) {
  ScalaJS.i.sc_LinearSeqOptimized$class__foreach__sc_LinearSeqOptimized__F1__V(this, f)
});
ScalaJS.c.scm_MutableList.prototype.drop__I__sc_LinearSeqOptimized = (function(n) {
  return ScalaJS.i.sc_LinearSeqOptimized$class__drop__sc_LinearSeqOptimized__I__sc_LinearSeqOptimized(this, n)
});
ScalaJS.c.scm_MutableList.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_LinearSeqOptimized$class__sameElements__sc_LinearSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.scm_MutableList.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.i.sc_LinearSeqOptimized$class__lengthCompare__sc_LinearSeqOptimized__I__I(this, len)
});
ScalaJS.c.scm_MutableList.prototype.seq__scm_LinearSeq = (function() {
  return ScalaJS.i.scm_LinearSeq$class__seq__scm_LinearSeq__scm_LinearSeq(this)
});
ScalaJS.c.scm_MutableList.prototype.hashCode__I = (function() {
  return ScalaJS.i.sc_LinearSeqLike$class__hashCode__sc_LinearSeqLike__I(this)
});
ScalaJS.c.scm_MutableList.prototype.first0__scm_LinkedList = (function() {
  return this.first0$5
});
ScalaJS.c.scm_MutableList.prototype.first0$und$eq__scm_LinkedList__V = (function(x$1) {
  this.first0$5 = x$1
});
ScalaJS.c.scm_MutableList.prototype.last0__scm_LinkedList = (function() {
  return this.last0$5
});
ScalaJS.c.scm_MutableList.prototype.last0$und$eq__scm_LinkedList__V = (function(x$1) {
  this.last0$5 = x$1
});
ScalaJS.c.scm_MutableList.prototype.len__I = (function() {
  return this.len$5
});
ScalaJS.c.scm_MutableList.prototype.len$und$eq__I__V = (function(x$1) {
  this.len$5 = x$1
});
ScalaJS.c.scm_MutableList.prototype.isEmpty__Z = (function() {
  return (this.len__I() === 0)
});
ScalaJS.c.scm_MutableList.prototype.head__O = (function() {
  if (this.nonEmpty__Z()) {
    return this.first0__scm_LinkedList().head__O()
  } else {
    throw new ScalaJS.c.ju_NoSuchElementException().init___()
  }
});
ScalaJS.c.scm_MutableList.prototype.tailImpl__scm_MutableList__V = (function(tl) {
  ScalaJS.m.s_Predef().require__Z__F0__V(this.nonEmpty__Z(), new ScalaJS.c.sjsr_AnonFunction0().init___sjs_js_Function0((function() {
    return this.$$anonfun$1__p5__T()
  })["bind"](this)));
  tl.first0$und$eq__scm_LinkedList__V(ScalaJS.as.scm_LinkedList(this.first0__scm_LinkedList().tail__scm_Seq()));
  tl.len$und$eq__I__V(((this.len__I() - 1) | 0));
  if ((tl.len__I() === 0)) {
    var jsx$1 = tl.first0__scm_LinkedList()
  } else {
    var jsx$1 = this.last0__scm_LinkedList()
  };
  tl.last0$und$eq__scm_LinkedList__V(jsx$1)
});
ScalaJS.c.scm_MutableList.prototype.length__I = (function() {
  return this.len__I()
});
ScalaJS.c.scm_MutableList.prototype.apply__I__O = (function(n) {
  return this.first0__scm_LinkedList().apply__I__O(n)
});
ScalaJS.c.scm_MutableList.prototype.prependElem__O__V = (function(elem) {
  this.first0$und$eq__scm_LinkedList__V(new ScalaJS.c.scm_LinkedList().init___O__scm_LinkedList(elem, this.first0__scm_LinkedList()));
  if ((this.len__I() === 0)) {
    this.last0$und$eq__scm_LinkedList__V(this.first0__scm_LinkedList())
  };
  this.len$und$eq__I__V(((this.len__I() + 1) | 0))
});
ScalaJS.c.scm_MutableList.prototype.appendElem__O__V = (function(elem) {
  if ((this.len__I() === 0)) {
    this.prependElem__O__V(elem)
  } else {
    this.last0__scm_LinkedList().next$und$eq__scm_Seq__V(new ScalaJS.c.scm_LinkedList().init___());
    this.last0$und$eq__scm_LinkedList__V(ScalaJS.as.scm_LinkedList(this.last0__scm_LinkedList().next__scm_Seq()));
    this.last0__scm_LinkedList().elem$und$eq__O__V(elem);
    this.last0__scm_LinkedList().next$und$eq__scm_Seq__V(new ScalaJS.c.scm_LinkedList().init___());
    this.len$und$eq__I__V(((this.len__I() + 1) | 0))
  }
});
ScalaJS.c.scm_MutableList.prototype.iterator__sc_Iterator = (function() {
  return this.first0__scm_LinkedList().iterator__sc_Iterator()
});
ScalaJS.c.scm_MutableList.prototype.$$plus$eq__O__scm_MutableList = (function(elem) {
  this.appendElem__O__V(elem);
  return this
});
ScalaJS.c.scm_MutableList.prototype.apply__O__O = (function(v1) {
  return this.apply__I__O(ScalaJS.uI(v1))
});
ScalaJS.c.scm_MutableList.prototype.$$anonfun$1__p5__T = (function() {
  return "tail of empty list"
});
ScalaJS.c.scm_MutableList.prototype.init___ = (function() {
  ScalaJS.c.scm_AbstractSeq.prototype.init___.call(this);
  ScalaJS.i.sc_LinearSeqLike$class__$init$__sc_LinearSeqLike__V(this);
  ScalaJS.i.sc_LinearSeq$class__$init$__sc_LinearSeq__V(this);
  ScalaJS.i.scm_LinearSeq$class__$init$__scm_LinearSeq__V(this);
  ScalaJS.i.sc_LinearSeqOptimized$class__$init$__sc_LinearSeqOptimized__V(this);
  ScalaJS.i.scg_Growable$class__$init$__scg_Growable__V(this);
  ScalaJS.i.scm_Builder$class__$init$__scm_Builder__V(this);
  this.first0$5 = new ScalaJS.c.scm_LinkedList().init___();
  this.last0$5 = this.first0__scm_LinkedList();
  this.len$5 = 0;
  return this
});
/*<skip>*/;
ScalaJS.is.scm_MutableList = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_MutableList)))
});
ScalaJS.as.scm_MutableList = (function(obj) {
  if ((ScalaJS.is.scm_MutableList(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.mutable.MutableList")
  }
});
ScalaJS.isArrayOf.scm_MutableList = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_MutableList)))
});
ScalaJS.asArrayOf.scm_MutableList = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scm_MutableList(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.MutableList;", depth)
  }
});
ScalaJS.d.scm_MutableList = new ScalaJS.ClassTypeData({
  scm_MutableList: 0
}, false, "scala.collection.mutable.MutableList", ScalaJS.d.scm_AbstractSeq, {
  scm_MutableList: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  scm_Builder: 1,
  scg_Growable: 1,
  scg_Clearable: 1,
  sc_LinearSeqOptimized: 1,
  scm_LinearSeq: 1,
  sc_LinearSeq: 1,
  sc_LinearSeqLike: 1,
  scm_AbstractSeq: 1,
  scm_Seq: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  scm_Iterable: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  sc_AbstractSeq: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_AbstractIterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.scm_MutableList.prototype.$classData = ScalaJS.d.scm_MutableList;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scm_StringBuilder = (function() {
  ScalaJS.c.scm_AbstractSeq.call(this);
  this.underlying$5 = null
});
ScalaJS.c.scm_StringBuilder.prototype = new ScalaJS.h.scm_AbstractSeq();
ScalaJS.c.scm_StringBuilder.prototype.constructor = ScalaJS.c.scm_StringBuilder;
/** @constructor */
ScalaJS.h.scm_StringBuilder = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_StringBuilder.prototype = ScalaJS.c.scm_StringBuilder.prototype;
ScalaJS.c.scm_StringBuilder.prototype.scala$collection$IndexedSeqOptimized$$super$sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_IterableLike$class__sameElements__sc_IterableLike__sc_GenIterable__Z(this, that)
});
ScalaJS.c.scm_StringBuilder.prototype.isEmpty__Z = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z(this)
});
ScalaJS.c.scm_StringBuilder.prototype.foreach__F1__V = (function(f) {
  ScalaJS.i.sc_IndexedSeqOptimized$class__foreach__sc_IndexedSeqOptimized__F1__V(this, f)
});
ScalaJS.c.scm_StringBuilder.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.scm_StringBuilder.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I(this, len)
});
ScalaJS.c.scm_StringBuilder.prototype.seq__scm_IndexedSeq = (function() {
  return ScalaJS.i.scm_IndexedSeq$class__seq__scm_IndexedSeq__scm_IndexedSeq(this)
});
ScalaJS.c.scm_StringBuilder.prototype.hashCode__I = (function() {
  return ScalaJS.i.sc_IndexedSeqLike$class__hashCode__sc_IndexedSeqLike__I(this)
});
ScalaJS.c.scm_StringBuilder.prototype.iterator__sc_Iterator = (function() {
  return ScalaJS.i.sc_IndexedSeqLike$class__iterator__sc_IndexedSeqLike__sc_Iterator(this)
});
ScalaJS.c.scm_StringBuilder.prototype.underlying__p5__jl_StringBuilder = (function() {
  return this.underlying$5
});
ScalaJS.c.scm_StringBuilder.prototype.length__I = (function() {
  return this.underlying__p5__jl_StringBuilder().length__I()
});
ScalaJS.c.scm_StringBuilder.prototype.apply__I__C = (function(index) {
  return this.underlying__p5__jl_StringBuilder().charAt__I__C(index)
});
ScalaJS.c.scm_StringBuilder.prototype.substring__I__I__T = (function(start, end) {
  return this.underlying__p5__jl_StringBuilder().substring__I__I__T(start, end)
});
ScalaJS.c.scm_StringBuilder.prototype.subSequence__I__I__jl_CharSequence = (function(start, end) {
  return this.substring__I__I__T(start, end)
});
ScalaJS.c.scm_StringBuilder.prototype.append__O__scm_StringBuilder = (function(x) {
  this.underlying__p5__jl_StringBuilder().append__T__jl_StringBuilder(ScalaJS.m.sjsr_RuntimeString().valueOf__O__T(x));
  return this
});
ScalaJS.c.scm_StringBuilder.prototype.append__T__scm_StringBuilder = (function(s) {
  this.underlying__p5__jl_StringBuilder().append__T__jl_StringBuilder(s);
  return this
});
ScalaJS.c.scm_StringBuilder.prototype.toString__T = (function() {
  return this.underlying__p5__jl_StringBuilder().toString__T()
});
ScalaJS.c.scm_StringBuilder.prototype.seq__sc_IndexedSeq = (function() {
  return this.seq__scm_IndexedSeq()
});
ScalaJS.c.scm_StringBuilder.prototype.apply__O__O = (function(v1) {
  return ScalaJS.bC(this.apply__I__C(ScalaJS.uI(v1)))
});
ScalaJS.c.scm_StringBuilder.prototype.apply__I__O = (function(idx) {
  return ScalaJS.bC(this.apply__I__C(idx))
});
ScalaJS.c.scm_StringBuilder.prototype.init___jl_StringBuilder = (function(underlying) {
  this.underlying$5 = underlying;
  ScalaJS.c.scm_AbstractSeq.prototype.init___.call(this);
  ScalaJS.i.sc_IndexedSeqLike$class__$init$__sc_IndexedSeqLike__V(this);
  ScalaJS.i.sc_IndexedSeq$class__$init$__sc_IndexedSeq__V(this);
  ScalaJS.i.scm_IndexedSeqLike$class__$init$__scm_IndexedSeqLike__V(this);
  ScalaJS.i.scm_IndexedSeq$class__$init$__scm_IndexedSeq__V(this);
  ScalaJS.i.sc_IndexedSeqOptimized$class__$init$__sc_IndexedSeqOptimized__V(this);
  ScalaJS.i.s_math_Ordered$class__$init$__s_math_Ordered__V(this);
  ScalaJS.i.sci_StringLike$class__$init$__sci_StringLike__V(this);
  ScalaJS.i.scg_Growable$class__$init$__scg_Growable__V(this);
  ScalaJS.i.scm_Builder$class__$init$__scm_Builder__V(this);
  return this
});
ScalaJS.c.scm_StringBuilder.prototype.init___I__T = (function(initCapacity, initValue) {
  ScalaJS.c.scm_StringBuilder.prototype.init___jl_StringBuilder.call(this, new ScalaJS.c.jl_StringBuilder().init___I(((ScalaJS.i.sjsr_RuntimeString$class__length__sjsr_RuntimeString__I(initValue) + initCapacity) | 0)).append__T__jl_StringBuilder(initValue));
  return this
});
ScalaJS.c.scm_StringBuilder.prototype.init___ = (function() {
  ScalaJS.c.scm_StringBuilder.prototype.init___I__T.call(this, 16, "");
  return this
});
/*<skip>*/;
ScalaJS.is.scm_StringBuilder = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_StringBuilder)))
});
ScalaJS.as.scm_StringBuilder = (function(obj) {
  if ((ScalaJS.is.scm_StringBuilder(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.mutable.StringBuilder")
  }
});
ScalaJS.isArrayOf.scm_StringBuilder = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_StringBuilder)))
});
ScalaJS.asArrayOf.scm_StringBuilder = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scm_StringBuilder(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.StringBuilder;", depth)
  }
});
ScalaJS.d.scm_StringBuilder = new ScalaJS.ClassTypeData({
  scm_StringBuilder: 0
}, false, "scala.collection.mutable.StringBuilder", ScalaJS.d.scm_AbstractSeq, {
  scm_StringBuilder: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  scm_Builder: 1,
  scg_Growable: 1,
  scg_Clearable: 1,
  sci_StringLike: 1,
  s_math_Ordered: 1,
  jl_Comparable: 1,
  sc_IndexedSeqOptimized: 1,
  scm_IndexedSeq: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeq: 1,
  sc_IndexedSeqLike: 1,
  jl_CharSequence: 1,
  scm_AbstractSeq: 1,
  scm_Seq: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  scm_Iterable: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  sc_AbstractSeq: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_AbstractIterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.scm_StringBuilder.prototype.$classData = ScalaJS.d.scm_StringBuilder;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scm_WrappedArray = (function() {
  ScalaJS.c.scm_AbstractSeq.call(this)
});
ScalaJS.c.scm_WrappedArray.prototype = new ScalaJS.h.scm_AbstractSeq();
ScalaJS.c.scm_WrappedArray.prototype.constructor = ScalaJS.c.scm_WrappedArray;
/** @constructor */
ScalaJS.h.scm_WrappedArray = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_WrappedArray.prototype = ScalaJS.c.scm_WrappedArray.prototype;
ScalaJS.c.scm_WrappedArray.prototype.scala$collection$IndexedSeqOptimized$$super$sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_IterableLike$class__sameElements__sc_IterableLike__sc_GenIterable__Z(this, that)
});
ScalaJS.c.scm_WrappedArray.prototype.isEmpty__Z = (function() {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__isEmpty__sc_IndexedSeqOptimized__Z(this)
});
ScalaJS.c.scm_WrappedArray.prototype.foreach__F1__V = (function(f) {
  ScalaJS.i.sc_IndexedSeqOptimized$class__foreach__sc_IndexedSeqOptimized__F1__V(this, f)
});
ScalaJS.c.scm_WrappedArray.prototype.sameElements__sc_GenIterable__Z = (function(that) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__sameElements__sc_IndexedSeqOptimized__sc_GenIterable__Z(this, that)
});
ScalaJS.c.scm_WrappedArray.prototype.lengthCompare__I__I = (function(len) {
  return ScalaJS.i.sc_IndexedSeqOptimized$class__lengthCompare__sc_IndexedSeqOptimized__I__I(this, len)
});
ScalaJS.c.scm_WrappedArray.prototype.seq__scm_IndexedSeq = (function() {
  return ScalaJS.i.scm_IndexedSeq$class__seq__scm_IndexedSeq__scm_IndexedSeq(this)
});
ScalaJS.c.scm_WrappedArray.prototype.hashCode__I = (function() {
  return ScalaJS.i.sc_IndexedSeqLike$class__hashCode__sc_IndexedSeqLike__I(this)
});
ScalaJS.c.scm_WrappedArray.prototype.iterator__sc_Iterator = (function() {
  return ScalaJS.i.sc_IndexedSeqLike$class__iterator__sc_IndexedSeqLike__sc_Iterator(this)
});
ScalaJS.c.scm_WrappedArray.prototype.stringPrefix__T = (function() {
  return "WrappedArray"
});
ScalaJS.c.scm_WrappedArray.prototype.seq__sc_IndexedSeq = (function() {
  return this.seq__scm_IndexedSeq()
});
ScalaJS.c.scm_WrappedArray.prototype.init___ = (function() {
  ScalaJS.c.scm_AbstractSeq.prototype.init___.call(this);
  ScalaJS.i.sc_IndexedSeqLike$class__$init$__sc_IndexedSeqLike__V(this);
  ScalaJS.i.sc_IndexedSeq$class__$init$__sc_IndexedSeq__V(this);
  ScalaJS.i.scm_IndexedSeqLike$class__$init$__scm_IndexedSeqLike__V(this);
  ScalaJS.i.scm_IndexedSeq$class__$init$__scm_IndexedSeq__V(this);
  ScalaJS.i.sc_IndexedSeqOptimized$class__$init$__sc_IndexedSeqOptimized__V(this);
  ScalaJS.i.scm_ArrayLike$class__$init$__scm_ArrayLike__V(this);
  ScalaJS.i.sc_CustomParallelizable$class__$init$__sc_CustomParallelizable__V(this);
  return this
});
/*<skip>*/;
ScalaJS.is.scm_WrappedArray = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_WrappedArray)))
});
ScalaJS.as.scm_WrappedArray = (function(obj) {
  if ((ScalaJS.is.scm_WrappedArray(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.mutable.WrappedArray")
  }
});
ScalaJS.isArrayOf.scm_WrappedArray = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_WrappedArray)))
});
ScalaJS.asArrayOf.scm_WrappedArray = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scm_WrappedArray(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.WrappedArray;", depth)
  }
});
ScalaJS.d.scm_WrappedArray = new ScalaJS.ClassTypeData({
  scm_WrappedArray: 0
}, false, "scala.collection.mutable.WrappedArray", ScalaJS.d.scm_AbstractSeq, {
  scm_WrappedArray: 1,
  sc_CustomParallelizable: 1,
  scm_ArrayLike: 1,
  scm_IndexedSeqOptimized: 1,
  sc_IndexedSeqOptimized: 1,
  scm_IndexedSeq: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeq: 1,
  sc_IndexedSeqLike: 1,
  scm_AbstractSeq: 1,
  scm_Seq: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  scm_Iterable: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  sc_AbstractSeq: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_AbstractIterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.scm_WrappedArray.prototype.$classData = ScalaJS.d.scm_WrappedArray;
/*<skip>*/;
/** @constructor */
ScalaJS.c.sc_IndexedSeq$ = (function() {
  ScalaJS.c.scg_IndexedSeqFactory.call(this);
  this.ReusableCBF$6 = null
});
ScalaJS.c.sc_IndexedSeq$.prototype = new ScalaJS.h.scg_IndexedSeqFactory();
ScalaJS.c.sc_IndexedSeq$.prototype.constructor = ScalaJS.c.sc_IndexedSeq$;
/** @constructor */
ScalaJS.h.sc_IndexedSeq$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sc_IndexedSeq$.prototype = ScalaJS.c.sc_IndexedSeq$.prototype;
ScalaJS.c.sc_IndexedSeq$.prototype.init___ = (function() {
  ScalaJS.c.scg_IndexedSeqFactory.prototype.init___.call(this);
  ScalaJS.n.sc_IndexedSeq = this;
  this.ReusableCBF$6 = new ScalaJS.c.sc_IndexedSeq$$anon$1().init___();
  return this
});
/*<skip>*/;
ScalaJS.is.sc_IndexedSeq$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sc_IndexedSeq$)))
});
ScalaJS.as.sc_IndexedSeq$ = (function(obj) {
  if ((ScalaJS.is.sc_IndexedSeq$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.IndexedSeq$")
  }
});
ScalaJS.isArrayOf.sc_IndexedSeq$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sc_IndexedSeq$)))
});
ScalaJS.asArrayOf.sc_IndexedSeq$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sc_IndexedSeq$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.IndexedSeq$;", depth)
  }
});
ScalaJS.d.sc_IndexedSeq$ = new ScalaJS.ClassTypeData({
  sc_IndexedSeq$: 0
}, false, "scala.collection.IndexedSeq$", ScalaJS.d.scg_IndexedSeqFactory, {
  sc_IndexedSeq$: 1,
  scg_IndexedSeqFactory: 1,
  scg_SeqFactory: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1,
  scg_GenSeqFactory: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1
});
ScalaJS.c.sc_IndexedSeq$.prototype.$classData = ScalaJS.d.sc_IndexedSeq$;
ScalaJS.n.sc_IndexedSeq = undefined;
ScalaJS.m.sc_IndexedSeq = (function() {
  if ((!ScalaJS.n.sc_IndexedSeq)) {
    ScalaJS.n.sc_IndexedSeq = new ScalaJS.c.sc_IndexedSeq$().init___()
  };
  return ScalaJS.n.sc_IndexedSeq
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.sci_Vector$ = (function() {
  ScalaJS.c.scg_IndexedSeqFactory.call(this);
  this.NIL$6 = null;
  this.Log2ConcatFaster$6 = 0;
  this.TinyAppendFaster$6 = 0
});
ScalaJS.c.sci_Vector$.prototype = new ScalaJS.h.scg_IndexedSeqFactory();
ScalaJS.c.sci_Vector$.prototype.constructor = ScalaJS.c.sci_Vector$;
/** @constructor */
ScalaJS.h.sci_Vector$ = (function() {
  /*<skip>*/
});
ScalaJS.h.sci_Vector$.prototype = ScalaJS.c.sci_Vector$.prototype;
ScalaJS.c.sci_Vector$.prototype.init___ = (function() {
  ScalaJS.c.scg_IndexedSeqFactory.prototype.init___.call(this);
  ScalaJS.n.sci_Vector = this;
  this.NIL$6 = new ScalaJS.c.sci_Vector().init___I__I__I(0, 0, 0);
  return this
});
/*<skip>*/;
ScalaJS.is.sci_Vector$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.sci_Vector$)))
});
ScalaJS.as.sci_Vector$ = (function(obj) {
  if ((ScalaJS.is.sci_Vector$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.immutable.Vector$")
  }
});
ScalaJS.isArrayOf.sci_Vector$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.sci_Vector$)))
});
ScalaJS.asArrayOf.sci_Vector$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.sci_Vector$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.immutable.Vector$;", depth)
  }
});
ScalaJS.d.sci_Vector$ = new ScalaJS.ClassTypeData({
  sci_Vector$: 0
}, false, "scala.collection.immutable.Vector$", ScalaJS.d.scg_IndexedSeqFactory, {
  sci_Vector$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  scg_IndexedSeqFactory: 1,
  scg_SeqFactory: 1,
  scg_TraversableFactory: 1,
  scg_GenericSeqCompanion: 1,
  scg_GenSeqFactory: 1,
  scg_GenTraversableFactory: 1,
  scg_GenericCompanion: 1,
  O: 1
});
ScalaJS.c.sci_Vector$.prototype.$classData = ScalaJS.d.sci_Vector$;
ScalaJS.n.sci_Vector = undefined;
ScalaJS.m.sci_Vector = (function() {
  if ((!ScalaJS.n.sci_Vector)) {
    ScalaJS.n.sci_Vector = new ScalaJS.c.sci_Vector$().init___()
  };
  return ScalaJS.n.sci_Vector
});
/*<skip>*/;
/** @constructor */
ScalaJS.c.scm_Queue = (function() {
  ScalaJS.c.scm_MutableList.call(this)
});
ScalaJS.c.scm_Queue.prototype = new ScalaJS.h.scm_MutableList();
ScalaJS.c.scm_Queue.prototype.constructor = ScalaJS.c.scm_Queue;
/** @constructor */
ScalaJS.h.scm_Queue = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_Queue.prototype = ScalaJS.c.scm_Queue.prototype;
ScalaJS.c.scm_Queue.prototype.dequeue__O = (function() {
  if (this.isEmpty__Z()) {
    throw new ScalaJS.c.ju_NoSuchElementException().init___T("queue empty")
  } else {
    var res = this.first0__scm_LinkedList().elem__O();
    this.first0$und$eq__scm_LinkedList__V(ScalaJS.as.scm_LinkedList(this.first0__scm_LinkedList().next__scm_Seq()));
    this.decrementLength__p6__V();
    return res
  }
});
ScalaJS.c.scm_Queue.prototype.tail__scm_Queue = (function() {
  var tl = new ScalaJS.c.scm_Queue().init___();
  this.tailImpl__scm_MutableList__V(tl);
  return tl
});
ScalaJS.c.scm_Queue.prototype.decrementLength__p6__V = (function() {
  this.len$und$eq__I__V(((this.len__I() - 1) | 0));
  if ((this.len__I() === 0)) {
    this.last0$und$eq__scm_LinkedList__V(this.first0__scm_LinkedList())
  }
});
ScalaJS.c.scm_Queue.prototype.seq__sc_LinearSeq = (function() {
  return this.seq__scm_LinearSeq()
});
ScalaJS.c.scm_Queue.prototype.tail__O = (function() {
  return this.tail__scm_Queue()
});
/*<skip>*/;
ScalaJS.is.scm_Queue = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_Queue)))
});
ScalaJS.as.scm_Queue = (function(obj) {
  if ((ScalaJS.is.scm_Queue(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.mutable.Queue")
  }
});
ScalaJS.isArrayOf.scm_Queue = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_Queue)))
});
ScalaJS.asArrayOf.scm_Queue = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scm_Queue(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.Queue;", depth)
  }
});
ScalaJS.d.scm_Queue = new ScalaJS.ClassTypeData({
  scm_Queue: 0
}, false, "scala.collection.mutable.Queue", ScalaJS.d.scm_MutableList, {
  scm_Queue: 1,
  scm_MutableList: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  scm_Builder: 1,
  scg_Growable: 1,
  scg_Clearable: 1,
  sc_LinearSeqOptimized: 1,
  scm_LinearSeq: 1,
  sc_LinearSeq: 1,
  sc_LinearSeqLike: 1,
  scm_AbstractSeq: 1,
  scm_Seq: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  scm_Iterable: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  sc_AbstractSeq: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_AbstractIterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.scm_Queue.prototype.$classData = ScalaJS.d.scm_Queue;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scm_WrappedArray$ofBoolean = (function() {
  ScalaJS.c.scm_WrappedArray.call(this);
  this.array$6 = null
});
ScalaJS.c.scm_WrappedArray$ofBoolean.prototype = new ScalaJS.h.scm_WrappedArray();
ScalaJS.c.scm_WrappedArray$ofBoolean.prototype.constructor = ScalaJS.c.scm_WrappedArray$ofBoolean;
/** @constructor */
ScalaJS.h.scm_WrappedArray$ofBoolean = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_WrappedArray$ofBoolean.prototype = ScalaJS.c.scm_WrappedArray$ofBoolean.prototype;
ScalaJS.c.scm_WrappedArray$ofBoolean.prototype.array__AZ = (function() {
  return this.array$6
});
ScalaJS.c.scm_WrappedArray$ofBoolean.prototype.length__I = (function() {
  return this.array__AZ().u["length"]
});
ScalaJS.c.scm_WrappedArray$ofBoolean.prototype.apply__I__Z = (function(index) {
  return this.apply$mcZI$sp__I__Z(index)
});
ScalaJS.c.scm_WrappedArray$ofBoolean.prototype.apply$mcZI$sp__I__Z = (function(index) {
  return this.array__AZ().u[index]
});
ScalaJS.c.scm_WrappedArray$ofBoolean.prototype.apply__O__O = (function(v1) {
  return this.apply__I__Z(ScalaJS.uI(v1))
});
ScalaJS.c.scm_WrappedArray$ofBoolean.prototype.apply__I__O = (function(index) {
  return this.apply__I__Z(index)
});
ScalaJS.c.scm_WrappedArray$ofBoolean.prototype.init___AZ = (function(array) {
  this.array$6 = array;
  ScalaJS.c.scm_WrappedArray.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.scm_WrappedArray$ofBoolean = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_WrappedArray$ofBoolean)))
});
ScalaJS.as.scm_WrappedArray$ofBoolean = (function(obj) {
  if ((ScalaJS.is.scm_WrappedArray$ofBoolean(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.mutable.WrappedArray$ofBoolean")
  }
});
ScalaJS.isArrayOf.scm_WrappedArray$ofBoolean = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_WrappedArray$ofBoolean)))
});
ScalaJS.asArrayOf.scm_WrappedArray$ofBoolean = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scm_WrappedArray$ofBoolean(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.WrappedArray$ofBoolean;", depth)
  }
});
ScalaJS.d.scm_WrappedArray$ofBoolean = new ScalaJS.ClassTypeData({
  scm_WrappedArray$ofBoolean: 0
}, false, "scala.collection.mutable.WrappedArray$ofBoolean", ScalaJS.d.scm_WrappedArray, {
  scm_WrappedArray$ofBoolean: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  scm_WrappedArray: 1,
  sc_CustomParallelizable: 1,
  scm_ArrayLike: 1,
  scm_IndexedSeqOptimized: 1,
  sc_IndexedSeqOptimized: 1,
  scm_IndexedSeq: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeq: 1,
  sc_IndexedSeqLike: 1,
  scm_AbstractSeq: 1,
  scm_Seq: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  scm_Iterable: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  sc_AbstractSeq: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_AbstractIterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.scm_WrappedArray$ofBoolean.prototype.$classData = ScalaJS.d.scm_WrappedArray$ofBoolean;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scm_WrappedArray$ofByte = (function() {
  ScalaJS.c.scm_WrappedArray.call(this);
  this.array$6 = null
});
ScalaJS.c.scm_WrappedArray$ofByte.prototype = new ScalaJS.h.scm_WrappedArray();
ScalaJS.c.scm_WrappedArray$ofByte.prototype.constructor = ScalaJS.c.scm_WrappedArray$ofByte;
/** @constructor */
ScalaJS.h.scm_WrappedArray$ofByte = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_WrappedArray$ofByte.prototype = ScalaJS.c.scm_WrappedArray$ofByte.prototype;
ScalaJS.c.scm_WrappedArray$ofByte.prototype.array__AB = (function() {
  return this.array$6
});
ScalaJS.c.scm_WrappedArray$ofByte.prototype.length__I = (function() {
  return this.array__AB().u["length"]
});
ScalaJS.c.scm_WrappedArray$ofByte.prototype.apply__I__B = (function(index) {
  return this.array__AB().u[index]
});
ScalaJS.c.scm_WrappedArray$ofByte.prototype.apply__O__O = (function(v1) {
  return this.apply__I__B(ScalaJS.uI(v1))
});
ScalaJS.c.scm_WrappedArray$ofByte.prototype.apply__I__O = (function(index) {
  return this.apply__I__B(index)
});
ScalaJS.c.scm_WrappedArray$ofByte.prototype.init___AB = (function(array) {
  this.array$6 = array;
  ScalaJS.c.scm_WrappedArray.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.scm_WrappedArray$ofByte = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_WrappedArray$ofByte)))
});
ScalaJS.as.scm_WrappedArray$ofByte = (function(obj) {
  if ((ScalaJS.is.scm_WrappedArray$ofByte(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.mutable.WrappedArray$ofByte")
  }
});
ScalaJS.isArrayOf.scm_WrappedArray$ofByte = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_WrappedArray$ofByte)))
});
ScalaJS.asArrayOf.scm_WrappedArray$ofByte = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scm_WrappedArray$ofByte(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.WrappedArray$ofByte;", depth)
  }
});
ScalaJS.d.scm_WrappedArray$ofByte = new ScalaJS.ClassTypeData({
  scm_WrappedArray$ofByte: 0
}, false, "scala.collection.mutable.WrappedArray$ofByte", ScalaJS.d.scm_WrappedArray, {
  scm_WrappedArray$ofByte: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  scm_WrappedArray: 1,
  sc_CustomParallelizable: 1,
  scm_ArrayLike: 1,
  scm_IndexedSeqOptimized: 1,
  sc_IndexedSeqOptimized: 1,
  scm_IndexedSeq: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeq: 1,
  sc_IndexedSeqLike: 1,
  scm_AbstractSeq: 1,
  scm_Seq: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  scm_Iterable: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  sc_AbstractSeq: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_AbstractIterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.scm_WrappedArray$ofByte.prototype.$classData = ScalaJS.d.scm_WrappedArray$ofByte;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scm_WrappedArray$ofChar = (function() {
  ScalaJS.c.scm_WrappedArray.call(this);
  this.array$6 = null
});
ScalaJS.c.scm_WrappedArray$ofChar.prototype = new ScalaJS.h.scm_WrappedArray();
ScalaJS.c.scm_WrappedArray$ofChar.prototype.constructor = ScalaJS.c.scm_WrappedArray$ofChar;
/** @constructor */
ScalaJS.h.scm_WrappedArray$ofChar = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_WrappedArray$ofChar.prototype = ScalaJS.c.scm_WrappedArray$ofChar.prototype;
ScalaJS.c.scm_WrappedArray$ofChar.prototype.array__AC = (function() {
  return this.array$6
});
ScalaJS.c.scm_WrappedArray$ofChar.prototype.length__I = (function() {
  return this.array__AC().u["length"]
});
ScalaJS.c.scm_WrappedArray$ofChar.prototype.apply__I__C = (function(index) {
  return this.array__AC().u[index]
});
ScalaJS.c.scm_WrappedArray$ofChar.prototype.apply__O__O = (function(v1) {
  return ScalaJS.bC(this.apply__I__C(ScalaJS.uI(v1)))
});
ScalaJS.c.scm_WrappedArray$ofChar.prototype.apply__I__O = (function(index) {
  return ScalaJS.bC(this.apply__I__C(index))
});
ScalaJS.c.scm_WrappedArray$ofChar.prototype.init___AC = (function(array) {
  this.array$6 = array;
  ScalaJS.c.scm_WrappedArray.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.scm_WrappedArray$ofChar = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_WrappedArray$ofChar)))
});
ScalaJS.as.scm_WrappedArray$ofChar = (function(obj) {
  if ((ScalaJS.is.scm_WrappedArray$ofChar(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.mutable.WrappedArray$ofChar")
  }
});
ScalaJS.isArrayOf.scm_WrappedArray$ofChar = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_WrappedArray$ofChar)))
});
ScalaJS.asArrayOf.scm_WrappedArray$ofChar = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scm_WrappedArray$ofChar(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.WrappedArray$ofChar;", depth)
  }
});
ScalaJS.d.scm_WrappedArray$ofChar = new ScalaJS.ClassTypeData({
  scm_WrappedArray$ofChar: 0
}, false, "scala.collection.mutable.WrappedArray$ofChar", ScalaJS.d.scm_WrappedArray, {
  scm_WrappedArray$ofChar: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  scm_WrappedArray: 1,
  sc_CustomParallelizable: 1,
  scm_ArrayLike: 1,
  scm_IndexedSeqOptimized: 1,
  sc_IndexedSeqOptimized: 1,
  scm_IndexedSeq: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeq: 1,
  sc_IndexedSeqLike: 1,
  scm_AbstractSeq: 1,
  scm_Seq: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  scm_Iterable: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  sc_AbstractSeq: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_AbstractIterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.scm_WrappedArray$ofChar.prototype.$classData = ScalaJS.d.scm_WrappedArray$ofChar;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scm_WrappedArray$ofDouble = (function() {
  ScalaJS.c.scm_WrappedArray.call(this);
  this.array$6 = null
});
ScalaJS.c.scm_WrappedArray$ofDouble.prototype = new ScalaJS.h.scm_WrappedArray();
ScalaJS.c.scm_WrappedArray$ofDouble.prototype.constructor = ScalaJS.c.scm_WrappedArray$ofDouble;
/** @constructor */
ScalaJS.h.scm_WrappedArray$ofDouble = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_WrappedArray$ofDouble.prototype = ScalaJS.c.scm_WrappedArray$ofDouble.prototype;
ScalaJS.c.scm_WrappedArray$ofDouble.prototype.array__AD = (function() {
  return this.array$6
});
ScalaJS.c.scm_WrappedArray$ofDouble.prototype.length__I = (function() {
  return this.array__AD().u["length"]
});
ScalaJS.c.scm_WrappedArray$ofDouble.prototype.apply__I__D = (function(index) {
  return this.apply$mcDI$sp__I__D(index)
});
ScalaJS.c.scm_WrappedArray$ofDouble.prototype.apply$mcDI$sp__I__D = (function(index) {
  return this.array__AD().u[index]
});
ScalaJS.c.scm_WrappedArray$ofDouble.prototype.apply__O__O = (function(v1) {
  return this.apply__I__D(ScalaJS.uI(v1))
});
ScalaJS.c.scm_WrappedArray$ofDouble.prototype.apply__I__O = (function(index) {
  return this.apply__I__D(index)
});
ScalaJS.c.scm_WrappedArray$ofDouble.prototype.init___AD = (function(array) {
  this.array$6 = array;
  ScalaJS.c.scm_WrappedArray.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.scm_WrappedArray$ofDouble = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_WrappedArray$ofDouble)))
});
ScalaJS.as.scm_WrappedArray$ofDouble = (function(obj) {
  if ((ScalaJS.is.scm_WrappedArray$ofDouble(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.mutable.WrappedArray$ofDouble")
  }
});
ScalaJS.isArrayOf.scm_WrappedArray$ofDouble = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_WrappedArray$ofDouble)))
});
ScalaJS.asArrayOf.scm_WrappedArray$ofDouble = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scm_WrappedArray$ofDouble(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.WrappedArray$ofDouble;", depth)
  }
});
ScalaJS.d.scm_WrappedArray$ofDouble = new ScalaJS.ClassTypeData({
  scm_WrappedArray$ofDouble: 0
}, false, "scala.collection.mutable.WrappedArray$ofDouble", ScalaJS.d.scm_WrappedArray, {
  scm_WrappedArray$ofDouble: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  scm_WrappedArray: 1,
  sc_CustomParallelizable: 1,
  scm_ArrayLike: 1,
  scm_IndexedSeqOptimized: 1,
  sc_IndexedSeqOptimized: 1,
  scm_IndexedSeq: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeq: 1,
  sc_IndexedSeqLike: 1,
  scm_AbstractSeq: 1,
  scm_Seq: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  scm_Iterable: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  sc_AbstractSeq: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_AbstractIterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.scm_WrappedArray$ofDouble.prototype.$classData = ScalaJS.d.scm_WrappedArray$ofDouble;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scm_WrappedArray$ofFloat = (function() {
  ScalaJS.c.scm_WrappedArray.call(this);
  this.array$6 = null
});
ScalaJS.c.scm_WrappedArray$ofFloat.prototype = new ScalaJS.h.scm_WrappedArray();
ScalaJS.c.scm_WrappedArray$ofFloat.prototype.constructor = ScalaJS.c.scm_WrappedArray$ofFloat;
/** @constructor */
ScalaJS.h.scm_WrappedArray$ofFloat = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_WrappedArray$ofFloat.prototype = ScalaJS.c.scm_WrappedArray$ofFloat.prototype;
ScalaJS.c.scm_WrappedArray$ofFloat.prototype.array__AF = (function() {
  return this.array$6
});
ScalaJS.c.scm_WrappedArray$ofFloat.prototype.length__I = (function() {
  return this.array__AF().u["length"]
});
ScalaJS.c.scm_WrappedArray$ofFloat.prototype.apply__I__F = (function(index) {
  return this.apply$mcFI$sp__I__F(index)
});
ScalaJS.c.scm_WrappedArray$ofFloat.prototype.apply$mcFI$sp__I__F = (function(index) {
  return this.array__AF().u[index]
});
ScalaJS.c.scm_WrappedArray$ofFloat.prototype.apply__O__O = (function(v1) {
  return this.apply__I__F(ScalaJS.uI(v1))
});
ScalaJS.c.scm_WrappedArray$ofFloat.prototype.apply__I__O = (function(index) {
  return this.apply__I__F(index)
});
ScalaJS.c.scm_WrappedArray$ofFloat.prototype.init___AF = (function(array) {
  this.array$6 = array;
  ScalaJS.c.scm_WrappedArray.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.scm_WrappedArray$ofFloat = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_WrappedArray$ofFloat)))
});
ScalaJS.as.scm_WrappedArray$ofFloat = (function(obj) {
  if ((ScalaJS.is.scm_WrappedArray$ofFloat(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.mutable.WrappedArray$ofFloat")
  }
});
ScalaJS.isArrayOf.scm_WrappedArray$ofFloat = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_WrappedArray$ofFloat)))
});
ScalaJS.asArrayOf.scm_WrappedArray$ofFloat = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scm_WrappedArray$ofFloat(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.WrappedArray$ofFloat;", depth)
  }
});
ScalaJS.d.scm_WrappedArray$ofFloat = new ScalaJS.ClassTypeData({
  scm_WrappedArray$ofFloat: 0
}, false, "scala.collection.mutable.WrappedArray$ofFloat", ScalaJS.d.scm_WrappedArray, {
  scm_WrappedArray$ofFloat: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  scm_WrappedArray: 1,
  sc_CustomParallelizable: 1,
  scm_ArrayLike: 1,
  scm_IndexedSeqOptimized: 1,
  sc_IndexedSeqOptimized: 1,
  scm_IndexedSeq: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeq: 1,
  sc_IndexedSeqLike: 1,
  scm_AbstractSeq: 1,
  scm_Seq: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  scm_Iterable: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  sc_AbstractSeq: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_AbstractIterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.scm_WrappedArray$ofFloat.prototype.$classData = ScalaJS.d.scm_WrappedArray$ofFloat;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scm_WrappedArray$ofInt = (function() {
  ScalaJS.c.scm_WrappedArray.call(this);
  this.array$6 = null
});
ScalaJS.c.scm_WrappedArray$ofInt.prototype = new ScalaJS.h.scm_WrappedArray();
ScalaJS.c.scm_WrappedArray$ofInt.prototype.constructor = ScalaJS.c.scm_WrappedArray$ofInt;
/** @constructor */
ScalaJS.h.scm_WrappedArray$ofInt = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_WrappedArray$ofInt.prototype = ScalaJS.c.scm_WrappedArray$ofInt.prototype;
ScalaJS.c.scm_WrappedArray$ofInt.prototype.array__AI = (function() {
  return this.array$6
});
ScalaJS.c.scm_WrappedArray$ofInt.prototype.length__I = (function() {
  return this.array__AI().u["length"]
});
ScalaJS.c.scm_WrappedArray$ofInt.prototype.apply__I__I = (function(index) {
  return this.apply$mcII$sp__I__I(index)
});
ScalaJS.c.scm_WrappedArray$ofInt.prototype.apply$mcII$sp__I__I = (function(index) {
  return this.array__AI().u[index]
});
ScalaJS.c.scm_WrappedArray$ofInt.prototype.apply__O__O = (function(v1) {
  return this.apply__I__I(ScalaJS.uI(v1))
});
ScalaJS.c.scm_WrappedArray$ofInt.prototype.apply__I__O = (function(index) {
  return this.apply__I__I(index)
});
ScalaJS.c.scm_WrappedArray$ofInt.prototype.init___AI = (function(array) {
  this.array$6 = array;
  ScalaJS.c.scm_WrappedArray.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.scm_WrappedArray$ofInt = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_WrappedArray$ofInt)))
});
ScalaJS.as.scm_WrappedArray$ofInt = (function(obj) {
  if ((ScalaJS.is.scm_WrappedArray$ofInt(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.mutable.WrappedArray$ofInt")
  }
});
ScalaJS.isArrayOf.scm_WrappedArray$ofInt = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_WrappedArray$ofInt)))
});
ScalaJS.asArrayOf.scm_WrappedArray$ofInt = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scm_WrappedArray$ofInt(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.WrappedArray$ofInt;", depth)
  }
});
ScalaJS.d.scm_WrappedArray$ofInt = new ScalaJS.ClassTypeData({
  scm_WrappedArray$ofInt: 0
}, false, "scala.collection.mutable.WrappedArray$ofInt", ScalaJS.d.scm_WrappedArray, {
  scm_WrappedArray$ofInt: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  scm_WrappedArray: 1,
  sc_CustomParallelizable: 1,
  scm_ArrayLike: 1,
  scm_IndexedSeqOptimized: 1,
  sc_IndexedSeqOptimized: 1,
  scm_IndexedSeq: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeq: 1,
  sc_IndexedSeqLike: 1,
  scm_AbstractSeq: 1,
  scm_Seq: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  scm_Iterable: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  sc_AbstractSeq: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_AbstractIterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.scm_WrappedArray$ofInt.prototype.$classData = ScalaJS.d.scm_WrappedArray$ofInt;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scm_WrappedArray$ofLong = (function() {
  ScalaJS.c.scm_WrappedArray.call(this);
  this.array$6 = null
});
ScalaJS.c.scm_WrappedArray$ofLong.prototype = new ScalaJS.h.scm_WrappedArray();
ScalaJS.c.scm_WrappedArray$ofLong.prototype.constructor = ScalaJS.c.scm_WrappedArray$ofLong;
/** @constructor */
ScalaJS.h.scm_WrappedArray$ofLong = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_WrappedArray$ofLong.prototype = ScalaJS.c.scm_WrappedArray$ofLong.prototype;
ScalaJS.c.scm_WrappedArray$ofLong.prototype.array__AJ = (function() {
  return this.array$6
});
ScalaJS.c.scm_WrappedArray$ofLong.prototype.length__I = (function() {
  return this.array__AJ().u["length"]
});
ScalaJS.c.scm_WrappedArray$ofLong.prototype.apply__I__J = (function(index) {
  return this.apply$mcJI$sp__I__J(index)
});
ScalaJS.c.scm_WrappedArray$ofLong.prototype.apply$mcJI$sp__I__J = (function(index) {
  return this.array__AJ().u[index]
});
ScalaJS.c.scm_WrappedArray$ofLong.prototype.apply__O__O = (function(v1) {
  return this.apply__I__J(ScalaJS.uI(v1))
});
ScalaJS.c.scm_WrappedArray$ofLong.prototype.apply__I__O = (function(index) {
  return this.apply__I__J(index)
});
ScalaJS.c.scm_WrappedArray$ofLong.prototype.init___AJ = (function(array) {
  this.array$6 = array;
  ScalaJS.c.scm_WrappedArray.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.scm_WrappedArray$ofLong = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_WrappedArray$ofLong)))
});
ScalaJS.as.scm_WrappedArray$ofLong = (function(obj) {
  if ((ScalaJS.is.scm_WrappedArray$ofLong(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.mutable.WrappedArray$ofLong")
  }
});
ScalaJS.isArrayOf.scm_WrappedArray$ofLong = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_WrappedArray$ofLong)))
});
ScalaJS.asArrayOf.scm_WrappedArray$ofLong = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scm_WrappedArray$ofLong(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.WrappedArray$ofLong;", depth)
  }
});
ScalaJS.d.scm_WrappedArray$ofLong = new ScalaJS.ClassTypeData({
  scm_WrappedArray$ofLong: 0
}, false, "scala.collection.mutable.WrappedArray$ofLong", ScalaJS.d.scm_WrappedArray, {
  scm_WrappedArray$ofLong: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  scm_WrappedArray: 1,
  sc_CustomParallelizable: 1,
  scm_ArrayLike: 1,
  scm_IndexedSeqOptimized: 1,
  sc_IndexedSeqOptimized: 1,
  scm_IndexedSeq: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeq: 1,
  sc_IndexedSeqLike: 1,
  scm_AbstractSeq: 1,
  scm_Seq: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  scm_Iterable: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  sc_AbstractSeq: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_AbstractIterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.scm_WrappedArray$ofLong.prototype.$classData = ScalaJS.d.scm_WrappedArray$ofLong;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scm_WrappedArray$ofRef = (function() {
  ScalaJS.c.scm_WrappedArray.call(this);
  this.array$6 = null;
  this.elemTag$6 = null;
  this.bitmap$0$6 = false
});
ScalaJS.c.scm_WrappedArray$ofRef.prototype = new ScalaJS.h.scm_WrappedArray();
ScalaJS.c.scm_WrappedArray$ofRef.prototype.constructor = ScalaJS.c.scm_WrappedArray$ofRef;
/** @constructor */
ScalaJS.h.scm_WrappedArray$ofRef = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_WrappedArray$ofRef.prototype = ScalaJS.c.scm_WrappedArray$ofRef.prototype;
ScalaJS.c.scm_WrappedArray$ofRef.prototype.array__AO = (function() {
  return this.array$6
});
ScalaJS.c.scm_WrappedArray$ofRef.prototype.length__I = (function() {
  return this.array__AO().u["length"]
});
ScalaJS.c.scm_WrappedArray$ofRef.prototype.apply__I__O = (function(index) {
  return this.array__AO().u[index]
});
ScalaJS.c.scm_WrappedArray$ofRef.prototype.apply__O__O = (function(v1) {
  return this.apply__I__O(ScalaJS.uI(v1))
});
ScalaJS.c.scm_WrappedArray$ofRef.prototype.init___AO = (function(array) {
  this.array$6 = array;
  ScalaJS.c.scm_WrappedArray.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.scm_WrappedArray$ofRef = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_WrappedArray$ofRef)))
});
ScalaJS.as.scm_WrappedArray$ofRef = (function(obj) {
  if ((ScalaJS.is.scm_WrappedArray$ofRef(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.mutable.WrappedArray$ofRef")
  }
});
ScalaJS.isArrayOf.scm_WrappedArray$ofRef = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_WrappedArray$ofRef)))
});
ScalaJS.asArrayOf.scm_WrappedArray$ofRef = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scm_WrappedArray$ofRef(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.WrappedArray$ofRef;", depth)
  }
});
ScalaJS.d.scm_WrappedArray$ofRef = new ScalaJS.ClassTypeData({
  scm_WrappedArray$ofRef: 0
}, false, "scala.collection.mutable.WrappedArray$ofRef", ScalaJS.d.scm_WrappedArray, {
  scm_WrappedArray$ofRef: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  scm_WrappedArray: 1,
  sc_CustomParallelizable: 1,
  scm_ArrayLike: 1,
  scm_IndexedSeqOptimized: 1,
  sc_IndexedSeqOptimized: 1,
  scm_IndexedSeq: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeq: 1,
  sc_IndexedSeqLike: 1,
  scm_AbstractSeq: 1,
  scm_Seq: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  scm_Iterable: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  sc_AbstractSeq: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_AbstractIterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.scm_WrappedArray$ofRef.prototype.$classData = ScalaJS.d.scm_WrappedArray$ofRef;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scm_WrappedArray$ofShort = (function() {
  ScalaJS.c.scm_WrappedArray.call(this);
  this.array$6 = null
});
ScalaJS.c.scm_WrappedArray$ofShort.prototype = new ScalaJS.h.scm_WrappedArray();
ScalaJS.c.scm_WrappedArray$ofShort.prototype.constructor = ScalaJS.c.scm_WrappedArray$ofShort;
/** @constructor */
ScalaJS.h.scm_WrappedArray$ofShort = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_WrappedArray$ofShort.prototype = ScalaJS.c.scm_WrappedArray$ofShort.prototype;
ScalaJS.c.scm_WrappedArray$ofShort.prototype.array__AS = (function() {
  return this.array$6
});
ScalaJS.c.scm_WrappedArray$ofShort.prototype.length__I = (function() {
  return this.array__AS().u["length"]
});
ScalaJS.c.scm_WrappedArray$ofShort.prototype.apply__I__S = (function(index) {
  return this.array__AS().u[index]
});
ScalaJS.c.scm_WrappedArray$ofShort.prototype.apply__O__O = (function(v1) {
  return this.apply__I__S(ScalaJS.uI(v1))
});
ScalaJS.c.scm_WrappedArray$ofShort.prototype.apply__I__O = (function(index) {
  return this.apply__I__S(index)
});
ScalaJS.c.scm_WrappedArray$ofShort.prototype.init___AS = (function(array) {
  this.array$6 = array;
  ScalaJS.c.scm_WrappedArray.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.scm_WrappedArray$ofShort = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_WrappedArray$ofShort)))
});
ScalaJS.as.scm_WrappedArray$ofShort = (function(obj) {
  if ((ScalaJS.is.scm_WrappedArray$ofShort(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.mutable.WrappedArray$ofShort")
  }
});
ScalaJS.isArrayOf.scm_WrappedArray$ofShort = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_WrappedArray$ofShort)))
});
ScalaJS.asArrayOf.scm_WrappedArray$ofShort = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scm_WrappedArray$ofShort(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.WrappedArray$ofShort;", depth)
  }
});
ScalaJS.d.scm_WrappedArray$ofShort = new ScalaJS.ClassTypeData({
  scm_WrappedArray$ofShort: 0
}, false, "scala.collection.mutable.WrappedArray$ofShort", ScalaJS.d.scm_WrappedArray, {
  scm_WrappedArray$ofShort: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  scm_WrappedArray: 1,
  sc_CustomParallelizable: 1,
  scm_ArrayLike: 1,
  scm_IndexedSeqOptimized: 1,
  sc_IndexedSeqOptimized: 1,
  scm_IndexedSeq: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeq: 1,
  sc_IndexedSeqLike: 1,
  scm_AbstractSeq: 1,
  scm_Seq: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  scm_Iterable: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  sc_AbstractSeq: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_AbstractIterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.scm_WrappedArray$ofShort.prototype.$classData = ScalaJS.d.scm_WrappedArray$ofShort;
/*<skip>*/;
/** @constructor */
ScalaJS.c.scm_WrappedArray$ofUnit = (function() {
  ScalaJS.c.scm_WrappedArray.call(this);
  this.array$6 = null
});
ScalaJS.c.scm_WrappedArray$ofUnit.prototype = new ScalaJS.h.scm_WrappedArray();
ScalaJS.c.scm_WrappedArray$ofUnit.prototype.constructor = ScalaJS.c.scm_WrappedArray$ofUnit;
/** @constructor */
ScalaJS.h.scm_WrappedArray$ofUnit = (function() {
  /*<skip>*/
});
ScalaJS.h.scm_WrappedArray$ofUnit.prototype = ScalaJS.c.scm_WrappedArray$ofUnit.prototype;
ScalaJS.c.scm_WrappedArray$ofUnit.prototype.array__Asr_BoxedUnit = (function() {
  return this.array$6
});
ScalaJS.c.scm_WrappedArray$ofUnit.prototype.length__I = (function() {
  return this.array__Asr_BoxedUnit().u["length"]
});
ScalaJS.c.scm_WrappedArray$ofUnit.prototype.apply__I__V = (function(index) {
  this.apply$mcVI$sp__I__V(index)
});
ScalaJS.c.scm_WrappedArray$ofUnit.prototype.apply$mcVI$sp__I__V = (function(index) {
  this.array__Asr_BoxedUnit().u[index]
});
ScalaJS.c.scm_WrappedArray$ofUnit.prototype.apply__O__O = (function(v1) {
  this.apply__I__V(ScalaJS.uI(v1))
});
ScalaJS.c.scm_WrappedArray$ofUnit.prototype.apply__I__O = (function(index) {
  this.apply__I__V(index)
});
ScalaJS.c.scm_WrappedArray$ofUnit.prototype.init___Asr_BoxedUnit = (function(array) {
  this.array$6 = array;
  ScalaJS.c.scm_WrappedArray.prototype.init___.call(this);
  return this
});
/*<skip>*/;
ScalaJS.is.scm_WrappedArray$ofUnit = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.scm_WrappedArray$ofUnit)))
});
ScalaJS.as.scm_WrappedArray$ofUnit = (function(obj) {
  if ((ScalaJS.is.scm_WrappedArray$ofUnit(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "scala.collection.mutable.WrappedArray$ofUnit")
  }
});
ScalaJS.isArrayOf.scm_WrappedArray$ofUnit = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.scm_WrappedArray$ofUnit)))
});
ScalaJS.asArrayOf.scm_WrappedArray$ofUnit = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.scm_WrappedArray$ofUnit(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lscala.collection.mutable.WrappedArray$ofUnit;", depth)
  }
});
ScalaJS.d.scm_WrappedArray$ofUnit = new ScalaJS.ClassTypeData({
  scm_WrappedArray$ofUnit: 0
}, false, "scala.collection.mutable.WrappedArray$ofUnit", ScalaJS.d.scm_WrappedArray, {
  scm_WrappedArray$ofUnit: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  scm_WrappedArray: 1,
  sc_CustomParallelizable: 1,
  scm_ArrayLike: 1,
  scm_IndexedSeqOptimized: 1,
  sc_IndexedSeqOptimized: 1,
  scm_IndexedSeq: 1,
  scm_IndexedSeqLike: 1,
  sc_IndexedSeq: 1,
  sc_IndexedSeqLike: 1,
  scm_AbstractSeq: 1,
  scm_Seq: 1,
  scm_SeqLike: 1,
  scm_Cloneable: 1,
  s_Cloneable: 1,
  jl_Cloneable: 1,
  scm_Iterable: 1,
  scm_Traversable: 1,
  s_Mutable: 1,
  sc_AbstractSeq: 1,
  sc_Seq: 1,
  sc_SeqLike: 1,
  sc_GenSeq: 1,
  sc_GenSeqLike: 1,
  s_PartialFunction: 1,
  F1: 1,
  sc_AbstractIterable: 1,
  sc_Iterable: 1,
  sc_IterableLike: 1,
  s_Equals: 1,
  sc_GenIterable: 1,
  sc_GenIterableLike: 1,
  sc_AbstractTraversable: 1,
  sc_Traversable: 1,
  sc_GenTraversable: 1,
  scg_GenericTraversableTemplate: 1,
  sc_TraversableLike: 1,
  sc_GenTraversableLike: 1,
  sc_Parallelizable: 1,
  sc_TraversableOnce: 1,
  sc_GenTraversableOnce: 1,
  scg_FilterMonadic: 1,
  scg_HasNewBuilder: 1,
  O: 1
});
ScalaJS.c.scm_WrappedArray$ofUnit.prototype.$classData = ScalaJS.d.scm_WrappedArray$ofUnit;
/*<skip>*/;
//# sourceMappingURL=sodexowatcher-fastopt.js.map
