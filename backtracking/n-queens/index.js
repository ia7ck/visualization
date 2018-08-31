const W = 400, H = 400
const draw = SVG("drawing").size(W, H).style({ border: "solid 1px" })
const n = randInt(5, 9), len = W / (n + 2)
const TEXT_SIZE = len / 2
const BASE_TIMEOUT = 1000
let timeout = BASE_TIMEOUT
const pallet = {
  bg: "#E5E5E5",
  success: {
    main: "#AFDEFA",
    secondary: "#C8E8FA",
  },
  danger: "#FAC8CF",
}
const steps = {
  5: 24,
  6: 1668,
  7: 95, // ?!?!?!?!?
  8: 17207,
}

let table = new Array(n)
for (let i = 0; i < n; i++) table[i] = new Array(n)
function build() {
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      table[i][j] = {
        rect: draw.rect(len, len).fill("none").stroke("black").move(len + len * j, len + len * i),
        text: draw.text("Q").attr({ "text-anchor": "middle", visibility: "hidden" }).font({ family: "Inconsolata", size: TEXT_SIZE }).move(len + len * j, len + len * i).dmove(len / 2, len / 5),
      }
    }
  }
}

build()

const sleep = (ms) => (new Promise(resolve => setTimeout(resolve, ms)))
const progress = document.getElementById("progress")
async function run() {
  let count = 0, cur = 0
  async function dfs(i) {
    if (i === n * n) {
      return false
    } else {
      let r = Math.floor(i / n), c = i % n
      if (table[r][c].text.attr("visibility") === "visible") { // これはない

      } else {
        for (let j = i; j < n * n; j++) {
          progress.textContent = ((++cur) / steps[n] * 100).toFixed(1) + " % completed"
          r = Math.floor(j / n), c = j % n
          table[r][c].text.attr({ visibility: "visible" })
          await fill8dir(r, c, { center: pallet.bg, other: pallet.bg }, false)
          const ok = await check(r, c, pallet.danger, true) // 塗る
          if (ok) {
            await fill8dir(r, c, { center: pallet.success.main, other: pallet.success.secondary })
            await fill8dir(r, c, { center: "none", other: "none" }, false)
            count++
            if (count === n) {
              return true
            } else {
              const result = await dfs(j + 1)
              if (result) {
                return true
              } else {
                table[r][c].text.attr({ visibility: "hidden" })
                count--
              }
            }
          } else {
            // 
          }
          await fill8dir(r, c, { center: "none", other: "none" }, false)
          table[r][c].text.attr({ visibility: "hidden" })
        }
        return false
      }
    }
  }
  const isin = (y, x) => (0 <= y && y < n && 0 <= x && x < n)
  async function fill8dir(r, c, color, wait = true) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        let d = 1
        while (isin(r + i * d, c + j * d)) {
          table[r + i * d][c + j * d].rect.fill(color.other)
          d++
        }
      }
    }
    table[r][c].rect.fill(color.center)
    if (wait) {
      await sleep(timeout)
    }
  }
  async function check(r, c, color, wait) {
    let ret = true
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        let d = 1
        while (isin(r + i * d, c + j * d)) {
          if (table[r + i * d][c + j * d].text.attr("visibility") === "visible") {
            ret = false
            table[r + i * d][c + j * d].rect.fill(color)
          }
          d++
        }
      }
    }
    if (ret === false) {
      table[r][c].rect.fill(color)
      if (wait) {
        await sleep(timeout)
      }
    }
    return ret
  }
  const result = await dfs(0)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (table[i][j].text.attr("visibility") === "visible") {
        await fill8dir(i, j, { center: pallet.success.main, other: pallet.success.secondary }, false)
      }
    }
  }
}

run()

function randInt(lb, ub) {
  return Math.floor(Math.random() * (ub - lb)) + lb;
}

const speedForm = document.getElementById("speed-form")
speedForm.addEventListener("change", (ev) => { timeout = BASE_TIMEOUT / (ev.target.value) })
