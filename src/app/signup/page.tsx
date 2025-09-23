import SignupPage from "@/components/auth/signup";
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Sign up | Dailylogger",
    description: "Sign up to craete your account"
}

export default function Page() {
    return <SignupPage />
}