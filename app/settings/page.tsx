import { Bell, Lock, Mail, Save, Shield, User } from "lucide-react";

const SettingSection = ({ title, description, children }: { title: string, description: string, children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden mb-8">
        <div className="p-8 border-b border-neutral-50">
            <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
            <p className="text-sm text-neutral-400 font-medium mt-1">{description}</p>
        </div>
        <div className="p-8">
            {children}
        </div>
    </div>
);

const InputField = ({ label, type = "text", placeholder, defaultValue }: { label: string, type?: string, placeholder?: string, defaultValue?: string }) => (
    <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider">{label}</label>
        <input
            type={type}
            placeholder={placeholder}
            defaultValue={defaultValue}
            className="px-4 py-2.5 bg-neutral-50 border border-neutral-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
        />
    </div>
);

const Page = () => {
    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <header className="mb-10">
                <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Settings</h1>
                <p className="text-neutral-500 mt-2 text-lg">Manage your farm profile, notifications, and security settings.</p>
            </header>

            <SettingSection title="Farm Profile" description="Update your farm information and location details.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <InputField label="Farm Name" defaultValue="Green Valley Poultry" />
                    <InputField label="Contact Email" defaultValue="user@example.com" />
                    <div className="md:col-span-2">
                        <InputField label="Farm Location" defaultValue="123 Farm Road, Nakuru, Kenya" />
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-neutral-50 flex flex-col sm:flex-row items-center gap-4">
                    <button className="text-sm font-bold text-blue-600 hover:text-blue-700">Change Farm Logo</button>
                    <button className="text-sm font-bold text-red-500 hover:text-red-600 ml-auto">Remove</button>
                </div>
            </SettingSection>

            <SettingSection title="Notifications" description="Configure how you receive alerts and updates.">
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 p-2 rounded-lg"><Bell className="w-5 h-5 text-blue-600" /></div>
                            <div>
                                <p className="font-bold text-neutral-900">Push Notifications</p>
                                <p className="text-xs text-neutral-400 font-medium">Receive alerts for vaccinations and low feed.</p>
                            </div>
                        </div>
                        <div className="w-12 h-6 bg-blue-500 rounded-full relative cursor-pointer">
                            <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"></div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div className="flex items-center gap-4">
                            <div className="bg-emerald-100 p-2 rounded-lg"><Mail className="w-5 h-5 text-emerald-600" /></div>
                            <div>
                                <p className="font-bold text-neutral-900">Email Reports</p>
                                <p className="text-xs text-neutral-400 font-medium">Weekly performance summaries delivered to your inbox.</p>
                            </div>
                        </div>
                        <div className="w-12 h-6 bg-neutral-200 rounded-full relative cursor-pointer">
                            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"></div>
                        </div>
                    </div>
                </div>
            </SettingSection>

            <SettingSection title="Security" description="Update your password and protect your account.">
                <div className="space-y-6">
                    <button className="w-full flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <Lock className="w-5 h-5 text-neutral-400" />
                            <span className="font-bold text-neutral-700">Change Password</span>
                        </div>
                        <Shield className="w-4 h-4 text-neutral-300" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <User className="w-5 h-5 text-neutral-400" />
                            <span className="font-bold text-neutral-700">Manage Sessions</span>
                        </div>
                        <Shield className="w-4 h-4 text-neutral-300" />
                    </button>
                </div>
            </SettingSection>

            <div className="flex items-center justify-end gap-4 mb-20">
                <button className="px-6 py-3 rounded-xl font-bold text-neutral-500 hover:bg-neutral-100 transition-colors">Discard Changes</button>
                <button className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2">
                    <Save className="w-5 h-5" /> Save Configuration
                </button>
            </div>
        </div>
    );
};

export default Page;
