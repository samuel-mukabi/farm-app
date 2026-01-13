import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Info, CheckCircle2, AlertCircle, LucideIcon, TrendingUp, Droplets, Utensils, ClipboardList, Plus } from "lucide-react";
import { createClient } from "@/supabase/server";
import { Crop, ChickSource, DailyLog } from "@/types/farm";
import { harvestCrop } from "./actions";
import { DailyLogModal } from "./CropDetailClient";

const DetailCard = ({ label, value, icon: Icon, colorClass = "text-neutral-400" }: { label: string, value: string | number, icon: LucideIcon, colorClass?: string }) => (
    <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center shrink-0">
            <Icon className={`w-5 h-5 ${colorClass}`} />
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

    if (!crop) notFound();
    const typedCrop = crop as Crop;

    // Fetch chick sources
    const { data: sources } = await supabase
        .from('chick_sources')
        .select('*')
        .eq('crop_id', id);
    const typedSources = (sources as ChickSource[]) || [];

    // Fetch daily logs
    const { data: dailyLogs } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('crop_id', id)
        .order('log_date', { ascending: false });
    const typedDailyLogs = (dailyLogs as DailyLog[]) || [];

    const totalMortality = typedDailyLogs.reduce((sum, log) => sum + (log.mortality || 0), 0);
    const isCompleted = typedCrop.status === 'Completed';
    const presentChicks = isCompleted ? 0 : (typedCrop.total_chicks - totalMortality);

    const handleHarvest = async () => {
        "use server"
        await harvestCrop(id);
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <header className="mb-10">
                <Link href="/crops" className="inline-flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-neutral-600 transition-colors uppercase tracking-widest mb-6 group text-[10px]">
                    <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Back to Crops
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
                                className="bg-neutral-900 hover:bg-black text-white px-8 py-4 rounded-xl text-xs font-bold transition-all shadow-lg hover:shadow-xl uppercase tracking-widest flex items-center gap-2 group"
                            >
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                                Harvest Crop
                            </button>
                        </form>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                <DetailCard label="Present Chicks" value={presentChicks.toLocaleString()} icon={TrendingUp} colorClass="text-blue-500" />
                <DetailCard label="Arrival Date" value={new Date(typedCrop.arrival_date).toLocaleDateString(undefined, { dateStyle: 'medium' })} icon={Calendar} />
                <DetailCard label="Expected Harvest" value={typedCrop.expected_harvest_date ? new Date(typedCrop.expected_harvest_date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'} icon={Calendar} />
                <DetailCard label="Mortality" value={`${totalMortality} (${((totalMortality / typedCrop.total_chicks) * 100).toFixed(1)}%)`} icon={AlertCircle} colorClass="text-red-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    <section className="bg-white rounded-3xl border border-neutral-100 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-neutral-400" />
                                Performance History
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[500px]">
                                <thead>
                                    <tr className="border-b border-neutral-50">
                                        <th className="pb-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Date</th>
                                        <th className="pb-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center">Mortality</th>
                                        <th className="pb-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center">Feed (kg)</th>
                                        <th className="pb-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center">Water (L)</th>
                                        <th className="pb-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center">Weight (g)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {typedDailyLogs.length > 0 ? typedDailyLogs.slice(0, 7).map(log => (
                                        <tr key={log.id} className="border-b border-neutral-50/50 last:border-0 hover:bg-neutral-50/50 transition-colors">
                                            <td className="py-4 text-xs font-bold text-neutral-900">{new Date(log.log_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                                            <td className="py-4 text-xs font-semibold text-red-500 text-center">{log.mortality || 0}</td>
                                            <td className="py-4 text-xs font-semibold text-neutral-700 text-center">{log.feed_consumed_kg || 0}</td>
                                            <td className="py-4 text-xs font-semibold text-blue-500 text-center">{log.water_consumed_liters || 0}</td>
                                            <td className="py-4 text-xs font-semibold text-emerald-600 text-center">{log.avg_weight_g || '--'}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="py-10 text-center text-neutral-400 italic text-sm">No performance data recorded yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="bg-white rounded-3xl border border-neutral-100 p-8 shadow-sm">
                        <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                            <Info className="w-5 h-5 text-neutral-400" />
                            Source Breakdown
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {typedSources.length > 0 ? typedSources.map(source => (
                                <div key={source.id} className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">{source.supplier_name}</p>
                                    <p className="text-2xl font-bold text-neutral-900">{source.count.toLocaleString()} <span className="text-sm text-neutral-400 font-medium tracking-tight">Chicks</span></p>
                                </div>
                            )) : (
                                <div className="col-span-full py-10 text-center text-neutral-400 italic text-sm">
                                    No source information recorded.
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <div className="space-y-8">
                    {!isCompleted && (
                        <div className="bg-white rounded-3xl border border-neutral-100 p-8 shadow-sm">
                            <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                Daily Tracking
                            </h3>
                            <DailyLogModal cropId={id} />
                        </div>
                    )}

                    <div className="bg-neutral-900 text-white rounded-3xl p-8 shadow-xl">
                        <h3 className="text-lg font-bold mb-6 tracking-tight">Quick Review</h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="w-4 h-4 text-blue-400" />
                                    <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Initial</span>
                                </div>
                                <span className="font-bold">{typedCrop.total_chicks.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                    <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Stability</span>
                                </div>
                                <span className="font-bold">{(((typedCrop.total_chicks - totalMortality) / typedCrop.total_chicks) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Stage</span>
                                </div>
                                <span className="font-bold text-sm">{typedCrop.status}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-neutral-100 p-8 shadow-sm">
                        <h2 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4">Internal Notes</h2>
                        <p className="text-neutral-600 leading-relaxed text-sm whitespace-pre-wrap italic">
                            {typedCrop.notes || "No additional notes recorded for this crop."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
