const c = document.getElementById("chessBoard");
const ctx = c.getContext("2d");
const w_squares = 8;
const h_squares = 8;
const width = c.width/w_squares;
const height = c.height/h_squares;
const selected_color = "gray";
const piece_color = "black";
const sq_lcolor = "#ff7a39";
const sq_dcolor = "green";
const sets = ["alpha", "anarcandy", "california", "cardinal", "cburnett", "chess7",
              "chessnut", "companion", "dubrovny", "fantasy", "fresca", "gioco",
              "governor", "horsey", "icpieces", "kosal", "leipzig", "letter",
              "libra", "maestro", "merida", "pirouetti", "pixel", "reillycraig",
              "riohacha", "shapes", "spatial", "staunty", "tatiana"];
let piece_setting = 1;
let piece_set = sets[piece_setting];
const images = {"bR": loadImage(`./assets/pieces/${piece_set}/bR.svg`),
                "bN": loadImage(`./assets/pieces/${piece_set}/bN.svg`),
                "bB": loadImage(`./assets/pieces/${piece_set}/bB.svg`),
                "bK": loadImage(`./assets/pieces/${piece_set}/bK.svg`),
                "bQ": loadImage(`./assets/pieces/${piece_set}/bQ.svg`),
                "bP": loadImage(`./assets/pieces/${piece_set}/bP.svg`),
                "wR": loadImage(`./assets/pieces/${piece_set}/wR.svg`),
                "wN": loadImage(`./assets/pieces/${piece_set}/wN.svg`),
                "wB": loadImage(`./assets/pieces/${piece_set}/wB.svg`),
                "wK": loadImage(`./assets/pieces/${piece_set}/wK.svg`),
                "wQ": loadImage(`./assets/pieces/${piece_set}/wQ.svg`),
                "wP": loadImage(`./assets/pieces/${piece_set}/wP.svg`),};
let arr_state = ["bR", "bN", "bB", "bK", "bQ", "bB", "bN", "bR",
                 "bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP",
                  "e",  "e",  "e",  "e",  "e",  "e",  "e",  "e",
                  "e",  "e",  "e",  "e",  "e",  "e",  "e",  "e",
                  "e",  "e",  "e",  "e",  "e",  "e",  "e",  "e",
                  "e",  "e",  "e",  "e",  "e",  "e",  "e",  "e",
                 "wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP",
                 "wR", "wN", "wB", "wK", "wQ", "wB", "wN", "wR",]
let selected = -1;
let flipped = false;
let player = "w";

function flip() {
  new_board = [];
  for (let i = arr_state.length - 1; i >= 0; i--) {
    new_board.push(arr_state[i]);
  }
  arr_state = new_board;
  selected = -1;
  render_state(arr_state);
}
function linear(x, y) {
  return ((h_squares*y)+x);
}
function nonlinear(z) {
  let x = z % w_squares;
  let y = (z / h_squares) | 0;
  return {x, y};
}
function loadImage(url) {
  return new Promise(r => { let i = new Image(); i.onload = (() => r(i)); i.src = url; });
}
function legal_move(from, to) {
  if (from === to) return false;
  return true;
}
function has_move(position) {
  if (arr_state[position] !== "e") {
    return true;
  }
  else {
    return false;
  }
}
function move(from, to) {
  arr_state[to] = arr_state[from];
  arr_state[from] = "e";
}
function render_board() {
  for (let i = 0; i < w_squares; i++) {
    for (let j = 0; j < h_squares; j++) {
      ctx.fillStyle = (j % 2 === i % 2) ? sq_lcolor : sq_dcolor;
      if (selected === linear(i,j)) ctx.fillStyle = selected_color;
      ctx.fillRect(i*width,j*height,width,height);
    }
  }
}
async function render_square(pos) {
  let {x, y} = nonlinear(pos);
  ctx.fillStyle = (pos === selected) ? selected_color : ((x % 2 === y % 2) ? sq_lcolor : sq_dcolor);
  ctx.fillRect(x*width,y*height,width,height);
  if (arr_state[pos] !== "e") {
    let img = await images[arr_state[pos]];
    ctx.drawImage(img, (x*width)+(width/8), (y*height)+(width/8), 50, 50);
  }
}
async function render_state() {
  render_board();
  for (let i = 0; i < arr_state.length; i++) {
    if (arr_state[i] === 'e') {
      continue;
    };
    let {x, y} = nonlinear(i);
    let img = await images[arr_state[i]];
    ctx.drawImage(img, (x*width)+(width/8), (y*height)+(width/8), 50, 50);
  }
}
function bind_click() {
  c.addEventListener("mousedown", function(e) {
    let rect = c.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / width) | 0;
    let y = ((e.clientY - rect.top) / height) | 0;
    if (x > 7 || y > 7) return;
    let position = linear(x, y);
    if (selected === -1 && has_move(position) && arr_state[position].charAt(0) === player) {
      selected = position;
      render_square(selected);
    }
    else if (selected !== -1) {
      if (legal_move(selected, position)) {
        move(selected, position);
        render_square(position);
      }
      let prev = selected;
      selected = -1;
      render_square(prev);
    }
  });
}
function init() {
  render_state(arr_state);
  bind_click();
}
window.addEventListener("DOMContentLoaded", init());
