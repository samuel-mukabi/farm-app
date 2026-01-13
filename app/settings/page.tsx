import { Bell, Lock, Mail, Save, Shield, User, Landmark, Globe } from "lucide-react";
import { createClient } from "@/supabase/server";
import { ProfileForm } from "./SettingsClient";

const SettingSection = ({ title, description, children, icon: Icon }: { title: string, description: string, children: React.ReactNode, icon?: any }) => (
    <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden mb-10 transition-all hover:shadow-md">
        <div className="p-10 border-b border-neutral-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
                {Icon && <div className="p-3 bg-neutral-50 rounded-2xl text-neutral-400"><Icon className="w-6 h-6" /></div>}
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

            <SettingSection
                title="Workflow Automations"
                description="Configure intelligent triggers for push notifications and automated health reports."
                icon={Bell}
            >
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-neutral-100 shadow-sm">
                        <div className="flex items-center gap-5">
                            <div className="bg-blue-50 p-3 rounded-2xl"><Bell className="w-5 h-5 text-blue-600" /></div>
                            <div>
                                <p className="font-black text-neutral-900 uppercase tracking-widest text-[10px] mb-1">Real-time alerts</p>
                                <p className="text-sm text-neutral-500 font-medium leading-tight">Critical notifications for vaccinations and low stocks.</p>
                            </div>
                        </div>
                        <div className="w-14 h-8 bg-black rounded-full relative cursor-pointer border-2 border-transparent">
                            <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-lg"></div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-neutral-100 shadow-sm opacity-50 grayscale pointer-events-none">
                        <div className="flex items-center gap-5">
                            <div className="bg-emerald-50 p-3 rounded-2xl"><Mail className="w-5 h-5 text-emerald-600" /></div>
                            <div>
                                <p className="font-black text-neutral-900 uppercase tracking-widest text-[10px] mb-1">Snapshot Digest</p>
                                <p className="text-sm text-neutral-500 font-medium leading-tight">Weekly efficiency aggregates delivered to your inbox.</p>
                            </div>
                        </div>
                        <div className="w-14 h-8 bg-neutral-200 rounded-full relative cursor-not-allowed border-2 border-transparent">
                            <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow-lg"></div>
                        </div>
                    </div>
                </div>
            </SettingSection>

            <SettingSection
                title="Integrity & Security"
                description="Advanced security protocols to protect your poultry data and administrative access."
                icon={Shield}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button className="group flex items-center justify-between p-6 bg-white border border-neutral-100 rounded-2xl hover:border-neutral-900/10 hover:shadow-lg transition-all text-left">
                        <div className="flex items-center gap-5">
                            <div className="bg-neutral-50 p-3 rounded-2xl text-neutral-400 group-hover:text-neutral-900 transition-colors"><Lock className="w-5 h-5" /></div>
                            <div>
                                <p className="font-black text-neutral-900 uppercase tracking-widest text-[10px] mb-1">Authentication</p>
                                <p className="text-sm text-neutral-500 font-medium leading-tight">Rotate your administrative password.</p>
                            </div>
                        </div>
                    </button>
                    <button className="group flex items-center justify-between p-6 bg-white border border-neutral-100 rounded-2xl hover:border-neutral-900/10 hover:shadow-lg transition-all text-left">
                        <div className="flex items-center gap-5">
                            <div className="bg-neutral-50 p-3 rounded-2xl text-neutral-400 group-hover:text-neutral-900 transition-colors"><User className="w-5 h-5" /></div>
                            <div>
                                <p className="font-black text-neutral-900 uppercase tracking-widest text-[10px] mb-1">Active Sessions</p>
                                <p className="text-sm text-neutral-500 font-medium leading-tight">Manage your current login instances.</p>
                            </div>
                        </div>
                    </button>
                </div>
            </SettingSection>

            <div className="mb-20 py-10 border-t border-neutral-50 flex justify-center italic text-neutral-300 text-sm font-medium">
                System Version 2.0.4 • Stable Cloud Build
            </div>
        </div>
    );
};

export default Page;
