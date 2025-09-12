"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { signUp } from "@/lib/actions/signUp";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const signUpSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Invalid email address."),
    password: z.string().min(6, "Password must be at least 6 characters."),
});

type signUpType = z.infer<typeof signUpSchema>;

export default function SignUp() {
    const router = useRouter();

    const form = useForm<signUpType>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    });

    const signUpMutation = useMutation({
        mutationFn: signUp,
        onSuccess: () => {
            toast.success("Account created successfully!, Please sign in to continue");
            router.push("/signin");
        },
    });

    const onSubmit = async (data: signUpType) => {
        signUpMutation.mutate(data);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="w-full max-w-xs p-5 bg-white border rounded-lg shadow-sm">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-mono text-xs font-medium">Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="Your name"
                                            className="font-mono text-xs h-9"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-destructive text-xs font-mono" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-mono text-xs font-medium">Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="user@example.com"
                                            className="font-mono text-xs h-9"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-destructive text-xs font-mono" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-mono text-xs font-medium">Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••"
                                            className="font-mono text-xs h-9"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-destructive text-xs font-mono" />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            className="w-full font-mono text-xs h-9"
                            disabled={signUpMutation.isPending}
                        >
                            {signUpMutation.isPending ? (
                                <>
                                    <p>Signing up...</p>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                </>
                            ) : (
                                "Sign Up"
                            )}
                        </Button>
                        <div className="text-xs text-center">
                            Already have an account?
                            <Link className="underline ml-1" href={"/signin"}>
                                Signin
                            </Link>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}