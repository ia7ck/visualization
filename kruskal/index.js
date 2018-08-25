const n = randInt(10, 15)
let nodes = new vis.DataSet([...Array(n).keys()].map((i) => ({ id: i })))

let edges = new vis.DataSet()
let weightedEdges = []
for (let i = 1; i < n; i++) {
  const weight = randInt(1, 10)
  const addedIDs = edges.add({ from: randInt(0, i), to: i, label: (String)(weight) })
  weightedEdges.push({ id: addedIDs[0], weight })
}
for (let _ = 0; _ < Math.ceil(n * 0.7); _++) {
  const v = randInt(1, n), u = randInt(0, v)
  let found = false
  edges.forEach((e) => {
    if (e.from === u && e.to === v) {
      found = true
    }
  })
  if (found === false) {
    const weight = randInt(1, 10)
    const addedIDs = edges.add({ from: u, to: v, label: (String)(weight) })
    weightedEdges.push({ id: addedIDs[0], weight })
  }
}
let data = { nodes, edges }
const options = {
  nodes: { color: { background: "whitesmoke", border: "lightgray" }, chosen: { node: false }, shape: "dot", size: 10 },
  edges: { font: { color: "#505050" }, color: { color: "lightgray", inherit: false }, chosen: { edge: false } },
  physics: { barnesHut: { damping: 0.2 } },
}
const container = document.getElementById('main')
const network = new vis.Network(container, data, options)

weightedEdges.sort((l, r) => (l.weight - r.weight))
let g = new Array(n)
for (let i = 0; i < n; i++) g[i] = []
const getCycle = (i, s, t, visited, stID) => {
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
const sleep = (ms) => (new Promise(resolve => setTimeout(resolve, ms)))
const UNIT_TIMEOUT = 500;
let timeout = UNIT_TIMEOUT;
(async () => {
  let removalEdgeIDs = []
  for (let i = 0; i < weightedEdges.length; i++) {
    await sleep(timeout * 3 / 2)
    const e = edges.get(weightedEdges[i].id)
    edges.update({
      id: e.id,
      color: { color: "lightblue" },
      width: 2,
    })
    await sleep(timeout * 2)
    const visited = new Array(n).fill(false)
    const cycleIDs = getCycle(e.from, e.from, e.to, visited, e.id)
    if (cycleIDs.length === 0) {
      g[e.from].push({ to: e.to, id: e.id })
      g[e.to].push({ to: e.from, id: e.id })
      edges.update({
        id: e.id,
        color: { color: "skyblue" },
        width: 2,
      })
      nodes.update({
        id: e.from,
        color: { background: "lightcyan", border: "skyblue" },
        borderWidth: 1.5,
      })
      nodes.update({
        id: e.to,
        color: { background: "lightcyan", border: "skyblue" },
        borderWidth: 1.5,
      })
    } else {
      edges.update(cycleIDs.map((id) => ({ id, color: { color: "lightcoral" } })))
      let nodeSet = new Set()
      cycleIDs.forEach((id) => {
        const _e = edges.get(id)
        nodeSet.add(_e.from)
        nodeSet.add(_e.to)
      })
      nodes.update([...nodeSet].map((id) => ({ id, color: { background: "mistyrose", border: "lightcoral" } })))
      await sleep(timeout * 2)
      edges.update(cycleIDs.map((id) => ({ id, color: { color: "skyblue" } })))
      nodes.update([...nodeSet].map((id) => ({ id, color: { background: "lightcyan", border: "skyblue" } })))
      removalEdgeIDs.push(e.id)
      edges.update({
        id: e.id,
        hidden: true,
      })
    }
  }
  edges.remove(removalEdgeIDs)
})()

document.getElementById("speed").addEventListener("change", (ev) => {
  if (ev.target.value === "x1") {
    timeout = UNIT_TIMEOUT
  } else if (ev.target.value === "x2") {
    timeout = UNIT_TIMEOUT / 2
  } else if (ev.target.value === "x4") {
    timeout = UNIT_TIMEOUT / 4
  }
})

function randInt(lb, ub) {
  return Math.floor(Math.random() * (ub - lb)) + lb;
}
