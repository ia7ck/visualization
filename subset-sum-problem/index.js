const n = randInt(4, 6)
const s = randInt(10, (n === 4 ? 20 : 25))
const W = 720
const w = W / (s + 3)
const h = 15
const H = h * (n + 2) * 4
const draw = SVG("drawing").size(W, H).style({ border: "solid 1px" })
const BASE_TIMEOUT = 1000
let timeout = BASE_TIMEOUT

const success = "#7FD48D", stroke = "#D47F9B"

let set = []
for (let i = 0; i < n; i++) {
  if (i < Math.ceil(n * 0.7)) {
    set.push(randInt(2, Math.ceil(s / 2)))
  } else {
    set.push(randInt(Math.ceil(s / 2), s))
  }
}
for (let i = 0; i < set.length; i++) {
  const j = randInt(i, set.length);
  [set[i], set[j]] = [set[j], set[i]]
}
set.unshift(null)

function run() {
  let dp = new Array(n + 1)
  for (let i = 0; i <= n; i++) dp[i] = new Array(s + 1).fill(false)

  let prev = [], texts = []
  for (let i = 0; i <= s; i++) {
    prev[i] = draw.rect(w, h).move(w + w * i, h * 2).fill(i === 0 ? success : "none").stroke("black")
    texts[i] = draw.text(String(i)).font({ family: "Inconsolata", anchor: "middle" }).move(w + w * i + w / 2, h * 3)
  }
  dp[0][0] = true

  const sleep = (ms) => (new Promise(resolve => setTimeout(resolve, ms)));
  (async function () {
    for (let i = 0; i < n; i++) setElement.children[i].style.color = "lightgray"
    await sleep(timeout)
    for (let i = 1; i <= n; i++) {
      const top = h * 2 + h * 4 * i // i段目の上端
      let rects = []
      for (let j = 0; j <= s; j++) {
        dp[i][j] = dp[i - 1][j]
        rects[j] = draw.rect(w, h).move(w * (j + 1), top - h * 4).fill(dp[i - 1][j] ? success : "none").stroke("black") // 上の段から色を引き継ぐ
      }
      texts.forEach(text => { text.animate({ duration: timeout }).dy(h * 4) })
      rects.forEach(rect => { rect.animate({ duration: timeout }).dy(h * 4) })
      await sleep(timeout * 1.5)
      setElement.children[i - 1].style.color = "black" // 遷移に使う数字を強調
      for (let j = 0; j <= s; j++) {
        const line = draw.line(w + w * j, top - h * 2.9, w + w * j + w, top - h * 2.9).stroke({ width: 2, color: stroke })
        await sleep(timeout * (dp[i - 1][j] ? 0.5 : 0.25)) // 遷移するときは長めに待つ
        line.remove()
        if (dp[i - 1][j]) {
          const to = j + set[i]
          if (to <= s) {
            const left = w + w * j + w / 2, right = w + w * to + w / 2
            move([[left, top - h * 3], [left, top - h * 1.5], [right, top - h * 1.5], [right, top]])
            await sleep(timeout * 4 * 0.7) // えええ
            dp[i][to] = true
            rects[to].fill(success)
            await sleep(timeout)
          } else {
            const left = w + w * j + w / 2, right = Math.max(w + w * to + w / 2, W) // 一番右まで伸ばす
            move([[left, top - h * 3], [left, top - h * 1.5], [right, top - h * 1.5]])
            await sleep(timeout * 4 * 0.7)
          }
        }
      }
      prev = rects
      setElement.children[i - 1].style.color = "lightgray"
      await sleep(timeout)
    }
    await sleep(timeout * 1.5)
    for (let i = 0; i < n; i++) setElement.children[i].style.color = "black"
    prev[s].stroke({ width: 2, color: stroke })
  })()

  function move(points) {
    const p = draw.polyline([[0, 0], [0, 0]]).fill("none").stroke({ width: 1 })
    p.animate({ duration: timeout * 0.3 }).plot([points[0], points[0]]).afterAll(async function () {
      await sleep(timeout * 0.7)
      this.remove()
    })
    for (let i = 2; i <= points.length; i++) {
      p.animate({ duration: timeout * 0.7 }).plot(points.slice(0, i))
    }
  }
}

function randInt(lb, ub) {
  return Math.floor(Math.random() * (ub - lb)) + lb;
}

const setElement = document.getElementById("set")
setElement.innerHTML = `{ <span>${set.slice(1).join(",</span><span>")}</span> }`
document.getElementById("sum").textContent = String(s)
const runButton = document.getElementById("run-button")
const speedForm = document.getElementById("speed-form")
runButton.addEventListener("click", (ev) => {
  ev.target.disabled = true
  run()
})
speedForm.addEventListener("change", (ev) => {
  const val = parseInt(ev.target.value, 10)
  if (Number.isInteger(val)) {
    if (val === 1 || val === 2) {
      timeout = BASE_TIMEOUT / val
    }
  }
})
