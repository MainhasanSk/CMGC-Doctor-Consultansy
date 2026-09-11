# Hostinger Shared Hosting Deployment Guide for CMGC WebApp

This guide explains how to deploy the **Chennai Medical Guidance Centre (CMGC)** web application to **Hostinger Shared Hosting** (or any LiteSpeed/cPanel web hosting).

---

## 1. What Has Been Configured

1. **Vite Production Bundler & Code Splitting (`vite.config.ts`)**:
   - Optimized separate vendor bundles (`react`, `firebase`, `jspdf`) so the site loads fast on shared hosting.
   - Built to output directly into the `dist/` directory.

2. **LiteSpeed / Apache SPA Routing (`public/.htaccess`)**:
   - Handles React SPA client-side routing so refreshing `/login`, `/admin/dashboard`, or `/franchise/consultations` will **never return a 404 error**.
   - Includes **Gzip/Deflate compression** to minimize data transfer.
   - Includes **Browser caching** for static assets (`.js`, `.css`, images, fonts).
   - Includes essential **Security headers** (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).
   - Automatically copied into `dist/.htaccess` every time you build.

---

## 2. Step-by-Step Deployment Instructions

### Step A: Build the Project Locally

Open terminal in the project root and run:
```bash
npm run build
```
This generates the production files inside the `dist/` folder:
- `dist/index.html`
- `dist/.htaccess` (important: must be uploaded!)
- `dist/assets/` (all compiled CSS and JS chunks)
- `dist/logo.png`
- `dist/logo-footer.png`

---

### Step B: Upload to Hostinger via File Manager

1. Log in to your [Hostinger hPanel](https://hpanel.hostinger.com).
2. Go to **Websites** and click **Manage** next to your domain.
3. In the sidebar, search for and open **File Manager** (Files -> File Manager).
4. Select **Access files of [your domain]** and open the `public_html` directory.
5. If there is a default `default.php` file inside `public_html`, delete it.
6. **Upload the files**:
   - **Option 1 (Fastest via Zip)**:
     - Zip the contents inside your local `dist/` folder (select everything inside `dist`, right click -> *Compress to ZIP file*).
     - In Hostinger File Manager, click the **Upload** icon -> select your `.zip` file.
     - Right-click the uploaded `.zip` in `public_html` and click **Extract**.
     - Delete the `.zip` file after extraction.
   - **Option 2 (Direct folder upload)**:
     - Drag and drop all files and the `assets` folder from `dist/` directly into `public_html`.
7. **Verify `.htaccess` is present**:
   - In Hostinger File Manager, ensure hidden files are enabled (Settings icon in top-right -> check *Show Hidden Files (dotfiles)*).
   - Confirm `.htaccess` is sitting in `public_html/.htaccess`.

---

### Step C: Activate Free SSL Certificate (Required for Video & Camera)

Since CMGC uses video consultations (WebRTC / Google Meet) and camera uploads, modern browsers block camera and microphone access on insecure (HTTP) sites.

1. In Hostinger hPanel, go to **Security** -> **SSL**.
2. Click **Install SSL** on your domain (Hostinger provides free unlimited Let's Encrypt SSL).
3. Toggle on **Force HTTPS** in Hostinger's SSL settings.

---

### Step D: Whitelist Domain in Firebase Authentication

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: **cmgcvideoconsultation**.
3. Navigate to **Authentication** -> **Settings** tab -> **Authorized domains**.
4. Click **Add domain** and enter your Hostinger domain (e.g., `yourdomain.com` or `consult.cmgc.in`).
5. Click **Save**.

---

### Step E: Test Your Deployment

1. Visit `https://yourdomain.com` -> The CMGC landing page should display.
2. Click **Access Medical Portal** or **Sign In to Portal** -> Redirects to `https://yourdomain.com/login`.
3. Press **F5 (Refresh)** on `https://yourdomain.com/login` -> Verify it reloads cleanly without a 404 error.
4. Log in as an Admin, Franchise, or Doctor -> Verify dashboard loads and video consultation functions work smoothly.
