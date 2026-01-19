"use client";

import { useState } from "react";

export default function IndexExplain() {
    const [showDetail, setShowDetail] = useState(false);

    return (
        <div className="mx-auto w-full max-w-none rounded-2xl overflow-hidden">
            <div className="px-4 py-5 max-h-[75vh] overflow-auto">
                <h1 className="text-xl font-bold text-gray-900">지수 정보(쉬운 설명)</h1>
                <p className="mt-2 text-sm text-gray-600">
                    점수는 0~100 사이이며, 숫자가 클수록 해당 의미가 더 강합니다.
                </p>

                {/* 핵심 요약 */}
                <section className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border bg-white p-4 shadow-sm">
                        <div className="text-sm font-semibold text-gray-900">위험지수</div>
                        <p className="mt-2 text-sm text-gray-700 leading-6">
                            이 횡단보도 <b>주변에서 발생한 사고</b>를 바탕으로 계산합니다.
                            <br />
                            <b>가까운 사고</b>일수록 더 크게, <b>사망·중상</b>처럼 피해가 큰 사고일수록 더 크게 반영됩니다.
                        </p>
                    </div>

                    <div className="rounded-xl border bg-white p-4 shadow-sm">
                        <div className="text-sm font-semibold text-gray-900">안전지수</div>
                        <p className="mt-2 text-sm text-gray-700 leading-6">
                            횡단보도에 설치된 <b>안전시설(신호등/음향/고원식/조명 등)</b>을 바탕으로 계산합니다.
                            <br />
                            설치된 항목이 많을수록 점수가 올라가며, 보기 쉽도록 0~100으로 맞춥니다.
                        </p>
                    </div>
                </section>

                {/* 위험지수: 거리 가중치 */}
                <section className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
                    <h2 className="text-base font-semibold text-gray-900">위험지수는 “거리”를 이렇게 반영해요</h2>
                    <p className="mt-2 text-sm text-gray-700">
                        같은 사고라도 횡단보도와 <b>가까울수록 영향이 큽니다</b>. 500m 밖의 사고는 반영하지 않습니다.
                    </p>

                    <div className="mt-3 overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left">
                                <tr>
                                    <th className="px-4 py-2">거리</th>
                                    <th className="px-4 py-2">반영 정도</th>
                                    <th className="px-4 py-2">설명</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                <tr>
                                    <td className="px-4 py-2">50m 이내</td>
                                    <td className="px-4 py-2">매우 큼</td>
                                    <td className="px-4 py-2 text-gray-600">가장 강하게 반영</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2">50~100m</td>
                                    <td className="px-4 py-2">큼</td>
                                    <td className="px-4 py-2 text-gray-600">조금 덜 반영</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2">100~300m</td>
                                    <td className="px-4 py-2">중간</td>
                                    <td className="px-4 py-2 text-gray-600">한 단계 더 줄여 반영</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2">300~500m</td>
                                    <td className="px-4 py-2">작음</td>
                                    <td className="px-4 py-2 text-gray-600">조금만 반영</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2">500m 초과</td>
                                    <td className="px-4 py-2">반영 안 함</td>
                                    <td className="px-4 py-2 text-gray-600">계산에서 제외</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="mt-3 text-xs text-gray-500">
                        거리 계산은 위도/경도를 이용해 “지도상의 실제 거리(미터)”로 구합니다.
                    </p>
                </section>

                {/* 위험지수: 심각도 */}
                <section className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
                    <h2 className="text-base font-semibold text-gray-900">사고 “심각도”는 이렇게 점수를 매겨요</h2>
                    <p className="mt-2 text-sm text-gray-700">
                        피해가 큰 사고가 더 중요하므로, <b>사망 &gt; 중상 &gt; 경상</b> 순으로 더 큰 점수를 줍니다.
                        사고 건수와 신고 부상도 함께 반영합니다.
                    </p>

                    <div className="mt-3 overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left">
                                <tr>
                                    <th className="px-4 py-2">항목</th>
                                    <th className="px-4 py-2">반영 정도</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                <tr>
                                    <td className="px-4 py-2">사망자</td>
                                    <td className="px-4 py-2">가장 크게</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2">중상자</td>
                                    <td className="px-4 py-2">크게</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2">경상자</td>
                                    <td className="px-4 py-2">중간</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2">사고 건수</td>
                                    <td className="px-4 py-2">기본 반영</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2">신고 부상자</td>
                                    <td className="px-4 py-2">보조 반영</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                        <b>왜 이렇게 하나요?</b><br /> 같은 “사고 1건”이라도 피해 규모가 다르기 때문에,
                        심각한 사고가 더 크게 반영되도록 설계했습니다.
                    </div>
                </section>

                {/* 안전지수 */}
                <section className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
                    <h2 className="text-base font-semibold text-gray-900">안전지수는 “시설이 있으면 점수가 올라가요”</h2>
                    <p className="mt-2 text-sm text-gray-700">
                        신호등, 음향신호기, 고원식, 점자블록, 집중조명 등 <b>설치된 안전시설</b>을
                        항목별로 점수화한 뒤, 0~100으로 맞춥니다.
                    </p>

                    <div className="mt-3 overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left">
                                <tr>
                                    <th className="px-4 py-2">시설 예시</th>
                                    <th className="px-4 py-2">의미</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                <tr>
                                    <td className="px-4 py-2">신호등</td>
                                    <td className="px-4 py-2 text-gray-600">기본 안전 확보</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2">음향신호기</td>
                                    <td className="px-4 py-2 text-gray-600">시각장애인 접근성</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2">고원식 횡단보도</td>
                                    <td className="px-4 py-2 text-gray-600">차량 속도 저감</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2">집중조명시설</td>
                                    <td className="px-4 py-2 text-gray-600">야간 시인성 향상</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 자세히 보기(수식) */}
                <section className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-base font-semibold text-gray-900">자세히 보기(수식/기준값)</h2>
                        <button
                            type="button"
                            onClick={() => setShowDetail((v) => !v)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:cursor-pointer"
                        >
                            {showDetail ? "접기" : "펼치기"}
                        </button>
                    </div>

                    {showDetail && (
                        <div className="mt-3 rounded-lg bg-gray-50 p-4 text-sm leading-7 text-gray-800">
                            <div className="mt-3 text-xs text-gray-500">
                                <p className="mt-2 text-sm text-gray-700">
                                    횡단보도 좌표 (φ₁, λ₁)와 사고 지점 좌표 (φ₂, λ₂)의 대권거리 d(m)를 사용합니다.
                                </p>

                                <div className="mt-3 rounded-lg bg-gray-50 p-4 text-sm leading-7">
                                    <div>R=6,371,000(m), rad(x)=x·π/180</div>
                                    <div>Δφ=rad(φ₂−φ₁), Δλ=rad(λ₂−λ₁)</div>
                                    <div>a=sin²(Δφ/2)+cos(rad(φ₁))·cos(rad(φ₂))·sin²(Δλ/2)</div>
                                    <div>d=2R·asin(√a)</div>
                                </div>

                                <p className="mt-2 text-sm text-gray-700">
                                    사고 지점까지의 거리 d(m)에 따라 구간 가중치 w(d)를 적용합니다.
                                    (기본값: 50m=1.0, 100m=0.7, 300m=0.4, 500m=0.1, 그 이상=0.0)
                                </p>
                                <div className="mt-3 rounded-lg bg-gray-50 p-4 text-sm leading-7">
                                    <div>w(d)=w₅₀ (d≤50)</div>
                                    <div>w(d)=w₁₀₀ (50&lt;d≤100)</div>
                                    <div>w(d)=w₃₀₀ (100&lt;d≤300)</div>
                                    <div>w(d)=w₅₀₀ (300&lt;d≤500)</div>
                                    <div>w(d)=w∞ (d&gt;500)</div>
                                </div>
                            </div>

                            <p className="mt-2 text-sm text-gray-700">
                                사고 데이터 1건(또는 1행)의 피해 규모를 가중합으로 원점수 S로 계산합니다.
                            </p>
                            <div className="mt-3 rounded-lg bg-gray-50 p-4 text-sm leading-7">
                                <div>S = 10·F(사망자) + 5·Sᵣ(중상자) + 2·M(경상자) + 1·A(사고 건수) + 0.5·R(신고 부상자)</div>
                            </div>

                            <p className="mt-2 text-sm text-gray-700">
                                횡단보도 주변 사고들의 심각도 원점수 Sᵢ에 거리 가중치 w(dᵢ)를 적용해
                                가중평균 S̄을 만든 뒤, 지수 압축으로 0~100 스케일로 변환합니다.
                            </p>
                            <div className="mt-3 rounded-lg bg-gray-50 p-4 text-sm leading-7">
                                <div>가중합: N = Σᵢ (Sᵢ · w(dᵢ))</div>
                                <div>가중치합: D = Σᵢ w(dᵢ)</div>
                                <div>가중평균: S̄ = N/D (D&gt;0이면), 아니면 S̄=0</div>
                                <div>K=80</div>
                                <div>Risk = 100·(1 − exp(−S̄/K))</div>
                                <div>Risk* = min(100, max(0, Risk))</div>
                            </div>

                            <p className="mt-2 text-sm text-gray-700">
                                횡단보도에 설치된 안전 기능(신호등, 음향신호기, 고원식 등)에 대해 가중치를 더해
                                원점수(Safety_raw)를 만들고, 가능한 최대치(Safety_max)로 나눠 0~100으로 정규화합니다.
                            </p>

                            <div className="mt-3 rounded-lg bg-gray-50 p-4 text-sm leading-7">
                                <div>Safety_raw = Σⱼ (βⱼ · xⱼ)  (xⱼ∈{"{0,1}"})</div>
                                <div>Safety_max = Σⱼ βⱼ</div>
                                <div>Safety = 100·(Safety_raw / Safety_max)</div>
                                <div>Safety* = min(100, max(0, Safety))</div>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
