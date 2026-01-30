// テスト用の名簿データ（500行）
const generateSampleData = () => {
  const surnames = ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤', 
                    '吉田', '山田', '佐々木', '松本', '井上', '木村', '林', '清水', '山崎', '森'];
  const givenNames = ['太郎', '花子', '健一', '美咲', '次郎', '真理', '大輔', 'さくら', '拓也', '優子',
                      '誠', '愛', '健太', '麻衣', '隆', 'あゆみ', '翔太', '陽子', '大樹', '由美',
                      '一郎', '恵子', '浩', '里奈', '直樹', '智子', '和也', '絢香', '勇気', '舞'];
  const departments = ['営業部', '経理部', 'IT部', '人事部', '総務部', '企画部', '開発部', '製造部'];
  const positions = ['部長', '課長', '係長', '主任', '一般'];
  const years = Array.from({ length: 20 }, (_, i) => (2005 + i).toString());

  const data = [['ID', '氏名', '部署', '役職', '入社年']];
  
  for (let i = 1; i <= 500; i++) {
    const id = String(i).padStart(3, '0');
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const givenName = givenNames[Math.floor(Math.random() * givenNames.length)];
    const name = `${surname} ${givenName}`;
    const department = departments[Math.floor(Math.random() * departments.length)];
    const position = positions[Math.floor(Math.random() * positions.length)];
    const year = years[Math.floor(Math.random() * years.length)];
    
    data.push([id, name, department, position, year]);
  }
  
  return data;
};

export const sampleRosterData = generateSampleData();

// 正解データ（「佐藤」を含む行のインデックス）
// 実際のインデックスはランダム生成により異なるため、動的に計算
export const correctAnswerIndices = sampleRosterData
  .slice(1)
  .map((row, idx) => row[1].includes('佐藤') ? idx : -1)
  .filter(idx => idx !== -1);

// 課題文
export const taskDescription = {
  title: '課題: データ抽出',
  instruction: 'この名簿から「佐藤」を含む行をすべて抽出してください。',
  hints: [
    'フィルター機能を使用する方法',
    'FILTER関数やQUERY関数を使用する方法',
    '手動で探してコピーする方法',
  ],
  timeLimit: 600, // 10分（秒単位）
};
