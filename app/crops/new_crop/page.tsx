"use client"
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/supabase/client";

const InputField = ({ label, name, type = "text", placeholder, options, required = true }: { label: string, name: string, type?: string, placeholder?: string, options?: string[], required?: boolean }) => (
    <div className="flex flex-col gap-2">
        <label htmlFor={name} className="text-sm font-bold text-neutral-500 uppercase tracking-wider">{label}</label>
        {type === "select" ? (
            <select
                id={name}
                name={name}
                required={required}
                defaultValue={options?.[0]}
                className="w-full px-4 py-3 bg-white border border-neutral-100 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-neutral-200 shadow-sm appearance-none cursor-pointer"
            >
                {options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        ) : (
            <input
                type={type}
                id={name}
                name={name}
                required={required}
                placeholder={placeholder}
                className="w-full px-4 py-3 bg-white border border-neutral-100 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-neutral-200 shadow-sm"
            />
        )}
    </div>
);

export default function NewCropPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setError("You must be logged in to create a crop.");
            setIsLoading(false);
            return;
        }

        // 1. Insert Crop
        const { data: crop, error: cropError } = await supabase
            .from('crops')
            .insert([{
                name: data.name,
                total_chicks: parseInt(data.total_chicks as string),
                arrival_date: data.arrival_date,
                expected_harvest_date: data.expected_harvest_date,
                notes: data.notes,
                status: 'Active',
                user_id: user.id
            }])
            .select()
            .single()

        if (cropError) {
            setError(cropError.message);
            setIsLoading(false);
            return;
        }

        // 2. Insert Chick Sources
        const sources = [];
        if (Number(data.normal_chicks_count) > 0) {
            sources.push({
                crop_id: crop.id,
                supplier_name: 'ANIRITA',
                count: Number(data.normal_chicks_count)
            });
        }
        if (Number(data.kenchick_chicks_count) > 0) {
            sources.push({
                crop_id: crop.id,
                supplier_name: 'KENCHICK',
                count: Number(data.kenchick_chicks_count)
            });
        }

        if (sources.length > 0) {
            const { error: sourceError } = await supabase
                .from('chick_sources')
                .insert(sources);
            if (sourceError) console.error("Source Insert Error:", sourceError);
        }

        // 3. Handle Feeds
        const feeds = [
            { name: 'C1', count: Number(data.c1_feeds_bags) },
            { name: 'C2', count: Number(data.c2_feeds_bags) },
            { name: 'C3', count: Number(data.c3_feeds_bags) },
        ];

        for (const feed of feeds) {
            if (feed.count > 0) {
                // First find or create the feed type
                const { data: typeData } = await supabase
                    .from('feed_types')
                    .select('id, current_stock_kg')
                    .eq('name', feed.name)
                    .eq('user_id', user.id)
                    .maybeSingle();

                let typeId = typeData?.id;
                const currentStock = typeData?.current_stock_kg || 0;

                if (!typeId) {
                    const { data: newType } = await supabase
                        .from('feed_types')
                        .insert({
                            name: feed.name,
                            current_stock_kg: feed.count * 50,
                            user_id: user.id
                        })
                        .select('id')
                        .single();
                    typeId = newType?.id;
                } else {
                    await supabase
                        .from('feed_types')
                        .update({
                            current_stock_kg: Number(currentStock) + (feed.count * 50)
                        })
                        .eq('id', typeId);
                }

                if (typeId) {
                    const logData: any = {
                        crop_id: crop.id,
                        feed_type_id: typeId,
                        action: 'Restock'
                    };
                    if (feed.name === 'C1') logData.c1_bags = feed.count;
                    else if (feed.name === 'C2') logData.c2_bags = feed.count;
                    else if (feed.name === 'C3') logData.c3_bags = feed.count;
                    else logData.c1_bags = feed.count;

                    await supabase.from('feed_logs').insert(logData);
                }
            }
        }

        router.push("/dashboard");
        router.refresh()
    };

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <header className="mb-10">
                <Link href="/crops" className="inline-flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-neutral-600 transition-colors uppercase tracking-widest mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to Crops
                </Link>
                <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Add New Crop</h1>
                <p className="text-neutral-500 mt-2 text-lg">Enter the details for the new chick arrival.</p>
            </header>

            <div className="card p-8 md:p-12">
                <form className="space-y-8" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                            <p className="text-sm text-red-600 font-semibold leading-tight">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                            <InputField label="Name of the Crop" name="name" placeholder="e.g. Crop #1 - Jan 2024" />
                        </div>

                        <InputField label="Arrival Date" name="arrival_date" type="date" />
                        <InputField label="Expected Harvest Date" name="expected_harvest_date" type="date" />
                        <div className="md:col-span-2 mt-3">
                            <InputField label="Total Amount of Chicks" name="total_chicks" type="number" placeholder="0" />
                        </div>

                        <InputField label="ANIRITA Chicks" name="normal_chicks_count" type="number" placeholder="0" />
                        <InputField label="KENCHICK Chicks" name="kenchick_chicks_count" type="number" placeholder="0" />

                        <div className="md:col-span-2">
                            <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider">
                                Amount of Feeds Brought (50kg Bags)
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                                <InputField label="C1" name="c1_feeds_bags" type="number" placeholder="0" />
                                <InputField label="C2" name="c2_feeds_bags" type="number" placeholder="0" />
                                <InputField label="C3" name="c3_feeds_bags" type="number" placeholder="0" />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="notes" className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Notes</label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white border border-neutral-100 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-neutral-200 shadow-sm"
                                    placeholder="Any additional details..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-neutral-900 hover:bg-black text-white py-4 rounded-md text-sm font-bold transition-all shadow-sm uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Create Crop"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
