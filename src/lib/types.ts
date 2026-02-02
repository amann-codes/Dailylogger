export type Log = {
    id?: string;
    category: string;
    description?: string | null;
    startedAt: Date;
    finishedAt: Date | null;
    status?: string;
}
export enum Sort {
    desc = "desc",
    asc = "asc"
}