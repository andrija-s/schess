const c = document.getElementById("chessBoard");
const ctx = c.getContext("2d");
const w_squares = 8;
const h_squares = 8;
const width = c.width/w_squares;
const height = c.height/h_squares;
const border_color = "black";
const selected_color = "yellow";
const piece_color = "black";
const sq_lcolor = "#ff7a39";
const sq_dcolor = "green";
const highlight_color = "red";
const sets = ["alpha", "anarcandy", "california", "cardinal", "cburnett", "chess7",
              "chessnut", "companion", "dubrovny", "fantasy", "fresca", "gioco",
              "governor", "horsey", "icpieces", "kosal", "leipzig", "letter",
              "libra", "maestro", "merida", "pirouetti", "pixel", "reillycraig",
              "riohacha", "shapes", "spatial", "staunty", "tatiana"];
let moves_highlight = [];
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
let arr_state = ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR",
                 "bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP",
                  "e",  "e",  "e",  "e",  "e",  "e",  "e",  "e",
                  "e",  "e",  "e",  "e",  "e",  "e",  "e",  "e",
                  "e",  "e",  "e",  "e",  "e",  "e",  "e",  "e",
                  "e",  "e",  "e",  "e",  "e",  "e",  "e",  "e",
                 "wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP",
                 "wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR",]
let recent_from = -1;
let recent_to = -1;
let selected = -1;
let flipped = false;
let player = "w";
let enpeasant = ["",-1];
let check = false;

