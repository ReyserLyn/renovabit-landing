# RenovaBit Landing — Agent Memory

> Landing page standalone para servicio técnico de laptops y PCs en Arequipa.
> Framework: Astro 7 | UI: Preact | Styling: Tailwind CSS v4 | Icons: Hugeicons via astro-icon
> Linting/Formatting: Biome 2 (sin Prettier ni ESLint)
> Deploy: Cloudflare Workers (via @astrojs/cloudflare)
> Package Manager: Bun 1.3

---

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Astro 7 (`compressHTML: true`, tradicional) |
| UI Components | Preact 10 (`jsxImportSource: preact`, `jsx: react-jsx`) |
| Styling | Tailwind CSS v4 (`@import "tailwindcss"`, Vite plugin) |
| Icons | astro-icon + @iconify-json/hugeicons (include: `{ hugeicons: ["*"] }`) |
| Linting/Formatting | Biome 2.4 (standalone, `root: true`) |
| Sitemap | @astrojs/sitemap |
| Package Manager | Bun |
| Bundler | Vite 8 — Rolldown (via Astro 7) |
| Deploy | Cloudflare Workers (@astrojs/cloudflare + wrangler) |
| TypeScript | ^6.0.3 (strict) — `verbatimModuleSyntax: true` |

### Biome (único formatter/linter)
- `root: true` standalone — no extiende nada externo
- `html.experimentalFullSupportEnabled: true` — soporte completo para `.astro`
- `css.parser.tailwindDirectives: true` — entiende `@theme`, `@utility`, etc.
- `formatter.indentStyle: tab`, `lineWidth: 100`
- `javascript.formatter.quoteStyle: "double"`
- `assist.organizeImports: "on"`
- Override para `*.astro`: desactiva `useConst`, `useImportType`, `noUnusedVariables`, `noUnusedImports`
- Override para `*.ts/tsx`: reglas TS estándar

### Scripts
```sh
bun run dev           # wrangler types && astro dev → localhost:3000
bun run build         # wrangler types && astro check && astro build
bun run preview       # wrangler types && astro preview (workerd runtime)
bun run check         # astro check (type checking)
bun run check:biome   # biome check . --write
bun run cf:types      # wrangler types → worker-configuration.d.ts
bun run cf:deploy     # astro build && wrangler deploy (a Cloudflare Workers)
```

### Git Hooks (lefthook)
- **pre-commit**: `biome check --write` sobre staged files
- **commit-msg**: commitlint con `@commitlint/config-conventional`
- **pre-push**: `biome check .` + `astro check` (type checking)

---

## Arquitectura del Proyecto

```
src/
├── constants.ts           # SITE, CONTACT, SOCIAL, NAV_ITEMS
├── layouts/
│   └── BaseLayout.astro   # HTML shell: <html lang="es">, slot, CSS global
├── pages/
│   └── index.astro         # Home page (esqueleto inicial)
├── styles/
│   └── landing.css         # @import "tailwindcss"
├── components/
│   └── social-icon/        # FacebookIcon, InstagramIcon, TikTokIcon, WhatsappIcon (.astro)
└── assets/
    ├── branding/           # logo-horizontal-dark.svg, logo-horizontal-light.svg
    └── images/
        ├── hero/           # 3 .avif
        ├── about/          # 2 archivos
        ├── services/       # 3 .avif
        └── testimonials/   # 1 .avif
```

### Path Alias
- `@/*` → `./src/*` (configurado en `tsconfig.json`)

---

## Convenciones de Código

### Commits (Conventional Commits)
```
<type>(<scope>): <description>
```
- **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- **Scopes**: `ui`, `seo`, `content`, `a11y`, `perf`, `deps`, `ci`, `repo`
- Header ≤ 72 chars, imperative mood, lowercase, sin punto final

### Nombramiento
- Componentes Astro/Preact: PascalCase (`HeroSection.astro`, `ServiceCard.tsx`)
- Archivos de utilidades: camelCase (`constants.ts`)
- Directorios de componentes: kebab-case (`social-icon/`)
- Assets: kebab-case (`logo-horizontal-dark.svg`)

### Iconos
- Usar exclusivamente Hugeicons via `<Icon name="hugeicons:icon-name" />` (astro-icon)
- Para autocompletado: `bun astro sync` genera tipos
- NO usar emojis en lugar de iconos
- NO hand-rolled SVGs para iconos

