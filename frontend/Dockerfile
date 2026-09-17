# Local development image for the Next.js site (production is built and served by Vercel).
FROM oven/bun:1.3.3-alpine

WORKDIR /app

# Install dependencies first for better layer caching. bunfig.toml pins exact versions.
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000

# --hostname 0.0.0.0 so the port mapping reaches it; next binds localhost by default.
CMD ["bun", "run", "dev", "--hostname", "0.0.0.0"]
