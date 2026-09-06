import { mkdir, writeFile } from "node:fs/promises";
import { questions } from "../src/questions.js";

const outputPath = new URL("../outputs/장애인권-퀴즈-문제목록.md", import.meta.url);
const difficultyLabels = { easy: "쉬움", hard: "어려움" };
const typeLabels = { ox: "OX", multiple: "객관식", short: "주관식" };

function getInitialConsonants(value) {
  const initials = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
  return String(value).split("").map((character) => {
    const code = character.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) return initials[Math.floor((code - 0xac00) / 588)];
    return /\s/.test(character) ? " " : "";
  }).join("").replace(/\s+/g, " ").trim();
}

function getHint(question) {
  if (question.hint) return question.hint;
  if (question.type !== "short") return "문제의 핵심 표현을 다시 살펴보세요.";
  const mainAnswer = Array.isArray(question.answer) ? question.answer[0] : question.answer;
  return `초성 힌트: ${getInitialConsonants(mainAnswer)}`;
}

function getAnswer(question) {
  if (question.acceptAnyNonEmpty) {
    return `${question.displayAnswer}\n\n> 판정 기준: 모든 공백이 아닌 답변 인정`;
  }
  return Array.isArray(question.answer) ? question.answer.join(" / ") : question.answer;
}

const lines = [
  "# 장애인권 퀴즈 문제 목록",
  "",
  `총 ${questions.length}문제 · OX ${questions.filter((q) => q.type === "ox").length}문제 · 객관식 ${questions.filter((q) => q.type === "multiple").length}문제 · 주관식 ${questions.filter((q) => q.type === "short").length}문제`,
  "",
];

for (const difficulty of ["easy", "hard"]) {
  const difficultyQuestions = questions.filter((question) => question.difficulty === difficulty);
  lines.push(`# ${difficultyLabels[difficulty]} (${difficultyQuestions.length}문제)`, "");

  for (const type of ["ox", "multiple", "short"]) {
    const typeQuestions = difficultyQuestions.filter((question) => question.type === type);
    lines.push(`## ${typeLabels[type]} (${typeQuestions.length}문제)`, "");

    typeQuestions.forEach((question, index) => {
      lines.push(`### ${index + 1}. ${question.question.replace(/\n/g, "  \n")}`, "");

      if (question.options) {
        lines.push("**보기**", "");
        question.options.forEach((option, optionIndex) => lines.push(`${optionIndex + 1}. ${option}`));
        lines.push("");
      }

      lines.push(`**힌트:** ${getHint(question)}`, "");
      lines.push(`**정답:** ${getAnswer(question)}`, "");
      lines.push(`**해설:** ${question.explanation}`, "", "---", "");
    });
  }
}

await mkdir(new URL("../outputs/", import.meta.url), { recursive: true });
await writeFile(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(outputPath.pathname);
