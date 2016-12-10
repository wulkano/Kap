#!/usr/bin/env bash

cd $1

7z -y x Electron*.zip
rm -f Electron*.zip
mv Electron.app ../../node_modules/electron/dist
