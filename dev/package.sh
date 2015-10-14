#!/bin/sh

set -x

version=0.0.1

ROOT=$(cd $(dirname $0)/..; pwd)
cd $ROOT

rm -r build
electron-packager . Chemr \
	--app-bundle-id=net.lowreal.Chemr \
	--helper-bundle-id=net.lowreal.ChemrHelper \
	--out build \
	--platform=darwin \
	--arch=x64 \
	--version=0.33.6 \
	--app-version=$version

electron-packager . Chemr \
	--out build \
	--platform=win32 \
	--arch=x64 \
	--version=0.33.6 \
	--version-string.ProductName="Chemr" \
	--app-version=$version

