import ActivityPage from "@/components/logs/timer/logPage";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dailylogger",
  description: "Start the timer and log your activities"
}

export default async function Page() {
  const session = await auth();
  if (!session) {
    redirect("/signin");
  }
  return <ActivityPage />;
}