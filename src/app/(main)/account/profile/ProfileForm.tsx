"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchMe, updateProfile, type Me } from "@/lib/api/account";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

function isValidName(name: string) {
    const v = name.trim();
    return v.length >= 2 && v.length <= 20;
}

export default function ProfileForm() {
    const [me, setMe] = useState<Me | null>(null);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [okMsg, setOkMsg] = useState<string | null>(null);

    const canSave = useMemo(() => {
        if (!me) return false;
        if (!isValidName(name)) return false;
        return name.trim() !== me.name?.trim();
    }, [me, name]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchMe();
                if (!mounted) return;
                setMe(data);
                setName(data.name ?? "");
            } catch (e: any) {
                if (!mounted) return;
                setError(e?.message || "사용자 정보를 불러오지 못했습니다.");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    async function onSave() {
        if (!canSave) return;
        try {
            setSaving(true);
            setError(null);
            setOkMsg(null);

            const nextName = name.trim();
            await updateProfile({ name: nextName });
            setMe((prev) => (prev ? { ...prev, name: nextName } : prev));
            setOkMsg("회원명이 저장되었습니다.");
        } catch (e: any) {
            setError(e?.message || "저장에 실패했습니다.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <div className="text-sm text-gray-500">불러오는 중...</div>;
    }

    if (error && !me) {
        return (
            <Card variant="outlined" padding="md">
                <CardContent className="p-0">
                    <p className="text-sm text-red-600">{error}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card variant="outlined" padding="md">
                <CardContent className="p-0 space-y-3">
                    <Input
                        label="이메일"
                        value={me?.email ?? ""}
                        readOnly
                        className="bg-gray-50 text-gray-700"
                        helperText="이메일은 로그인 ID입니다."
                    />

                    <Input
                        label="회원명"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            setOkMsg(null);
                            setError(null);
                        }}
                        placeholder="2~20자"
                        error={!isValidName(name) ? "회원명은 2~20자로 입력해주세요." : undefined}
                    />

                    <div className="flex items-center justify-between gap-3">
                        <div className="text-xs text-gray-500">
                            {me?.role ? `권한: ${me.role}` : null}
                        </div>
                        <Button
                            onClick={onSave}
                            disabled={!canSave || saving}
                            variant="primary"
                            loading={saving}
                        >
                            저장
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {okMsg ? <p className="text-sm text-green-700">{okMsg}</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
    );
}
