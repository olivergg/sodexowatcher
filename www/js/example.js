/** @constructor */
ScalaJS.c.example_JsObjectBuilder$ = (function() {
  ScalaJS.c.java_lang_Object.call(this)
});
ScalaJS.c.example_JsObjectBuilder$.prototype = new ScalaJS.inheritable.java_lang_Object();
ScalaJS.c.example_JsObjectBuilder$.prototype.constructor = ScalaJS.c.example_JsObjectBuilder$;
ScalaJS.c.example_JsObjectBuilder$.prototype.applyDynamicNamed__T__Lscala_collection_Seq__O = (function(name, args) {
  if ((!ScalaJS.anyRefEqEq(name, "apply"))) {
    ScalaJS.modules.scala_sys_package().error__T__Lscala_Nothing("Call jsObj like this jsObj(x=1, y=2) which returns a javascript object that is {x:1,y:2}")
  } else {
    /*<skip>*/
  };
  var x = ScalaJS.g["Object"];
  var jsx$1 = x;
  var obj = jsx$1();
  var jsx$2 = args;
  var jsx$3 = new ScalaJS.c.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1().init___Lscala_scalajs_js_Dictionary(obj);
  jsx$2.foreach__Lscala_Function1__V(jsx$3);
  return obj
});
ScalaJS.c.example_JsObjectBuilder$.prototype.applyDynamic__Lscala_scalajs_js_String__Lscala_collection_Seq__O = (function(name, args) {
  if (args.nonEmpty__Z()) {
    ScalaJS.modules.scala_sys_package().error__T__Lscala_Nothing("Call jsObj only with named parameters.")
  } else {
    /*<skip>*/
  };
  var x = ScalaJS.g["Object"];
  var jsx$4 = x;
  return jsx$4()
});
ScalaJS.c.example_JsObjectBuilder$.prototype.applyDynamicNamed = (function(arg$1, arg$2) {
  return this.applyDynamicNamed__T__Lscala_collection_Seq__O(arg$1, arg$2)
});
ScalaJS.c.example_JsObjectBuilder$.prototype.applyDynamic = (function(arg$1, arg$2) {
  return this.applyDynamic__Lscala_scalajs_js_String__Lscala_collection_Seq__O(arg$1, arg$2)
});
/** @constructor */
ScalaJS.inheritable.example_JsObjectBuilder$ = (function() {
  /*<skip>*/
});
ScalaJS.inheritable.example_JsObjectBuilder$.prototype = ScalaJS.c.example_JsObjectBuilder$.prototype;
/** @constructor */
ScalaJS.classes.example_JsObjectBuilder$ = (function() {
  ScalaJS.c.example_JsObjectBuilder$.call(this);
  return this.init___()
});
ScalaJS.classes.example_JsObjectBuilder$.prototype = ScalaJS.c.example_JsObjectBuilder$.prototype;
ScalaJS.is.example_JsObjectBuilder$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.example_JsObjectBuilder$)))
});
ScalaJS.as.example_JsObjectBuilder$ = (function(obj) {
  if ((ScalaJS.is.example_JsObjectBuilder$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "example.JsObjectBuilder")
  }
});
ScalaJS.isArrayOf.example_JsObjectBuilder$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.example_JsObjectBuilder$)))
});
ScalaJS.asArrayOf.example_JsObjectBuilder$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.example_JsObjectBuilder$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lexample.JsObjectBuilder;", depth)
  }
});
ScalaJS.data.example_JsObjectBuilder$ = new ScalaJS.ClassTypeData({
  example_JsObjectBuilder$: 0
}, false, "example.JsObjectBuilder", ScalaJS.data.java_lang_Object, {
  example_JsObjectBuilder$: true,
  scala_Dynamic: true,
  java_lang_Object: true
});
ScalaJS.c.example_JsObjectBuilder$.prototype.$classData = ScalaJS.data.example_JsObjectBuilder$;
ScalaJS.moduleInstances.example_JsObjectBuilder = undefined;
ScalaJS.modules.example_JsObjectBuilder = (function() {
  if ((!ScalaJS.moduleInstances.example_JsObjectBuilder)) {
    ScalaJS.moduleInstances.example_JsObjectBuilder = new ScalaJS.c.example_JsObjectBuilder$().init___()
  } else {
    /*<skip>*/
  };
  return ScalaJS.moduleInstances.example_JsObjectBuilder
});

/** @constructor */
ScalaJS.c.example_SodexoResult = (function() {
  ScalaJS.c.java_lang_Object.call(this);
  this.percentage$1 = 0;
  this.places$1 = 0;
  this.percent$1 = 0;
  this.placesDispo$1 = 0
});
ScalaJS.c.example_SodexoResult.prototype = new ScalaJS.inheritable.java_lang_Object();
ScalaJS.c.example_SodexoResult.prototype.constructor = ScalaJS.c.example_SodexoResult;
ScalaJS.c.example_SodexoResult.prototype.percentage__I = (function() {
  return this.percentage$1
});
ScalaJS.c.example_SodexoResult.prototype.places__I = (function() {
  return this.places$1
});
ScalaJS.c.example_SodexoResult.prototype.percent__I = (function() {
  return this.percent$1
});
ScalaJS.c.example_SodexoResult.prototype.placesDispo__I = (function() {
  return this.placesDispo$1
});
ScalaJS.c.example_SodexoResult.prototype.init___I__I = (function(percentage, places) {
  this.percentage$1 = percentage;
  this.places$1 = places;
  ScalaJS.c.java_lang_Object.prototype.init___.call(this);
  var x1 = percentage;
  switch (x1) {
    default:
      if ((x1 <= 0)) {
        var jsx$1 = 0
      } else {
        if ((x1 >= 100)) {
          var jsx$1 = 100
        } else {
          var jsx$1 = percentage
        }
      };
  };
  this.percent$1 = jsx$1;
  var x1$2 = places;
  switch (x1$2) {
    default:
      if ((x1$2 <= 0)) {
        var jsx$2 = 0
      } else {
        var jsx$2 = places
      };
  };
  this.placesDispo$1 = jsx$2;
  return this
});
ScalaJS.c.example_SodexoResult.prototype.percentage = (function() {
  return this.percentage__I()
});
ScalaJS.c.example_SodexoResult.prototype.places = (function() {
  return this.places__I()
});
ScalaJS.c.example_SodexoResult.prototype.percent = (function() {
  return this.percent__I()
});
ScalaJS.c.example_SodexoResult.prototype.placesDispo = (function() {
  return this.placesDispo__I()
});
/** @constructor */
ScalaJS.inheritable.example_SodexoResult = (function() {
  /*<skip>*/
});
ScalaJS.inheritable.example_SodexoResult.prototype = ScalaJS.c.example_SodexoResult.prototype;
/** @constructor */
ScalaJS.classes.example_SodexoResult = (function(arg$1, arg$2) {
  ScalaJS.c.example_SodexoResult.call(this);
  return this.init___I__I(arg$1, arg$2)
});
ScalaJS.classes.example_SodexoResult.prototype = ScalaJS.c.example_SodexoResult.prototype;
ScalaJS.is.example_SodexoResult = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.example_SodexoResult)))
});
ScalaJS.as.example_SodexoResult = (function(obj) {
  if ((ScalaJS.is.example_SodexoResult(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "example.SodexoResult")
  }
});
ScalaJS.isArrayOf.example_SodexoResult = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.example_SodexoResult)))
});
ScalaJS.asArrayOf.example_SodexoResult = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.example_SodexoResult(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lexample.SodexoResult;", depth)
  }
});
ScalaJS.data.example_SodexoResult = new ScalaJS.ClassTypeData({
  example_SodexoResult: 0
}, false, "example.SodexoResult", ScalaJS.data.java_lang_Object, {
  example_SodexoResult: true,
  java_lang_Object: true
});
ScalaJS.c.example_SodexoResult.prototype.$classData = ScalaJS.data.example_SodexoResult;

