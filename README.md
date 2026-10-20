# seha-sa-

Netlify runs `npm run build` and publishes `dist/`. The preparation script copies
the HTML, styles, JavaScript, and image assets into a clean output directory and
fails if required source files are missing. Do not deploy the partial `dist/`
snapshot without preparing it first.

API handlers are deployed separately from `netlify/functions/` using the routes
in `netlify.toml`. Server code, data files, and source archives are not copied
into the public site.
