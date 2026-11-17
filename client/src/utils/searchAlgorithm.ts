/**
 * Алгоритм багатофакторного нечіткого пошуку та ранжування релевантності за токенами
 * (Multi-Token Weighted Fuzzy Search & Relevance Scoring)
 *
 * Розроблено для дипломного проєкту музичного вебсервісу "Хвиля".
 * Забезпечує інтелектуальний пошук за багатослівними запитами з урахуванням
 * одруківок (відстань Левенштейна), кастомних тегів та вагових пріоритетів полів.
 */

// Вагові коефіцієнти для різних атрибутів треку
export const SEARCH_WEIGHTS = {
  TAG: 40,      // Кастомні теги користувача (найвищий пріоритет персоналізації)
  TITLE: 35,    // Назва композиції
  ARTIST: 25,   // Виконавець
  ALBUM: 15     // Назва альбому
};

/**
 * 1. Обчислення класичної відстані Левенштейна (Levenshtein Distance)
 * Використовує оптимізоване динамічне програмування з лінійною просторовою складністю O(min(N, M)).
 */
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
        currentRow[i - 1] + 1,       // Вставка
        previousRow[i] + 1,           // Видалення
        previousRow[i - 1] + cost     // Заміна
      );
    }

    const temp = previousRow;
    previousRow = currentRow;
    currentRow = temp;
  }

  return previousRow[a.length];
}

/**
 * 2. Розрахунок нормалізованої міри схожості двох слів [0.0 ... 1.0]
 */
export function stringSimilarity(s1: string, s2: string): number {
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s1, s2);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * 3. Токенізація та нормалізація пошукового рядка
 * Розбиває запит на окремі лексеми (токени), очищуючи від пунктуації
 */
export function tokenizeQuery(query: string): string[] {
  if (!query) return [];
  return query
    .toLowerCase()
    .trim()
    .split(/[\s,+/|;]+/)
    .map(token => token.trim())
    .filter(token => token.length > 0);
}

export interface SearchableTrack {
  id?: string | number;
  title: string;
  artistName: string;
  albumName?: string;
  tags?: string[];
  [key: string]: any;
}

export interface ScoredSearchResult<T = SearchableTrack> {
  item: T;
  score: number;
  matchedTokens: string[];
  matchDetails: {
    matchedInTitle: boolean;
    matchedInArtist: boolean;
    matchedInTags: boolean;
    matchedInAlbum: boolean;
    fuzzyMatchesCount: number;
  };
}

/**
 * Перевіряє, наскільки добре конкретний токен матчиться з текстовим полем
 */
function scoreTokenAgainstField(token: string, fieldValue: string): { similarity: number; isFuzzy: boolean } {
  if (!fieldValue || !token) return { similarity: 0, isFuzzy: false };

  const normField = fieldValue.toLowerCase().trim();
  const normToken = token.toLowerCase().trim();

  // 1. Точний збіг рядка або входження підрядка
  if (normField === normToken) {
    return { similarity: 1.0, isFuzzy: false };
  }
  if (normField.includes(normToken)) {
    return { similarity: 0.95, isFuzzy: false };
  }

  // 2. Префіксний збіг слів у полі
  const fieldWords = normField.split(/[\s\-_(),.]+/).filter(Boolean);
  for (const word of fieldWords) {
    if (word === normToken) {
      return { similarity: 1.0, isFuzzy: false };
    }
    if (word.startsWith(normToken) && normToken.length >= 2) {
      return { similarity: 0.85, isFuzzy: false };
    }
  }

  // 3. Нечітке зіставлення (Fuzzy match) через Левенштейна
  // Застосовуємо тільки для слів від 3-х символів, щоб уникнути хибних спрацьовувань
  if (normToken.length >= 3) {
    let bestWordSim = 0;
    for (const word of fieldWords) {
      const sim = stringSimilarity(normToken, word);
      // Дозволяємо 1 одруківку для слів 3-5 букв, до 2 одруківок для слів >5 букв
      const maxAllowedDist = normToken.length <= 5 ? 1 : 2;
      const dist = levenshteinDistance(normToken, word);

      if (dist <= maxAllowedDist && sim > bestWordSim && sim >= 0.70) {
        bestWordSim = sim;
      }
    }

    if (bestWordSim > 0) {
      return { similarity: bestWordSim * 0.8, isFuzzy: true }; // невеликий штраф за одруківку
    }
  }

  return { similarity: 0, isFuzzy: false };
}

/**
 * 4. Головний алгоритм ранжування: Багатофакторний нечіткий пошук за токенами
 *
 * @param items Колекція треків/об'єктів для пошуку
 * @param query Рядок пошуку, що може містити багато слів
 * @param minScoreThreshold Мінімальний прохідний бал (за замовчуванням 15)
 * @returns Відсортований масив з обчисленим коефіцієнтом релевантності
 */
