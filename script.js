// Global state

// State
let sample = [];         // original data
let bootStats = [];      // bootstrap means
let sampleChart = null;  // Chart.js instance for original sample
let bootstrapChart = null; // Chart.js instance for bootstrap histogram
let autoIntervalId = null;

// On page load
document.addEventListener("DOMContentLoaded", () => {
  // Wire up event listeners
  document.getElementById("n-slider").addEventListener("input", onNChange);
  document.getElementById("generate-sample-btn").addEventListener("click", onGenerateSample);
  document.getElementById("step-btn").addEventListener("click", () => bootstrapOnce());
  document.getElementById("run-many-btn").addEventListener("click", onRunMany);
  document.getElementById("reset-btn").addEventListener("click", resetBootstrap);
  document.getElementById("auto-start-btn").addEventListener("click", startAutoBootstrap);
  document.getElementById("auto-stop-btn").addEventListener("click", stopAutoBootstrap);

  // Init empty charts
  initCharts();
});

// Data generation
function onNChange(e) {
  const n = e.target.value;
  document.getElementById("n-value").textContent = n;
}

function onGenerateSample() {
  const dist = document.getElementById("dist-select").value;
  const n = parseInt(document.getElementById("n-slider").value, 10);
  sample = generateSample(dist, n);
  resetBootstrap(); // clear old bootstrap results

  updateSampleSummary();
  updateSampleChart();
}

function generateSample(dist, n) {
  const arr = [];
  for (let i = 0; i < n; i++) {
    if (dist === "normal") arr.push(randn());
    else if (dist === "lognormal") arr.push(Math.exp(randn()));
    else if (dist === "t") arr.push(randt(2)); // heavy-tailed
    else if (dist === "bimodal") {
      if (Math.random() < 0.5) arr.push(randn() - 2);
      else arr.push(randn() + 3);
    }
  }
  return arr;
}

// Standard normal via Box-Muller
function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Cheap t(df) via normal / sqrt(chi2/df) if you like, or just say "approximate heavy-tail"
function randt(df) {
  // For MVP you can even fake it with normal * big factor or implement properly later.
  return randn() / Math.sqrt(Math.random() * (df / (df - 2)));
}

// Bootstrap logic
function bootstrapOnce() {
  if (!sample || sample.length === 0) return;
  const n = sample.length;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * n);
    sum += sample[idx];
  }
  const mean = sum / n;
  bootStats.push(mean);
  updateBootstrapResults();
  updateBootstrapChart();
}

function onRunMany() {
  const k = parseInt(document.getElementById("resamples-input").value, 10) || 0;
  for (let i = 0; i < k; i++) {
    bootstrapOnce();
  }
}

function resetBootstrap() {
  bootStats = [];
  updateBootstrapResults();
  updateBootstrapChart();
}

// Auto-play
function startAutoBootstrap() {
  if (autoIntervalId || sample.length === 0) return;
  autoIntervalId = setInterval(() => bootstrapOnce(), 50);
}

function stopAutoBootstrap() {
  if (!autoIntervalId) return;
  clearInterval(autoIntervalId);
  autoIntervalId = null;
}

// Updating stats and CIs
function updateBootstrapResults() {
  const nResamples = bootStats.length;
  document.getElementById("n-resamples").textContent = nResamples;

  if (nResamples === 0) {
    document.getElementById("boot-mean").textContent = "-";
    document.getElementById("boot-sd").textContent = "-";
    document.getElementById("boot-ci-percentile").textContent = "[ -, - ]";
    document.getElementById("boot-ci-normal").textContent = "[ -, - ]";
    updateInterpretationText();
    return;
  }

  const mean = arrayMean(bootStats);
  const sd = arraySD(bootStats);
  const [p2_5, p97_5] = percentileCI(bootStats, 0.025, 0.975);
  const normalLow = mean - 1.96 * sd;
  const normalHigh = mean + 1.96 * sd;

  document.getElementById("boot-mean").textContent = mean.toFixed(3);
  document.getElementById("boot-sd").textContent = sd.toFixed(3);
  document.getElementById("boot-ci-percentile").textContent =
    `[ ${p2_5.toFixed(3)}, ${p97_5.toFixed(3)} ]`;
  document.getElementById("boot-ci-normal").textContent =
    `[ ${normalLow.toFixed(3)}, ${normalHigh.toFixed(3)} ]`;

  updateInterpretationText();
}

function arrayMean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function arraySD(arr) {
  const m = arrayMean(arr);
  const varSum = arr.reduce((acc, x) => acc + (x - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(varSum);
}

function percentileCI(arr, low, high) {
  const sorted = [...arr].sort((a, b) => a - b);
  const n = sorted.length;
  const loIdx = Math.floor(low * (n - 1));
  const hiIdx = Math.floor(high * (n - 1));
  return [sorted[loIdx], sorted[hiIdx]];
}