/** @constructor */
ScalaJS.c.example_SodexoWatcher$ = (function() {
  ScalaJS.c.java_lang_Object.call(this);
  this.COLOR0$1 = null;
  this.COLOR50$1 = null;
  this.COLOR51$1 = null;
  this.COLOR100$1 = null;
  this.currentUrl$1 = null
});
ScalaJS.c.example_SodexoWatcher$.prototype = new ScalaJS.inheritable.java_lang_Object();
ScalaJS.c.example_SodexoWatcher$.prototype.constructor = ScalaJS.c.example_SodexoWatcher$;
ScalaJS.c.example_SodexoWatcher$.prototype.COLOR0__Lscala_scalajs_js_Dynamic = (function() {
  return this.COLOR0$1
});
ScalaJS.c.example_SodexoWatcher$.prototype.COLOR50__Lscala_scalajs_js_Dynamic = (function() {
  return this.COLOR50$1
});
ScalaJS.c.example_SodexoWatcher$.prototype.COLOR51__Lscala_scalajs_js_Dynamic = (function() {
  return this.COLOR51$1
});
ScalaJS.c.example_SodexoWatcher$.prototype.COLOR100__Lscala_scalajs_js_Dynamic = (function() {
  return this.COLOR100$1
});
ScalaJS.c.example_SodexoWatcher$.prototype.mobile__Lscala_scalajs_js_Dynamic = (function() {
  return ScalaJS.g["jQuery"]["mobile"]
});
ScalaJS.c.example_SodexoWatcher$.prototype.Color__Lscala_scalajs_js_Dynamic = (function() {
  return ScalaJS.g["net"]["brehaut"]["Color"]
});
ScalaJS.c.example_SodexoWatcher$.prototype.currentUrl__T = (function() {
  return this.currentUrl$1
});
ScalaJS.c.example_SodexoWatcher$.prototype.currentUrl_$eq__T__V = (function(x$1) {
  this.currentUrl$1 = x$1
});
ScalaJS.c.example_SodexoWatcher$.prototype.actualize__Lscala_scalajs_js_Dynamic = (function() {
  if ((!ScalaJS.stringStartsWith(this.currentUrl__T(), "http"))) {
    this.changeProgressBar__Lexample_SodexoResult__V(this.buildMockSodexoResult__Lexample_SodexoResult());
    return this.mobile__Lscala_scalajs_js_Dynamic()["loading"]("hide")
  } else {
    var jsx$1 = ScalaJS.g["jQuery"];
    var jsx$3 = ScalaJS.modules.example_JsObjectBuilder();
    var jsx$5 = ScalaJS.modules.scala_Predef();
    var jsx$8 = ScalaJS.data.scala_Tuple2.getArrayOf();
    var jsx$10 = new ScalaJS.c.scala_Tuple2().init___O__O("url", this.currentUrl__T());
    var jsx$13 = new ScalaJS.c.scala_Tuple2();
    var jsx$15 = new ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$1().init___();
    var jsx$14 = (function($this) {
      return (function(arg1, arg2, arg3) {
        return $this.apply__O__O__O__O(arg1, arg2, arg3)
      })
    })(jsx$15);
    var jsx$11 = jsx$13.init___O__O("success", jsx$14);
    var jsx$16 = new ScalaJS.c.scala_Tuple2();
    var jsx$18 = new ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$2().init___();
    var jsx$17 = (function($this) {
      return (function(arg1, arg2, arg3) {
        return $this.apply__O__O__O__O(arg1, arg2, arg3)
      })
    })(jsx$18);
    var jsx$12 = jsx$16.init___O__O("error", jsx$17);
    var jsx$9 = [jsx$10, jsx$11, jsx$12];
    var jsx$7 = ScalaJS.makeNativeArrayWrapper(jsx$8, jsx$9);
    var jsx$6 = ScalaJS.asArrayOf.java_lang_Object(jsx$7, 1);
    var jsx$4 = jsx$5.wrapRefArray__AO__Lscala_collection_mutable_WrappedArray(jsx$6);
    var jsx$2 = jsx$3.applyDynamicNamed__T__Lscala_collection_Seq__O("apply", jsx$4);
    return jsx$1["ajax"](jsx$2)
  }
});
ScalaJS.c.example_SodexoWatcher$.prototype.buildMockSodexoResult__Lexample_SodexoResult = (function() {
  var mockPercent = ScalaJS.modules.scala_util_Random().nextInt__I__I(100);
  var placesDispo = (120 - (((mockPercent / 100.0) * 120) | 0));
  return new ScalaJS.c.example_SodexoResult().init___I__I(mockPercent, placesDispo)
});
ScalaJS.c.example_SodexoWatcher$.prototype.changeProgressBar__Lexample_SodexoResult__V = (function(res) {
  var x = ScalaJS.g["jQuery"];
  var jsx$21 = x;
  var jsx$19 = jsx$21("#percentBar");
  var jsx$20 = this.getBackgroundGradientAdjusted__I__T(res.percent__I());
  jsx$19["attr"]("style", jsx$20);
  var x$2 = ScalaJS.g["jQuery"];
  var jsx$24 = x$2;
  var jsx$22 = jsx$24("#percentage");
  var x1 = res.placesDispo__I();
  switch (x1) {
    default:
      if ((x1 > 1)) {
        var jsx$23 = new ScalaJS.c.scala_StringContext().init___Lscala_collection_Seq(ScalaJS.modules.scala_Predef().wrapRefArray__AO__Lscala_collection_mutable_WrappedArray(ScalaJS.asArrayOf.java_lang_Object(ScalaJS.makeNativeArrayWrapper(ScalaJS.data.java_lang_String.getArrayOf(), ["", " places disponibles (", " %)"]), 1))).s__Lscala_collection_Seq__T(ScalaJS.modules.scala_Predef().genericWrapArray__O__Lscala_collection_mutable_WrappedArray(ScalaJS.makeNativeArrayWrapper(ScalaJS.data.java_lang_Object.getArrayOf(), [ScalaJS.bI(x1), ScalaJS.bI(res.percent__I())])))
      } else {
        if ((x1 === 1)) {
          var jsx$23 = new ScalaJS.c.scala_StringContext().init___Lscala_collection_Seq(ScalaJS.modules.scala_Predef().wrapRefArray__AO__Lscala_collection_mutable_WrappedArray(ScalaJS.asArrayOf.java_lang_Object(ScalaJS.makeNativeArrayWrapper(ScalaJS.data.java_lang_String.getArrayOf(), ["1 place disponible (", " %)"]), 1))).s__Lscala_collection_Seq__T(ScalaJS.modules.scala_Predef().genericWrapArray__O__Lscala_collection_mutable_WrappedArray(ScalaJS.makeNativeArrayWrapper(ScalaJS.data.java_lang_Object.getArrayOf(), [ScalaJS.bI(res.percent__I())])))
        } else {
          var jsx$23 = new ScalaJS.c.scala_StringContext().init___Lscala_collection_Seq(ScalaJS.modules.scala_Predef().wrapRefArray__AO__Lscala_collection_mutable_WrappedArray(ScalaJS.asArrayOf.java_lang_Object(ScalaJS.makeNativeArrayWrapper(ScalaJS.data.java_lang_String.getArrayOf(), ["Aucune place disponible (", " %)"]), 1))).s__Lscala_collection_Seq__T(ScalaJS.modules.scala_Predef().genericWrapArray__O__Lscala_collection_mutable_WrappedArray(ScalaJS.makeNativeArrayWrapper(ScalaJS.data.java_lang_Object.getArrayOf(), [ScalaJS.bI(res.percent__I())])))
        }
      };
  };
  jsx$22["text"](jsx$23)
});
ScalaJS.c.example_SodexoWatcher$.prototype.showPopupMessage__T__Lscala_scalajs_js_Dynamic = (function(message) {
  var x = ScalaJS.g["jQuery"];
  var jsx$27 = x;
  var jsx$25 = jsx$27("#popupMessage");
  var jsx$26 = message;
  jsx$25["text"](jsx$26);
  return ScalaJS.g["jQuery"]("#popupBasic")["popup"]("open", ScalaJS.modules.example_JsObjectBuilder().applyDynamicNamed__T__Lscala_collection_Seq__O("apply", ScalaJS.modules.scala_Predef().wrapRefArray__AO__Lscala_collection_mutable_WrappedArray(ScalaJS.asArrayOf.java_lang_Object(ScalaJS.makeNativeArrayWrapper(ScalaJS.data.scala_Tuple2.getArrayOf(), [new ScalaJS.c.scala_Tuple2().init___O__O("transition", "flip")]), 1))))
});
ScalaJS.c.example_SodexoWatcher$.prototype.showLoading__Lscala_scalajs_js_Dynamic = (function() {
  return this.mobile__Lscala_scalajs_js_Dynamic()["loading"]("show", ScalaJS.modules.example_JsObjectBuilder().applyDynamicNamed__T__Lscala_collection_Seq__O("apply", ScalaJS.modules.scala_Predef().wrapRefArray__AO__Lscala_collection_mutable_WrappedArray(ScalaJS.asArrayOf.java_lang_Object(ScalaJS.makeNativeArrayWrapper(ScalaJS.data.scala_Tuple2.getArrayOf(), [new ScalaJS.c.scala_Tuple2().init___O__O("text", "loading"), new ScalaJS.c.scala_Tuple2().init___O__O("textVisible", true), new ScalaJS.c.scala_Tuple2().init___O__O("theme", "a"), new ScalaJS.c.scala_Tuple2().init___O__O("textonly", false), new ScalaJS.c.scala_Tuple2().init___O__O("html", "<h1>Chargement...</h1>")]), 1))))
});
ScalaJS.c.example_SodexoWatcher$.prototype.actualMain__V = (function() {
  ScalaJS.g["console"]["log"]("START");
  var x = ScalaJS.g["jQuery"];
  var jsx$30 = x;
  var jsx$28 = jsx$30("#actualize, #percentBarContainer");
  var jsx$31 = new ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$1().init___();
  var jsx$29 = (function($this) {
    return (function(arg1) {
      return $this.apply__O__O(arg1)
    })
  })(jsx$31);
  jsx$28["bind"]("tap", jsx$29);
  var x$2 = ScalaJS.g["jQuery"];
  var jsx$34 = x$2;
  var jsx$32 = jsx$34("select#select-custom-1");
  var jsx$35 = new ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$2().init___();
  var jsx$33 = (function($this) {
    return (function(arg1) {
      return $this.apply__O__O(arg1)
    })
  })(jsx$35);
  jsx$32["change"](jsx$33);
  this.showLoading__Lscala_scalajs_js_Dynamic();
  this.actualize__Lscala_scalajs_js_Dynamic();
  ScalaJS.g["console"]["log"]("END")
});
ScalaJS.c.example_SodexoWatcher$.prototype.main__V = (function() {
  var jsx$36 = ScalaJS.g["document"];
  var jsx$38 = new ScalaJS.c.example_SodexoWatcher$$anonfun$main$1().init___();
  var jsx$37 = (function($this) {
    return (function(arg1) {
      return $this.apply__O__O(arg1)
    })
  })(jsx$38);
  jsx$36["addEventListener"]("deviceready", jsx$37, false)
});
ScalaJS.c.example_SodexoWatcher$.prototype.adjustToRed__Lscala_scalajs_js_Dynamic__I__Lscala_scalajs_js_Dynamic = (function(color, percent) {
  var targetHue = ((1 - ScalaJS.modules.java_lang_Math().pow__D__D__D((percent / 100.0), 3.0)) * color["getHue"]());
  return color["setHue"](targetHue)
});
ScalaJS.c.example_SodexoWatcher$.prototype.getBackgroundGradientAdjusted__I__T = (function(percent) {
  var color0AdjustedStr = this.adjustToRed__Lscala_scalajs_js_Dynamic__I__Lscala_scalajs_js_Dynamic(this.COLOR0__Lscala_scalajs_js_Dynamic(), percent).toString();
  var color50AdjustedStr = this.adjustToRed__Lscala_scalajs_js_Dynamic__I__Lscala_scalajs_js_Dynamic(this.COLOR50__Lscala_scalajs_js_Dynamic(), percent).toString();
  var color51AdjustedStr = this.adjustToRed__Lscala_scalajs_js_Dynamic__I__Lscala_scalajs_js_Dynamic(this.COLOR51__Lscala_scalajs_js_Dynamic(), percent).toString();
  var color100AdjustedStr = this.adjustToRed__Lscala_scalajs_js_Dynamic__I__Lscala_scalajs_js_Dynamic(this.COLOR100__Lscala_scalajs_js_Dynamic(), percent).toString();
  return new ScalaJS.c.scala_StringContext().init___Lscala_collection_Seq(ScalaJS.modules.scala_Predef().wrapRefArray__AO__Lscala_collection_mutable_WrappedArray(ScalaJS.asArrayOf.java_lang_Object(ScalaJS.makeNativeArrayWrapper(ScalaJS.data.java_lang_String.getArrayOf(), ["\n    width : ", "% ;\n    background : -webkit-linear-gradient(top, ", " 0%, ", " 50%, ", " 51%, ", " 100%); \n    background : linear-gradient(to bottom, ", " 0%, ", " 50%, ", " 51%, ", " 100%);"]), 1))).s__Lscala_collection_Seq__T(ScalaJS.modules.scala_Predef().genericWrapArray__O__Lscala_collection_mutable_WrappedArray(ScalaJS.makeNativeArrayWrapper(ScalaJS.data.java_lang_Object.getArrayOf(), [ScalaJS.bI(percent), color0AdjustedStr, color50AdjustedStr, color51AdjustedStr, color100AdjustedStr, color0AdjustedStr, color50AdjustedStr, color51AdjustedStr, color100AdjustedStr])))
});
ScalaJS.c.example_SodexoWatcher$.prototype.init___ = (function() {
  ScalaJS.c.java_lang_Object.prototype.init___.call(this);
  ScalaJS.moduleInstances.example_SodexoWatcher = this;
  this.COLOR0$1 = this.Color__Lscala_scalajs_js_Dynamic()("#bfd255")["saturateByRatio"](0.1);
  this.COLOR50$1 = this.Color__Lscala_scalajs_js_Dynamic()("#8eb92a")["lightenByRatio"](0.3);
  this.COLOR51$1 = this.Color__Lscala_scalajs_js_Dynamic()("#72aa00")["saturateByRatio"](0.1);
  this.COLOR100$1 = this.Color__Lscala_scalajs_js_Dynamic()("#9ecb2d")["saturateByRatio"](0.1);
  this.currentUrl$1 = "https://sodexo-riemarcopolo.moneweb.fr/";
  return this
});
ScalaJS.c.example_SodexoWatcher$.prototype.COLOR0 = (function() {
  return this.COLOR0__Lscala_scalajs_js_Dynamic()
});
ScalaJS.c.example_SodexoWatcher$.prototype.COLOR50 = (function() {
  return this.COLOR50__Lscala_scalajs_js_Dynamic()
});
ScalaJS.c.example_SodexoWatcher$.prototype.COLOR51 = (function() {
  return this.COLOR51__Lscala_scalajs_js_Dynamic()
});
ScalaJS.c.example_SodexoWatcher$.prototype.COLOR100 = (function() {
  return this.COLOR100__Lscala_scalajs_js_Dynamic()
});
ScalaJS.c.example_SodexoWatcher$.prototype.mobile = (function() {
  return this.mobile__Lscala_scalajs_js_Dynamic()
});
ScalaJS.c.example_SodexoWatcher$.prototype.Color = (function() {
  return this.Color__Lscala_scalajs_js_Dynamic()
});
ScalaJS.c.example_SodexoWatcher$.prototype.currentUrl = (function() {
  return this.currentUrl__T()
});
ScalaJS.c.example_SodexoWatcher$.prototype.currentUrl_$eq = (function(arg$1) {
  return this.currentUrl_$eq__T__V(arg$1)
});
ScalaJS.c.example_SodexoWatcher$.prototype.actualize = (function() {
  return this.actualize__Lscala_scalajs_js_Dynamic()
});
ScalaJS.c.example_SodexoWatcher$.prototype.buildMockSodexoResult = (function() {
  return this.buildMockSodexoResult__Lexample_SodexoResult()
});
ScalaJS.c.example_SodexoWatcher$.prototype.changeProgressBar = (function(arg$1) {
  return this.changeProgressBar__Lexample_SodexoResult__V(arg$1)
});
ScalaJS.c.example_SodexoWatcher$.prototype.showPopupMessage = (function(arg$1) {
  return this.showPopupMessage__T__Lscala_scalajs_js_Dynamic(arg$1)
});
ScalaJS.c.example_SodexoWatcher$.prototype.showLoading = (function() {
  return this.showLoading__Lscala_scalajs_js_Dynamic()
});
ScalaJS.c.example_SodexoWatcher$.prototype.actualMain = (function() {
  return this.actualMain__V()
});
ScalaJS.c.example_SodexoWatcher$.prototype.main = (function() {
  return this.main__V()
});
ScalaJS.c.example_SodexoWatcher$.prototype.adjustToRed = (function(arg$1, arg$2) {
  return this.adjustToRed__Lscala_scalajs_js_Dynamic__I__Lscala_scalajs_js_Dynamic(arg$1, arg$2)
});
ScalaJS.c.example_SodexoWatcher$.prototype.getBackgroundGradientAdjusted = (function(arg$1) {
  return this.getBackgroundGradientAdjusted__I__T(arg$1)
});
/** @constructor */
ScalaJS.inheritable.example_SodexoWatcher$ = (function() {
  /*<skip>*/
});
ScalaJS.inheritable.example_SodexoWatcher$.prototype = ScalaJS.c.example_SodexoWatcher$.prototype;
/** @constructor */
ScalaJS.classes.example_SodexoWatcher$ = (function() {
  ScalaJS.c.example_SodexoWatcher$.call(this);
  return this.init___()
});
ScalaJS.classes.example_SodexoWatcher$.prototype = ScalaJS.c.example_SodexoWatcher$.prototype;
ScalaJS.is.example_SodexoWatcher$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.example_SodexoWatcher$)))
});
ScalaJS.as.example_SodexoWatcher$ = (function(obj) {
  if ((ScalaJS.is.example_SodexoWatcher$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "example.SodexoWatcher")
  }
});
ScalaJS.isArrayOf.example_SodexoWatcher$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.example_SodexoWatcher$)))
});
ScalaJS.asArrayOf.example_SodexoWatcher$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.example_SodexoWatcher$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lexample.SodexoWatcher;", depth)
  }
});
ScalaJS.data.example_SodexoWatcher$ = new ScalaJS.ClassTypeData({
  example_SodexoWatcher$: 0
}, false, "example.SodexoWatcher", ScalaJS.data.java_lang_Object, {
  example_SodexoWatcher$: true,
  java_lang_Object: true
});
ScalaJS.c.example_SodexoWatcher$.prototype.$classData = ScalaJS.data.example_SodexoWatcher$;
ScalaJS.moduleInstances.example_SodexoWatcher = undefined;
ScalaJS.modules.example_SodexoWatcher = (function() {
  if ((!ScalaJS.moduleInstances.example_SodexoWatcher)) {
    ScalaJS.moduleInstances.example_SodexoWatcher = new ScalaJS.c.example_SodexoWatcher$().init___()
  } else {
    /*<skip>*/
  };
  return ScalaJS.moduleInstances.example_SodexoWatcher
});

