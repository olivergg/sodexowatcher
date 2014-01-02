#!/bin/bash
while true; do

	inotifywait -r -e modify,create css && \
		lessc css/index.less > css/index.css

done
