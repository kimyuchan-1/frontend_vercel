import { redirect } from "next/navigation";
import SectionHeader from "@/components/account/SectionHeader";
import ProfileForm from "../profile/ProfileForm";
import { getCurrentUser } from "@/lib/auth";

// Force SSR with no caching for security
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProfilePage() {
    // Server-side authentication check
    const user = await getCurrentUser();
    
    if (!user) {
        redirect("/signin");
    }
    
    return (
        <div className="space-y-6">
            <SectionHeader
                title="프로필"
                description="회원명과 계정 정보를 관리합니다."
            />
            <ProfileForm />
        </div>
    );
}
