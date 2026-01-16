import { BarChart, Download, Filter, PieChart, TrendingDown, TrendingUp, Syringe, Utensils, Bird, LucideIcon } from "lucide-react";
import { createClient } from "@/supabase/server";

interface CropData {
    name: string;
    total_chicks: number;
    daily_logs: {
        mortality: number;
        feed_consumed_kg: number;
        avg_weight_g: number;
    }[];
    feed_logs: {
        action: string;
        c1_bags: number;
        c2_bags: number;
        c3_bags: number;
    }[];
}

const ReportCard = ({ title, value, change, trend, icon: Icon }: { title: string, value: string, change?: string, trend?: 'up' | 'down', icon?: LucideIcon }) => (
    <div className="p-6 relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">{title}</h3>
            {Icon && <Icon className="w-4 h-4 text-neutral-300 group-hover:text-neutral-900 transition-colors" />}
        </div>
        <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-neutral-900 tracking-tight">{value}</span>
            {change && (
                <span className={`text-[10px] font-bold flex items-center gap-0.5 ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {trend === 'up' ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {change}
                </span>
            )}
        </div>
    </div>
);

const Page = async () => {
    const supabase = await createClient();

    // 1. Fetch data for aggregations
    const { data: crops } = await supabase.from('crops').select('id, total_chicks, status');
    const { data: logs } = await supabase.from('daily_logs').select('mortality, feed_consumed_kg, avg_weight_g');
    const { data: vaccines } = await supabase.from('vaccinations').select('id, status');

    const totalInitialChicks = crops?.reduce((sum, c) => sum + (c.total_chicks || 0), 0) || 0;
    const totalMortality = logs?.reduce((sum, l) => sum + (l.mortality || 0), 0) || 0;
    const totalFeed = logs?.reduce((sum, l) => sum + (l.feed_consumed_kg || 0), 0) || 0;
    const administeredVaccines = vaccines?.filter(v => v.status === 'Administered').length || 0;

    const mortalityRate = totalInitialChicks > 0 ? (totalMortality / totalInitialChicks) * 100 : 0;
    const avgFeedBagsPerCycle = crops && crops.length > 0 ? (totalFeed / 50) / crops.length : 0;

    // Growth Trend: Final chick count for last 10 crops
    const { data: recentCropsRaw } = await supabase
        .from('crops')
        .select(`
            name, 
            total_chicks,
            avg_weight_heavy,
            avg_weight_medium,
            avg_weight_light,
            daily_logs(mortality, feed_consumed_kg, avg_weight_g),
            feed_logs(action, c1_bags, c2_bags, c3_bags)
        `)
        .order('arrival_date', { ascending: false })
        .limit(10);

    const chartData = ((recentCropsRaw as unknown as (CropData & { avg_weight_heavy?: number, avg_weight_medium?: number, avg_weight_light?: number })[]) || []).map(crop => {
        const logs = crop.daily_logs || [];
        const totalMortality = logs.reduce((sum, log) => sum + (log.mortality || 0), 0) || 0;
        const totalFeedKg = logs.reduce((sum, log) => sum + (log.feed_consumed_kg || 0), 0) || 0;
        const peakWeight = logs.reduce((max, log) => Math.max(max, log.avg_weight_g || 0), 0) || 0;

        // Feed logs processing
        const feedLogs = crop.feed_logs || [];
        const c1 = feedLogs.filter(l => l.action === 'Usage').reduce((sum, l) => sum + (l.c1_bags || 0), 0);
        const c2 = feedLogs.filter(l => l.action === 'Usage').reduce((sum, l) => sum + (l.c2_bags || 0), 0);
        const c3 = feedLogs.filter(l => l.action === 'Usage').reduce((sum, l) => sum + (l.c3_bags || 0), 0);

        // Fallback for legacy crops (if total > 0 but no granular logs)
        const detailedTotal = c1 + c2 + c3;
        const recordedTotalBags = Number((totalFeedKg / 50).toFixed(1));
        const hasDetailedData = detailedTotal > 0;

        return {
            name: crop.name,
            final_count: (crop.total_chicks || 0) - totalMortality,
            total_feed_bags: recordedTotalBags,
            c1_bags: c1,
            c2_bags: c2,
            c3_bags: c3,
            has_detailed_data: hasDetailedData,
            peak_weight: peakWeight,
            avg_weight_heavy: crop.avg_weight_heavy || 0,
            avg_weight_medium: crop.avg_weight_medium || 0,
            avg_weight_light: crop.avg_weight_light || 0
        };
    }).reverse();

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">Reports & Analytics</h1>
                    <p className="text-neutral-500 mt-2 text-base sm:text-lg">In-depth performance analysis and farm productivity reports.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex-1 sm:flex-none justify-center bg-white border border-neutral-200 text-neutral-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-neutral-50 transition-colors uppercase tracking-widest text-[10px]">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                    <button className="flex-1 sm:flex-none justify-center bg-neutral-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm uppercase tracking-widest text-[10px]">
                        <Download className="w-4 h-4" /> Export
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <ReportCard title="Total Capacity" value={totalInitialChicks.toLocaleString()} icon={Bird} />
                <ReportCard title="Avg. Feed Used" value={`${avgFeedBagsPerCycle.toFixed(1)} Bags`} change="Bags/Cycle" trend="down" icon={Utensils} />
                <ReportCard title="Mortality Rate" value={`${mortalityRate.toFixed(1)}%`} change="Overall" trend="down" icon={TrendingDown} />
                <ReportCard title="Vaccination Coverage" value={`${administeredVaccines}/${vaccines?.length || 0}`} icon={Syringe} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <section className="p-8 transition-all">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900">Historical Production</h2>
                            <p className="text-sm text-neutral-400 font-medium">Final chick count for last 10 crops</p>
                        </div>
                        <BarChart className="w-6 h-6 text-neutral-700" />
                    </div>
                    <div className="h-64 flex items-end justify-between px-2 gap-4">
                        {chartData.length > 0 ? chartData.map((crop, i) => {
                            const maxVal = Math.max(...chartData.map(c => c.final_count), 1);
                            const height = (crop.final_count / maxVal) * 100;
                            return (
                                <div key={i} className="group relative flex-1 flex flex-col items-center h-full justify-end">
                                    <div className="absolute -top-8 bg-neutral-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                        {crop.final_count.toLocaleString()}
                                    </div>
                                    <div className="w-full bg-neutral-400 rounded-t-sm group-hover:bg-neutral-900 transition-all cursor-crosshair" style={{ height: `${height}%` }}></div>
                                    <span className="mt-4 text-[8px] font-black text-neutral-400 uppercase truncate w-full text-center">{crop.name}</span>
                                </div>
                            );
                        }) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400 italic text-sm">Insufficient data for chart.</div>
                        )}
                    </div>
                </section>

                <section className="p-8 ">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900">Health Overview</h2>
                            <p className="text-sm text-neutral-400 font-medium">Mortality vs. Survival ratio across all time</p>
                        </div>
                        <PieChart className="w-6 h-6 text-neutral-200" />
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 py-4">
                        <div className="relative w-40 h-40 shrink-0 rounded-full border-2 border-neutral-50 flex items-center justify-center">
                            <div className="text-center">
                                <span className="block text-2xl font-black text-neutral-900">{((1 - mortalityRate / 100) * 100).toFixed(0)}%</span>
                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Survival</span>
                            </div>
                            <svg className="absolute w-[184px] h-[184px] -rotate-90">
                                <circle cx="92" cy="92" r="86" fill="none" stroke="#e5e5e5" strokeWidth="12" />
                                <circle
                                    cx="92"
                                    cy="92"
                                    r="86"
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="12"
                                    strokeDasharray={`${(1 - mortalityRate / 100) * 540} 540`}
                                />
                            </svg>
                        </div>
                        <div className="flex flex-col gap-4 sm:gap-6 w-full sm:w-auto">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Surviving ({(totalInitialChicks - totalMortality).toLocaleString()})</span>
                                </div>
                                <p className="text-[10px] text-neutral-400 font-medium pl-6">Healthy and productive stock</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Mortality ({totalMortality.toLocaleString()})</span>
                                </div>
                                <p className="text-[10px] text-neutral-400 font-medium pl-6">Loss due to various factors</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div className="grid grid-cols-1 mt-10">
                <section className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900">Feed Consumption Breakdown</h2>
                            <p className="text-sm text-neutral-400 font-medium">Bags of C1, C2, and C3 used per crop</p>
                        </div>
                        <Utensils className="w-6 h-6 text-neutral-700" />
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-neutral-300 rounded-sm"></div>
                            <span className="text-[10px] font-bold text-neutral-500 uppercase">C1</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-neutral-500 rounded-sm"></div>
                            <span className="text-[10px] font-bold text-neutral-500 uppercase">C2</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-neutral-900 rounded-sm"></div>
                            <span className="text-[10px] font-bold text-neutral-500 uppercase">C3</span>
                        </div>
                    </div>

                    <div className="h-80 flex items-end justify-between px-2 gap-4">
                        {chartData.length > 0 ? chartData.map((crop, i) => {
                            // Determine max for scaling (either max total feed or current sum)
                            const maxVal = Math.max(...chartData.map(c => Math.max(c.total_feed_bags, c.c1_bags + c.c2_bags + c.c3_bags)), 1);

                            if (crop.has_detailed_data) {
                                // Detailed Grouped Bars
                                const h1 = (crop.c1_bags / maxVal) * 100;
                                const h2 = (crop.c2_bags / maxVal) * 100;
                                const h3 = (crop.c3_bags / maxVal) * 100;

                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                                        <div className="flex items-end gap-px h-full w-full justify-center">
                                            {/* C1 Bar */}
                                            {crop.c1_bags > 0 && (
                                                <div className="w-full max-w-3 bg-neutral-300 rounded-t-sm relative group-bar" style={{ height: `${h1}%` }}>
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold whitespace-nowrap z-10 pointer-events-none">
                                                        C1: {crop.c1_bags}
                                                    </div>
                                                </div>
                                            )}
                                            {/* C2 Bar */}
                                            {crop.c2_bags > 0 && (
                                                <div className="w-full max-w-3 bg-neutral-500 rounded-t-sm relative group-bar" style={{ height: `${h2}%` }}>
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold whitespace-nowrap z-10 pointer-events-none">
                                                        C2: {crop.c2_bags}
                                                    </div>
                                                </div>
                                            )}
                                            {/* C3 Bar */}
                                            {crop.c3_bags > 0 && (
                                                <div className="w-full max-w-3 bg-neutral-900 rounded-t-sm relative group-bar" style={{ height: `${h3}%` }}>
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold whitespace-nowrap z-10 pointer-events-none">
                                                        C3: {crop.c3_bags}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <span className="mt-4 text-[8px] font-black text-neutral-400 uppercase truncate w-full text-center">{crop.name}</span>
                                    </div>
                                );
                            } else {
                                // Fallback Single Bar
                                const height = (crop.total_feed_bags / maxVal) * 100;
                                return (
                                    <div key={i} className="group relative flex-1 flex flex-col items-center h-full justify-end">
                                        <div className="absolute -top-10 bg-neutral-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold whitespace-nowrap z-10">
                                            Total: {crop.total_feed_bags} Bags
                                        </div>
                                        <div className="w-full max-w-9 bg-neutral-200 rounded-t-sm group-hover:bg-neutral-300 transition-all cursor-crosshair relative" style={{ height: `${height}%` }}></div>
                                        <span className="mt-4 text-[8px] font-black text-neutral-400 uppercase truncate w-full text-center">{crop.name}</span>
                                    </div>
                                );
                            }
                        }) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400 italic text-sm">Insufficient data for chart.</div>
                        )}
                    </div>
                </section>

                <section className="p-8 border-t border-neutral-50 mt-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900">Harvest Group Performance (g)</h2>
                            <p className="text-sm text-neutral-400 font-medium">Comparison of Heavy, Medium, and Light groups</p>
                        </div>
                        <TrendingUp className="w-6 h-6 text-neutral-700" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Heavy Group */}
                        <div className="bg-neutral-50 p-6 rounded-2xl">
                            <h3 className="text-sm font-bold text-neutral-900 mb-4 uppercase tracking-widest text-center">Heavy Group</h3>
                            <div className="h-64 flex items-end justify-between px-2 gap-2">
                                {chartData.length > 0 ? chartData.map((crop, i) => {
                                    const maxVal = Math.max(...chartData.map(c => c.avg_weight_heavy), 1);
                                    const height = (crop.avg_weight_heavy / maxVal) * 100;
                                    return (
                                        <div key={i} className="flex flex-col items-center gap-2 flex-1 group h-full justify-end">
                                            {crop.avg_weight_heavy > 0 ? (
                                                <div className="w-full bg-emerald-500 rounded-t-md relative flex items-start justify-center cursor-crosshair group-hover:bg-emerald-600 transition-colors" style={{ height: `${height}%` }}>
                                                    <div className="absolute -top-6 bg-neutral-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                                        {crop.avg_weight_heavy}g
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full h-px bg-neutral-200"></div>
                                            )}
                                            <span className="text-[8px] text-neutral-400 font-bold uppercase truncate w-full text-center">{crop.name}</span>
                                        </div>
                                    )
                                }) : <div className="text-xs text-neutral-400 text-center w-full">No Data</div>}
                            </div>
                        </div>

                        {/* Medium Group */}
                        <div className="bg-neutral-50 p-6 rounded-2xl">
                            <h3 className="text-sm font-bold text-neutral-900 mb-4 uppercase tracking-widest text-center">Medium Group</h3>
                            <div className="h-64 flex items-end justify-between px-2 gap-2">
                                {chartData.length > 0 ? chartData.map((crop, i) => {
                                    const maxVal = Math.max(...chartData.map(c => c.avg_weight_medium), 1);
                                    const height = (crop.avg_weight_medium / maxVal) * 100;
                                    return (
                                        <div key={i} className="flex flex-col items-center gap-2 flex-1 group h-full justify-end">
                                            {crop.avg_weight_medium > 0 ? (
                                                <div className="w-full bg-blue-500 rounded-t-md relative flex items-start justify-center cursor-crosshair group-hover:bg-blue-600 transition-colors" style={{ height: `${height}%` }}>
                                                    <div className="absolute -top-6 bg-neutral-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                                        {crop.avg_weight_medium}g
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full h-px bg-neutral-200"></div>
                                            )}
                                            <span className="text-[8px] text-neutral-400 font-bold uppercase truncate w-full text-center">{crop.name}</span>
                                        </div>
                                    )
                                }) : <div className="text-xs text-neutral-400 text-center w-full">No Data</div>}
                            </div>
                        </div>

                        {/* Light Group */}
                        <div className="bg-neutral-50 p-6 rounded-2xl">
                            <h3 className="text-sm font-bold text-neutral-900 mb-4 uppercase tracking-widest text-center">Light Group</h3>
                            <div className="h-64 flex items-end justify-between px-2 gap-2">
                                {chartData.length > 0 ? chartData.map((crop, i) => {
                                    const maxVal = Math.max(...chartData.map(c => c.avg_weight_light), 1);
                                    const height = (crop.avg_weight_light / maxVal) * 100;
                                    return (
                                        <div key={i} className="flex flex-col items-center gap-2 flex-1 group h-full justify-end">
                                            {crop.avg_weight_light > 0 ? (
                                                <div className="w-full bg-orange-400 rounded-t-md relative flex items-start justify-center cursor-crosshair group-hover:bg-orange-500 transition-colors" style={{ height: `${height}%` }}>
                                                    <div className="absolute -top-6 bg-neutral-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                                        {crop.avg_weight_light}g
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full h-px bg-neutral-200"></div>
                                            )}
                                            <span className="text-[8px] text-neutral-400 font-bold uppercase truncate w-full text-center">{crop.name}</span>
                                        </div>
                                    )
                                }) : <div className="text-xs text-neutral-400 text-center w-full">No Data</div>}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Page;
