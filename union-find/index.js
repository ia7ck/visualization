const W = 800, H = 400
const draw = SVG("drawing").size(W, H).style({ border: "solid 1px" })
let nodeGroup = draw.group()
let edgeGroup = nodeGroup.group()
const radius = 12
const ox = radius * 4, oy = radius * 5
const TEXT_SIZE = 14
const BASE_TIMEOUT = 1000
let timeout = BASE_TIMEOUT

const D = 100 // 左の木のindexは 0, 1, ..., 右の木のindexは D, D+1, ..., 
let n = randInt(1, 10), m = randInt(1, 10)
let tree = [], parentOf = []
let root = [] // Union Find 用
let graph = []
let validNumber = new Set()
const pallet = {
  leftTreeNode: "#D3EDFB",
  rightTreeNode: "#FAF4D2",
  stroke: "#202020",
  text: "#101010",
  leftTreeNodeSelected: "#9FD9F6",
  rightTreeNodeSelected: "#F5E79F",
}

initialize()

function initialize() {
  tree = [] // 各要素はchildrenの配列
  parentOf = []
  root = []
  graph = []
  validNumber.clear()
  draw.clear()
  nodeGroup = draw.group()
  edgeGroup = nodeGroup.group()
  for (let { k, d, color } of [{ k: n, d: 0, color: pallet.leftTreeNode }, { k: m, d: D, color: pallet.rightTreeNode }]) {
    parentOf[0 + d] = -1 // 根の親は無し
    for (let i = 0; i < k; i++) tree[i + d] = []
    for (let i = 1; i + 1 <= k; i++) {
      const parent = randInt(0 + d, i + d), child = i + d
      tree[parent].push(child)
      parentOf[child] = parent
    }
    root[0 + d] = 0 + d // 親の根は自分自身
    for (let i = 1; i < k; i++) root[i + d] = parentOf[i + d] // 親を根だと思ってる
    let pos = traverse(tree)
    for (let i = 0; i < k; i++) {
      validNumber.add(i + d)
      const node = nodeGroup.group().data({ idx: i + d }).style({ cursor: "pointer" }) // circleとtextをまとめる
      node.circle(radius * 2).center(pos[i + d].x, pos[i + d].y).fill(color).stroke(pallet.stroke)
      node.text(String(i + 1)).fill(pallet.text).attr({ "text-anchor": "middle" }).font({ family: "Inconsolata", size: TEXT_SIZE }).move(pos[i + d].x, pos[i + d].y).dy(-TEXT_SIZE / 1.9) // labelは1-indexed

      // event listner
      node.click(addNode)

      let edges = []
      for (let j of tree[i + d]) {
        edges.push({
          to: j,
          line: edgeGroup.line(pos[i + d].x, pos[i + d].y, pos[j].x, pos[j].y).stroke({ color: pallet.stroke, width: 1 }),
        })
      }
      graph[i + d] = { node, edges }
    }
  }
}

function traverse(_tree) {
  let cur = 1, pos = []
  const dfs = (i, d) => {
    if (_tree[i].length === 0) {
      pos[i] = {
        x: (cur++) * ox,
        y: d * oy,
      }
    } else {
      for (let j of _tree[i]) dfs(j, d + 1)
      pos[i] = {
        x: (pos[_tree[i][0]].x + pos[_tree[i][_tree[i].length - 1]].x) / 2,
        y: d * oy,
      }
    }
  }
  for (let d of [0, D]) {
    if (_tree[0 + d] && !pos[0 + d]) { // 1. tree[0+d]がundefinedなら呼ばない、 2. 0+dに訪問済みなら呼ばない (union後のことを考えてください)
      dfs(0 + d, 1)
    }
  }
  return pos
}

