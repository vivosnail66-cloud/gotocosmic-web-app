import { NextResponse, type NextRequest } from 'next/server'

import { defaultLocale, locales } from '@/i18n/locales'

const PUBLIC_FILE = /\.(.*)$/

function pathHasLocale(pathname: string) {
  return locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip Payload admin, API routes, Next.js internals, preview/seed endpoints,
  // sitemaps, and any request for a static file (has a file extension).
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/next/') ||
    pathname === '/favicon.ico' ||
    pathname === '/favicon.svg' ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next()
  }

  if (pathHasLocale(pathname)) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = `/${defaultLocale}${pathname}`

  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next|admin|api|next/|favicon.ico|favicon.svg).*)'],
}
