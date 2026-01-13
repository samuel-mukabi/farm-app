import { AlertTriangle, Clock, Plus, Utensils } from "lucide-react";
import { createClient } from "@/supabase/server";
import { FeedLog, FeedType } from "@/types/farm";

const FeedInventoryCard = ({ feedType }: { feedType: FeedType }) => {
    const currentStockBags = (feedType.current_stock_kg || 0) / 50;
    const isLow = currentStockBags <= 5; // Simple threshold if reorder_level is used for something else now

    return (
        <div className={`bg-white p-6 rounded-xl border ${isLow ? 'border-red-200' : 'border-neutral-100'} shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-start mb-6">
                <div className={`p-2.5 rounded-xl ${isLow ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                    <Utensils className="w-6 h-6" />
                </div>
                {isLow && (
                    <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider animate-pulse">
                        <AlertTriangle className="w-3 h-3" /> Low Stock
                    </div>
                )}
            </div>
            <h3 className="text-lg font-bold text-neutral-900">{feedType.name}</h3>
            <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-neutral-900">{currentStockBags.toFixed(1)}</span>
                <span className="text-sm font-bold text-neutral-400 uppercase tracking-widest text-[10px]">Bags Left</span>
            </div>
            <p className={`mt-2 text-[10px] font-black leading-none text-neutral-400 uppercase tracking-widest`}>
                {feedType.reorder_level_kg || 0} Bags In
            </p>
        </div>
    );
};

const FeedLogItem = ({ log, feedTypes }: { log: FeedLog, feedTypes: FeedType[] }) => {
    const feedType = feedTypes.find(ft => ft.id === log.feed_type_id);
    return (
        <tr className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors">
            <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${log.action === 'Restock' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                    <span className="text-sm font-bold text-neutral-900">{log.action}</span>
                </div>
            </td>
            <td className="py-4 px-6 text-sm text-neutral-600 font-medium">{feedType?.name || 'Unknown'}</td>
            <td className="py-4 px-6 text-sm font-bold text-neutral-900">{log.quantity_kg} kg</td>
            <td className="py-4 px-6 text-sm text-neutral-500">{new Date(log.log_date).toLocaleString()}</td>
        </tr>
    );
};


export default async function Page() {
    const supabase = await createClient();
    const { data: fetchedFeedTypes } = await supabase.from('feed_types').select('*');
    const { data: fetchedFeedLogs } = await supabase.from('feed_logs').select('*').order('log_date', { ascending: false });

    const feedTypes = (fetchedFeedTypes || []) as FeedType[];
    const feedLogs = (fetchedFeedLogs || []) as FeedLog[];

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Feed Inventory</h1>
                    <p className="text-neutral-500 mt-2 text-lg">Detailed stock management and usage analytics.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-neutral-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm uppercase tracking-widest">
                        <Plus className="w-4 h-4" /> Log Usage
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {feedTypes.length > 0 ? feedTypes.map((ft: FeedType) => (
                    <FeedInventoryCard key={ft.id} feedType={ft} />
                )) : (
                    <div className="col-span-full py-10 text-center text-neutral-400 italic bg-white rounded-xl border border-neutral-100 italic">No feed types defined.</div>
                )}
            </div>

            <section className="bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-neutral-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <Clock className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-neutral-800">Recent Feed Activity</h2>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-150">
                        <thead>
                            <tr className="bg-neutral-50">
                                <th className="py-4 px-6 text-xs font-bold text-neutral-400 uppercase tracking-wider">Action</th>
                                <th className="py-4 px-6 text-xs font-bold text-neutral-400 uppercase tracking-wider">Type</th>
                                <th className="py-4 px-6 text-xs font-bold text-neutral-400 uppercase tracking-wider">Quantity</th>
                                <th className="py-4 px-6 text-xs font-bold text-neutral-400 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feedLogs.length > 0 ? feedLogs.map((log: FeedLog) => (
                                <FeedLogItem key={log.id} log={log} feedTypes={feedTypes} />
                            )) : (
                                <tr>
                                    <td colSpan={4} className="py-10 text-center text-neutral-400 italic">No activity recorded yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
