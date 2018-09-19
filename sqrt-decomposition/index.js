const W = 800, H = 400;
const draw = SVG("drawing").size(W, H).style({ border: "solid 1px" });
const candGroup = draw.group();
const w = 25, h = 50;
const BASE_TIMEOUT = 1000;
let timeout = BASE_TIMEOUT;

const n = randInt(20, 26);
const D = Math.ceil(Math.sqrt(n));
const pallet = ["#f39700", /*"#e60012",*/ "#9caeb7", "#00a7db", "#009944", "#d7c447", "#9b7cb6", "#00ada9", "#bb641d", "#e85298", "#0079c2", "#6cbb5a", "#b6007a", "#e5171f", "#522886", /*"#0078ba",*/ "#019a66", /*"#e44d93",*/ "#814721", /*"#a9cc51",*/ /*"#ee7b1a",*/ /*"#00a0de"*/];
const bgcolor = "#f5f5f5", stroke = "#0f0f0f";

let q = 0; // クエリが呼ばれた回数
let pos = null; // 選択されたやつ nullなら未選択

let buc = [], val = [];
let cand = [], seq = [];
function build() {
  for (let i = 0; i < D; i++) buc[i] = draw.rect(w * D, h).fill(bgcolor).stroke(stroke).move(w + i * w * D, H * 0.4);
  for (let i = 0; i < n; i++) val[i] = draw.rect(w, h).fill(bgcolor).stroke(stroke).move(w + i * w, H * 0.4 + h);
  for (let i = 0; i < n; i++) {
    cand[i] = candGroup.rect(w, h / 2).fill("white").stroke(stroke).attr({ "stroke-dasharray": 2, cursor: "pointer" }).move(w + i * w, H * 0.4 - h);
    cand[i].data({ pos: i });
    cand[i].mouseover(function () { this.fill(pallet[q]) });
    cand[i].mouseout(function () { if (this.data("pos") !== pos) this.fill("white") });
    cand[i].click(exec);
  }
}

build();

const sleep = (ms) => (new Promise(resolve => setTimeout(resolve, ms)));
async function query(l, r, color) {
  for (let k = 0; k < D; k++) {
    if ((k + 1) * D <= l || r <= k * D) {
      continue;
    } else if (l <= k * D && (k + 1) * D <= r) {
      for (let i = k * D; i < (k + 1) * D; i++) seq[i].animate(timeout).size(w, h).y(H * 0.4);
      await sleep(timeout);
      for (let i = k * D; i < (k + 1) * D; i++) seq[i].remove();
      buc[k].fill(color);
    } else {
      if (buc[k].attr("fill") !== bgcolor) {
        const previousColor = buc[k].attr("fill");
        let tmp = [];
        for (let i = k * D; i < (k + 1) * D; i++) tmp[i] = draw.rect(w, h).fill(previousColor).move(w + i * w, H * 0.4);
        buc[k].fill(bgcolor);
        for (let i = k * D; i < (k + 1) * D; i++) {
          tmp[i].animate(timeout).dy(h);
          await sleep(timeout);
          tmp[i].remove();
          val[i].fill(previousColor);
        }
      }
      const s = Math.max(l, k * D), t = Math.min(r, (k + 1) * D);
      for (let i = s; i < t; i++) {
        seq[i].animate(timeout).size(w, h).y(H * 0.4 + h);
        await sleep(timeout);
        seq[i].remove();
        val[i].fill(color);
      }
    }
  }
  await sleep(timeout);
}

async function exec() {
  if (pos === null) {
    pos = this.data("pos");
  } else {
    candGroup.style({ "pointer-events": "none" });
    candGroup.attr({ visibility: "hidden" });
    pos2 = this.data("pos");
    const l = Math.min(pos, pos2), r = Math.max(pos, pos2);
    cand[pos].fill("white");
    cand[pos2].fill("white");
    for (let j = l; j <= r; j++) seq[j] = draw.rect(w, h / 2).fill(pallet[q]).move(w + j * w, H * 0.4 - h);
    await sleep(timeout);
    for (let j = l; j <= r; j++) seq[j].animate(timeout).dy(h / 2 - 1);
    await sleep(timeout * 1.5);
    await query(l, r + 1, pallet[q]);
    q = (q + 1) % pallet.length;
    seq = [];
    pos = null;
    candGroup.attr({ visibility: "visible" });
    candGroup.style({ "pointer-events": "auto" });
  }
}

function randInt(lb, ub) {
  return Math.floor(Math.random() * (ub - lb)) + lb;
}

const speedForm = document.getElementById("speed-form");
speedForm.addEventListener("change", (ev) => { timeout = BASE_TIMEOUT / parseInt(ev.target.value, 10) });