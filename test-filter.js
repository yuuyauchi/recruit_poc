// FILTER関数のテスト
const { evaluateFormula } = require('./lib/formulaEngine.ts');

// テストデータ
const testData = [
  ['ID', '氏名', '部署', '役職', '入社年'],
  ['001', '佐藤 太郎', '営業部', '課長', '2015'],
  ['002', '鈴木 花子', 'IT部', '主任', '2018'],
  ['003', '佐藤 次郎', '経理部', '一般', '2020'],
  ['004', '田中 健一', '営業部', '部長', '2010'],
  ['005', '佐藤 美咲', 'IT部', '課長', '2016'],
];

console.log('Test data:');
console.log(testData);
console.log('\nTesting formula: =FILTER(A:E, "佐藤", B:B)');

try {
  const result = evaluateFormula('=FILTER(A:E, "佐藤", B:B)', testData, 0, 0);
  console.log('\n✅ Result:');
  console.log(result);
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error('Stack:', error.stack);
}
