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

let data = { nodes, edges }
const options = {
  nodes: { color: { background: "whitesmoke", border: "lightgray" }, chosen: { node: false }, shape: "dot", size: 10 },
  edges: { font: { color: "#505050", size: 18 }, color: { color: "lightgray", inherit: false }, chosen: { edge: false } },
  physics: { enabled: false },
}
const container = document.getElementById("main")
const network = new vis.Network(container, data, options)

const sleep = (ms) => (new Promise(resolve => setTimeout(resolve, ms)))
const BASE_TIMEOUT = 1000;
let timeout = BASE_TIMEOUT;
(async () => {
  weightedEdges.sort((l, r) => (l.weight - r.weight))
  let g = new Array(n)
  for (let i = 0; i < n; i++) g[i] = []
  // let removalEdgeIDs = []
  for (let i = 0; i < weightedEdges.length; i++) {
    const edge = edges.get(weightedEdges[i].id)
    edges.update({
      id: edge.id,
      color: { color: "lightblue" },
      width: 2,
    })
    await sleep(timeout)
    const visited = new Array(n).fill(false)
    const cycleIDs = getCycle(edge.from, edge.from, edge.to, visited, edge.id)
    if (cycleIDs.length === 0) {
      g[edge.from].push({ to: edge.to, id: edge.id })
      g[edge.to].push({ to: edge.from, id: edge.id })
      edges.update({
        id: edge.id,
        color: { color: "skyblue" },
        width: 2,
      })
      nodes.update({
        id: edge.from,
        color: { background: "lightcyan", border: "skyblue" },
        borderWidth: 1.5,
      })
      nodes.update({
        id: edge.to,
        color: { background: "lightcyan", border: "skyblue" },
        borderWidth: 1.5,
      })
      await sleep(timeout)
    } else {
      edges.update(cycleIDs.map((id) => ({ id, color: { color: "lightcoral" } })))
      let nodeSet = new Set()
      cycleIDs.forEach((id) => {
        const _edge = edges.get(id)
        nodeSet.add(_edge.from)
        nodeSet.add(_edge.to)
      })
      nodes.update([...nodeSet].map((id) => ({ id, color: { background: "mistyrose", border: "lightcoral" } })))
      await sleep(timeout)
      edges.update(cycleIDs.map((id) => ({ id, color: { color: "skyblue" } })))
      nodes.update([...nodeSet].map((id) => ({ id, color: { background: "lightcyan", border: "skyblue" } })))
      edges.remove(edge.id)
      await sleep(timeout)
    }
  }
  function getCycle(i, s, t, visited, stID) {
    if (i === t) {
      return [stID]
    } else {
      visited[i] = true
      for (let j = 0; j < g[i].length; j++) {
        const nxt = g[i][j].to;
        if (visited[nxt] === false) {
          const path = getCycle(nxt, s, t, visited, stID)
          if (path.length > 0) {
            return path.concat(g[i][j].id)
          }
        }
      }
      return []
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