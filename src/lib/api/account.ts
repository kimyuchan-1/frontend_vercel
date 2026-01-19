export type Me = {
    id: number | string;
    email: string;
    name: string;
    role?: string;
    picture?: string | null;
};

export type MySuggestion = {
    id: number | string;
    title: string;
    status: "PENDING" | "REVIEWING" | "APPROVED" | "REJECTED" | "COMPLETED";
    suggestionType?: "SIGNAL" | "CROSSWALK" | "FACILITY";
    createdAt?: string;
    likeCount?: number;
    viewCount?: number;
};

export type ApiResponse<T> = { success: boolean; message: string; data: T };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
        credentials: "include",
        cache: "no-store",
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
        const msg =
            (json && typeof json === "object" && "message" in json && (json as any).message) ||
            `Request failed: ${res.status}`;
        throw new Error(String(msg));
    }

    // ApiResponse면 data만 반환
    if (json && typeof json === "object" && "data" in json) {
        return (json as ApiResponse<T>).data;
    }

    return json as T;
}

export function fetchMe() {
    return request<Me>("/api/me");
}

export function updateProfile(input: { name: string }) {
    return request<{ ok: true }>("/api/me", {
        method: "PATCH",
        body: JSON.stringify(input),
    });
}

export function changePassword(input: { currentPassword: string; newPassword: string }) {
    return request<{ ok: true }>("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export function fetchMySuggestions(params: {
    page: number;
    pageSize: number;
    status: "ALL" | MySuggestion["status"];
}) {
    const sp = new URLSearchParams();
    sp.set("page", String(params.page));
    sp.set("pageSize", String(params.pageSize));
    sp.set("status", params.status);
    return request<{
        items: MySuggestion[];
        page: number;
        pageSize: number;
        total: number;
    }>(`/api/suggestions/my?${sp.toString()}`);
}
