import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/db";
import { NextAuthConfig } from "next-auth";
import { compare } from "bcryptjs";
import Credentials from "next-auth/providers/credentials";

export const authOptions = {
    // debug: true,
    adapter: PrismaAdapter(prisma),
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: {
                    label: "Username",
                    type: "text",
                    placeholder: "username",
                },
                password: {
                    label: "Password",
                    type: "password",
                    placeholder: "Password",
                },
            },
            authorize: async (credentials) => {
                if (!credentials?.email || !credentials?.password) {
                    console.log("user not found");
                    return null;
                }
                const existingUser = await prisma.user.findFirst({
                    where: {
                        email: credentials?.email,
                    },
                    select: {
                        email: true,
                        password: true,
                        id: true,
                        name: true,
                    },
                });
                if (
                    existingUser &&
                    existingUser.password &&
                    (await compare(String(credentials.password), String(existingUser.password)))
                ) {
                    console.log("signed in, user found with correct credentials");
                    return {
                        id: existingUser.id,
                        email: existingUser.email,
                        name: existingUser.name,
                    };
                }
                console.log("user not found");
                return null;
            },
        }),
    ],
    callbacks: {
        jwt: async ({ user, token }) => {
            if (user) {
                token.userId = user.id || token.sub;
            }
            return token;
        },
        session: ({ session, token }: any) => {
            if (session.user) {
                session.user.id = token.userId;
            }
            return session;
        },
    },
    pages: {
        signIn: "/signin",
    },
    session: {
        strategy: "jwt",
    },
} satisfies NextAuthConfig;
