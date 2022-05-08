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
let piece_setting = 0;
let piece_set = sets[piece_setting];

const state = {"00": "bR", "01": "bN", "02": "bB","03": "bK","04": "bQ", "05": "bB", "06": "bN", "07": "bR",
                 "10": "bP", "11": "bP", "12": "bP","13": "bP","14": "bP", "15": "bP", "16": "bP", "17": "bP",
                 "20": "e", "21": "e", "22": "e","23": "e","24": "e", "25": "e", "26": "e", "27": "e",
                 "30": "e", "31": "e", "32": "e","33": "e","34": "e", "35": "e", "36": "e", "37": "e",
                 "40": "e", "41": "e", "42": "e","43": "e","44": "e", "45": "e", "46": "e", "47": "e",
                 "50": "e", "51": "e", "52": "e","53": "e","54": "e", "55": "e", "56": "e", "57": "e",
                 "60": "wP", "61": "wP", "62": "wP","63": "wP","64": "wP", "65": "wP", "66": "wP", "67": "wP",
                 "70": "wR", "71": "wN", "72": "wB","73": "wK","74": "wQ", "75": "wB", "76": "wN", "77": "wR",};
let selected = "";
let flipped = false;
let player = "w";


function render_set() {
  piece_setting = (sets.length > piece_setting + 1) ? piece_setting + 1 : 0;
  piece_set = sets[piece_setting];
  let doc = document.getElementById("piece_setting");
  doc.innerHTML = piece_set;
  render_board();
  render_state(state);
}
function loadImage(url) {
  return new Promise(r => { let i = new Image(); i.onload = (() => r(i)); i.src = url; });
}
function legal_move(from, to, board) {
  if (from === to) return false;
  return true;
}
function has_move(position, board) {
  if (board[position] !== "e") {
    return true;
  }
  else {
    return false;
  }
}
function move(from, to, board) {
  board[to] = board[from];
  board[from] = "e";
}
function render_board() {
  for (let i = 0; i < w_squares; i++) {
    for (let j = 0; j < h_squares; j++) {
      ctx.fillStyle = (j % 2 === i % 2) ? sq_lcolor : sq_dcolor;
      let pos = j.toString() + i.toString();
      if (selected === pos) ctx.fillStyle = selected_color;
      ctx.fillRect(i*width,j*height,width,height);
    }
  }
}
async function render_square(square) {
  let x = parseInt(square.charAt(1));
  let y = parseInt(square.charAt(0));
  ctx.fillStyle = (square === selected) ? selected_color : ((x % 2 === y % 2) ? sq_lcolor : sq_dcolor);
  ctx.fillRect(x*width,y*height,width,height);
  if (state[square] !== "e") {
    let img = await loadImage(`./assets/pieces/${piece_set}/${state[square]}.svg`);
    ctx.drawImage(img, (x*width)+(width/8), (y*height)+(width/8), 50, 50);
  }
}
async function render_state(board) {
  render_board();
  for (const square in board) {
    if (board[square] === 'e') {
      continue;
    };
    let x = parseInt(square.charAt(1));
    let y = parseInt(square.charAt(0));
    let img = await loadImage(`./assets/pieces/${piece_set}/${board[square]}.svg`);
    ctx.drawImage(img, (x*width)+(width/8), (y*height)+(width/8), 50, 50);
  }
}
function bind_click() {
  c.addEventListener("mousedown", function(e) {
    let rect = c.getBoundingClientRect();
    let x = parseInt((e.clientX - rect.left) / width);
    let y = parseInt((e.clientY - rect.top) / height);
    if (x === 8 || y === 8) return;
    let position = y.toString();
    position = position + x.toString();
    if (selected === "" && has_move(position, state) && state[position].charAt(0) === player) {
      selected = position;
      render_square(selected);
    }
    else if (selected !== "") {
      if (legal_move(selected, position, state)) {
        move(selected, position, state);
        render_square(position);
      }
      let prev = selected;
      selected = "";
      render_square(prev);
    }
  });
}
function init() {
  render_board();
  render_state(state);
  bind_click();
}
window.addEventListener("DOMContentLoaded", init());
