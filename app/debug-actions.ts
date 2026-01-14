"use server"
import { createClient } from "@/supabase/server";

export async function debugSchema() {
    const supabase = await createClient();
    const { data, error } = await supabase.from('vaccinations').select('status').limit(10);
    if (error) return { error: error.message };
    return { data };
}
