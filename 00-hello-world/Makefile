# 00-hello-world: Standard Terminal Hello World, in TypeScript.
#
# Extends the universal build contract in shared/templates/BASE-MAKEFILE:
#
#   make all | install | uninstall | test | check | lint | format | clean | distclean
#   make test-hidden | grade | help
#
# Toolchain: Node.js 24 + npm. package.json and the committed package-lock.json in this
# directory pin the dev tools (typescript, eslint + typescript-eslint, prettier, @types/node);
# `npm ci` installs them into node_modules/ whenever the lockfile is newer than the install.
# Sources and node:test unit tests live in src/ (tests in src/test/); tsc compiles them to
# dist/ as ES modules, and the unit tests run on that compiled output.
#
# BIN_DIR is bin/, which holds the committed, executable launcher bin/dp-hello: a
# `#!/usr/bin/env node` script that imports ../dist/main.js.
#
# Install: the compiled program (dist/*.js, without the tests) plus a package.json that marks
# it as ES modules go to $(LIBDIR)/ts/00-hello-world/, and a `#!/bin/sh` launcher that runs
# it with node (absolute path baked in) goes to $(BINDIR)/dp-hello. Uninstall removes both.
#
# Container-first: goals run in the toolchain container built from the repository's
# Containerfile (podman, then docker, then local; override with DP_RUNTIME).

PROJECT := 00-hello-world
TOOLS   := dp-hello

# Path to the sdlc-curriculum checkout (the specs, test suites, and runner live there).
CURRICULUM_ROOT ?= ../sdlc-curriculum

NODE ?= node
NPM  ?= npm

# Run the locked tools through node directly (no npx, no .cmd shims on Windows).
TSC      = $(NODE) node_modules/typescript/bin/tsc
ESLINT   = $(NODE) node_modules/eslint/bin/eslint.js
PRETTIER = $(NODE) node_modules/prettier/bin/prettier.cjs

# Install the locked dev dependencies unless node_modules is already up to date.
NPM_CI = [ node_modules/.package-lock.json -nt package-lock.json ] \
	|| $(NPM) ci --ignore-scripts --no-audit --no-fund

# Directory that contains the built executables after `make all`.
BIN_DIR := bin

# Where `make install` puts the payload (see the header).
INSTALL_DIR = $(LIBDIR)/ts/$(PROJECT)

define DP_BUILD
$(NPM_CI)
rm -rf dist
$(TSC) -p tsconfig.json
endef

define DP_UNIT_TEST
$(DP_BUILD)
$(NODE) --test "dist/test/**/*.test.js"
endef

define DP_LINT
$(NPM_CI)
$(TSC) -p tsconfig.json --noEmit
$(ESLINT) --max-warnings 0 .
$(PRETTIER) --check .
endef

define DP_FORMAT
$(NPM_CI)
$(PRETTIER) --write .
endef

define DP_INSTALL
rm -rf "$(INSTALL_DIR)"
mkdir -p "$(INSTALL_DIR)" "$(BINDIR)"
cp dist/*.js "$(INSTALL_DIR)/"
printf '{ "type": "module" }\n' > "$(INSTALL_DIR)/package.json"
printf '#!/bin/sh\nexec node %s "$$@"\n' "'$(INSTALL_DIR)/main.js'" > "$(BINDIR)/dp-hello"
chmod +x "$(BINDIR)/dp-hello"
"$(BINDIR)/dp-hello" --version
endef

define DP_UNINSTALL
rm -f "$(BINDIR)/dp-hello"
rm -rf "$(INSTALL_DIR)"
rmdir "$(LIBDIR)/ts" "$(LIBDIR)" 2>/dev/null || true
endef

DP_CLEAN = rm -rf dist

DP_DISTCLEAN = rm -rf node_modules

include $(CURRICULUM_ROOT)/shared/templates/BASE-MAKEFILE
