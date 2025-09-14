export type Log = {
    id?: string;
    category: string;
    startedAt: Date;
    finishedAt: Date | null;
    status?: string;
}
export enum Sort {
    desc = "desc",
    asc = "asc"
}