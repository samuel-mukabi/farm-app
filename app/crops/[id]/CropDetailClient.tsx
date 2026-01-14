"use client"

import { useState } from "react";
import { Loader2, Plus, X, ClipboardList } from "lucide-react";
import { recordDailyLog } from "./actions";

export function DailyLogModal({ cropId }: { cropId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full bg-neutral-900 hover:bg-black text-white py-4 rounded-xl text-xs font-bold transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
            >
                <ClipboardList className="w-4 h-4" /> Record Daily Log
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-neutral-900">New Daily Log Entry</h2>
                    <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form action={async (formData) => {
                    setIsLoading(true);
                    try {
                        const data = {
                            mortality: parseInt(formData.get("mortality") as string) || 0,
                            c1_bags: parseInt(formData.get("c1_bags") as string) || 0,
                            c2_bags: parseInt(formData.get("c2_bags") as string) || 0,
                            c3_bags: parseInt(formData.get("c3_bags") as string) || 0,
                            avg_weight_g: parseFloat(formData.get("avg_weight_g") as string) || undefined,
                            notes: formData.get("notes") as string
                        };
                        await recordDailyLog(cropId, data);
                        setIsOpen(false);
                    } catch (e) {
                        alert(e instanceof Error ? e.message : "An error occurred");
                    } finally {
                        setIsLoading(false);
                    }
                }} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Mortality</label>
                        <input type="number" name="mortality" className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl text-sm" placeholder="0" />
                    </div>


                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">C1 Bags</label>
                            <input type="number" name="c1_bags" className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl text-sm" placeholder="0" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">C2 Bags</label>
                            <input type="number" name="c2_bags" className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl text-sm" placeholder="0" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">C3 Bags</label>
                            <input type="number" name="c3_bags" className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl text-sm" placeholder="0" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Avg Weight (g)</label>
                            <input type="number" step="1" name="avg_weight_g" className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl text-sm" placeholder="Optional" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Notes</label>
                        <textarea name="notes" rows={3} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl text-sm" placeholder="General observations..."></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-neutral-900 hover:bg-black text-white py-4 rounded-xl text-sm font-bold transition-all shadow-lg uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Daily Log"}
                    </button>
                </form>
            </div>
        </div>
    );
}
