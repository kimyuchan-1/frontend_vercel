import { redirect } from "next/navigation";
import SectionHeader from "@/components/account/SectionHeader";
import MySuggestionsList from "../activity/MySuggestionsList";
import { getAuthUser } from "@/lib/auth";

// Force SSR with no caching for security
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ActivityPage() {
    // Server-side authentication check
    const user = await getAuthUser();
    
    if (!user) {
        redirect("/signin");
    }
    
    return (
        <div className="space-y-6">
            <SectionHeader
                title="활동 내역"
                description="내가 작성한 건의를 확인합니다."
            />
            <MySuggestionsList />
        </div>
    );
}
