// Turn this project into a Scala.js project by importing these settings
scalaJSSettings

// Turn this project into a less css aware project by importing these settings.
lessSettings

name := "SodexoWatcher"

version := "0.1-SNAPSHOT"


// Download and link sources for library dependencies
EclipseKeys.withSource := true

// Specify additional .js file to be passed to package-js and optimize-js
unmanagedSources in (Compile, ScalaJSKeys.packageJS) += baseDirectory.value / "cordova" / "www" / "js" / "startup.js"

libraryDependencies ++= Seq(
    "org.scala-lang.modules.scalajs" %% "scalajs-jasmine-test-framework" % scalaJSVersion % "test",
    "org.scala-lang.modules.scalajs" %% "scalajs-dom" % "0.1-SNAPSHOT",
    "org.scala-lang.modules.scalajs" %% "scalajs-jquery" % "0.1-SNAPSHOT"
)


//// HTML5 Cordova, web application related modifications below

// Target directory for the CSS compiled from LESS.
(resourceManaged in (Compile, LessKeys.less)) := baseDirectory.value / "cordova" / "www" / "css" / "compiled"

// Extends the original packageJS and optimizeJS tasks by calling a custom method from the project/Build.scala file.
ScalaJSKeys.packageJS in Compile := {
	val originalResult=(ScalaJSKeys.packageJS in Compile).value
	copyToCordova(originalResult)
	originalResult
}

ScalaJSKeys.optimizeJS in Compile := { 
	val originalResult=(ScalaJSKeys.optimizeJS in Compile).value
	copyToCordova(originalResult)
	originalResult
}
