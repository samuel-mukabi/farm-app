import { CheckCircle2, Clock, Info, Plus, Search, Syringe } from "lucide-react";
import { createClient } from "@/supabase/server";
import { Vaccination } from "@/types/farm";

const VaccinationRow = ({ vaccination }: { vaccination: Vaccination }) => (
    <tr className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors">
        <td className="py-4 px-6 text-sm font-bold text-neutral-900">Crop: {vaccination.crop_id.slice(0, 8)}</td>
        <td className="py-4 px-6 text-sm text-neutral-600 font-medium">{vaccination.vaccine_name}</td>
        <td className="py-4 px-6 text-sm text-neutral-500">{new Date(vaccination.target_date).toLocaleDateString()}</td>
        <td className="py-4 px-6">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${vaccination.status === 'Administered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                vaccination.status === 'Pending' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                    'bg-red-50 text-red-600 border border-red-100'
                }`}>
                {vaccination.status}
            </span>
        </td>
    </tr>
);

const MOCK_VACCINATIONS: Vaccination[] = [
    { id: "1", crop_id: "batch-827", vaccine_name: "Mareks Disease", target_date: "2026-01-12", status: "Administered" },
    { id: "2", crop_id: "batch-826", vaccine_name: "Gumboro (IBD)", target_date: "2026-01-15", status: "Pending" },
    { id: "3", crop_id: "batch-825", vaccine_name: "Newcastle Disease", target_date: "2026-01-10", status: "Missed" },
    { id: "4", crop_id: "batch-824", vaccine_name: "Fowl Pox", target_date: "2026-01-20", status: "Pending" },
    { id: "5", crop_id: "batch-823", vaccine_name: "Infectious Bronchitis", target_date: "2026-01-05", status: "Administered" },
];

export default async function Page() {
    const supabase = await createClient();
    const { data: fetchedVaccinations } = await supabase
        .from('vaccinations')
        .select('*')
        .order('target_date', { ascending: true });

    const vaccinations = fetchedVaccinations || MOCK_VACCINATIONS;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Vaccinations</h1>
                    <p className="text-neutral-500 mt-2 text-lg">Track and schedule vaccinations for all active batches.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> Schedule Vaccine
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
                <div className="bg-white p-6 rounded-xl border border-neutral-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <h3 className="font-bold text-neutral-900">Administered</h3>
                    </div>
                    <p className="text-3xl font-black text-neutral-900">
                        {vaccinations?.filter(v => v.status === 'Administered').length || 0}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1 font-bold">Total</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-neutral-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <h3 className="font-bold text-neutral-900">Pending</h3>
                    </div>
                    <p className="text-3xl font-black text-neutral-900">
                        {vaccinations?.filter(v => v.status === 'Pending').length || 0}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1 font-bold">Remaining</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-neutral-100 shadow-sm border-l-4 border-l-red-500">
                    <div className="flex items-center gap-3 mb-4">
                        <Info className="w-5 h-5 text-red-500" />
                        <h3 className="font-bold text-neutral-900">Missed</h3>
                    </div>
                    <p className="text-3xl font-black text-neutral-900">
                        {vaccinations?.filter(v => v.status === 'Missed').length || 0}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1 font-bold">Requires Attention</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-neutral-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <Syringe className="w-5 h-5 text-purple-500" />
                        <h3 className="font-bold text-neutral-900">Types</h3>
                    </div>
                    <p className="text-3xl font-black text-neutral-900">
                        {new Set(vaccinations?.map(v => v.vaccine_name)).size}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1 font-bold">Vaccines Used</p>
                </div>
            </div>

            <section className="bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-neutral-50 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-neutral-800">Vaccination Schedule</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Filter by batch..."
                            className="pl-10 pr-4 py-1.5 bg-neutral-50 border border-neutral-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                        />
                    </div>
                </div>
                {!vaccinations || vaccinations.length === 0 ? (
                    <div className="p-20 text-center">
                        <p className="text-neutral-500 font-medium">No vaccinations scheduled yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-neutral-50">
                                    <th className="py-4 px-6 text-xs font-bold text-neutral-400 uppercase tracking-wider">Batch ID</th>
                                    <th className="py-4 px-6 text-xs font-bold text-neutral-400 uppercase tracking-wider">Vaccine Type</th>
                                    <th className="py-4 px-6 text-xs font-bold text-neutral-400 uppercase tracking-wider">Date</th>
                                    <th className="py-4 px-6 text-xs font-bold text-neutral-400 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vaccinations.map((v: Vaccination) => (
                                    <VaccinationRow key={v.id} vaccination={v} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
