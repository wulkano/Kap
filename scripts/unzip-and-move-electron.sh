#!/usr/bin/env bash

cd $1

7z -y x Electron*.zip
rm -f Electron*.zip
rm -r ../../node_modules/electron/dist/*
mv Electron.app ../../node_modules/electron/dist