const sleep = (ms) => (new Promise(resolve => setTimeout(resolve, ms)))
async function relocate(pos, graph) {
  for (let { k, d } of [{ k: n, d: 0 }, { k: m, d: D }]) {
    for (let i = 0; i < k; i++) {
      if (validNumber.has(i + d)) { // 連続した区間が生き残ってるとは限らない
        graph[i + d].node.first().animate({ duration: timeout }).center(pos[i + d].x, pos[i + d].y) // firstがcircle
        graph[i + d].node.last().animate({ duration: timeout }).move(pos[i + d].x, pos[i + d].y - TEXT_SIZE / 1.9) // secondがtext
      }
      for ({ to, line } of graph[i + d].edges) {
        line.animate({ durtaion: timeout }).plot(pos[i + d].x, pos[i + d].y, pos[to].x, pos[to].y) // toはオフセット調整なし
      }
    }
  }
  await sleep(timeout * 1.2)
}

const rootElement = document.getElementById("drawing")
async function addNode() {
  rootElement.style.pointerEvents = "none" // 配下のクリックイベント無効
  toggle([...unionForm, ...editForm, resetButton]) // アニメーション中はdisabledに
  const i = this.data("idx")
  const k = (i < D ? n : m + D) // 追加するnodeの番号
  validNumber.add(k)
  parentOf[k] = root[k] = i
  tree[i].push(k)
  tree[k] = []
  const pos = traverse(tree)
  const node = nodeGroup.group().data({ idx: k }).style({ cursor: "pointer" })
  node.circle(radius * 2).center(pos[k].x, pos[k].y).fill(i < D ? pallet.leftTreeNode : pallet.rightTreeNode).stroke(pallet.stroke).hide()
  node.text(String(k + 1 - (i < D ? 0 : D))).fill(pallet.text).attr({ "text-anchor": "middle", "visibility": "hidden" }).font({ family: "Inconsolata", size: TEXT_SIZE }).move(pos[k].x, pos[k].y).dy(-TEXT_SIZE / 1.9) // String()の中身どうにかならんか
  node.click(addNode) // event listner
  graph[k] = {
    node: node,
    edges: [],
  }
  const edge = {
    to: k,
    line: edgeGroup.line(pos[i].x, pos[i].y, pos[k].x, pos[k].y).stroke({ width: 1 }).hide(),
  }
  graph[i].edges.push(edge)
  i < D ? (n += 1) : (m += 1)
  if (tree[i].length >= 2) { // 子が2つ以上になったら再配置
    await relocate(pos, graph)
  }
  node.first().show() // アニメーション終了後に表示
  node.last().attr({ visibility: null }) // hide/showが効かないので
  edge.line.show()
  unionForm.u.max = n
  unionForm.v.max = m
  toggle([...unionForm, ...editForm, resetButton])
  rootElement.style.pointerEvents = "auto"
}

async function removeSubtree() {
  rootElement.style.pointerEvents = "none"
  toggle([...unionForm, ...editForm, resetButton])
  const s = this.data("idx") // subtreeの根
  const par = parentOf[s]
  if (par >= 0) {
    removeEdge(par, s)
    const dfs = (i) => {
      validNumber.delete(i)
      for (let j of tree[i]) dfs(j)
      tree[i] = []
      const _par = parentOf[i]
      parentOf[i] = -1
      tree[_par] = tree[_par].filter(j => j !== i)
      graph[i].node.remove()
      for (let { line } of graph[i].edges) line.remove() // これ大丈夫なのかな
      graph[i] = {
        node: null,
        edges: [],
      }
    }
    dfs(s)
    await relocate(traverse(tree), graph)
  }
  toggle([...unionForm, ...editForm, resetButton])
  rootElement.style.pointerEvents = "auto"
}

