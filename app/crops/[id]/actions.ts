"use server"

import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";

export async function harvestCrop(cropId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('crops')
        .update({
            status: 'Completed',
            actual_harvest_date: new Date().toISOString()
        })
        .eq('id', cropId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/dashboard');
    revalidatePath('/crops');
    revalidatePath(`/crops/${cropId}`);
}

export async function recordDailyLog(cropId: string, data: {
    mortality: number,
    c1_bags?: number,
    c2_bags?: number,
    c3_bags?: number,
    water_consumed_liters?: number,
    avg_weight_g?: number,
    notes?: string
}) {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // 0. Stock Validation
    const bagCounts: Record<string, number> = {
        'C1': data.c1_bags || 0,
        'C2': data.c2_bags || 0,
        'C3': data.c3_bags || 0,
    };

    for (const [name, count] of Object.entries(bagCounts)) {
        if (count > 0) {
            const { data: feedType } = await supabase
                .from('feed_types')
                .select('name, current_stock_kg')
                .eq('name', name)
                .eq('user_id', user.id)
                .maybeSingle();

            if (!feedType || (feedType.current_stock_kg || 0) < (count * 50)) {
                const availableBags = Math.floor((feedType?.current_stock_kg || 0) / 50);
                throw new Error(`Insufficient stock for ${name}: Required ${count} bags, but only ${availableBags} bags remaining.`);
            }
        }
    }

    const totalFeedKg = ((data.c1_bags || 0) + (data.c2_bags || 0) + (data.c3_bags || 0)) * 50;

    // 1. Sync Feed Inventory and Logs
    if (totalFeedKg > 0) {
        // Create feed log entry
        await supabase.from('feed_logs').insert({
            crop_id: cropId,
            action: 'Usage',
            c1_bags: data.c1_bags || 0,
            c2_bags: data.c2_bags || 0,
            c3_bags: data.c3_bags || 0,
            log_date: new Date().toISOString()
        });

        // Update stocks
        for (const [name, count] of Object.entries(bagCounts)) {
            if (count > 0) {
                const { data: feedType } = await supabase
                    .from('feed_types')
                    .select('id, current_stock_kg')
                    .eq('name', name)
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (feedType) {
                    const newStock = (feedType.current_stock_kg || 0) - (count * 50);
                    await supabase
                        .from('feed_types')
                        .update({ current_stock_kg: newStock })
                        .eq('id', feedType.id);
                }
            }
        }
    }

    // 2. Fetch/Update Daily Log
    const { data: existingLog } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('crop_id', cropId)
        .eq('log_date', today)
        .maybeSingle();

    if (existingLog) {
        const { error } = await supabase
            .from('daily_logs')
            .update({
                mortality: (existingLog.mortality || 0) + data.mortality,
                feed_consumed_kg: (existingLog.feed_consumed_kg || 0) + totalFeedKg,
                water_consumed_liters: (existingLog.water_consumed_liters || 0) + (data.water_consumed_liters || 0),
                avg_weight_g: data.avg_weight_g || existingLog.avg_weight_g,
                notes: data.notes ? (existingLog.notes ? `${existingLog.notes}\n${data.notes}` : data.notes) : existingLog.notes
            })
            .eq('id', existingLog.id);
        if (error) throw new Error(error.message);
    } else {
        const { error } = await supabase
            .from('daily_logs')
            .insert({
                crop_id: cropId,
                log_date: today,
                mortality: data.mortality,
                feed_consumed_kg: totalFeedKg,
                water_consumed_liters: data.water_consumed_liters,
                avg_weight_g: data.avg_weight_g,
                notes: data.notes
            });
        if (error) throw new Error(error.message);
    }

    revalidatePath('/feeds');
    revalidatePath('/dashboard');
    revalidatePath('/crops');
    revalidatePath(`/crops/${cropId}`);
}
