import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const session = await auth();
    const { pathname } = request.nextUrl;

    const isLoggedIn = !!session?.user;

    const isAuthPage = pathname.startsWith("/signin") || pathname.startsWith("/signup");
    const isProtectedPage = pathname.startsWith("/");
    if (isLoggedIn && isAuthPage) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    if (!isLoggedIn && isProtectedPage) {
        return NextResponse.redirect(new URL("/signin", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|signin|.*\\.png$).*)",
    ],
};