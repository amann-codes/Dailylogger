"use server"

import { getSession } from "@/lib/actions/getSession"
import prisma from "@/lib/db"
import { Tag } from "../types"
import { getRandomTagColor } from "@/lib/domain"

export async function getTags(): Promise<Tag[]> {
    const { user } = await getSession()
    if (!user?.id) {
        throw new Error("User must be logged in to get tags")
    }

    const tags = await prisma.tag.findMany({
        where: { userId: user.id },
        orderBy: { name: "asc" }
    })

    return tags
}

export async function createTag(name: string, color?: string): Promise<Tag> {
    const { user } = await getSession()
    if (!user?.id) {
        throw new Error("User must be logged in to create tags")
    }

    const userId = user.id

    const trimmedName = name.trim()
    if (!trimmedName) {
        throw new Error("Tag name cannot be empty")
    }

    // Check if tag already exists
    const existing = await prisma.tag.findFirst({
        where: {
            userId,
            name: { equals: trimmedName, mode: "insensitive" }
        }
    })

    if (existing) {
        throw new Error("Tag already exists")
    }

    const tag = await prisma.tag.create({
        data: {
            name: trimmedName,
            color: color || getRandomTagColor(),
            userId,
            logIds: []
        }
    })

    return tag
}

export async function updateTag(id: string, name?: string, color?: string): Promise<Tag> {
    const { user } = await getSession()
    if (!user?.id) {
        throw new Error("User must be logged in to update tags")
    }

    const tag = await prisma.tag.update({
        where: { id },
        data: {
            ...(name ? { name: name.trim() } : {}),
            ...(color ? { color } : {})
        }
    })

    return tag
}

export async function deleteTag(id: string): Promise<void> {
    const { user } = await getSession()
    if (!user?.id) {
        throw new Error("User must be logged in to delete tags")
    }

    // Remove tag from all logs first
    await prisma.log.updateMany({
        where: {
            tagIds: { has: id }
        },
        data: {
            tagIds: {
                set: [] // This will be filtered in the next step
            }
        }
    })

    // Actually we need to handle this differently for MongoDB arrays
    // Get all logs with this tag and update them individually
    const logsWithTag = await prisma.log.findMany({
        where: { tagIds: { has: id } }
    })

    for (const log of logsWithTag) {
        await prisma.log.update({
            where: { id: log.id },
            data: {
                tagIds: log.tagIds.filter(tid => tid !== id)
            }
        })
    }

    await prisma.tag.delete({
        where: { id }
    })
}

export async function getOrCreateTag(name: string): Promise<Tag> {
    const { user } = await getSession()
    if (!user?.id) {
        throw new Error("User must be logged in")
    }

    const trimmedName = name.trim()

    // Try to find existing tag
    const existing = await prisma.tag.findFirst({
        where: {
            userId: user.id,
            name: { equals: trimmedName, mode: "insensitive" }
        }
    })

    if (existing) {
        return existing
    }

    // Create new tag
    return createTag(trimmedName)
}