/** @constructor */
ScalaJS.c.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1 = (function() {
  ScalaJS.c.scala_runtime_AbstractFunction1.call(this);
  this.obj$1$2 = null
});
ScalaJS.c.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1.prototype = new ScalaJS.inheritable.scala_runtime_AbstractFunction1();
ScalaJS.c.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1.prototype.constructor = ScalaJS.c.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1;
ScalaJS.c.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1.prototype.apply__Lscala_Tuple2__V = (function(x0$1) {
  var x1 = x0$1;
  matchEnd3: {
    if ((x1 !== null)) {
      var key = ScalaJS.as.java_lang_String(x1._1__O());
      var value = x1._2__O();
      this.obj$1$2[key] = value;
      result$matchEnd3 = ScalaJS.modules.scala_runtime_BoxedUnit().UNIT__Lscala_runtime_BoxedUnit();
      break matchEnd3
    } else {
      /*<skip>*/
    };
    throw new ScalaJS.c.scala_MatchError().init___O(x1);
    break matchEnd3
  }
});
ScalaJS.c.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1.prototype.apply__O__O = (function(v1) {
  this.apply__Lscala_Tuple2__V(ScalaJS.as.scala_Tuple2(v1));
  return ScalaJS.modules.scala_runtime_BoxedUnit().UNIT__Lscala_runtime_BoxedUnit()
});
ScalaJS.c.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1.prototype.init___Lscala_scalajs_js_Dictionary = (function(obj$1) {
  this.obj$1$2 = obj$1;
  ScalaJS.c.scala_runtime_AbstractFunction1.prototype.init___.call(this);
  return this
});
ScalaJS.c.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1.prototype.apply = (function(arg$1) {
  if (ScalaJS.is.scala_Tuple2(arg$1)) {
    return this.apply__Lscala_Tuple2__V(arg$1)
  } else {
    if (ScalaJS.is.java_lang_Object(arg$1)) {
      return this.apply__O__O(arg$1)
    } else {
      throw "No matching overload"
    }
  }
});
/** @constructor */
ScalaJS.inheritable.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1 = (function() {
  /*<skip>*/
});
ScalaJS.inheritable.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1.prototype = ScalaJS.c.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1.prototype;
/** @constructor */
ScalaJS.classes.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1 = (function(arg$1) {
  ScalaJS.c.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1.call(this);
  return this.init___Lscala_scalajs_js_Dictionary(arg$1)
});
ScalaJS.classes.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1.prototype = ScalaJS.c.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1.prototype;
ScalaJS.is.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1)))
});
ScalaJS.as.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1 = (function(obj) {
  if ((ScalaJS.is.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "example.JsObjectBuilder$$anonfun$applyDynamicNamed$1")
  }
});
ScalaJS.isArrayOf.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1)))
});
ScalaJS.asArrayOf.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lexample.JsObjectBuilder$$anonfun$applyDynamicNamed$1;", depth)
  }
});
ScalaJS.data.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1 = new ScalaJS.ClassTypeData({
  example_JsObjectBuilder$$anonfun$applyDynamicNamed$1: 0
}, false, "example.JsObjectBuilder$$anonfun$applyDynamicNamed$1", ScalaJS.data.scala_runtime_AbstractFunction1, {
  example_JsObjectBuilder$$anonfun$applyDynamicNamed$1: true,
  scala_Serializable: true,
  java_io_Serializable: true,
  scala_runtime_AbstractFunction1: true,
  scala_Function1: true,
  java_lang_Object: true
});
ScalaJS.c.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1.prototype.$classData = ScalaJS.data.example_JsObjectBuilder$$anonfun$applyDynamicNamed$1;

