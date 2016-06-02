#!/bin/sh

set -x

ROOT=$(cd $(dirname $0)/..; pwd)
cd $ROOT

ELECTRON_VERSION=$(ruby -rjson -e 'puts JSON.parse(File.read("package.json"))["dependencies"]["electron"]')

version=$(cat VERSION);
echo "Create version: v$version"

echo "UPDATE CONTRIBUTOR LIST"
curl https://api.github.com/repos/cho45/Chemrtron/contributors | \
	node -e "console.log(JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8')).map(x => '@' + x.login).filter(x => x !== '@cho45').join(', '));" \
	> CONTRIBUTORS

rm -r build
mkdir -p build/releases
cp assets/win/icon.ico build/

### OS X

if [ x$SKIP_OSX != x1 ]; then
	export DEBUG=electron-osx-sign 
	./node_modules/.bin/electron-packager  . Chemr \
		--icon=assets/osx/icon.icns \
		--app-bundle-id=net.lowreal.Chemr \
		--helper-bundle-id=net.lowreal.ChemrHelper \
		--out build \
		--platform=mas \
		--arch=x64 \
		--version=$ELECTRON_VERSION \
		--ignore=build \
		--ignore="dev|sketch" \
		--ignore="node_modules/(electron-.*)" \
		--app-version=$version \
		--extend-info=dev/Info.plist

	cd build/Chemr-mas-x64

#	ruby -i -anal -e 'puts gsub(/com.github.electron/, "net.lowreal.Chemr").gsub(/Electron/, "Chemr")' Chemr.app/Contents/Frameworks/Chemr\ Helper\ EH.app/Contents/Info.plist
#	ruby -i -anal -e 'puts gsub(/com.github.electron/, "net.lowreal.Chemr").gsub(/Electron/, "Chemr")' Chemr.app/Contents/Frameworks/Chemr\ Helper\ NP.app/Contents/Info.plist

	cd $ROOT

	# Name of your app.
	APP="Chemr"
	# The path of you app to sign.
	APP_PATH="build/Chemr-mas-x64/Chemr.app"
	# The path to the location you want to put the signed package.
	RESULT_PATH="build/releases/Chemr.pkg"
	# The name of certificates you requested.
	APP_KEY="3rd Party Mac Developer Application: Hirofumi Watanabe (877L5ULMT9)"
	APP_KEY="3rd Party Mac Developer Application: Hirofumi Watanabe (877L5ULMT9)"
	INSTALLER_KEY="3rd Party Mac Developer Installer: Hirofumi Watanabe (877L5ULMT9)"

	FRAMEWORKS_PATH="$APP_PATH/Contents/Frameworks"

	if [ x$SIGN == x1 ]; then
		./node_modules/.bin/electron-osx-sign --no-pre-auto-entitlements --version=1.2.0 "$APP_PATH" --entitlements=dev/parent.plist --entitlements-inherit=dev/child.plist --identity="$APP_KEY"
		productbuild --component "$APP_PATH" /Applications --sign "$INSTALLER_KEY" "$RESULT_PATH"
	else
#		if [ x$SANDBOX == x0 ]; then
#			echo "not SANDBOXed"
#		else
			./node_modules/.bin/electron-osx-sign --no-pre-auto-entitlements --platform=mas --version=1.2.0 "$APP_PATH" --entitlements=dev/parent.plist --entitlements-inherit=dev/child.plist --identity="-"
			productbuild --component "$APP_PATH" /Applications "$RESULT_PATH"
#		fi
	fi
fi


### Windows

if [ x$SKIP_WIN != x1 ]; then
#	electron-packager . Chemr \
#		--out build \
#		--icon=assets/win/icon.ico \
#		--platform=win32 \
#		--arch=ia32 \
#		--version=$ELECTRON_VERSION \
#		--version-string.ProductName="Chemr" \
#		--version-string.ProductVersion="$version" \
#		--ignore=build \
#		--app-version=$version

#	cp dev/Chemr.exe.manifest build/Chemr-win32-ia32/
#	cp dev/installer.nsi.tpl node_modules/electron-builder/templates/installer.nsi.tpl

	./node_modules/.bin/build \
		--dist \
		--platform=win
fi
