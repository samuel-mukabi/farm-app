"use client"

import { useState } from "react";
import { Plus, X, Loader2, Utensils, RefreshCcw } from "lucide-react";
import { logFeedUsage, restockFeed } from "./actions";
import { FeedType, Crop } from "@/types/farm";

export function FeedManagementModals({ feedTypes, crops }: { feedTypes: FeedType[], crops: Crop[] }) {
    const [activeModal, setActiveModal] = useState<'usage' | 'restock' | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const closeModal = () => setActiveModal(null);

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={() => setActiveModal('usage')}
                className="bg-neutral-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm uppercase tracking-widest"
            >
                <Plus className="w-4 h-4" /> Log Usage
            </button>
            <button
                onClick={() => setActiveModal('restock')}
                className="bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm uppercase tracking-widest"
            >
                <RefreshCcw className="w-4 h-4" /> Restock
            </button>

            {activeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-neutral-900">
                                {activeModal === 'usage' ? 'Log Feed Usage' : 'Restock Feed'}
                            </h2>
                            <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form action={async (formData) => {
                            setIsLoading(true);
                            try {
                                if (activeModal === 'usage') await logFeedUsage(formData);
                                else await restockFeed(formData);
                                closeModal();
                            } catch (e) {
                                alert(e instanceof Error ? e.message : "An error occurred");
                            } finally {
                                setIsLoading(false);
                            }
                        }} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Feed Type</label>
                                <select
                                    name="feed_type_id"
                                    required
                                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/5 focus:bg-white transition-all"
                                >
                                    {feedTypes.map(ft => (
                                        <option key={ft.id} value={ft.id}>{ft.name}</option>
                                    ))}
                                </select>
                            </div>

                            {activeModal === 'usage' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Assign to Crop (Optional)</label>
                                    <select
                                        name="crop_id"
                                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/5 focus:bg-white transition-all"
                                    >
                                        <option value="">N/A</option>
                                        {crops.map(crop => (
                                            <option key={crop.id} value={crop.id}>{crop.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Quantity (kg)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    name="quantity_kg"
                                    required
                                    placeholder="e.g. 50"
                                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/5 focus:bg-white transition-all"
                                />
                                <p className="text-[10px] text-neutral-400 italic">Tip: One bag is usually 50kg.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-neutral-900 hover:bg-black text-white py-4 rounded-xl text-sm font-bold transition-all shadow-lg uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (activeModal === 'usage' ? "Log Usage" : "Record Restock")}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
