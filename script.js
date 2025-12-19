// =======================
// Global state
// =======================

let sample = [];
let bootMeans = [];
let bootVars = [];

let sampleChart = null;
let bootstrapMeanChart = null;
let bootstrapVarChart = null;

let autoIntervalId = null;


// =======================
// DOM helpers
// =======================

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}


// =======================
// On page load
// =======================

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("n-slider")?.addEventListener("input", onNChange);
  document.getElementById("generate-sample-btn")?.addEventListener("click", onGenerateSample);

  document.getElementById("step-btn")?.addEventListener("click", () => bootstrapOnce());
  document.getElementById("run-many-btn")?.addEventListener("click", onRunMany);
  document.getElementById("reset-btn")?.addEventListener("click", resetBootstrap);

  document.getElementById("auto-start-btn")?.addEventListener("click", startAutoBootstrap);
  document.getElementById("auto-stop-btn")?.addEventListener("click", stopAutoBootstrap);

  initCharts();
});


// =======================
// Data generation
// =======================

function onNChange(e) {
  setText("n-value", e.target.value);
}

function onGenerateSample() {
  const dist = document.getElementById("dist-select")?.value;
  const n = parseInt(document.getElementById("n-slider")?.value || "0", 10);

  sample = generateSample(dist, n);

  resetBootstrap(); // clears bootstrap arrays + updates UI

  updateSampleOutputs();
  updateSampleChart();
}

