import SignInForm from '@/components/auth/SignInForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인 | 보행자 교통안전 분석',
  description: '보행자 교통안전 분석 대시보드에 로그인하세요',
};

export default function SignInPage() {
  return (
    <div className="min-h-screen m-0 p-0 flex justify-center items-center font-sans bg-gray-50">
      <div className='w-full max-w-100 bg-white p-10 rounded-xl text-center shadow-[0_15px_35px_rgba(0,0,0,0.1)]'>
        <h2 className='text-[28px] font-light text-[#333] mb-7.5'>로그인</h2>
        
        <SignInForm />
      </div>
    </div>
  );
}
