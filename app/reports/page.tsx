import { BarChart, Download, Filter, PieChart, TrendingDown, TrendingUp, Syringe, Utensils, Bird } from "lucide-react";
import { createClient } from "@/supabase/server";

const ReportCard = ({ title, value, change, trend, icon: Icon }: { title: string, value: string, change?: string, trend?: 'up' | 'down', icon?: any }) => (
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
            daily_logs(mortality, feed_consumed_kg)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

    const chartData = (recentCropsRaw || []).map(crop => {
        const logs = (crop.daily_logs as any[]) || [];
        const totalMortality = logs.reduce((sum, log) => sum + (log.mortality || 0), 0) || 0;
        const totalFeedKg = logs.reduce((sum, log) => sum + (log.feed_consumed_kg || 0), 0) || 0;
        const peakWeight = logs.reduce((max, log) => Math.max(max, log.avg_weight_g || 0), 0) || 0;
        return {
            name: crop.name,
            final_count: (crop.total_chicks || 0) - totalMortality,
            total_feed_bags: Number((totalFeedKg / 50).toFixed(1)),
            peak_weight: peakWeight
        };
    }).reverse();

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Reports & Analytics</h1>
                    <p className="text-neutral-500 mt-2 text-lg">In-depth performance analysis and farm productivity reports.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-white border border-neutral-200 text-neutral-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-neutral-50 transition-colors uppercase tracking-widest text-[10px]">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                    <button className="bg-neutral-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm uppercase tracking-widest text-[10px]">
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
                                    <span className="mt-4 text-[8px] font-black text-neutral-400 uppercase truncate w-full text-center">{crop.name.split(' ')[0]}</span>
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
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-12 py-4">
                        <div className="relative w-40 h-40 rounded-full border-[2px] border-neutral-50 flex items-center justify-center">
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
                        <div className="flex flex-col gap-6">
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
                            <h2 className="text-xl font-bold text-neutral-900">Feed Consumption Comparison</h2>
                            <p className="text-sm text-neutral-400 font-medium">Cumulative bags used for the last 10 crops</p>
                        </div>
                        <Utensils className="w-6 h-6 text-neutral-700" />
                    </div>
                    <div className="h-80 flex items-end justify-between px-2 gap-4">
                        {chartData.length > 0 ? chartData.map((crop, i) => {
                            const maxVal = Math.max(...chartData.map(c => c.total_feed_bags), 1);
                            const height = (crop.total_feed_bags / maxVal) * 100;
                            return (
                                <div key={i} className="group relative flex-1 flex flex-col items-center h-full justify-end">
                                    <div className="absolute -top-10 bg-neutral-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold whitespace-nowrap z-10">
                                        {crop.total_feed_bags.toLocaleString()} Bags
                                    </div>
                                    <div className="w-full bg-neutral-400 rounded-t-sm group-hover:bg-neutral-900 transition-all cursor-pointer relative" style={{ height: `${height}%` }}>
                                        <div className="absolute inset-0 bg-neutral-900/5 group-hover:bg-transparent"></div>
                                    </div>
                                    <span className="mt-4 text-[8px] font-black text-neutral-400 uppercase truncate w-full text-center">{crop.name}</span>
                                </div>
                            );
                        }) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400 italic text-sm">Insufficient data for chart.</div>
                        )}
                    </div>
                </section>

                <section className="p-8 border-t border-neutral-50 mt-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900">Growth Performance Comparison (g)</h2>
                            <p className="text-sm text-neutral-400 font-medium">Comparison of peak weight across last 10 batches</p>
                        </div>
                        <TrendingUp className="w-6 h-6 text-neutral-700" />
                    </div>
                    <div className="h-80 flex items-end justify-between px-2 gap-6">
                        {chartData.length > 0 ? chartData.map((crop, i) => {
                            const maxVal = Math.max(...chartData.map(c => c.peak_weight), 1);
                            const height = (crop.peak_weight / maxVal) * 100;
                            return (
                                <div key={i} className="flex flex-col items-center gap-4 flex-1 group h-full">
                                    <div className="relative w-full max-w-16 h-full flex items-end">
                                        <div
                                            className="w-full bg-neutral-400 hover:bg-neutral-900 rounded-t-lg transition-all duration-700 relative flex items-start justify-center pt-2"
                                            style={{ height: `${height}%` }}
                                        >
                                            <span className="text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                {crop.peak_weight}g
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest truncate w-full text-center" title={crop.name}>
                                        {crop.name}
                                    </span>
                                </div>
                            );
                        }) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400 italic text-sm">Insufficient data for chart.</div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Page;
