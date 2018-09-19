const W = 800, H = 400;
const draw = SVG("drawing").size(W, H).style({ border: "solid 1px" });
const barWidth = 10, barHightMax = 48;
let barGroup = draw.group().center(W / 3, barHightMax / 2);
const bgHight = barHightMax * 1.1, space = bgHight * 0.2;
let backgroundGroup = barGroup.group();
const BASE_TIMEOUT = 1000;
let timeout = BASE_TIMEOUT;

let n = randInt(10, 25);
let arr = [];
for (let i = 0; i < n; i++) arr[i] = randInt(1, n);
let bars = [];
initialize();

function initialize() {
  draw.clear();
  barGroup = draw.group().center(W / 3, barHightMax / 2); // 謎
  backgroundGroup = barGroup.group();
  bars = [];
  for (let i = 0; i < n; i++) {
    const bar = barGroup.rect(barWidth, arr[i] / n * barHightMax).fill("lightblue").stroke("skyblue").y(-arr[i] / n * barHightMax).dy(barHightMax); // 高さは正規化しとく
    bars[i] = bar.x(barWidth + (i > 0 ? bars[i - 1].x() : 0));
  }
}

const sleep = (ms) => (new Promise(resolve => setTimeout(resolve, ms)));

async function divide(l, r, dep) {
  if (r - l > 1) {
    const m = Math.ceil((l + r) / 2);

    const lw = (m - l) * barWidth;
    for (let i = l; i < m; i++) {
      bars[i].animate({ duration: timeout }).dmove(-lw, barHightMax + space);
    }
    await sleep(timeout * 1.1); // 1.0だとギリギリでたまにバグる
    backgroundGroup.rect(lw + barWidth, bgHight).fill("#F5F5F5").attr({ rx: "1%", ry: "1%" }).move(bars[l].x(), (barHightMax + space) * dep).dmove(-barWidth * 0.5, -barHightMax * 0.05); // 背景の中で要素を縦横中央揃えにする

    await divide(l, m, dep + 1);

    const rw = (r - m) * barWidth;
    for (let i = m; i < r; i++) {
      bars[i].animate({ duration: timeout }).dmove(rw, barHightMax + space);
    }
    await sleep(timeout * 1.1);
    backgroundGroup.rect(rw + barWidth, bgHight).fill("#F5F5F5").attr({ rx: "1%", ry: "1%" }).move(bars[m].x(), (barHightMax + space) * dep).dmove(-barWidth * 0.5, -barHightMax * 0.05);

    if (m - l >= 2 && r - m <= 1) { // うーーーーん size(left)=2, size(right)=1の場合
      bars[r - 1].animate({ duration: timeout }).dy(barHightMax + space);
      await sleep(timeout * 1.1);
      backgroundGroup.rect(barWidth * 2, bgHight).fill("#F5F5F5").attr({ rx: "1%", ry: "1%" }).move(bars[r - 1].x(), (barHightMax + space) * (dep + 1)).dmove(-barWidth * 0.5, -barHightMax * 0.05);
    }

    await divide(m, r, dep + 1);
  }
}

async function conquer(l, r) {
  if (r - l > 1) {
    const m = Math.ceil((l + r) / 2);
    await conquer(l, m);
    await conquer(m, r);
    if (m - l >= 2 && r - m <= 1) { // うーーーーん ここでいいのか
      bars[r - 1].animate({ duration: timeout }).dy(-barHightMax * 1.2);
      await sleep(timeout * 1.1);
    }

    let ret = [], retBars = [], i = l, j = m;
    const xx = bars[l].x() + barWidth * (m - l); // 1つ上のブロックの左端
    while (i < m || j < r) { // two-pointers
      const x = xx + barWidth * ret.length;
      if (i >= m || j >= r) { // どちらかが空
        const k = (i >= m ? j : i);
        bars[k].animate({ duration: timeout }).move(x, bars[k].y() - (barHightMax + space));
        ret.push(arr[k]);
        retBars.push(bars[k]);
        i >= m ? (j += 1) : (i += 1);
      } else {
        const k = (arr[i] <= arr[j] ? i : j);
        bars[k].animate({ duration: timeout }).move(x, bars[k].y() - (barHightMax + space));
        ret.push(arr[k]);
        retBars.push(bars[k]);
        arr[i] <= arr[j] ? (i += 1) : (j += 1);
      }
      await sleep(timeout * 1.1);
    }
    arr.splice(l, r - l, ...ret); // arr[l, r] <- ret
    bars.splice(l, r - l, ...retBars);
  }
}

async function run() {
  backgroundGroup.rect(barWidth * (n + 1), bgHight).fill("white").stroke({ color: "black", width: 0.5 }).x(bars[0].x()).dmove(-barWidth * 0.5, -barHightMax * 0.05);
  await sleep(1000);
  divide(0, n, 1).then(async () => {
    await sleep(2000);
    conquer(0, n).then(async () => {
      await sleep(1000);
      backgroundGroup.clear();
      runButton.disabled = false;
      randomButton.disabled = false;
      permButton.disabled = false;
    });
  });
}

function randInt(lb, ub) {
  return Math.floor(Math.random() * (ub - lb)) + lb;
}

const runButton = document.getElementById("run-button");
const speedForm = document.getElementById("speed-form");
const initForm = document.getElementById("init-form");
const randomButton = initForm.random;
const permButton = initForm.permutation;
runButton.addEventListener("click", (ev) => {
  ev.target.disabled = true;
  randomButton.disabled = true;
  permButton.disabled = true;
  run();
});
speedForm.addEventListener("change", (ev) => { timeout = BASE_TIMEOUT / (ev.target.value) });
randomButton.addEventListener("click", () => {
  n = randInt(10, 25);
  arr = [];
  for (let i = 0; i < n; i++) arr[i] = randInt(1, n);
  initialize();
});
permButton.addEventListener("click", () => {
  n = randInt(10, 25);
  arr = [];
  for (let i = 0; i < n; i++) arr[i] = i + 1;
  for (let i = 0; i < n; i++) {
    const j = randInt(i, n);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  initialize();
});