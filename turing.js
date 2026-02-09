const state = {
  roundActive: false,
  humanLane: null,
  rounds: 0,
  correct: 0,
  settings: {
    botDelay: 700,
    humanDelay: 900,
    botMistake: 0.2,
    humanHesitation: 0.15,
    humanStyle: "story",
    botTone: "formal",
  },
};

const laneA = document.getElementById("laneA");
const laneB = document.getElementById("laneB");
const questionInput = document.getElementById("question");
const sendQuestion = document.getElementById("sendQuestion");
const status = document.getElementById("status");
const result = document.getElementById("result");
const accuracy = document.getElementById("accuracy");
const roundsLabel = document.getElementById("rounds");
const scorecard = document.querySelector(".scorecard");

const botDelay = document.getElementById("botDelay");
const humanDelay = document.getElementById("humanDelay");
const botMistake = document.getElementById("botMistake");
const humanHesitation = document.getElementById("humanHesitation");
const botDelayValue = document.getElementById("botDelayValue");
const humanDelayValue = document.getElementById("humanDelayValue");
const botMistakeValue = document.getElementById("botMistakeValue");
const humanHesitationValue = document.getElementById("humanHesitationValue");

const startRound = document.getElementById("startRound");
const reveal = document.getElementById("reveal");
const guessButtons = Array.from(document.querySelectorAll(".guess-btn"));

const humanStyleButtons = Array.from(document.querySelectorAll("#humanStyle .pill"));
const botToneButtons = Array.from(document.querySelectorAll("#botTone .pill"));

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const updateScore = () => {
  const percent = state.rounds === 0 ? 0 : Math.round((state.correct / state.rounds) * 100);
  accuracy.textContent = `${percent}%`;
  roundsLabel.textContent = `${state.rounds} rounds`;
  scorecard.classList.toggle("good", percent >= 60);
};

const clearLane = (lane) => {
  while (lane.firstChild) {
    lane.removeChild(lane.firstChild);
  }
};

const addMessage = (lane, text, type = "answer") => {
  const bubble = document.createElement("div");
  bubble.className = `message ${type}`;
  bubble.textContent = text;
  lane.appendChild(bubble);
  lane.scrollTop = lane.scrollHeight;
  return bubble;
};

const addTyping = (lane) => addMessage(lane, "typing...", "typing");

const pick = (list) => list[Math.floor(Math.random() * list.length)];

const withHesitation = (text, hesitation) => {
  if (Math.random() < hesitation) {
    return `${pick(["hmm", "uh", "okay", "let me think"])}, ${text}`;
  }
  return text;
};

const withMistake = (text, rate) => {
  if (Math.random() < rate) {
    const glitches = [
      "As an AI, I do not have that information.",
      "I might be mistaken, but maybe.",
      "The question is unclear. Please rephrase.",
      "I cannot access personal experiences.",
    ];
    return pick(glitches);
  }
  return text;
};

const humanResponse = (question) => {
  const style = state.settings.humanStyle;
  const bank = {
    story: [
      "That reminds me of a trip I took last year where we got lost on purpose.",
      "I always answer that with a little story because it sticks better.",
      "My first thought is a memory, then I try to be practical.",
      "Honestly, I would do it differently depending on who I am with.",
    ],
    precise: [
      "Short answer: it depends on constraints and the goal.",
      "I would define terms first, then decide on a plan.",
      "I can give a direct answer if you specify time or budget.",
      "I would compare two options and choose the simpler one.",
    ],
    playful: [
      "I would probably try it just to see what happens.",
      "That feels like a riddle, so I will play along.",
      "My answer changes if there is coffee involved.",
      "I would flip a coin, then argue with it.",
    ],
  };
  const response = pick(bank[style]);
  return withHesitation(response, state.settings.humanHesitation);
};

