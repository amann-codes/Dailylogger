"use server"

import { getSession } from "@/lib/actions/getSession"
import prisma from "@/lib/db"
import { DailyStats, TagStats } from "../types"
import { startOfDay } from "@/lib/domain"

type AnalyticsParams = {
    days?: number // Number of days to analyze (default 30)
}

type AnalyticsResponse = {
    dailyStats: DailyStats[]
    tagStats: TagStats[]
    totalMinutes: number
    totalLogs: number
    averageMinutesPerDay: number
    longestSession: number
    currentStreak: number
    dailyGoal: number
}

export async function getAnalytics({ days = 30 }: AnalyticsParams = {}): Promise<AnalyticsResponse> {
    const { user } = await getSession()
    if (!user) {
        throw new Error("User must be logged in to get analytics")
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Get all finished logs in the time range
    const logs = await prisma.log.findMany({
        where: {
            userId: user.id,
            finishedAt: { not: null },
            startedAt: { gte: startDate }
        },
        include: {
            tags: true
        },
        orderBy: {
            startedAt: "desc"
        }
    })

    // Get user's daily goal
    const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: { dailyGoal: true }
    })
    const dailyGoal = userData?.dailyGoal || 480 // Default 8 hours

    // Calculate daily stats
    const dailyMap = new Map<string, DailyStats>()
    
    for (const log of logs) {
        const dateKey = startOfDay(log.startedAt).toISOString()
        const existing = dailyMap.get(dateKey) || {
            date: startOfDay(log.startedAt),
            totalMinutes: 0,
            logCount: 0
        }
        existing.totalMinutes += log.duration || 0
        existing.logCount += 1
        dailyMap.set(dateKey, existing)
    }

    const dailyStats = Array.from(dailyMap.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Calculate tag stats
    const tagMap = new Map<string, TagStats>()
    
    for (const log of logs) {
        for (const tag of log.tags) {
            const existing = tagMap.get(tag.id) || {
                tag,
                totalMinutes: 0,
                logCount: 0
            }
            existing.totalMinutes += log.duration || 0
            existing.logCount += 1
            tagMap.set(tag.id, existing)
        }
    }

    const tagStats = Array.from(tagMap.values()).sort(
        (a, b) => b.totalMinutes - a.totalMinutes
    )

    // Calculate totals
    const totalMinutes = logs.reduce((sum, log) => sum + (log.duration || 0), 0)
    const totalLogs = logs.length
    const daysWithActivity = dailyStats.length
    const averageMinutesPerDay = daysWithActivity > 0 ? Math.round(totalMinutes / daysWithActivity) : 0
    const longestSession = logs.reduce((max, log) => Math.max(max, log.duration || 0), 0)

    // Calculate streak
    const currentStreak = calculateStreak(dailyStats)

    return {
        dailyStats,
        tagStats,
        totalMinutes,
        totalLogs,
        averageMinutesPerDay,
        longestSession,
        currentStreak,
        dailyGoal
    }
}

function calculateStreak(dailyStats: DailyStats[]): number {
    if (dailyStats.length === 0) return 0

    const today = startOfDay(new Date())
    const sortedDates = dailyStats
        .map(s => startOfDay(new Date(s.date)).getTime())
        .sort((a, b) => b - a) // Most recent first

    let streak = 0
    let expectedDate = today.getTime()

    for (const dateTime of sortedDates) {
        // Allow for today or yesterday to start the streak
        if (streak === 0 && dateTime !== expectedDate) {
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)
            if (dateTime === yesterday.getTime()) {
                expectedDate = yesterday.getTime()
            } else {
                break
            }
        }

        if (dateTime === expectedDate) {
            streak++
            expectedDate -= 24 * 60 * 60 * 1000 // Go back one day
        } else if (dateTime < expectedDate) {
            break // Gap in dates
        }
    }

    return streak
}

export async function getDailyTotal(date?: Date): Promise<{ totalMinutes: number; logCount: number }> {
    const { user } = await getSession()
    if (!user) {
        throw new Error("User must be logged in")
    }

    const targetDate = date || new Date()
    const dayStart = startOfDay(targetDate)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const result = await prisma.log.aggregate({
        where: {
            userId: user.id,
            finishedAt: { not: null },
            startedAt: {
                gte: dayStart,
                lt: dayEnd
            }
        },
        _sum: {
            duration: true
        },
        _count: true
    })

    return {
        totalMinutes: result._sum.duration || 0,
        logCount: result._count
    }
}

export async function updateDailyGoal(minutes: number): Promise<void> {
    const { user } = await getSession()
    if (!user) {
        throw new Error("User must be logged in")
    }

    if (minutes < 0 || minutes > 1440) {
        throw new Error("Daily goal must be between 0 and 1440 minutes")
    }

    await prisma.user.update({
        where: { id: user.id },
        data: { dailyGoal: minutes }
    })
}
