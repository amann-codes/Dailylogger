"use client"

import { useQuery } from "@tanstack/react-query"
import { getAnalytics } from "@/lib/actions/analytics"
import { formatDuration } from "@/lib/domain"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts"
import {
    BarChart3,
    Clock,
    Flame,
    Loader2,
    Target,
    TrendingUp,
    Zap,
    ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function AnalyticsPage() {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["analytics"],
        queryFn: () => getAnalytics({ days: 30 }),
    })

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (isError) {
        return (
            <div className="flex flex-col min-h-screen w-full items-center justify-center">
                <p className="text-destructive">{error?.message || "Failed to load analytics"}</p>
            </div>
        )
    }

    if (!data) return null

    const {
        dailyStats,
        tagStats,
        totalMinutes,
        totalLogs,
        averageMinutesPerDay,
        longestSession,
        currentStreak,
        dailyGoal
    } = data

    // Prepare daily chart data
    const dailyChartData = dailyStats.map(stat => ({
        date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        minutes: stat.totalMinutes,
        hours: Math.round(stat.totalMinutes / 60 * 10) / 10
    }))

    // Prepare tag pie chart data
    const tagChartData = tagStats.slice(0, 8).map(stat => ({
        name: stat.tag.name,
        value: stat.totalMinutes,
        color: stat.tag.color
    }))

    return (
        <div className="flex flex-col min-h-screen w-full sm:items-center sm:space-y-4 sm:pt-8 pt-4 pb-8 px-3 sm:px-4 bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50">
            <Header />

            <div className="max-w-5xl w-full space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link href="/history">
                            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-1.5 sm:gap-2">
                                <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6" />
                                Analytics
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground">Last 30 days</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-lg sm:text-2xl font-bold">{formatDuration(totalMinutes)}</p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">Total Time</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-green-500/10 rounded-lg">
                                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-lg sm:text-2xl font-bold">{formatDuration(averageMinutesPerDay)}</p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">Daily Avg</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-orange-500/10 rounded-lg">
                                    <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-lg sm:text-2xl font-bold">{currentStreak}</p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">Day Streak</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-purple-500/10 rounded-lg">
                                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-lg sm:text-2xl font-bold">{formatDuration(longestSession)}</p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">Longest</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                    {/* Daily Activity Chart */}
                    <Card>
                        <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-2">
                            <CardTitle className="text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2">
                                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                                Daily Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
                            {dailyChartData.length === 0 ? (
                                <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground text-sm">
                                    No activity data yet
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={dailyChartData}>
                                        <XAxis 
                                            dataKey="date" 
                                            tick={{ fontSize: 9 }}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis 
                                            tick={{ fontSize: 9 }}
                                            tickFormatter={(v) => `${Math.round(v / 60)}h`}
                                            width={30}
                                        />
                                        <Tooltip 
                                            formatter={(value: number) => [formatDuration(value), "Time"]}
                                            labelStyle={{ color: 'black' }}
                                        />
                                        <Bar 
                                            dataKey="minutes" 
                                            fill="hsl(var(--primary))"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tag Distribution Chart */}
                    <Card>
                        <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-2">
                            <CardTitle className="text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2">
                                <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                                Time by Tag
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
                            {tagChartData.length === 0 ? (
                                <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground text-sm">
                                    No tag data yet
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={tagChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={35}
                                            outerRadius={60}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {tagChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value: number) => [formatDuration(value), "Time"]}
                                        />
                                        <Legend 
                                            formatter={(value) => <span className="text-[10px] sm:text-xs">{value}</span>}
                                            wrapperStyle={{ fontSize: '10px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Tag Stats List */}
                <Card>
                    <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-2">
                        <CardTitle className="text-sm sm:text-lg">Tag Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-2 sm:pt-4">
                        {tagStats.length === 0 ? (
                            <p className="text-muted-foreground text-center py-6 sm:py-8 text-xs sm:text-sm">
                                No activities with tags yet.
                            </p>
                        ) : (
                            <div className="space-y-2 sm:space-y-3">
                                {tagStats.map((stat) => {
                                    const percentage = totalMinutes > 0 
                                        ? Math.round((stat.totalMinutes / totalMinutes) * 100) 
                                        : 0
                                    return (
                                        <div key={stat.tag.id} className="flex items-center gap-2 sm:gap-3">
                                            <Badge
                                                style={{ backgroundColor: stat.tag.color }}
                                                className="text-white text-[10px] sm:text-xs min-w-[60px] sm:min-w-[80px] justify-center"
                                            >
                                                {stat.tag.name}
                                            </Badge>
                                            <div className="flex-1 h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full transition-all"
                                                    style={{ 
                                                        width: `${percentage}%`,
                                                        backgroundColor: stat.tag.color 
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs sm:text-sm font-mono w-12 sm:w-16 text-right">
                                                {formatDuration(stat.totalMinutes)}
                                            </span>
                                            <span className="text-[10px] sm:text-xs text-muted-foreground w-8 sm:w-12 text-right">
                                                {percentage}%
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Summary Stats */}
                <Card>
                    <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-2">
                        <CardTitle className="text-sm sm:text-lg">Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-2 sm:pt-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
                            <div>
                                <p className="text-xl sm:text-3xl font-bold">{totalLogs}</p>
                                <p className="text-[10px] sm:text-sm text-muted-foreground">Activities</p>
                            </div>
                            <div>
                                <p className="text-xl sm:text-3xl font-bold">{dailyStats.length}</p>
                                <p className="text-[10px] sm:text-sm text-muted-foreground">Active Days</p>
                            </div>
                            <div>
                                <p className="text-xl sm:text-3xl font-bold">{tagStats.length}</p>
                                <p className="text-[10px] sm:text-sm text-muted-foreground">Tags</p>
                            </div>
                            <div>
                                <p className="text-xl sm:text-3xl font-bold">{formatDuration(dailyGoal)}</p>
                                <p className="text-[10px] sm:text-sm text-muted-foreground">Daily Goal</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
