"use client"

import { useState } from "react";
import { Plus, X, Loader2, CheckCircle2, Trash2 } from "lucide-react";
import { scheduleVaccination, administerVaccination, deleteVaccination } from "./actions";
import { Crop } from "@/types/farm";

export function ScheduleVaccineModal({ crops }: { crops: Crop[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [vaccineName, setVaccineName] = useState("")

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="bg-neutral-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm uppercase tracking-widest"
            >
                <Plus className="w-4 h-4" /> Schedule Vaccine
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-neutral-900">Schedule New Vaccine</h2>
                    <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form action={async (formData) => {
                    setIsLoading(true);
                    try {
                        await scheduleVaccination(formData);
                        setIsOpen(false);
                    } catch (e) {
                        alert(e instanceof Error ? e.message : "An error occurred");
                    } finally {
                        setIsLoading(false);
                    }
                }} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Select Crop</label>
                        <select
                            name="crop_id"
                            required
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/5 focus:bg-white transition-all"
                        >
                            {crops.map(crop => (
                                <option key={crop.id} value={crop.id}>{crop.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Vaccine Name</label>
                        <input
                            type="text"
                            name="vaccine_name"
                            value={vaccineName}
                            onChange={(e) => setVaccineName(e.target.value)}
                            required
                            placeholder="e.g. Gumboro (IBD)"
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/5 focus:bg-white transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Target Date</label>
                        <input
                            type="date"
                            name="target_date"
                            required
                            defaultValue={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/5 focus:bg-white transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-neutral-900 hover:bg-black text-white py-4 rounded-xl text-sm font-bold transition-all shadow-lg uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Schedule Vaccine"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export function AdministerVaccineModal({ id, isOpen, onClose }: { id: string, isOpen: boolean, onClose: () => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const [notes, setNotes] = useState("");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-neutral-900">Administer Vaccine</h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Notes / Observations</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any details about the vaccination day..."
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/5 focus:bg-white transition-all min-h-[120px]"
                        />
                    </div>

                    <button
                        onClick={async () => {
                            setIsLoading(true);
                            try {
                                await administerVaccination(id, notes);
                                onClose();
                            } catch (e) {
                                alert(e instanceof Error ? e.message : "An error occurred");
                            } finally {
                                setIsLoading(false);
                            }
                        }}
                        disabled={isLoading}
                        className="w-full bg-neutral-900 hover:bg-black text-white py-4 rounded-xl text-sm font-bold transition-all shadow-lg uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Administered"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function VaccinationActions({ id, status }: { id: string, status: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [isAdministerModalOpen, setIsAdministerModalOpen] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this schedule?")) return;
        setIsLoading(true);
        try {
            await deleteVaccination(id);
        } catch (e) {
            alert(e instanceof Error ? e.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {status === 'Pending' && (
                <>
                    <button
                        onClick={() => setIsAdministerModalOpen(true)}
                        disabled={isLoading}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Mark as Administered"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <AdministerVaccineModal
                        id={id}
                        isOpen={isAdministerModalOpen}
                        onClose={() => setIsAdministerModalOpen(false)}
                    />
                </>
            )}
            <button
                onClick={handleDelete}
                disabled={isLoading}
                className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Schedule"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
        </div>
    );
}
