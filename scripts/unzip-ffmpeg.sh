#!/usr/bin/env bash

if [[ $OSTYPE == darwin* ]]; then
  cd $1

  7z -y x ffmpeg.7z
  rm -f ffmpeg.7z
fi
