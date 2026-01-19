import { redirect } from "next/navigation";
import SectionHeader from "@/components/account/SectionHeader";
import PasswordForm from "../security/PasswordForm";
import { getCurrentUser } from "@/lib/auth";

// Force SSR with no caching for security
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SecurityPage() {
    // Server-side authentication check
    const user = await getCurrentUser();
    
    if (!user) {
        redirect("/signin");
    }
    
    return (
        <div className="space-y-6">
            <SectionHeader
                title="보안"
                description="비밀번호를 변경할 수 있습니다."
            />
            <PasswordForm />
        </div>
    );
}
