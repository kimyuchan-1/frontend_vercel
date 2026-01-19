export type AccData = {
  year: number;
  month: number;
  accident_count: number;
  casualty_count: number;
  fatality_count: number;
  serious_injury_count: number;
  minor_injury_count: number;
  reported_injury_count: number;
};

export type ProvinceOpt = { code: string; name: string };
export type CityOpt = { code: string; name: string; fullName: string; provinceName: string };
