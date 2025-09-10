"use server";

import { auth } from "@/lib/auth";
import { Session } from "next-auth";

export async function getSession(): Promise<Session> {
    const session = await auth();
    if (!session?.user) {
        throw new Error(`Log in to proceed :${session}`)
    }
    return session as Session
}