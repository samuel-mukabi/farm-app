import Link from "next/link";
import { createClient } from "@/supabase/server";
import { Crop } from "@/types/farm";

interface CropWithMortality extends Crop {
    present_chicks?: number;
}

const CropMetric = ({ label, value }: { label: string, value: string | number }) => (
    <div className="flex flex-col">
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-bold text-neutral-900">{value}</span>
    </div>
);

const CropCardDetail = ({ crop }: { crop: CropWithMortality }) => (
    <Link href={`/crops/${crop.id}`} className="card p-6 border-l-4 border-neutral-300 hover:border-neutral-700 cursor-pointer block">
        <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-xl uppercase font-bold text-neutral-900">{crop.name}</h3>
                <p className="text-xs text-neutral-500 font-bold mt-1 uppercase tracking-wider">
                    {crop.present_chicks?.toLocaleString() || crop.total_chicks.toLocaleString()} Chicks
                </p>
            </div>
            <div className={`px-3 py-1 rounded-sm border ${crop.status === 'Active' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : (crop.status === 'Completed' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-neutral-50 border-neutral-100 text-neutral-500')}`}>
                <span className="text-[10px] font-bold uppercase tracking-widest">{crop.status || 'Active'}</span>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-y-4 mb-6">
            <CropMetric label="Arrival Date" value={new Date(crop.arrival_date).toLocaleDateString()} />
            {crop.status === 'Completed' && crop.actual_harvest_date ? (
                <CropMetric label="Harvested Date" value={new Date(crop.actual_harvest_date).toLocaleDateString()} />
            ) : (
                crop.expected_harvest_date && (
                    <CropMetric label="Expected Harvest" value={new Date(crop.expected_harvest_date).toLocaleDateString()} />
                )
            )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
            <span className="text-sm font-bold text-neutral-400 group-hover:text-neutral-700 transition-colors uppercase tracking-wider underline underline-offset-1 hover:underline-offset-4">Manage Crop</span>
        </div>
    </Link>
)
{/*
    const searchCropsByName = (crops: Crop[], query: string) => {
        return crops.filter(crop =>
            crop.name.toLowerCase().includes(query.toLowerCase())
        );
    };
*/}
export default async function Page() {
    const supabase = await createClient();
    const { data: cropsRaw } = await supabase
        .from('crops')
        .select('*, daily_logs(mortality)')
        .order('created_at', { ascending: false });

    const crops = (cropsRaw as (Crop & { daily_logs: { mortality: number }[] })[])?.map(crop => {
        const totalMortality = crop.daily_logs?.reduce((sum: number, log: { mortality: number }) => sum + (log.mortality || 0), 0) || 0;
        return {
            ...crop,
            present_chicks: crop.total_chicks - totalMortality
        };
    });

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Crop Management</h1>
                    <p className="text-neutral-500 mt-2 text-lg">Manage your chick crops and inventory with real-time data.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search crops..."
                            className="pl-4 pr-10 py-2 bg-white border border-neutral-100 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-neutral-200 w-64 shadow-sm"
                        />
                    </div>
                    <Link href="/crops/new_crop" className="bg-neutral-900 hover:bg-black text-white px-6 py-2 rounded-md text-sm font-bold transition-colors shadow-sm uppercase tracking-wider">
                        New Crop
                    </Link>
                </div>
            </header>

            {!crops || crops.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-neutral-50 rounded-3xl border border-dashed border-neutral-200 text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                        <div className="w-8 h-8 bg-neutral-100 rounded-lg animate-pulse"></div>
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900">No crops found</h3>
                    <p className="text-neutral-500 mt-2 mb-8 max-w-xs">Start by adding your first crop to the system.</p>
                    <Link href="/crops/new_crop" className="bg-neutral-900 text-white px-8 py-3 rounded-md font-bold uppercase tracking-widest text-xs">
                        Add First Crop
                    </Link>
                </div>
            ) : (
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {crops.map((crop: CropWithMortality) => (
                        <CropCardDetail key={crop.id} crop={crop} />
                    ))}
                </section>
            )}
        </div>
    );
}