/** @constructor */
ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$1 = (function() {
  ScalaJS.c.scala_runtime_AbstractFunction1.call(this)
});
ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$1.prototype = new ScalaJS.inheritable.scala_runtime_AbstractFunction1();
ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$1.prototype.constructor = ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$1;
ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$1.prototype.apply__Lorg_scalajs_jquery_JQueryEventObject__Lscala_scalajs_js_Dynamic = (function(e) {
  ScalaJS.modules.example_SodexoWatcher().showLoading__Lscala_scalajs_js_Dynamic();
  return ScalaJS.modules.example_SodexoWatcher().actualize__Lscala_scalajs_js_Dynamic()
});
ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$1.prototype.apply__O__O = (function(v1) {
  return this.apply__Lorg_scalajs_jquery_JQueryEventObject__Lscala_scalajs_js_Dynamic(v1)
});
ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$1.prototype.apply = (function(arg$1) {
  if (ScalaJS.is.java_lang_Object(arg$1)) {
    return this.apply__O__O(arg$1)
  } else {
    return this.apply__Lorg_scalajs_jquery_JQueryEventObject__Lscala_scalajs_js_Dynamic(arg$1)
  }
});
/** @constructor */
ScalaJS.inheritable.example_SodexoWatcher$$anonfun$actualMain$1 = (function() {
  /*<skip>*/
});
ScalaJS.inheritable.example_SodexoWatcher$$anonfun$actualMain$1.prototype = ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$1.prototype;
/** @constructor */
ScalaJS.classes.example_SodexoWatcher$$anonfun$actualMain$1 = (function() {
  ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$1.call(this);
  return this.init___()
});
ScalaJS.classes.example_SodexoWatcher$$anonfun$actualMain$1.prototype = ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$1.prototype;
ScalaJS.is.example_SodexoWatcher$$anonfun$actualMain$1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.example_SodexoWatcher$$anonfun$actualMain$1)))
});
ScalaJS.as.example_SodexoWatcher$$anonfun$actualMain$1 = (function(obj) {
  if ((ScalaJS.is.example_SodexoWatcher$$anonfun$actualMain$1(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "example.SodexoWatcher$$anonfun$actualMain$1")
  }
});
ScalaJS.isArrayOf.example_SodexoWatcher$$anonfun$actualMain$1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.example_SodexoWatcher$$anonfun$actualMain$1)))
});
ScalaJS.asArrayOf.example_SodexoWatcher$$anonfun$actualMain$1 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.example_SodexoWatcher$$anonfun$actualMain$1(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lexample.SodexoWatcher$$anonfun$actualMain$1;", depth)
  }
});
ScalaJS.data.example_SodexoWatcher$$anonfun$actualMain$1 = new ScalaJS.ClassTypeData({
  example_SodexoWatcher$$anonfun$actualMain$1: 0
}, false, "example.SodexoWatcher$$anonfun$actualMain$1", ScalaJS.data.scala_runtime_AbstractFunction1, {
  example_SodexoWatcher$$anonfun$actualMain$1: true,
  scala_Serializable: true,
  java_io_Serializable: true,
  scala_runtime_AbstractFunction1: true,
  scala_Function1: true,
  java_lang_Object: true
});
ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$1.prototype.$classData = ScalaJS.data.example_SodexoWatcher$$anonfun$actualMain$1;

