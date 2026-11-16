# Shakthi Enterprises website

Eight-page company website and animated catalogue reader for Firebase Hosting project `shakthi-enterprises-2df21`.

- Website: https://shakthi-enterprises-2df21.web.app/
- Catalogue reader / QR destination: https://shakthi-enterprises-2df21.web.app/catalogue
- Original PDF: `/catalogue.pdf`
- QR files: `public/assets/catalogue-qr.png` and `catalogue-qr.svg`

## Publish

With an authenticated Firebase CLI account that has access to this project, run from this directory:

    firebase deploy --only hosting --project shakthi-enterprises-2df21

No build step, paid SDK, database, or Firebase client API key is required for the website. Hosting uses `.firebaserc` and `firebase.json`. Analytics is not enabled.

## Pages and interactions

Home, Our Story, Services, Infrastructure, Materials, Quality, Contact and Catalogue each have their own URL. The homepage has an automatic three-slide carousel with manual controls and pause behavior. Scroll reveals respect reduced-motion preferences. Infrastructure includes equipment category filters and accessible enlarged-image dialogs.

The catalogue uses animated two-page spreads on desktop and individual pages on smaller screens. It supports chapter selections, keyboard arrows, touch swipes, enlarged pages and reduced motion. The reader also includes paper-edge shadows, page-edge navigation buttons, an opt-in automatic preview, a progress indicator and a focused reading mode. Catalogue-specific presentation is in `public/catalogue-experience.css`. The QR destination is unchanged.

## Content and updates

`build_site.py` generates the eight HTML pages from reusable templates and `content-original.html`, which preserves the approved brochure-based content. Run it with Python after changing content. Shared styling is in `public/styles.css` and `public/experience.css`; interactions are in `public/app.js`, `public/experience.js` and `public/flipbook-v2.js`. There is no runtime build dependency: Firebase serves the resulting `public` directory directly. Site content and images are based on the supplied brochure and user-provided images. The WhatsApp enquiry form prepares a message for the visitor to review and send; submissions are not stored by this site.

The brochure reader uses eight JPEG page images for fast viewing and keeps the original PDF available for download. To update the catalogue, replace `public/catalogue.pdf` and regenerate `public/assets/page-1.jpg` through `page-8.jpg`. Keep the reader URL stable to preserve printed QR codes. Update page titles/count and spread definitions if the document structure changes. `prepare_assets.py` records selected source image paths and QR generation; it requires Pillow and ReportLab and the original local image files. If running that asset helper, always run `build_site.py` afterwards to generate the current animated catalogue instead of the earlier static reader.

The PDF lists an earlier website/domain; the supplied original has been preserved unchanged. The live website uses the Firebase address above.

