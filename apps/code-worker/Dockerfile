# Base image for node
FROM node:20-alpine AS base
# Install Git since code-worker needs simple-git to clone and commit code
RUN apk add --no-cache git
# Set up pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Builder stage
FROM base AS builder
# Set working directory
WORKDIR /app
# Install turbo
RUN npm install -g turbo

COPY . .
# Prune the workspace to only include the code-worker and its dependencies
RUN turbo prune @shipflow/code-worker --docker

# Installer stage
FROM base AS installer
WORKDIR /app

# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# Build the project
COPY --from=builder /app/out/full/ .
RUN pnpm turbo run build --filter=@shipflow/code-worker...

# Runner stage
FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 shipflow

# Copy built artifacts from installer
COPY --from=installer --chown=shipflow:nodejs /app .

# Set to the application directory
WORKDIR /app/apps/code-worker

# Run as non-root user
USER shipflow

EXPOSE 8000

CMD ["pnpm", "start"]
