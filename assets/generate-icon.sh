#!/bin/sh

set -x

ROOT=$(cd $(dirname $0); pwd)
cd $ROOT

rm -rf icon.iconset
cp -r ./chemr-assets icon.iconset
cd icon.iconset
cp icon_32x32.png icon_16x16@2x.png
mv icon_64x64.png icon_32x32@2x.png
cp icon_256x256.png icon_128x128@2x.png
cp icon_512x512.png icon_256x256@2x.png
mv icon_1024x1024.png icon_512x512@2x.png
cd ..
iconutil --convert icns --output osx/icon.icns icon.iconset

