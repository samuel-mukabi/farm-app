"use server"

import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";

export async function logFeedUsage(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const crop_id = formData.get("crop_id") as string || null;

    const bagCounts = {
        'C1': parseInt(formData.get("c1_bags") as string) || 0,
        'C2': parseInt(formData.get("c2_bags") as string) || 0,
        'C3': parseInt(formData.get("c3_bags") as string) || 0,
    };

    if (Object.values(bagCounts).every(count => count === 0)) {
        throw new Error("Please specify at least one bag");
    }

    try {
        const { error } = await supabase.rpc('log_feed_usage_atomic', {
            p_crop_id: crop_id,
            p_c1_bags: bagCounts['C1'],
            p_c2_bags: bagCounts['C2'],
            p_c3_bags: bagCounts['C3'],
            p_action: 'Usage',
            p_log_date: new Date().toISOString()
        });

        if (error) {
            console.error("RPC Error:", error);
            throw new Error(error.message);
        }
    } catch (e: any) {
        throw new Error(`Usage log failed: ${e.message}`);
    }

    revalidatePath('/feeds');
    revalidatePath('/dashboard');
    if (crop_id) revalidatePath(`/crops/${crop_id}`);
}

export async function restockFeed(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const bagCounts = {
        'C1': parseInt(formData.get("c1_bags") as string) || 0,
        'C2': parseInt(formData.get("c2_bags") as string) || 0,
        'C3': parseInt(formData.get("c3_bags") as string) || 0,
    };

    if (Object.values(bagCounts).every(count => count === 0)) {
        throw new Error("Please specify at least one bag for restocking");
    }

    try {
        // Try to call the RPC function for atomic update
        const { error } = await supabase.rpc('restock_feed_atomic', {
            p_c1_bags: bagCounts['C1'],
            p_c2_bags: bagCounts['C2'],
            p_c3_bags: bagCounts['C3'],
            p_action: 'Restock',
            p_log_date: new Date().toISOString()
        });

        if (error) {
            console.error("RPC Error:", error);
            // Fallback to manual transaction-like logic if RPC doesn't exist yet
            // (Maintenance mode or migration pending)
            throw new Error(error.message);
        }
    } catch (e: any) {
        // Fallback logic could go here, or just let it fail to ensure data integrity
        // For now, let's assume the user will run the migration.
        // But to be safe and "fix" the original code as well (make it robust order):
        // If RPC fails, we might want to throw.
        throw new Error(`Restock failed: ${e.message}`);
    }

    revalidatePath('/feeds');
    revalidatePath('/dashboard');
}

