# ─── Stage 1: Build ───────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Build ARGs for Vite environment variables
ARG VITE_SUPABASE_URL=https://jxvifnggjjmyjefudjuf.supabase.co
ARG VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_J1ALskQkLpRdnZM2JHVOcQ_k4IVNp-w
ARG VITE_SUPABASE_PROJECT_ID=jxvifnggjjmyjefudjuf

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID

# Install deps first (cache layer)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY . .
RUN npm run build

# ─── Stage 2: Serve with nginx (proper cache headers) ────────
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
