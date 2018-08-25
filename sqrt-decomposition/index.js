let SIZE = 22
let D = 5
let buc = []
let val = []

const H = 50
let BUC_W = D * 25
let VAL_W = BUC_W / D

const DUR = 750; // to fill each cell 
const COLORS = ['#f39700', '#e60012', '#9caeb7', '#00a7db', '#009944', '#d7c447', '#9b7cb6', '#00ada9', '#bb641d', '#e85298', '#0079c2', '#6cbb5a', '#b6007a', '#e5171f', '#522886', '#0078ba', '#019a66', '#e44d93', '#814721', '#a9cc51', '#ee7b1a', '#00a0de'] // https://www.colordic.org/m/
const Q = COLORS.length

let cv = SVG('main').size(1200, 1600)
let sub_g = cv.group().dx(5)
let query_g = sub_g.group().dy(H + H * 3 / 5) // dx(.) tips
let buc_g = sub_g.group().dy(H * 2)
let val_g = sub_g.group().dy(H * 3)

let result = []
let meta_buc = []
let meta_val = []

function init_draw(size) {
  SIZE = size
  D = Math.ceil(Math.sqrt(SIZE))
  BUC_W = D * 25
  buc = new Array(D)
  val = new Array(SIZE)
  result = new Array(Q)
  meta_buc = new Array(D)
  meta_valt = new Array(SIZE)

  VAL_W = BUC_W / D
  for (let k = 0; k < D; k++) {
    buc[k] = buc_g.rect(BUC_W, H).attr({ fill: '#f5f5f5', stroke: '#222222' })
    if (k > 0) buc[k].dx(BUC_W * k)
  }
  for (let i = 0; i < SIZE; i++) {
    val[i] = val_g.rect(VAL_W, H).attr({ fill: '#f5f5f5', stroke: '#222222' })
    if (i > 0) val[i].dx(VAL_W * i)
  }
}

function init_calc() {
  for (let k = 0; k < D; k++) meta_buc[k] = '#f5f5f5'
  for (let i = 0; i < SIZE; i++) meta_val[i] = '#f5f5f5'
  let offset = rand_int(0, COLORS.length)
  for (let i = 0; i < Q; i++) {
    const l = rand_int(0, SIZE - 2)
    const r = rand_int(l + 1, SIZE)
    const color = COLORS[(i + offset) % COLORS.length]
    result[i] = {
      query: { l, r, color },
      answer: exec_sqrd(l, r, color)
    }
  }
}

function exec_sqrd(l, r, color) {
  let ret = []
  for (let k = 0; k < D; k++) {
    let s = k * D, t = (k + 1) * D
    if (t <= l || r <= s) {
      continue
    } else if (l <= s && t <= r) {
      meta_buc[k] = color
      ret.push({ target: buc[k], color })
    } else {
      ret.push(...push_down(k))
      for (let i = Math.max(s, l); i < Math.min(t, r); i++) {
        meta_val[i] = color
        ret.push({ target: val[i], color })
      }
    }
  }
  return ret
}

function push_down(k) {
  let ret = []
  if (meta_buc[k] === '#f5f5f5') return ret
  ret.push({ target: buc[k], color: '#f5f5f5' })
  for (let i = k * D; i < (k + 1) * D; i++) {
    meta_val[i] = meta_buc[k]
    ret.push({ target: val[i], color: meta_buc[k] })
  }
  meta_buc[k] = '#f5f5f5'
  return ret
}

function draw(duration) {
  let total_num = 0
  for (let i = 0; i < Q; i++) {
    const { l, r, color } = result[i].query
    total_num += i === 0 ? 0 : result[i - 1].answer.length + 2
    setTimeout(() => { query_g.rect((r - l) * VAL_W, H * 3 / 5).dx(l * VAL_W).attr({ fill: '#f5f5f5' }).animate().attr({ fill: color }) }, (duration * 1.75) * total_num)
    setTimeout(() => {
      result[i].answer.forEach((elem, idx) => {
        const old_color = elem.target.attr('fill'), new_color = elem.color
        setTimeout(() => { elem.target.animate().attr({ fill: new_color }) }, idx * duration)
      })
    }, (duration * 1.75) * total_num + duration * 2)
  }

}

init_draw(rand_int(15, 30))
init_calc()

setTimeout(draw, 1000, DUR)

function rand_int(mn, mx) { // [mn, mx)
  return Math.floor(Math.random() * (mx - mn)) + mn;
}