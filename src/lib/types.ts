export type Log = {
    category: string;
    startedAt: Date;
    finishedAt: Date | null;
    status?: string;
}
export enum Sort {
    desc = "desc",
    asc = "asc"
}