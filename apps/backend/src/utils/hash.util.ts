import { createHash } from 'crypto';

export function generateParamsHash(
  country: string,
  category: string,
  query: string,
): string {
  // 标准化参数：转小写并去除首尾空格
  const normalized = JSON.stringify({
    country: country.toLowerCase().trim(),
    category: category.toLowerCase().trim(),
    query: query.toLowerCase().trim(),
  });

  // 生成 SHA256 哈希
  return createHash('sha256').update(normalized).digest('hex');
}
