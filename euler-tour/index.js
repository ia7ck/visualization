const W = 720, H = 400
const draw = SVG("drawing").size(W, H).style({ border: "solid 1px" })
let nodeGroup = draw.group()
let edgeGroup = nodeGroup.group()
const radius = 12
const ox = radius * 4, oy = radius * 5
const TEXT_SIZE = 14
const BASE_TIMEOUT = 1000
let timeout = BASE_TIMEOUT

const n = randInt(9, 13)

const W2 = W, H2 = 60
const elemWidth = W / (n * 2), elemHeight = H2 * 0.3
const etarray = SVG("array").size(W2, H2).style({ border: "solid 1px" })
const elemGroup = etarray.group().move(elemWidth * 0.5, H2 * 0.35)

let tree = [], graph = []
function tryCreateTree(maxRank) { // rankがmaxRank以下の木を作る
  tree = []
  let rank = []
  for (let i = 0; i < n; i++) {
    tree[i] = []
    rank[i] = 0
  }
  for (let i = 1; i < n; i++) {
    const parent = randInt(0, i), child = i
    tree[parent].push(child)
    rank[child] = rank[parent] + 1
  }
  const rk = rank.reduce((acc, val) => Math.max(acc, val), 0)
  return rk <= maxRank
}
for (let _ = 0; _ < 10; _++) {
  const ok = tryCreateTree(3)
  if (ok) break
}

let pos = traverse(tree)
for (let i = 0; i < n; i++) {
  const node = nodeGroup.group().data({ idx: i }).style({ cursor: "default" })
  node.circle(radius * 2).center(pos[i].x, pos[i].y).fill("white").stroke("black")
  node.text(String(i)).attr({ "text-anchor": "middle" }).font({ family: "Inconsolata", size: TEXT_SIZE }).move(pos[i].x, pos[i].y).dy(-TEXT_SIZE / 1.9)

  node.mouseover(handleNodeSelect)
  node.mouseout(handleNodeSelect)

  let edges = []
  for (let j of tree[i]) {
    edges.push({
      line: edgeGroup.line(pos[i].x, pos[i].y, pos[j].x, pos[j].y).stroke({ width: 1 }),
    })
  }
  graph[i] = { node, edges }
}

function traverse(tree) {
  let cur = 1, pos = []
  const dfs = (i, d) => {
    if (tree[i].length === 0) {
      pos[i] = {
        x: (cur++) * ox,
        y: d * oy,
      }
    } else {
      for (let j of tree[i]) dfs(j, d + 1)
      pos[i] = {
        x: (pos[tree[i][0]].x + pos[tree[i][tree[i].length - 1]].x) / 2,
        y: d * oy,
      }
    }
  }
  dfs(0, 1)
  return pos
}

const rootElement = document.getElementById("drawing")
rootElement.style.pointerEvents = "none" // developer toolが使いづらくなることに気づいた
let elems = []

async function run() {
  const sleep = (ms) => (new Promise(resolve => setTimeout(resolve, ms)))
  const make = (val) => {
    const elem = elemGroup.group().data({ val })
    elem.rect(elemWidth, elemHeight).fill("white").stroke("black").move(elems.length * elemWidth, 0)
    elem.text(String(val)).attr({ "text-anchor": "middle" }).font({ family: "Inconsolata", size: TEXT_SIZE }).move(elems.length * elemWidth + elemWidth / 2, TEXT_SIZE * 0.1)
    return elem
  }
  const eulerTour = async (i) => {
    graph[i].node.first().fill("lightcyan")
    const elem = make(i)
    elem.first().fill("lightcyan")
    elems.push(elem)
    await sleep(timeout)
    graph[i].node.first().fill("white")
    elem.first().fill("white")
    if (tree[i].length > 0) {
      for (let j of tree[i]) {
        await eulerTour(j)
        graph[i].node.first().fill("lightcyan")
        const _elem = make(i)
        _elem.first().fill("lightcyan")
        elems.push(_elem)
        await sleep(timeout)
        graph[i].node.first().fill("white")
        _elem.first().fill("white")
      }
    }
  }
  await eulerTour(0)
  await sleep(500)
  for (let i = 0; i < elems.length + 2; i++) {
    if (i < elems.length) {
      elems[i].first().fill("lightcyan")
    }
    await sleep(100)
    if (i >= 2) {
      elems[i - 2].first().fill("white")
    }
  }
  // 遊びすぎ？
  await sleep(500)
  fillSubtree(0, { fill: "lightcyan", stroke: "darkcyan" })
  fillSubsequence(0, { fill: "lightcyan", stroke: "darkcyan" })
  await sleep(1500)
  fillSubtree(0, { fill: "white", stroke: "black" })
  fillSubsequence(0, { fill: "white", stroke: "black" })
  rootElement.style.pointerEvents = "auto"
}

function handleNodeSelect(ev) {
  const i = this.data("idx")
  const stroke = graph[i].node.first().attr("stroke")
  if (ev.type === "mouseover" && stroke === "black") {
    color = { fill: "lightcyan", stroke: "darkcyan" }
    fillSubtree(i, color)
    fillSubsequence(i, color)
  } else if (ev.type === "mouseout" && stroke !== "black") {
    color = { fill: "white", stroke: "black" }
    fillSubtree(i, color)
    fillSubsequence(i, color)
  }
}

function fillSubtree(root, color) {
  const dfs = (i) => {
    graph[i].node.first().fill(color.fill).stroke(color.stroke)
    for (let { line } of graph[i].edges) line.stroke(color.stroke)
    for (let j of tree[i]) dfs(j)
  }
  dfs(root)
}

function fillSubsequence(val, color) {
  const l = elems.findIndex(elem => elem.data("val") === val)
  const r = elems.length - elems.slice().reverse().findIndex(elem => elem.data("val") === val) - 1
  for (let i = l; i <= r; i++) {
    elems[i].first().fill(color.fill).stroke(color.stroke)
  }
}

function randInt(lb, ub) {
  return Math.floor(Math.random() * (ub - lb)) + lb;
}

const runButton = document.getElementById("run-button")
const speedForm = document.getElementById("speed-form")
runButton.addEventListener("click", (ev) => {
  ev.target.disabled = true
  run()
})
speedForm.addEventListener("change", (ev) => { timeout = BASE_TIMEOUT / (ev.target.value) })