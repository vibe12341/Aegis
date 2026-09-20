# Aegis on Hugging Face Spaces (Docker SDK, free CPU tier)
FROM node:20-slim

WORKDIR /app

# Install dependencies first (cached layer) — includes devDependencies,
# which this app needs at runtime (transformers.js, pdf-parse).
COPY package.json package-lock.json ./
RUN npm ci

# Copy sources and build. node_modules/dist are excluded via .dockerignore
# so the container always gets Linux binaries from npm ci, never host ones.
COPY . .
RUN npm run build

# HF Spaces routes traffic to port 7860 by default.
ENV PORT=7860
EXPOSE 7860

CMD ["npm", "start"]
