import createMiddleware from "next-intl/middleware";
import {NextResponse, type NextRequest} from "next/server";
import {routing} from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/ar/signin", request.url));
  }

  if (request.nextUrl.pathname.replace(/\/$/, "") === "/landpaga") {
    const landpagaUrl = request.nextUrl.clone();
    landpagaUrl.pathname = "/ar/landpaga";
    return NextResponse.rewrite(landpagaUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
