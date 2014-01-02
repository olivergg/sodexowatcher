#!/bin/bash
while true; do

	inotifywait -r -e modify,create . && \
		./copytocordova.sh

done
