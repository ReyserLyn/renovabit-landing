# RenovaBit Landing — Project Summary

> Proyecto standalone en `~/Proyectos/Production/renovabit-landing/`
> Creado el 2026-07-09. Git init con primer commit en `main`.

---

## Stack

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Astro | 7.0.7 |
| UI Components | Preact | 10.29.7 |
| Styling | Tailwind CSS | 4.3.0 |
| Plugin CSS | @tailwindcss/vite | 4.1.18 |
| Linting/Formatting | Biome | 2.4.16 |
| Iconos | astro-icon + @iconify-json/hugeicons | 1.1.5 / 1.2.4 |
| Sitemap | @astrojs/sitemap | 3.7.3 |
| Package Manager | Bun | 1.3.10 |
| Bundler | Vite (via Astro 7) | 8.x |
| TypeScript | ^6.0.3 | strict mode |
| Node | ^18 | engines |

### Git Hooks
- **lefthook** ^2.1.10 — pre-commit, commit-msg, pre-push
- **commitlint** ^21.2.1 con `@commitlint/config-conventional`
  - Scopes: `ui, seo, content, a11y, perp, deps, ci, repo`

---

## Biome Config

Archivo: `biome.json` — **standalone** (`root: true`, no extiende nada externo)

Puntos clave:
- `html.experimentalFullSupportEnabled: true` → Astro files con full support
- `css.parser.tailwindDirectives: true` → @theme, @utility, etc.
- `formatter: indentStyle: tab, lineWidth: 100`
- `linter: noUndeclaredVariables: error` + reglas exhaustivas
- Override para `*.astro`: desactiva `useConst`, `useImportType`, `noUnusedVariables`, `noUnusedImports` (el template de Astro usa variables "sin usar")
- Override para `*.ts/tsx`: reglas TS específicas
- `javascript.formatter.quoteStyle: "double"`
- `assist.organizeImports: on`

⚠️ **No usar Prettier ni ESLint.** Biome lo cubre todo.

---

## Zed Config

Archivo: `.zed/settings.json`

- `format_on_save: on`
- `formatter: language_server` (global)
- Biome configurado como formatter para: **Astro, CSS, JSON, JSONC, JavaScript, TSX, TypeScript**
- `code_actions_on_format`: `fixAll.biome` + `organizeImports.biome`
- CSS: Tailwind LSP habilitado, `vscode-css-language-server` deshabilitado
- Tailwind LSP configurado para Astro: `includeLanguages.astro: "html"` + `classRegex` para `class:list`
- Biome LSP: `require_config_file: true` (no necesita `inline_config` porque es standalone)

---

## Astro Config

Archivo: `astro.config.mjs`

```js
site: "https://renovabit.com"
server: { port: 3000 }
compressHTML: true  // tradicional, no colapsa whitespace como JSX
integrations:
  - icon({ include: { hugeicons: ["*"] } })  // autocompletado de iconos
  - sitemap({})
  - preact()
vite:
  - @tailwindcss/vite
```

---

## TypeScript Config

Archivo: `tsconfig.json`

- `extends: astro/tsconfigs/strict`
- Path alias: `@/*` → `./src/*`
- `verbatimModuleSyntax: true`
- `jsx: react-jsx` + `jsxImportSource: preact`

---

## Estructura de archivos

```
renovabit-landing/
├── astro.config.mjs
├── biome.json                    # root: true, standalone
├── bun.lock
├── commitlint.config.cjs
├── lefthook.yml
├── package.json
├── tsconfig.json
├── .gitignore
├── .rules                        # convenciones de commits
├── .zed/
│   └── settings.json
├── public/
│   └── favicon.ico
└── src/
    ├── constants.ts              # SITE, CONTACT, SOCIAL, NAV_ITEMS
    ├── layouts/
    │   └── BaseLayout.astro      # HTML shell básico
    ├── pages/
    │   └── index.astro           # página de inicio (esqueleto)
    ├── styles/
    │   └── landing.css           # solo @import "tailwindcss"
    ├── components/
    │   └── social-icon/
    │       ├── FacebookIcon.astro
    │       ├── InstagramIcon.astro
    │       ├── TikTokIcon.astro
    │       └── WhatsappIcon.astro
    └── assets/
        ├── branding/
        │   ├── logo-horizontal-dark.svg
        │   └── logo-horizontal-light.svg
        └── images/
            ├── hero/             # 3 .avif
            ├── about/            # 2 archivos
            ├── services/         # 3 .avif
            └── testimonials/     # 1 .avif
```

---

## Scripts disponibles

```sh
bun run dev           # astro dev (http://localhost:3000)
bun run build         # astro build
bun run preview       # astro preview
bun run check         # astro check (type checking)
bun run check:biome   # biome check . --write
```

---

## Convenciones de commits

Seguir Conventional Commits. Formato:
```
<type>(<scope>): <description>
```

Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
Scopes: `ui`, `seo`, `content`, `a11y`, `perf`, `deps`, `ci`, `repo`

Header máx 72 chars. Descripción en imperative mood, minúscula, sin punto final.

---

## Decisiones técnicas importantes

1. **Biome reemplaza Prettier + ESLint** — sin excepciones. Para `.astro`, Biome con `experimentalFullSupportEnabled: true` maneja frontmatter JS + template HTML.

2. **Salida del monorepo** — El landing se separó porque el LSP de Biome en Zed no resuelve configs anidadas (usa solo la config del workspace root). Al ser un proyecto standalone, su `biome.json` con `root: true` es la única config y funciona correctamente.

3. **`compressHTML: true`** — Se usa whitespace handling tradicional (no JSX). Si en el futuro se prefiere que `<span>a</span> <span>b</span>` renderice como `ab` en vez de `a b`, cambiar a `'jsx'`.

4. **Hugeicons con autocompletado** — `astro-icon` + `@iconify-json/hugeicons`. Para generar tipos, ejecutar `bun astro sync`. Luego el editor autocompleta `hugeicons:icon-name` en `<Icon name="...">`.

5. **Preact** — Usa `jsx: react-jsx` + `jsxImportSource: preact` en tsconfig. No necesita `@preact/compat` a menos que se usen APIs específicas de React.

---

## Pendientes / Próximos pasos

- [ ] Crear `public/og-default.png` (para Open Graph, referenciado en `constants.ts`)
- [ ] Crear `.env.example` si se usan variables de entorno (ej. `PUBLIC_STORE_URL`)
- [ ] Verificar `astro check` sin errores
