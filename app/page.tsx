import Link from "next/link";
import { ArrowUpRight, BarChart3, ShieldCheck, Zap, Globe, Cpu } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-amber-500 selection:text-black font-sans overflow-x-hidden">
            {/* Navigation */}
            <nav className="relative z-50 flex items-center justify-between px-6 py-8 md:px-12 max-w-350 mx-auto">
                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
                        <Cpu className="w-6 h-6 text-black" />
                    </div>
                    <span className="text-xl font-black tracking-tighter uppercase italic">Samuel&#39;s</span>
                </div>
                <div className="hidden md:flex items-center gap-10">
                    {['Intelligence', 'Hardware', 'Network'].map((item) => (
                        <Link key={item} href="#" className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 hover:text-white transition-colors">
                            {item}
                        </Link>
                    ))}
                </div>
                <div className="flex gap-4">
                    <Link href="/login" className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-colors">
                        Terminal
                    </Link>
                    <Link href="/register" className="bg-white text-black px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-[#0A0A0A] hover:text-white transition-all duration-300 transform active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        Initialize
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 pt-20 md:pt-32 pb-40 px-6 max-w-350 mx-auto">
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
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex flex-col-reverse items-center gap-4 p-6 rounded-2xl">
                                    <div className="text-3xl font-black italic mb-1 uppercase tracking-tighter">99.9%</div>
                                    <div className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Efficiency</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vertical Feature Strip */}
                <div className="mt-40 grid grid-cols-1 md:grid-cols-4 gap-px bg-white/5 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl">
                    {[
                        { title: "Growth Intelligence", icon: <BarChart3 className="w-5 h-5" />, color: "text-amber-500" },
                        { title: "Neural Security", icon: <ShieldCheck className="w-5 h-5" />, color: "text-emerald-500" },
                        { title: "Direct Pipeline", icon: <Zap className="w-5 h-5" />, color: "text-blue-500" },
                        { title: "Global Sync", icon: <Globe className="w-5 h-5" />, color: "text-purple-500" }
                    ].map((feature, i) => (
                        <div key={i} className="bg-[#0A0A0A]/80 p-10 hover:bg-neutral-900 transition-all group cursor-default">
                            <div className={`mb-12 ${feature.color} transform group-hover:scale-110 transition-transform`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-4 text-neutral-400 group-hover:text-white transition-colors">{feature.title}</h3>
                            <div className="w-8 h-0.5 bg-white/10 group-hover:w-full transition-all duration-500"></div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer Minimalist */}
            <footer className="py-20 px-6 border-t border-white/5">
                <div className="max-w-350 mx-auto flex flex-col md:flex-row justify-between items-center gap-10 opacity-40 hover:opacity-100 transition-opacity">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">Samuel&#39;s EST. 2026</p>
                    <div className="flex gap-8">
                        {['Privacy', 'Legal', 'Infrastructure'].map(item => (
                            <Link key={item} href="#" className="text-[10px] font-black uppercase tracking-widest hover:text-amber-500 transition-colors">{item}</Link>
                        ))}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">&copy; SAMUEL CORP</p>
                </div>
            </footer>
        </div>
    );
}