const botResponse = (question) => {
  const tone = state.settings.botTone;
  const base = {
    formal: [
      "Based on the question, a general response is to consider inputs and output.",
      "I can provide an overview and a concise answer.",
      "The best approach is to analyze the problem and return a summary.",
      "There is insufficient context, but a typical response is as follows.",
    ],
    chatty: [
      "Great question. I will try to break it down step by step.",
      "Okay, so the quick version is yes, with a few caveats.",
      "Let us explore that a little; I can give a short answer first.",
      "I like this question. There are a couple of angles to it.",
    ],
    defensive: [
      "It is hard to say without more details.",
      "I cannot be certain, but I can outline a safe answer.",
      "The question could be interpreted in several ways.",
      "I would need more information to respond precisely.",
    ],
  };
  const response = pick(base[tone]);
  return withMistake(response, state.settings.botMistake);
};

const planDelay = (base, text) => {
  const words = text.split(" ").length;
  return clamp(base + words * 40, 200, 2600);
};

const sendToLanes = (question) => {
  addMessage(laneA, question, "question");
  addMessage(laneB, question, "question");

  const typingA = addTyping(laneA);
  const typingB = addTyping(laneB);

  const humanLane = state.humanLane === "A" ? "A" : "B";
  const botLane = humanLane === "A" ? "B" : "A";

  const humanText = humanResponse(question);
  const botText = botResponse(question);

  const humanDelay = planDelay(state.settings.humanDelay, humanText);
  const botDelay = planDelay(state.settings.botDelay, botText);

  setTimeout(() => {
    typingA.remove();
    typingB.remove();

    const targetHuman = humanLane === "A" ? laneA : laneB;
    const targetBot = botLane === "A" ? laneA : laneB;

    addMessage(targetHuman, humanText);
    addMessage(targetBot, botText);
  }, Math.max(humanDelay, botDelay));
};

const startNewRound = () => {
  state.roundActive = true;
  state.humanLane = Math.random() > 0.5 ? "A" : "B";
  status.textContent = "Round in progress";
  result.textContent = "";
  questionInput.value = "";
  clearLane(laneA);
  clearLane(laneB);
};

const revealIdentities = () => {
  if (!state.roundActive) {
    result.textContent = "Start a round first.";
    return;
  }
  result.textContent = `Human was Participant ${state.humanLane}.`;
};

const handleGuess = (guess) => {
  if (!state.roundActive) {
    result.textContent = "Start a round first.";
    return;
  }
  state.rounds += 1;
  if (guess === state.humanLane) {
    state.correct += 1;
    result.textContent = "Correct. You identified the human.";
  } else {
    result.textContent = `Not quite. Human was Participant ${state.humanLane}.`;
  }
  state.roundActive = false;
  status.textContent = "Round complete";
  updateScore();
};

const updateSettings = () => {
  state.settings.botDelay = Number.parseInt(botDelay.value, 10);
  state.settings.humanDelay = Number.parseInt(humanDelay.value, 10);
  state.settings.botMistake = Number.parseFloat(botMistake.value);
  state.settings.humanHesitation = Number.parseFloat(humanHesitation.value);

  botDelayValue.textContent = `${state.settings.botDelay} ms`;
  humanDelayValue.textContent = `${state.settings.humanDelay} ms`;
  botMistakeValue.textContent = state.settings.botMistake.toFixed(2);
  humanHesitationValue.textContent = state.settings.humanHesitation.toFixed(2);
};

humanStyleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    humanStyleButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.settings.humanStyle = button.dataset.style;
  });
});

botToneButtons.forEach((button) => {
  button.addEventListener("click", () => {
    botToneButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.settings.botTone = button.dataset.tone;
  });
});

startRound.addEventListener("click", startNewRound);
reveal.addEventListener("click", revealIdentities);

guessButtons.forEach((button) => {
  button.addEventListener("click", () => handleGuess(button.dataset.guess));
});

sendQuestion.addEventListener("click", () => {
  if (!state.roundActive) {
    result.textContent = "Start a round first.";
    return;
  }
  const text = questionInput.value.trim();
  if (!text) {
    return;
  }
  sendToLanes(text);
  questionInput.value = "";
});

questionInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendQuestion.click();
  }
});

botDelay.addEventListener("input", updateSettings);
humanDelay.addEventListener("input", updateSettings);
botMistake.addEventListener("input", updateSettings);
humanHesitation.addEventListener("input", updateSettings);

updateSettings();
updateScore();
