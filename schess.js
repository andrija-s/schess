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
const W_KING   = 3;
const W_PAWN   = 4;
const W_QUEEN  = 5;
const W_BISHOP = 6;
const B_ROOK   = -1;
const B_KNIGHT = -2;
const B_KING   = -3;
const B_PAWN   = -4;
const B_QUEEN  = -5;
const B_BISHOP = -6;
const images = {"-1"   : loadImage(`./assets/pieces/${piece_set}/bR.svg`),
                "-2" : loadImage(`./assets/pieces/${piece_set}/bN.svg`),
                "-3" : loadImage(`./assets/pieces/${piece_set}/bK.svg`),
                "-4"   : loadImage(`./assets/pieces/${piece_set}/bP.svg`),
                "-5"  : loadImage(`./assets/pieces/${piece_set}/bQ.svg`),
                "-6"   : loadImage(`./assets/pieces/${piece_set}/bB.svg`),
                "1"   : loadImage(`./assets/pieces/${piece_set}/wR.svg`),
                "2" : loadImage(`./assets/pieces/${piece_set}/wN.svg`),
                "3" : loadImage(`./assets/pieces/${piece_set}/wK.svg`),
                "4"   : loadImage(`./assets/pieces/${piece_set}/wP.svg`),
                "5"  : loadImage(`./assets/pieces/${piece_set}/wQ.svg`),
                "6"   : loadImage(`./assets/pieces/${piece_set}/wB.svg`),};
class chess_state {
  constructor(board, king_positions, enpeasant, check, flipped, castles, turn) {
    this.board = board;
    this.king_positions = king_positions;
    this.enpeasant = enpeasant;
    this.check = check;
    this.flipped = flipped;
    this.castles = castles;
    this.turn = turn;
  }
  static copy(other) {
    return new chess_state(new Int8Array(other.board),
                           new Int8Array(other.king_positions),
                           new Int8Array(other.enpeasant),
                           new Int8Array(other.check),
                           new Int8Array(other.flipped),
                           new Int8Array(other.castles),
                           new Int8Array(other.turn));
  }
}
let main_state = new chess_state(new Int8Array([B_ROOK, B_KNIGHT, B_BISHOP, B_QUEEN, B_KING, B_BISHOP, B_KNIGHT, B_ROOK,
                         B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN,
                         EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,
                         EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,
                         EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,
                         EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,  EMPTY,
                         W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN,
                         W_ROOK, W_KNIGHT, W_BISHOP, W_QUEEN, W_KING, W_BISHOP, W_KNIGHT, W_ROOK,]),
                         new Int8Array([60, 4]),
                         new Int8Array([0, -1]),
                         new Int8Array(2),
                         new Int8Array([0]),
                         new Int8Array([1,1,1,1]),
                         new Int8Array(1));
