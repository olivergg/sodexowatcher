package example
/**
 * A class that represents the occupancy data of a restaurant.
 */
case class SodexoResult(val occupancyRate: Int, val availableSeats: Int) {
  val percent = occupancyRate match {
    case p if p <= 0   => 0
    case p if p >= 100 => 100
    case _             => occupancyRate
  }

  val placesDispo = availableSeats match {
    case p if p <= 0 => 0
    case _           => availableSeats
  }
}