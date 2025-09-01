import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import {
    publicRoutes,
    authPrefix,
    authRoutes,
    DEFAULT_LOGIN_REDIRECT,
} from "@/lib/routes";

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    const isLoggedIn = !!token;

    const path = req.nextUrl.pathname;
    const isApiAuthRoute = path.startsWith(authPrefix);
    const isPublicRoute = publicRoutes.includes(path);
    const isAuthRoute = authRoutes.includes(path);

    console.log({
        path,
        isLoggedIn,
        isApiAuthRoute,
        isPublicRoute,
        isAuthRoute,
        timestamp: new Date().toISOString(),
    });

    if (isApiAuthRoute) {
        return null;
    }

    if (isAuthRoute) {
        if (isLoggedIn) {
            console.log(
                `Redirecting logged-in user from ${path} to ${DEFAULT_LOGIN_REDIRECT}`
            );
            return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, req.url));
        }
        return null;
    }

    if (!isLoggedIn && !isPublicRoute) {
        console.log(`Redirecting non-logged-in user from ${path} to signin`);
        const signInUrl = new URL("/signin", req.url);
        signInUrl.searchParams.set("callbackUrl", req.url);
        return NextResponse.redirect(signInUrl);
    }

    if (isLoggedIn && isPublicRoute && path !== DEFAULT_LOGIN_REDIRECT) {
        console.log(
            `Redirecting logged-in user from public route ${path} to ${DEFAULT_LOGIN_REDIRECT}`
        );
        return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, req.url));
    }

    return null;
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
