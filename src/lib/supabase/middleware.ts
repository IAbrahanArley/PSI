import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { canAccessDashboardPath, getRoleFromUser } from "@/lib/auth/roles";

function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.startsWith("/assets")) return true;
  if (/\.(ico|png|jpg|jpeg|gif|webp|svg|mp4|woff2?|css|js)$/i.test(pathname)) return true;

  const publicExact = new Set([
    "/",
    "/login",
    "/login/paciente",
    "/login/psicologo",
    "/login/psi",
    "/cadastro/psicologo",
    "/cadastro/paciente",
    "/recuperar-senha",
    "/redefinir-senha",
    "/home",
  ]);
  if (publicExact.has(pathname)) return true;
  if (pathname.startsWith("/team")) return true;

  return false;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (isPublicPath(pathname)) {
    if (user && (pathname === "/login" || pathname.startsWith("/login/"))) {
      const role = getRoleFromUser(user);
      if (role) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
    return supabaseResponse;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const role = getRoleFromUser(user);

  if (pathname.startsWith("/dashboard")) {
    if (!role) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "missing_role");
      return NextResponse.redirect(url);
    }
    if (!canAccessDashboardPath(role, pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
