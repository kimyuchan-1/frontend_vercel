"use client";

import { useMemo, useState } from "react";
import { changePassword } from "@/lib/api/account";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

function validPw(pw: string) {
  return pw.length >= 8;
}

export default function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSave = useMemo(() => {
    if (!currentPassword) return false;
    if (!validPw(newPassword)) return false;
    if (newPassword !== confirm) return false;
    if (currentPassword === newPassword) return false;
    return true;
  }, [currentPassword, newPassword, confirm]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    try {
      setSaving(true);
      setOkMsg(null);
      setError(null);

      await changePassword({ currentPassword, newPassword });

      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setOkMsg("비밀번호가 변경되었습니다.");
    } catch (e: any) {
      setError(e?.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  const pwMismatch = confirm.length > 0 && newPassword !== confirm;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Card variant="outlined" padding="md">
        <CardContent className="p-0 space-y-3">
          <Input
            label="현재 비밀번호"
            type="password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setOkMsg(null);
              setError(null);
            }}
          />

          <Input
            label="새 비밀번호"
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setOkMsg(null);
              setError(null);
            }}
            placeholder="최소 8자"
            error={!validPw(newPassword) && newPassword.length > 0 ? "비밀번호는 최소 8자 이상이어야 합니다." : undefined}
          />

          <Input
            label="새 비밀번호 확인"
            type="password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setOkMsg(null);
              setError(null);
            }}
            error={pwMismatch ? "새 비밀번호가 일치하지 않습니다." : undefined}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!canSave || saving}
              variant="primary"
              loading={saving}
            >
              변경
            </Button>
          </div>
        </CardContent>
      </Card>

      {okMsg ? <p className="text-sm text-green-700">{okMsg}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <p className="text-xs text-gray-500">
        저장 후 보안 정책에 따라 재로그인이 필요할 수 있습니다.
      </p>
    </form>
  );
}
