export function getMonthName(month: number): string {
  const months = [
    '', '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];
  return months[month] || `${month}월`;
}
