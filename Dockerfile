# Multi-stage Next.js build. Final image runs `node server.js` against
# the standalone output, so the runtime is ~150 MB instead of the full
# node_modules tree.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --prefer-offline

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Bundle contracts in advance so the runtime image doesn't need the
# Stoa sibling repo or the zipapp. stoa:bundle emits into ./contracts/
# which is picked up by lib/schema.ts at runtime.
# If the contracts directory is already populated (committed), this
# step is a no-op.
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Output directory for the persistent volume mount. Fly maps
# /data <- <volume>; make sure nextjs owns it.
RUN mkdir /data && chown nextjs:nodejs /data

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/contracts ./contracts
COPY --from=builder --chown=nextjs:nodejs /app/content ./content

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
