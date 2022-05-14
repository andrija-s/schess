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
let moves_highlight = [];
let piece_set = "anarcandy";
const EMPTY = 0;
const W_ROOK   = 1;
const W_KNIGHT = 2;
const W_BISHOP = 3;
const W_KING   = 4;
const W_QUEEN  = 5;
const W_PAWN   = 6;
const B_ROOK   = -1;
const B_KNIGHT = -2;
const B_BISHOP = -3;
const B_KING   = -4;
const B_QUEEN  = -5;
const B_PAWN   = -6;
const images = {"-1"   : loadImage(`./assets/pieces/${piece_set}/bR.svg`),
                "-2" : loadImage(`./assets/pieces/${piece_set}/bN.svg`),
                "-3" : loadImage(`./assets/pieces/${piece_set}/bB.svg`),
                "-4"   : loadImage(`./assets/pieces/${piece_set}/bK.svg`),
                "-5"  : loadImage(`./assets/pieces/${piece_set}/bQ.svg`),
                "-6"   : loadImage(`./assets/pieces/${piece_set}/bP.svg`),
                "1"   : loadImage(`./assets/pieces/${piece_set}/wR.svg`),
                "2" : loadImage(`./assets/pieces/${piece_set}/wN.svg`),
                "3" : loadImage(`./assets/pieces/${piece_set}/wB.svg`),
                "4"   : loadImage(`./assets/pieces/${piece_set}/wK.svg`),
                "5"  : loadImage(`./assets/pieces/${piece_set}/wQ.svg`),
                "6"   : loadImage(`./assets/pieces/${piece_set}/wP.svg`),};
let main_state = {
  board : new Int8Array([B_ROOK, B_KNIGHT, B_BISHOP, B_QUEEN, B_KING, B_BISHOP, B_KNIGHT, B_ROOK,
                         B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN,
                         EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,
                         EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,
                         EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,
                         EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,
                         W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN,
                         W_ROOK, W_KNIGHT, W_BISHOP, W_QUEEN, W_KING, W_BISHOP, W_KNIGHT, W_ROOK,]),
  king_positions : new Int8Array([60, 4]), // [white king, black king]
  enpeasant : new Int8Array([0, -1]), // [color (white=1, black=-1), position]
  check : new Int8Array(2),
  flipped : new Int8Array([0]),
  turn : new Int8Array(1),
}
let recent_from = -1;
let recent_to = -1;
let selected = -1;
let curr_player = 1;
let check = false;

