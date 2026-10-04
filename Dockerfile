# ---------- Build stage ----------
FROM node:22-alpine AS build
WORKDIR /app

# Copy manifests first so dependency installs are cached between builds
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN npm ci

COPY . .
RUN npx turbo run build --filter=api --filter=web

# ---------- Runtime stage ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Production dependencies of the API only (plus the linked shared package)
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN npm ci --omit=dev --workspace=api && npm cache clean --force

# Built output, keeping the same layout as the repo
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/fonts ./apps/api/fonts
COPY --from=build /app/apps/web/dist ./apps/web/dist

# The PDF printer loads fonts/ relative to the working directory
WORKDIR /app/apps/api
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
