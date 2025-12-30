/**
 * Color Utilities
 */

/**
 * HEXカラーから輝度を計算し、最適なテキスト色（白か黒）を返す
 * @param hex HEXカラーコード (例: #ffffff, #666)
 * @returns 'white' または 'black'
 */
export function getContrastColor(hex: string | undefined): 'white' | 'black' {
  if (!hex) return 'white';

  // HEXをRGBに変換
  let r, g, b;
  const cleanHex = hex.replace('#', '');

  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }

  // 輝度の計算 (ITU-R BT.709)
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

  return luminance > 0.5 ? 'black' : 'white';
}
