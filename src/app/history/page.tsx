import { HistoryPage } from "@/components/logs/history/historyPage";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Activity History - Dailylogger",
  description: "View all your logged activities"
}

export default async function Page() {
  const session = await auth();
  if (!session) {
    redirect("/signin");
  }
  return <HistoryPage />;
}
