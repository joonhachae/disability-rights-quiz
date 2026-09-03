const LAST_QUESTIONS_KEY = "yonsei-human-rights-quiz:last-questions";
export const QUIZ_TYPES = ["ox", "multiple", "short"];

export function normalizeAnswer(value) {
  return String(value).trim().toLocaleLowerCase("ko-KR").replace(/\s+/g, "");
}

export function isCorrect(question, response) {
  if (question.acceptAnyNonEmpty) return normalizeAnswer(response).length > 0;
  const accepted = Array.isArray(question.answer) ? question.answer : [question.answer];
  const normalizedResponse = normalizeAnswer(response);
  return accepted.some((answer) => normalizeAnswer(answer) === normalizedResponse);
}

export function getDisplayAnswer(question) {
  return question.displayAnswer ?? (Array.isArray(question.answer) ? question.answer[0] : question.answer);
}

export function readLastQuestionIds(storage = window.localStorage) {
  try { return JSON.parse(storage.getItem(LAST_QUESTIONS_KEY)) ?? {}; }
  catch { return {}; }
}

export function selectQuiz(questions, difficulty, storage = window.localStorage, random = Math.random) {
  const previous = readLastQuestionIds(storage);
  // 이전 버전의 { ox, multiple, short } 형식도 읽을 수 있도록 호환합니다.
  const previousForDifficulty = previous[difficulty] ?? previous;
  const selected = QUIZ_TYPES.map((type) => {
    const pool = questions.filter((item) => item.difficulty === difficulty && item.type === type);
    if (!pool.length) throw new Error(`${difficulty}/${type} 문제 풀이 비어 있습니다.`);
    const candidates = pool.length > 1 ? pool.filter((item) => item.id !== previousForDifficulty[type]) : pool;
    return candidates[Math.floor(random() * candidates.length)];
  });

  const nextHistory = {
    ...(previous.easy || previous.hard ? previous : {}),
    [difficulty]: Object.fromEntries(selected.map((item) => [item.type, item.id])),
  };
  storage.setItem(LAST_QUESTIONS_KEY, JSON.stringify(nextHistory));
  return selected;
}
