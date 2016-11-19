#!/usr/bin/env bash

if [[ $OSTYPE == darwin* ]]; then
  # TODO brew update
  brew update
  brew install p7zip
fi