export function multiTokenFuzzyRank<T extends SearchableTrack>(
  items: T[],
  query: string,
  minScoreThreshold = 15
): ScoredSearchResult<T>[] {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) {
    return items.map(item => ({
      item,
      score: 100,
      matchedTokens: [],
      matchDetails: {
        matchedInTitle: false,
        matchedInArtist: false,
        matchedInTags: false,
        matchedInAlbum: false,
        fuzzyMatchesCount: 0
      }
    }));
  }

  const results: ScoredSearchResult<T>[] = [];

  for (const item of items) {
    let totalScore = 0;
    const matchedTokensSet = new Set<string>();
    let fuzzyCount = 0;
    let matchedInTitle = false;
    let matchedInArtist = false;
    let matchedInTags = false;
    let matchedInAlbum = false;

    // Перевіряємо кожен токен запиту окремо
    for (const token of tokens) {
      const isTagExplicit = token.startsWith('#');
      const cleanToken = isTagExplicit ? token.slice(1) : token;

      let bestTokenScore = 0;
      let matchedInField = false;

      // 1. Перевірка в тегах
      if (item.tags && item.tags.length > 0) {
        for (const tag of item.tags) {
          const { similarity, isFuzzy } = scoreTokenAgainstField(cleanToken, tag);
          if (similarity > 0) {
            const tagScore = similarity * SEARCH_WEIGHTS.TAG * (isTagExplicit ? 1.5 : 1.0);
            if (tagScore > bestTokenScore) {
              bestTokenScore = tagScore;
              matchedInField = true;
              matchedInTags = true;
              if (isFuzzy) fuzzyCount++;
            }
          }
        }
      }

      // Якщо користувач шукав саме з префіксом #тег, не враховуємо інші поля для цього токена
      if (!isTagExplicit) {
        // 2. Перевірка в назві пісні
        const titleMatch = scoreTokenAgainstField(cleanToken, item.title);
        if (titleMatch.similarity > 0) {
          const tScore = titleMatch.similarity * SEARCH_WEIGHTS.TITLE;
          if (tScore > bestTokenScore) {
            bestTokenScore = tScore;
            matchedInField = true;
            matchedInTitle = true;
            if (titleMatch.isFuzzy) fuzzyCount++;
          }
        }

        // 3. Перевірка у виконавці
        const artistMatch = scoreTokenAgainstField(cleanToken, item.artistName);
        if (artistMatch.similarity > 0) {
          const aScore = artistMatch.similarity * SEARCH_WEIGHTS.ARTIST;
          if (aScore > bestTokenScore) {
            bestTokenScore = aScore;
            matchedInField = true;
            matchedInArtist = true;
            if (artistMatch.isFuzzy) fuzzyCount++;
          }
        }

        // 4. Перевірка в назві альбому
        if (item.albumName) {
          const albumMatch = scoreTokenAgainstField(cleanToken, item.albumName);
          if (albumMatch.similarity > 0) {
            const albScore = albumMatch.similarity * SEARCH_WEIGHTS.ALBUM;
            if (albScore > bestTokenScore) {
              bestTokenScore = albScore;
              matchedInField = true;
              matchedInAlbum = true;
              if (albumMatch.isFuzzy) fuzzyCount++;
            }
          }
        }
      }

      if (matchedInField) {
        matchedTokensSet.add(token);
        totalScore += bestTokenScore;
      }
    }

    // Бонус за синергію полів: коли один токен знайдено в назві, а інший - у виконавці або тегах
    let synergyBonus = 0;
    if (matchedInTitle && matchedInArtist) synergyBonus += 25;
    if (matchedInTags && (matchedInTitle || matchedInArtist)) synergyBonus += 30;

    // Розрахунок коефіцієнта покриття запиту (Coverage Multiplier)
    // Якщо знайшли 3 з 3 слів -> множимо на (1 + 3/3) = 2.0x!
    const coverageRatio = matchedTokensSet.size / tokens.length;
    const finalScore = Math.round((totalScore + synergyBonus) * (1 + coverageRatio) * 10) / 10;

    // Відсікаємо результати, які набрали замало балів або не перетнулися з жодним токеном
    if (finalScore >= minScoreThreshold && matchedTokensSet.size > 0) {
      results.push({
        item,
        score: finalScore,
        matchedTokens: Array.from(matchedTokensSet),
        matchDetails: {
          matchedInTitle,
          matchedInArtist,
          matchedInTags,
          matchedInAlbum,
          fuzzyMatchesCount: fuzzyCount
        }
      });
    }
  }

  // Сортуємо результати за коефіцієнтом релевантності (Relevance Score) у спадному порядку
  return results.sort((a, b) => b.score - a.score);
}
