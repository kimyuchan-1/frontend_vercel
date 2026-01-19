import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

// Force SSR with no caching for security
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AccountIndexPage() {
    // Server-side authentication check
    const user = await getCurrentUser();
    
    if (!user) {
        redirect("/signin");
    }
    
    redirect("/account/profile");
}
