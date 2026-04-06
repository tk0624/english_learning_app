// Free Dictionary API — no API key required
// https://dictionaryapi.dev/
// Fallback: Wiktionary REST API (also free, no key)

export interface DictEntry {
  word: string;
  phonetic?: string;   // IPA text
  audioUrl?: string;   // 発音音声 URL
  definitions: { partOfSpeech: string; definition: string; example?: string }[];
}

/** Primary: Free Dictionary API */
async function lookupFreeDictionary(word: string): Promise<DictEntry | null> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const entry = data[0];
    const phonetic: string | undefined =
      entry.phonetic ?? entry.phonetics?.find((p: { text?: string }) => p.text)?.text;
    const audioUrl: string | undefined =
      entry.phonetics?.find((p: { audio?: string }) => p.audio)?.audio;

    const definitions = (entry.meanings ?? []).flatMap(
      (m: { partOfSpeech: string; definitions: { definition: string; example?: string }[] }) =>
        (m.definitions ?? []).slice(0, 2).map((d) => ({
          partOfSpeech: m.partOfSpeech,
          definition: d.definition,
          example: d.example,
        }))
    );

    return { word: entry.word, phonetic, audioUrl, definitions };
  } catch {
    return null;
  }
}

/** Fallback: Wiktionary REST API */
async function lookupWiktionary(word: string): Promise<DictEntry | null> {
  try {
    const res = await fetch(
      `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word.toLowerCase())}`
    );
    if (!res.ok) return null;

    const data = await res.json();
    // Wiktionary returns { en: [ { partOfSpeech, definitions: [{ definition, parsedExamples? }] } ] }
    const enEntries = data?.en;
    if (!Array.isArray(enEntries) || enEntries.length === 0) return null;

    const definitions: DictEntry['definitions'] = [];
    for (const section of enEntries) {
      const pos = section.partOfSpeech ?? '';
      for (const d of (section.definitions ?? []).slice(0, 2)) {
        // Strip HTML tags from definition
        const defText = (d.definition ?? '').replace(/<[^>]*>/g, '').trim();
        if (!defText) continue;
        // parsedExamples is an array of { example: string }
        const example = d.parsedExamples?.[0]?.example?.replace(/<[^>]*>/g, '').trim();
        definitions.push({ partOfSpeech: pos, definition: defText, example });
      }
      if (definitions.length >= 3) break;
    }

    if (definitions.length === 0) return null;
    return { word, definitions };
  } catch {
    return null;
  }
}

/** Look up a word: tries Free Dictionary first, then Wiktionary */
export async function lookupWord(word: string): Promise<DictEntry | null> {
  const result = await lookupFreeDictionary(word);
  if (result && result.definitions.length > 0) return result;
  return lookupWiktionary(word);
}

/** Translate a single word/phrase to Japanese via MyMemory API */
export async function translateToJa(word: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|ja`
    );
    const data = await res.json();
    const text = data?.responseData?.translatedText;
    if (!text || text === word) return null;
    return text;
  } catch {
    return null;
  }
}
