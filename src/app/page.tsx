import ActivityPage from "@/components/logs/timer/logPage";
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Dailylogger",
    description: "Start the timer and log your activities"
}

export default function () {
  return <ActivityPage />
}