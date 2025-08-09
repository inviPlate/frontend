import { NavBar } from "./navBar";
import type { ReactNode } from "react";

export function AppLayout({ children }: { children: ReactNode }) {

    return (
        <>
            <NavBar />
            <main
                className="flex-1 overflow-y-auto pt-16 px-4 pb-8 "
            >
                {children}
            </main>
        </>
    );
}