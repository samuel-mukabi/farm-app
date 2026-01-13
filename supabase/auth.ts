import { createClient } from "@/supabase/client";
import { AuthError, AuthResponse as SupabaseAuthResponse } from "@supabase/supabase-js";

// Shared response type
type AuthResponse = {
    data: SupabaseAuthResponse["data"] | null;
    error: AuthError | null;
    url?: string | null;
};

// REGISTER
// - Creates auth user
// - Sends full_name as metadata
// - Creates a profile row in the `users` table
export async function register(
    email: string,
    password: string,
    full_name: string
): Promise<AuthResponse> {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name,
            },
        },
    });

    if (error) {
        return { data: null, error };
    }

    const user = data?.user;

    if (!user) {
        return {
            data: null,
            error: {
                name: "AuthError",
                message: "User creation failed",
            } as AuthError,
        };
    }

    return { data, error: null };
}

// LOGIN
export async function login(
    email: string,
    password: string
): Promise<AuthResponse> {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    return { data, error };
}

// LOGIN WITH GOOGLE
export async function loginWithGoogle() {
    const supabase = createClient()

    // Use environment variable if available, otherwise use window location (this function should be called from client side)
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL || window.location.origin
    const redirectUrl = `${baseUrl}/auth/callback?next=/dashboard`

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: redirectUrl,
        },
    });

    return { data, error };
}
