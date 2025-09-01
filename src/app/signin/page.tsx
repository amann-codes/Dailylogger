import SigninPage from "@/components/auth/signInPage";
import type { Metadata } from "next"

export const metaData: Metadata = {
    title: "Sign in | Dailylogger",
    description: "Sign in to log your activities"
}

export default function page() {
    return <SigninPage />
}