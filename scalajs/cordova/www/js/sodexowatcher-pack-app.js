'use strict';
// Generated DummyParents.js file

/** @constructor */
ScalaJS.h.sr_AbstractFunction2 = ScalaJS.h.sr_AbstractFunction2 || function() {};
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
  var jsx$3 = ScalaJS.protect(ScalaJS.g["jQuery"])("#percentage");
  var x1 = res.placesDispo__I();
  switch (x1) {
    default:
      if ((x1 > 1)) {
        var jsx$2 = new ScalaJS.c.s_StringContext().init___sc_Seq(ScalaJS.m.s_Predef().wrapRefArray__AO__scm_WrappedArray(ScalaJS.asArrayOf.O(ScalaJS.makeNativeArrayWrapper(ScalaJS.d.T.getArrayOf(), ["", " places disponibles (", " %)"]), 1))).s__sc_Seq__T(ScalaJS.m.s_Predef().genericWrapArray__O__scm_WrappedArray(ScalaJS.makeNativeArrayWrapper(ScalaJS.d.O.getArrayOf(), [x1, res.percent__I()])))
      } else {
        if ((x1 === 1)) {
          var jsx$2 = new ScalaJS.c.s_StringContext().init___sc_Seq(ScalaJS.m.s_Predef().wrapRefArray__AO__scm_WrappedArray(ScalaJS.asArrayOf.O(ScalaJS.makeNativeArrayWrapper(ScalaJS.d.T.getArrayOf(), ["1 place disponible (", " %)"]), 1))).s__sc_Seq__T(ScalaJS.m.s_Predef().genericWrapArray__O__scm_WrappedArray(ScalaJS.makeNativeArrayWrapper(ScalaJS.d.O.getArrayOf(), [res.percent__I()])))
        } else {
          var jsx$2 = new ScalaJS.c.s_StringContext().init___sc_Seq(ScalaJS.m.s_Predef().wrapRefArray__AO__scm_WrappedArray(ScalaJS.asArrayOf.O(ScalaJS.makeNativeArrayWrapper(ScalaJS.d.T.getArrayOf(), ["Aucune place disponible (", " %)"]), 1))).s__sc_Seq__T(ScalaJS.m.s_Predef().genericWrapArray__O__scm_WrappedArray(ScalaJS.makeNativeArrayWrapper(ScalaJS.d.O.getArrayOf(), [res.percent__I()])))
        }
      };
  };
  jsx$3["text"](jsx$2)
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
  var jsx$5 = this.mobile__sjs_js_Dynamic();
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
  var jsx$4 = obj;
  return jsx$5["loading"]("show", jsx$4)
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
  var delaySec = ScalaJS.uD(ScalaJS.protect(ScalaJS.g["jQuery"])("#sliderAutoRefreshDelay")["val"]());
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
ScalaJS.c.Lexample_SodexoWatcher$.prototype.example$SodexoWatcher$$actualize$default$1__ = (function() {
  return this.example$SodexoWatcher$$actualize$default$1__T()
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.main__ = (function() {
  this.main__V()
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.updateTimerDelay__ = (function() {
  this.updateTimerDelay__V()
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.disableTimer__ = (function() {
  this.disableTimer__V()
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.example$SodexoWatcher$$initEventHandlers__ = (function() {
  this.example$SodexoWatcher$$initEventHandlers__V()
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.example$SodexoWatcher$$showLoading__ = (function() {
  return this.example$SodexoWatcher$$showLoading__sjs_js_Dynamic()
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.example$SodexoWatcher$$showPopupMessage__T__ = (function(message) {
  return this.example$SodexoWatcher$$showPopupMessage__T__sjs_js_Dynamic(message)
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.example$SodexoWatcher$$changeProgressBar__Lexample_SodexoResult__ = (function(res) {
  this.example$SodexoWatcher$$changeProgressBar__Lexample_SodexoResult__V(res)
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.example$SodexoWatcher$$actualize__T__ = (function(currentUrl) {
  this.example$SodexoWatcher$$actualize__T__V(currentUrl)
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.example$SodexoWatcher$$storeResult__I__ = (function(perc) {
  this.example$SodexoWatcher$$storeResult__I__V(perc)
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.resultQueue__ = (function() {
  return this.resultQueue__scm_Queue()
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.lastIntervalTimer$und$eq__I__ = (function(x$1) {
  this.lastIntervalTimer$und$eq__I__V(x$1)
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.lastIntervalTimer__ = (function() {
  return this.lastIntervalTimer__I()
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.lastSelectedUrl$und$eq__T__ = (function(x$1) {
  this.lastSelectedUrl$und$eq__T__V(x$1)
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.lastSelectedUrl__ = (function() {
  return this.lastSelectedUrl__T()
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.DEFAULT$undURL__ = (function() {
  return this.DEFAULT$undURL__T()
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.COLOR100__ = (function() {
  return this.COLOR100__sjs_js_Dynamic()
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.COLOR51__ = (function() {
  return this.COLOR51__sjs_js_Dynamic()
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.COLOR50__ = (function() {
  return this.COLOR50__sjs_js_Dynamic()
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.COLOR0__ = (function() {
  return this.COLOR0__sjs_js_Dynamic()
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.Color__ = (function() {
  return this.Color__sjs_js_Dynamic()
});
ScalaJS.c.Lexample_SodexoWatcher$.prototype.mobile__ = (function() {
  return this.mobile__sjs_js_Dynamic()
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
ScalaJS.c.Lexample_SodexoResult.prototype.copy__I__I__Lexample_SodexoResult = (function(occupancyRate, availableSeats) {
  return new ScalaJS.c.Lexample_SodexoResult().init___I__I(occupancyRate, availableSeats)
});
ScalaJS.c.Lexample_SodexoResult.prototype.copy$default$1__I = (function() {
  return this.occupancyRate__I()
});
ScalaJS.c.Lexample_SodexoResult.prototype.copy$default$2__I = (function() {
  return this.availableSeats__I()
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
        var jsx$2 = 0
      } else {
        if ((x1 >= 100)) {
          var jsx$2 = 100
        } else {
          var jsx$2 = occupancyRate
        }
      };
  };
  this.percent$1 = jsx$2;
  var x1$2 = availableSeats;
  switch (x1$2) {
    default:
      if ((x1$2 <= 0)) {
        var jsx$3 = 0
      } else {
        var jsx$3 = availableSeats
      };
  };
  this.placesDispo$1 = jsx$3;
  return this
});
ScalaJS.c.Lexample_SodexoResult.prototype.canEqual__O__ = (function(x$1) {
  return this.canEqual__O__Z(x$1)
});
ScalaJS.c.Lexample_SodexoResult.prototype.productIterator__ = (function() {
  return this.productIterator__sc_Iterator()
});
ScalaJS.c.Lexample_SodexoResult.prototype.productElement__I__ = (function(x$1) {
  return this.productElement__I__O(x$1)
});
ScalaJS.c.Lexample_SodexoResult.prototype.productArity__ = (function() {
  return this.productArity__I()
});
ScalaJS.c.Lexample_SodexoResult.prototype.productPrefix__ = (function() {
  return this.productPrefix__T()
});
ScalaJS.c.Lexample_SodexoResult.prototype.copy$default$2__ = (function() {
  return this.copy$default$2__I()
});
ScalaJS.c.Lexample_SodexoResult.prototype.copy$default$1__ = (function() {
  return this.copy$default$1__I()
});
ScalaJS.c.Lexample_SodexoResult.prototype.copy__I__I__ = (function(occupancyRate, availableSeats) {
  return this.copy__I__I__Lexample_SodexoResult(occupancyRate, availableSeats)
});
ScalaJS.c.Lexample_SodexoResult.prototype.placesDispo__ = (function() {
  return this.placesDispo__I()
});
ScalaJS.c.Lexample_SodexoResult.prototype.percent__ = (function() {
  return this.percent__I()
});
ScalaJS.c.Lexample_SodexoResult.prototype.availableSeats__ = (function() {
  return this.availableSeats__I()
});
ScalaJS.c.Lexample_SodexoResult.prototype.occupancyRate__ = (function() {
  return this.occupancyRate__I()
});
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
/** @constructor */
ScalaJS.c.Lexample_SodexoResult$ = (function() {
  ScalaJS.c.sr_AbstractFunction2.call(this)
});
ScalaJS.c.Lexample_SodexoResult$.prototype = new ScalaJS.h.sr_AbstractFunction2();
ScalaJS.c.Lexample_SodexoResult$.prototype.constructor = ScalaJS.c.Lexample_SodexoResult$;
/** @constructor */
ScalaJS.h.Lexample_SodexoResult$ = (function() {
  /*<skip>*/
});
ScalaJS.h.Lexample_SodexoResult$.prototype = ScalaJS.c.Lexample_SodexoResult$.prototype;
ScalaJS.c.Lexample_SodexoResult$.prototype.toString__T = (function() {
  return "SodexoResult"
});
ScalaJS.c.Lexample_SodexoResult$.prototype.apply__I__I__Lexample_SodexoResult = (function(occupancyRate, availableSeats) {
  return new ScalaJS.c.Lexample_SodexoResult().init___I__I(occupancyRate, availableSeats)
});
ScalaJS.c.Lexample_SodexoResult$.prototype.unapply__Lexample_SodexoResult__s_Option = (function(x$0) {
  if ((x$0 === null)) {
    return ScalaJS.m.s_None()
  } else {
    return new ScalaJS.c.s_Some().init___O(new ScalaJS.c.s_Tuple2$mcII$sp().init___I__I(x$0.occupancyRate__I(), x$0.availableSeats__I()))
  }
});
ScalaJS.c.Lexample_SodexoResult$.prototype.readResolve__p2__O = (function() {
  return ScalaJS.m.Lexample_SodexoResult()
});
ScalaJS.c.Lexample_SodexoResult$.prototype.apply__O__O__O = (function(v1, v2) {
  return this.apply__I__I__Lexample_SodexoResult(ScalaJS.uI(v1), ScalaJS.uI(v2))
});
ScalaJS.c.Lexample_SodexoResult$.prototype.unapply__Lexample_SodexoResult__ = (function(x$0) {
  return this.unapply__Lexample_SodexoResult__s_Option(x$0)
});
ScalaJS.c.Lexample_SodexoResult$.prototype.apply__I__I__ = (function(occupancyRate, availableSeats) {
  return this.apply__I__I__Lexample_SodexoResult(occupancyRate, availableSeats)
});
ScalaJS.is.Lexample_SodexoResult$ = (function(obj) {
  return (!(!((obj && obj.$classData) && obj.$classData.ancestors.Lexample_SodexoResult$)))
});
ScalaJS.as.Lexample_SodexoResult$ = (function(obj) {
  if ((ScalaJS.is.Lexample_SodexoResult$(obj) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwClassCastException(obj, "example.SodexoResult$")
  }
});
ScalaJS.isArrayOf.Lexample_SodexoResult$ = (function(obj, depth) {
  return (!(!(((obj && obj.$classData) && (obj.$classData.arrayDepth === depth)) && obj.$classData.arrayBase.ancestors.Lexample_SodexoResult$)))
});
ScalaJS.asArrayOf.Lexample_SodexoResult$ = (function(obj, depth) {
  if ((ScalaJS.isArrayOf.Lexample_SodexoResult$(obj, depth) || (obj === null))) {
    return obj
  } else {
    ScalaJS.throwArrayCastException(obj, "Lexample.SodexoResult$;", depth)
  }
});
ScalaJS.d.Lexample_SodexoResult$ = new ScalaJS.ClassTypeData({
  Lexample_SodexoResult$: 0
}, false, "example.SodexoResult$", ScalaJS.d.sr_AbstractFunction2, {
  Lexample_SodexoResult$: 1,
  s_Serializable: 1,
  Ljava_io_Serializable: 1,
  sr_AbstractFunction2: 1,
  F2: 1,
  O: 1
});
ScalaJS.c.Lexample_SodexoResult$.prototype.$classData = ScalaJS.d.Lexample_SodexoResult$;
ScalaJS.n.Lexample_SodexoResult = undefined;
ScalaJS.m.Lexample_SodexoResult = (function() {
  if ((!ScalaJS.n.Lexample_SodexoResult)) {
    ScalaJS.n.Lexample_SodexoResult = new ScalaJS.c.Lexample_SodexoResult$().init___()
  };
  return ScalaJS.n.Lexample_SodexoResult
});
//# sourceMappingURL=sodexowatcher-pack-app.js.map
