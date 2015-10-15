
version=$(cat VERSION);
echo "Release version: v$version"

#hub release create \
#	-a build/Chemr-$version-darwin-x64.dmg \
#	v$version


ghr v$version build/releases

