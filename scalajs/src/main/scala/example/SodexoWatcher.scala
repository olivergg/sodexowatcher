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

  // Reference colors for the dynamic linear gradient. (uses color-js Javascript library under the hood)
  val color0 = Color("#bfd255").saturateByRatio(0.1)
  val color50 = Color("#8eb92a").lightenByRatio(0.3)
  val color51 = Color("#72aa00").saturateByRatio(0.1)
  val color100 = Color("#9ecb2d").saturateByRatio(0.1)

  /**
   * Helper method to access $.mobile object
   */
  def mobile = g.jQuery.mobile

  /**
   * Helper method to access color-js Color factory
   */
  def Color = g.net.brehaut.Color

  /**
   * Variable that stores the currentUrl selected in the select list.
   */
  var currentUrl = "https://sodexo-riemarcopolo.moneweb.fr/"

  /**
   * A method to retrieve a SodexoResult and change the percent bar accordingly.
   *
   * @return
   */
  def actualize(): js.Dynamic = {

    if (!currentUrl.startsWith("http")) {
      changeProgressBar(buildMockSodexoResult())
      mobile.loading("hide")
    }
    else {
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
            changeProgressBar(new SodexoResult(pourcentage, placesDispoInt))
            mobile.loading("hide")
        },
        error = {
          (xhr: JQueryXHR, status: js.String, errorThrown: js.String) =>
            showPopupMessage("Erreur réseau " + status);
            mobile.loading("hide")
        }
      )
      )
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
        case x if x > 1  => s"$x places disponibles (${res.percent} %)"
        case x if x == 1 => s"1 place disponible (${res.percent} %)"
        case _           => s"Aucune place disponible (${res.percent} %)"
      }
    )
  }

  /**
   * Display a simple popup window with the given message.
   */
  def showPopupMessage(message: String): js.Dynamic = {
    jQ("#popupMessage").text(message)
    g.jQuery("#popupBasic").popup("open", JsObj(transition = "flip"))
  }

  /**
   * Show a loading message.
   * Use mobile.loading("hide") to hide it afterwards.
   */
  def showLoading(): js.Dynamic = mobile.loading("show", JsObj(
    text = "loading",
    textVisible = true,
    theme = "a",
    textonly = false,
    html = "<h1>Chargement...</h1>"))

  def actualMain(): Unit = {

    g.console.log("START")

    // bind tap event on the actualize button
    jQ("#actualize, #percentBarContainer").bind("tap", {
      e: JQueryEventObject =>
        {
          showLoading()
          actualize()
        }
    }
    )

    // bind change event on the select list
    jQ("select#select-custom-1").change {
      e: JQueryEventObject =>
        {
          val selectedVal = jQ(e.delegateTarget).find(":selected").`val`()
          currentUrl = selectedVal + ""
          showLoading()
          actualize()
        }
    }

    //    jQ(dom.document).on("pagecontainerload", "#mainPage", {
    //      (e: JQueryEventObject) =>
    //        {
    //          dom.alert("test")
    //          showLoading()
    //          actualize()
    //        }
    //    })

    actualize()

    /// deviceready cordova event to use phonegap API
    g.document.addEventListener(
      "deviceready",
      {
        e: Event =>
          jQ("#devicereadyMonitor").css("background", "green").text("Device is ready");
          return
      },
      false
    )

    g.console.log("END")

    return
  }
  /**
   * The main function
   */
  def main(): Unit = {
    actualMain()
  }

  /**
   * Shift the given color to the red.
   * 0 percent => no shift
   * 100 percent => red (ie hue = 0)
   */
  def adjustToRed(color: js.Dynamic, percent: Int): js.Dynamic = {
    // a non linear progression is used. inspired by a gamma correction.
    val targetHue = (1 - Math.pow(percent / 100.0, 3)) * color.getHue()
    color.setHue(targetHue)
  }

  /**
   * Create the style attribute for the percent bar.
   * The width is in percent.
   * A linear-gradient CSS3 string (compatible with recent browser and with Android mobile browser.
   * The gradient is made of 4 references color that are redshifted according to the given percentage.
   */
  def getBackgroundGradientAdjusted(percent: Int): String = {

    val color0AdjustedStr = adjustToRed(color0, percent).toString
    val color50AdjustedStr = adjustToRed(color50, percent).toString
    val color51AdjustedStr = adjustToRed(color51, percent).toString
    val color100AdjustedStr = adjustToRed(color100, percent).toString
    s"""
    width : $percent% ;
    background : -webkit-linear-gradient(top, $color0AdjustedStr 0%, $color50AdjustedStr 50%, $color51AdjustedStr 51%, $color100AdjustedStr 100%); 
    background : linear-gradient(to bottom, $color0AdjustedStr 0%, $color50AdjustedStr 50%, $color51AdjustedStr 51%, $color100AdjustedStr 100%);"""
  }
}
