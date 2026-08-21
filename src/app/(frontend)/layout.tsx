// Minimal pass-through layout. The real frontend root layout lives at
// `[locale]/layout.tsx` (it renders <html> and <body>). This file exists only
// so the `(frontend)` route group has a stable layout for non-locale-prefixed
// paths, which middleware redirects to `/en` / `/zh` anyway.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
