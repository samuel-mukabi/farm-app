import { CheckCircle2, Clock, Info, Search, Syringe } from "lucide-react";
import { createClient } from "@/supabase/server";
import { Vaccination, Crop } from "@/types/farm";
import { ScheduleVaccineModal, VaccinationActions } from "./VaccinationClient";

interface VaccinationWithCrop extends Vaccination {
    crops: { name: string } | null;
}

const VaccinationRow = ({ vaccination }: { vaccination: VaccinationWithCrop }) => (
    <tr className="border-b border-neutral-50 last:border-0 hover:bg-white transition-colors">
        <td className="py-4 px-6 text-sm font-bold text-neutral-900">{vaccination.crops?.name || 'Unknown Crop'}</td>
        <td className="py-4 px-6 text-sm text-neutral-600 font-medium">{vaccination.vaccine_name}</td>
        <td className="py-4 px-6 text-sm text-neutral-500">{new Date(vaccination.target_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
        <td className="py-4 px-6">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${vaccination.status === 'Administered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                vaccination.status === 'Pending' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                    'bg-red-50 text-red-600 border border-red-100'
                }`}>
                {vaccination.status}
            </span>
        </td>
        <td className="py-4 px-6">
            <VaccinationActions id={vaccination.id} status={vaccination.status} />
        </td>
    </tr>
);

export default async function Page() {
    const supabase = await createClient();

    // Update missed vaccinations (where target_date < today and status is still 'Pending')
    const today = new Date().toISOString().split('T')[0];
    await supabase
        .from('vaccinations')
        .update({ status: 'Missed' })
        .eq('status', 'Pending')
        .lt('target_date', today);

    // Fetch vaccinations with crop names
    const { data: fetchedVaccinations } = await supabase
        .from('vaccinations')
        .select('*, crops(name)')
        .order('target_date', { ascending: true });

    // Fetch active crops for scheduling
    const { data: activeCrops } = await supabase
        .from('crops')
        .select('id, name')
        .eq('status', 'Active');

    const vaccinations = (fetchedVaccinations || []) as VaccinationWithCrop[];
    const crops = (activeCrops || []) as Crop[];

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">Vaccinations</h1>
                    <p className="text-neutral-500 mt-2 text-base sm:text-lg">Track and schedule vaccinations for all active batches.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <ScheduleVaccineModal crops={crops} />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                <div className="p-6 ">
                    <div className="flex items-center gap-3 mb-4">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <h3 className="font-bold text-neutral-900">Administered</h3>
                    </div>
                    <p className="text-3xl font-black text-neutral-900">
                        {vaccinations.filter(v => v.status === 'Administered').length}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1 font-bold uppercase tracking-widest">Total</p>
                </div>
                <div className="p-6 ">
                    <div className="flex items-center gap-3 mb-4">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <h3 className="font-bold text-neutral-900">Pending</h3>
                    </div>
                    <p className="text-3xl font-black text-neutral-900">
                        {vaccinations.filter(v => v.status === 'Pending').length}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1 font-bold uppercase tracking-widest">Remaining</p>
                </div>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Info className="w-5 h-5 text-red-500" />
                        <h3 className="font-bold text-neutral-900">Missed</h3>
                    </div>
                    <p className="text-3xl font-black text-neutral-900">
                        {vaccinations.filter(v => v.status === 'Missed').length}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1 font-bold uppercase tracking-widest">Requires Attention</p>
                </div>
                <div className="p-6 ">
                    <div className="flex items-center gap-3 mb-4">
                        <Syringe className="w-5 h-5 text-purple-500" />
                        <h3 className="font-bold text-neutral-900">Types</h3>
                    </div>
                    <p className="text-3xl font-black text-neutral-900">
                        {new Set(vaccinations.map(v => v.vaccine_name)).size}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1 font-bold uppercase tracking-widest">Vaccines Used</p>
                </div>
            </div>

            <section className="overflow-hidden">
                <div className="p-6 border-b border-neutral-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 h-20">
                    <h2 className="text-xl font-bold text-neutral-800">Vaccination Schedule</h2>
                    <div className="relative w-full sm:w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Filter by batch..."
                            className="w-full pl-10 pr-4 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-sm  focus:outline-none focus:border-black focus:border-2"
                        />
                    </div>
                </div>
                {!vaccinations || vaccinations.length === 0 ? (
                    <div className="p-20 text-center">
                        <p className="text-neutral-500 font-medium italic">No vaccinations scheduled yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-150 sm:min-w-150">
                            <thead>
                                <tr className="bg-neutral-50 border-b border-t border-neutral-300">
                                    <th className="py-4 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Crop Name</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Vaccine Type</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Target Date</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Status</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vaccinations.map((v: VaccinationWithCrop) => (
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
