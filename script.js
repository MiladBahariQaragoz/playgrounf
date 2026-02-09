const state = {
  inputs: [0, 0, 0],
  weights: [1, 1, 1],
  bias: 0,
  threshold: 1,
};

const inputButtons = Array.from(document.querySelectorAll(".toggle"));
const inputDisplays = Array.from(document.querySelectorAll("[data-input-display]"));
const weightSliders = Array.from(document.querySelectorAll("[data-weight]"));
const weightValues = Array.from(document.querySelectorAll("[data-weight-value]"));
const biasSlider = document.getElementById("bias");
const biasValue = document.getElementById("biasValue");
const thresholdSlider = document.getElementById("threshold");
const thresholdValue = document.getElementById("thresholdValue");
const sumValue = document.getElementById("sumValue");
const thresholdBadge = document.getElementById("thresholdBadge");
const outputDisplay = document.getElementById("outputDisplay");
const outputValue = document.getElementById("outputValue");
const outputSub = document.getElementById("outputSub");
const statusCard = document.getElementById("statusCard");
const neuron = document.querySelector(".neuron");
const wires = Array.from(document.querySelectorAll(".wire"));
const formulaText = document.getElementById("formulaText");

const formatNumber = (value) => value.toFixed(1);

const computeOutput = () => {
  const weightedSum = state.inputs.reduce(
    (sum, input, index) => sum + input * state.weights[index],
    0
  );
  const total = weightedSum + state.bias;
  const output = total >= state.threshold ? 1 : 0;

  return { weightedSum, total, output };
};

const updateFormula = (total, output) => {
  const terms = state.inputs
    .map((input, index) => `${input} × ${formatNumber(state.weights[index])}`)
    .join(" + ");
  formulaText.textContent = `sum = ${terms} + ${formatNumber(state.bias)} = ${formatNumber(
    total
  )} → output = ${output}`;
};

const updateView = () => {
  const { weightedSum, total, output } = computeOutput();

  sumValue.textContent = formatNumber(total);
  thresholdBadge.textContent = `θ = ${formatNumber(state.threshold)}`;
  outputDisplay.textContent = output;
  outputValue.textContent = output;
  outputSub.textContent = output === 1 ? "Active" : "Inactive";
  statusCard.classList.toggle("active", output === 1);
  neuron.classList.toggle("active", output === 1);

  inputButtons.forEach((button, index) => {
    button.classList.toggle("active", state.inputs[index] === 1);
  });

  inputDisplays.forEach((display, index) => {
    display.textContent = state.inputs[index];
  });

  wires.forEach((wire, index) => {
    const isActive = index === 3 ? output === 1 : state.inputs[index] === 1;
    wire.classList.toggle("active", isActive);
  });

  updateFormula(total, output);
};

const setWeightValue = (index, value) => {
  const numericValue = Number.parseFloat(value);
  state.weights[index] = numericValue;
  const display = weightValues.find((item) => item.dataset.weightValue === `${index}`);
  if (display) {
    display.textContent = formatNumber(numericValue);
  }
};

inputButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const index = Number.parseInt(button.dataset.input, 10);
    state.inputs[index] = state.inputs[index] === 1 ? 0 : 1;
    updateView();
  });
});

weightSliders.forEach((slider) => {
  slider.addEventListener("input", (event) => {
    const index = Number.parseInt(event.target.dataset.weight, 10);
    setWeightValue(index, event.target.value);
    updateView();
  });
});

biasSlider.addEventListener("input", (event) => {
  state.bias = Number.parseFloat(event.target.value);
  biasValue.textContent = formatNumber(state.bias);
  updateView();
});

thresholdSlider.addEventListener("input", (event) => {
  state.threshold = Number.parseFloat(event.target.value);
  thresholdValue.textContent = formatNumber(state.threshold);
  updateView();
});

const init = () => {
  weightSliders.forEach((slider, index) => {
    setWeightValue(index, slider.value);
  });
  biasValue.textContent = formatNumber(state.bias);
  thresholdValue.textContent = formatNumber(state.threshold);
  updateView();
};

init();
