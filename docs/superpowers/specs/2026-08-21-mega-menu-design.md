# Mega Menu（高级菜单）设计

- **日期**：2026-08-21
- **项目**：gotocosmic-cms / v1 / web-app（Payload 3.88 + Next.js 16 App Router）
- **状态**：已与产品确认，进入实现

## 背景

参考 Payload 官方讨论 [Best way to build a Mega menu · #16007](https://github.com/payloadcms/payload/discussions/16007)。

核心结论（讨论原文）：**不要在 Global 里用深层嵌套的数组/blocks 做菜单**——3 层嵌套就会让后台明显变慢（SQLite 最明显，Postgres 稍好但仍不理想）。推荐改为 **独立扁平集合 + 自引用关系**：每个菜单项是数据库一行，后台编辑单个条目永远快，深度不限。

## 决策（已确认）

1. **数据结构**：新增 `menu-items` 集合，`parent` 自引用关系表示层级；Header global 只通过关系引用**顶级**项。
2. **深度**：两级为主——顶级项 → Mega 面板（栏目 + 链接）。面板内不再嵌套子级。
3. **面板元素**：多栏 + 栏标题、图片卡片（featured）、角标 + 描述、底部 CTA 条。
4. **独立搜索**：Header 内独立搜索入口（图标 → 展开输入框 → 跳转 `/{locale}/search?q=...`），与菜单结构解耦；本期先做基础版，后续可增强（如搜索联想/下拉结果）。
5. **移动端**：手风琴菜单（≤768px）。
6. **开发文档**：本 spec 存档于 `docs/superpowers/specs/`；每次增量把坑与结论记入 `docs/development-log.md`，便于日后回溯与增量开发。

## 数据模型

### 新集合 `menu-items`（`src/collections/MenuItems.ts`）

| 字段 | 类型 | 说明 |
|---|---|---|
| `label` | text, localized, required | 菜单项文案 |
| `type` | select, default `link` | `link` 普通链接 / `columnTitle` 栏目标题 / `featured` 图片卡片 / `cta` 底部 CTA |
| `link` | group（复用 `link({ disableLabel: true, appearances: false })`） | 跳转目标；栏目标题可留空不跳 |
| `parent` | relationship → self | 空 = 顶级项 |
| `order` | number, default 0 | 同级排序，小在前 |
| `column` | number（仅子项，按 `parent` 条件显示） | 面板内第几栏（1-based） |
| `badge` | text（仅 `type=link` 显示） | 角标文案，如 New / Hot |
| `description` | text, localized（link/cta/featured 显示） | 一行描述 |
| `image` | upload → media（仅 `type=featured` 显示） | 特色卡片配图 |

### Header global（`src/Header/config.ts`）

- `navItems` 数组行由 `link` 改为 **`item`（relationship → `menu-items`，required）**。
- 数组顺序 = 顶级顺序；`maxRows` 放宽到 8。
- 保留 `afterChange → revalidateHeader`。

## 前端

### 数据获取（`src/utilities/getMenu.ts`）

- `getCachedMenu(locale?)`：一次 `payload.find` 查全部 `menu-items`（depth 1，limit 500，sort by order），在内存组树，`unstable_cache` + tag `menu_items`。
- 树构建：`parent` 解析为对象或 id，统一映射；按 `order` 排序。本地类型 + `as never` 保证 `pnpm generate:types` 重跑前可编译。

### 组件

- `src/Header/Component.tsx`（server）：并行取 header global + site settings + menu，传给 client。
- `src/Header/Component.client.tsx`：渲染 Logo（siteLogo）、`HeaderNav`（menu）、独立搜索 `HeaderSearch`、`LocaleSwitch`、移动端触发按钮。
- `src/Header/Nav/index.tsx`：桌面导航。顶级项无子项 → 普通链接；有子项 → hover/焦点弹出 Mega 面板。
- `src/Header/Nav/MegaPanel.tsx`（client）：面板按 `column` 分组渲染栏目；`columnTitle` 作栏头；`featured` 作右侧图卡；`cta` 作底部通栏条。
- `src/Header/Nav/mobile.tsx`（client）：手风琴，顶级点击展开面板内容。
- `src/components/HeaderSearch/index.tsx` + `.client.tsx`：图标按钮展开输入框，回车跳转 `/{locale}/search?q=...`。

### 面板布局示意

```
顶级项（无子项）  → 普通链接
顶级项（有子项）  → hover/焦点 弹出 Mega 面板
┌──────────┬──────────┬──────────┬────────────────────┐
│ 栏1 标题  │ 栏2 标题  │ 栏3 标题  │  featured 图卡       │
│ 链接     │ 链接     │ 链接     │  （图 + 标题 + 描述） │
│ 链接[Badge]│ 链接     │          │                    │
└───────────────────────────────┴────────────────────┘
│ 底部 CTA 条（通栏：按钮 / 说明文字）                        │
```

## 缓存 / 失效

- `menu-items` 集合 `afterChange` hook → `revalidateTag('menu_items')`（Header 依赖它，菜单改动即时生效）。
- Header global 改动仍走 `revalidateHeader`（tag `global_header`）。

## 兼容 / 迁移

- Header `navItems` 数据形状变化（行内 `link` → `item` 关系），后台需重新配置导航；前端 `Nav` 重写。
- `payload.config.ts` 注册 `MenuItems` 集合（admin group `Navigation`）。
- 旧 `RowLabel` 依赖 `link.label`，已同步改为读 `item`（并 cast 应对旧 payload-types）。
- **seed 已同步**：先创建 Posts/Contact 两个 `menu-items`，header 通过 `item` 引用；清库列表含 `menu-items`。
- `payload-types.ts` 未重跑前，涉及新形状的代码一律在边界 cast（`MenuHeaderData`/`toCmsLinkProps`/`as never`），generate:types 后仍成立。
- `HeaderSearch` 因被 client 组件引用，直接做成 client 组件（`index.tsx`），废弃 `index.client.tsx`。

## 已知坑（本次会话记录，写入 dev log）

- `(frontend)/[slug]` 旧 stub 与 `[locale]` 同级动态段 → Next 报 `'locale' !== 'slug'`（已删 stub）。
- `/en`、`/zh` 无 locale 根页面 → 404（已补 `[locale]/page.tsx`）。
- 会话内 bash/workspace 不可用，**所有构建/类型检查需在本机跑**：`pnpm generate:types` + `pnpm dev` / `pnpm build`。

## 增量开发建议

- 本期范围：数据模型 + 桌面 Mega 面板 + 移动端手风琴 + 独立搜索（基础版）。
- 后续可增：搜索联想/结果下拉、三级及以上层级、面板动画细节、多语言菜单项 seed。
