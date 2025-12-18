// =======================
// Global state
// =======================

let sample = [];            // original data
let bootStats = [];         // bootstrap means
let sampleChart = null;     // Chart.js instance for original sample
let bootstrapChart = null;  // Chart.js instance for bootstrap histogram
let autoIntervalId = null;  // for auto-play


// =======================
// On page load
// =======================

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


// =======================
// Data generation
// =======================

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
    else if (dist === "t") arr.push(randt(2)); // heavy-tailed t (df=2)
    else if (dist === "gamma") arr.push(gamma(2, 2));  // Gamma distribution (shape=2, scale=2)
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

// Approximate t(df) - using Chi-squared distribution for heavy-tail demo
function randt(df) {
  if (df <= 2) {
    console.error("Degrees of freedom must be greater than 2 for stability");
    return 0;
  }

  const normal = randn();  // Standard normal
  const chiSquared = Math.random() * df;  // Generate a chi-squared random variable

  return normal / Math.sqrt(chiSquared / df); // Return the ratio
}

// Gamma distribution (shape=2, scale=2) via Inverse Transform Sampling
function gamma(shape, scale) {
  if (shape <= 0 || scale <= 0) {
    console.error("Invalid parameters for gamma distribution");
    return 0;
  }
  
  // This uses the Knuth method for generating Gamma values with shape = 2
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  let x, v;

  do {
    do {
      x = randn();  // Generate standard normal random variable
      v = 1 + c * x;
    } while (v <= 0);  // Reject values that would make the gamma negative

    v = v * v * v;
    let u = Math.random();
    if (u < 1 - 0.0331 * x * x * x * x || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return scale * d * v;  // Return scaled value
    }
  } while (true);
}

// =======================
// Histogram helper
// =======================

// Create histogram data given an array of values and a chosen number of bins
function makeHistogramData(values, numBins = 20) {
  if (!values || values.length === 0) {
    return { bins: [], counts: [] };
  }

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  // Avoid zero width if all values equal
  if (minVal === maxVal) {
    const bins = [`${minVal.toFixed(2)}`];
    const counts = [values.length];
    return { bins, counts };
  }

  const binWidth = (maxVal - minVal) / numBins;
  const bins = [];
  const counts = new Array(numBins).fill(0);

  // Construct bin labels
  for (let i = 0; i < numBins; i++) {
    const left = minVal + i * binWidth;
    const right = minVal + (i + 1) * binWidth;
    bins.push(`${left.toFixed(2)} – ${right.toFixed(2)}`);
  }

  // Count values into bins
  values.forEach(v => {
    let idx = Math.floor((v - minVal) / binWidth);
    if (idx === numBins) idx = numBins - 1; // edge case for max value
    counts[idx]++;
  });

  return { bins, counts };
}

// =======================
// Chart initialization
// =======================

function initCharts() {
  const sampleCtx = document.getElementById("sample-chart").getContext("2d");
  const bootstrapCtx = document.getElementById("bootstrap-chart").getContext("2d");

  sampleChart = new Chart(sampleCtx, {
    type: "bar",
    data: {
      labels: [],
      datasets: [{
        label: "Sample values",
        data: [],
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,  // This ensures it resizes as the container resizes
      scales: {
        x: { ticks: { maxRotation: 45, minRotation: 45 } },
        y: { beginAtZero: true }
      }
    }
  });

  bootstrapChart = new Chart(bootstrapCtx, {
    type: "bar",
    data: {
      labels: [],
      datasets: [{
        label: "Bootstrap means",
        data: [],
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,  // This ensures it resizes as the container resizes
      scales: {
        x: { ticks: { maxRotation: 45, minRotation: 45 } },
        y: { beginAtZero: true }
      }
    }
  });
}

// =======================
// Update charts
// =======================
...
