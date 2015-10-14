

.PHONY: package
package:
	./dev/package.sh

.PHONY: release
release: package
	./dev/release.sh
