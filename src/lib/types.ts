export type Tag = {
    id: string;
    name: string;
    color: string;
    userId?: string;
}

export type Log = {
    id?: string;
    description?: string | null;
    startedAt: Date;
    finishedAt: Date | null;
    duration?: number | null; // in minutes
    tagIds?: string[];
    tags?: Tag[];
}

export type LogWithTags = Log & {
    tags: Tag[];
}

export enum Sort {
    desc = "desc",
    asc = "asc"
}

export type DailyStats = {
    date: Date;
    totalMinutes: number;
    logCount: number;
}

export type TagStats = {
    tag: Tag;
    totalMinutes: number;
    logCount: number;
}