/** @constructor */
ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$2 = (function() {
  ScalaJS.c.scala_runtime_AbstractFunction1.call(this)
});
ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$2.prototype = new ScalaJS.inheritable.scala_runtime_AbstractFunction1();
ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$2.prototype.constructor = ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$2;
ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$2.prototype.apply__Lorg_scalajs_jquery_JQueryEventObject__Lscala_scalajs_js_Dynamic = (function(e) {
  var x = ScalaJS.g["jQuery"];
  var jsx$3 = x;
  var jsx$4 = e["delegateTarget"];
  var jsx$2 = jsx$3(jsx$4);
  var jsx$1 = jsx$2["find"](":selected");
  var selectedVal = jsx$1["val"]();
  ScalaJS.modules.example_SodexoWatcher().currentUrl_$eq__T__V((selectedVal + ""));
  ScalaJS.modules.example_SodexoWatcher().showLoading__Lscala_scalajs_js_Dynamic();
  return ScalaJS.modules.example_SodexoWatcher().actualize__Lscala_scalajs_js_Dynamic()
});
ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$2.prototype.apply__O__O = (function(v1) {
  return this.apply__Lorg_scalajs_jquery_JQueryEventObject__Lscala_scalajs_js_Dynamic(v1)
});
ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$2.prototype.apply = (function(arg$1) {
  if (ScalaJS.is.java_lang_Object(arg$1)) {
    return this.apply__O__O(arg$1)
  } else {
    return this.apply__Lorg_scalajs_jquery_JQueryEventObject__Lscala_scalajs_js_Dynamic(arg$1)
  }
});
/** @constructor */
ScalaJS.inheritable.example_SodexoWatcher$$anonfun$actualMain$2 = (function() {
  /*<skip>*/
});
ScalaJS.inheritable.example_SodexoWatcher$$anonfun$actualMain$2.prototype = ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$2.prototype;
/** @constructor */
ScalaJS.classes.example_SodexoWatcher$$anonfun$actualMain$2 = (function() {
  ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$2.call(this);
  return this.init___()
});
ScalaJS.classes.example_SodexoWatcher$$anonfun$actualMain$2.prototype = ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$2.prototype;
ScalaJS.is.example_SodexoWatcher$$anonfun$actualMain$2 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.example_SodexoWatcher$$anonfun$actualMain$2)))
});
ScalaJS.as.example_SodexoWatcher$$anonfun$actualMain$2 = (function(obj) {
  if ((ScalaJS.is.example_SodexoWatcher$$anonfun$actualMain$2(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "example.SodexoWatcher$$anonfun$actualMain$2")
  }
});
ScalaJS.isArrayOf.example_SodexoWatcher$$anonfun$actualMain$2 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.example_SodexoWatcher$$anonfun$actualMain$2)))
});
ScalaJS.asArrayOf.example_SodexoWatcher$$anonfun$actualMain$2 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.example_SodexoWatcher$$anonfun$actualMain$2(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lexample.SodexoWatcher$$anonfun$actualMain$2;", depth)
  }
});
ScalaJS.data.example_SodexoWatcher$$anonfun$actualMain$2 = new ScalaJS.ClassTypeData({
  example_SodexoWatcher$$anonfun$actualMain$2: 0
}, false, "example.SodexoWatcher$$anonfun$actualMain$2", ScalaJS.data.scala_runtime_AbstractFunction1, {
  example_SodexoWatcher$$anonfun$actualMain$2: true,
  scala_Serializable: true,
  java_io_Serializable: true,
  scala_runtime_AbstractFunction1: true,
  scala_Function1: true,
  java_lang_Object: true
});
ScalaJS.c.example_SodexoWatcher$$anonfun$actualMain$2.prototype.$classData = ScalaJS.data.example_SodexoWatcher$$anonfun$actualMain$2;

