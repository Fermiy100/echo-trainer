// Квиз собирается полностью на клиенте из уже полученных termCards — без
// дополнительных запросов к ИИ (значит, без дополнительных затрат бюджета).
// Неправильные варианты — это определения ДРУГИХ терминов того же параграфа,
// перемешанные; для связного параграфа они естественно звучат правдоподобно,
// но неверно для конкретного термина.
export type QuizQuestion = {
  term: string;
  correctAnswer: string;
  options: string[];
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const MIN_TERMS_FOR_QUIZ = 2;
const MAX_OPTIONS = 4;

export function buildQuizQuestions(termCards: { term: string; definition: string }[]): QuizQuestion[] {
  if (termCards.length < MIN_TERMS_FOR_QUIZ) return [];
  const allDefinitions = termCards.map((c) => c.definition);

  return shuffle(termCards).map((card) => {
    const distractorPool = allDefinitions.filter((d) => d !== card.definition);
    const distractors = shuffle(distractorPool).slice(0, Math.min(MAX_OPTIONS - 1, distractorPool.length));
    return {
      term: card.term,
      correctAnswer: card.definition,
      options: shuffle([card.definition, ...distractors]),
    };
  });
}
