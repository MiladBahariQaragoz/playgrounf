const canvas = document.getElementById("plane");
const ctx = canvas.getContext("2d");

const state = {
  points: [],
  weights: [0.3, -0.2],
  bias: 0,
  learningRate: 0.2,
  epochsPerStep: 5,
  currentClass: 1,
  epoch: 0,
};

const classButtons = Array.from(document.querySelectorAll("#classPicker .pill"));
const lrSlider = document.getElementById("lr");
const lrValue = document.getElementById("lrValue");
const epochsSlider = document.getElementById("epochs");
const epochsValue = document.getElementById("epochsValue");
const biasSlider = document.getElementById("bias");
const biasValue = document.getElementById("biasValue");
const trainButton = document.getElementById("train");
const resetButton = document.getElementById("reset");
const clearButton = document.getElementById("clear");
const weightsBox = document.getElementById("weights");
const formulaBox = document.getElementById("formula");
const epochLabel = document.getElementById("epoch");
const accuracyLabel = document.getElementById("accuracy");
const lossLabel = document.getElementById("loss");

const format = (value) => value.toFixed(2);

const toPlaneCoords = (x, y) => {
  const px = (x / canvas.width) * 2 - 1;
  const py = (1 - y / canvas.height) * 2 - 1;
  return { x: px, y: py };
};

const fromPlaneCoords = (x, y) => {
  const px = ((x + 1) / 2) * canvas.width;
  const py = ((1 - y) / 2) * canvas.height;
  return { x: px, y: py };
};

const predict = (point) => {
  const sum = state.weights[0] * point.x + state.weights[1] * point.y + state.bias;
  return sum >= 0 ? 1 : -1;
};

const trainEpoch = () => {
  if (state.points.length === 0) {
    return { correct: 0, total: 0, loss: 0 };
  }

  let correct = 0;
  let loss = 0;

  state.points.forEach((point) => {
    const guess = predict(point);
    const error = point.label - guess;
    if (error === 0) {
      correct += 1;
    } else {
      state.weights[0] += state.learningRate * error * point.x;
      state.weights[1] += state.learningRate * error * point.y;
      state.bias += state.learningRate * error;
      loss += Math.abs(error);
    }
  });

  return { correct, total: state.points.length, loss };
};

const train = () => {
  let totals = { correct: 0, total: 0, loss: 0 };
  for (let i = 0; i < state.epochsPerStep; i += 1) {
    const result = trainEpoch();
    totals.correct += result.correct;
    totals.total = result.total;
    totals.loss += result.loss;
    state.epoch += 1;
  }

  const accuracy = totals.total === 0 ? 0 : Math.round((totals.correct / totals.total) * 100);
  const avgLoss = totals.total === 0 ? 0 : totals.loss / totals.total;

  epochLabel.textContent = state.epoch;
  accuracyLabel.textContent = `${accuracy}%`;
  lossLabel.textContent = format(avgLoss);
};

const updateWeightsBox = () => {
  weightsBox.textContent = `w1 = ${format(state.weights[0])}\nw2 = ${format(
    state.weights[1]
  )}\nb = ${format(state.bias)}`;
};

const updateFormula = () => {
  formulaBox.textContent = `y = sign(${format(state.weights[0])}·x + ${format(
    state.weights[1]
  )}·y + ${format(state.bias)})`;
};

const draw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(18, 18, 18, 0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();

  if (Math.abs(state.weights[1]) > 0.0001) {
    const y1 = (-state.bias - state.weights[0] * -1) / state.weights[1];
    const y2 = (-state.bias - state.weights[0] * 1) / state.weights[1];
    const p1 = fromPlaneCoords(-1, y1);
    const p2 = fromPlaneCoords(1, y2);
    ctx.strokeStyle = "#121212";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  state.points.forEach((point) => {
    const { x, y } = fromPlaneCoords(point.x, point.y);
    ctx.fillStyle = point.label === 1 ? "#118ab2" : "#ef476f";
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
};

const addPoint = (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const { x: px, y: py } = toPlaneCoords(x, y);

  const label = event.shiftKey ? -state.currentClass : state.currentClass;
  state.points.push({ x: px, y: py, label });
  draw();
};

classButtons.forEach((button) => {
  button.addEventListener("click", () => {
    classButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.currentClass = Number.parseInt(button.dataset.class, 10);
  });
});

lrSlider.addEventListener("input", () => {
  state.learningRate = Number.parseFloat(lrSlider.value);
  lrValue.textContent = format(state.learningRate);
});

epochsSlider.addEventListener("input", () => {
  state.epochsPerStep = Number.parseInt(epochsSlider.value, 10);
  epochsValue.textContent = state.epochsPerStep;
});

biasSlider.addEventListener("input", () => {
  state.bias = Number.parseFloat(biasSlider.value);
  biasValue.textContent = format(state.bias);
  draw();
  updateWeightsBox();
  updateFormula();
});

trainButton.addEventListener("click", () => {
  train();
  updateWeightsBox();
  updateFormula();
  draw();
});

resetButton.addEventListener("click", () => {
  state.weights = [0.3, -0.2];
  state.bias = 0;
  state.epoch = 0;
  epochLabel.textContent = "0";
  accuracyLabel.textContent = "0%";
  lossLabel.textContent = "0.00";
  updateWeightsBox();
  updateFormula();
  draw();
});

clearButton.addEventListener("click", () => {
  state.points = [];
  state.epoch = 0;
  epochLabel.textContent = "0";
  accuracyLabel.textContent = "0%";
  lossLabel.textContent = "0.00";
  draw();
});

canvas.addEventListener("click", addPoint);

lrValue.textContent = format(state.learningRate);
epochsValue.textContent = state.epochsPerStep;
biasValue.textContent = format(state.bias);

updateWeightsBox();
updateFormula();
draw();
