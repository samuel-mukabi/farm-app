"use client"

import { useState } from "react";
import { CheckCircle2, Loader2, Scale, X } from "lucide-react";
import { harvestCrop } from "./actions";

interface HarvestModalProps {
    cropId: string;
    liveBirds: number;
}

export function HarvestModal({ cropId}: HarvestModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [weights, setWeights] = useState({
        heavy: '',
        medium: '',
        light: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const calculateAverage = (avgG: string) => {
                if (!avgG) return undefined;
                return parseFloat(avgG);
            };

            await harvestCrop(cropId, {
                avg_weight_heavy: calculateAverage(weights.heavy),
                avg_weight_medium: calculateAverage(weights.medium),
                avg_weight_light: calculateAverage(weights.light),
            });
            setIsOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to harvest crop");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="bg-black text-white px-4 py-3 rounded-md text-sm font-bold transition-all uppercase tracking-widest flex items-center gap-2 group active:scale-[0.98]"
            >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                Harvest Crop
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
                            <Scale className="w-6 h-6 text-emerald-500" />
                            Final Weighing
                        </h3>
                        <p className="text-neutral-500 mt-2 text-sm">Enter the <strong>AVERAGE</strong> weight (in grams) per bird for each group.</p>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-400 hover:text-neutral-900"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="group">
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 group-focus-within:text-emerald-600 transition-colors">
                                Heavy Group Avg (g)
                            </label>
                            <input
                                type="number"
                                step="1"
                                placeholder="e.g. 2500"
                                value={weights.heavy}
                                onChange={e => setWeights({ ...weights, heavy: e.target.value })}
                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 font-bold text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                        </div>

                        <div className="group">
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 group-focus-within:text-emerald-600 transition-colors">
                                Medium Group Avg (g)
                            </label>
                            <input
                                type="number"
                                step="1"
                                placeholder="e.g. 2100"
                                value={weights.medium}
                                onChange={e => setWeights({ ...weights, medium: e.target.value })}
                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 font-bold text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                        </div>

                        <div className="group">
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 group-focus-within:text-emerald-600 transition-colors">
                                Light Group Avg (g)
                            </label>
                            <input
                                type="number"
                                step="1"
                                placeholder="e.g. 1800"
                                value={weights.light}
                                onChange={e => setWeights({ ...weights, light: e.target.value })}
                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 font-bold text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="flex-1 px-6 py-3 rounded-xl font-bold text-sm text-neutral-600 hover:bg-neutral-50 transition-colors uppercase tracking-widest"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 bg-neutral-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing
                                </>
                            ) : (
                                "Complete Harvest"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

