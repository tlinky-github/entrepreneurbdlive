export const DEFAULT_SITE_NAME = 'Entrepreneurs BD';
export const DEFAULT_SEO_TITLE_SEPARATOR = '|';
export const DEFAULT_SEO_TITLE_TEMPLATE = '%title% %sep% %sitename%';

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const normalizeSeoTitleValue = (
  value,
  siteName = DEFAULT_SITE_NAME,
  separator = DEFAULT_SEO_TITLE_SEPARATOR
) => {
  if (!value) return '';

  const normalizedValue = String(value).trim();
  if (!normalizedValue) return '';

  const hasSeoToken = /%title%|%excerpt%|%sitename%|%sep%|%currentyear%/.test(normalizedValue);
  if (hasSeoToken) return normalizedValue;

  const literalSuffixPattern = new RegExp(`\\s*${escapeRegExp(separator)}\\s*${escapeRegExp(siteName)}\\s*$`, 'i');
  if (literalSuffixPattern.test(normalizedValue)) {
    return normalizedValue;
  }

  return `${normalizedValue} ${separator} ${siteName}`.trim();
};

export const interpolateSeoVariables = (
  template,
  titleVal,
  excerptVal,
  siteName = DEFAULT_SITE_NAME,
  separator = DEFAULT_SEO_TITLE_SEPARATOR
) => {
  if (!template) return '';

  const currentYear = new Date().getFullYear().toString();
  const normalizedTemplate = normalizeSeoTitleValue(template, siteName, separator);

  return normalizedTemplate
    .replace(/%title%/g, titleVal || '')
    .replace(/%excerpt%/g, excerptVal || '')
    .replace(/%sitename%/g, siteName)
    .replace(/%sep%/g, separator)
    .replace(/%currentyear%/g, currentYear);
};
