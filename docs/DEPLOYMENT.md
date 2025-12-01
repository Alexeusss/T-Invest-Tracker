# Deployment Guide for T-Invest Tracker

Currently, this application is structured in a "Playground" format designed for rapid prototyping in browser-based environments. To deploy it to production platforms like Google Cloud Run or Vercel, you must first convert it into a standard production React application using Vite.

## Phase 1: Preparation (Convert to Production App)

Before deploying to either platform, create the following configuration files in your project root to enable the build process.

### 1. Create `package.json`
This file defines project dependencies and scripts.

```json
{
  "name": "t-invest-tracker",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "lucide-react": "^0.344.0",
    "recharts": "^2.12.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.64",
    "@types/react-dom": "^18.2.21",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.4.2",
    "vite": "^5.1.5"
  }
}
```

### 2. Create `vite.config.ts`
This configures the build tool.

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

### 3. Create `tailwind.config.js`
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 4. Create `postcss.config.js`
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 5. Update `index.html`
**Important:** Modify your existing `index.html`. Remove the `<script type="importmap">` block and the CDN script for Tailwind. Replace them with the standard Vite entry point inside the `<body>`.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>T-Invest Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <!-- Point to your existing index.tsx -->
    <script type="module" src="/index.tsx"></script>
  </body>
</html>
```

### 6. Install Dependencies
Run the following command in your terminal to install the libraries:
```bash
npm install
```

---

## Option 1: Deploy to Google Cloud Run

Google Cloud Run requires your application to be containerized using Docker.

### 1. Create a `Dockerfile`
Create a file named `Dockerfile` (no extension) in the root directory:

```dockerfile
# Stage 1: Build the React Application
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine
# Copy built assets from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html
# Add Nginx config to handle React Router (Single Page App routing)
RUN echo 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. Build and Deploy
Assuming you have the Google Cloud CLI (`gcloud`) installed and configured:

1.  **Build the Container Image:**
    ```bash
    gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/t-invest-tracker
    ```
    *(Replace `YOUR_PROJECT_ID` with your actual Google Cloud Project ID)*

2.  **Deploy to Cloud Run:**
    ```bash
    gcloud run deploy t-invest-tracker \
      --image gcr.io/YOUR_PROJECT_ID/t-invest-tracker \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated
    ```

3.  **Access:**
    The console will output a service URL (e.g., `https://t-invest-tracker-xyz-uc.a.run.app`) where your app is live.

---

## Option 2: Deploy via GitHub & Vercel

Vercel is a popular platform for deploying frontend applications directly from GitHub.

1.  **Push Code to GitHub:**
    - Initialize a git repository: `git init`
    - Create a `.gitignore` file and add `node_modules` and `dist` to it.
    - Commit your files:
      ```bash
      git add .
      git commit -m "Initial commit"
      ```
    - Push to a new repository on GitHub.

2.  **Import Project in Vercel:**
    - Go to [Vercel Dashboard](https://vercel.com/dashboard).
    - Click **"Add New..."** -> **"Project"**.
    - Select your GitHub repository (`t-invest-tracker`).

3.  **Configure Build Settings:**
    - **Framework Preset:** Vercel should automatically detect **Vite**.
    - **Root Directory:** `./` (Leave default)
    - **Build Command:** `npm run build`
    - **Output Directory:** `dist`

4.  **Deploy:**
    - Click **Deploy**.
    - Vercel will run the build process and provide you with a production URL (e.g., `https://t-invest-tracker.vercel.app`).
    - Future pushes to the `main` branch on GitHub will trigger automatic redeployments.
