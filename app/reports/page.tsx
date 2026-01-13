import { BarChart, Download, FileText, Filter, PieChart, TrendingDown, TrendingUp } from "lucide-react";

const ReportCard = ({ title, value, change, trend }: { title: string, value: string, change: string, trend: 'up' | 'down' }) => (
    <div className="bg-white p-6 rounded-xl border border-neutral-100 shadow-sm">
        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">{title}</h3>
        <div className="mt-2 flex items-baseline gap-3">
            <span className="text-3xl font-black text-neutral-900">{value}</span>
            <span className={`text-xs font-bold flex items-center gap-0.5 ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {change}
            </span>
        </div>
    </div>
);

const Page = () => {
    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Reports & Analytics</h1>
                    <p className="text-neutral-500 mt-2 text-lg">In-depth performance analysis and farm productivity reports.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-white border border-neutral-200 text-neutral-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-neutral-50 transition-colors">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <Download className="w-4 h-4" /> Export Report
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <ReportCard title="Avg. Growth Rate" value="+12.5%" change="2.1%" trend="up" />
                <ReportCard title="Feed Conversion" value="1.65" change="0.05" trend="down" />
                <ReportCard title="Mortality Rate" value="1.2%" change="0.4%" trend="down" />
                <ReportCard title="Est. Revenue" value="$42.5k" change="15%" trend="up" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <section className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900">Production Trends</h2>
                            <p className="text-sm text-neutral-400 font-medium">Monthly chick production vs targets</p>
                        </div>
                        <BarChart className="w-6 h-6 text-neutral-300" />
                    </div>
                    <div className="h-64 flex items-end justify-between px-2 gap-4">
                        {[40, 70, 55, 90, 65, 80].map((h, i) => (
                            <div key={i} className="group relative flex-1 flex flex-col items-center">
                                <div className="absolute -top-8 bg-neutral-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                    {h}%
                                </div>
                                <div className="w-full bg-blue-50 rounded-t-lg group-hover:bg-blue-500 transition-colors" style={{ height: `${h}%` }}></div>
                                <span className="mt-4 text-[10px] font-bold text-neutral-400 uppercase">Month {i + 1}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900">Cost Distribution</h2>
                            <p className="text-sm text-neutral-400 font-medium">Breakdown of operational expenses</p>
                        </div>
                        <PieChart className="w-6 h-6 text-neutral-300" />
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-12">
                        <div className="relative w-48 h-48 rounded-full border-[16px] border-neutral-50 flex items-center justify-center">
                            <div className="text-center">
                                <span className="block text-2xl font-black text-neutral-900">$24k</span>
                                <span className="text-[10px] font-bold text-neutral-400 uppercase">Total Cost</span>
                            </div>
                            <svg className="absolute inset-[-16px] w-[212px] h-[212px] -rotate-90">
                                <circle cx="106" cy="106" r="94" fill="none" stroke="#3b82f6" strokeWidth="16" strokeDasharray="300 600" />
                                <circle cx="106" cy="106" r="94" fill="none" stroke="#10b981" strokeWidth="16" strokeDasharray="150 600" strokeDashoffset="-300" />
                            </svg>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-sm font-bold text-neutral-600">Feed (55%)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <span className="text-sm font-bold text-neutral-600">Vaccines (25%)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-neutral-200"></div>
                                <span className="text-sm font-bold text-neutral-600">Others (20%)</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <section className="mt-12 bg-neutral-900 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight mb-2">Generate Custom Report</h2>
                        <p className="text-neutral-400 font-medium">Select specific parameters and time ranges for a detailed PDF report.</p>
                    </div>
                    <button className="bg-white text-black px-8 py-3 rounded-xl font-black hover:bg-neutral-100 transition-colors flex items-center gap-3 shadow-xl">
                        <FileText className="w-5 h-5 text-blue-600" /> Configure & Download
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            </section>
        </div>
    );
};

export default Page;
