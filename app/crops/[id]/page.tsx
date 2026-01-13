import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Info, CheckCircle2, AlertCircle, LucideIcon } from "lucide-react";
import { createClient } from "@/supabase/server";
import { Crop, ChickSource, DailyLog } from "@/types/farm";
import { harvestCrop, recordMortality } from "./actions";

const DetailCard = ({ label, value, icon: Icon }: { label: string, value: string | number, icon: LucideIcon }) => (
    <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-neutral-400" />
        </div>
        <div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-lg font-bold text-neutral-900">{value}</p>
        </div>
    </div>
);

export default async function CropDetailsPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch crop data
    const { data: crop } = await supabase
        .from('crops')
        .select('*')
        .eq('id', id)
        .single();

    if (!crop) {
        notFound();
    }

    const typedCrop = crop as Crop;

    // Fetch chick sources
    const { data: sources } = await supabase
        .from('chick_sources')
        .select('*')
        .eq('crop_id', id);

    const typedSources = sources as ChickSource[] || [];

    // Fetch daily logs for mortality calculation
    const { data: dailyLogs } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('crop_id', id);

    const typedDailyLogs = dailyLogs as DailyLog[] || [];
    const totalMortality = typedDailyLogs.reduce((sum, log) => sum + (log.mortality || 0), 0);
    const isCompleted = typedCrop.status === 'Completed';
    const presentChicks = isCompleted ? 0 : (typedCrop.total_chicks - totalMortality);

    const handleHarvest = async () => {
        "use server"
        await harvestCrop(id);
    };

    const handleRecordMortality = async (formData: FormData) => {
        "use server"
        const count = parseInt(formData.get('count') as string);
        const notes = formData.get('notes') as string;
        if (count > 0) {
            await recordMortality(id, count, notes);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <header className="mb-10">
                <Link href="/crops" className="inline-flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-neutral-600 transition-colors uppercase tracking-widest mb-6 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Crops
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight">{typedCrop.name}</h1>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${isCompleted
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : 'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>
                                {typedCrop.status}
                            </span>
                        </div>
                        <p className="text-neutral-500 text-lg">Detailed performance and lifecycle overview of this crop.</p>
                    </div>

                    {!isCompleted && (
                        <form action={handleHarvest}>
                            <button
                                type="submit"
                                className="bg-neutral-900 hover:bg-black text-white px-8 py-4 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl uppercase tracking-widest flex items-center gap-2 group"
                            >
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                                Harvest Crop
                            </button>
                        </form>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <DetailCard
                    label="Present Chicks"
                    value={presentChicks.toLocaleString()}
                    icon={Info}
                />
                <DetailCard
                    label="Arrival Date"
                    value={new Date(typedCrop.arrival_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    icon={Calendar}
                />
                <DetailCard
                    label="Expected Harvest"
                    value={typedCrop.expected_harvest_date ? new Date(typedCrop.expected_harvest_date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                    icon={Calendar}
                />
                <DetailCard
                    label={isCompleted ? "Actual Harvest" : "Time to Harvest"}
                    value={isCompleted
                        ? (typedCrop.actual_harvest_date ? new Date(typedCrop.actual_harvest_date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A')
                        : "Tracking..."
                    }
                    icon={isCompleted ? CheckCircle2 : AlertCircle}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-white rounded-3xl border border-neutral-100 p-8 shadow-sm">
                        <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                            <Info className="w-5 h-5 text-neutral-400" />
                            Source Breakdown
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {typedSources.length > 0 ? typedSources.map(source => (
                                <div key={source.id} className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">{source.supplier_name}</p>
                                    <p className="text-2xl font-bold text-neutral-900">{source.count.toLocaleString()} <span className="text-sm text-neutral-400 font-medium">Chicks</span></p>
                                </div>
                            )) : (
                                <div className="col-span-full py-10 text-center text-neutral-400 italic">
                                    No source information recorded for this crop.
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="bg-white rounded-3xl border border-neutral-100 p-8 shadow-sm">
                        <h2 className="text-xl font-bold text-neutral-900 mb-6 font-bold uppercase tracking-wider text-xs text-neutral-400">Notes</h2>
                        <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100 min-h-32">
                            <p className="text-neutral-600 leading-relaxed whitespace-pre-wrap text-sm">
                                {typedCrop.notes || "No additional notes for this crop."}
                            </p>
                        </div>
                    </section>
                </div>

                <div className="space-y-8">
                    {!isCompleted && (
                        <div className="bg-white rounded-3xl border border-neutral-100 p-8 shadow-sm">
                            <h3 className="text-lg font-bold text-neutral-900 mb-4">Record Mortality</h3>
                            <form action={handleRecordMortality} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Number of Deaths</label>
                                    <input
                                        type="number"
                                        name="count"
                                        required
                                        min="1"
                                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/5 focus:bg-white focus:border-neutral-200 transition-all font-bold"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Notes (Optional)</label>
                                    <textarea
                                        name="notes"
                                        rows={2}
                                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/5 focus:bg-white focus:border-neutral-200 transition-all"
                                        placeholder="Reason for death..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-widest"
                                >
                                    Log Death(s)
                                </button>
                            </form>
                        </div>
                    )}
                    {isCompleted && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8">
                            <h3 className="text-emerald-900 font-bold mb-2 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" />
                                Crop Completed
                            </h3>
                            <p className="text-emerald-700 text-sm leading-relaxed">
                                This crop was successfully harvested on {new Date(typedCrop.actual_harvest_date!).toLocaleDateString(undefined, { dateStyle: 'full' })}.
                                All data has been archived and is available for reporting.
                            </p>
                        </div>
                    )}

                    <div className="bg-neutral-900 text-white rounded-3xl p-8 shadow-xl">
                        <h3 className="text-lg font-bold mb-4">Quick Stats</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                                <span className="text-neutral-400 text-xs font-bold uppercase">Initial Chicks</span>
                                <span className="font-bold">{typedCrop.total_chicks.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                                <span className="text-neutral-400 text-xs font-bold uppercase">Total Mortality</span>
                                <span className="font-bold text-red-400">{totalMortality}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                                <span className="text-neutral-400 text-xs font-bold uppercase">Status</span>
                                <span className="font-bold text-emerald-400">{typedCrop.status}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
