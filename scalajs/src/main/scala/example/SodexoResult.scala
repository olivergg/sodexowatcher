package example

class SodexoResult(val percentage: Int, val places: Int) {
  val percent = percentage match {
    case p if p <= 0   => 0
    case p if p >= 100 => 100
    case _             => percentage
  }

  val placesDispo = places match {
    case p if p <= 0 => 0
    case _           => places
  }
}