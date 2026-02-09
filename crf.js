const tokens = ["time", "flies", "like", "an", "arrow", "today"];

const state = {
  tokenOrder: [...tokens],
  emissionStrong: 1.8,
  emissionNeutral: 0.6,
  stay: 1.0,
  switch: 0.2,
};

const emissionSlider = document.getElementById("emission");
const neutralSlider = document.getElementById("neutral");
const staySlider = document.getElementById("stay");
const switchSlider = document.getElementById("switch");
const emissionValue = document.getElementById("emissionValue");
const neutralValue = document.getElementById("neutralValue");
const stayValue = document.getElementById("stayValue");
const switchValue = document.getElementById("switchValue");
const tokensBox = document.getElementById("tokens");
const lattice = document.getElementById("lattice");
const pathScore = document.getElementById("pathScore");
const pathLabel = document.getElementById("pathLabel");
const formula = document.getElementById("formula");
const breakdown = document.getElementById("breakdown");
const scorecard = document.querySelector(".scorecard");
const shuffleButton = document.getElementById("shuffle");

const labelSet = ["A", "B"];

const tokenFeatures = {
  time: { A: 0.8, B: 0.3 },
  flies: { A: 0.5, B: 0.7 },
  like: { A: 0.2, B: 0.9 },
  an: { A: 0.6, B: 0.4 },
  arrow: { A: 0.9, B: 0.2 },
  today: { A: 0.4, B: 0.6 },
};

const format = (value) => value.toFixed(2);

const emissionScore = (token, label) => {
  const feature = tokenFeatures[token][label];
  const strength = feature > 0.6 ? state.emissionStrong : state.emissionNeutral;
  return feature * strength;
};

const transitionScore = (from, to) => (from === to ? state.stay : state.switch);

const scorePath = (labels) => {
  let score = emissionScore(state.tokenOrder[0], labels[0]);
  for (let i = 1; i < labels.length; i += 1) {
    score += emissionScore(state.tokenOrder[i], labels[i]);
    score += transitionScore(labels[i - 1], labels[i]);
  }
  return score;
};

const enumeratePaths = () => {
  const paths = [];
  const total = Math.pow(labelSet.length, state.tokenOrder.length);
  for (let i = 0; i < total; i += 1) {
    const labels = [];
    let index = i;
    for (let j = 0; j < state.tokenOrder.length; j += 1) {
      labels.push(labelSet[index % labelSet.length]);
      index = Math.floor(index / labelSet.length);
    }
    paths.push({ labels, score: scorePath(labels) });
  }
  return paths;
};

const bestPath = () => {
  const paths = enumeratePaths();
  return paths.reduce((best, current) => (current.score > best.score ? current : best));
};

const renderTokens = () => {
  tokensBox.innerHTML = "";
  state.tokenOrder.forEach((token) => {
    const span = document.createElement("span");
    span.className = "token";
    span.textContent = token;
    tokensBox.appendChild(span);
  });
};

const renderLattice = (path) => {
  lattice.innerHTML = "";
  const columns = state.tokenOrder.map((token, index) => {
    const column = document.createElement("div");
    column.className = "column";
    column.innerHTML = `
      <div class="obs">${token.toUpperCase()}</div>
      <div class="state">
        <div class="node a" data-label="A" data-index="${index}">A <span>${format(
          emissionScore(token, "A")
        )}</span></div>
        <div class="node b" data-label="B" data-index="${index}">B <span>${format(
          emissionScore(token, "B")
        )}</span></div>
      </div>
      <svg class="edges" viewBox="0 0 200 200" preserveAspectRatio="none"></svg>
    `;
    lattice.appendChild(column);
    return column;
  });

  columns.forEach((column, index) => {
    if (index === 0) {
      return;
    }
    const svg = column.querySelector("svg");
    svg.innerHTML = `
      <path class="edge" data-edge="AA" d="M20 60 C 60 40, 120 40, 180 60" />
      <path class="edge" data-edge="AB" d="M20 60 C 60 120, 120 120, 180 140" />
      <path class="edge" data-edge="BA" d="M20 140 C 60 80, 120 80, 180 60" />
      <path class="edge" data-edge="BB" d="M20 140 C 60 160, 120 160, 180 140" />
    `;
  });

  const pathLabels = path.labels;
  const nodes = Array.from(document.querySelectorAll(".node"));
  nodes.forEach((node) => {
    const index = Number.parseInt(node.dataset.index, 10);
    if (pathLabels[index] === node.dataset.label) {
      node.classList.add("active");
    }
  });

  columns.forEach((column, index) => {
    if (index === 0) {
      return;
    }
    const prev = pathLabels[index - 1];
    const current = pathLabels[index];
    const edgeKey = `${prev}${current}`;
    const edge = column.querySelector(`.edge[data-edge="${edgeKey}"]`);
    if (edge) {
      edge.classList.add("active");
    }
  });
};

const renderBreakdown = (path) => {
  const parts = [];
  parts.push("Score = Σ emission + Σ transition");
  for (let i = 0; i < path.labels.length; i += 1) {
    const token = state.tokenOrder[i];
    const label = path.labels[i];
    parts.push(
      `emit(${token}, ${label}) = ${format(emissionScore(token, label))}`
    );
    if (i > 0) {
      const prev = path.labels[i - 1];
      parts.push(
        `trans(${prev}→${label}) = ${format(transitionScore(prev, label))}`
      );
    }
  }
  breakdown.textContent = parts.join("\n");
};

const updateFormula = () => {
  formula.textContent = `y* = argmax_y Σ_t (emit(x_t, y_t) + trans(y_{t-1}, y_t))`;
};

const update = () => {
  emissionValue.textContent = format(state.emissionStrong);
  neutralValue.textContent = format(state.emissionNeutral);
  stayValue.textContent = format(state.stay);
  switchValue.textContent = format(state.switch);

  const best = bestPath();
  pathScore.textContent = format(best.score);
  pathLabel.textContent = best.labels.join(" ");
  scorecard.classList.add("active");

  renderTokens();
  renderLattice(best);
  renderBreakdown(best);
  updateFormula();
};

emissionSlider.addEventListener("input", (event) => {
  state.emissionStrong = Number.parseFloat(event.target.value);
  update();
});

neutralSlider.addEventListener("input", (event) => {
  state.emissionNeutral = Number.parseFloat(event.target.value);
  update();
});

staySlider.addEventListener("input", (event) => {
  state.stay = Number.parseFloat(event.target.value);
  update();
});

switchSlider.addEventListener("input", (event) => {
  state.switch = Number.parseFloat(event.target.value);
  update();
});

shuffleButton.addEventListener("click", () => {
  state.tokenOrder = [...state.tokenOrder].sort(() => Math.random() - 0.5);
  update();
});

update();
