"use server"

import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

export const signUp = async ({ name, email, password }: { name: string, email: string, password: string }) => {
    try {
        if (!email || !password) {
            return ({
                status: 400,
                statusText: 'Email and password are required'
            })
        }
        const existingUser = await prisma.user.findUnique({
            where: {
                email
            }
        })
        if (existingUser) {
            return ({
                status: 400,
                statusText: "User already exixts"
            })
        }
        const hashedPassword = await bcrypt.hashSync(password);
        const user = await prisma.user.create({
            data: {
                name, email, password: hashedPassword
            }
        })
        if (!user) {
            return ({
                status: 400,
                statusText: "Failed to create account"
            })
        }
    } catch (error) {
        throw new Error(`Error occured while creating account: ${error}`)
    }
}