import { Landmark } from "lucide-react";
import { createClient } from "@/supabase/server";
import { ProfileForm } from "./SettingsClient";

const SettingSection = ({ title, description, children, icon: Icon }: { title: string, description: string, children: React.ReactNode, icon?:any }) => (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden mb-10 transition-all hover:shadow-md">
        <div className="p-10 border-b border-neutral-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
                {Icon && <div className="p-3 bg-neutral-50 rounded-xl text-neutral-400"><Icon className="w-6 h-6" /></div>}
                <div>
                    <h2 className="text-2xl font-black text-neutral-900 tracking-tight">{title}</h2>
                    <p className="text-sm text-neutral-400 font-medium mt-1 leading-relaxed max-w-md">{description}</p>
                </div>
            </div>
        </div>
        <div className="p-10 bg-neutral-50/10">
            {children}
        </div>
    </div>
);

const Page = async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            <header className="mb-12">
                <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight">System Settings</h1>
                <p className="text-neutral-500 mt-2 text-xl font-medium">Control your farm infrastructure and personal security.</p>
            </header>

            <SettingSection
                title="Identity & Farm"
                description="Manage your professional identity and the public name of your poultry farm infrastructure."
                icon={Landmark}
            >
                <ProfileForm initialData={profile || {}} />
            </SettingSection>
            <div className="mb-20 py-10 border-t border-neutral-50 flex justify-center italic text-neutral-300 text-sm font-medium">
                System Version 1.0.0 • Stable Cloud Build
            </div>
        </div>
    );
};

export default Page;
