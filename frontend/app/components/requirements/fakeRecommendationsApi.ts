export interface RecommendedCourse {
  code: string;
  name: string;
  credits: number;
  teacher: string;
  time: string;
  seats: number;
  remaining: number;
}

const DB: Record<string, RecommendedCourse[]> = {
  '通識-自然': [
    { code: 'GE1001', name: '生活中的科學', credits: 2, teacher: '陳明義', time: '週二 3-4', seats: 60, remaining: 12 },
    { code: 'GE1023', name: '環境科學概論', credits: 2, teacher: '林佳慧', time: '週四 5-6', seats: 50, remaining: 5 },
    { code: 'GE1045', name: '宇宙與人類', credits: 2, teacher: '黃宇翔', time: '週一 7-8', seats: 80, remaining: 34 },
    { code: 'GE1067', name: '氣候變遷與能源', credits: 2, teacher: '蔡宜君', time: '週三 3-4', seats: 60, remaining: 2 },
    { code: 'GE1089', name: '人工智慧與社會', credits: 2, teacher: '謝承翰', time: '週五 1-2', seats: 100, remaining: 41 },
  ],
  '通識-社會': [
    { code: 'GE2010', name: '經濟學與生活', credits: 2, teacher: '王建中', time: '週三 1-2', seats: 60, remaining: 8 },
    { code: 'GE2031', name: '法律與人權', credits: 2, teacher: '李玉萍', time: '週五 3-4', seats: 50, remaining: 19 },
    { code: 'GE2052', name: '當代台灣社會', credits: 2, teacher: '張家豪', time: '週二 5-6', seats: 70, remaining: 3 },
    { code: 'GE2073', name: '全球化與國際關係', credits: 2, teacher: '吳佩珊', time: '週四 1-2', seats: 60, remaining: 22 },
  ],
  '通識-人文': [
    { code: 'GE3001', name: '文學與人生', credits: 2, teacher: '許雅文', time: '週一 3-4', seats: 50, remaining: 14 },
    { code: 'GE3022', name: '藝術鑑賞', credits: 2, teacher: '陳彥廷', time: '週三 5-6', seats: 40, remaining: 7 },
    { code: 'GE3043', name: '哲學與批判思考', credits: 2, teacher: '劉明宏', time: '週二 1-2', seats: 60, remaining: 28 },
    { code: 'GE3064', name: '電影與文化', credits: 2, teacher: '林思妤', time: '週四 3-4', seats: 80, remaining: 33 },
  ],
  '通識-永續': [
    { code: 'GE4001', name: '永續發展概論', credits: 2, teacher: '柯志偉', time: '週一 5-6', seats: 60, remaining: 16 },
    { code: 'GE4022', name: '循環經濟與綠色設計', credits: 2, teacher: '鄭宜珊', time: '週三 7-8', seats: 50, remaining: 9 },
    { code: 'GE4043', name: '碳中和與氣候政策', credits: 2, teacher: '黃俊傑', time: '週五 5-6', seats: 40, remaining: 4 },
  ],
  '通識-自由': [
    { code: 'GE5001', name: '跨文化溝通', credits: 2, teacher: '蘇雅婷', time: '週二 7-8', seats: 60, remaining: 21 },
    { code: 'GE5022', name: '設計思考', credits: 2, teacher: '周建輝', time: '週四 5-6', seats: 50, remaining: 11 },
    { code: 'GE5043', name: '創業與創新', credits: 2, teacher: '徐偉民', time: '週一 1-2', seats: 80, remaining: 37 },
  ],
  '必修': [
    { code: 'CS3101', name: '演算法', credits: 3, teacher: '林博文', time: '週二 1-3', seats: 80, remaining: 6 },
    { code: 'CS3202', name: '作業系統', credits: 3, teacher: '張俊賢', time: '週四 1-3', seats: 70, remaining: 13 },
    { code: 'CS3303', name: '計算機網路', credits: 3, teacher: '陳宗翰', time: '週三 3-5', seats: 60, remaining: 2 },
  ],
  '選修': [
    { code: 'CS4101', name: '機器學習', credits: 3, teacher: '吳志遠', time: '週二 3-5', seats: 60, remaining: 17 },
    { code: 'CS4202', name: '深度學習', credits: 3, teacher: '楊承翰', time: '週四 3-5', seats: 50, remaining: 8 },
    { code: 'CS4303', name: '資料庫系統', credits: 3, teacher: '劉雅婷', time: '週三 1-3', seats: 70, remaining: 24 },
    { code: 'CS4404', name: '資訊安全', credits: 3, teacher: '蔡宗霖', time: '週五 1-3', seats: 60, remaining: 5 },
    { code: 'CS4505', name: '雲端計算', credits: 3, teacher: '許宏達', time: '週一 3-5', seats: 50, remaining: 19 },
  ],
  '國文': [
    { code: 'CH1001', name: '大學國文（一）', credits: 2, teacher: '洪雅惠', time: '週三 1-2', seats: 50, remaining: 3 },
    { code: 'CH1002', name: '大學國文（二）', credits: 2, teacher: '洪雅惠', time: '週三 3-4', seats: 50, remaining: 7 },
    { code: 'CH1011', name: '應用寫作', credits: 2, teacher: '林欣怡', time: '週二 5-6', seats: 40, remaining: 12 },
  ],
  '外語': [
    { code: 'FL1001', name: '大學英文（一）', credits: 2, teacher: 'John Smith', time: '週一 1-2', seats: 40, remaining: 2 },
    { code: 'FL1002', name: '大學英文（二）', credits: 2, teacher: 'Mary Chen', time: '週三 5-6', seats: 40, remaining: 9 },
    { code: 'FL2001', name: '進階英文寫作', credits: 2, teacher: 'David Lee', time: '週五 1-2', seats: 30, remaining: 14 },
    { code: 'FL3001', name: '日語（一）', credits: 2, teacher: '田中美穗', time: '週二 3-4', seats: 35, remaining: 6 },
  ],
  '核心課程': [
    { code: 'CO1001', name: '大學入門', credits: 2, teacher: '各系導師', time: '週五 5-6', seats: 999, remaining: 50 },
    { code: 'CO1002', name: '人生哲學', credits: 4, teacher: '哲學系教師', time: '週一 3-6', seats: 200, remaining: 23 },
  ],
};

const FALLBACK: RecommendedCourse[] = [
  { code: 'GE9001', name: '跨域學習', credits: 2, teacher: '各系教師', time: '週三 5-6', seats: 80, remaining: 30 },
];

export async function fetchRecommendations(category: string, neededCredits: number): Promise<RecommendedCourse[]> {
  await new Promise(r => setTimeout(r, 700));
  const pool = DB[category] ?? FALLBACK;
  return pool.filter(c => c.credits <= neededCredits + 1);
}
