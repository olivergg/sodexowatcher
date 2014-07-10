package example

import scala.language.dynamics
import scala.scalajs.js
import scala.scalajs.js.Any.fromBoolean
import scala.scalajs.js.Any.fromFunction1
import scala.scalajs.js.Any.fromString
import scala.scalajs.js.Any.toString
import scala.scalajs.js.Dynamic.{ global => g }
import scala.scalajs.js.String.toScalaString
import org.scalajs.jquery.{ jQuery => jQ, _ }
import js.Dynamic.{ literal => lit }
import org.scalajs.dom
import org.scalajs.dom.{ XMLHttpRequest, Event }
import js.annotation.JSExport
import org.scalajs.dom.extensions.Ajax
import scala.scalajs.concurrent.JSExecutionContext.Implicits.queue
import scala.util.Failure
import scala.util.Success

/**
 *
 */
@JSExport
object SodexoWatcher {

  /**
   * Helper method to access $.mobile object
   */
  def mobile: js.Dynamic = g.$.mobile

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

  var lastSelectedUrl = DEFAULT_URL
  var lastIntervalTimer = 0

  val resultQueue = new scala.collection.mutable.Queue[Int]

  private def storeResult(perc: Int): Unit = {
    resultQueue += perc
    if (resultQueue.size > 4) {
      resultQueue.dequeue
    }
  }

  /**
   * A method to retrieve a SodexoResult and change the percent bar accordingly.
   *
   * @return
   */
  private def actualize(currentUrl: String = DEFAULT_URL): Unit = {
    //    dom.console.log("Fetching from url = " + currentUrl)
    if (!currentUrl.startsWith("http")) {
      val randomResult = buildMockSodexoResult();
      changeProgressBar(randomResult)
      storeResult(randomResult.percent)
      mobile.loading("hide")
    } else {

      Ajax.get(url = currentUrl, timeout = 60) onComplete {
        case Success(data: XMLHttpRequest) => {
          //          dom.console.log("SUCCESS " + data.responseText)
          val jqData = jQ(data.responseText)
          //          dom.console.log("SUCCESS " + jqData)
          val percentStr: String = jqData.find("span.pourcentage").text().replace("%", "")
          //          dom.console.log("SUCCESS " + percentStr)
          val placesDispoStr: String = jqData.find("div.litPlacesDispo").text();
          val placesDispoTextArray = placesDispoStr.split(" ")
          val placesDispoInt = placesDispoTextArray(1).toInt
          val pourcentage = percentStr.toInt
          changeProgressBar(SodexoResult(pourcentage, placesDispoInt))
          storeResult(pourcentage)
          mobile.loading("hide")
        }

        case Failure(f) => {
          showPopupMessage("Erreur réseau " + f);
          mobile.loading("hide")
        }

      }
    }
    dom.console.log("" + resultQueue.toString)
  }

  /**
   * Build a fake SodexoResult (for testing purpose only)
   */
  private def buildMockSodexoResult(): SodexoResult = {
    val mockPercent = scala.util.Random.nextInt(100)
    val placesDispo = 120 - ((mockPercent / 100.0) * 120).toInt
    new SodexoResult(mockPercent, placesDispo)
  }

  /**
   * Change the percent bar status.
   */
  private def changeProgressBar(res: SodexoResult): Unit = {
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
  private def getBackgroundGradientAdjusted(percent: Int): String = {

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
  private def adjustToRed(color: js.Dynamic, percent: Int): js.Dynamic = {
    // we use a non linear progression (somehow like a gamma correction).
    val targetHue = (1 - Math.pow(percent / 100.0, 3)) * color.getHue()
    color.setHue(targetHue)
  }

  /**
   * Display a simple popup window with the given message.
   */
  private def showPopupMessage(message: String): js.Dynamic = {
    jQ("#popupMessage").text(message)
    g.jQuery("#popupBasic").popup("open", lit(transition = "flip"))

  }

  /**
   * Show a loading message using jQuery Mobile "loading" function.
   * Use mobile.loading("hide") to hide it afterwards.
   */
  private def showLoading(): js.Dynamic = mobile.loading("show",
    js.Dynamic.literal("text" -> "loading", "textVisible" -> true, "theme" -> "a", "textonly" -> false, "html" -> "<h1>Chargement...</h1>"))

  private def initEventHandlers(): Unit = {
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

    /// auto refresh on/off change
    jQ("select#flip-1").change {
      e: JQueryEventObject =>
        {
          (jQ(e.delegateTarget).find(":selected").`val`().asInstanceOf[js.String]: String) match {
            case "on" => {
              jQ("#autorefreshSliderContainer").removeClass("hiddenBlock");
              updateTimerDelay()

            }
            case "off" => {
              jQ("#autorefreshSliderContainer").addClass("hiddenBlock");
              disableTimer()
            }
            case _ => g.console.log("wrong value in select slider")
          }
        }
    }

    // auto refresh delay slider value change
    jQ("#sliderAutoRefreshDelay").bind("slidestop", {
      e: JQueryEventObject =>
        {
          dom.console.log("change slider value")
          //          disableTimer()
          updateTimerDelay()

        }
    })
  }

  def disableTimer(): Unit = {
    dom.clearInterval(lastIntervalTimer)
  }

  def updateTimerDelay(): Unit = {
    disableTimer()
    val delaySec = jQ("#sliderAutoRefreshDelay").value()
    lastIntervalTimer = dom.setInterval({ () =>
      showLoading();
      actualize(lastSelectedUrl)
    }, delaySec * 1000)
  }

  /**
   * The main function (called by scala-js startup.js)
   */
  @JSExport
  def main(): Unit = {
    g.console.log("START")

    // See http://www.w3schools.com/jquerymobile/jquerymobile_events_intro.asp
    jQ(dom.document).on("pageinit", "#mainPage", {
      () =>
        {
          dom.console.log("#mainPage is initialized");
          initEventHandlers()
        }
    })

    // Add a "deviceready" event listener.
    // The deviceready is fired by the Cordova API on a real phone.
    // It won't work on a real browser...unless you use the Ripple Emulator in Chromium/Chrome.
    g.document.addEventListener(
      "deviceready", { e: Event =>
        // //FIXME This showLoading call shouldn't be here...but without it, the next call to showLoading does not work.
        showLoading();

        // Display a "device is ready" in the bottom to indicate that the event has been received.
        jQ("#devicereadyMonitor").css("background", "green").text("Device is ready");

        showLoading()
        actualize()

      },
      false)

    g.console.log("END")

  }

}