/** @constructor */
ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$1 = (function() {
  ScalaJS.c.scala_runtime_AbstractFunction3.call(this)
});
ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$1.prototype = new ScalaJS.inheritable.scala_runtime_AbstractFunction3();
ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$1.prototype.constructor = ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$1;
ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$1.prototype.apply__Lscala_scalajs_js_Any__Lscala_scalajs_js_String__Lorg_scalajs_jquery_JQueryXHR__Lscala_scalajs_js_Dynamic = (function(data, status, xhr) {
  var x = ScalaJS.g["jQuery"];
  var jsx$1 = x;
  var jsx$2 = data;
  var jqData = jsx$1(jsx$2);
  var percentStr = jqData["find"]("span.pourcentage")["text"]()["replace"]("%", "");
  var placesDispoStr = jqData["find"]("div.litPlacesDispo")["text"]();
  var placesDispoTextArray = ScalaJS.modules.java_util_regex_Pattern().compile__T__Ljava_util_regex_Pattern(" ").split__Ljava_lang_CharSequence__AT(placesDispoStr);
  var placesDispoInt = new ScalaJS.c.scala_collection_immutable_StringOps().init___T(ScalaJS.modules.scala_Predef().augmentString__T__T(placesDispoTextArray.underlying[1])).toInt__I();
  var pourcentage = new ScalaJS.c.scala_collection_immutable_StringOps().init___T(ScalaJS.modules.scala_Predef().augmentString__T__T(percentStr)).toInt__I();
  ScalaJS.modules.example_SodexoWatcher().changeProgressBar__Lexample_SodexoResult__V(new ScalaJS.c.example_SodexoResult().init___I__I(pourcentage, placesDispoInt));
  return ScalaJS.modules.example_SodexoWatcher().mobile__Lscala_scalajs_js_Dynamic()["loading"]("hide")
});
ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$1.prototype.apply__O__O__O__O = (function(v1, v2, v3) {
  return this.apply__Lscala_scalajs_js_Any__Lscala_scalajs_js_String__Lorg_scalajs_jquery_JQueryXHR__Lscala_scalajs_js_Dynamic(v1, v2, v3)
});
ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$1.prototype.apply = (function(arg$1, arg$2, arg$3) {
  if (ScalaJS.is.java_lang_Object(arg$1)) {
    return this.apply__O__O__O__O(arg$1, arg$2, arg$3)
  } else {
    return this.apply__Lscala_scalajs_js_Any__Lscala_scalajs_js_String__Lorg_scalajs_jquery_JQueryXHR__Lscala_scalajs_js_Dynamic(arg$1, arg$2, arg$3)
  }
});
/** @constructor */
ScalaJS.inheritable.example_SodexoWatcher$$anonfun$actualize$1 = (function() {
  /*<skip>*/
});
ScalaJS.inheritable.example_SodexoWatcher$$anonfun$actualize$1.prototype = ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$1.prototype;
/** @constructor */
ScalaJS.classes.example_SodexoWatcher$$anonfun$actualize$1 = (function() {
  ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$1.call(this);
  return this.init___()
});
ScalaJS.classes.example_SodexoWatcher$$anonfun$actualize$1.prototype = ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$1.prototype;
ScalaJS.is.example_SodexoWatcher$$anonfun$actualize$1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.example_SodexoWatcher$$anonfun$actualize$1)))
});
ScalaJS.as.example_SodexoWatcher$$anonfun$actualize$1 = (function(obj) {
  if ((ScalaJS.is.example_SodexoWatcher$$anonfun$actualize$1(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "example.SodexoWatcher$$anonfun$actualize$1")
  }
});
ScalaJS.isArrayOf.example_SodexoWatcher$$anonfun$actualize$1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.example_SodexoWatcher$$anonfun$actualize$1)))
});
ScalaJS.asArrayOf.example_SodexoWatcher$$anonfun$actualize$1 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.example_SodexoWatcher$$anonfun$actualize$1(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lexample.SodexoWatcher$$anonfun$actualize$1;", depth)
  }
});
ScalaJS.data.example_SodexoWatcher$$anonfun$actualize$1 = new ScalaJS.ClassTypeData({
  example_SodexoWatcher$$anonfun$actualize$1: 0
}, false, "example.SodexoWatcher$$anonfun$actualize$1", ScalaJS.data.scala_runtime_AbstractFunction3, {
  example_SodexoWatcher$$anonfun$actualize$1: true,
  scala_Serializable: true,
  java_io_Serializable: true,
  scala_runtime_AbstractFunction3: true,
  scala_Function3: true,
  java_lang_Object: true
});
ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$1.prototype.$classData = ScalaJS.data.example_SodexoWatcher$$anonfun$actualize$1;

