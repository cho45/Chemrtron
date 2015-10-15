#!/bin/sh

set -x

ROOT=$(cd $(dirname $0)/..; pwd)
cd $ROOT

version=$(cat VERSION);
echo "Create version: v$version"

rm -r build
mkdir -p build/releases

### OS X

if [ x$SKIP_OSX != x1 ]; then
	electron-packager . Chemr \
		--icon=assets/osx/icon.icns \
		--app-bundle-id=net.lowreal.Chemr \
		--helper-bundle-id=net.lowreal.ChemrHelper \
		--out build \
		--platform=darwin \
		--arch=x64 \
		--version=0.33.6 \
		--ignore=build \
		--app-version=$version

	electron-builder \
		build/Chemr-darwin-x64/Chemr.app \
		--platform=osx \
		--out=build/releases \
		--config=installer.json
fi


### Windows

if [ x$SKIP_WIN != x1 ]; then
	electron-packager . Chemr \
		--out build \
		--icon=assets/win/icon.ico \
		--platform=win32 \
		--arch=ia32 \
		--version=0.33.6 \
		--version-string.ProductName="Chemr" \
		--ignore=build \
		--app-version=$version

	electron-builder \
		build/Chemr-win32-ia32 \
		--platform=win \
		--out=build/releases \
		--config=installer.json
fi
