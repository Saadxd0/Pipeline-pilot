# ── Frontend Dockerfile ───────────────────────────────────────────────────────
# Multi-stage build: build the React app with Node, then serve it with Nginx.

# ── Stage 1: Node build ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for better cache utilisation
COPY package.json package-lock.json* ./
RUN npm ci --silent

# Copy source and build the production bundle
COPY . .
RUN npm run build
# Output is in /app/dist


# ── Stage 2: Nginx runtime ────────────────────────────────────────────────────
FROM nginx:1.26-alpine

# Remove default Nginx placeholder page
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom Nginx config that handles SPA routing (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
