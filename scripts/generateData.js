const fs = require('fs');
const path = require('path');

// データ生成用の配列
const surnames = ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤',
                  '吉田', '山田', '佐々木', '松本', '井上', '木村', '林', '清水', '山崎', '森'];
const givenNames = ['太郎', '花子', '健一', '美咲', '次郎', '真理', '大輔', 'さくら', '拓也', '優子',
                    '誠', '愛', '健太', '麻衣', '隆', 'あゆみ', '翔太', '陽子', '大樹', '由美',
                    '一郎', '恵子', '浩', '里奈', '直樹', '智子', '和也', '絢香', '勇気', '舞'];
const departments = ['営業部', '経理部', 'IT部', '人事部', '総務部', '企画部', '開発部', '製造部'];
const positions = ['部長', '課長', '係長', '主任', '一般'];
const years = Array.from({ length: 20 }, (_, i) => (2005 + i).toString());

// CSVヘッダー（27列）
// 1列目: 空白（行番号列）、2列目以降: A, B, C, ... Z, AA
const headers = [''];
for (let i = 0; i < 26; i++) {
  if (i < 25) {
    headers.push(String.fromCharCode(65 + i)); // A, B, C, ... Y
  } else {
    headers.push('Z'); // 26列目
  }
}
headers.push('AA'); // 27列目

// 元のヘッダー（ID、氏名など）を1行目のデータとして追加
const dataHeaders = ['1', 'ID', '氏名', '部署', '役職', '入社年'];
// G-AA列は空白
for (let i = 6; i < 27; i++) {
  dataHeaders.push('');
}

// CSVデータ生成
const generateCSV = () => {
  const rows = [headers]; // ヘッダー行: A, B, C, ..., AA

  // 1行目: 元のヘッダー（ID、氏名など）
  rows.push(dataHeaders);

  // 2行目以降: 実際のデータ
  for (let i = 1; i <= 500; i++) {
    const rowNumber = String(i + 1); // A列：行番号（2から開始）
    const id = String(i).padStart(3, '0');
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const givenName = givenNames[Math.floor(Math.random() * givenNames.length)];
    const name = `${surname} ${givenName}`;
    const department = departments[Math.floor(Math.random() * departments.length)];
    const position = positions[Math.floor(Math.random() * positions.length)];
    const year = years[Math.floor(Math.random() * years.length)];

    // A列：行番号、B-F列：データ、G-AA列：空白
    const row = [rowNumber, id, name, department, position, year];
    for (let j = 6; j < 27; j++) {
      row.push(''); // G-AA列は空白
    }

    rows.push(row);
  }

  // CSV形式に変換（カンマ区切り）
  return rows.map(row => row.map(cell => {
    // セルにカンマや改行が含まれる場合はダブルクォートで囲む
    if (cell.includes(',') || cell.includes('\n') || cell.includes('"')) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  }).join(',')).join('\n');
};

// ファイル保存
const saveCSV = () => {
  const csvContent = generateCSV();
  const dataDir = path.join(__dirname, '../public/data');
  const filePath = path.join(dataDir, 'roster.csv');

  // ディレクトリが存在しない場合は作成
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✓ Created directory: public/data');
  }

  // CSVファイルを保存
  fs.writeFileSync(filePath, csvContent, 'utf8');
  console.log('✓ Generated CSV file: public/data/roster.csv');
  console.log(`  - Rows: 502 (header + 1 data header + 500 data rows)`);
  console.log(`  - Columns: 27 (A-AA)`);
  console.log(`  - Header row: A, B, C, ..., AA`);
  console.log(`  - Row 1: Column labels (ID, 氏名, etc.)`);
  console.log(`  - Rows 2-501: Actual data`);
  console.log(`  - Column A: Row number (read-only)`);
  console.log(`  - Empty columns: G-AA (user editable)`);
};

// 実行
try {
  saveCSV();
  process.exit(0);
} catch (error) {
  console.error('❌ Error generating CSV:', error);
  process.exit(1);
}
