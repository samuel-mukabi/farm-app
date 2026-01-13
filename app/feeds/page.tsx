import { AlertTriangle, Clock, Utensils } from "lucide-react";
import { createClient } from "@/supabase/server";
import { FeedLog, FeedType, Crop } from "@/types/farm";
import { FeedManagementModals } from "./FeedClient";

const FeedInventoryCard = ({ feedType }: { feedType: FeedType }) => {
    const currentStockBags = (feedType.current_stock_kg || 0) / 50;
    const isLow = currentStockBags <= 5;

    return (
        <div className="card p-6">
            <div className="flex justify-between items-start mb-6">
                <div className={`p-2 rounded-lg ${isLow ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                    <Utensils className="w-5 h-5" />
                </div>
                {isLow && (
                    <span className="text-[10px] bg-red-50 px-2 py-1 rounded-sm text-red-600 font-bold uppercase tracking-wider border border-red-100 italic">
                        Low Stock
                    </span>
                )}
            </div>
            <h3 className="text-lg font-bold text-neutral-900">{feedType.name}</h3>
            {feedType.brand && <p className="text-xs text-neutral-400 font-medium">{feedType.brand}</p>}
            <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-neutral-900">{currentStockBags.toFixed(1)}</span>
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Bags</span>
            </div>
            <div className="mt-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Total weight: {feedType.current_stock_kg?.toLocaleString()} kg
            </div>
        </div>
    );
};

const FeedLogItem = ({ log, feedTypes }: { log: FeedLog, feedTypes: FeedType[] }) => {
    const feedType = feedTypes.find(ft => ft.id === log.feed_type_id);
    return (
        <tr className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors">
            <td className="py-4 px-4 text-sm font-medium text-neutral-900">{log.action}</td>
            <td className="py-4 px-4 text-sm text-neutral-600 font-medium">{feedType?.name || 'Unknown'}</td>
            <td className={`py-4 px-4 text-sm font-bold ${log.action === 'Restock' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {log.action === 'Restock' ? '+' : '-'}{log.quantity_kg} kg
            </td>
            <td className="py-4 px-4 text-sm text-neutral-500">
                {new Date(log.log_date).toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </td>
        </tr>
    );
};

export default async function Page() {
    const supabase = await createClient();

    // Fetch feed types
    const { data: fetchedFeedTypes } = await supabase
        .from('feed_types')
        .select('*')
        .order('name', { ascending: true });

    // Fetch recent feed logs
    const { data: fetchedFeedLogs } = await supabase
        .from('feed_logs')
        .select('*')
        .order('log_date', { ascending: false })
        .limit(20);

    // Fetch active crops for usage assignment
    const { data: activeCrops } = await supabase
        .from('crops')
        .select('id, name')
        .eq('status', 'Active');

    const feedTypes = (fetchedFeedTypes || []) as FeedType[];
    const feedLogs = (fetchedFeedLogs || []) as FeedLog[];
    const crops = (activeCrops || []) as Crop[];

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Feed Inventory</h1>
                    <p className="text-neutral-500 mt-2 text-lg">Detailed stock management and usage analytics.</p>
                </div>
                <FeedManagementModals feedTypes={feedTypes} crops={crops} />
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {feedTypes.length > 0 ? feedTypes.map((ft: FeedType) => (
                    <FeedInventoryCard key={ft.id} feedType={ft} />
                )) : (
                    <div className="col-span-full p-8 text-center text-neutral-500 italic card">
                        No feed types defined.
                    </div>
                )}
            </div>

            <section>
                <div className="mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-neutral-400" />
                    <h2 className="text-xl font-bold text-neutral-800 tracking-tight">Recent Activity</h2>
                </div>
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-neutral-50/50">
                                    <th className="py-4 px-4 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Action</th>
                                    <th className="py-4 px-4 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Type</th>
                                    <th className="py-4 px-4 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Quantity</th>
                                    <th className="py-4 px-4 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Date & Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {feedLogs.length > 0 ? feedLogs.map((log: FeedLog) => (
                                    <FeedLogItem key={log.id} log={log} feedTypes={feedTypes} />
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-neutral-400 italic">No activity recorded.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}
