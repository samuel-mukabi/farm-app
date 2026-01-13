"use server"

import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";

export async function logFeedUsage(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const feed_type_id = formData.get("feed_type_id") as string;
    const crop_id = formData.get("crop_id") as string;
    const quantity_kg = parseFloat(formData.get("quantity_kg") as string);

    if (isNaN(quantity_kg) || quantity_kg <= 0) throw new Error("Invalid quantity");

    // 1. Create log entry
    const { error: logError } = await supabase
        .from('feed_logs')
        .insert({
            feed_type_id,
            crop_id,
            action: 'Usage',
            quantity_kg
        });

    if (logError) throw new Error(logError.message);

    // 2. Update feed_types stock
    const { data: feedType } = await supabase
        .from('feed_types')
        .select('current_stock_kg')
        .eq('id', feed_type_id)
        .single();

    if (feedType) {
        const newStock = (feedType.current_stock_kg || 0) - quantity_kg;
        await supabase
            .from('feed_types')
            .update({ current_stock_kg: newStock })
            .eq('id', feed_type_id);
    }

    revalidatePath('/feeds');
    revalidatePath('/dashboard');
    if (crop_id) revalidatePath(`/crops/${crop_id}`);
}

export async function restockFeed(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const feed_type_id = formData.get("feed_type_id") as string;
    const quantity_bags = parseFloat(formData.get("quantity_bags") as string);

    if (isNaN(quantity_bags) || quantity_bags <= 0) throw new Error("Invalid quantity");

    const quantity_kg = quantity_bags * 50;

    // 1. Create log entry
    const { error: logError } = await supabase
        .from('feed_logs')
        .insert({
            feed_type_id,
            action: 'Restock',
            quantity_kg
        });

    if (logError) throw new Error(logError.message);

    // 2. Update feed_types stock
    const { data: feedType } = await supabase
        .from('feed_types')
        .select('current_stock_kg')
        .eq('id', feed_type_id)
        .single();

    if (feedType) {
        const newStock = (feedType.current_stock_kg || 0) + quantity_kg;
        await supabase
            .from('feed_types')
            .update({
                current_stock_kg: newStock,
                reorder_level_kg: quantity_bags // Storing the actual bag count from last restock
            })
            .eq('id', feed_type_id);
    }

    revalidatePath('/feeds');
    revalidatePath('/dashboard');
}
