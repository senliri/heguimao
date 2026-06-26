// Base64-encoded Chinese translations to bypass react-router charset stripping
// Generated from zh-translations.ts
const ZH_B64 = "ewogICAicmVwb3J0LnNoYXJlIjogIuWbvOeVmuWutueUqOaItu0iLA==";

export function getZhTranslation(key: string): string | null {
  // Decode and parse lazily
  if (!(_zhParsed)) {
    try {
      _zhParsed = JSON.parse(new TextDecoder().decode(Base64Decode(ZH_B64)));
    } catch {
      _zhParsed = {};
    }
  }
  return _zhParsed[key] || null;
}

function Base64Decode(base64: string): Uint8Array {
  const binString = atob(base64);
  const len = binString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binString.charCodeAt(i);
  return bytes;
}

let _zhParsed: Record<string, string> | null = null;
