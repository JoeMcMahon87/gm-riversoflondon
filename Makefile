default: clean install run

build:
	yarn run build

run:
	yarn vite

install:
	yarn install

clean:
	rm -rf node_modules

test:
	yarn test

check-version:
	yarn check:version
