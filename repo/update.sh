#!/bin/bash

echo
./clean.sh
echo

rm Packages*
./dpkg-scanpackages -m . /dev/null >Packages
bzip2 Packages