"use server"

import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function signUpAction(formData: FormData) {
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const fullName = formData.get("full_name")?.toString();
    const supabase = await createClient();
    const origin = (await headers()).get("origin");

    if (!email || !password || !fullName) {
        throw new Error("Email, password, and full name are required");
    }

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
            emailRedirectTo: `${origin}/auth/callback`,
        },
    });

    if (error) {
        console.error(error.code + " " + error.message);
        throw new Error(error.message);
    }

    // In many Supabase configs, signUp with auto-confirm disabled returns a user but no session.
    // If we want immediate login, we can try to signIn right after if the config allows it, 
    // or rely on the redirect to a confirmation page.
    // However, the user specifically asked to go to dashboard.

    return redirect("/dashboard");
}

export async function signInAction(formData: FormData) {
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const supabase = await createClient();

    if (!email || !password) {
        throw new Error("Email and password are required");
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        throw new Error(error.message);
    }

    return redirect("/dashboard");
}
