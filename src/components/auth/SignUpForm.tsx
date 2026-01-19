'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUpForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  }

  const handleSignup = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        }),
        credentials: "include",
      });

      const text = await response.text();
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch { }

      if (response.ok) {
        alert("회원가입이 완료되었습니다!");
        router.push("/signin");
      } else {
        alert(data?.message || "회원가입에 실패했습니다.");
      }
    } catch (error) {
      console.error("회원가입 중 오류 발생:", error);
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className='mb-5 text-left'>
        <label className='block mb-2 text-[#555] font-medium text-sm'>사용자명</label>
        <input
          className='w-full box-border px-4 py-3 border-2 border-[#e1e5e9] rounded-lg text-base transition-all duration-300 ease-in-out focus:outline-none focus:border-[#667eea] focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]'
          type="text"
          id="name"
          placeholder="사용자명을 입력하세요"
          value={formData.name}
          onChange={handleChange}
        />
      </div>

      <div className='mb-5 text-left'>
        <label className='block mb-2 text-[#555] font-medium text-sm'>이메일</label>
        <input
          className='w-full box-border px-4 py-3 border-2 border-[#e1e5e9] rounded-lg text-base transition-all duration-300 ease-in-out focus:outline-none focus:border-[#667eea] focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]'
          type="email"
          id="email"
          placeholder="이메일을 입력하세요"
          value={formData.email}
          onChange={handleChange}
        />
      </div>

      <div className='mb-5 text-left'>
        <label className='block mb-2 text-[#555] font-medium text-sm'>비밀번호</label>
        <input
          className="w-full box-border px-4 py-3 border-2 border-[#e1e5e9] rounded-lg text-base transition-all duration-300 ease-in-out focus:outline-none focus:border-[#667eea] focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]"
          type="password"
          id="password"
          placeholder="비밀번호를 입력하세요"
          value={formData.password}
          onChange={handleChange}
        />
      </div>

      <div className='mb-5 text-left'>
        <label className='block mb-2 text-[#555] font-medium text-sm'>비밀번호 확인</label>
        <input
          className="w-full box-border px-4 py-3 border-2 border-[#e1e5e9] rounded-lg text-base transition-all duration-300 ease-in-out focus:outline-none focus:border-[#667eea] focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]"
          type="password"
          id="confirmPassword"
          placeholder="비밀번호를 다시 입력하세요"
          value={formData.confirmPassword}
          onChange={handleChange}
        />
      </div>

      <button
        className="w-full py-3.5 px-0 mt-2.5 rounded-lg border-0 text-base font-semibold text-white cursor-pointer transition-all duration-300 ease-in-out bg-[linear-gradient(135deg,#2563eb_0%,#1d4ed8_100%)] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(37,99,235,0.3)] active:translate-y-0"
        type="button"
        onClick={handleSignup}
        disabled={isLoading}
      >
        {isLoading ? "처리 중..." : "회원가입"}
      </button>

      <div className="mt-4 text-sm text-[#666]">
        이미 계정이 있으신가요?{" "}
        <button
          className="text-[#667eea] hover:underline"
          onClick={() => router.push("/signin")}
        >
          로그인
        </button>
      </div>
    </>
  );
}
