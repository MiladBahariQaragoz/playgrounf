const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const state = {
  points: [],
  currentClass: "red",
  numTrees: 5,
  maxDepth: 3,
  bootstrap: 0.7,
  randomness: 0.5,
  forest: [],
  trained: false,
  showPredictions: false,
};

const classButtons = Array.from(document.querySelectorAll("#classPicker .pill"));
const numTreesSlider = document.getElementById("numTrees");
const maxDepthSlider = document.getElementById("maxDepth");
const bootstrapSlider = document.getElementById("bootstrap");
const randomnessSlider = document.getElementById("randomness");
const numTreesValue = document.getElementById("numTreesValue");
const maxDepthValue = document.getElementById("maxDepthValue");
const bootstrapValue = document.getElementById("bootstrapValue");
const randomnessValue = document.getElementById("randomnessValue");
const trainButton = document.getElementById("train");
const predictButton = document.getElementById("predict");
const clearButton = document.getElementById("clear");
const treeGrid = document.getElementById("treeGrid");
const voteBar = document.getElementById("voteBar");
const treeCount = document.getElementById("treeCount");
const accuracy = document.getElementById("accuracy");
const diversity = document.getElementById("diversity");

const format = (value) => value.toFixed(2);

const toCanvasCoords = (x, y) => {
  const px = (x / canvas.width) * 2 - 1;
  const py = (1 - y / canvas.height) * 2 - 1;
  return { x: px, y: py };
};

const fromCanvasCoords = (x, y) => {
  const px = ((x + 1) / 2) * canvas.width;
  const py = ((1 - y) / 2) * canvas.height;
  return { x: px, y: py };
};

const bootstrapSample = (data, ratio) => {
  const sampleSize = Math.floor(data.length * ratio);
  const sample = [];
  for (let i = 0; i < sampleSize; i += 1) {
    sample.push(data[Math.floor(Math.random() * data.length)]);
  }
  return sample;
};

const entropy = (labels) => {
  if (labels.length === 0) return 0;
  const counts = {};
  labels.forEach((label) => {
    counts[label] = (counts[label] || 0) + 1;
  });
  let ent = 0;
  Object.values(counts).forEach((count) => {
    const p = count / labels.length;
    if (p > 0) ent -= p * Math.log2(p);
  });
  return ent;
};

const majority = (labels) => {
  if (labels.length === 0) return null;
  const counts = {};
  labels.forEach((label) => {
    counts[label] = (counts[label] || 0) + 1;
  });
  return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
};

const buildTree = (data, depth, maxDepth, randomness) => {
  if (depth >= maxDepth || data.length === 0) {
    return { leaf: true, label: majority(data.map((d) => d.label)) };
  }

  const labels = data.map((d) => d.label);
  if (entropy(labels) === 0) {
    return { leaf: true, label: labels[0] };
  }

  const useX = Math.random() > randomness;
  const splitDim = useX ? "x" : "y";
  const values = data.map((d) => d[splitDim]).sort((a, b) => a - b);
  const splitVal = values[Math.floor(values.length / 2)];

  const left = data.filter((d) => d[splitDim] < splitVal);
  const right = data.filter((d) => d[splitDim] >= splitVal);

  if (left.length === 0 || right.length === 0) {
    return { leaf: true, label: majority(labels) };
  }

  return {
    leaf: false,
    splitDim,
    splitVal,
    left: buildTree(left, depth + 1, maxDepth, randomness),
    right: buildTree(right, depth + 1, maxDepth, randomness),
  };
};

const predictTree = (tree, point) => {
  if (tree.leaf) return tree.label;
  if (point[tree.splitDim] < tree.splitVal) {
    return predictTree(tree.left, point);
  }
  return predictTree(tree.right, point);
};

const trainForest = () => {
  if (state.points.length < 2) {
    return;
  }

  state.forest = [];
  for (let i = 0; i < state.numTrees; i += 1) {
    const sample = bootstrapSample(state.points, state.bootstrap);
    const tree = buildTree(sample, 0, state.maxDepth, state.randomness);
    state.forest.push({ tree, sampleSize: sample.length });
  }

  state.trained = true;
  updateTreeGrid();
  updateMetrics();
};

const predictForest = (point) => {
  const votes = state.forest.map((t) => predictTree(t.tree, point));
  return majority(votes);
};

