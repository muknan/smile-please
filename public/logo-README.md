# Logo

`public/logo.svg` is the supplied fixed asset (`252×60`, outline wordmark).

- Arch apex sits at `y=2` so the stroke is not clipped.
- Wordmark is outlined paths — an SVG loaded through `<img>`/`next/image` cannot
  use the page's webfonts, so outlines render identically on every device.
- Colour is baked `#12302A` (`neem-900`). `currentColor` does not flow through
  `<img>`. The footer recolours it via CSS `filter: brightness(0) invert(1)`.

Usage:
- Header: `components/site/SiteHeader.tsx`
- Footer: `components/site/SiteFooter.tsx`

The original placeholder asset was overwritten before an archive copy could be
kept — restore it from git history if needed (`git show HEAD:public/logo.svg`).
