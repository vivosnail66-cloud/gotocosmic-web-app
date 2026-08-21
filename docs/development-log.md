# Gotocosmic Web App — Development Log

Living development journal for the `gotocosmic-cms/v1/web-app` project. Every
feature or fix we ship gets a dated entry here so we can trace *what* changed,
*why*, and *how to operate* it. New entries go at the **top** of the
[Log Entries](#log-entries) section.

- **Repository:** `https://github.com/vivosnail66-cloud/gotocosmic-web-app` (private)
- **Default branch:** `main`
- **Stack:** Payload CMS 3.88 · Next.js 16.3 (App Router) · React 19 · MongoDB (mongoose adapter)

---

## Log Entries

### 2026-08-21 — Fix: 客户端 bundle 错误导入服务端模块（`worker_threads` / `revalidatePath`）

**Problem.** Turbopack/webpack 编译时出现两类错误：
1. `Module not found: Can't resolve 'worker_threads'` — 来自 `pino-abstract-transport`
2. `You're importing a module that depends on "revalidatePath"/"revalidateTag"` — Next.js 服务端 API 不能在客户端使用

**Root cause.** 模块导入链设计问题。客户端组件（`HeaderNav`、`MobileMenu`、`MegaPanel`、`Component.client.tsx`）从 `@/utilities/getMenu` 导入类型和函数，而 `getMenu.ts` 为了实现 `getCachedMenu` 导入了 `@payload-config` → `payload`（服务端包）。`payload` 内部依赖：
- `pino` → `pino-abstract-transport` → `worker_threads`（Node.js 核心模块，浏览器不存在）
- `next/cache` 的 `revalidatePath`/`revalidateTag`（仅服务端可用）

这些服务端依赖被整个拉入浏览器 bundle，导致编译失败。

**Fix.** 拆分模块，解耦客户端与 payload 的依赖链：

- **新建 `src/utilities/getMenuData.ts`** — 纯类型定义 + `resolveTopLevel` + `buildMenuTree` 函数，零 payload 依赖
- **精简 `src/utilities/getMenu.ts`** — 仅保留 `getCachedMenu`（服务端用），从 `getMenuData.ts` 重新导出类型和函数保持向后兼容
- **更新客户端组件导入来源** — 6 个文件从 `@/utilities/getMenu` 改为 `@/utilities/getMenuData`：
  - `src/Header/Nav/mobile.tsx`
  - `src/Header/Nav/index.tsx`
  - `src/Header/Nav/linkProps.ts`
  - `src/Header/Nav/MegaPanel.tsx`
  - `src/Header/Component.client.tsx`
  - `src/Header/Component.tsx`（服务端组件，保持从 `getMenu.ts` 导入 `getCachedMenu`）

同时在 `next.config.ts` 的 webpack 配置中添加 `worker_threads: false` fallback 作为防御性措施。

**Verification status.**
- ✅ 已验证：`pnpm dev` 启动成功，`GET /en` 返回 200，`worker_threads` 和 `revalidatePath`/`revalidateTag` 错误消失
- 仅剩一个无关的 Image `fill` + `position` 警告，不影响功能

---

### 2026-08-21 — Fix: mega-menu seed failing (`menu-items` ValidationError `link.reference`)

**Problem.** Seeding via admin POST `/next/seed` aborted mid-way with
`ValidationError` on `menu-items` (`"Link target > Document to link to: This field is
required."`, `path: link.reference`). The admin UI only showed "An error occurred
while seeding." — the real error was in the terminal via `payload.logger.error`.

**Root cause.** `menu-items` reuses the shared `link()` field factory, which marks
`reference`/`url` as **required**. The collection intentionally has link-less rows
(`columnTitle` column headers). Payload materializes the link group's default
`type: 'reference'` even when the whole group is omitted, which activates the
required `reference` — so every column-title row failed validation. This would
also have blocked editors from creating column-title items in the admin.

**Fix (`src/collections/MenuItems.ts`).**

- Build the link field via the factory (`menuLinkField`), then walk its `fields`
  and relax `reference`/`url` to `required: false` (deepMerge can't do this via
  `overrides` — it replaces arrays wholesale).
- Added a FIELD-level `validate` on the `link` group: `link` / `featured` / `cta`
  items must have a usable target (`custom.url` or `reference`); `columnTitle`
  stays link-free. **Do NOT use a collection-level `validate` for this** — Payload
  does not strip a top-level collection `validate` from the config it sends to the
  admin client, so the admin `RootLayout` RSC boundary throws "Functions cannot be
  passed directly to Client Components" (`GET /admin` 500). Field-level validates
  are stripped and safe (see `src/fields/defaultLexical.ts`).
- Hardened `src/Header/Nav/linkProps.ts` `toCmsLinkProps`: a target-less link
  (e.g. the Payload-materialized `{ type: 'reference' }` on a column title) now
  returns `undefined`, so call sites render the non-clickable fallback instead of
  passing a broken href into `CMSLink`.

**Verification status.**

- ⚠️ Not re-run this session (sandbox shell unavailable). Re-run seeding: login to
  admin → POST `/next/seed`. Expect it to complete. Then verify the mega menu
  (Posts / Solutions hover panel with two columns + featured card + CTA / Contact)
  and that column-title rows render as plain headings. Also confirm `/admin` loads.

---

### 2026-08-21 — Fix: Turbopack dev ENOENT on `/en` (`[locale]/page` build-manifest)

**Problem.** `pnpm dev` (Turbopack, Next 16 default) failed on `GET /en` with
`ENOENT: no such file or directory, open '...\.next\dev\server\app\(frontend)\[locale]\page\build-manifest.json'`
— even after deleting `.next` and starting a completely fresh build. Not a
stale-cache issue.

**Root cause (working hypothesis, confirmed by the fix).** `[locale]/page.tsx`
imported the page component from the sibling route segment `./[slug]/page`
(first as a bare re-export, then as `<Page params={params} />`). Turbopack's
per-route manifest emission does not handle a page segment whose module graph
contains another route segment's page module, so it never wrote
`[locale]/page/build-manifest.json`.

**Fix.** Made the locale root a fully self-contained home page:

- `src/app/(frontend)/[locale]/page.tsx` — standalone copy of the home logic
  (query slug `'home'`, fall back to `homeStatic`, render hero + blocks +
  `PageClient` + `PayloadRedirects` + `LivePreviewListener`), with its own
  `generateMetadata` / `generateStaticParams`. Imports nothing from
  `./[slug]/page`.
- `src/app/(frontend)/[locale]/page.client.tsx` — new local `PageClient`
  (header-theme-light, same body as `[slug]/page.client.tsx`) so the root page
  has zero cross-segment imports.

**Verification status.**

- ⚠️ Not re-run locally this session. Please test: `pnpm dev` → `GET /en`,
  `/zh`, `/`, `/en/home` all render.
- If `/en` STILL 500s, the next discriminator is `pnpm dev --webpack`
  (bypasses Turbopack dev). If webpack works, it's a Turbopack-dev-specific
  bug (cf. vercel/next.js route-group / build-manifest issues) and we can pin
  a workaround or track an upstream fix.

---

### 2026-08-21 — Mega Menu（高级菜单）

**Goal.** 把 Header 的扁平导航升级为 CMS 驱动的 Mega Menu（多栏 + 栏标题、图片卡片、角标/描述、底部 CTA），并加独立搜索入口；后台编辑流畅、可增量扩展。

**Why / 依据.** 参考 Payload 官方讨论 [Best way to build a Mega menu · #16007](https://github.com/payloadcms/payload/discussions/16007)：在 Global 里深层嵌套数组/blocks 会让后台明显变慢。改用**独立扁平 `menu-items` 集合 + `parent` 自引用**，前端一次查询组树。

**决策（已确认）.**
- 独立 `menu-items` 集合，Header global 通过关系只引用顶级项；两级为主。
- 面板元素：多栏+栏标题、featured 图卡、badge+description、底部 CTA。
- 独立搜索：Header 图标 → 展开输入框 → `/{locale}/search?q=`（基础版）。
- 移动端：手风琴。

**设计文档.** `docs/superpowers/specs/2026-08-21-mega-menu-design.md`（数据模型/组件/缓存/迁移/增量路线都在里面）。

**实现文件.**
- 新增 `src/collections/MenuItems.ts`（+ hooks/revalidateMenuItems.ts）
- 新增 `src/utilities/getMenu.ts`（单查询 + 内存组树 + unstable_cache tag `menu_items`；含 `buildMenuTree`/`resolveTopLevel` + 本地类型）
- 新增 `src/components/HeaderSearch/index.tsx`（client；图标 → 展开输入框 → `/{locale}/search?q=`。因被 client 组件 `Component.client.tsx` 引用，直接做成 client 组件，废弃旧的 `index.client.tsx`——本机可删）
- 新增 `src/Header/Nav/MegaPanel.tsx`（按 `column` 分组栏 + 栏标题 + featured 图卡 + 底部 CTA 条）、`mobile.tsx`（受控手风琴）、`linkProps.ts`（MenuItemLink → CMSLink props 桥接 cast）
- 改 `src/Header/config.ts`（navItems 行 `link` → `item` 关系，maxRows 8）、`RowLabel.tsx`、`Component.tsx`（并行取 header+settings+menu）、`Component.client.tsx`（接入 Nav/HeaderSearch/移动端按钮）、`Nav/index.tsx`（桌面 hover/焦点 Mega 面板）
- 改 `src/payload.config.ts`（注册 MenuItems，admin group `Navigation`）
- 改 `src/components/Link/index.tsx`（新增 `onClick` 透传，供移动端菜单关闭）
- 改 `src/endpoints/seed/index.ts`（清库列表加 `menu-items`；seed 构建完整 mega menu 演示数据：顶级 Posts / Solutions / Contact，其中 Solutions 带两栏子项（栏标题 + 带 badge/description 的链接）、featured 图卡、底部 CTA，全部挂在真实 page/post/media 上）

**关键坑（本次记录）.**
- Header `navItems` 数据形状从 `{ link }` 变成 `{ item: relationship }`，`payload-types.ts` 未重跑前旧的 `Header['navItems']` 类型仍是 `link` 行 → 前端统一在边界 cast（`MenuHeaderData` + `toCmsLinkProps` + `image as unknown as MediaType`），`pnpm generate:types` 后这些 cast 依然成立。
- `link({ disableLabel: true })` 出来的 link group **没有 `label` 字段**，菜单文案来自集合级 `label` 字段，渲染时传给 `CMSLink` 的 `label` prop。
- seed 若仍写旧 `link` 形状到 header 会保存失败（`item` 是 required relationship），已同步改 seed。

**Verification status.**
- ⚠️ 会话内 bash/workspace 不可用，未实跑。本机需：`pnpm generate:types`（menu-items 进 payload-types，Header navItems 类型随之更新）→ `pnpm dev` / `pnpm build` 冒烟：后台配顶级项+子项（含 columnTitle/featured/cta）、前台 hover 面板、移动端手风琴、搜索跳转。登录后台后 POST `/next/seed`（或直接重跑 seed）：导航应显示 Posts / Solutions（hover 出两栏 mega 面板 + 图卡 + CTA）/ Contact。

---

### 2026-08-21 — Route fixes: leftover `[slug]` stub removed + missing locale-root page

**Problem 1 (build error).** `(frontend)/[slug]` (old pre-i18n redirect stub) and
`(frontend)/[locale]` are sibling dynamic segments under the same route group.
Next.js requires the same param name at the same level, so it failed with:
`You cannot use different slug names for the same dynamic path ('locale' !== 'slug')`.

**Fix.** Deleted `src/app/(frontend)/[slug]/`. It was redundant — `src/middleware.ts`
already redirects every unprefixed path to `/${defaultLocale}...`.

**Problem 2 (404 on homepage).** `/en` and `/zh` (the locale roots) had **no page**:
home lives at `[locale]/[slug]/page.tsx`, which only matches two-segment URLs like
`/en/home`. Requests to `/en` fell through to the 404 page.

**Fix.** Added `src/app/(frontend)/[locale]/page.tsx`:

```ts
import { locales } from '@/i18n/locales'

export { default, generateMetadata } from './[slug]/page'

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}
```

It reuses the page that already defaults `slug` to `'home'`, so no logic duplication.

> **Superseded (see the entry at the top of this log).** The bare re-export —
> and even a direct `<Page/>` render importing from `./[slug]/page` — failed
> under Turbopack dev with `[locale]/page/build-manifest.json` ENOENT on `/en`.
> The locale root is now a self-contained home page that imports nothing from
> the `[slug]` segment.

**Verification.** ⚠️ Not re-verified in a live build this session (sandbox shell
unavailable). Run `pnpm dev` / `pnpm build` locally and confirm `/`, `/en`, `/zh`
render the homepage and `/en/home` still works.

---

### 2026-08-21 — Site Settings global (logo, announcement bar, floating buttons, analytics)

**Goal.** Give editors a single admin place to configure cross-cutting site
behaviour without touching code: desktop logo, announcement bar, company &
copyright info, right-side floating contact buttons, and analytics/tracking
injection. Everything is **opt-in** — a fresh DB renders none of it.

**Decisions (agreed with product).**

- **4 tabs** (merged logo/company/copyright under one "General" tab), not a
  flat 6-tab list.
- **Analytics platforms:** Google Analytics (GA4) + Facebook Pixel + custom code
  snippet. GA4/FB need an ID; custom takes raw `<script>` or plain JS.
- **Floating channels:** WhatsApp / Email / Phone / custom link. "Show on
  mobile" checkbox; when unchecked, all floating buttons hide on screens ≤ 768px.
- **Announcement bar:** dismissible (×) and optionally auto-hides after N
  seconds; supports an optional internal/custom link.
- **Logo:** when set in Site Settings it replaces the default logo in **both**
  the header and the footer.

**Payload config (new global).**

- `src/SiteSettings/config.ts` — `GlobalConfig` `site-settings` with tabs
  `general` (logo upload→media, company group, copyright group), `announcement`
  (enabled, localized text, link, autoHideSeconds), `floatingButtons` (enabled,
  showOnMobile, buttons array: type/label/value/enabled), `analytics` (items
  array: platform/trackerId/code/enabled).
- `src/SiteSettings/hooks/revalidateSiteSettings.ts` — `GlobalAfterChangeHook`
  that revalidates the `global_site-settings` cache tag on change.
- `src/payload.config.ts` — `SiteSettings` registered in `globals`.

**Cached data access.**

- `src/utilities/getSiteSettings.ts` — local `SiteSettings` type + exported
  `AnalyticsItem` / `FloatingButtonItem`, `getCachedSiteSettings(locale?)`
  (unstable_cache keyed by locale, tag `global_site-settings`), and
  `getSiteLogoUrl()` helper. Local types + `as never` casts mean it compiles
  before `pnpm generate:types` re-runs (global is not yet in `payload-types.ts`).
- Note: the analytics tracker field is named `trackerId` (not `id`) to avoid
  colliding with Payload's auto-generated array row `id`.

**Frontend components.**

- `src/components/Analytics/index.tsx` — server component; emits GA4 / Facebook
  Pixel / custom `<script>` via `next/script` (`afterInteractive`). Custom code
  is normalized to accept a full `<script>...</script>` snippet or plain JS.
  Returns `null` when disabled or IDs/code are empty → no third-party code by
  default.
- `src/components/AnnouncementBar/index.tsx` + `index.client.tsx` — dismissible,
  auto-hides after `autoHideSeconds`, text is localized, optional link wraps the
  message. Renders `null` unless enabled with non-empty text.
- `src/components/FloatingButtons/index.tsx` + `index.client.tsx` — fixed
  right-side stack; `window.matchMedia('(max-width: 768px)')` drives the
  mobile-hide behaviour; icons via lucide-react; WhatsApp→`wa.me`, Email→
  `mailto:`, Phone→`tel:`, Custom→raw URL.
- `src/components/Logo/Logo.tsx` — accepts optional `src`/`alt` to override the
  default logo.
- `src/Header/Component.tsx` + `Component.client.tsx` — fetch site settings,
  pass `siteLogo` to the client; invert filter only applies to the default logo.
- `src/Footer/Component.tsx` — renders site logo, company name/address and
  phone/email, plus a copyright bar when configured.
- `src/app/(frontend)/[locale]/layout.tsx` — `<Analytics>` in body top,
  `<AnnouncementBar>` above the header, `<FloatingButtons>` after the footer.

**Verification status.**

- Static review completed (field name consistency `trackerId`, type alignment
  between config/utility/components, cache-tag parity, no-script default).
- ⚠️ NOT yet verified in a running build: run `pnpm generate:types` (adds
  `site-settings` to `Config['globals']`), then `pnpm dev` / `pnpm build` and
  smoke-test in the admin (Logo / Announcement / Floating / Analytics tabs) and
  on `/en` / `/zh`.
- Follow-ups if needed: route-change analytics events (SPA navigation) on top of
  the initial-load injection, and RTL/animation polish for the announcement bar.

---

### 2026-08-21 — Multi-language (i18n) support: EN / ZH, default EN

**Goal.** Make the site fully bilingual (English + Chinese) with `/en` and `/zh`
URL prefixes, English as the default locale, and a language switcher in the
header — so editors can maintain the same page in both languages.

**Decisions (agreed with product).**

- **Scope:** Payload field-level localization only (no per-document locale split).
- **URL strategy:** path prefixes `/en` and `/zh`; unprefixed paths redirect to `/en`.
- **Slugs are NOT localized** — only leaf text fields are `localized: true`.
  Block/layout structure stays non-localized (single source of truth).
- **Fallback:** on, so missing `zh` values fall back to `en`.

**Payload config.**

- `src/payload.config.ts` → `localization: { locales: ['en','zh'], defaultLocale: 'en', fallback: true }`.
- Single source of truth for languages: `src/i18n/locales.ts`
  (`locales`, `defaultLocale`, `isLocale`).

**Localized fields (leaf text only).**

| Collection / field    | File                          |
|-----------------------|-------------------------------|
| Pages — `title`       | `src/collections/Pages/index.ts` |
| Posts — `title`, `content` | `src/collections/Posts/index.ts` |
| Categories — `title`  | `src/collections/Categories.ts`  |
| Media — `alt`, `caption` | `src/collections/Media.ts`    |
| Header/Footer — `link.label` | `src/fields/link.ts`       |
| Hero richText, block richText/introContent/content | `src/heros/config.ts`, `src/blocks/*/config.ts` |

(plugin-seo `meta` fields already ship `localized: true` from the library.)

**Frontend routing.**

- All frontend routes moved under `src/app/(frontend)/[locale]/…`
  (`[slug]`, `posts`, `posts/page/[pageNumber]`, `search`, `not-found`).
- `[locale]/layout.tsx` is now the **only** layout rendering `<html lang={locale}>`;
  the old `(frontend)/layout.tsx` was reduced to a pass-through.
- Old non-localized routes (`(frontend)/page.tsx`, `[slug]/…`, `posts/…`,
  `search/…`) were replaced with redirect stubs to `/${defaultLocale}…` as a
  safety net. `src/middleware.ts` intercepts unprefixed paths first and
  redirects them to `/en` (skips `/admin`, `/api`, `/_next`, `/next/`, static files).
- `generateStaticParams` emits `locale × slug` combinations; the posts list page
  got `generateStaticParams(locales)` to keep its `force-static`/ISR behavior.

**Locale-aware components & utilities.**

- `LocaleSwitch` (`src/components/LocaleSwitch/index.tsx`) renders **EN / 中文**
  links in the header, derived from the current pathname.
- `Link`, `Card`, `Pagination`, `Search`, `HeaderNav` now read the active locale
  via `useParams()` and build `/${locale}/…` URLs.
- `Header`/`Footer` pass `locale` into `getCachedGlobal('header'|'footer', depth, locale)`.
- `generatePreviewPath`, `generateMeta`, `getGlobals` accept a `locale` argument.
- `PayloadRedirects` strips the locale prefix before matching and re-prefixes targets.
- `revalidatePage` / `revalidatePost` iterate both locales and revalidate
  `/${locale}`, `/${locale}/${slug}`, `/${locale}/posts/${slug}`.

**Sitemaps & SEO.**

- `pages-sitemap.xml` and `posts-sitemap.xml` now emit both `/en` and `/zh` URLs.
- `next-sitemap.config.cjs` excludes `/en/**` and `/zh/**` from the auto-generated
  sitemap to avoid duplicates (route-based sitemaps already cover them).

**Verification status.**

- Static review completed (middleware matcher, layout nesting, locale-aware links,
  sitemap excludes, revalidate coverage).
- ⚠️ NOT yet verified in a running build: run `pnpm generate:types` (regenerate
  `payload-types.ts` with localized field types) and `pnpm build` / `pnpm dev`
  locally to smoke-test `/en`, `/zh`, and the switcher.
- ⚠️ Data note: existing DB docs are stored as `en` values; `zh` content will
  fall back to `en` until editors add Chinese values in the admin per locale.

---

### 2026-08-21 — Git repository setup & first push to GitHub

**Goal.** Put the project under version control so future features can be
committed, reviewed, and rolled back.

**What was done.**

- Initialized the repo inside `v1/web-app` (branch `main`).
- Author identity: `vivosnail66-cloud <277395327+vivosnail66-cloud@users.noreply.github.com>`.
- Pushed the full working tree (including the i18n changes above) as the initial
  commit — `cc74f4a` “Initial commit: Payload website template with i18n locale support”.
- Remote: `origin` → `https://github.com/vivosnail66-cloud/gotocosmic-web-app.git`
  (private), with `main` tracking `origin/main`.
- `.gitignore` hardened: fixed the broken `dist / media` rule, added `.env.*`
  (keeps `.env.example`), `coverage`, `*.tsbuildinfo`, `*.log`, `.idea/`.
  Confirmed the real `.env` (secrets) is excluded.

**How to verify a push succeeded (no shell needed).**

Compare the two ref files under `.git`:
`.git/refs/heads/main` must equal `.git/refs/remotes/origin/main`.
(Note: hidden dot-directories are invisible to glob search — read them directly.)

---

## Conventions

- **Branching:** feature work in `feature/<name>` branches, merged back to `main`.
- **Commit messages:** imperative mood, e.g. `feat: add zh translation for header`.
- **Adding a log entry:** insert a new `### YYYY-MM-DD — <Title>` block at the top
  of [Log Entries](#log-entries) covering: goal → decisions → what changed (files) →
  verification status → any follow-ups. Keep each entry self-contained.
