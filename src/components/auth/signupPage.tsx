import SignUp from "@/components/auth/signup"
import type { Metadata } from "next"

export const metaData: Metadata = {
    title: "Sign up | Dailylogger",
    description: "Sign up to create your account"
}

export default function SignupPage() {
    return <SignUp />
}