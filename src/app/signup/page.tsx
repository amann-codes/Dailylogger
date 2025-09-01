import SignupPage from "@/components/auth/signupPage";
import type { Metadata } from "next"

export const metaData: Metadata = {
    title: "Sign in | Dailylogger",
    description: "Sign in to log your activities"
}

export default function page() {
    return <SignupPage />
}