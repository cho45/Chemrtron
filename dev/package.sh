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
		--platform=mas \
		--arch=x64 \
		--version=0.34.0 \
		--ignore=build \
		--app-version=$version

	# Name of your app.
	APP="Chemr"
	# The path of you app to sign.
	APP_PATH="build/Chemr-mas-x64/Chemr.app"
	# The path to the location you want to put the signed package.
	RESULT_PATH="build/releases/Chemr.pkg"
	# The name of certificates you requested.
	APP_KEY="3rd Party Mac Developer Application: Company Name (APPIDENTITY)"
	INSTALLER_KEY="3rd Party Mac Developer Installer: Company Name (APPIDENTITY)"

	FRAMEWORKS_PATH="$APP_PATH/Contents/Frameworks"

	if [ x$SIGN == x1 ]; then
		codesign --deep -fs "$APP_KEY" --entitlements dev/child.plist "$FRAMEWORKS_PATH/Electron Framework.framework/Libraries/libnode.dylib"
		codesign --deep -fs "$APP_KEY" --entitlements dev/child.plist "$FRAMEWORKS_PATH/Electron Framework.framework/Electron Framework"
		codesign --deep -fs "$APP_KEY" --entitlements dev/child.plist "$FRAMEWORKS_PATH/Electron Framework.framework/"
		codesign --deep -fs "$APP_KEY" --entitlements dev/child.plist "$FRAMEWORKS_PATH/$APP Helper.app/"
		codesign --deep -fs "$APP_KEY" --entitlements dev/child.plist "$FRAMEWORKS_PATH/$APP Helper EH.app/"
		codesign --deep -fs "$APP_KEY" --entitlements dev/child.plist "$FRAMEWORKS_PATH/$APP Helper NP.app/"
		codesign  -fs "$APP_KEY" --entitlements dev/parent.plist "$APP_PATH"
		productbuild --component "$APP_PATH" /Applications --sign "$INSTALLER_KEY" "$RESULT_PATH"
	else
		codesign --deep -fs - --entitlements dev/child.plist "$FRAMEWORKS_PATH/Electron Framework.framework/Libraries/libnode.dylib"
		codesign --deep -fs - --entitlements dev/child.plist "$FRAMEWORKS_PATH/Electron Framework.framework/Electron Framework"
		codesign --deep -fs - --entitlements dev/child.plist "$FRAMEWORKS_PATH/Electron Framework.framework/"
		codesign --deep -fs - --entitlements dev/child.plist "$FRAMEWORKS_PATH/$APP Helper.app/"
		codesign --deep -fs - --entitlements dev/child.plist "$FRAMEWORKS_PATH/$APP Helper EH.app/"
		codesign --deep -fs - --entitlements dev/child.plist "$FRAMEWORKS_PATH/$APP Helper NP.app/"
		codesign  -fs - --entitlements dev/parent.plist "$APP_PATH"
		productbuild --component "$APP_PATH" /Applications "$RESULT_PATH"
	fi
fi


### Windows

if [ x$SKIP_WIN != x1 ]; then
	electron-packager . Chemr \
		--out build \
		--icon=assets/win/icon.ico \
		--platform=win32 \
		--arch=ia32 \
		--version=0.34.0 \
		--version-string.ProductName="Chemr" \
		--ignore=build \
		--app-version=$version

	electron-builder \
		build/Chemr-win32-ia32 \
		--platform=win \
		--out=build/releases \
		--config=installer.json
fi
