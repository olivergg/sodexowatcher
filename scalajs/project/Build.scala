import sbt._
import Keys._
import org.apache.commons.io.FileUtils

object MyBuild extends Build {

  val outputCordovaJS = "cordova/www/js"

  def copyToCordova(jsFile: sbt.File): Unit = copyToCordova(Seq(jsFile))

  def copyToCordova(jsFileList: Seq[sbt.File]): Unit = {
    println("Post package JS")
    jsFileList.foreach {
      x: sbt.File =>
        {
          println(s"Copying file $x to $outputCordovaJS")
          FileUtils.copyFileToDirectory(new File(x.toString), new File(outputCordovaJS))
        }
    }
  }

}