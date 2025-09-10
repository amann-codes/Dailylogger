import { UserButton } from "./userButton";

export function Header() {
    return (
        <header
            className="
        w-full
        bg-gray-100
        p-4
        flex justify-between items-center border
        sm:fixed sm:top-6 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-5xl sm:rounded-2xl sm:z-50
      "
        >
            <div className="text-lg font-bold font-geist-sans">DailyLogger</div>
            <UserButton />
        </header>
    );
}
