/**
 * Domain logic - pure functions for time tracking
 * No side effects, no database calls
 */

/**
 * Calculate duration in minutes between two dates
 */
export function calculateDuration(startedAt: Date, finishedAt: Date): number {
    const start = new Date(startedAt).getTime()
    const end = new Date(finishedAt).getTime()
    return Math.max(0, Math.round((end - start) / (1000 * 60)))
}

/**
 * Calculate elapsed time in milliseconds from start to now
 */
export function calculateElapsed(startedAt: Date): number {
    return Math.max(0, Date.now() - new Date(startedAt).getTime())
}

/**
 * Validate time range - finishedAt must be after startedAt
 */
export function validateTimeRange(startedAt: Date, finishedAt: Date): boolean {
    return new Date(finishedAt).getTime() > new Date(startedAt).getTime()
}

/**
 * Check if a log is currently running
 */
export function isRunning(finishedAt: Date | null | undefined): boolean {
    return finishedAt === null || finishedAt === undefined
}

/**
 * Format duration in minutes to human readable string
 */
export function formatDuration(minutes: number): string {
    if (minutes < 1) return "< 1m"
    
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
}

/**
 * Format duration from milliseconds to HH:MM:SS
 */
export function formatElapsed(ms: number): { hours: number; minutes: number; seconds: number } {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return { hours, minutes, seconds }
}

/**
 * Format time as HH:MM:SS string
 */
export function formatTimeString(hours: number, minutes: number, seconds: number): string {
    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

/**
 * Get start of day for a given date
 */
export function startOfDay(date: Date): Date {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
}

/**
 * Get end of day for a given date
 */
export function endOfDay(date: Date): Date {
    const d = new Date(date)
    d.setHours(23, 59, 59, 999)
    return d
}

/**
 * Get date N days ago
 */
export function daysAgo(days: number): Date {
    const d = new Date()
    d.setDate(d.getDate() - days)
    return startOfDay(d)
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (days > 0) {
        return days === 1 ? 'Yesterday' : `${days} days ago`
    }
    if (hours > 0) {
        return hours === 1 ? '1 hour ago' : `${hours} hours ago`
    }
    if (minutes > 0) {
        return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
    }
    return 'Just now'
}

/**
 * Calculate progress percentage toward goal
 */
export function calculateProgress(currentMinutes: number, goalMinutes: number): number {
    if (goalMinutes <= 0) return 0
    return Math.min(100, Math.round((currentMinutes / goalMinutes) * 100))
}

/**
 * Predefined tag colors
 */
export const TAG_COLORS = [
    "#ef4444", // red
    "#f97316", // orange
    "#f59e0b", // amber
    "#eab308", // yellow
    "#84cc16", // lime
    "#22c55e", // green
    "#14b8a6", // teal
    "#06b6d4", // cyan
    "#0ea5e9", // sky
    "#3b82f6", // blue
    "#6366f1", // indigo
    "#8b5cf6", // violet
    "#a855f7", // purple
    "#d946ef", // fuchsia
    "#ec4899", // pink
    "#64748b", // slate
] as const

/**
 * Get a random tag color
 */
export function getRandomTagColor(): string {
    return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]
}

/**
 * Extract URLs from text
 */
export function extractUrls(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/gi
    return text.match(urlRegex) || []
}

/**
 * Get domain from URL
 */
export function getDomain(url: string, maxLength = 25): string {
    try {
        const domain = new URL(url).hostname.replace('www.', '')
        return domain.length > maxLength ? domain.substring(0, maxLength) + '...' : domain
    } catch {
        return url.length > maxLength ? url.substring(0, maxLength) + '...' : url
    }
}

/**
 * Group logs by date
 */
export function groupByDate<T extends { startedAt: Date }>(logs: T[]): Map<string, T[]> {
    const groups = new Map<string, T[]>()
    
    for (const log of logs) {
        const dateKey = startOfDay(new Date(log.startedAt)).toISOString()
        const existing = groups.get(dateKey) || []
        existing.push(log)
        groups.set(dateKey, existing)
    }
    
    return groups
}