function flip() {
  main_state.board = main_state.board.reverse();
  selected = -1;
  if (main_state.enpeasant[1] !== -1) {
    let [temp_x, temp_y] = nonlinear(main_state.enpeasant[1]);
    main_state.enpeasant[1] = linear(7-temp_x, 7-temp_y); 
  }
  let [x, y] = nonlinear(main_state.king_positions[0]);
  main_state.king_positions[0] = linear(7-x, 7-y);
  [x, y] = nonlinear(main_state.king_positions[1]);
  main_state.king_positions[1] = linear(7-x, 7-y);
  moves_highlight = [];
  main_state.flipped[0] = (main_state.flipped[0] === 0) ? 1 : 0;
  render_state();
}
function linear(x, y) {
  return ((h_squares*y)+x);
}
function nonlinear(z) {
  let x = z % w_squares;
  let y = (z / h_squares) | 0;
  return [x, y];
}
function loadImage(url) {
  return new Promise(r => { let i = new Image(); i.onload = (() => r(i)); i.src = url; });
}
function inBound(x, y) {
  return (x >= 0 && x < 8 && y >= 0 && y < 8);
}
function rookMoves(from, player, state) {
  let moves = [];
  let [x, y] = nonlinear(from);
  // row check
  for (let i=from-1; i>=from-x; i--) {
    if (state.board[i] === EMPTY) {
      moves.push(i);
    }
    else {
      if (state.board[i] / Math.abs(state.board[i]) !== player) {
        moves.push(i);
      }
      break;
    }
  }
  for (let i = from+1; i<(y*w_squares)+8; i++) {
    if (state.board[i] === EMPTY) {
      moves.push(i);
    }
    else {
      if (state.board[i] / Math.abs(state.board[i]) !== player) {
        moves.push(i);
      }
      break;
    }
  }

  // column check

  for (let i=from-w_squares; i>=x; i-=w_squares) {
    if (state.board[i] === EMPTY) {
      moves.push(i);
    }
    else {
      if (state.board[i] / Math.abs(state.board[i]) !== player) {
        moves.push(i);
      }
      break;
    }
  }
  for (let i=from+w_squares; i<(w_squares*h_squares); i+=w_squares) {
    if (state.board[i] === EMPTY) {
      moves.push(i);
    }
    else {
      if (state.board[i] / Math.abs(state.board[i]) !== player) {
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
  let [x, y] = nonlinear(from);
  let plusplus = true;
  let plusmin = true;
  let minplus = true;
  let minmin = true;
  for (let i = 1; i < w_squares; i++) {
    if (plusplus && inBound(x+i, y+i)) {
      let pos = linear(x+i, y+i);
      if (state.board[pos] / Math.abs(state.board[pos]) !== player) moves.push(pos);
      if (state.board[pos] !== EMPTY) {
        plusplus = false;
      }
    }
    if (plusmin && inBound(x+i, y-i)) {
      let pos = linear(x+i, y-i);
      if (state.board[pos] / Math.abs(state.board[pos]) !== player) moves.push(pos);
      if (state.board[pos] !== EMPTY) {
        plusmin = false;
      }
    }
    if (minplus && inBound(x-i, y+i)) {
      let pos = linear(x-i,y+i);
      if (state.board[pos] / Math.abs(state.board[pos]) !== player) moves.push(pos);
      if (state.board[pos] !== EMPTY) {
        minplus = false;
      }
    }
    if (minmin && inBound(x-i, y-i)) {
      let pos = linear(x-i,y-i);
      if (state.board[pos] / Math.abs(state.board[pos]) !== player) moves.push(pos);
      if (state.board[pos] !== EMPTY) {
        minmin = false;
      }
    }
  }
  return moves;
}
function kingMoves(from, player, state) {
  let moves = [];
  let [x, y] = nonlinear(from);
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if ((i===0&&j===0) || x+i<0 || x+i > 7 || y+j<0 || y+j > 7) continue;
      let pos = linear(x+i,y+j);
      if (state.board[pos] / Math.abs(state.board[pos]) !== player) {
        moves.push(pos);
      }
    }
  }
  return moves;
}
function pawnMoves(from, player, state) {
  let moves = [];
  let [x, y] = nonlinear(from);
  let going_up = ((player === 1 && state.flipped[0] === 0) || (player === -1 && state.flipped[0] === 1))
  let peasant_possible = ((going_up && y === 6) || (!going_up && y === 1));
  let inc = w_squares - ((w_squares * 2) * going_up)
  if (state.board[from + inc] === EMPTY) {
    moves.push(from + inc);
    if (peasant_possible && (state.board[from + inc + inc] === EMPTY)) {
      moves.push(from + inc + inc);
    }
  }
  let y_move = (going_up) ? y-1 : y+1;
  function calculate(x_offset) {
    let piece = state.board[linear(x_offset, y_move)];
    if ((piece !== EMPTY && piece / Math.abs(piece) !== player) || (piece===EMPTY && player*(-1)===state.enpeasant[0] && linear(x_offset, y)===state.enpeasant[1])) {
      moves.push(linear(x_offset, y_move));
    }
  }
  if (x !== 7) {
    calculate(x+1);
  }
  if (x !== 0) {
    calculate(x-1);
  }
  return moves;
}
function queenMoves(from, player, state) {
  let moves = [];
  let [x, y] = nonlinear(from);
  let plusplus = true;
  let plusmin = true;
  let minplus = true;
  let minmin = true;
  function q_calculate(x, y, booli) {
    if (booli && inBound(x, y)) {
      let pos = linear(x, y);
      if (state.board[pos] / Math.abs(state.board[pos]) !== player) moves.push(pos);
      if (state.board[pos] !== EMPTY) {
        return false;
      }
    }
    return booli;
  }
  for (let i = 1; i < w_squares; i++) {
    plusplus = q_calculate(x+i,y+i,plusplus);
    plusmin  = q_calculate(x+i,y-i,plusmin);
    minplus  = q_calculate(x-i,y+i,minplus);
    minmin   = q_calculate(x-i,y-i,minmin);
  }
  for (let i=from-1; i>=from-x; i--) {
    if (state.board[i] === EMPTY) {
      moves.push(i);
    }
    else {
      if (state.board[i] / Math.abs(state.board[i]) !== player) {
        moves.push(i);
      }
      break;
    }
  }
  for (let i=from+1; i<(y*w_squares)+8; i++) {
    if (state.board[i] === EMPTY) {
      moves.push(i);
    }
    else {
      if (state.board[i] / Math.abs(state.board[i]) !== player) {
        moves.push(i);
      }
      break;
    }
  }

  // column check

  for (let i=from-w_squares; i>=x; i-=w_squares) {
    if (state.board[i] === EMPTY) {
      moves.push(i);
    }
    else {
      if (state.board[i] / Math.abs(state.board[i]) !== player) {
        moves.push(i);
      }
      break;
    }
  }
  for (let i=from+w_squares; i<(w_squares*h_squares); i+=w_squares) {
    if (state.board[i] === EMPTY) {
      moves.push(i);
    }
    else {
      if (state.board[i] / Math.abs(state.board[i]) !== player) {
        moves.push(i);
      }
      break;
    }
  }
  return moves;
}
function movesFrom(from, state) {
  let moves = [];
  let player = state.board[from] / Math.abs(state.board[from]);
  switch(state.board[from]) {
    case B_ROOK:
    case W_ROOK:
      moves = rookMoves(from, player, state);
      break;
    case B_KNIGHT:
    case W_KNIGHT:
      moves = knightMoves(from, player, state);
      break;
    case B_BISHOP:
    case W_BISHOP:
      moves = bishopMoves(from, player, state);
      break;
    case B_KING:
    case W_KING:
      moves = kingMoves(from, player, state);
      break;
    case B_QUEEN:
    case W_QUEEN:
      moves = queenMoves(from, player, state);
      break;
    case B_PAWN:
    case W_PAWN:
      moves = pawnMoves(from, player, state);
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
  if (state.board[position] !== EMPTY) {
    return true;
  }
  else {
    return false;
  }
}
function move(from, to, state) {
  if (Math.abs(state.board[from]) === W_PAWN) {
    let [x, y] = nonlinear(to);
    if (Math.abs(to - from) > 15) {
      state.enpeasant[0] = state.board[from] / Math.abs(state.board[from]);
      state.enpeasant[1] = to;
    }
    else if (y === 0 || y === 7) {
      state.board[from] = (state.board[from] < 0) ? B_QUEEN : W_QUEEN;
    }
    else {
      state.enpeasant[0] = 0;
      state.enpeasant[1] = -1;
    }
  }
  else if (Math.abs(state.board[from]) === W_KING) {
    let color = (state.board[from] > 0) ? 0 : 1;
    state.king_positions[color] = to;
  }
  state.board[to] = state.board[from];
  state.board[from] = EMPTY;
  console.log(state.king_positions[0],state.king_positions[1]);
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
  for (let i = 0; i < main_state.board.length; i++) {
    if (main_state.board[i] === EMPTY) {
      continue;
    };
    let [x, y] = nonlinear(i);
    let img = await images[main_state.board[i]];
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
    if (selected === -1 && has_move(position, main_state) && main_state.board[position] / Math.abs(main_state.board[position]) === curr_player) {
      selected = position;
      moves_highlight = movesFrom(position, main_state);
    }
    else if (selected !== -1) {
      if (legal_move(position, main_state)) {
        move(selected, position, main_state);
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