/** @constructor */
ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$2 = (function() {
  ScalaJS.c.scala_runtime_AbstractFunction3.call(this)
});
ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$2.prototype = new ScalaJS.inheritable.scala_runtime_AbstractFunction3();
ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$2.prototype.constructor = ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$2;
ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$2.prototype.apply__Lorg_scalajs_jquery_JQueryXHR__Lscala_scalajs_js_String__Lscala_scalajs_js_String__Lscala_scalajs_js_Dynamic = (function(xhr, status, errorThrown) {
  ScalaJS.modules.example_SodexoWatcher().showPopupMessage__T__Lscala_scalajs_js_Dynamic(("Erreur r\u00e9seau " + ScalaJS.anyToStringForConcat(status)));
  return ScalaJS.modules.example_SodexoWatcher().mobile__Lscala_scalajs_js_Dynamic()["loading"]("hide")
});
ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$2.prototype.apply__O__O__O__O = (function(v1, v2, v3) {
  return this.apply__Lorg_scalajs_jquery_JQueryXHR__Lscala_scalajs_js_String__Lscala_scalajs_js_String__Lscala_scalajs_js_Dynamic(v1, v2, v3)
});
ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$2.prototype.apply = (function(arg$1, arg$2, arg$3) {
  if (ScalaJS.is.java_lang_Object(arg$1)) {
    return this.apply__O__O__O__O(arg$1, arg$2, arg$3)
  } else {
    return this.apply__Lorg_scalajs_jquery_JQueryXHR__Lscala_scalajs_js_String__Lscala_scalajs_js_String__Lscala_scalajs_js_Dynamic(arg$1, arg$2, arg$3)
  }
});
/** @constructor */
ScalaJS.inheritable.example_SodexoWatcher$$anonfun$actualize$2 = (function() {
  /*<skip>*/
});
ScalaJS.inheritable.example_SodexoWatcher$$anonfun$actualize$2.prototype = ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$2.prototype;
/** @constructor */
ScalaJS.classes.example_SodexoWatcher$$anonfun$actualize$2 = (function() {
  ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$2.call(this);
  return this.init___()
});
ScalaJS.classes.example_SodexoWatcher$$anonfun$actualize$2.prototype = ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$2.prototype;
ScalaJS.is.example_SodexoWatcher$$anonfun$actualize$2 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.example_SodexoWatcher$$anonfun$actualize$2)))
});
ScalaJS.as.example_SodexoWatcher$$anonfun$actualize$2 = (function(obj) {
  if ((ScalaJS.is.example_SodexoWatcher$$anonfun$actualize$2(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "example.SodexoWatcher$$anonfun$actualize$2")
  }
});
ScalaJS.isArrayOf.example_SodexoWatcher$$anonfun$actualize$2 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.example_SodexoWatcher$$anonfun$actualize$2)))
});
ScalaJS.asArrayOf.example_SodexoWatcher$$anonfun$actualize$2 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.example_SodexoWatcher$$anonfun$actualize$2(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lexample.SodexoWatcher$$anonfun$actualize$2;", depth)
  }
});
ScalaJS.data.example_SodexoWatcher$$anonfun$actualize$2 = new ScalaJS.ClassTypeData({
  example_SodexoWatcher$$anonfun$actualize$2: 0
}, false, "example.SodexoWatcher$$anonfun$actualize$2", ScalaJS.data.scala_runtime_AbstractFunction3, {
  example_SodexoWatcher$$anonfun$actualize$2: true,
  scala_Serializable: true,
  java_io_Serializable: true,
  scala_runtime_AbstractFunction3: true,
  scala_Function3: true,
  java_lang_Object: true
});
ScalaJS.c.example_SodexoWatcher$$anonfun$actualize$2.prototype.$classData = ScalaJS.data.example_SodexoWatcher$$anonfun$actualize$2;

