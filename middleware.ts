// middleware.ts (en la raíz del repo)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que quieres proteger con la misma contraseña de /admin
const PROTECTED_PATHS = ['/admin', '/formsadmin', '/api/formsadmin'];

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Solo actuamos si la ruta empieza por alguna de las protegidas
  if (PROTECTED_PATHS.some(p => path.startsWith(p))) {
    const cookie = req.cookies.get('admin_secret')?.value;

    // Si la cookie no coincide con ADMIN_SECRET, redirigimos a /admin
    if (cookie !== process.env.ADMIN_SECRET) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
  }

  // Si todo bien, dejamos seguir la request normal
  return NextResponse.next();
}
