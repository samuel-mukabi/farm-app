"use client";

import Link from "next/link";
import { ArrowUpRight, Cpu } from "lucide-react";
import { useEffect, useState } from "react";
import {createClient} from "@/supabase/client";

export default function LandingPage() {
    const [session, setSession] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
        });
    }, []);

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-amber-500 selection:text-black font-sans overflow-x-hidden">
            {/* Navigation */}
            <nav className="relative z-50 flex items-center justify-between px-6 py-8 md:px-12 max-w-350 mx-auto">
                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
                        <Cpu className="w-6 h-6 text-black" />
                    </div>
                </div>
                <div className="flex gap-4">
                    <Link
                        href={session ? "/dashboard" : "/login"}
                        className="py-4 px-3 text-base font-black uppercase tracking-widest [text-shadow:0_0_20px_rgba(255,255,255,0.8)] md:text-white md:text-shadow-none transition-all md:hover:[text-shadow:0_0_20px_rgba(255,255,255,0.8)]"
                    >
                        {session ? "Dashboard" : "Log In"}
                    </Link>
                    <Link href="/register"
                          className={`${!session ? "bg-white text-black px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-[#0A0A0A] hover:text-white transition-all duration-300 transform active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]" : "hidden"}`}>
                        Sign Up
                    </Link>
                </div>
            </nav>
            {/* Hero Section */}
            <main className="relative z-10 pt-20 md:pt-40 pb-40 px-6 max-w-350 mx-auto min-h-210">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-8">
                        <h1 className="text-7xl md:text-[140px] font-black tracking-tighter leading-[0.85] uppercase mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            The New <br />
                            <span className="text-neutral-500">Standard</span> <br />
                            Of Farming
                        </h1>
                    </div>

                    <div className="lg:col-span-4 lg:pt-20">
                        <p className="text-lg md:text-xl text-neutral-400 font-medium leading-tight mb-12 max-w-sm animate-in fade-in slide-in-from-right-8 duration-1000 delay-100">
                            Architected for high-performance poultry operations. Monitor, analyze, and scale with an enterprise-grade infrastructure.
                        </p>
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                            <Link href="/register" className="group flex items-center justify-between bg-emerald-500 text-black p-6 rounded-2xl hover:bg-emerald-400 transition-all">
                                <span className="text-2xl font-black uppercase tracking-tighter italic">Get Started</span>
                                <ArrowUpRight className="w-8 h-8 group-hover:rotate-45 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer Minimalist */}
            <footer className="py-10 px-6 border-t border-white/5">
                <div className="max-w-350 mx-auto flex flex-col md:flex-row justify-between items-center gap-10 opacity-40 hover:opacity-100 transition-opacity">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">Samuel&#39;s EST. 2026</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">&copy; SAMUEL CORP</p>
                </div>
            </footer>
        </div>
    );
}
