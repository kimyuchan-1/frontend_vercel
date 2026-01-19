"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchMySuggestions, type MySuggestion } from "@/lib/api/account";

const StatusLabels: Record<MySuggestion["status"], string> = {
    PENDING: "접수",
    REVIEWING: "검토중",
    APPROVED: "승인",
    REJECTED: "반려",
    COMPLETED: "완료",
};

function StatusBadge({ status }: { status: MySuggestion["status"] }) {
    const label = StatusLabels[status] ?? status;
    return (
        <span className="inline-flex items-center px-2 py-1 text-xs rounded-full border">
            {label}
        </span>
    );
}

export default function MySuggestionsList() {
    const [status, setStatus] = useState<"ALL" | MySuggestion["status"]>("ALL");
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [items, setItems] = useState<MySuggestion[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await fetchMySuggestions({ page, pageSize, status });
                if (!mounted) return;
                setItems(res.items);
                setTotal(res.total);
            } catch (e: any) {
                if (!mounted) return;
                setError(e?.message || "내 건의 목록을 불러오지 못했습니다.");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [page, pageSize, status]);

    function onChangeStatus(v: "ALL" | MySuggestion["status"]) {
        setStatus(v);
        setPage(1);
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">상태</label>
                    <select
                        value={status}
                        onChange={(e) => onChangeStatus(e.target.value as any)}
                        className="px-3 py-2 border rounded-lg"
                    >
                        <option value="ALL">전체</option>
                        <option value="PENDING">접수</option>
                        <option value="REVIEWING">검토중</option>
                        <option value="APPROVED">승인</option>
                        <option value="REJECTED">반려</option>
                        <option value="COMPLETED">완료</option>
                    </select>
                </div>

                <div className="text-sm text-gray-600">
                    총 <span className="font-semibold">{total}</span>건
                </div>
            </div>

            <div className="rounded-2xl border overflow-hidden">
                <div className="grid grid-cols-[1fr_100px] md:grid-cols-[1fr_120px_160px] px-4 py-3 bg-gray-50 text-sm font-semibold">
                    <div>제목</div>
                    <div className="text-right md:text-left">상태</div>
                    <div className="hidden md:block text-right">작성일</div>
                </div>

                {loading ? (
                    <div className="px-4 py-10 text-sm text-gray-500">불러오는 중...</div>
                ) : error ? (
                    <div className="px-4 py-10 text-sm text-red-600">{error}</div>
                ) : items.length === 0 ? (
                    <div className="px-4 py-10 text-sm text-gray-500">표시할 건의가 없습니다.</div>
                ) : (
                    <ul>
                        {items.map((it) => (
                            <li key={String(it.id)} className="border-t">
                                <Link
                                    href={`/board/${it.id}`}
                                    className="grid grid-cols-[1fr_100px] md:grid-cols-[1fr_120px_160px] gap-3 px-4 py-4 hover:bg-gray-50"
                                >
                                    <div className="min-w-0">
                                        <div className="font-medium truncate">{it.title}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            👍 {it.likeCount ?? 0} · 👁 {it.viewCount ?? 0}
                                        </div>
                                    </div>

                                    <div className="flex justify-end md:justify-start items-start">
                                        <StatusBadge status={it.status} />
                                    </div>

                                    <div className="hidden md:block text-right text-sm text-gray-600">
                                        {it.createdAt ? new Date(it.createdAt).toLocaleDateString("ko-KR") : "-"}
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="flex items-center justify-between">
                <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    className="px-3 py-2 rounded-lg border disabled:opacity-40"
                >
                    이전
                </button>

                <div className="text-sm text-gray-600">
                    {page} / {totalPages}
                </div>

                <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || loading}
                    className="px-3 py-2 rounded-lg border disabled:opacity-40"
                >
                    다음
                </button>
            </div>
        </div>
    );
}
