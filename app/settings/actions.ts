"use server"

import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const full_name = formData.get("full_name") as string;
    const farm_name = formData.get("farm_name") as string;

    const { error } = await supabase
        .from('users')
        .update({
            full_name,
            farm_name,
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

    if (error) throw new Error(error.message);

    revalidatePath('/settings');
    revalidatePath('/dashboard');
}


