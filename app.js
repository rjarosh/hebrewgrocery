(() => {
  const AUDIO_EXTS = ["mp3", "m4a", "ogg"];
  const ids = Object.keys(CARDS);

  // ── Toast ────────────────────────────────────────────────
  const toastEl = document.getElementById("toast");
  let toastTimer = null;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2200);
  }

  // ── Audio playback with extension fallback ──────────────
  // Tries audio/<id>.mp3, then .m4a, then .ogg — whichever
  // file actually exists in the audio/ folder gets played.
  function playAudio(id, onStart, onEnd) {
    let i = 0;
    const audio = new Audio();

    function tryNext() {
      if (i >= AUDIO_EXTS.length) {
        showToast(`No recording found for card ${id}`);
        return;
      }
      audio.src = `audio/${id}.${AUDIO_EXTS[i]}`;
      i++;
    }

    audio.addEventListener("error", tryNext);
    audio.addEventListener("canplaythrough", () => {
      onStart && onStart();
      audio.play().catch(() => {});
    }, { once: true });
    audio.addEventListener("ended", () => onEnd && onEnd());

    tryNext();
  }

  // ── Cards view ───────────────────────────────────────────
  const grid = document.getElementById("grid");
  const emptyMsg = document.getElementById("empty-msg");

  if (ids.length === 0) {
    emptyMsg.hidden = false;
  } else {
    ids.forEach((id) => {
      const { word, emoji } = CARDS[id];
      const btn = document.createElement("button");
      btn.className = "flashcard";
      btn.dataset.id = id;
      // gentle, deterministic tilt per card so the grid feels like
      // scattered index cards rather than a rigid table
      const tilt = ((parseInt(id, 10) * 37) % 7) - 3;
      btn.style.setProperty("--tilt", `${tilt}deg`);
      btn.innerHTML = `
        <div class="card-emoji">${emoji || "🔤"}</div>
        <div class="card-word">${word}</div>
      `;
      btn.addEventListener("click", () => {
        playAudio(
          id,
          () => btn.classList.add("is-playing"),
          () => btn.classList.remove("is-playing")
        );
      });
      grid.appendChild(btn);
    });
  }

  // ── Tab switching ────────────────────────────────────────
  const tabs = document.querySelectorAll(".tab");
  const views = {
    cards: document.getElementById("cards-view"),
    quiz: document.getElementById("quiz-view"),
    "quiz-text": document.getElementById("quiz-text-view"),
  };

  function setView(name) {
    tabs.forEach((t) => {
      const active = t.dataset.view === name;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });
    Object.entries(views).forEach(([key, el]) => {
      el.classList.toggle("is-active", key === name);
    });
    if (name === "quiz") quizController.render();
    if (name === "quiz-text") quizTextController.render();
  }

  tabs.forEach((t) => t.addEventListener("click", () => setView(t.dataset.view)));

  // ── Quiz mode (shared controller, used by both quiz tabs) ─
  // The two quiz tabs (with and without emoji) share the same
  // shuffled order/position, so switching between them keeps
  // your place in the deck.
  let quizOrder = [...ids];
  let quizIndex = 0;

  function createQuizController({ card, word, emoji, count, prevBtn, nextBtn, shuffleBtn, showEmoji }) {
    function fitWordToScreen() {
      // shrink the word if it's still too wide after the CSS clamp
      // (mainly a safety net for unusually long strings)
      word.style.fontSize = "";
      const maxWidth = card.clientWidth * 0.94;
      let tries = 0;
      while (word.scrollWidth > maxWidth && tries < 30) {
        const current = parseFloat(getComputedStyle(word).fontSize);
        word.style.fontSize = `${current * 0.94}px`;
        tries++;
      }
    }

    function render() {
      if (ids.length === 0) return;
      const id = quizOrder[quizIndex];
      const data = CARDS[id];
      if (showEmoji && emoji) emoji.textContent = data.emoji || "🔤";
      word.textContent = data.word;
      count.textContent = `${quizIndex + 1} / ${quizOrder.length}`;
      requestAnimationFrame(fitWordToScreen);
    }

    function goTo(delta) {
      if (ids.length === 0) return;
      quizIndex = (quizIndex + delta + quizOrder.length) % quizOrder.length;
      renderAll();
    }

    function shuffle() {
      for (let i = quizOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [quizOrder[i], quizOrder[j]] = [quizOrder[j], quizOrder[i]];
      }
      quizIndex = 0;
      renderAll();
      showToast("Shuffled");
    }

    card.addEventListener("click", () => {
      if (ids.length === 0) return;
      const id = quizOrder[quizIndex];
      playAudio(id, () => card.classList.add("is-playing"), () => card.classList.remove("is-playing"));
    });

    prevBtn.addEventListener("click", () => goTo(-1));
    nextBtn.addEventListener("click", () => goTo(1));
    shuffleBtn.addEventListener("click", shuffle);

    return { render, goTo, fitWordToScreen };
  }

  // both controllers stay in sync since they share quizOrder/quizIndex —
  // re-rendering "all" keeps the inactive tab's position correct too,
  // so it's ready the moment you switch to it.
  function renderAll() {
    quizController.render();
    quizTextController.render();
  }

  const quizController = createQuizController({
    card: document.getElementById("quiz-card"),
    word: document.getElementById("quiz-word"),
    emoji: document.getElementById("quiz-emoji"),
    count: document.getElementById("quiz-count"),
    prevBtn: document.getElementById("prev-btn"),
    nextBtn: document.getElementById("next-btn"),
    shuffleBtn: document.getElementById("shuffle-btn"),
    showEmoji: true,
  });

  const quizTextController = createQuizController({
    card: document.getElementById("quiz-text-card"),
    word: document.getElementById("quiz-text-word"),
    emoji: null,
    count: document.getElementById("quiz-text-count"),
    prevBtn: document.getElementById("quiz-text-prev-btn"),
    nextBtn: document.getElementById("quiz-text-next-btn"),
    shuffleBtn: document.getElementById("quiz-text-shuffle-btn"),
    showEmoji: false,
  });

  document.addEventListener("keydown", (e) => {
    if (views.quiz.classList.contains("is-active")) {
      if (e.key === "ArrowRight") quizController.goTo(1);
      if (e.key === "ArrowLeft") quizController.goTo(-1);
      if (e.key === " ") { e.preventDefault(); document.getElementById("quiz-card").click(); }
    }
    if (views["quiz-text"].classList.contains("is-active")) {
      if (e.key === "ArrowRight") quizTextController.goTo(1);
      if (e.key === "ArrowLeft") quizTextController.goTo(-1);
      if (e.key === " ") { e.preventDefault(); document.getElementById("quiz-text-card").click(); }
    }
  });

  window.addEventListener("resize", () => {
    if (views.quiz.classList.contains("is-active")) quizController.fitWordToScreen();
    if (views["quiz-text"].classList.contains("is-active")) quizTextController.fitWordToScreen();
  });
})();
