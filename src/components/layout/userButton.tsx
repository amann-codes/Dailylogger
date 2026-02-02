"use client"

import { useSession, signOut } from "next-auth/react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { getInitials } from "@/lib/utils";
import { History, LogOutIcon } from "lucide-react";
import Link from "next/link";

export function UserButton() {
    const { data: session } = useSession();
    const name = session?.user?.name
    const email = session?.user?.email
    const image = session?.user?.image
    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <Avatar>
                    {
                        image &&
                        < AvatarImage src={image} />
                    }
                    {
                        name &&
                        < AvatarFallback className="text-gray-100 bg-black"> {getInitials(name)}</AvatarFallback>
                    }
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem>{name}</DropdownMenuItem>
                <DropdownMenuItem>{email}</DropdownMenuItem>
                <Link href={'/history'}>
                    <DropdownMenuItem><History />History</DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                    Sign out <LogOutIcon />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu >
    )
}