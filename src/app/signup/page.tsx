import SignupPage from "@/components/auth/signupPage";
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Sign in | Dailylogger",
    description: "Sign in to log your activities"
}

export default function Page() {
    return <SignupPage />
}