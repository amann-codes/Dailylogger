"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Log } from "@/lib/types"
import { ChevronDown, ChevronUp } from "lucide-react"

function pad(n: number) {
    return n.toString().padStart(2, "0")
}

function toHMS(ms: number) {
    const totalSeconds = Math.floor(ms / 1000)
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    return { h, m, s }
}

type LogProps = {
    handleCreate: (category: string, startedAt: Date, description?: string) => void
    handleUpdate: () => void
    isCreating: boolean
    isUpdating: boolean
    isFetchingRunningLog: boolean
    runningLog: Log | null
}

export function CreateLog({ handleCreate, handleUpdate, isCreating, isUpdating, isFetchingRunningLog, runningLog }: LogProps) {
    const [elapsed, setElapsed] = useState(0)
    const [running, setRunning] = useState(false)
    const [activityName, setActivityName] = useState("")
    const [description, setDescription] = useState("")
    const [showDescription, setShowDescription] = useState(false)
    const baseElapsedRef = useRef(0)
    const startAtRef = useRef<number | null>(null)
    const rafRef = useRef<number | null>(null)
    const isInitialized = useRef<boolean>(false);

    const start = () => {
        if (running) return
        setRunning(true)
        startAtRef.current = performance.now()

        const tick = () => {
            if (startAtRef.current == null) return
            const now = performance.now()
            const current = baseElapsedRef.current + (now - startAtRef.current)
            setElapsed(current)
            rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
    }

    const stop = () => {
        if (!running) return
        setRunning(false)
        startAtRef.current = null
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = null
        reset()
        return true
    }

    const reset = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = null
        startAtRef.current = null
        baseElapsedRef.current = 0
        setElapsed(0)
        setRunning(false)
        setActivityName("")
        setDescription("")
        setShowDescription(false)
    }

    useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [])

    useEffect(() => {
        if (runningLog && !isInitialized.current) {
            if (runningLog?.startedAt) {
                baseElapsedRef.current = new Date().getTime() - new Date(runningLog.startedAt).getTime()
            }
            if (runningLog?.category) {
                setActivityName(runningLog.category)
            }
            if (runningLog?.status === "Running") {
                start()
            }
            isInitialized.current = true
        }

    }, [runningLog])

    const handleCreateLog = () => {
        if (!activityName.trim()) {
            toast.error("Please enter an activity name")
            return
        }
        start()
        handleCreate(activityName.trim(), new Date(), description.trim() || undefined)
    }

    const handleUpdateLog = () => {
        if (stop()) {
            handleUpdate()
        }
    }

    const { h, m, s } = toHMS(elapsed)

    return (
        <Card className="max-w-2xl w-full sm:rounded-xl rounded-none  sm:py-6 py-3">
            <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div
                        tabIndex={0}
                        aria-pressed={running}
                        aria-label={running ? "Stop stopwatch" : "Start stopwatch"}
                        className={`rounded-lg border bg-card text-foreground shadow-sm p-4 flex flex-col items-center gap-2 select-none
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-ring flex-1 w-full sm:w-auto`}
                    >
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Stopwatch</span>
                        <div
                            className="font-mono text-base tracking-tight"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            <span>{pad(h)}</span>
                            <span className={running ? "mx-1 opacity-70 animate-pulse" : "mx-1 opacity-40"}>:</span>
                            <span>{pad(m)}</span>
                            <span className={running ? "mx-1 opacity-70 animate-pulse" : "mx-1 opacity-40"}>:</span>
                            <span>{pad(s)}</span>
                        </div>
                        <span className="sr-only">{running ? "Running" : "Stopped"}</span>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                        <div className="flex items-center gap-3 w-full">
                            <Input
                                placeholder="Activity name"
                                value={activityName}
                                onChange={(e) => setActivityName(e.target.value)}
                                className="w-full"
                                disabled={running || isCreating || isUpdating || isFetchingRunningLog}
                                aria-label="Activity name"
                            />
                            <Button
                                onClick={running ? handleUpdateLog : handleCreateLog}
                                disabled={isCreating || isUpdating || !activityName.trim() || isFetchingRunningLog}
                                aria-label={running ? "Finish activity" : "Start activity"}
                            >
                                {running ? "Finish" : "Start"}
                            </Button>
                        </div>
                        {!running && (
                            <div className="w-full mt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowDescription(!showDescription)}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    disabled={isCreating || isUpdating || isFetchingRunningLog}
                                >
                                    {showDescription ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                    {showDescription ? "Hide description" : "Add description (optional)"}
                                </button>
                                {showDescription && (
                                    <textarea
                                        placeholder="Add a description, notes, or URL..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="mt-2 w-full min-h-[60px] px-3 py-2 text-sm border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                                        disabled={isCreating || isUpdating || isFetchingRunningLog}
                                        aria-label="Activity description"
                                    />
                                )}
                            </div>
                        )}
                        <p className="text-center text-xs text-muted-foreground mt-4">
                            Click on {running ? "stop" : "start"} button to {running ? "stop" : "start"} timer.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}