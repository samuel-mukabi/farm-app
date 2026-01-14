"use server"

import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";

export async function logFeedUsage(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const crop_id = formData.get("crop_id") as string || null;

    const bagCounts: Record<string, number> = {
        'C1': parseInt(formData.get("c1_bags") as string) || 0,
        'C2': parseInt(formData.get("c2_bags") as string) || 0,
        'C3': parseInt(formData.get("c3_bags") as string) || 0,
    };

    if (Object.values(bagCounts).every(count => count === 0)) {
        throw new Error("Please specify at least one bag");
    }

    // 0. Stock Validation
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

    // 1. Create log entry
    const { error: logError } = await supabase
        .from('feed_logs')
        .insert({
            crop_id,
            action: 'Usage',
            c1_bags: bagCounts['C1'],
            c2_bags: bagCounts['C2'],
            c3_bags: bagCounts['C3']
        });

    if (logError) throw new Error(logError.message);

    // 2. Update individual feed_types stock
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

    revalidatePath('/feeds');
    revalidatePath('/dashboard');

    // 3. Sync with daily_logs if crop_id exists
    if (crop_id) {
        const totalFeedKg = Object.values(bagCounts).reduce((sum, count) => sum + (count * 50), 0);
        const today = new Date().toISOString().split('T')[0];

        const { data: existingDailyLog } = await supabase
            .from('daily_logs')
            .select('*')
            .eq('crop_id', crop_id)
            .eq('log_date', today)
            .maybeSingle();

        if (existingDailyLog) {
            await supabase
                .from('daily_logs')
                .update({ feed_consumed_kg: (existingDailyLog.feed_consumed_kg || 0) + totalFeedKg })
                .eq('id', existingDailyLog.id);
        } else {
            await supabase
                .from('daily_logs')
                .insert({
                    crop_id: crop_id,
                    log_date: today,
                    feed_consumed_kg: totalFeedKg,
                    mortality: 0
                });
        }
        revalidatePath(`/crops/${crop_id}`);
    }
}

