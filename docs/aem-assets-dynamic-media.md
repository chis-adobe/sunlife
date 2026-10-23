# AEM Assets and Dynamic Media

AEM Assets (`/content/dam/sunlife` on `author-p130746-e1275972`) is the source of truth for imagery.
Blocks never hard-code images: every image is authored content, so an author can swap it for any AEM Assets
image without a code change.

## How images render

`decorateDynamicMedia()` in `scripts/scripts.js` runs before blocks are decorated. Any image whose URL is a
Dynamic Media (OpenAPI) delivery URL:

```
https://delivery-p130746-e1275972.adobeaemcloud.com/adobe/assets/urn:aaid:aem:<asset-id>/as/<name>.jpg
```

whether authored as an image or as a link (asset picker "link" mode), becomes a responsive `<picture>`
with AVIF and WebP renditions at 750px and 2000px (`createDynamicMediaPicture()`). Blocks that re-optimise
images (`cards`, `card-carousel`) skip Dynamic Media pictures. Non-image assets (e.g. PDFs) stay links.

## Enable the AEM Assets picker in Document Authoring

In the site's DA configuration (`https://da.live/config#/chis-adobe/sunlife/`), add:

| key | value |
| --- | --- |
| `aem.repositoryId` | `author-p130746-e1275972.adobeaemcloud.com` |
| `aem.assets.prod.origin` | `delivery-p130746-e1275972.adobeaemcloud.com` |
| `aem.asset.dm.delivery` | `on` |

Check the key names against the current Document Authoring AEM Assets setup guide before applying.

## Homepage assets

`tools/importer/dam-asset-map.json` lists the DAM path of every homepage image (the source site serves them
from the same `/content/dam/sunlife/...` paths), so each can be re-picked from AEM Assets.
