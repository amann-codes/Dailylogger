"use server"

import { Log } from "@/lib/types";
import { getSession } from "@/lib/actions/getSession";
import prisma from "@/lib/db";

export async function createLog(data: Log) {
    try {
        const { user } = await getSession();
        const userId = user?.id;
        if (!userId) {
            throw new Error(`User must be logged in to create logs :${user}`)
        }
        const log = await prisma.logs.create({
            data: {
                logs: data,
                userId
            }
        })
        if (!log) {
            throw new Error(`Failed to log your activity :${log}`)
        }
        return log
    } catch (error) {
        throw new Error(`Error occured while logging your activity :${error}`)
    }
}