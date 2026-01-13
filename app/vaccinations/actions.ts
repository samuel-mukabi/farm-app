"use server"

import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";
import { VaccinationStatus } from "@/types/farm";

export async function scheduleVaccination(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const crop_id = formData.get("crop_id") as string;
    const vaccine_name = formData.get("vaccine_name") as string;
    const target_date = formData.get("target_date") as string;

    const { error } = await supabase
        .from('vaccinations')
        .insert({
            crop_id,
            vaccine_name,
            target_date,
            status: 'Pending' as VaccinationStatus
        });

    if (error) throw new Error(error.message);

    revalidatePath('/vaccinations');
    revalidatePath('/dashboard');
}

export async function administerVaccination(vaccinationId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('vaccinations')
        .update({
            status: 'Administered' as VaccinationStatus,
            administered_at: new Date().toISOString()
        })
        .eq('id', vaccinationId);

    if (error) throw new Error(error.message);

    revalidatePath('/vaccinations');
    revalidatePath('/dashboard');
}

export async function deleteVaccination(vaccinationId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('vaccinations')
        .delete()
        .eq('id', vaccinationId);

    if (error) throw new Error(error.message);

    revalidatePath('/vaccinations');
    revalidatePath('/dashboard');
}