const updateTreeGrid = () => {
  treeGrid.innerHTML = "";
  state.forest.forEach((entry, index) => {
    const card = document.createElement("div");
    card.className = "tree-card";
    card.innerHTML = `<strong>Tree ${index + 1}</strong>Sample size: ${entry.sampleSize}`;
    treeGrid.appendChild(card);
  });
};

const updateMetrics = () => {
  treeCount.textContent = state.numTrees;

  if (state.trained && state.points.length > 0) {
    let correct = 0;
    state.points.forEach((point) => {
      if (predictForest(point) === point.label) {
        correct += 1;
      }
    });
    const acc = Math.round((correct / state.points.length) * 100);
    accuracy.textContent = `${acc}%`;

    const agreements = [];
    for (let i = 0; i < state.forest.length; i += 1) {
      for (let j = i + 1; j < state.forest.length; j += 1) {
        let agree = 0;
        state.points.forEach((point) => {
          if (
            predictTree(state.forest[i].tree, point) ===
            predictTree(state.forest[j].tree, point)
          ) {
            agree += 1;
          }
        });
        agreements.push(agree / state.points.length);
      }
    }
    const avgAgreement = agreements.length > 0
      ? agreements.reduce((a, b) => a + b, 0) / agreements.length
      : 0;
    const div = 1 - avgAgreement;
    diversity.textContent = format(div);
  } else {
    accuracy.textContent = "0%";
    diversity.textContent = "0.00";
  }
};

const draw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (state.showPredictions && state.trained) {
    const gridSize = 20;
    for (let x = 0; x < canvas.width; x += gridSize) {
      for (let y = 0; y < canvas.height; y += gridSize) {
        const point = toCanvasCoords(x, y);
        const prediction = predictForest(point);
        ctx.fillStyle = prediction === "red" ? "rgba(230, 57, 70, 0.1)" : "rgba(69, 123, 157, 0.1)";
        ctx.fillRect(x, y, gridSize, gridSize);
      }
    }
  }

  ctx.strokeStyle = "rgba(28, 28, 28, 0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();

  state.points.forEach((point) => {
    const { x, y } = fromCanvasCoords(point.x, point.y);
    ctx.fillStyle = point.label === "red" ? "#e63946" : "#457b9d";
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
  });
};

const addPoint = (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const { x: px, y: py } = toCanvasCoords(x, y);

  state.points.push({ x: px, y: py, label: state.currentClass });
  draw();
};

classButtons.forEach((button) => {
  button.addEventListener("click", () => {
    classButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.currentClass = button.dataset.class;
  });
});

numTreesSlider.addEventListener("input", () => {
  state.numTrees = Number.parseInt(numTreesSlider.value, 10);
  numTreesValue.textContent = state.numTrees;
});

maxDepthSlider.addEventListener("input", () => {
  state.maxDepth = Number.parseInt(maxDepthSlider.value, 10);
  maxDepthValue.textContent = state.maxDepth;
});

bootstrapSlider.addEventListener("input", () => {
  state.bootstrap = Number.parseFloat(bootstrapSlider.value);
  bootstrapValue.textContent = format(state.bootstrap);
});

randomnessSlider.addEventListener("input", () => {
  state.randomness = Number.parseFloat(randomnessSlider.value);
  randomnessValue.textContent = format(state.randomness);
});

trainButton.addEventListener("click", () => {
  trainForest();
  draw();
  voteBar.textContent = "Forest trained. Click 'Show predictions' to visualize.";
});

predictButton.addEventListener("click", () => {
  if (!state.trained) {
    voteBar.textContent = "Train the forest first.";
    return;
  }
  state.showPredictions = !state.showPredictions;
  predictButton.textContent = state.showPredictions ? "Hide predictions" : "Show predictions";
  draw();
  voteBar.textContent = state.showPredictions
    ? "Background shows ensemble prediction per region."
    : "Predictions hidden.";
});

clearButton.addEventListener("click", () => {
  state.points = [];
  state.forest = [];
  state.trained = false;
  state.showPredictions = false;
  predictButton.textContent = "Show predictions";
  voteBar.textContent = "";
  treeGrid.innerHTML = "";
  updateMetrics();
  draw();
});

canvas.addEventListener("click", addPoint);

numTreesValue.textContent = state.numTrees;
maxDepthValue.textContent = state.maxDepth;
bootstrapValue.textContent = format(state.bootstrap);
randomnessValue.textContent = format(state.randomness);

updateMetrics();
draw();
