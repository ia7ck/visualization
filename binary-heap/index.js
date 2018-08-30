// MinHeap
const width = 777, height = 400
const radius = 12
const ox = radius * 2, oy = radius * 5
const TEXT_SIZE = 14
const draw = SVG("drawing").size(width, height).style({ border: "solid 1px" })
let nodeGroup = draw.group()
let edgeGroup = nodeGroup.group() // <g><g>edges</g>nodes</g>ってなる
const BASE_TIMEOUT = 1000
let timeout = BASE_TIMEOUT

let tree = [null]
let nodes = [null], edges = [null, null]
initialize()

function initialize(n = randInt(10, 24)) {
  tree = [null] // 1-indexedで使う
  nodes = [null]
  edges = [null, null]
  draw.clear() // 子のgroupもclearされる
  nodeGroup = draw.group()
  edgeGroup = nodeGroup.group()

  for (let _ = 0; _ < n; _++) tree.push(randInt(1, 30))
  for (let i = 1; i < tree.length; i++) {
    let j = i
    while (j > 1) {
      let p = Math.floor(j / 2)
      if (tree[p] > tree[j]) [tree[p], tree[j]] = [tree[j], tree[p]]
      else break
      j = p
    }
  }
  const initPos = traverse(tree)
  for (let i = 1; i < tree.length; i++) {
    nodes[i] = {
      // pos: initPos,
      node: nodeGroup.circle(radius * 2).center(initPos[i].x, initPos[i].y).fill("white").stroke("black"),
      label: nodeGroup.text(String(tree[i])).attr({ "text-anchor": "middle" }).font({ family: "Inconsolata", size: TEXT_SIZE }).move(initPos[i].x, initPos[i].y).dy(-TEXT_SIZE / 1.9), // 垂直方向に揃える小細工
    }
  }
  for (let i = 2; i < tree.length; i++) {
    const p = Math.floor(i / 2)
    edges[i] = {
      // parent: p,
      // child: i,
      edge: edgeGroup.line(initPos[p].x, initPos[p].y, initPos[i].x, initPos[i].y).stroke({ width: 1 }),
    }
  }
}

const sleep = (ms) => (new Promise(resolve => setTimeout(resolve, ms)))
async function insert(x) {
  tree.push(x)
  const len = tree.length
  let v = len - 1
  const pos = traverse(tree)
  nodes[v] = { // 仮の頂点を作る (hidden)
    node: nodeGroup.circle(radius * 2).center(pos[v].x, pos[v].y).fill("#a3ffa3").stroke("black").hide(), // 緑で塗る
    label: nodeGroup.text(String(tree[v])).attr({ "text-anchor": "middle", "visibility": "hidden" }).font({ family: "Inconsolata", size: TEXT_SIZE }).move(pos[v].x, pos[v].y).dy(-TEXT_SIZE / 1.9),
  }
  if (v >= 2) { // 親が存在するなら
    const p = Math.floor(v / 2)
    edges[v] = { // 追加したnodeから親に辺を引く
      parent: p,
      child: v,
      edge: edgeGroup.line(pos[p].x, pos[p].y, pos[v].x, pos[v].y).stroke({ width: 1 }).hide(),
    }
  }
  if (popcount(v + 1) !== 1) { // 右端に追加するとき以外は再配置
    await relocate(pos, nodes, edges)
  }
  nodes[v].node.show()
  nodes[v].label.attr({ "visibility": null }) // hide/showだとうまくいかなかったので（えぇ...）
  if (v >= 2) {
    edges[v].edge.show()
  }
  await sleep(timeout)
  let up = false
  while (v > 1) {
    let _p = Math.floor(v / 2)
    if (tree[_p] > tree[v]) {
      [tree[_p], tree[v]] = [tree[v], tree[_p]]
      await swapNodes(nodes, _p, v, pos)
    } else {
      break
    }
    v = _p
    up = true
  }
  if (up) { // 1度でも移動したら
    await sleep(timeout * 0.5) // ちょっと待つ
  }
  nodes[v].node.fill("white") // 緑→白に戻す
}

