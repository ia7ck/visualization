const n = randInt(10, 15)
let nodes = new vis.DataSet([...Array(n).keys()].map((i) => ({ id: i })))
let edges = new vis.DataSet()
let weightedEdges = []

function build() {
  for (let i = 1; i < n; i++) {
    addEdge(randInt(0, i), i, randInt(1, 10))
  }
  for (let _ = 0; _ < Math.ceil(n * 0.7); _++) {
    const v = randInt(1, n), u = randInt(0, v)
    let found = false
    edges.forEach((edge) => { found = found || (edge.from === u && edge.to === v) })
    if (found === false) { addEdge(u, v, randInt(1, 10)) }
  }
  function addEdge(u, v, weight) {
    const addedIDs = edges.add({ from: u, to: v, label: (String)(weight) })
    weightedEdges.push({ id: addedIDs[0], weight }) // 1個addしたので、先頭にそのidが入ってる
  }
}
function randInt(lb, ub) {
  return Math.floor(Math.random() * (ub - lb)) + lb;
}

build()

const data = { nodes, edges }
const options = {
  nodes: { color: { background: "whitesmoke", border: "lightgray" }, chosen: { node: false }, shape: "dot", size: 10 },
  edges: { font: { color: "#505050", size: 18 }, color: { color: "lightgray", inherit: false }, chosen: { edge: false } }, // inherit:false ... 端についてる頂点の色とかを引き継がない
  physics: { enabled: false },
}
const container = document.getElementById("main")
const network = new vis.Network(container, data, options)

class SkewNode {
  constructor({ idx, from, to, val }) {
    this.left = null
    this.right = null
    this.idx = idx
    this.from = from
    this.to = to
    this.val = val
  }
}
class SkewHeap {
  constructor() {
    this.root = null
  }
  meld(h1, h2) {
    if (h1 === null) return h2
    if (h2 === null) return h1
    if (h1.val > h2.val) {
      [h1, h2] = [h2, h1]
    }
    h1.right = this.meld(h1.right, h2);
    [h1.left, h1.right] = [h1.right, h1.left]
    return h1
  }
  insert(elem) {
    this.root = this.meld(this.root, new SkewNode(elem))
  }
  front() {
    return this.root
  }
  remove() {
    this.root = this.meld(this.root.left, this.root.right)
  }
  empty() {
    return this.root === null
  }
}

const sleep = (ms) => (new Promise(resolve => setTimeout(resolve, ms)))
const BASE_TIMEOUT = 1000
let timeout = BASE_TIMEOUT;
(async () => {
  let g = new Array(n)
  for (let i = 0; i < n; i++) g[i] = []
  edges.forEach((edge) => {
    const u = edge.from, v = edge.to, weight = parseInt(edge.label, 10)
    g[u].push({ from: u, to: v, weight: weight, id: edge.id })
    g[v].push({ from: v, to: u, weight: weight, id: edge.id })
  })
  let visited = new Array(n).fill(false)
  let h = new SkewHeap()
  nodes.update({
    id: 0,
    color: { background: "lightcyan", border: "skyblue" },
    borderWidth: 1.5,
  })
  visited[0] = true
  g[0].forEach((edge) => {
    h.insert({ idx: edge.id, from: edge.from, to: edge.to, val: edge.weight })
  })
  while (h.empty() === false) {
    const edge = h.front(); h.remove()
    edges.update({
      id: edge.idx,
      color: { color: "lightblue" },
      width: 2,
    })
    await sleep(timeout)
    if (visited[edge.to] === false) {
      edges.update({
        id: edge.idx,
        color: { color: "skyblue" },
        width: 2,
      })
      nodes.update({
        id: edge.to,
        color: { background: "lightcyan", border: "skyblue" },
        borderWidth: 1.5,
      })
      visited[edge.to] = true
      g[edge.to].forEach((_edge) => {
        if (visited[_edge.to] === false) {
          h.insert({ idx: _edge.id, from: _edge.from, to: _edge.to, val: _edge.weight })
        }
      })
      await sleep(timeout)
    } else {
      edges.update({
        id: edge.idx,
        color: { color: "lightcoral" },
      })
      nodes.update({
        id: edge.from,
        color: { background: "mistyrose", border: "lightcoral" },
      })
      nodes.update({
        id: edge.to,
        color: { background: "mistyrose", border: "lightcoral" },
      })
      await sleep(timeout)
      nodes.update({
        id: edge.from,
        color: { background: "lightcyan", border: "skyblue" },
      })
      nodes.update({
        id: edge.to,
        color: { background: "lightcyan", border: "skyblue" },
      })
      edges.remove(edge.idx)
      await sleep(timeout)
    }
  }
})()

document.getElementById("speed").addEventListener("change", (ev) => {
  const val = parseInt(ev.target.value, 10)
  if (Number.isInteger(val)) {
    if (val === 1 || val === 2 || val === 4) {
      timeout = BASE_TIMEOUT / val
    }
  }
})