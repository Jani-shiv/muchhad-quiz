import xss from 'xss';

const PROFANITY_LIST = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'cock', 'pussy',
  'cunt', 'whore', 'slut', 'faggot', 'nigger', 'nigga', 'retard', 'chutiya',
  'madarchod', 'behenchod', 'bhosdike', 'harami', 'kamina', 'randi'
];

export function sanitizeText(value, maxLen = 500) {
  if (typeof value !== 'string') return '';
  const cleaned = xss(value, { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script'] })
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.slice(0, maxLen);
}

export function filterNickname(raw) {
  let name = sanitizeText(raw, 24);
  if (!name) return 'Player';
  const lower = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const word of PROFANITY_LIST) {
    if (lower.includes(word)) {
      const regex = new RegExp(word, 'gi');
      name = name.replace(regex, '***');
    }
  }
  return name.slice(0, 24) || 'Player';
}

export function sanitizeUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed) || /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i.test(trimmed)) {
    return trimmed.slice(0, 200000);
  }
  return '';
}
