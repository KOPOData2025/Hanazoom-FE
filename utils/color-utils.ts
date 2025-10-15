import {
  getStockBrandColor,
  getSectorBrandColor,
  defaultStockColor,
} from "@/data/stock-brand-colors";

export function getBrandColorByStock(stockCode: string, stockName?: string) {
  const brandColor = getStockBrandColor(stockCode);


  return brandColor;
}

export function getBrandColorBySector(sector: string) {
  const brandColor = getSectorBrandColor(sector);


  return brandColor;
}

export function createBrandStyle(brandColor: any) {
  return {
    background: brandColor.gradient,
    color: "#FFFFFF",
    borderColor: brandColor.primary,
  };
}

export function createBrandClasses(
  brandColor: any,
  additionalClasses: string = ""
) {
  return `text-white shadow-lg ${additionalClasses}`;
}

export function applyBrandStyle(brandColor: any, element: HTMLElement) {
  element.style.background = brandColor.gradient;
  element.style.color = "#FFFFFF";
}

export function createColorTheme(brandColor: any) {
  return {
    primary: brandColor.primary,
    secondary: brandColor.secondary,
    gradient: brandColor.gradient,
    text: "#FFFFFF",
    textSecondary: "#E5E7EB",
    border: brandColor.primary,
    hover: `${brandColor.primary}CC`, 
    active: `${brandColor.secondary}DD`, 
  };
}

export function getContrastRatio(color1: string, color2: string): number {

  const hex1 = color1.replace("#", "");
  const hex2 = color2.replace("#", "");

  const r1 = parseInt(hex1.substr(0, 2), 16);
  const g1 = parseInt(hex1.substr(2, 2), 16);
  const b1 = parseInt(hex1.substr(4, 2), 16);

  const r2 = parseInt(hex2.substr(0, 2), 16);
  const g2 = parseInt(hex2.substr(2, 2), 16);
  const b2 = parseInt(hex2.substr(4, 2), 16);

  const luminance1 = (0.299 * r1 + 0.587 * g1 + 0.114 * b1) / 255;
  const luminance2 = (0.299 * r2 + 0.587 * g2 + 0.114 * b2) / 255;

  const brightest = Math.max(luminance1, luminance2);
  const darkest = Math.min(luminance1, luminance2);

  return (brightest + 0.05) / (darkest + 0.05);
}

export function getAccessibleTextColor(backgroundColor: string): string {
  const contrastWithWhite = getContrastRatio(backgroundColor, "#FFFFFF");
  const contrastWithBlack = getContrastRatio(backgroundColor, "#000000");

  return contrastWithWhite > contrastWithBlack ? "#FFFFFF" : "#000000";
}
