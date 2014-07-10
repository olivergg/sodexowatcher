sodexowatcher
=============

A HTML5 application to watch Sodexo restaurant occupancy rate.


This project is an attempt to write a Scala JS based HTML 5 cordova mobile application (using jQuery Mobile optionally).

This project is still at a very early stage and has only been created as a POC.

You'll have to install npm to install cordova. See https://cordova.apache.org/docs/en/2.9.0/guide_cli_index.md.html

The Scala JS output javascript files are copied to the cordova www/js directory after the fastOptJS and fullOptJs tasks  (see http://www.scala-sbt.org/0.13.1/docs/Detailed-Topics/Tasks.html#modifying-an-existing-task).


You can test the application in Chromium/Chrome browser using the Ripple Emulator (to be able to bypass the Same Origin Policy). See http://www.raymondcamden.com/2013/11/5/Ripple-is-Reborn


To run the program on a local web browser, first run `sbt fullOptJs`

Start a web server inside the cordova/www folder (for example on linux, you could use python -m http.server)
Launch `http://localhost:8080/index.html`

To package the final APK, you'll have to setup cordova to use the android platform and use : `cordova run`

to install and launch the application on a real device.