function generateSample(dist, n) {
  const arr = [];
  for (let i = 0; i < n; i++) {
    if (dist === "normal") arr.push(randn());
    else if (dist === "lognormal") arr.push(Math.exp(randn()));
    else if (dist === "gamma") arr.push(gamma22());
    else arr.push(randn());
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

// Gamma(2,2) = sum of two Exp(scale=2)
function gamma22() {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  const e1 = -2 * Math.log(u1);
  const e2 = -2 * Math.log(u2);
  return e1 + e2;
}


// =======================
// Histogram helper
// =======================

function makeHistogramData(values, numBins = 20) {
  if (!values || values.length === 0) return { bins: [], counts: [] };

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  if (minVal === maxVal) return { bins: [`${minVal.toFixed(3)}`], counts: [values.length] };

  const binWidth = (maxVal - minVal) / numBins;
  const bins = [];
  const counts = new Array(numBins).fill(0);

  for (let i = 0; i < numBins; i++) {
    const left = minVal + i * binWidth;
    const right = minVal + (i + 1) * binWidth;
    bins.push(`${left.toFixed(3)} – ${right.toFixed(3)}`);
  }

  values.forEach(v => {
    let idx = Math.floor((v - minVal) / binWidth);
    if (idx === numBins) idx = numBins - 1;
    counts[idx]++;
  });

  return { bins, counts };
}


// =======================
// Charts
// =======================

function initCharts() {
  const sampleCanvas = document.getElementById("sample-chart");
  const meanCanvas = document.getElementById("bootstrap-chart");
  const varCanvas = document.getElementById("bootstrap-var-chart");

  if (sampleCanvas) {
    sampleChart = new Chart(sampleCanvas.getContext("2d"), {
      type: "bar",
      data: { labels: [], datasets: [{ label: "Sample values", data: [] }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  if (meanCanvas) {
    bootstrapMeanChart = new Chart(meanCanvas.getContext("2d"), {
      type: "bar",
      data: { labels: [], datasets: [{ label: "Bootstrap means", data: [] }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  if (varCanvas) {
    bootstrapVarChart = new Chart(varCanvas.getContext("2d"), {
      type: "bar",
      data: { labels: [], datasets: [{ label: "Bootstrap variances", data: [] }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}

function updateSampleChart() {
  if (!sampleChart) return;

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

function updateBootstrapMeanChart() {
  if (!bootstrapMeanChart) return;

  if (!bootMeans || bootMeans.length === 0) {
    bootstrapMeanChart.data.labels = [];
    bootstrapMeanChart.data.datasets[0].data = [];
    bootstrapMeanChart.update();
    return;
  }

  const { bins, counts } = makeHistogramData(bootMeans, 20);
  bootstrapMeanChart.data.labels = bins;
  bootstrapMeanChart.data.datasets[0].data = counts;
  bootstrapMeanChart.update();
}

function updateBootstrapVarChart() {
  if (!bootstrapVarChart) return;

  if (!bootVars || bootVars.length === 0) {
    bootstrapVarChart.data.labels = [];
    bootstrapVarChart.data.datasets[0].data = [];
    bootstrapVarChart.update();
    return;
  }

  const { bins, counts } = makeHistogramData(bootVars, 20);
  bootstrapVarChart.data.labels = bins;
  bootstrapVarChart.data.datasets[0].data = counts;
  bootstrapVarChart.update();
}


// =======================
// Bootstrap logic
// =======================

function bootstrapOnce() {
  if (!sample || sample.length === 0) return;

  const n = sample.length;
  const resample = new Array(n);

  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * n);
    resample[i] = sample[idx];
  }

  const m = arrayMean(resample);
  const v = arrayVarSample(resample);

  bootMeans.push(m);
  bootVars.push(v);

  updateBootstrapOutputs();
  updateBootstrapMeanChart();
  updateBootstrapVarChart();
}

function onRunMany() {
  const k = parseInt(document.getElementById("resamples-input")?.value || "0", 10) || 0;
  for (let i = 0; i < k; i++) bootstrapOnce();
}

function resetBootstrap() {
  bootMeans = [];
  bootVars = [];

  updateBootstrapOutputs();
  updateBootstrapMeanChart();
  updateBootstrapVarChart();
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
// Stats helpers
// =======================

function arrayMean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function arrayVarSample(arr) {
  const n = arr.length;
  if (n < 2) return 0;
  const m = arrayMean(arr);
  const ss = arr.reduce((acc, x) => acc + (x - m) ** 2, 0);
  return ss / (n - 1);
}

function arraySDSample(arr) {
  return Math.sqrt(arrayVarSample(arr));
}

function percentileCI(arr, low, high) {
  const sorted = [...arr].sort((a, b) => a - b);
  const n = sorted.length;
  const loIdx = Math.floor(low * (n - 1));
  const hiIdx = Math.floor(high * (n - 1));
  return [sorted[loIdx], sorted[hiIdx]];
}


// =======================
// Empirical outputs to table
// =======================

function updateSampleOutputs() {
  const n = sample.length;
  setText("sample-n", n);

  if (n === 0) {
    setText("cmp-mean-emp", "-");
    setText("cmp-var-emp", "-");
    setText("cmp-ci-mean-normal-emp", "[ -, - ]");
    setText("cmp-ci-var-normal-emp", "[ -, - ]");
    setText("cmp-ci-mean-pct-emp", "-");
    setText("cmp-ci-var-pct-emp", "-");
    return;
  }

  const mean = arrayMean(sample);
  const variance = arrayVarSample(sample);
  const sd = Math.sqrt(variance);

  // Normal-based CI for mean: mean ± 1.96 * (sd/sqrt(n))
  const seMean = sd / Math.sqrt(n);
  const meanLo = mean - 1.96 * seMean;
  const meanHi = mean + 1.96 * seMean;

  // Normal-based CI for variance (Wald approximation):
  // SE(S^2) ≈ S^2 * sqrt(2/(n-1))
  const seVar = variance * Math.sqrt(2 / (n - 1));
  const varLo = variance - 1.96 * seVar;
  const varHi = variance + 1.96 * seVar;

  setText("cmp-mean-emp", mean.toFixed(3));
  setText("cmp-var-emp", variance.toFixed(3));
  setText("cmp-ci-mean-normal-emp", `[ ${meanLo.toFixed(3)}, ${meanHi.toFixed(3)} ]`);
  setText("cmp-ci-var-normal-emp", `[ ${varLo.toFixed(3)}, ${varHi.toFixed(3)} ]`);

  // Percentile CI rows: empirical column should be "-" (already)
  setText("cmp-ci-mean-pct-emp", "-");
  setText("cmp-ci-var-pct-emp", "-");
}


// =======================
// Bootstrap outputs to table
// =======================

function updateBootstrapOutputs() {
  const B = bootMeans.length;
  setText("n-resamples", B);

  if (B === 0) {
    setText("cmp-mean-boot", "-");
    setText("cmp-var-boot", "-");
    setText("cmp-ci-mean-normal-boot", "[ -, - ]");
    setText("cmp-ci-var-normal-boot", "[ -, - ]");
    setText("cmp-ci-mean-pct-boot", "[ -, - ]");
    setText("cmp-ci-var-pct-boot", "[ -, - ]");
    updateInterpretationText();
    return;
  }

  // Mean bootstrap summary
  const bootMean = arrayMean(bootMeans);
  const bootMeanSD = arraySDSample(bootMeans);
  const [mLo, mHi] = percentileCI(bootMeans, 0.025, 0.975);
  const mNLo = bootMean - 1.96 * bootMeanSD;
  const mNHi = bootMean + 1.96 * bootMeanSD;

  // Variance bootstrap summary
  const bootVar = arrayMean(bootVars);
  const bootVarSD = arraySDSample(bootVars);
  const [vLo, vHi] = percentileCI(bootVars, 0.025, 0.975);
  const vNLo = bootVar - 1.96 * bootVarSD;
  const vNHi = bootVar + 1.96 * bootVarSD;

  setText("cmp-mean-boot", bootMean.toFixed(3));
  setText("cmp-var-boot", bootVar.toFixed(3));

  setText("cmp-ci-mean-normal-boot", `[ ${mNLo.toFixed(3)}, ${mNHi.toFixed(3)} ]`);
  setText("cmp-ci-var-normal-boot", `[ ${vNLo.toFixed(3)}, ${vNHi.toFixed(3)} ]`);

  setText("cmp-ci-mean-pct-boot", `[ ${mLo.toFixed(3)}, ${mHi.toFixed(3)} ]`);
  setText("cmp-ci-var-pct-boot", `[ ${vLo.toFixed(3)}, ${vHi.toFixed(3)} ]`);

  updateInterpretationText();
}


// =======================
// Interpretation text
// =======================

function updateInterpretationText() {
  const B = bootMeans.length;

  if (sample.length === 0) {
    setHTML("interpretation", "<p>Generate a sample to get started.</p>");
    return;
  }

  if (B === 0) {
    setHTML("interpretation",
      "<p>Click <strong>Step</strong> or <strong>Run N</strong> to build bootstrap distributions for the mean and variance.</p>"
    );
  } else if (B < 30) {
    setHTML("interpretation",
      "<p>With few resamples, histograms are noisy and intervals can jump around.</p>"
    );
  } else if (B < 200) {
    setHTML("interpretation",
      "<p>As resamples increase, the bootstrap distributions stabilize and the percentile intervals become more consistent.</p>"
    );
  } else {
    setHTML("interpretation",
      "<p>With many resamples, compare percentile vs normal-based intervals. Differences can be more noticeable for skewed data (lognormal/gamma).</p>"
    );
  }
}
