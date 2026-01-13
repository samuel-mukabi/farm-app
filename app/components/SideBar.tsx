"use client"
import Link from "next/link";
import { X, LayoutDashboard, Wheat, Syringe, Utensils, FileText, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import {createClient} from "@/supabase/client";

interface SideBarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface UserProfile {
    full_name: string | null;
    email: string | null;
}

const SideBar = ({ isOpen, onClose }: SideBarProps) => {
    const supabase = createClient();
    const [user, setUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: authData, error: authError } = await supabase.auth.getUser();
            if (authError || !authData.user) return;

            const { data, error } = await supabase
                .from("users")
                .select("full_name, email")
                .eq("auth_id", authData.user.id)
                .single();

            if (!error) {
                setUser(data);
            }
        };

        fetchUser();
    }, [supabase]);

    const getInitials = (name: string | null) => {
        if (!name) return "";
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) {
            return parts[0][0].toUpperCase();
        }
        return (parts[0][0] + parts[1][0]).toUpperCase();
    };

    const navItems = [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Crops", href: "/crops", icon: Wheat },
        { label: "Vaccinations", href: "/vaccinations", icon: Syringe },
        { label: "Feeds", href: "/feeds", icon: Utensils },
        { label: "Reports", href: "/reports", icon: FileText },
        { label: "Settings", href: "/settings", icon: Settings },
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={`
                fixed top-0 left-0 h-screen w-72 bg-white border-r border-neutral-100 z-50 
                transition-transform duration-300 lg:sticky lg:translate-x-0 
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                flex flex-col shadow-[2px_0_4px_rgba(0,0,0,0.01)]
            `}>
                <div className="flex items-center justify-between h-20 px-6">
                    <div className="font-extrabold text-xl text-neutral-900 tracking-tight">SAMUEL&#39;S FARM</div>
                    <button onClick={onClose} className="lg:hidden p-2 text-neutral-400 hover:text-neutral-900">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 px-4 overflow-y-auto">
                    <ul className="space-y-5 py-10">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                onClick={onClose}
                                className="flex items-center gap-3 py-3 px-4 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl text-xs font-bold uppercase tracking-widest transition-all group"
                                href={item.href}>
                                <item.icon className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                                <li>{item.label}</li>
                            </Link>
                        ))}
                    </ul>
                </nav>
                {
                    user ?
                        <div className="p-6 border-t border-neutral-50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full border border-neutral-300 bg-neutral-50 flex items-center justify-center text-neutral-600 font-bold">
                                    {user?.full_name ? getInitials(user?.full_name) : "?"}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <p className="text-neutral-900 font-bold text-sm truncate">
                                        {user?.full_name ?? "—"}
                                    </p>
                                    <p className="text-neutral-400 text-xs truncate">
                                        {user?.email ?? ""}
                                    </p>
                                </div>
                            </div>
                        </div> :
                        <Link href="/login" className="text-center p-6 border-t border-neutral-200 hover:bg-neutral-800 hover:text-neutral-100">
                            Log In
                        </Link>
                }

            </aside>
        </>
    )
}

export default SideBar;
