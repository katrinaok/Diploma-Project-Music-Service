/**
 * Алгоритм багатофакторного нечіткого пошуку та ранжування релевантності за токенами
 * (Multi-Token Weighted Fuzzy Search & Relevance Scoring)
 */

export const SEARCH_WEIGHTS = {
  TAG: 40,      // Кастомні теги користувача
  TITLE: 35,    // Назва композиції
  ARTIST: 25,   // Виконавець
  ALBUM: 15     // Назва альбому
};

export function levenshteinDistance(s1: string, s2: string): number {
  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const a = s1.length < s2.length ? s1 : s2;
  const b = s1.length < s2.length ? s2 : s1;

  let previousRow = new Array(a.length + 1);
  let currentRow = new Array(a.length + 1);

  for (let i = 0; i <= a.length; i++) {
    previousRow[i] = i;
  }

  for (let j = 1; j <= b.length; j++) {
    currentRow[0] = j;
    const bChar = b[j - 1];

    for (let i = 1; i <= a.length; i++) {
      const aChar = a[i - 1];
      const cost = aChar === bChar ? 0 : 1;

      currentRow[i] = Math.min(
        currentRow[i - 1] + 1,
        previousRow[i] + 1,
        previousRow[i - 1] + cost
      );
    }

    const temp = previousRow;
    previousRow = currentRow;
    currentRow = temp;
  }

  return previousRow[a.length];
}

export function stringSimilarity(s1: string, s2: string): number {
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s1, s2);
  return Math.max(0, 1 - dist / maxLen);
}

export function tokenizeQuery(query: string): string[] {
  if (!query) return [];
  return query
    .toLowerCase()
    .trim()
    .split(/[\s,+/|;]+/)
    .map(token => token.trim())
    .filter(token => token.length > 0);
}

function scoreTokenAgainstField(token: string, fieldValue: string): { similarity: number; isFuzzy: boolean } {
  if (!fieldValue || !token) return { similarity: 0, isFuzzy: false };

  const normField = fieldValue.toLowerCase().trim();
  const normToken = token.toLowerCase().trim();

  if (normField === normToken) {
    return { similarity: 1.0, isFuzzy: false };
  }
  if (normField.includes(normToken)) {
    return { similarity: 0.95, isFuzzy: false };
  }

  const fieldWords = normField.split(/[\s\-_(),.]+/).filter(Boolean);
  for (const word of fieldWords) {
    if (word === normToken) {
      return { similarity: 1.0, isFuzzy: false };
    }
    if (word.startsWith(normToken) && normToken.length >= 2) {
      return { similarity: 0.85, isFuzzy: false };
    }
  }

  if (normToken.length >= 3) {
    let bestWordSim = 0;
    for (const word of fieldWords) {
      const sim = stringSimilarity(normToken, word);
      const maxAllowedDist = normToken.length <= 5 ? 1 : 2;
      const dist = levenshteinDistance(normToken, word);

      if (dist <= maxAllowedDist && sim > bestWordSim && sim >= 0.70) {
        bestWordSim = sim;
      }
    }

    if (bestWordSim > 0) {
      return { similarity: bestWordSim * 0.8, isFuzzy: true };
    }
  }

  return { similarity: 0, isFuzzy: false };
}

export function multiTokenFuzzyRank<T extends { title: string; artistName: string; albumName?: string; tags?: string[] }>(
  items: T[],
  query: string,
  minScoreThreshold = 15
): { item: T; score: number; matchedTokens: string[] }[] {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) {
    return items.map(item => ({ item, score: 100, matchedTokens: [] }));
  }

  const results: { item: T; score: number; matchedTokens: string[] }[] = [];

  for (const item of items) {
    let totalScore = 0;
    const matchedTokensSet = new Set<string>();

    for (const token of tokens) {
      const isTagExplicit = token.startsWith('#');
      const cleanToken = isTagExplicit ? token.slice(1) : token;

      let bestTokenScore = 0;
      let matchedInField = false;

      // 1. Теги
      if (item.tags && item.tags.length > 0) {
        for (const tag of item.tags) {
          const { similarity } = scoreTokenAgainstField(cleanToken, tag);
          if (similarity > 0) {
            const tagScore = similarity * SEARCH_WEIGHTS.TAG * (isTagExplicit ? 1.5 : 1.0);
            if (tagScore > bestTokenScore) {
              bestTokenScore = tagScore;
              matchedInField = true;
            }
          }
        }
      }

      if (!isTagExplicit) {
        // 2. Назва
        const titleMatch = scoreTokenAgainstField(cleanToken, item.title);
        if (titleMatch.similarity > 0) {
          const tScore = titleMatch.similarity * SEARCH_WEIGHTS.TITLE;
          if (tScore > bestTokenScore) {
            bestTokenScore = tScore;
            matchedInField = true;
          }
        }

        // 3. Виконавець
        const artistMatch = scoreTokenAgainstField(cleanToken, item.artistName);
        if (artistMatch.similarity > 0) {
          const aScore = artistMatch.similarity * SEARCH_WEIGHTS.ARTIST;
          if (aScore > bestTokenScore) {
            bestTokenScore = aScore;
            matchedInField = true;
          }
        }

        // 4. Альбом
        if (item.albumName) {
          const albumMatch = scoreTokenAgainstField(cleanToken, item.albumName);
          if (albumMatch.similarity > 0) {
            const albScore = albumMatch.similarity * SEARCH_WEIGHTS.ALBUM;
            if (albScore > bestTokenScore) {
              bestTokenScore = albScore;
              matchedInField = true;
            }
          }
        }
      }

      if (matchedInField) {
        matchedTokensSet.add(token);
        totalScore += bestTokenScore;
      }
    }

    let synergyBonus = 0;
    if (matchedInTitle && matchedInArtist) synergyBonus += 25;
    if (matchedInTags && (matchedInTitle || matchedInArtist)) synergyBonus += 30;

    const coverageRatio = matchedTokensSet.size / tokens.length;
    const finalScore = Math.round((totalScore + synergyBonus) * (1 + coverageRatio) * 10) / 10;

    if (finalScore >= minScoreThreshold && matchedTokensSet.size > 0) {
      results.push({
        item,
        score: finalScore,
        matchedTokens: Array.from(matchedTokensSet)
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

