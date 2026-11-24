# Toolchain image for dialectic-playground/ts: TypeScript (container-first; see tools/dp-run).
#
# Node.js 24 (LTS); TypeScript via tsc as a project dependency; build and package tool: npm + tsc.
# Official base image pinned by multi-architecture index digest, plus make and python3 (for the
# curriculum's black-box runner). Dependabot (docker) refreshes the digest; moving to a new
# release line is a deliberate change (keep `make toolchain` and the native CI in step).
FROM docker.io/library/node:24-trixie-slim@sha256:af02d57b57719b9657a45199a79264a9437940cd55b3c7b3fc99615654f124a0

# Debian keeps only the current version of each package, so apt versions cannot be pinned
# reproducibly; the base image is pinned by digest instead.
# hadolint ignore=DL3008
RUN apt-get update \
    && apt-get install -y --no-install-recommends make python3 \
    && rm -rf /var/lib/apt/lists/*

ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    DP_IN_CONTAINER=1
