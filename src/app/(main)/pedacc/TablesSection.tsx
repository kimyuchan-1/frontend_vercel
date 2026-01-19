'use client'

import { getMonthName } from "@/features/pedacc/utils";
import { AccData } from "@/features/pedacc/types";

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left font-semibold whitespace-nowrap px-2 py-1.5 sm:px-3 sm:py-2">
      {children}
    </th>
  );
}

function Td({ children, colSpan }: { children: React.ReactNode; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className="whitespace-nowrap px-2 py-1.5 sm:px-3 sm:py-2">
      {children}
    </td>
  );
}
export default function TablesSection(props: {
    yearlyAggregated: AccData[];
    selectedYear: number | null;
    availableYears: number[];
    selectedYearMonthly: AccData[];
    setSelectedYear: (year: number | null) => void;
}) {

    const { yearlyAggregated, selectedYear, availableYears, selectedYearMonthly, setSelectedYear} = props;

    return (
        <div className="space-y-6">
            <div className="border-t pt-6">
                <h2 className="text-lg font-semibold mb-4">상세 통계 테이블</h2>
            </div>

            <div className="rounded-xl border overflow-hidden">
                <div className="px-4 py-3 font-semibold bg-gray-50">연도별 합계</div>
                <div className="overflow-auto">
                    <table className="min-w-225 w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <Th>연도</Th>
                                <Th>사고</Th>
                                <Th>사상자</Th>
                                <Th>사망</Th>
                                <Th>중상</Th>
                                <Th>경상</Th>
                                <Th>부상신고</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {yearlyAggregated.map((r) => (
                                <tr
                                    key={r.year}
                                    className={`border-t cursor-pointer hover:bg-gray-50 ${selectedYear === r.year ? 'bg-blue-50' : ''
                                        }`}
                                    onClick={() => setSelectedYear(r.year)}
                                >
                                    <Td>{r.year}</Td>
                                    <Td>{r.accident_count}</Td>
                                    <Td>{r.casualty_count}</Td>
                                    <Td>{r.fatality_count}</Td>
                                    <Td>{r.serious_injury_count}</Td>
                                    <Td>{r.minor_injury_count}</Td>
                                    <Td>{r.reported_injury_count}</Td>
                                </tr>
                            ))}
                            {!yearlyAggregated.length && (
                                <tr className="border-t">
                                    <Td colSpan={7}>데이터 없음</Td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedYear && (
                <div className="rounded-xl border overflow-hidden">
                    <div className="px-4 py-3 font-semibold bg-gray-50 flex items-center justify-between">
                        <span>{selectedYear}년 월별 상세</span>
                        <select
                            className="border rounded px-2 py-1 text-sm"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        >
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}년</option>
                            ))}
                        </select>
                    </div>
                    <div className="overflow-auto">
                        <table className="min-w-225 w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <Th>월</Th>
                                    <Th>사고</Th>
                                    <Th>사상자</Th>
                                    <Th>사망</Th>
                                    <Th>중상</Th>
                                    <Th>경상</Th>
                                    <Th>부상신고</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedYearMonthly.map((r) => (
                                    <tr key={r.month} className="border-t">
                                        <Td>{getMonthName(r.month)}</Td>
                                        <Td>{r.accident_count}</Td>
                                        <Td>{r.casualty_count}</Td>
                                        <Td>{r.fatality_count}</Td>
                                        <Td>{r.serious_injury_count}</Td>
                                        <Td>{r.minor_injury_count}</Td>
                                        <Td>{r.reported_injury_count}</Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

