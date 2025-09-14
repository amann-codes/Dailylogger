"use server"

import { getSession } from "./getSession";
import prisma from "@/lib/db";

export async function deleteLog(id: string) {
    const { user } = await getSession();
    if (!user) {
        throw new Error(`User must be logged in to update the log: ${user}`)
    }
    const log = await prisma.log.delete({
        where: { id },
    })
}