async function remove() {
  if (tree.length < 2) return // 空のときは何もしない
  const len = tree.length
  let v = len - 1;
  let pos = traverse(tree)
  if (v >= 2) { // nodeが2つ以上存在するなら先頭と末尾をswap; 1つのときもswapすると変に待たされるので
    await swapNodes(nodes, 1, v, pos);
  }
  nodes[1].node.fill("#ffa3a3"); // 赤で塗る 実はセミコロンが必要
  [tree[1], tree[v]] = [tree[v], tree[1]]
  tree.pop()
  await sleep(timeout) // ちょっと待って消す
  nodes[v].node.remove()
  nodes[v].label.remove()
  nodes.pop()
  if (v >= 2) { // rootじゃないなら、親への辺を消す
    edges[v].edge.remove()
    edges.pop()
  }
  if (tree.length < 2) return // 消したあと空になっていたらreturn
  pos = traverse(tree)
  await relocate(pos, nodes, edges) // 消した残りを再配置
  v = 1
  while (v * 2 < tree.length) { // 左の子が存在する間
    if (v * 2 + 1 < tree.length) { // 右の子が存在するなら
      const w = (tree[v * 2] < tree[v * 2 + 1] ? v * 2 : v * 2 + 1) // 小さいほうを見る（MinHeapなので）
      if (tree[w] < tree[v]) {
        [tree[w], tree[v]] = [tree[v], tree[w]]
        await swapNodes(nodes, w, v, pos)
        v = w
      } else {
        break
      }
    } else { // 左の子しか存在しないなら
      if (tree[v * 2] < tree[v]) {
        await swapNodes(nodes, v * 2, v, pos)
        v = v * 2
      } else {
        break
      }
    }
  }
  if (v > 1) { // 1度でも移動したら
    await sleep(timeout * 0.5) // ちょっと待つ
  }
  nodes[v].node.fill("white") // 赤→白に戻す
}

function traverse(tree) {
  let cur = 1, pos = [null]
  const dfs = (i, d) => { // pre-order
    if (i * 2 < tree.length) dfs(i * 2, d + 1)
    pos[i] = {
      x: cur * ox,
      y: d * oy
    }
    cur++
    if (i * 2 + 1 < tree.length) dfs(i * 2 + 1, d + 1)
  }
  dfs(1, 1)
  return pos
}
async function relocate(pos, nodes, edges) {
  for (let i = 1; i < pos.length; i++) {
    nodes[i].node.animate({ duration: timeout }).center(pos[i].x, pos[i].y)
    nodes[i].label.animate({ duration: timeout }).move(pos[i].x, pos[i].y - TEXT_SIZE / 1.9)
  }
  for (let i = 2; i < pos.length; i++) {
    const p = Math.floor(i / 2)
    edges[i].edge.animate({ duration: timeout }).plot(pos[p].x, pos[p].y, pos[i].x, pos[i].y)
  }
  await sleep(timeout * 1.2) // animationが終わるまで待つ
}
async function swapNodes(nodes, i, j, pos) {
  nodes[i].node.animate({ duration: timeout }).center(pos[j].x, pos[j].y)
  nodes[i].label.animate({ duration: timeout }).move(pos[j].x, pos[j].y - TEXT_SIZE / 1.9)
  nodes[j].node.animate({ duration: timeout }).center(pos[i].x, pos[i].y)
  nodes[j].label.animate({ duration: timeout }).move(pos[i].x, pos[i].y - TEXT_SIZE / 1.9)
  await sleep(timeout * 1.2);
  [nodes[i], nodes[j]] = [nodes[j], nodes[i]]
}
function randInt(lb, ub) {
  return Math.floor(Math.random() * (ub - lb)) + lb;
}
function popcount(b) {
  b = b - (b >> 1 & 0x55555555);
  b = (b & 0x33333333) + (b >> 2 & 0x33333333);
  b = b + (b >> 4) & 0x0f0f0f0f;
  b = b * 0x01010101;
  return b >> 24;
}

const insertForm = document.getElementById("insert-form")
const removeForm = document.getElementById("remove-form")
const resetForm = document.getElementById("reset-form")
const speedForm = document.getElementById("speed-form")
insertForm.input.value = randInt(1, 30)
insertForm.addEventListener("submit", async (ev) => {
  ev.preventDefault()
  const input = ev.target.input
  const val = parseInt(input.value, 10)
  if (Number.isInteger(val)) {
    toggle([input, ev.target.button, removeForm.button, resetForm.input, resetForm.button])
    await insert(val)
    toggle([input, ev.target.button, removeForm.button, resetForm.input, resetForm.button])
  }
  input.value = randInt(1, 30)
})
removeForm.addEventListener("submit", async (ev) => {
  ev.preventDefault()
  toggle([insertForm.input, insertForm.button, ev.target.button, resetForm.input, resetForm.button])
  await remove()
  toggle([insertForm.input, insertForm.button, ev.target.button, resetForm.input, resetForm.button])
})
function toggle(arr) {
  arr.forEach((el) => el.disabled = !el.disabled)
}
resetForm.addEventListener("submit", (ev) => {
  ev.preventDefault()
  const val = parseInt(ev.target.input.value, 10)
  if (Number.isInteger(val) && val >= 0) {
    if (val < 32) {
      initialize(val)
      ev.target.input.value = ""
    } else {
      alert("32未満の数字を入力してください")
    }
  }
})
speedForm.addEventListener("change", (ev) => {
  const val = parseInt(ev.target.value, 10)
  if (Number.isInteger(val)) {
    if (val === 1 || val === 2) {
      timeout = BASE_TIMEOUT / val
    }
  }
})