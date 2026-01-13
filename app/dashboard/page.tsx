import Link from "next/link";
import { createClient } from "@/supabase/server";
import { Crop, FeedLog, FeedType, Vaccination } from "@/types/farm";
import { ClipboardList, Plus } from "lucide-react";

interface DashboardFeedLog extends FeedLog {
    feed_types: { name: string } | null;
}

interface DashboardVaccination extends Vaccination {
    crops: { name: string } | null;
}

interface CropWithMortality extends Crop {
    daily_logs: { mortality: number }[];
}

const SummaryCard = ({ title, value }: { title: string; value: string | number }) => (
    <div className="card p-6">
        <p className="text-sm font-medium text-neutral-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-neutral-900 mt-2">{value}</h3>
    </div>
);

const AlertCard = ({ message, type }: { message: string, type: 'error' | 'warning' | 'success' }) => {
    const colorClass = type === 'error' ? 'bg-red-50 border-red-100 text-red-700' :
        type === 'warning' ? 'bg-orange-50 border-orange-100 text-orange-700' :
            'bg-green-50 border-green-100 text-green-700';
    return (
        <div className={`p-4 rounded-md border ${colorClass} mb-3 last:mb-0 text-sm font-medium`}>
            {message}
        </div>
    );
};

const ActivityRow = ({ action, date, details }: { action: string, date: string, details: string }) => (
    <tr className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors">
        <td className="py-4 px-4 text-sm font-medium text-neutral-900">{action}</td>
        <td className="py-4 px-4 text-sm text-neutral-500">{date}</td>
        <td className="py-4 px-4 text-sm text-neutral-600">{details}</td>
    </tr>
);

const CropCard = ({ id, name, count, type, date, status, actualHarvestDate }: { id: string, name: string, count: string, type: string, date: string, status: string, actualHarvestDate?: string }) => {
    const isCompleted = status === 'Completed';
    return (
        <Link href={`/crops/${id}`} className="card p-6 hover:border-neutral-200 cursor-pointer group block">
            <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-neutral-400">{name}</span>
                {isCompleted && (
                    <span className="text-[10px] bg-emerald-50 px-2 py-1 rounded-sm text-emerald-600 font-bold uppercase tracking-wider border border-emerald-100">
                        Harvested
                    </span>
                )}
            </div>
            <h4 className="text-lg font-bold text-neutral-900">{count} {type}</h4>
            <p className="text-sm text-neutral-500 mt-1">
                {isCompleted ? `Harvested: ${actualHarvestDate}` : `Expected Harvest: ${date}`}
            </p>
            <div className="mt-4 flex gap-2">
                <span className="text-[10px] bg-neutral-100 px-2 py-1 rounded-sm text-neutral-600 font-bold uppercase tracking-wider">Feed Ready</span>
                <span className="text-[10px] bg-neutral-100 px-2 py-1 rounded-sm text-neutral-600 font-bold uppercase tracking-wider">Sawdust Ready</span>
            </div>
        </Link>
    );
};

