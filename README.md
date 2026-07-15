# RenovaBit Landing

Landing page corporativa para **RenovaBit** — servicio técnico de laptops y PCs en Arequipa, Perú.

## 🚀 Stack

| Capa | Tecnología |
|------|-----------|
| Framework | [Astro 7](https://astro.build) |
| UI Components | [Preact 10](https://preactjs.com) |
| Estilos | [Tailwind CSS v4](https://tailwindcss.com) |
| Íconos | [Hugeicons](https://hugeicons.com) via astro-icon |
| Linting | [Biome 2.4](https://biomejs.dev) |
| Deploy | [Cloudflare Workers](https://workers.cloudflare.com) |
| Package Manager | [Bun](https://bun.sh) |
| Maps | Google Maps JS API + `@googlemaps/js-api-loader` |
| Animaciones | `tailwind-animations` + `tw-animate-css` + `@astroanimate/core` |
| SEO | `@jdevalk/astro-seo-graph` + `@astrojs/sitemap` |
| Fuente | Satoshi (self-hosted, 8 variantes WOFF2) |

## 📋 Secciones

- **Hero** — Grid de imágenes 2×2 con value prop y CTAs
- **About** — Stats animados + imagen antes/después
- **Servicios** — 4 servicios con grid posicionado
- **Empresas** — Features B2B + logos de clientes en marquee
- **Proceso** — 5 filas alternadas con imágenes reales del taller
- **Timeline** — 5 pasos con íconos Hugeicons
- **Testimonios** — 2 reseñas con fotos reales antes/después
- **FAQ** — 8 preguntas con accordion (`@data-slot/accordion`)
- **CTA** — Banner púrpura con WhatsApp
- **Footer** — Mapa, contacto, redes sociales

## 🔍 SEO

- **JSON-LD**: LocalBusiness, FAQPage, BreadcrumbList
- **Open Graph**: 1200×630 JPG + Twitter Card
- **Sitemap**: `@astrojs/sitemap` con índice + `<link rel="sitemap">`
- **Validación automática**: 5 checks en cada build (H1, alt texts, metadata, internal links)
- **Robots**: dinámico (`noindex` en dev, `index` en prod)

## 📸 Imágenes

- 23 imágenes de producción (AVIF optimizadas con ffmpeg)
- Componente `<Image />` de Astro con `srcset` responsivo
- LCP optimizado: `fetchpriority="high"` + preload + `decoding="sync"`
- Mapas: Google Maps con carga lazy (IntersectionObserver, 400px rootMargin)

## 🏗️ Estructura

```
src/
├── assets/
│   ├── branding/     # Logos vectoriales
│   ├── fonts/        # Satoshi WOFF2
│   └── images/       # Imágenes por sección + raw/
├── components/
│   ├── footer/       # MapRenovaBit (Preact)
│   ├── layout/       # Navbar, Footer
│   ├── sections/     # Hero, About, Services, ...
│   ├── seo/          # StructuredData (JSON-LD)
│   ├── social-icon/  # Iconos SVG (WhatsApp, IG, FB, TikTok)
│   └── ui/           # Button, Badge, Accordion, Rating, ...
├── layouts/
│   └── BaseLayout.astro
├── pages/
│   └── index.astro
├── styles/
│   └── landing.css   # Tailwind v4 + design tokens
├── constants.ts      # SITE, CONTACT, SOCIAL, FOOTER, FAQ_ITEMS
└── env.d.ts          # TypeScript references
```

## 🛠️ Comandos

```bash
bun run dev        # Desarrollo local (localhost:3000)
bun run build      # Build de producción
bun run check      # Type checking (astro check)
bun run check:biome # Linting + formatting
bun run cf:deploy  # Build + deploy a Cloudflare Workers
bun run preview    # Previsualizar build local
```

## 🚀 Deploy

### Desarrollo
```bash
bun run cf:deploy   # → dev.renovabit.com
```

### Producción
```bash
# 1. Cambiar en .env y wrangler.jsonc:
#    PUBLIC_INDEXABLE=true
#    pattern: "renovabit.com"

# 2. Google Maps API key (una sola vez)
bunx wrangler secret put PUBLIC_GOOGLE_MAPS_API_KEY

# 3. Deploy
bun run cf:deploy   # → renovabit.com
```

## 📝 Convenciones

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org) (`feat(ui):`, `fix(a11y):`, `refactor(ui):`)
- **Nombrado**: PascalCase para componentes, kebab-case para directorios
- **Íconos**: Solo Hugeicons via `<Icon name="hugeicons:icon-name" />`
- **Imágenes**: Solo AVIF, optimizadas a 800px (2x retina)
- **CSS**: Tailwind v4 con `@theme inline`, diseño via tokens oklch

## 🔒 Variables de entorno

```env
PUBLIC_GOOGLE_MAPS_API_KEY=    # API key de Google Maps
PUBLIC_INDEXABLE=true           # false en dev, true en prod
```
