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

// Generate Gamma distribution (shape = 2, scale = 2) via Exponential sum method
function gamma(shape, scale) {
  if (shape !== 2) {
    console.error("This method only supports shape = 2");
    return 0;
  }
  // Sum two exponential random variables with rate 1/scale
  return scale * (-Math.log(Math.random()) - Math.log(Math.random()));
}

// Generate t-distribution (df = 2) via standard normal / sqrt(chi-squared/df)
function randt(df) {
  if (df <= 2) {
    console.error("Degrees of freedom must be greater than 2 for stability");
    return 0;
  }

  // Generate a normal random variable (N(0, 1))
  const normal = randn();

  // Generate a chi-squared random variable with df = 2
  const chiSquared = Math.random() * df;

  // Return the t-distributed variable: standard normal / sqrt(chi-squared / df)
  return normal / Math.sqrt(chiSquared / df);
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

function updateSampleChart() {
  if (!sample || sample.length === 0) {
    sampleChart.data.labels = [];
    sampleChart.data.datasets[0].data = [];
    sampleChart.update();
    return;
  }

  const { bins, counts } = makeHistogramData(sample, 20);

  sampleChart.data.labels = bins;
  sampleChart.data.datasets[0].data = counts;
  sampleChart.update();
}

function updateBootstrapChart() {
  if (!bootStats || bootStats.length === 0) {
    bootstrapChart.data.labels = [];
    bootstrapChart.data.datasets[0].data = [];
    bootstrapChart.update();
    return;
  }

  const { bins, counts } = makeHistogramData(bootStats, 20);

  bootstrapChart.data.labels = bins;
  bootstrapChart.data.datasets[0].data = counts;
  bootstrapChart.update();
}


// =======================
// Bootstrap logic
// =======================

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


// =======================
// Auto-play
// =======================

function startAutoBootstrap() {
  if (autoIntervalId || sample.length === 0) return;
  autoIntervalId = setInterval(() => bootstrapOnce(), 50);
}

function stopAutoBootstrap() {
  if (!autoIntervalId) return;
  clearInterval(autoIntervalId);
  autoIntervalId = null;
}


// =======================
// Updating stats and CIs
// =======================

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
  if (arr.length < 2) return 0;
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


// =======================
// Sample summary & interpretation
// =======================

function updateSampleSummary() {
  const n = sample.length;
  document.getElementById("sample-n").textContent = n;

  if (n === 0) {
    document.getElementById("sample-mean").textContent = "-";
    document.getElementById("sample-median").textContent = "-";
    return;
  }

  const mean = arrayMean(sample);
  const sorted = [...sample].sort((a, b) => a - b);
  const mid = Math.floor(n / 2);
  let median;
  if (n % 2 === 0) {
    median = (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    median = sorted[mid];
  }

  document.getElementById("sample-mean").textContent = mean.toFixed(3);
  document.getElementById("sample-median").textContent = median.toFixed(3);
}

function updateInterpretationText() {
  const nResamples = bootStats.length;
  const interpretation = document.getElementById("interpretation");

  if (sample.length === 0) {
    interpretation.innerHTML = "<p>Generate a sample to get started.</p>";
    return;
  }

  if (nResamples === 0) {
    interpretation.innerHTML =
      "<p>You have a single sample. Bootstrap will approximate the sampling distribution of the mean by resampling with replacement from this sample.</p>";
  } else if (nResamples < 30) {
    interpretation.innerHTML =
      "<p>With only a few bootstrap resamples, the bootstrap distribution is still rough and the confidence intervals may jump around quite a bit.</p>";
  } else if (nResamples < 200) {
    interpretation.innerHTML =
      "<p>As the number of bootstrap resamples grows, the distribution of bootstrap means starts to stabilize, giving more stable estimates of the mean and its confidence interval.</p>";
  } else {
    interpretation.innerHTML =
      "<p>With many bootstrap resamples, the bootstrap distribution provides a good approximation of the sampling distribution of the mean. Compare the percentile-based and normal-based intervals, especially for skewed data.</p>";
  }
}
