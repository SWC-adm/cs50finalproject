# Bootstrap Visualizer

## CS50 Final Project

**Name:** Bootstrap Visualizer
**Author:** Kaare Bro Wellnitz
**Course:** CS50x
**Year:** 2025

---

## 🎯 Project Overview

Bootstrap Visualizer is an interactive web application that helps users understand **bootstrap resampling**, **sampling distributions**, and **confidence intervals** for statistical estimators.

The tool is designed primarily for students and applied researchers who want to build intuition about:

* how the bootstrap approximates sampling distributions,
* how uncertainty differs between estimators (mean vs variance),
* and how normal-based and percentile-based confidence intervals compare, especially under skewed distributions.

The application runs entirely in the browser using **HTML, CSS, and JavaScript**, with **Chart.js** for visualization. No backend or external libraries are required beyond Chart.js.

---

## 💡 Motivation

As an applied statistician, I often encounter confusion about:

* what the bootstrap actually does,
* why bootstrap confidence intervals may differ from normal-theory intervals,
* and how estimator variability depends on the underlying data distribution.

Most explanations are either purely mathematical or rely on static plots. This project aims to **bridge theory and intuition** by letting users see bootstrap distributions being built in real time and compare them directly to empirical estimates.

This project was chosen as my CS50 final project because it:

* demonstrates core programming concepts (event handling, state management, visualization),
* has clear educational value,
* and reflects my interest in applied statistics and data analysis.

---

## 🧠 Features

### Data Generation

Users can generate samples from three distributions:

* Normal
* Lognormal (skewed)
* Gamma (2,2)

The sample size can be adjusted using a slider.

---

### Bootstrap Resampling

The app supports bootstrap resampling **with replacement** for two statistics:

* Mean
* Variance (sample variance, *n − 1*)

Users can:

* step through resamples one at a time,
* run many resamples at once,
* or autoplay resampling to see distributions emerge dynamically.

---

### Visualizations

The interface displays:

* Histogram of the original sample
* Bootstrap distribution of the mean
* Bootstrap distribution of the variance

All plots update live as resampling proceeds.

---

### Confidence Intervals

The app computes and compares:

#### Empirical (from original sample)

* Mean
* Variance
* Normal-based 95% CI for the mean
* Normal-based 95% CI for the variance
  *(using a Wald approximation)*

#### Bootstrap-based

* Bootstrap mean of the estimator
* Bootstrap standard deviation
* Normal-based 95% CI
* Percentile-based 95% CI

All results are presented side-by-side in a comparison table.

---

## 🖥️ User Interface & Design

* Responsive layout using CSS Grid and Flexbox
* Works on desktop, tablet, and mobile
* Charts resize dynamically
* Tables scroll horizontally on small screens
* No page reloads — all updates are client-side

---

## ⚙️ Technologies Used

* HTML5
* CSS3
* JavaScript (ES6)
* Chart.js (via CDN)

No backend, frameworks, or databases are used.

---

## 📁 Project Structure

```
/
├── index.html      # Main HTML structure
├── style.css       # Layout and responsive styling
├── script.js       # Application logic and bootstrap implementation
└── README.md       # Project documentation
```

---

## ▶️ How to Run the Project

1. Download or clone the repository.
2. Open `index.html` in any modern web browser.
3. No installation or server is required.

Alternatively, the project can be hosted on **GitHub Pages** as a static site.

---

## 🧪 Design Decisions & Tradeoffs

**Client-side only**
Chosen to keep the project simple, transparent, and easy to run anywhere.

**Chart.js**
Selected for clarity and ease of updating histograms dynamically.

**Normal-based CI for variance**
Implemented using a Wald approximation to allow direct comparison with bootstrap intervals, even though it is known to be imperfect for skewed distributions — this is intentional and educational.

**No hypothesis testing**
The focus is on estimation and uncertainty, not inference decisions.

---

## 🚀 Possible Extensions

Future improvements could include:

* bootstrap for additional statistics (median, regression coefficients),
* BCa confidence intervals,
* uploading user-provided datasets,
* exporting results for teaching use.

---

## ✅ CS50 Requirements Checklist

* ✔ Uses HTML, CSS, and JavaScript
* ✔ Demonstrates non-trivial logic
* ✔ Interactive and dynamic
* ✔ Original and self-designed
* ✔ Clearly documented
* ✔ Runs without external dependencies

---

## 📜 Acknowledgements

* ChatGPT for help on drafting the code, based on my design and educational choices
* Chart.js documentation
* CS50 staff and course materials
* Statistical bootstrap methods introduced by **Efron & Tibshirani**


