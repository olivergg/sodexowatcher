package example

import scala.language.dynamics
import scala.scalajs.js
import scala.scalajs.js.Any.fromBoolean
import scala.scalajs.js.Any.fromFunction1
import scala.scalajs.js.Any.fromFunction3
import scala.scalajs.js.Any.fromString
import scala.scalajs.js.Dynamic.{ global => g }
import scala.scalajs.js.String.toScalaString
import org.scalajs.jquery.JQueryAjaxSettings
import org.scalajs.jquery.JQueryEventObject
import org.scalajs.jquery.JQueryXHR
import org.scalajs.jquery.{ jQuery => jQ }
import example.{ JsObjectBuilder => JsObj }
import org.scalajs.jquery.JQuery
import org.scalajs.jquery.JQueryStatic
import org.scalajs.dom
import org.scalajs.dom.HTMLElement
import org.scalajs.dom.Event
import scala.scalajs.js.Undefined

/**
 *
 */
object SodexoWatcher {

  /**
   * Helper method to access $.mobile object
   * //FIXME : we have to use jQuery instead of $....still don't know why.
   */
  def mobile: js.Dynamic = g.jQuery.mobile

  /**
   * Helper method to access color-js Color factory (careful, Color is not an object but a factory method)
   */
  def Color: js.Dynamic = g.net.brehaut.Color

  // Reference colors for the dynamic linear gradient. (uses color-js Javascript library under the hood)
  val COLOR0 = Color("#bfd255").saturateByRatio(0.1)
  val COLOR50 = Color("#8eb92a").lightenByRatio(0.3)
  val COLOR51 = Color("#72aa00").saturateByRatio(0.1)
  val COLOR100 = Color("#9ecb2d").saturateByRatio(0.1)

  /**
   * The default URL for the actualize method.
   */
  val DEFAULT_URL = "https://sodexo-riemarcopolo.moneweb.fr/"

  var lastSelectedUrl = ""
  /**
   * A method to retrieve a SodexoResult and change the percent bar accordingly.
   *
   * @return
   */
  def actualize(currentUrl: String = DEFAULT_URL): js.Dynamic = {

    dom.console.log("Fetching from url = " + currentUrl)
    if (!currentUrl.startsWith("http")) {
      changeProgressBar(buildMockSodexoResult())
      mobile.loading("hide")
    } else {

      // See http://api.jquery.com/jQuery.ajax/#jQuery-ajax-settings for reference
      jQ.ajax(JsObj[JQueryAjaxSettings](
        url = currentUrl,
        success = {
          (data: js.Any, status: js.String, xhr: JQueryXHR) =>
            val jqData = jQ(data)
            val percentStr: String = jqData.find("span.pourcentage").text().replace("%", "")
            val placesDispoStr: String = jqData.find("div.litPlacesDispo").text();
            val placesDispoTextArray = placesDispoStr.split(" ")
            val placesDispoInt = placesDispoTextArray(1).toInt
            val pourcentage = percentStr.toInt
            changeProgressBar(SodexoResult(pourcentage, placesDispoInt))
            mobile.loading("hide")
        },
        error = {
          (xhr: JQueryXHR, status: js.String, errorThrown: js.String) =>
            showPopupMessage("Erreur réseau " + status);
            mobile.loading("hide")
        }))
    }
  }

  /**
   * Build a fake SodexoResult (for testing purpose only)
   */
  def buildMockSodexoResult(): SodexoResult = {
    val mockPercent = scala.util.Random.nextInt(100)
    val placesDispo = 120 - ((mockPercent / 100.0) * 120).toInt
    new SodexoResult(mockPercent, placesDispo)
  }

  /**
   * Change the percent bar status.
   */
  def changeProgressBar(res: SodexoResult): Unit = {
    jQ("#percentBar").attr("style", getBackgroundGradientAdjusted(res.percent))
    jQ("#percentage").text(
      res.placesDispo match {
        case x if x > 1 => s"$x places disponibles (${res.percent} %)"
        case x if x == 1 => s"1 place disponible (${res.percent} %)"
        case _ => s"Aucune place disponible (${res.percent} %)"
      })
  }

  /**
   * Create the style attribute for the percent bar.
   * The width is in percent.
   * A linear-gradient CSS3 string (compatible with recent browser and with Android mobile browser.
   * The gradient is made of 4 references color that are redshifted according to the given percentage.
   */
  def getBackgroundGradientAdjusted(percent: Int): String = {

    val color0AdjustedStr = adjustToRed(COLOR0, percent).toString
    val color50AdjustedStr = adjustToRed(COLOR50, percent).toString
    val color51AdjustedStr = adjustToRed(COLOR51, percent).toString
    val color100AdjustedStr = adjustToRed(COLOR100, percent).toString
    s"""
    width : $percent% ;
    background : -webkit-linear-gradient(top, $color0AdjustedStr 0%, $color50AdjustedStr 50%, $color51AdjustedStr 51%, $color100AdjustedStr 100%); 
    background : linear-gradient(to bottom, $color0AdjustedStr 0%, $color50AdjustedStr 50%, $color51AdjustedStr 51%, $color100AdjustedStr 100%);"""
  }

  /**
   * Shift the given color to the red.
   * 0 % => no shift (original color).
   * 100 % => red (ie hue = 0)
   */
  def adjustToRed(color: js.Dynamic, percent: Int): js.Dynamic = {
    // we use a non linear progression (somehow like a gamma correction).
    val targetHue = (1 - Math.pow(percent / 100.0, 3)) * color.getHue()
    color.setHue(targetHue)
  }

  /**
   * Display a simple popup window with the given message.
   */
  def showPopupMessage(message: String): js.Dynamic = {
    jQ("#popupMessage").text(message)
    g.jQuery("#popupBasic").popup("open", JsObj(transition = "flip"))
  }

  /**
   * Show a loading message using jQuery Mobile "loading" function.
   * Use mobile.loading("hide") to hide it afterwards.
   */
  def showLoading(): js.Dynamic = mobile.loading("show", JsObj(
    text = "loading",
    textVisible = true,
    theme = "a",
    textonly = false,
    html = "<h1>Chargement...</h1>"))

  /** Your main code goes here */
  def actualMain(): Unit = {

    g.console.log("START")

    // bind tap event on the actualize button and the percent bar ("tap" is faster than "click")
    jQ("#actualize, #percentBarContainer").bind("tap", {
      e: JQueryEventObject =>
        {
          showLoading()
          actualize(lastSelectedUrl)
        }
    })

    // bind change event on the select list
    jQ("select#select-custom-1").change {
      e: JQueryEventObject =>
        {
          val selectedURL = jQ(e.delegateTarget).find(":selected").`val`().asInstanceOf[js.String]
          lastSelectedUrl = selectedURL
          showLoading()
          actualize(selectedURL)
        }
    }
    showLoading()
    actualize()

    g.console.log("END")

  }
  /**
   * The main function (called by scala-js startup.js)
   */
  def main(): Unit = {

    // When the device is ready, run the actual main code.
    // The deviceready is fired by the Cordova API on a real phone.
    // It won't work on a real browser...unless you use the Ripple Emulator in Chromium/Chrome.
    g.document.addEventListener(
      "deviceready",
      { e: Event =>
        // //FIXME This showLoading call shouldn't be here...it's just here to somehow initialize the popup. Otherwise
        // the next call to showLoading won't be showing anything.
        showLoading();

        // Display a "device is ready" in the bottom to indicate that the event has been received.
        jQ("#devicereadyMonitor").css("background", "green").text("Device is ready");

        // Call the actual main code.
        actualMain()
      },
      false)
  }

}
