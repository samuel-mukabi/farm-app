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
    feed_consumed_kg: number,
    water_consumed_liters?: number,
    avg_weight_g?: number,
    notes?: string
}) {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    // Check if a log already exists for today
    const { data: existingLog } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('crop_id', cropId)
        .eq('log_date', today)
        .maybeSingle();

    if (existingLog) {
        // Update existing log
        const { error } = await supabase
            .from('daily_logs')
            .update({
                mortality: (existingLog.mortality || 0) + data.mortality,
                feed_consumed_kg: (existingLog.feed_consumed_kg || 0) + data.feed_consumed_kg,
                water_consumed_liters: (existingLog.water_consumed_liters || 0) + (data.water_consumed_liters || 0),
                avg_weight_g: data.avg_weight_g || existingLog.avg_weight_g,
                notes: data.notes ? (existingLog.notes ? `${existingLog.notes}\n${data.notes}` : data.notes) : existingLog.notes
            })
            .eq('id', existingLog.id);

        if (error) throw new Error(error.message);
    } else {
        // Create new log
        const { error } = await supabase
            .from('daily_logs')
            .insert({
                crop_id: cropId,
                log_date: today,
                ...data
            });

        if (error) throw new Error(error.message);
    }

    revalidatePath('/dashboard');
    revalidatePath('/crops');
    revalidatePath(`/crops/${cropId}`);
}
