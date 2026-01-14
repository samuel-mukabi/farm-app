"use client"

import { useState } from "react"
import Link from "next/link"
import { signUpAction } from "../actions"
import { ArrowRight, Lock, Mail, User, Loader2, AlertCircle } from "lucide-react"

export default function RegisterPage() {
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        try {
            await signUpAction(formData)
        } catch (e) {
            setError(e instanceof Error ? e.message : "An error occurred")
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-neutral-900 tracking-tight mb-2">Get Started</h1>
                    <p className="text-neutral-500 font-medium">Join our farm management network today.</p>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-100 shadow-xl shadow-neutral-100/50 p-8 md:p-10">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                <p className="text-sm text-red-600 font-semibold leading-tight">{error}</p>
                            </div>
                        )}

                        <div className="">
                            <label className="text-[10px] font-bold text-neutral-900 uppercase tracking-widest ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-300 group-focus-within:text-neutral-900 transition-colors" />
                                <input
                                    type="text"
                                    name="full_name"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Samuel Njenga"
                                    className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-50 text-sm focus:outline-none transition-all placeholder:text-neutral-300"
                                />
                            </div>
                        </div>

                        <div className="">
                            <label className="text-[10px] font-bold text-neutral-900 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-300 group-focus-within:text-neutral-900 transition-colors" />
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@farm.com"
                                    className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-50 text-sm focus:outline-none transition-all placeholder:text-neutral-300"
                                />
                            </div>
                        </div>

                        <div className="">
                            <label className="text-[10px] font-bold text-neutral-900 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-300 group-focus-within:text-neutral-900 transition-colors" />
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-50 text-sm focus:outline-none transition-all placeholder:text-neutral-300"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-neutral-900 hover:bg-black text-white py-4 rounded-md text-sm font-bold transition-all shadow-lg shadow-neutral-200 flex items-center justify-center gap-2 group disabled:opacity-50 mt-4"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-neutral-50 text-center">
                        <p className="text-sm text-neutral-400 font-medium">
                            Already have an account?{" "}
                            <Link href="/login" className="text-neutral-900 font-bold hover:underline decoration-2 underline-offset-4">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>
                <p className="text-center text-[10px] text-neutral-400 font-bold mt-8 uppercase tracking-widest leading-relaxed">
                    By joining, you agree to our Terms of Service<br />and Privacy Policy
                </p>
            </div>
        </div>
    )
}
