# Rayno New Vision Maintenance - website

Server-rendered website + admin page for Netlify (Netlify Functions v2 + Netlify Blobs).
No build step, no frameworks, no external fonts or libraries.

## Setup for the owner (no coding needed)

1. **Put the files on GitHub.** Create a free account at github.com, click "New repository", name it
   `rayno-website`, then "uploading an existing file" and drag in everything from the unzipped folder
   (keep the folders `public`, `netlify`, `tests` and the files `netlify.toml`, `package.json`). Click "Commit changes".
2. **Import in Netlify.** Create a free account at netlify.com, then "Add new site" > "Import an existing project" >
   GitHub > pick `rayno-website`. Leave build command empty; Netlify reads `netlify.toml`. Click "Deploy".
3. **Add your admin password.** In Netlify: Site configuration > Environment variables > "Add a variable".
   Key: `ADMIN_PASSWORD`. Value: a long password of **at least 10 characters** that only you know. Save.
4. **Redeploy.** Deploys > "Trigger deploy" > "Deploy site". (The password is only picked up after a new deploy.)
5. **Open `/admin/`.** Go to `https://YOUR-SITE.netlify.app/admin/` and log in.
6. **Fill in your details.** Replace the [PLACEHOLDER] text, add photos, check the phone/email. Press **Save draft**,
   **Preview**, then **Approve & Publish**.
7. **Set the real domain.** Admin > Search tab > "Website address" (e.g. `https://www.yourdomain.co.za`). Publish.
8. **Connect your domain.** Netlify > Domain management > "Add a domain" and follow the steps (you point the domain's
   DNS at Netlify at your registrar). Wait for the HTTPS certificate, then confirm step 7 is done.

## How editing works
Save draft (private) -> Preview (real site with a yellow banner, only visible when you are logged in) ->
Approve & Publish (shows what will change). Each publish keeps a backup of the previous live site (last 20);
"Earlier versions" loads any of them as a draft. Nothing is ever downloaded or uploaded as a file.

## Photos
Paste direct image links in the Gallery tab (one per line, up to 200). Use Cloudinary or similar image hosting.
Links from Google Drive/Photos, Facebook, Instagram or WhatsApp stop working for visitors - the admin warns you.

## Project layout
- `public/` static files: `css/`, `js/`, `admin/`, `404.html`, plus `index.html` and `services/*.html` (safety-net copies made by `scripts/prerender.mjs`; the live function overrides them)
- `netlify/functions/site.mjs` renders `/`, `/gallery.html`, `/services/*.html`, `/sitemap.xml`, `/robots.txt`
- `netlify/functions/admin-api.mjs` the admin API at `/api/admin/*`
- `netlify/lib/` content defaults, sanitiser, renderer, auth, handlers
- `tests/run.mjs` automated tests (`node tests/run.mjs`, Node 18+, no install needed)

## Security notes
Password from `ADMIN_PASSWORD`; HMAC-signed session cookie (HttpOnly, Secure, SameSite=Strict, 8 hours);
5 wrong attempts per IP = 15 minute lock; all POSTs need `X-Admin-Request: 1` + JSON; all saved text is sanitised
server-side and HTML-escaped on output. Changing `ADMIN_PASSWORD` logs everyone out.