### Estilos
- Tailwind CSS v4 con `@import "tailwindcss"`
- NO PostCSS plugin — usar `@tailwindcss/vite` (Vite plugin)
- Preferir CSS Grid sobre flexbox percentage-math
- Preferir `min-h-[100dvh]` sobre `h-screen`
- Contenedor página: `max-w-[1400px] mx-auto` o `max-w-7xl`

---

## Decisiones Técnicas Importantes

1. **Biome es el ÚNICO formatter/linter.** No hay Prettier ni ESLint. No agregar.
2. **`compressHTML: "jsx"`** — Astro 7 con Rust compiler: JSX whitespace handling. Usar `{' '}` para preservar espacios entre inline elements.
3. **Preact** — No necesita `@preact/compat` a menos que se requieran APIs específicas de React.
4. **Tailwind v4** — Sintaxis nueva. NO usar `tailwind.config.js`, NO usar `@apply` (preferir utilidades directas).
5. **Hugeicons con astro-icon** — Para tipos: `bun astro sync`. Autocompletado en editor.
6. **Iconos sociales** — Actualmente en componentes `.astro` separados (`src/components/social-icon/`). Si se necesita interactividad, migrar a Preact.
7. **Standalone project** — No es monorepo. `biome.json` con `root: true` funciona sin conflictos.
8. **Zed config** — Biome como formatter para Astro, CSS, JSON, JS, TS, TSX. Tailwind LSP configurado para Astro.
9. **Cloudflare Workers** — Adapter `@astrojs/cloudflare` v14 con output static (modo por defecto en Astro 7, reemplaza hybrid). `wrangler.jsonc` con `assets.directory` y `nodejs_compat`. `wrangler types` genera `worker-configuration.d.ts`. Dev server usa workerd runtime.
10. **Despliegue**: `bun run cf:deploy` o manual: `astro build && wrangler deploy`. El adapter genera `_headers` para cache-control en assets hasheados. Para añadir SSR en el futuro (contact form, API), marcar rutas con `export const prerender = false` — Astro 7 static mode lo soporta.
11. **Astro 7 cambios importantes**: Rust compiler (no más Go), JSX whitespace default, Vite 8 con Rolldown, Sätteri para Markdown, `output: 'hybrid'` eliminado (static lo reemplaza). `compressHTML: true` ya no es compatible — usar `"jsx"`.

---

## Diseño y UX — Guías Aplicables

### Audiencia y Propósito
- Landing page B2C local — servicio técnico en Arequipa
- Audiencia: consumidores que buscan reparación de laptops/PCs
- Tono: profesional, confiable, local (es_PE)
- Paleta: Definir basada en branding existente (logos dark/light disponibles)

### Layout
- Hero con value prop claro + CTA visible sin scroll
- Secciones: Hero, Servicios, Sobre nosotros, Testimonios, Contacto/WhatsApp
- Mobile-first responsive — colapsar a single-column en <768px
- Navegación simple (few items), max 80px height, single-line desktop

### Performance
- Imágenes en AVIF (formato óptimo ya elegido)
- Fuentes: self-hosted o `next/font`-style (no Google Fonts CDN links)
- LCP < 2.5s (hero image preloaded)
- CLS < 0.1 (reserve space for images)

### Animaciones
- Preferir CSS transitions con cubic-beziers custom sobre `linear`/`ease-in-out`
- Scroll reveals con `IntersectionObserver` o Motion's `whileInView`
- NO `window.addEventListener('scroll')` — usar IntersectionObserver o Motion
- Animar solo `transform` y `opacity`
- Respetar `prefers-reduced-motion`

### Anti-patrones (evitar)
- Inter como fuente default (preferir Geist, Satoshi, Cabinet Grotesk, o brand font)
- Gradientes púrpura/AI
- 3 columnas iguales de features
- Sombras negras genéricas (`rgba(0,0,0,0.3)`)
- Em-dashes (`—`) visibles
- Nombres genéricos (John Doe, Acme, etc.)
- SVG illustrations hechas a mano
- Fake product previews con divs
- 1px solid gray borders

---

## Pendientes Conocidos

- [ ] Crear `public/og-default.png` (Open Graph image, referenciado en `constants.ts`)
- [ ] Crear `.env.example` si se usan variables de entorno
- [ ] Verificar `astro check` sin errores
- [ ] Refinar paleta de colores basada en branding
- [ ] Definir fuente(s) del proyecto
