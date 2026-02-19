#!/bin/bash

remote="ssh server@192.168.1.109 -p 55"
path="$(dirname "$(readlink -f "$0")")"

$remote "/usr/local/bin/docker exec -i homeassistant bash -c 'python3'" < "$path/fetch.py" | \
python3 "$path/split.py" "$path/../../static/translations/"
