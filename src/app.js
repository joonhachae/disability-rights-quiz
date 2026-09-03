import { questions } from "./questions.js";
import { getDisplayAnswer, isCorrect, selectQuiz } from "./quizLogic.js";

const app = document.querySelector("#app");
const typeLabels = { ox: "OX QUIZ", multiple: "객관식 QUIZ", short: "주관식 QUIZ" };
const difficultyLabels = { easy: "쉬움", hard: "어려움" };
const SETTINGS_PASSWORD = "2015";
let state = createInitialState();

function createInitialState() {
  return { screen: "home", difficulty: null, quiz: [], index: 0, response: "", checked: false, wrong: false, hintVisible: false, cardEntering: true, results: [], settingsOpen: false, settingsUnlocked: false, settingsPassword: "", settingsError: false, catalogDifficulty: "easy" };
}

function startQuiz(difficulty) {
  state = { ...createInitialState(), screen: "quiz", difficulty, quiz: selectQuiz(questions, difficulty), cardEntering: true };
  render();
}

function currentQuestion() { return state.quiz[state.index]; }

function setResponse(value) {
  if (state.checked || state.wrong) return;
  state.response = value;
  render();
}

function checkAnswer() {
  if (!state.response.trim() || state.checked || state.wrong) return;
  if (isCorrect(currentQuestion(), state.response)) {
    state.checked = true;
    if (state.results[state.index] === undefined) state.results[state.index] = true;
    render();
    return;
  }

  state.results[state.index] = false;
  state.wrong = true;
  render();
  window.setTimeout(() => {
    if (!state.wrong) return;
    state.wrong = false;
    state.response = "";
    render();
  }, 1000);
}

