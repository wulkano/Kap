#!/usr/bin/env bash

cd $1

7z -y x ffmpeg.7z
rm -f ffmpeg.7z
