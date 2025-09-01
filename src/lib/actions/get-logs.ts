"use server"

import { getSession } from "@/lib/actions/getSession";
import prisma from "@/lib/db";

export async function getLogs() {
    try {
        const { user } = await getSession();
        if (!user) {
            throw new Error(`User must be logged in the get logs :${user}`)
        }
        const userId = user.id
        const logs = await prisma.logs.findMany({
            where: {
                userId
            }
        })
        if (!logs) {
            return [];
        }
        return logs;
    } catch (error) {
        throw new Error(`Error occured while getting logs :${error}`)
    }
}