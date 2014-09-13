// Turn this project into a Scala.js project by importing these settings
scalaJSSettings

// Turn this project into a less css aware project by importing these settings.
lessSettings

name := "SodexoWatcher"

version := "0.1-SNAPSHOT"

scalaVersion := "2.11.2"

// Download and link sources for library dependencies
EclipseKeys.withSource := true

libraryDependencies ++= Seq(
    "org.scala-lang.modules.scalajs" %% "scalajs-jasmine-test-framework" % scalaJSVersion % "test",
    "org.scala-lang.modules.scalajs" %%% "scalajs-dom" % "0.6",
    "org.scala-lang.modules.scalajs" %%% "scalajs-jquery" % "0.6"
)


ScalaJSKeys.emitSourceMaps := true

//// HTML5 Cordova, web application related modifications below

// Target directory for the CSS compiled with less.
(resourceManaged in (Compile, LessKeys.less)) := baseDirectory.value / "cordova" / "www" / "css" / "compiled"

// Extends the original fastOptJS and fullOptJS tasks by calling a custom method from the project/Build.scala file.
// (See http://www.scala-sbt.org/0.13.1/docs/Detailed-Topics/Tasks.html#modifying-an-existing-task)
ScalaJSKeys.packageJS in Compile := {
	val originalResult=(ScalaJSKeys.packageJS in Compile).value
	copyToCordova(originalResult.allCode)
	originalResult
}


ScalaJSKeys.fastOptJS in Compile := {
	val originalResult=(ScalaJSKeys.fastOptJS in Compile).value
	copyToCordova(originalResult.allCode)
	originalResult
}



ScalaJSKeys.fullOptJS in Compile := { 
	val originalResult=(ScalaJSKeys.fullOptJS in Compile).value
	copyToCordova(originalResult.allCode)
	originalResult
}
