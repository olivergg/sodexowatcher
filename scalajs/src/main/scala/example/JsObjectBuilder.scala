package example

import scala.language.dynamics
import scala.scalajs.js
import scala.scalajs.js.Any.fromString

object JsObjectBuilder extends scala.Dynamic {
  def applyDynamicNamed[A](name: String)(args: (String, js.Any)*): A = {
    //println(s"applyDynamicNamed($name)(args: $args")
    if (name != "apply") {
      sys.error("Call jsObj like this jsObj(x=1, y=2) which returns a javascript object that is {x:1,y:2}")
    }
    val obj = js.Object().asInstanceOf[js.Dictionary]
    args.foreach {
      case (key, value) => obj(key) = value
    }
    obj.asInstanceOf[A]
  }

  //Allows for jsObj()

  def applyDynamic[A](name: js.String)(args: Nothing*) = {
    if (args.nonEmpty) {
      sys.error("Call jsObj only with named parameters.")
    }
    js.Object().asInstanceOf[A]
  }
  //    Note that jsObj can also be given a type parameter
  //    that type will be used as the return type,
  //    However it 's just a NOP and doesn 't do real type
  //    safety
}
