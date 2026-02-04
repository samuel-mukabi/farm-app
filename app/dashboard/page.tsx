import Link from "next/link";
import { createClient } from "@/supabase/server";
import { Crop, FeedLog, FeedType, Vaccination, VaccinationStatus, CropStatus } from "@/types/farm";
import {ChartNoAxesGantt} from "lucide-react";

interface DashboardFeedLog extends FeedLog {
    feed_types: { name: string } | null;
    action: 'Restock' | 'Usage';
    log_date: string;
    c1_bags?: number;
    c2_bags?: number;
    c3_bags?: number;
}

interface DashboardVaccination extends Vaccination {
    crops: { name: string } | null;
    status: VaccinationStatus;
    administered_at?: string;
    target_date: string;
    vaccine_name: string;
}

interface CropWithMortality extends Crop {
    daily_logs: { mortality: number, avg_weight_g: number }[];
    feed_logs: DashboardFeedLog[];
    status: CropStatus;
    total_chicks: number;
}

const SummaryCard = ({ title, value }: { title: string; value: React.ReactNode }) => (
    <div className="card p-4 sm:p-6 flex flex-col justify-between min-h-30">
        <p className="text-[9px] sm:text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{title}</p>
        <div className="mt-2">
            {typeof value === 'string' || typeof value === 'number' ? (
                <h3 className="text-2xl font-black text-neutral-900">{value}</h3>
            ) : (
                value
            )}
        </div>
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

const CropCard = ({
    id, name, count, type, date, status, actualHarvestDate,
    mortality, mortalityRate, bagsUsed, bagsBrought
}: {
    id: string, name: string, count: string, type: string, date: string, status: string,
    actualHarvestDate?: string, mortality: number, mortalityRate: string,
    bagsUsed: number, bagsBrought: number
}) => {
    const isCompleted = status === 'Completed';
    const feedProgress = bagsBrought > 0 ? Math.min((bagsUsed / bagsBrought) * 100, 100) : 0;

    return (
        <Link href={`/crops/${id}`} className="card p-6 hover:border-neutral-200 cursor-pointer group block">
            <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{name}</span>
                {isCompleted && (
                    <span className="text-[10px] bg-emerald-50 px-2 py-1 rounded-sm text-emerald-600 font-bold uppercase tracking-wider border border-emerald-100">
                        Harvested
                    </span>
                )}
            </div>

            <div className="mb-6">
                <h4 className="text-2xl font-bold text-neutral-900">{count} {type}</h4>
                <p className="text-sm text-neutral-500 mt-1">
                    {isCompleted ? `Harvested: ${actualHarvestDate}` : `Expected: ${date}`}
                </p>
            </div>

            <div className="space-y-4">
                {/* Mortality Data */}
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Mortality</p>
                        <p className="text-sm font-bold text-red-600">{mortality} Birds</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Rate</p>
                        <p className="text-sm font-bold text-neutral-600">{mortalityRate}%</p>
                    </div>
                </div>

                {/* Feed Usage */}
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Feed Usage</p>
                        <p className="text-[10px] font-bold text-neutral-600">{bagsUsed} / {bagsBrought} Bags</p>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-neutral-900 transition-all duration-500"
                            style={{ width: `${feedProgress}%` }}
                        />
                    </div>
                </div>
            </div>
        </Link>
    );
};

const Page = async (props: { searchParams: Promise<{ period?: string }> }) => {
    const searchParams = await props.searchParams;
    const period = searchParams.period || 'weekly';
    const supabase = await createClient();

    // 0. Fetch User Profile
    const { data: { user } } = await supabase.auth.getUser();
    const { data: userProfile } = await supabase
        .from('users')
        .select('farm_name')
        .eq('id', user?.id || '')
        .single();

    // 1. Fetch Crops (Active and Recent)
    const { data: cropsRaw } = await supabase
        .from("crops")
        .select("*, daily_logs(mortality, avg_weight_g), feed_logs(*)")
        .order("created_at", { ascending: false });

    const crops = cropsRaw as CropWithMortality[] | null;

    // Calculate accurate counts for each crop
    const typedCrops = crops?.map(crop => {
        const totalMortality = crop.daily_logs?.reduce((sum, log) => sum + (log.mortality || 0), 0) || 0;
        const mortalityRate = ((totalMortality / crop.total_chicks) * 100).toFixed(1);

        const bagsBrought = crop.feed_logs
            ?.filter(log => log.action === 'Restock')
            .reduce((sum, log) => sum + (log.c1_bags || 0) + (log.c2_bags || 0) + (log.c3_bags || 0), 0) || 0;

        const bagsUsed = crop.feed_logs
            ?.filter(log => log.action === 'Usage')
            .reduce((sum, log) => sum + (log.c1_bags || 0) + (log.c2_bags || 0) + (log.c3_bags || 0), 0) || 0;

        const maxWeight = crop.daily_logs?.reduce((max, log) => Math.max(max, log.avg_weight_g || 0), 0) || 0;

        return {
            ...crop,
            present_chicks: crop.total_chicks - totalMortality,
            total_mortality: totalMortality,
            mortality_rate: mortalityRate,
            bags_brought: bagsBrought,
            bags_used: bagsUsed,
            peak_weight: maxWeight
        } as CropWithMortality & {
            present_chicks: number;
            total_mortality: number;
            mortality_rate: string;
            bags_brought: number;
            bags_used: number;
            peak_weight: number;
        };
    });

    const activeCrops = typedCrops?.filter(c => c.status === 'Active') || [];
    const activeCropName = activeCrops.length > 0 ? activeCrops[0].name : 'All Crops';

    // const activeCropCount = activeCrops.length;

    const activeCropsDisplay = activeCrops.length > 0 ? (
        <div className="flex flex-col gap-1">
            {activeCrops.slice(0, 2).map((crop) => {
                return (
                    <p key={crop.id} className="text-2xl font-bold text-neutral-900 truncate" title={crop.name}>
                        {crop.name}
                    </p>
                );
            })}
            {activeCrops.length > 2 && (
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">
                    +{activeCrops.length - 2} more...
                </p>
            )}
        </div>
    ) : (
        <h3 className="text-2xl font-black text-neutral-900">None</h3>
    );

    const totalPresentChicks = activeCrops
        ?.reduce((sum: number, crop: { present_chicks?: number }) => sum + (crop.present_chicks ?? 0), 0) ?? 0;

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

    // 3. Sync and Fetch Vaccinations
    const today = new Date().toISOString().split('T')[0];
    await supabase
        .from("vaccinations")
        .update({ status: 'Missed' })
        .eq('status', 'Pending')
        .lt('target_date', today);

    const { data: vaccinationsData } = await supabase
        .from("vaccinations")
        .select("*, crops(name)")
        .order("target_date", { ascending: true });

    const vaccinations = (vaccinationsData as DashboardVaccination[] | null) || [];

    const nextVaccination = vaccinations.find(v => v.status === 'Pending');
    const missedVaccinations = vaccinations.filter(v => v.status === 'Missed');

    // 4. Activity Normalization
    const activities = [
        ...feedLogs.map(log => {
            const totalBags = ((log.c1_bags || 0) + (log.c2_bags || 0) + (log.c3_bags || 0));
            return {
                action: log.action === 'Restock' ? 'Feed Restocked' : 'Feed Used',
                date: new Date(log.log_date).toLocaleDateString(),
                details: `${totalBags} Bags of ${log.feed_types?.name || 'feed'} ${log.action === 'Restock' ? 'added' : 'consumed'}`
            };
        }),
        ...vaccinations.filter(v => v.status === 'Administered').map(v => ({
            action: 'Vaccine Administered',
            date: new Date(v.administered_at || v.target_date || new Date()).toLocaleDateString(),
            details: `${v.vaccine_name} for Crop ${v.crops?.name || 'Unknown'}`
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    // 5. Daily Logs for Charts
    const targetCropIds = activeCrops.length > 0
        ? activeCrops.map(c => c.id)
        : typedCrops && typedCrops.length > 0 ? [typedCrops[0].id] : [];

    const limit = period === 'monthly' ? 90 : 21;
    const displayCount = period === 'monthly' ? 30 : 7;

    const { data: recentLogs } = await supabase
        .from("daily_logs")
        .select("log_date, feed_consumed_kg, avg_weight_g")
        .in("crop_id", targetCropIds)
        .order("log_date", { ascending: false })
        .limit(limit);

    // Group and sum/average by date
    const dailyFeed: Record<string, number> = {};
    const dailyGrowth: Record<string, { sum: number, count: number }> = {};

    recentLogs?.forEach(log => {
        const date = log.log_date;
        dailyFeed[date] = (dailyFeed[date] || 0) + (log.feed_consumed_kg || 0);

        if (log.avg_weight_g) {
            if (!dailyGrowth[date]) dailyGrowth[date] = { sum: 0, count: 0 };
            dailyGrowth[date].sum += log.avg_weight_g;
            dailyGrowth[date].count += 1;
        }
    });

    const feedChartData = Object.entries(dailyFeed)
        .map(([date, kg]) => ({
            val: Number((kg / 50).toFixed(2)),
            label: period === 'monthly'
                ? new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
                : new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
            date
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-displayCount);

    const growthChartData = Object.entries(dailyGrowth)
        .map(([date, { sum, count }]) => ({
            val: Math.round(sum / count),
            label: period === 'monthly'
                ? new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
                : new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
            date
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-displayCount);

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
            <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                        {userProfile?.farm_name ? `${userProfile.farm_name}'s Overview` : "Farm Overview"}
                        {activeCrops.length > 0 && (() => {
                            const arrival = new Date(activeCrops[0].arrival_date);
                            const now = new Date();
                            const diffTime = now.getTime() - arrival.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24) - 1);
                            return <span className="text-neutral-900 font-medium"> - Day {diffDays}</span>
                        })()}
                    </h1>
                    <p className="text-neutral-500 mt-2 text-base sm:text-lg">Real-time performance and critical alerts for your poultry farm.</p>
                </div>
                <Link href={`/crops/${activeCrops[0].id}`} className="flex items-center gap-2 w-full sm:w-auto justify-center py-2 px-5 bg-black text-white md:text-black md:bg-transparent md:hover:bg-black md:hover:text-white transition-all rounded-md active:scale-[0.98]">
                    <ChartNoAxesGantt className="w-5 h-5" /> Manage {activeCropName}
                </Link>
            </header>

            {/* Top Summary Cards */}
            <section className="mb-12">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-neutral-800">Key Metrics</h2>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <SummaryCard title="Current Bird Count" value={totalPresentChicks.toLocaleString()} />
                    <SummaryCard title="Active Crop" value={activeCropsDisplay} />
                    <SummaryCard title="Feed Balance (bags)" value={`${(totalFeedStock / 50).toFixed(1)}`} />
                    <SummaryCard title="Next Vaccination" value={nextVaccination ?
                        (
                            <div className="flex flex-col gap-2 md:flex-row md:text-xl md:items-center md:gap-5">
                                <div className="font-thin  text-neutral-800">{nextVaccination.vaccine_name}</div>
                                <div className="font-bold">{new Date(nextVaccination.target_date).toLocaleDateString()}</div>
                            </div>
                        )
                        : 'None Scheduled'} />
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
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-neutral-800">Feed Consumption (Bags)</h2>
                            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">
                                Daily totals across {activeCropName}
                            </p>
                        </div>
                        <div className="flex bg-neutral-100 p-1 rounded-lg">
                            <Link
                                href="/dashboard?period=weekly"
                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${period === 'weekly' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                            >
                                Weekly
                            </Link>
                            <Link
                                href="/dashboard?period=monthly"
                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${period === 'monthly' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                            >
                                Monthly
                            </Link>
                        </div>
                    </div>
                    <div className={`card px-6 pt-10 ${period === 'monthly' ? 'h-80' : 'h-64'} flex items-end gap-3 justify-around overflow-hidden group`}>
                        {feedChartData.length > 0 ? feedChartData.map((data, i) => {
                            const maxVal = Math.max(...feedChartData.map(d => d.val as number), 0.1);
                            const height = (Number(data.val) / maxVal) * 100;
                            return (
                                <div key={i} className="flex flex-col items-center gap-2 flex-1 max-w-10 h-full">
                                    <div className="relative w-full h-full flex items-end group/bar">
                                        <div
                                            className="w-full bg-neutral-400 rounded-t-sm group-hover:bg-neutral-900 transition-colors"
                                            style={{ height: `${height}%` }}
                                        ></div>
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] px-2 py-1 rounded opacity-100 lg:opacity-0 lg:group-hover/bar:opacity-100 transition-opacity font-bold whitespace-nowrap z-10">
                                            {data.val} Bags
                                        </div>
                                    </div>
                                    <span className={`text-[8px] text-neutral-400 font-bold uppercase ${period === 'monthly' ? 'hidden sm:block rotate-45 my-2' : ''}`}>{data.label}</span>
                                </div>
                            );
                        }) : (
                            <div className="w-full flex items-center justify-center text-neutral-400 italic py-10">
                                No recent feed consumption data available.
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Daily Growth Trend */}
            <section className="mb-12">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-neutral-800">Daily Growth Trend (g)</h2>
                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">
                        Average bird weight over time for {activeCropName}
                    </p>
                </div>
                <div className={`card p-8 ${period === 'monthly' ? 'h-80' : 'h-64'} flex items-end gap-6 justify-around`}>
                    {growthChartData.length > 0 ? growthChartData.map((data, i) => {
                        const maxVal = Math.max(...growthChartData.map(d => d.val as number), 1);
                        const height = (Number(data.val) / maxVal) * 100;
                        return (
                            <div key={i} className="flex flex-col items-center gap-4 w-full flex-1 group h-full">
                                <div className="relative w-full max-w-16 h-full flex items-end">
                                    <div
                                        className="w-full absolute bottom-0 h-full"
                                        style={{ height: '100%' }}
                                    ></div>
                                    <div
                                        className="w-full bg-neutral-900 rounded-t-lg transition-all duration-700 relative flex items-start justify-center pt-2"
                                        style={{ height: `${height}%` }}
                                    >
                                        <span className="text-[10px] font-bold text-white opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                            {data.val}g
                                        </span>
                                    </div>
                                </div>
                                <span className={`text-[8px] text-neutral-400 font-bold uppercase ${period === 'monthly' ? 'hidden sm:block rotate-45 my-2' : ''}`}>{data.label}</span>
                            </div>
                        );
                    }) : (
                        <div className="w-full flex items-center justify-center text-neutral-400 italic py-10">
                            No recent growth data available.
                        </div>
                    )}
                </div>
            </section>

            {/* Recent Activity Log */}
            <section className="mb-12">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-neutral-800">Recent Activity</h2>
                </div>
                <div className="card overflow-hidden">
                    {activities.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-125 sm:min-w-125">
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
                            mortality={crop.total_mortality}
                            mortalityRate={crop.mortality_rate}
                            bagsUsed={crop.bags_used}
                            bagsBrought={crop.bags_brought}
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
