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
    toastTimer = setTimeout(() => {
      toastEl.hidden = true;
    }, 2200);
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

    audio.addEventListener(
      "canplaythrough",
      () => {
        onStart && onStart();
        audio.play().catch(() => {});
      },
      { once: true }
    );

    audio.addEventListener("ended", () => {
      onEnd && onEnd();
    });

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

      // Gentle, deterministic tilt per card so the grid feels like
      // scattered index cards rather than a rigid table.
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
    "quiz-emoji": document.getElementById("quiz-emoji-view"),
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

    if (name === "quiz") {
      quizController.render();
    }

    if (name === "quiz-text") {
      quizTextController.render();
    }

    if (name === "quiz-emoji") {
      quizEmojiController.render();
    }
  }

  tabs.forEach((t) => {
    t.addEventListener("click", () => {
      setView(t.dataset.view);
    });
  });

  // ── Shared quiz state ───────────────────────────────────
  // All three quiz modes use the same shuffled order and position.
  // Switching between quiz modes therefore keeps you on the same card.
  let quizOrder = [...ids];
  let quizIndex = 0;

  // ── Quiz controller ─────────────────────────────────────
  function createQuizController({
    card,
    word,
    emoji,
    count,
    prevBtn,
    nextBtn,
    shuffleBtn,
    showEmoji,
    emojiOnly = false,
  }) {
    function fitWordToScreen() {
      // Reset the font size before measuring.
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

      if (emojiOnly) {
        // Emoji-only quiz: display the emoji where the word normally goes.
        word.textContent = data.emoji || "🔤";
      } else {
        // Normal quiz modes.
        if (showEmoji && emoji) {
          emoji.textContent = data.emoji || "🔤";
        }

        word.textContent = data.word;
      }

      count.textContent = `${quizIndex + 1} / ${quizOrder.length}`;

      requestAnimationFrame(fitWordToScreen);
    }

    function goTo(delta) {
      if (ids.length === 0) return;

      quizIndex =
        (quizIndex + delta + quizOrder.length) % quizOrder.length;

      renderAll();
    }

    function shuffle() {
      for (let i = quizOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [quizOrder[i], quizOrder[j]] = [
          quizOrder[j],
          quizOrder[i],
        ];
      }

      quizIndex = 0;

      renderAll();

      showToast("Shuffled");
    }

    // Clicking the quiz card plays its audio.
    card.addEventListener("click", () => {
      if (ids.length === 0) return;

      const id = quizOrder[quizIndex];

      playAudio(
        id,
        () => card.classList.add("is-playing"),
        () => card.classList.remove("is-playing")
      );
    });

    prevBtn.addEventListener("click", () => {
      goTo(-1);
    });

    nextBtn.addEventListener("click", () => {
      goTo(1);
    });

    shuffleBtn.addEventListener("click", shuffle);

    return {
      render,
      goTo,
      fitWordToScreen,
    };
  }

  // ── Render all quiz modes ────────────────────────────────
  // Because all quiz modes share quizOrder and quizIndex,
  // every mode stays synchronized.
  function renderAll() {
    quizController.render();
    quizTextController.render();
    quizEmojiController.render();
  }

  // ── Normal Quiz ──────────────────────────────────────────
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

  // ── Quiz: Text ───────────────────────────────────────────
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

  // ── Quiz: Emoji ─────────────────────────────────────────
  const quizEmojiController = createQuizController({
    card: document.getElementById("quiz-emoji-card"),
    word: document.getElementById("quiz-emoji-only"),
    emoji: null,
    count: document.getElementById("quiz-emoji-count"),
    prevBtn: document.getElementById("quiz-emoji-prev-btn"),
    nextBtn: document.getElementById("quiz-emoji-next-btn"),
    shuffleBtn: document.getElementById("quiz-emoji-shuffle-btn"),
    showEmoji: false,
    emojiOnly: true,
  });

  // ── Keyboard controls ───────────────────────────────────
  document.addEventListener("keydown", (e) => {
    // Normal Quiz
    if (views.quiz.classList.contains("is-active")) {
      if (e.key === "ArrowRight") {
        quizController.goTo(1);
      }

      if (e.key === "ArrowLeft") {
        quizController.goTo(-1);
      }

      if (e.key === " ") {
        e.preventDefault();
        document.getElementById("quiz-card").click();
      }
    }

    // Quiz: Text
    if (views["quiz-text"].classList.contains("is-active")) {
      if (e.key === "ArrowRight") {
        quizTextController.goTo(1);
      }

      if (e.key === "ArrowLeft") {
        quizTextController.goTo(-1);
      }

      if (e.key === " ") {
        e.preventDefault();
        document.getElementById("quiz-text-card").click();
      }
    }

    // Quiz: Emoji
    if (views["quiz-emoji"].classList.contains("is-active")) {
      if (e.key === "ArrowRight") {
        quizEmojiController.goTo(1);
      }

      if (e.key === "ArrowLeft") {
        quizEmojiController.goTo(-1);
      }

      if (e.key === " ") {
        e.preventDefault();
        document.getElementById("quiz-emoji-card").click();
      }
    }
  });

  // ── Resize handling ──────────────────────────────────────
  window.addEventListener("resize", () => {
    if (views.quiz.classList.contains("is-active")) {
      quizController.fitWordToScreen();
    }

    if (views["quiz-text"].classList.contains("is-active")) {
      quizTextController.fitWordToScreen();
    }

    if (views["quiz-emoji"].classList.contains("is-active")) {
      quizEmojiController.fitWordToScreen();
    }
  });
})();
```

One **CSS addition** is still recommended for the new emoji mode so the emoji is substantially larger than the Hebrew text:

```css
.quiz-emoji-only {
  font-size: clamp(5rem, 15vw, 10rem);
  line-height: 1;
}
