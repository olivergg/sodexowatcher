import sbt._
import Keys._
import org.apache.commons.io.FileUtils
import scala.scalajs.tools.io._

object MyBuild extends Build {

  val outputCordovaJS = "cordova/www/js"

  //def copyToCordova(jsFile: sbt.File): Unit = copyToCordova(Seq(jsFile))

  def copyToCordova(jsFileList: Seq[VirtualJSFile]): Unit = {
    println("Post package JS")
    jsFileList.foreach {
      x => x match {
        case ax:FileVirtualFile => {
           println(s"Copying file ${ax.path} to $outputCordovaJS")
          FileUtils.copyFileToDirectory(new File(ax.path), new File(outputCordovaJS))
        }
        case _ => ;
      }
    }
  }

}