import SettingsShell from "@/components/account/AccountShell";
import SettingsNav from "@/components/account/AccountNav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <SettingsShell
            nav={<SettingsNav />}
        >
            {children}
        </SettingsShell>
    );
}
