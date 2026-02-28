import { AnalyticsPage } from "@/components/analytics/analyticsPage";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Analytics - Dailylogger",
  description: "View your productivity analytics and insights"
}

export default async function Page() {
  const session = await auth();
  if (!session) {
    redirect("/signin");
  }
  return <AnalyticsPage />;
}
