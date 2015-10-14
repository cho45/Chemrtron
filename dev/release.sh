
version=$(cat VERSION);
echo "Release version: v$version"

hub release create \
	-a build/Chemr-$version-darwin-x64.dmg \
#	-a build/Chemr-$version-win32.dmg \
	v$version

