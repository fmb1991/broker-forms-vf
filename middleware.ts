// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protegemos:
 *  - /formsadmin (UI del panel de formularios)
 *  - /api/formsadmin/* (APIs del panel)
 *  - /api/admin/* (APIs de admin)
 *
 * NO protegemos /admin (la página de login), para evitar bucles.
 */
export const config = {
  matcher: [
    '/formsadmin/:path*',
    '/api/formsadmin/:path*',
    '/api/admin/:path*',
  ],
};

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Permitir SIEMPRE las rutas de login/logout para que el usuario pueda entrar/salir
  if (path.startsWith('/api/admin/login') || path.startsWith('/api/admin/logout')) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get('admin_secret')?.value;
  const secret = process.env.ADMIN_SECRET; // asegúrate de tenerla en Vercel

  if (cookie !== secret) {
    // Usuario no autenticado → mandar a /admin (que NO está protegido)
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  return NextResponse.next();
}
