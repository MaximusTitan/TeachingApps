import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { readDomainId } from "../actions/readDomainId";

export const updateSession = async (request: NextRequest) => {
  try {
    let response = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Fetch user session
    const { data: { user }, error } = await supabase.auth.getUser();

    // Redirect disabled users
    if (
      user?.user_metadata?.status === "disabled" &&
      !request.nextUrl.pathname.startsWith("/verification-waiting") &&
      !request.nextUrl.pathname.startsWith("/sign-in")
    ) {
      return NextResponse.redirect(new URL("/verification-waiting", request.url));
    }

    // Define public routes (accessible without authentication)
    const publicRoutes = ["/profile/", "/sign-in", "/sign-up", "/verification-waiting"];

    // Check if the route is public
    const isPublicRoute = publicRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    );

    // Redirect all non-public routes if user is not authenticated
    if (!isPublicRoute && !user) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // Redirect "/" to "/tools" if authenticated
    if (request.nextUrl.pathname === "/" && user) {
      return NextResponse.redirect(new URL("/tools", request.url));
    }

    // Handle multi-tenant domains
    const hostname = request.headers.get("host");
    let currentHost;
    if (process.env.NODE_ENV === "production") {
      currentHost = hostname?.replace(`.${process.env.BASE_DOMAIN}`, "").toLowerCase();
    } else {
      currentHost = hostname?.replace(`.localhost:3000`, "").toLowerCase();
    }

    if (!currentHost) return response;

    // Fetch site_id based on domain
    const school = await readDomainId(currentHost);
    if (!school) return response;

    // Rewrite URL to include site_id
    return NextResponse.rewrite(new URL(`/${school.id}${request.nextUrl.pathname}`, request.url));

  } catch (e) {
    console.error("Middleware Error:", e);
    return NextResponse.next();
  }
};
