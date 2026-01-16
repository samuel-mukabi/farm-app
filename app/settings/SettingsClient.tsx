"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { updateProfile } from "./actions";

export function ProfileForm({ initialData }: { initialData: { full_name?: string, farm_name?: string } }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    return (
        <form action={async (formData) => {
            setIsLoading(true);
            setIsSuccess(false);
            try {
                await updateProfile(formData);
                router.refresh();
                setIsSuccess(true);
                setTimeout(() => setIsSuccess(false), 3000);
            } catch (e) {
                alert(e instanceof Error ? e.message : "An error occurred");
            } finally {
                setIsLoading(false);
            }
        }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-neutral-900 uppercase tracking-widest pl-1">Full Name</label>
                    <input
                        type="text"
                        name="full_name"
                        defaultValue={initialData.full_name}
                        placeholder=""
                        className="px-6 py-4 bg-neutral-50 border border-neutral-100 rounded-md text-neutral-900 focus:outline-none focus:ring-neutral-900/5 focus:bg-white transition-all font-bold placeholder:text-neutral-300"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-neutral-900 uppercase tracking-widest pl-1">Farm Name</label>
                    <input
                        type="text"
                        name="farm_name"
                        defaultValue={initialData.farm_name}
                        placeholder=""
                        className="px-6 py-4 bg-neutral-50 border border-neutral-100 rounded-md text-neutral-900 focus:outline-none focus:ring-neutral-900/5 focus:bg-white transition-all font-bold placeholder:text-neutral-300"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-neutral-50">
                <div className="flex items-center gap-2">
                    {isSuccess && (
                        <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2 transition-all">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Profiles Saved
                        </span>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-10 py-4 bg-neutral-900 text-white rounded-md font-black hover:bg-black transition-all shadow-xl flex items-center gap-3 disabled:bg-neutral-400 uppercase tracking-widest text-[10px] cursor-pointer"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : ""}
                    Save
                </button>
            </div>
        </form>
    );
}