// Union Find
async function findRoot(i, insertPosition) {
  await sleep(timeout * 0.5)
  graph[i].node.first().fill(i < D ? pallet.leftTreeNodeSelected : pallet.rightTreeNodeSelected)
  if (i === root[i]) {
    await sleep(timeout * 0.5)
  } else {
    let par = parentOf[i], rt = await findRoot(root[i], insertPosition)
    if (par !== rt) {
      tree[par] = tree[par].filter(child => child !== i)
      removeEdge(par, i)
      if (insertPosition === 0) {
        tree[rt].unshift(i) // 左の木には左に追加していく
      } else {
        tree[rt].push(i)
      }
      const pos = traverse(tree)
      await relocate(pos, graph)
      graph[rt].edges.push({
        to: i,
        line: edgeGroup.line(pos[rt].x, pos[rt].y, pos[i].x, pos[i].y).stroke({ color: pallet.stroke, width: 1 }),
      })
    } else {
      await sleep(timeout * 0.8)
    }
    parentOf[i] = root[i] = rt
  }
  graph[i].node.first().fill(i < D ? pallet.leftTreeNode : pallet.rightTreeNode) // 元に戻す
  return root[i]
}

async function union(u, v) {
  if (u < 0 || u >= n || v < D || v >= m + D) {
    return false
  } else if (!validNumber.has(u) || !validNumber.has(v)) {
    return false
  } else {
    const rt1 = await findRoot(u, 0)
    const rt2 = await findRoot(v, 1)
    await sleep(timeout * 0.5)
    tree[rt1].push(rt2)
    root[rt2] = parentOf[rt2] = rt1
    const pos = traverse(tree)
    const edge = {
      to: rt2,
      line: edgeGroup.line(pos[rt1].x, pos[rt1].y, pos[rt2].x, pos[rt2].y).stroke({ color: pallet.stroke, width: 1 }).hide(),
    }
    graph[rt1].edges.push(edge)
    await relocate(pos, graph)
    edge.line.show()
    return true
  }
}

function removeEdge(parent, child) {
  graph[parent].edges = graph[parent].edges.filter(({ to, line }) => {
    if (to === child) {
      line.remove()
      return false
    } else {
      return true
    }
  })
}

function randInt(lb, ub) {
  return Math.floor(Math.random() * (ub - lb)) + lb;
}

const unionForm = document.getElementById("union-form")
unionForm.u.max = n
unionForm.u.value = randInt(0, n) + 1
unionForm.v.max = m
unionForm.v.value = randInt(0, m) + 1
const editForm = document.getElementById("edit-form")
editForm.radio.value = "add"
const resetButton = document.getElementById("reset-button")
unionForm.addEventListener("submit", async (ev) => {
  ev.preventDefault()
  let u = parseInt(ev.target.u.value, 10), v = parseInt(ev.target.v.value, 10)
  if (Number.isInteger(u) && Number.isInteger(v)) {
    u -= 1
    v = v - 1 + D // 0-indexed と オフセット調整
    toggle([...unionForm, ...editForm.radio, resetButton])
    rootElement.style.pointerEvents = "none" // ...
    const result = await union(u, v)
    if (!result) {
      alert("invalid input value(s)")
      toggle([...unionForm, ...editForm.radio])
    }
    toggle([resetButton])
  }
})
editForm.addEventListener("change", () => {
  const val = editForm.radio.value
  if (val !== "add" && val !== "remove") {
    return
  }
  const handler = val === "add" ? addNode : removeSubtree
  for (let { k, d } of [{ k: n, d: 0 }, { k: m, d: D }]) {
    for (let i = 0; i < k; i++) {
      if (validNumber.has(i + d)) { // 削除したやつがあるかもなので
        graph[i + d].node.off()
        graph[i + d].node.click(handler)
      }
    }
  }
})
resetButton.addEventListener("click", () => {
  if (unionForm.button.disabled) {
    toggle([...unionForm, ...editForm.radio])
  }
  editForm.radio.value = "add"
  rootElement.style.pointerEvents = "auto"

  n = randInt(11, 12)
  m = randInt(8, 9)
  unionForm.u.max = n
  unionForm.u.value = randInt(0, n) + 1
  unionForm.v.max = m
  unionForm.v.value = randInt(0, m) + 1
  initialize()
})
function toggle(arr) {
  arr.forEach((el) => el.disabled = !el.disabled)
}