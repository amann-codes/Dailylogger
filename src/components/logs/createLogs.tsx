"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { LogWithTags, Tag } from "@/lib/types"
import { Check, ChevronDown, ChevronUp, MoreHorizontal, Plus, X } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { isRunning, calculateElapsed, formatElapsed, formatTimeString } from "@/lib/domain"
import { cn } from "@/lib/utils"

type LogProps = {
    handleCreate: (description?: string, tagIds?: string[], startedAtISO?: string) => void
    handleUpdate: (finishedAtISO?: string) => void
    isCreating: boolean
    isUpdating: boolean
    isFetchingRunningLog: boolean
    runningLog: LogWithTags | null
    tags: Tag[]
    onCreateTag: (name: string) => Promise<Tag>
    onUpdateTag?: (tagId: string, name: string, color: string) => void
    onDeleteTag: (tagId: string) => void
    isDeletingTag?: boolean
}

export function CreateLog({ 
    handleCreate, 
    handleUpdate, 
    isCreating, 
    isUpdating, 
    isFetchingRunningLog, 
    runningLog,
    tags,
    onCreateTag,
    onUpdateTag,
    onDeleteTag,
    isDeletingTag = false,
}: LogProps) {
    const [elapsed, setElapsed] = useState(0)
    const [running, setRunning] = useState(false)
    const [description, setDescription] = useState("")
    const [showDescription, setShowDescription] = useState(false)
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
    const [newTagName, setNewTagName] = useState("")
    const [showTagInput, setShowTagInput] = useState(false)
    const [tagToEdit, setTagToEdit] = useState<Tag | null>(null)
    const [editTagName, setEditTagName] = useState("")
    const [editTagColor, setEditTagColor] = useState("#6366f1")
    const baseElapsedRef = useRef(0)
    const startAtRef = useRef<number | null>(null)
    const rafRef = useRef<number | null>(null)
    const isInitialized = useRef<boolean>(false)

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
        setDescription("")
        setShowDescription(false)
        setSelectedTagIds([])
        setNewTagName("")
        setShowTagInput(false)
    }

    useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [])

    useEffect(() => {
        if (runningLog && !isInitialized.current) {
            if (runningLog.startedAt) {
                baseElapsedRef.current = calculateElapsed(runningLog.startedAt)
            }
            if (runningLog.description) {
                setDescription(runningLog.description)
            }
            if (runningLog.tags && runningLog.tags.length > 0) {
                setSelectedTagIds(runningLog.tags.map(t => t.id))
            }
            if (isRunning(runningLog.finishedAt)) {
                start()
            }
            isInitialized.current = true
        }
    }, [runningLog])

    const handleCreateLog = () => {
        start()
        handleCreate(
            description.trim() || undefined,
            selectedTagIds.length > 0 ? selectedTagIds : undefined,
            new Date().toISOString()
        )
    }

    const handleUpdateLog = () => {
        if (stop()) {
            handleUpdate(new Date().toISOString())
        }
    }

    const handleAddTag = async () => {
        if (!newTagName.trim()) return
        try {
            const tag = await onCreateTag(newTagName.trim())
            setSelectedTagIds([...selectedTagIds, tag.id])
            setNewTagName("")
            setShowTagInput(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create tag")
        }
    }

    const toggleTag = (tagId: string) => {
        setSelectedTagIds(prev => 
            prev.includes(tagId) 
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        )
    }

    const { hours, minutes, seconds } = formatElapsed(elapsed)
    const pad = (n: number) => n.toString().padStart(2, "0")

    const isDisabled = isCreating || isUpdating || isFetchingRunningLog

    return (
        <div className="max-w-2xl w-full mx-auto bg-card border border-border sm:rounded-xl rounded-none px-4 py-6 sm:p-8 space-y-5 sm:space-y-6">
            
            {/* TIMER - Primary visual anchor */}
            <div className="flex flex-col items-center justify-center space-y-1 sm:space-y-2">
                <span className="text-[10px] sm:text-xs tracking-widest text-muted-foreground uppercase">
                    Stopwatch
                </span>
                <div
                    className={cn(
                        "font-mono font-semibold tracking-tight transition-all duration-300",
                        running ? "text-5xl sm:text-6xl scale-105" : "text-4xl sm:text-5xl"
                    )}
                    aria-live="polite"
                    aria-atomic="true"
                >
                    <span>{pad(hours)}</span>
                    <span className={cn("mx-0.5 sm:mx-1", running ? "opacity-70 animate-pulse" : "opacity-40")}>:</span>
                    <span>{pad(minutes)}</span>
                    <span className={cn("mx-0.5 sm:mx-1", running ? "opacity-70 animate-pulse" : "opacity-40")}>:</span>
                    <span>{pad(seconds)}</span>
                </div>
            </div>

            {/* TAG CHIPS - same pattern as FlairList: badge expands on hover, icon appears beside text */}
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                {tags.map(tag => (
                    <div key={tag.id} className={cn("relative group mx-0.5", running && "opacity-70")}>
                        {tagToEdit?.id === tag.id ? (
                            <div
                                className="rounded-full border shadow-sm flex items-center gap-1 pr-0.5 py-0.5 pl-2.5 sm:pl-3 min-w-[120px]"
                                style={{ backgroundColor: editTagColor, borderColor: "rgba(255,255,255,0.3)" }}
                            >
                                <Input
                                    value={editTagName}
                                    onChange={(e) => setEditTagName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault()
                                            if (editTagName.trim() && onUpdateTag) {
                                                onUpdateTag(tag.id, editTagName.trim(), editTagColor)
                                                setTagToEdit(null)
                                                toast.success("Tag updated")
                                            } else if (!editTagName.trim()) toast.error("Tag name cannot be empty")
                                        }
                                        if (e.key === "Escape") setTagToEdit(null)
                                    }}
                                    className="h-6 sm:h-7 border-0 bg-white/90 text-xs sm:text-sm rounded-full flex-1 min-w-0 px-2.5 focus-visible:ring-0"
                                    placeholder="Tag name"
                                    autoFocus
                                />
                                <input
                                    type="color"
                                    value={editTagColor}
                                    onChange={(e) => setEditTagColor(e.target.value)}
                                    className="w-6 h-6 rounded-full border-0 cursor-pointer bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0"
                                    aria-label="Tag color"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (editTagName.trim() && onUpdateTag) {
                                            onUpdateTag(tag.id, editTagName.trim(), editTagColor)
                                            setTagToEdit(null)
                                            toast.success("Tag updated")
                                        } else if (!editTagName.trim()) toast.error("Tag name cannot be empty")
                                    }}
                                    className="rounded-full p-1 hover:bg-white/20 text-white"
                                    aria-label="Save"
                                >
                                    <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTagToEdit(null)}
                                    className="rounded-full p-1 hover:bg-white/20 text-white"
                                    aria-label="Cancel"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => !running && toggleTag(tag.id)}
                                    disabled={isDisabled || running}
                                    className={cn(
                                        "rounded-full border text-xs sm:text-sm transition-all px-2.5 py-1 sm:px-3 sm:py-1.5 text-left",
                                        "group-hover:pr-6",
                                        selectedTagIds.includes(tag.id)
                                            ? "border-transparent shadow-sm text-white"
                                            : "border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                                    )}
                                    style={selectedTagIds.includes(tag.id) ? { backgroundColor: tag.color } : {}}
                                >
                                    {tag.name}
                                </button>
                                {!running && (
                                    <>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    type="button"
                                                    onClick={(e) => e.stopPropagation()}
                                                    disabled={isDisabled || isDeletingTag}
                                                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hover:cursor-pointer pointer-events-none group-hover:pointer-events-auto data-[state=open]:opacity-100 data-[state=open]:pointer-events-auto"
                                                    aria-label={`Options for ${tag.name}`}
                                                    style={{ color: selectedTagIds.includes(tag.id) ? "white" : undefined }}
                                                >
                                                    <MoreHorizontal className="h-4 w-4 mr-0.5" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setTagToEdit(tag)
                                                        setEditTagName(tag.name)
                                                        setEditTagColor(tag.color)
                                                    }}
                                                    disabled={isDeletingTag}
                                                >
                                                    Edit tag
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => {
                                                        setSelectedTagIds((prev) => prev.filter((id) => id !== tag.id))
                                                        onDeleteTag(tag.id)
                                                    }}
                                                    disabled={isDeletingTag}
                                                >
                                                    Delete tag
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                ))}
                {!running && !showTagInput && (
                    <button
                        type="button"
                        onClick={() => setShowTagInput(true)}
                        className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-full border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground transition-all flex items-center gap-1"
                        disabled={isDisabled}
                    >
                        <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        New tag
                    </button>
                )}
            </div>

            {/* New tag input */}
            {!running && showTagInput && (
                <div className="flex items-center justify-center gap-2 max-w-xs mx-auto px-2">
                    <Input
                        placeholder="Tag name"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        className="h-9 text-sm flex-1"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                        autoFocus
                    />
                    <Button size="sm" onClick={handleAddTag} disabled={!newTagName.trim()}>
                        Add
                    </Button>
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => { setShowTagInput(false); setNewTagName("") }}
                        className="px-2"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* DESCRIPTION - Collapsible, inline */}
            {!running && (
                <div className="space-y-2 sm:space-y-3">
                    <button
                        type="button"
                        onClick={() => setShowDescription(!showDescription)}
                        className="flex items-center justify-center gap-1.5 w-full text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                        disabled={isDisabled}
                    >
                        {showDescription ? <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                        {showDescription ? "Hide description" : "Add description (optional)"}
                    </button>
                    {showDescription && (
                        <textarea
                            placeholder="Add a description, notes, or URL..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full min-h-[80px] sm:min-h-[90px] px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            disabled={isDisabled}
                            aria-label="Activity description"
                        />
                    )}
                </div>
            )}

            {/* ACTION BUTTON - Anchored at bottom */}
            <Button
                onClick={running ? handleUpdateLog : handleCreateLog}
                disabled={isDisabled}
                size="lg"
                variant={running ? "destructive" : "default"}
                className="w-full text-sm sm:text-base font-medium h-11 sm:h-12"
                aria-label={running ? "Stop activity" : "Start activity"}
            >
                {running ? "Stop" : "Start"}
            </Button>
        </div>
    )
}