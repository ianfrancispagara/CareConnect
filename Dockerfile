# ==========================================
# Room 1: Install Dependencies (The 'deps' stage)
# ==========================================
FROM node:20-alpine AS deps
# Alpine is a super lightweight version of Linux
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package managers and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# ==========================================
# Room 2: Build the App (The 'builder' stage)
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Next.js app
RUN npm run build

# ==========================================
# Room 3: Ship It (The 'runner' stage)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
# Next.js telemetry is optional, but good to disable in Docker
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the public folder directly
COPY --from=builder /app/public ./public

# Copy the standalone build (the stripped-down app we configured in Step 1)
# and set the correct permissions
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to the secure user
USER nextjs

# Expose the port Next.js runs on
EXPOSE 3000

# Tell Docker how to start the app
CMD ["node", "server.js"]