function flip() {
  new_board = [];
  for (let i = arr_state.length - 1; i >= 0; i--) {
    new_board.push(arr_state[i]);
  }
  arr_state = new_board;
  selected = -1;
  moves_highlight = [];
  flipped = !flipped;
  render_state();
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
function inBound(x, y) {
  return (x >= 0 && x < 8 && y >= 0 && y < 8);
}
function rookMoves(from, player, state) {
  let moves = [];
  let {x, y} = nonlinear(from);
  // row check
  for (let i=from-1; i>=from-x; i--) {
    if (state[i] === "e") {
      moves.push(i);
    }
    else {
      if (state[i].charAt(0) !== player) {
        moves.push(i);
      }
      break;
    }
  }
  for (let i = from+1; i<(y*w_squares)+8; i++) {
    if (state[i] === "e") {
      moves.push(i);
    }
    else {
      if (state[i].charAt(0) !== player) {
        moves.push(i);
      }
      break;
    }
  }

  // column check

  for (let i=from-w_squares; i>=x; i-=w_squares) {
    if (state[i] === "e") {
      moves.push(i);
    }
    else {
      if (state[i].charAt(0) !== player) {
        moves.push(i);
      }
      break;
    }
  }
  for (let i=from+w_squares; i<(w_squares*h_squares); i+=w_squares) {
    if (state[i] === "e") {
      moves.push(i);
    }
    else {
      if (state[i].charAt(0) !== player) {
        moves.push(i);
      }
      break;
    }
  }
  return moves;
}
function knightMoves(from, player, state) {
  let moves = [];
  return moves;
}
function bishopMoves(from, player, state) {
  let moves = [];
  let {x, y} = nonlinear(from);
  let plusplus = true;
  let plusmin = true;
  let minplus = true;
  let minmin = true;
  for (let i = 1; i < w_squares; i++) {
    if (plusplus && inBound(x+i, y+i)) {
      if (state[linear(x+i, y+i)].charAt(0) !== player) moves.push(linear(x+i,y+i));
      if (state[linear(x+i, y+i)].charAt(0) !== "e") {
        plusplus = false;
      }
    }
    if (plusmin && inBound(x+i, y-i)) {
      if (state[linear(x+i, y-i)].charAt(0) !== player) moves.push(linear(x+i,y-i));
      if (state[linear(x+i, y-i)].charAt(0) !== "e") {
        plusmin = false;
      }
    }
    if (minplus && inBound(x-i, y+i)) {
      if (state[linear(x-i, y+i)].charAt(0) !== player) moves.push(linear(x-i,y+i));
      if (state[linear(x-i, y+i)].charAt(0) !== "e") {
        minplus = false;
      }
    }
    if (minmin && inBound(x-i, y-i)) {
      if (state[linear(x-i, y-i)].charAt(0) !== player) moves.push(linear(x-i,y-i));
      if (state[linear(x-i, y-i)].charAt(0) !== "e") {
        minmin = false;
      }
    }
  }
  return moves;
}
function kingMoves(from, player, state) {
  let moves = [];
  let {x, y} = nonlinear(from);
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if ((i===0&&j===0) || x+i<0 || x+i > 7 || y+j<0 || y+j > 7) continue;
      if (state[linear(x+i, y+j)].charAt(0) !== player) {
        moves.push(linear(x+i,y+j));
      }
    }
  }
  return moves;
}
function peonMoves(from, player, state) {
  let moves = [];
  let {x, y} = nonlinear(from);
  let oppo = (player === "w") ? "b" : "w";
  let going_up = ((player === "w" && !flipped) || (player === "b" && flipped))
  let peasant_possible = ((going_up && y === 6) || (!going_up && y === 1));
  let inc = w_squares - ((w_squares * 2) * going_up)
  if (state[from + inc] === "e") {
    moves.push(from + inc);
    if (peasant_possible && (state[from + inc + inc] === "e")) {
      moves.push(from + inc + inc);
    }
  }
  let y_move = (going_up) ? y-1 : y+1;

  if (x !== 7) {
    let char = state[linear(x+1, y_move)].charAt(0)
    if ((char !== "e" && char !== player) || (char==="e" && oppo===enpeasant[0] && linear(x+1, y)===enpeasant[1])) {
      moves.push(linear(x+1, y_move));
    }
  }
  if (x !== 0) {
    let char = state[linear(x-1, y_move)].charAt(0)
    if ((char !== "e" && char !== player) || (char==="e" && oppo===enpeasant[0] && linear(x-1, y)===enpeasant[1])) {
      moves.push(linear(x-1, y_move));
    }
  }
  return moves;
}
function queenMoves(from, player, state) {
  let moves = [];
  let {x, y} = nonlinear(from);
  let plusplus = true;
  let plusmin = true;
  let minplus = true;
  let minmin = true;
  for (let i = 1; i < w_squares; i++) {
    let x_curr = x+i;
    let y_curr = y+i;
    if (plusplus && inBound(x_curr, y_curr)) {
      if (state[linear(x_curr, y_curr)].charAt(0) !== player) moves.push(linear(x_curr,y_curr));
      if (state[linear(x_curr, y_curr)].charAt(0) !== "e") {
        plusplus = false;
      }
    }
    x_curr = x+i;
    y_curr = y-i;
    if (plusmin && inBound(x_curr, y_curr)) {
      if (state[linear(x_curr, y_curr)].charAt(0) !== player) moves.push(linear(x_curr,y_curr));
      if (state[linear(x_curr, y_curr)].charAt(0) !== "e") {
        plusmin = false;
      }
    }
    x_curr = x-i;
    y_curr = y+i;
    if (minplus && inBound(x_curr, y_curr)) {
      if (state[linear(x_curr, y_curr)].charAt(0) !== player) moves.push(linear(x_curr,y_curr));
      if (state[linear(x_curr, y_curr)].charAt(0) !== "e") {
        minplus = false;
      }
    }
    x_curr = x-i;
    y_curr = y-i;
    if (minmin && inBound(x_curr, y_curr)) {
      if (state[linear(x_curr, y_curr)].charAt(0) !== player) moves.push(linear(x_curr,y_curr));
      if (state[linear(x_curr, y_curr)].charAt(0) !== "e") {
        minmin = false;
      }
    }
  }
  for (let i=from-1; i>=from-x; i--) {
    if (state[i] === "e") {
      moves.push(i);
    }
    else {
      if (state[i].charAt(0) !== player) {
        moves.push(i);
      }
      break;
    }
  }
  for (let i=from+1; i<(y*w_squares)+8; i++) {
    if (state[i] === "e") {
      moves.push(i);
    }
    else {
      if (state[i].charAt(0) !== player) {
        moves.push(i);
      }
      break;
    }
  }

  // column check

  for (let i=from-w_squares; i>=x; i-=w_squares) {
    if (state[i] === "e") {
      moves.push(i);
    }
    else {
      if (state[i].charAt(0) !== player) {
        moves.push(i);
      }
      break;
    }
  }
  for (let i=from+w_squares; i<(w_squares*h_squares); i+=w_squares) {
    if (state[i] === "e") {
      moves.push(i);
    }
    else {
      if (state[i].charAt(0) !== player) {
        moves.push(i);
      }
      break;
    }
  }
  return moves;
}
function movesFrom(from, state) {
  let moves = [];
  let player = state[from].charAt(0);
  let piece = state[from].charAt(1);
  switch(piece) {
    case "R":
      moves = rookMoves(from, player, state);
      break;
    case "N":
      moves = knightMoves(from, player, state);
      break;
    case "B":
      moves = bishopMoves(from, player, state);
      break;
    case "K":
      moves = kingMoves(from, player, state);
      break;
    case "Q":
      moves = queenMoves(from, player, state);
      break;
    case "P":
      moves = peonMoves(from, player, state);
      break;
    default:
      break;
  }
  return moves;
}
function legal_move(to, state) {
  return moves_highlight.includes(to);
}
function has_move(position, state) {
  if (state[position] !== "e") {
    return true;
  }
  else {
    return false;
  }
}
function move(from, to, state) {
  if (state[from].charAt(1) === "P") {
    let {x, y} = nonlinear(to);
    if (Math.abs(to - from) > 15) {
      enpeasant[0] = state[from].charAt(0);
      enpeasant[1] = to;
    }
    else if (y === 0 || y === 7) {
      state[from] = state[from].charAt(0) + "Q";
    }
    else {
      enpeasant[0] = "";
      enpeasant[1] = -1;
    }
  }
  state[to] = state[from];
  state[from] = "e";
}
function render_board() {
  for (let i = 0; i < w_squares; i++) {
    for (let j = 0; j < h_squares; j++) {
      ctx.fillStyle = border_color;
      ctx.fillRect(i*width,j*height,width,height);
      ctx.fillStyle = (j % 2 === i % 2) ? sq_lcolor : sq_dcolor;
      let pos = linear(i,j);
      if (selected === pos) ctx.fillStyle = selected_color;
      else if (moves_highlight.includes(pos)) ctx.fillStyle = highlight_color;
      ctx.fillRect(i*width,j*height,width-1,height-1);
    }
  }
}
/* async function render_square(pos) {
  let {x, y} = nonlinear(pos);
  ctx.fillStyle = (pos === selected) ? selected_color : ((x % 2 === y % 2) ? sq_lcolor : sq_dcolor);
  ctx.fillRect(x*width,y*height,width,height);
  if (arr_state[pos] !== "e") {
    let img = await images[arr_state[pos]];
    ctx.drawImage(img, (x*width)+(width/8), (y*height)+(width/8), 50, 50);
  }
} */
async function render_state() {
  render_board();
  for (let i = 0; i < arr_state.length; i++) {
    if (arr_state[i] === 'e') {
      continue;
    };
    let {x, y} = nonlinear(i);
    let img = await images[arr_state[i]];
    ctx.drawImage(img, (x*width)+(width/16), (y*height)+(width/16), 65, 65);
  }
}
function bind_click() {
  c.addEventListener("mousedown", function(e) {
    let rect = c.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / width) | 0;
    let y = ((e.clientY - rect.top) / height) | 0;
    if (x > 7 || y > 7) return;
    let position = linear(x, y);
    if (selected === -1 && has_move(position, arr_state) && arr_state[position].charAt(0) === player) {
      selected = position;
      moves_highlight = movesFrom(position, arr_state);
    }
    else if (selected !== -1) {
      if (legal_move(position, arr_state)) {
        move(selected, position, arr_state);
      }
      selected = -1;
      moves_highlight = [];
    }
    render_state();
  });
}
function init() {
  render_state();
  bind_click();
}
window.addEventListener("DOMContentLoaded", init());
