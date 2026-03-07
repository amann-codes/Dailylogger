"use server"

import { getSession } from "@/lib/actions/getSession"
import prisma from "@/lib/db"
import { DailyStats, TagStats } from "../types"
import { startOfDay } from "@/lib/domain"

type AnalyticsParams = {
    /** Range start (ISO) from client so timezone is correct. */
    rangeStartISO: string
    /** Range end (ISO) from client so timezone is correct. */
    rangeEndISO: string
    /** Start of "today" (ISO) from client for streak calculation. */
    todayStartISO: string
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

export async function getAnalytics({ rangeStartISO, rangeEndISO, todayStartISO }: AnalyticsParams): Promise<AnalyticsResponse> {
    const { user } = await getSession()
    if (!user) {
        throw new Error("User must be logged in to get analytics")
    }

    const rangeStart = new Date(rangeStartISO)
    const rangeEnd = new Date(rangeEndISO)

    // Get all finished logs in the time range (range from client = user's timezone)
    const logs = await prisma.log.findMany({
        where: {
            userId: user.id,
            finishedAt: { not: null },
            startedAt: {
                gte: rangeStart,
                lte: rangeEnd
            }
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

    // Calculate streak (use client's "today" so timezone is correct)
    const todayStart = new Date(todayStartISO)
    const currentStreak = calculateStreak(dailyStats, todayStart)

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

function calculateStreak(dailyStats: DailyStats[], todayStart: Date): number {
    if (dailyStats.length === 0) return 0

    const today = todayStart.getTime()
    const sortedDates = dailyStats
        .map(s => startOfDay(new Date(s.date)).getTime())
        .sort((a, b) => b - a) // Most recent first

    let streak = 0
    let expectedDate = today

    for (const dateTime of sortedDates) {
        // Allow for today or yesterday to start the streak
        if (streak === 0 && dateTime !== expectedDate) {
            const yesterday = new Date(todayStart)
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

/** Day boundaries from client (ISO) so "today" uses the user's timezone. */
export async function getDailyTotal(
    dayStartISO: string,
    dayEndISO: string
): Promise<{ totalMinutes: number; logCount: number }> {
    const { user } = await getSession()
    if (!user) {
        throw new Error("User must be logged in")
    }

    const dayStart = new Date(dayStartISO)
    const dayEnd = new Date(dayEndISO)

    const result = await prisma.log.aggregate({
        where: {
            userId: user.id,
            finishedAt: { not: null },
            startedAt: {
                gte: dayStart,
                lte: dayEnd
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