function goNext() {
  if (state.index === state.quiz.length - 1) { state.screen = "result"; state.cardEntering = true; }
  else { state.index += 1; state.response = ""; state.checked = false; state.wrong = false; state.hintVisible = false; state.cardEntering = true; }
  render();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

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

function homeView() {
  return `<div class="card-stack ${state.cardEntering ? "card-enter" : ""}"><section class="panel home" aria-labelledby="home-title">
    <img class="home-logo" src="./assets/committee-symbol.png" alt="연세대학교 장애인권위원회 로고" />
    <p class="eyebrow">DISABILITY RIGHTS QUIZ</p>
    <h1 id="home-title">안녕하세요장인위입니다잘부탁드립니다</h1>
    <p class="home-description">난이도를 선택하고 세 장의 퀴즈 카드를 넘겨보세요.</p>
    <div class="button-group" aria-label="난이도 선택">
      <button class="primary" data-difficulty="easy">쉬움</button>
      <button class="primary" data-difficulty="hard">어려움</button>
    </div>
  </section></div>`;
}

function answerView(question) {
  if (question.type === "short") {
    return `<input id="short-answer" class="text-answer ${state.wrong ? "wrong" : ""}" type="text" aria-label="주관식 답안" autocomplete="off" value="${escapeHtml(state.response)}" ${state.checked || state.wrong ? "disabled" : ""} placeholder="답을 입력해주세요" />`;
  }
  const options = question.type === "ox" ? ["O", "X"] : question.options;
  return `<div class="answers ${question.type === "ox" ? "ox" : ""}" role="group" aria-label="답 선택">
    ${options.map((option, index) => `<button class="choice ${state.wrong && state.response === option ? "wrong" : ""}" data-answer="${escapeHtml(option)}" aria-pressed="${state.response === option}" ${state.checked || state.wrong ? "disabled" : ""}>${question.type === "multiple" ? `${index + 1}. ` : ""}${escapeHtml(option)}</button>`).join("")}
  </div>`;
}

function feedbackView(question) {
  return `<section class="feedback" aria-live="assertive">
    <p class="feedback-title">정답입니다!</p>
    <p><strong>정답:</strong> ${escapeHtml(getDisplayAnswer(question))}</p>
    <p><strong>해설:</strong> ${escapeHtml(question.explanation)}</p>
  </section>`;
}

function quizView() {
  const question = currentQuestion();
  const finalQuestion = state.index === state.quiz.length - 1;
  return `<div class="card-stack ${state.cardEntering ? "card-enter" : ""}"><section class="panel" aria-labelledby="question-title">
    <div class="step-track" aria-hidden="true">
      ${state.quiz.map((_, index) => `<span class="step-segment ${index <= state.index ? "active" : ""}"></span>`).join("")}
    </div>
    <header class="quiz-header"><span class="eyebrow">${typeLabels[question.type]}</span><span class="progress">${state.index + 1} / ${state.quiz.length}</span></header>
    <h2 id="question-title">${escapeHtml(question.question).replace(/\n/g, "<br>")}</h2>
    <button class="secondary" data-action="hint" aria-expanded="${state.hintVisible}">${state.hintVisible ? "힌트 닫기" : "힌트 보기"}</button>
    ${state.hintVisible ? `<p class="hint"><strong>힌트:</strong> ${escapeHtml(getHint(question))}</p>` : ""}
    ${answerView(question)}
    ${state.wrong ? `<p class="retry-message" role="alert">다시 한번 생각해보세요!</p>` : ""}
    ${state.checked ? feedbackView(question) : ""}
    <div class="actions">
      ${state.checked
        ? `<button class="primary" data-action="next">${finalQuestion ? "결과 보기" : "다음 문제"}</button>`
        : `<button class="primary" data-action="check" ${state.response.trim() && !state.wrong ? "" : "disabled"}>정답 확인</button>`}
    </div>
  </section></div>`;
}

function resultView() {
  const score = state.results.filter(Boolean).length;
  return `<div class="card-stack ${state.cardEntering ? "card-enter" : ""}"><section class="panel result" aria-labelledby="result-title">
    <div class="step-track complete" aria-hidden="true"><span class="step-segment active"></span><span class="step-segment active"></span><span class="step-segment active"></span></div>
    <p class="eyebrow">퀴즈 완료</p>
    <h2 id="result-title" class="result-score">3문제 중 ${score}문제를 맞혔어요!</h2>
    <button class="primary" data-action="restart">처음으로 돌아가기</button>
  </section></div>`;
}

function questionCatalogView() {
  return Object.entries(difficultyLabels).filter(([difficulty]) => difficulty === state.catalogDifficulty).map(([difficulty, difficultyLabel]) => {
    const sections = ["ox", "multiple", "short"].map((type) => {
      const items = questions.filter((question) => question.difficulty === difficulty && question.type === type);
      return `<section class="catalog-section">
        <h4>${typeLabels[type]} <span>${items.length}문제</span></h4>
        <div class="catalog-list">
          ${items.map((question, index) => `<article class="catalog-item">
            <p class="catalog-number">${index + 1}. ${escapeHtml(question.id)}</p>
            <h5>${escapeHtml(question.question).replace(/\n/g, "<br>")}</h5>
            ${question.options ? `<p><strong>보기</strong><br>${question.options.map((option, optionIndex) => `${optionIndex + 1}. ${escapeHtml(option)}`).join("<br>")}</p>` : ""}
            <dl>
              <div><dt>정답</dt><dd>${question.acceptAnyNonEmpty ? "모든 공백이 아닌 답변 인정" : escapeHtml(Array.isArray(question.answer) ? question.answer.join(" / ") : question.answer)}</dd></div>
              <div><dt>힌트</dt><dd>${escapeHtml(getHint(question))}</dd></div>
              <div><dt>해설</dt><dd>${escapeHtml(question.explanation)}</dd></div>
            </dl>
          </article>`).join("")}
        </div>
      </section>`;
    }).join("");
    return `<section class="catalog-difficulty"><h3>${difficultyLabel}</h3>${sections}</section>`;
  }).join("");
}

function settingsView() {
  if (!state.settingsOpen) return "";
  const content = state.settingsUnlocked
    ? `<div class="catalog-summary"><strong>전체 ${questions.length}문제</strong><span>문제 데이터 변경 시 자동 반영됩니다.</span></div>
      <div class="catalog-tabs" role="tablist" aria-label="문제 난이도 선택">
        ${Object.entries(difficultyLabels).map(([difficulty, label]) => {
          const count = questions.filter((question) => question.difficulty === difficulty).length;
          const selected = state.catalogDifficulty === difficulty;
          return `<button role="tab" class="catalog-tab" data-catalog-difficulty="${difficulty}" aria-selected="${selected}">${label}<span>${count}</span></button>`;
        }).join("")}
      </div>
      ${questionCatalogView()}`
    : `<div class="settings-login">
        <p>문제 목록을 확인하려면 운영자 암호를 입력해주세요.</p>
        <label for="settings-password">암호</label>
        <input id="settings-password" class="settings-password ${state.settingsError ? "input-error" : ""}" type="password" inputmode="numeric" maxlength="4" autocomplete="off" aria-describedby="password-message" />
        <p id="password-message" class="password-message" role="alert">${state.settingsError ? "암호가 올바르지 않습니다." : ""}</p>
        <button class="primary" data-action="unlock-settings" disabled>확인</button>
      </div>`;
  return `<div class="settings-overlay" role="presentation">
    <section class="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <header class="settings-header"><div><p class="eyebrow">ADMIN</p><h2 id="settings-title">문제 목록</h2></div><button class="modal-close" data-action="close-settings" aria-label="설정 닫기">×</button></header>
      <div class="settings-content">${content}</div>
    </section>
  </div>`;
}

function render() {
  const page = state.screen === "home" ? homeView() : state.screen === "quiz" ? quizView() : resultView();
  app.innerHTML = page + settingsView();
  if (state.cardEntering) window.requestAnimationFrame(() => { state.cardEntering = false; });
  if (state.screen === "quiz" && currentQuestion().type === "short" && !state.checked) {
    const input = document.querySelector("#short-answer");
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
  if (state.settingsOpen && !state.settingsUnlocked) window.requestAnimationFrame(() => document.querySelector("#settings-password")?.focus());
}

app.addEventListener("click", (event) => {
  const difficulty = event.target.closest("[data-difficulty]")?.dataset.difficulty;
  const catalogDifficulty = event.target.closest("[data-catalog-difficulty]")?.dataset.catalogDifficulty;
  const answer = event.target.closest("[data-answer]")?.dataset.answer;
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (difficulty) startQuiz(difficulty);
  else if (catalogDifficulty) { state.catalogDifficulty = catalogDifficulty; render(); }
  else if (answer !== undefined) setResponse(answer);
  else if (action === "check") checkAnswer();
  else if (action === "hint") { state.hintVisible = !state.hintVisible; render(); }
  else if (action === "close-settings") { state.settingsOpen = false; state.settingsPassword = ""; state.settingsError = false; render(); }
  else if (action === "unlock-settings") {
    if (state.settingsPassword === SETTINGS_PASSWORD) { state.settingsUnlocked = true; state.settingsError = false; render(); }
    else { state.settingsError = true; state.settingsPassword = ""; render(); }
  }
  else if (action === "next") goNext();
  else if (action === "restart") { state = createInitialState(); render(); }
});

app.addEventListener("input", (event) => {
  if (event.target.matches("#short-answer")) {
    state.response = event.target.value;
    const checkButton = app.querySelector('[data-action="check"]');
    if (checkButton) checkButton.disabled = !state.response.trim();
  }
  if (event.target.matches("#settings-password")) {
    state.settingsPassword = event.target.value;
    state.settingsError = false;
    const unlockButton = app.querySelector('[data-action="unlock-settings"]');
    if (unlockButton) unlockButton.disabled = !state.settingsPassword.trim();
  }
});

app.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.matches("#short-answer") && state.response.trim()) checkAnswer();
  if (event.key === "Enter" && event.target.matches("#settings-password") && state.settingsPassword.trim()) app.querySelector('[data-action="unlock-settings"]')?.click();
  if (event.key === "Escape" && state.settingsOpen) { state.settingsOpen = false; render(); }
});

render();

document.querySelector("#refresh-button").addEventListener("click", () => window.location.reload());
document.querySelector("#settings-button").addEventListener("click", () => { state.settingsOpen = true; state.settingsPassword = ""; state.settingsError = false; render(); });
