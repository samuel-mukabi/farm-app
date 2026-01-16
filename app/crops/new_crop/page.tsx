"use client"
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/supabase/client";
import { FeedLog } from "@/types/farm";

const InputField = ({ label, name, type = "text", placeholder, options, required = true }: { label: string, name: string, type?: string, placeholder?: string, options?: string[], required?: boolean }) => (
    <div className="flex flex-col gap-2">
        <label htmlFor={name} className="text-sm font-bold text-neutral-500 uppercase tracking-wider">{label}</label>
        {type === "select" ? (
            <select
                id={name}
                name={name}
                required={required}
                defaultValue={options?.[0]}
                className="w-full px-4 py-3 bg-white border border-neutral-600 rounded-md text-base focus:outline-none appearance-none cursor-pointer"
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
                className="w-full px-4 py-3 bg-white border border-neutral-400 rounded-md text-base focus:outline-none"
            />
        )}
    </div>
);

export default function NewCropPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isHistorical, setIsHistorical] = useState(false);

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
        const cropData = {
            name: data.name,
            total_chicks: parseInt(data.total_chicks as string),
            arrival_date: data.arrival_date,
            expected_harvest_date: data.expected_harvest_date,
            actual_harvest_date: isHistorical ? data.actual_harvest_date : null,
            notes: data.notes,
            status: isHistorical ? 'Completed' : 'Active',
            user_id: user.id
        };

        // Suppress TS error for status if needed, but 'Completed' should be valid per types
        const { data: crop, error: cropError } = await supabase
            .from('crops')
            .insert([cropData])
            .select()
            .single();

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

        // 3. Handle Historical Data or Active Crop Feeds
        if (isHistorical) {
            // Calculate total bags and convert details
            const c1Bags = Number(data.c1_feeds_consumed_bags || 0);
            const c2Bags = Number(data.c2_feeds_consumed_bags || 0);
            const c3Bags = Number(data.c3_feeds_consumed_bags || 0);
            const totalBags = c1Bags + c2Bags + c3Bags;

            // Calculate Weight Averages from Totals
            const totalChicks = parseInt(data.total_chicks as string) || 0;
            const mortality = parseInt(data.total_mortality as string) || 0;
            const liveBirds = Math.max(1, totalChicks - mortality);
            const birdsPerGroup = Math.max(1, liveBirds / 3);

            const heavyKg = parseFloat(data.total_weight_heavy_kg as string) || 0;
            const mediumKg = parseFloat(data.total_weight_medium_kg as string) || 0;
            const lightKg = parseFloat(data.total_weight_light_kg as string) || 0;
            const totalKg = heavyKg + mediumKg + lightKg;

            const avgHeavyG = heavyKg * 1000;
            const avgMediumG = mediumKg * 1000;
            const avgLightG = lightKg * 1000;
            const overallAvgG = (totalKg * 1000) / liveBirds;

            // Update local cropData object to include weights before any other ops if needed, 
            // but crop is already inserted. We need to update the crop record with the calculated weights.
            if (heavyKg > 0 || mediumKg > 0 || lightKg > 0) {
                await supabase
                    .from('crops')
                    .update({
                        avg_weight_heavy: avgHeavyG,
                        avg_weight_medium: avgMediumG,
                        avg_weight_light: avgLightG
                    })
                    .eq('id', crop.id);
            }

            // Create a summary Daily Log entry
            const summaryLog = {
                crop_id: crop.id,
                log_date: data.actual_harvest_date,
                mortality: Number(data.total_mortality || 0),
                feed_consumed_kg: totalBags * 50, // Convert bags to kg
                avg_weight_g: overallAvgG > 0 ? overallAvgG : undefined,
                notes: 'Historical Data Summary'
            };

            const { error: logError } = await supabase
                .from('daily_logs')
                .insert([summaryLog]);

            if (logError) {
                console.error("Historical Log Error:", logError);
            }

            // Record detailed feed usage in feed_logs
            const feedUsages = [
                { name: 'C1', count: c1Bags },
                { name: 'C2', count: c2Bags },
                { name: 'C3', count: c3Bags },
            ];

            for (const feed of feedUsages) {
                if (feed.count > 0) {
                    // Find or create feed type (idempotent check)
                    const { data: typeData } = await supabase
                        .from('feed_types')
                        .select('id')
                        .eq('name', feed.name)
                        .eq('user_id', user.id)
                        .maybeSingle();

                    let typeId = typeData?.id;

                    if (!typeId) {
                        const { data: newType } = await supabase
                            .from('feed_types')
                            .insert({
                                name: feed.name,
                                current_stock_kg: 0, // No stock for historical
                                user_id: user.id
                            })
                            .select('id')
                            .single();
                        typeId = newType?.id;
                    }

                    if (typeId) {
                        const logData: Partial<FeedLog> = {
                            crop_id: crop.id,
                            feed_type_id: typeId,
                            action: 'Usage',
                            log_date: data.actual_harvest_date as string,
                        };
                        if (feed.name === 'C1') logData.c1_bags = feed.count;
                        else if (feed.name === 'C2') logData.c2_bags = feed.count;
                        else if (feed.name === 'C3') logData.c3_bags = feed.count;

                        await supabase.from('feed_logs').insert(logData);
                    }
                }
            }

        } else {
            // Normal Flow: Handle Feed Inventory for Active Crop
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
                        const logData: Partial<FeedLog> = {
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
        }

        router.push("/dashboard");
        router.refresh();
    };

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <header className="mb-10">
                <Link href="/crops" className="inline-flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-neutral-600 transition-colors uppercase tracking-widest mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to Crops
                </Link>
                <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Add New Crop</h1>
                <p className="text-neutral-500 mt-2 text-lg">Enter the details for {isHistorical ? 'a previous' : 'the new'} chick arrival.</p>
            </header>

            <div className="card p-8 md:p-12">
                <form className="space-y-8" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                            <p className="text-sm text-red-600 font-semibold leading-tight">{error}</p>
                        </div>
                    )}

                    <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-100 flex items-center gap-4">
                        <input
                            type="checkbox"
                            id="isHistorical"
                            checked={isHistorical}
                            onChange={(e) => setIsHistorical(e.target.checked)}
                            className="w-5 h-5 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-900"
                        />
                        <label htmlFor="isHistorical" className="text-sm font-bold text-neutral-700 uppercase tracking-wider cursor-pointer select-none">
                            This is a completed / past crop (Import Data)
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                            <InputField label="Name of the Crop" name="name" placeholder="e.g. Crop #1 - Jan 2024" />
                        </div>

                        <InputField label="Arrival Date" name="arrival_date" type="date" />

                        {isHistorical ? (
                            <InputField label="Actual Harvest Date" name="actual_harvest_date" type="date" required={isHistorical} />
                        ) : (
                            <InputField label="Expected Harvest Date" name="expected_harvest_date" type="date" />
                        )}

                        <div className="md:col-span-2 mt-3">
                            <InputField label="Total Amount of Chicks" name="total_chicks" type="number" placeholder="0" />
                        </div>

                        <InputField label="ANIRITA Chicks" name="normal_chicks_count" type="number" placeholder="0" />
                        <InputField label="KENCHICK Chicks" name="kenchick_chicks_count" type="number" placeholder="0" />

                        {isHistorical ? (
                            <div className="md:col-span-2 space-y-8 border-t border-neutral-100 pt-8 mt-4">
                                <h3 className="text-lg font-bold text-neutral-900 uppercase tracking-tight">Performance Summary</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider block mb-2">
                                            Average Weight per Bird (kg) - Split into 3 Groups
                                        </label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <InputField label="Heavy Group Avg (kg)" name="total_weight_heavy_kg" type="number" placeholder="0" required={isHistorical} />
                                            <InputField label="Medium Group Avg (kg)" name="total_weight_medium_kg" type="number" placeholder="0" required={isHistorical} />
                                            <InputField label="Light Group Avg (kg)" name="total_weight_light_kg" type="number" placeholder="0" required={isHistorical} />
                                        </div>
                                    </div>
                                    <InputField label="Total Mortality" name="total_mortality" type="number" placeholder="0" required={isHistorical} />
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider block mb-2">
                                        Total Feed Used (Bags)
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <InputField label="C1" name="c1_feeds_consumed_bags" type="number" placeholder="0" />
                                        <InputField label="C2" name="c2_feeds_consumed_bags" type="number" placeholder="0" />
                                        <InputField label="C3" name="c3_feeds_consumed_bags" type="number" placeholder="0" />
                                    </div>
                                </div>
                            </div>
                        ) : (
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
                        )}

                        <div className="md:col-span-2">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="notes" className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Notes</label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white border border-neutral-400 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-neutral-200 shadow-sm"
                                    placeholder="Any additional details..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full text-white bg-neutral-900 border border-neutral-400 py-4 rounded-md text-sm font-bold transition-all shadow-sm uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2 ${isHistorical ? 'bg-blue-600 hover:bg-blue-700' : 'bg-neutral-900 hover:bg-black'}`}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                isHistorical ? "Import Past Crop" : "Create Crop"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