/** @constructor */
ScalaJS.c.example_SodexoWatcher$$anonfun$main$1 = (function() {
  ScalaJS.c.scala_runtime_AbstractFunction1.call(this)
});
ScalaJS.c.example_SodexoWatcher$$anonfun$main$1.prototype = new ScalaJS.inheritable.scala_runtime_AbstractFunction1();
ScalaJS.c.example_SodexoWatcher$$anonfun$main$1.prototype.constructor = ScalaJS.c.example_SodexoWatcher$$anonfun$main$1;
ScalaJS.c.example_SodexoWatcher$$anonfun$main$1.prototype.apply__Lorg_scalajs_dom_Event__V = (function(e) {
  ScalaJS.modules.example_SodexoWatcher().showLoading__Lscala_scalajs_js_Dynamic();
  var x = ScalaJS.g["jQuery"];
  var jsx$3 = x;
  var jsx$2 = jsx$3("#devicereadyMonitor");
  var jsx$1 = jsx$2["css"]("background", "green");
  jsx$1["text"]("Device is ready");
  ScalaJS.modules.example_SodexoWatcher().actualMain__V()
});
ScalaJS.c.example_SodexoWatcher$$anonfun$main$1.prototype.apply__O__O = (function(v1) {
  this.apply__Lorg_scalajs_dom_Event__V(v1);
  return ScalaJS.modules.scala_runtime_BoxedUnit().UNIT__Lscala_runtime_BoxedUnit()
});
ScalaJS.c.example_SodexoWatcher$$anonfun$main$1.prototype.apply = (function(arg$1) {
  if (ScalaJS.is.java_lang_Object(arg$1)) {
    return this.apply__O__O(arg$1)
  } else {
    return this.apply__Lorg_scalajs_dom_Event__V(arg$1)
  }
});
/** @constructor */
ScalaJS.inheritable.example_SodexoWatcher$$anonfun$main$1 = (function() {
  /*<skip>*/
});
ScalaJS.inheritable.example_SodexoWatcher$$anonfun$main$1.prototype = ScalaJS.c.example_SodexoWatcher$$anonfun$main$1.prototype;
/** @constructor */
ScalaJS.classes.example_SodexoWatcher$$anonfun$main$1 = (function() {
  ScalaJS.c.example_SodexoWatcher$$anonfun$main$1.call(this);
  return this.init___()
});
ScalaJS.classes.example_SodexoWatcher$$anonfun$main$1.prototype = ScalaJS.c.example_SodexoWatcher$$anonfun$main$1.prototype;
ScalaJS.is.example_SodexoWatcher$$anonfun$main$1 = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.example_SodexoWatcher$$anonfun$main$1)))
});
ScalaJS.as.example_SodexoWatcher$$anonfun$main$1 = (function(obj) {
  if ((ScalaJS.is.example_SodexoWatcher$$anonfun$main$1(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "example.SodexoWatcher$$anonfun$main$1")
  }
});
ScalaJS.isArrayOf.example_SodexoWatcher$$anonfun$main$1 = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.example_SodexoWatcher$$anonfun$main$1)))
});
ScalaJS.asArrayOf.example_SodexoWatcher$$anonfun$main$1 = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.example_SodexoWatcher$$anonfun$main$1(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lexample.SodexoWatcher$$anonfun$main$1;", depth)
  }
});
ScalaJS.data.example_SodexoWatcher$$anonfun$main$1 = new ScalaJS.ClassTypeData({
  example_SodexoWatcher$$anonfun$main$1: 0
}, false, "example.SodexoWatcher$$anonfun$main$1", ScalaJS.data.scala_runtime_AbstractFunction1, {
  example_SodexoWatcher$$anonfun$main$1: true,
  scala_Serializable: true,
  java_io_Serializable: true,
  scala_runtime_AbstractFunction1: true,
  scala_Function1: true,
  java_lang_Object: true
});
ScalaJS.c.example_SodexoWatcher$$anonfun$main$1.prototype.$classData = ScalaJS.data.example_SodexoWatcher$$anonfun$main$1;

ScalaJS.modules.example_SodexoWatcher().main();
//@ sourceMappingURL=example.js.map
