import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";

// Force SSR with no caching for security
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AccountIndexPage() {
    // Server-side authentication check
    const user = await getAuthUser();
    
    if (!user) {
        redirect("/signin");
    }
    
    redirect("/account/profile");
}
