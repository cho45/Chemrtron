.PHONY: package mac win linux clean dev build

dev:
	npm run dev

build:
	npm run build

package:
	npm run build:unpack

mac:
	npm run build:mac

win:
	npm run build:win

linux:
	npm run build:linux

clean:
	rm -rf dist out