let recent_from = -1;
let recent_to = -1;
let selected = -1;
let curr_player = 1;

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
function knight_calc(x, y, player, state) {
  return (inBound(x,y) && (state.board[linear(x,y)] === 0 || (state.board[linear(x,y)] / Math.abs(state.board[linear(x,y)])) !== player));
}
function knightMoves(from, player, state) {
  let moves = [];
  let [x,y] = nonlinear(from);
  let x_mov, y_mov;
  for (let i=-2;i<3;i++) {
    for (let j=-2;j<3;j++) {
      if (i===0 || j===0 || Math.abs(i)===Math.abs(j))
        continue;
      [x_mov,y_mov] = [x+i, y+j];
      if (knight_calc(x_mov,y_mov,player,state))
        moves.push(linear(x_mov,y_mov));
    }
  }
  return moves;
}
function diag_calc(x, y, player, state, moves, booli) {
  if (booli && inBound(x, y)) {
      let pos = linear(x, y);
      if (state.board[pos] / Math.abs(state.board[pos]) !== player) moves.push(pos);
      if (state.board[pos] !== EMPTY) {
        return false;
      }
    }
  return booli;
}
function bishopMoves(from, player, state) {
  let moves = [];
  let [x, y] = nonlinear(from);
  let plusplus = true;
  let plusmin = true;
  let minplus = true;
  let minmin = true;
  for (let i = 1; i < w_squares; i++) {
    plusplus = diag_calc(x+i,y+i,player,state,moves,plusplus);
    plusmin  = diag_calc(x+i,y-i,player,state,moves,plusmin);
    minplus  = diag_calc(x-i,y+i,player,state,moves,minplus);
    minmin   = diag_calc(x-i,y-i,player,state,moves,minmin);
  }
  return moves;
}
function kingMoves(from, player, state) {
  let moves = [];
  let [x, y] = nonlinear(from);
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if ((i===0&&j===0) || x+i<0 || x+i>7 || y+j<0 || y+j>7) continue;
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
  for (let i = 1; i < w_squares; i++) {
    plusplus = diag_calc(x+i,y+i,player,state,moves,plusplus);
    plusmin  = diag_calc(x+i,y-i,player,state,moves,plusmin);
    minplus  = diag_calc(x-i,y+i,player,state,moves,minplus);
    minmin   = diag_calc(x-i,y-i,player,state,moves,minmin);
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
  let color = state.board[from] / Math.abs(state.board[from]);
  switch(Math.abs(state.board[from])) {
    case W_ROOK:
      moves = rookMoves(from, color, state);
      break;
    case W_KNIGHT:
      moves = knightMoves(from, color, state);
      break;
    case W_BISHOP:
      moves = bishopMoves(from, color, state);
      break;
    case W_KING:
      moves = kingMoves(from, color, state);
      break;
    case W_QUEEN:
      moves = queenMoves(from, color, state);
      break;
    case W_PAWN:
      moves = pawnMoves(from, color, state);
      break;
    default:
      break;
  }
  return filter_moves(color, from, moves, state);
}
function check_diag(x, y, color, board, checked, booli, offset) {
  if (booli[offset] && inBound(x, y)) {
    let pos = linear(x, y);
    let val = Math.abs(board[pos]);
    if (board[pos]!==EMPTY) booli[offset] = false;
    if (board[pos]/val===color*(-1) && val>4) {
      checked = true;
    }
  }
  return checked;
}
function filter_moves(color, from, moves, state) {
  let temp_state = chess_state.copy(state);
  let good_moves = [];
  for (let val of moves) {
    move(from,val,temp_state);
    if (!underAttack(color, temp_state.king_positions[((color < 0) ? 1 : 0)], temp_state.flipped[0], temp_state.board)) {
      good_moves.push(val);
    }
    temp_state = chess_state.copy(state);
  }
  return good_moves;
}
function underAttack(color, pos, flipped, board) {
  let [x,y] = nonlinear(pos);
  let checked = false;

  // pawn checks
  let direction = ((color===1 && flipped===0) || (color===-1 && flipped===1)) ? -1 : 1;
  let temp_val,abs_val,temp_x,temp_y;
  if (inBound(x+1, y+direction)) {
    temp_val = board[linear(x+1, y+direction)];
    abs_val = Math.abs(temp_val);
    if (abs_val>3 && temp_val/abs_val!==color) {
      return true;
    }
  }
  // oppo king check
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      temp_x = x+i;
      temp_y = y+j;
      if ((i===0&&j===0) || !inBound(temp_x,temp_y)) continue;
      abs_val = Math.abs(board[linear(temp_x,temp_y)]);
      if (abs_val === 3) {
        return true;
      }
    }
  }
  if (inBound(x-1, y+direction)) {
    temp = board[linear(x-1, y+direction)];
    abs_val = Math.abs(temp);
    if (abs_val>3 && temp/abs_val!==color) {
      return true;
    }
  }
  // diagonal check for queen/bishops
  let lines = [true, true, true, true];
  for (let i=1; i<w_squares; i++) {
    if (checked=check_diag(x+i,y+i,color,board,checked,lines,0))
      return checked;
    if (checked=check_diag(x+i,y-i,color,board,checked,lines,1))
      return checked;
    if (checked=check_diag(x-i,y+i,color,board,checked,lines,2))
      return checked;
    if (checked=check_diag(x-i,y-i,color,board,checked,lines,3))
      return checked;
  }
  // column/row check for queen/rooks
  lines = [true, true, true, true];
  for (let i=pos-1; i>=pos-x; i--) {
    if (board[i] !== EMPTY) {
      abs_val = Math.abs(board[i]);
      if (board[i]/abs_val!==color && (abs_val==W_ROOK || abs_val==W_QUEEN)) {
          return true;
      }
      break;
    }
  }
  for (let i = pos+1; i<(y*w_squares)+8; i++) {
    if (board[i] !== EMPTY) {
      abs_val = Math.abs(board[i]);
      if (board[i]/abs_val!==color && (abs_val==W_ROOK || abs_val==W_QUEEN)) {
          return true;
      }
      break;
    }
  }

  // column check

  for (let i=pos-w_squares; i>=x; i-=w_squares) {
    if (board[i] !== EMPTY) {
      abs_val = Math.abs(board[i]);
      if (board[i]/abs_val!==color && (abs_val==W_ROOK || abs_val==W_QUEEN)) {
          return true;
      }
      break;
    }
  }
  for (let i=pos+w_squares; i<(w_squares*h_squares); i+=w_squares) {
    if (board[i] !== EMPTY) {
      abs_val = Math.abs(board[i]);
      if (board[i]/abs_val!==color && (abs_val==W_ROOK || abs_val==W_QUEEN)) {
          return true;
      }
      break;
    }
  }
  // knight check
  let x_mov, y_mov;
  for (let i=-2;i<3;i++) {
    for (let j=-2;j<3;j++) {
      if (i===0 || j===0 || Math.abs(i)===Math.abs(j))
        continue;
      [x_mov,y_mov] = [x+i, y+j];
      temp_val = linear(x_mov,y_mov);
      abs_val = Math.abs(board[temp_val]);
      if (inBound(x_mov,y_mov) && abs_val === 2 && (board[temp_val] / abs_val) !== color)
        return true;
    }
  }
  return checked;
}
function move(from, to, state) {
  if (Math.abs(state.board[from]) === W_PAWN) {
    let [x, y] = nonlinear(to);
    if (Math.abs(to-from) > 15) {
      state.enpeasant[0] = state.board[from] / Math.abs(state.board[from]);
      state.enpeasant[1] = to;
    }
    else if (y===0 || y===7) {
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
    if (selected === -1 && main_state.board[position] !== 0 && main_state.board[position] / Math.abs(main_state.board[position]) === curr_player) {
      selected = position;
      moves_highlight = movesFrom(position, main_state);
      if(moves_highlight.length < 1) selected = -1;
    }
    else if (selected !== -1) {
      if (moves_highlight.includes(position)) {
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
