# syntax=docker/dockerfile:1
# iGuide CMS: build the SPA with Vite+, serve dist/ with unprivileged nginx. One image serves every
# environment: docker/docker-entrypoint.sh writes config.js from the environment at start (G-015).
#
# Base images are pinned by tag and digest; update both together
# (`docker buildx imagetools inspect <image>:<tag>` prints the digest).

FROM ghcr.io/voidzero-dev/vite-plus:1.5.1@sha256:068d824d8d8184c39defc266795d3ade452bfc5266603d25d81aeeedbedf8973 AS build
WORKDIR /app
# No git hooks inside an image build (a `prepare: vp config` script would try to install them).
ENV VP_GIT_HOOKS=0
# Dependencies first, so this layer is reused while only sources change.
# vp reads .node-version and provisions exactly that Node; pnpm comes from packageManager.
COPY --chown=vp:vp package.json pnpm-lock.yaml pnpm-workspace.yaml .node-version ./
RUN vp install --frozen-lockfile
COPY --chown=vp:vp . .
# The build script runs vue-tsc and then vite build; plain `vp build` would skip the type check.
RUN vp run build

FROM nginxinc/nginx-unprivileged:1.30-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03 AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
# The base image runs /docker-entrypoint.d/*.sh before starting nginx; a failing script stops the start.
COPY --chmod=755 docker/docker-entrypoint.sh /docker-entrypoint.d/99-iguide-config.sh
# nginx runs as uid 101; config.js is the only file it may rewrite.
USER root
RUN chown 101:101 /usr/share/nginx/html/config.js
USER 101
EXPOSE 8080