const Page = async () => {
    const supabase = await createClient();

    // 1. Fetch Crops (Active and Recent)
    const { data: cropsRaw } = await supabase
        .from("crops")
        .select("*, daily_logs(mortality)")
        .order("created_at", { ascending: false });

    const crops = cropsRaw as CropWithMortality[] | null;

    // Calculate accurate counts for each crop
    const typedCrops = crops?.map(crop => {
        const totalMortality = crop.daily_logs?.reduce((sum, log) => sum + (log.mortality || 0), 0) || 0;
        return {
            ...crop,
            present_chicks: crop.total_chicks - totalMortality
        };
    });
    const activeCrop = typedCrops?.find(c => c.status === 'Active');
    const totalPresentChicks = typedCrops
        ?.filter(crop => crop.status === 'Active')
        ?.reduce((sum: number, crop: { present_chicks?: number }) => sum + (crop.present_chicks ?? 0), 0) ?? 0;
    const activeCropNumber = activeCrop ? (typedCrops ? typedCrops.length - typedCrops.indexOf(activeCrop) : 0) : 0;

    // 2. Fetch Feed Inventory & Logs
    const { data: feedTypesData } = await supabase.from("feed_types").select("*");
    const feedTypes = feedTypesData as FeedType[] | null;

    const { data: feedLogsData } = await supabase
        .from("feed_logs")
        .select("*, feed_types(name)")
        .order("log_date", { ascending: false })
        .limit(10);

    const feedLogs = (feedLogsData as DashboardFeedLog[] | null) || [];

    const totalFeedStock = feedTypes?.reduce((sum, type) => sum + (Number(type.current_stock_kg) || 0), 0) ?? 0;
    const lowStockAlerts = feedTypes?.filter(t => ((Number(t.current_stock_kg) || 0) / 50) <= 5) ?? [];

    // 3. Fetch Vaccinations
    const { data: vaccinationsData } = await supabase
        .from("vaccinations")
        .select("*, crops(name)")
        .order("target_date", { ascending: true });

    const vaccinations = (vaccinationsData as DashboardVaccination[] | null) || [];

    const nextVaccination = vaccinations.find(v => v.status === 'Pending');
    const missedVaccinations = vaccinations.filter(v => v.status === 'Missed');

    // 4. Activity Normalization
    const activities = [
        ...feedLogs.map(log => ({
            action: log.action === 'Restock' ? 'Feed Restocked' : 'Feed Used',
            date: new Date(log.log_date).toLocaleDateString(),
            details: `${log.quantity_kg}kg of ${log.feed_types?.name || 'feed'} ${log.action === 'Restock' ? 'added' : 'consumed'}`
        })),
        ...vaccinations.filter(v => v.status === 'Administered').map(v => ({
            action: 'Vaccine Administered',
            date: new Date(v.administered_at || v.target_date).toLocaleDateString(),
            details: `${v.vaccine_name} for Crop ${v.crops?.name || 'Unknown'}`
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    // 5. Daily Logs for Chart (Last 7 days/entries for currently active crop)
    const { data: growthLogs } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("crop_id", activeCrop?.id || '')
        .order("log_date", { ascending: false })
        .limit(7);

    const chartData = growthLogs?.reverse().map(log => ({
        val: log.feed_consumed_kg || 0,
        label: new Date(log.log_date).toLocaleDateString(undefined, { weekday: 'short' })
    })) ?? [];

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Farm Overview</h1>
                    <p className="text-neutral-500 mt-2 text-lg">Real-time performance and critical alerts for your poultry farm.</p>
                </div>
                <Link href="/crops/new_crop" className="btn-primary flex items-center gap-2">
                    <Plus className="w-5 h-5" /> New Batch
                </Link>
            </header>

            {/* Top Summary Cards */}
            <section className="mb-12">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-neutral-800">Key Metrics</h2>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <SummaryCard title="Current Bird Count" value={totalPresentChicks.toLocaleString()} />
                    <SummaryCard title="Active Crop" value={activeCrop ? `#${activeCropNumber}` : 'None'} />
                    <SummaryCard title="Feed Balance (bags)" value={`${(totalFeedStock / 50).toFixed(1)}`} />
                    <SummaryCard title="Next Vaccination" value={nextVaccination ? new Date(nextVaccination.target_date).toLocaleDateString() : 'None Scheduled'} />
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
                {/* Alerts Section */}
                <section className="lg:col-span-1">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-neutral-800">Critical Alerts</h2>
                    </div>
                    <div className="card p-2">
                        {lowStockAlerts.map(alert => (
                            <AlertCard key={alert.id} message={`Low feed: ${alert.name} stock is ${((Number(alert.current_stock_kg) || 0) / 50).toFixed(1)} bags left`} type="error" />
                        ))}
                        {missedVaccinations.map(v => (
                            <AlertCard key={v.id} message={`Missed Vaccination: ${v.vaccine_name} for ${v.crops?.name}`} type="warning" />
                        ))}
                        {lowStockAlerts.length === 0 && missedVaccinations.length === 0 && (
                            <AlertCard message="All operations are running smoothly. No critical alerts." type="success" />
                        )}
                    </div>
                </section>

                {/* Charts Section */}
                <section className="lg:col-span-2">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-neutral-800">Recent Feed Consumption (kg)</h2>
                    </div>
                    <div className="card p-6 h-64 flex items-end gap-4 justify-around">
                        {chartData.length > 0 ? chartData.map((data, i) => {
                            const maxVal = Math.max(...chartData.map(d => d.val as number), 1);
                            const height = (Number(data.val) / maxVal) * 100;
                            return (
                                <div key={i} className="flex flex-col items-center gap-2 w-full max-w-10">
                                    <div
                                        className="w-full bg-neutral-100 rounded-t-sm hover:bg-neutral-900 transition-colors"
                                        style={{ height: `${height}%` }}
                                        title={`${data.val}kg`}
                                    ></div>
                                    <span className="text-[10px] text-neutral-400 font-bold uppercase">{data.label}</span>
                                </div>
                            );
                        }) : (
                            <div className="w-full flex items-center justify-center text-neutral-400 italic py-10">
                                No growth data available for the active crop.
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Recent Activity Log */}
            <section className="mb-12">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-neutral-800">Recent Activity</h2>
                </div>
                <div className="card overflow-hidden">
                    {activities.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-125">
                                <thead>
                                    <tr className="bg-neutral-50/50">
                                        <th className="py-4 px-4 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Activity</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Date</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activities.map((act, i) => (
                                        <ActivityRow key={i} action={act.action} date={act.date} details={act.details} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-neutral-500 italic">No recent activities found.</div>
                    )}
                </div>
            </section>

            {/* Crop Grid Section */}
            <section>
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-neutral-800">Crop History</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {typedCrops && typedCrops.length > 0 ? typedCrops.slice(0, 6).map((crop) => (
                        <CropCard
                            key={crop.id}
                            id={crop.id}
                            name={crop.name}
                            count={crop.total_chicks.toString()}
                            type="Chicks"
                            date={crop.expected_harvest_date ? new Date(crop.expected_harvest_date).toLocaleDateString() : 'N/A'}
                            status={crop.status}
                            actualHarvestDate={crop.actual_harvest_date ? new Date(crop.actual_harvest_date).toLocaleDateString() : undefined}
                        />
                    )) : (
                        <div className="col-span-full p-8 text-center text-neutral-500 italic card">No historical crops recorded.</div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Page;
