#!/bin/sh

set -x

ROOT=$(cd $(dirname $0)/..; pwd)
cd $ROOT

version=$(cat VERSION);
echo "Create version: v$version"

### OS X

rm -r build
electron-packager . Chemr \
	--app-bundle-id=net.lowreal.Chemr \
	--helper-bundle-id=net.lowreal.ChemrHelper \
	--out build \
	--platform=darwin \
	--arch=x64 \
	--version=0.33.6 \
	--app-version=$version

rm Chemr-$version.dmg
hdiutil create \
	-ov -srcfolder build/Chemr-darwin-x64 -fs HFS+ -format UDBZ \
	-volname "Chemr" build/Chemr-$version-darwin-x64.dmg

rm -rf build/Chemr-darwin-x64

### Windows

#electron-packager . Chemr \
#	--out build \
#	--asar \
#	--platform=win32 \
#	--arch=x64 \
#	--version=0.33.6 \
#	--version-string.ProductName="Chemr" \
#	--app-version=$version
#
