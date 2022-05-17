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
const piece_set = "anarcandy";
// CASTLES
const WCS = 0;
const WCL = 1;
const BCS = 2;
const BCL = 3;
const WCS_MOV = 9;
const WCL_MOV = 10;
const BCS_MOV = 11;
const BCL_MOV = 12;
const WHITE = 1;
const BLACK = 2;
const EMPTY = 0;
const ROOK   = 1;
const KNIGHT = 2;
const KING   = 3;
const PAWN   = 4;
const QUEEN  = 5;
const BISHOP = 6;
const images = {"21" : loadImage(`./assets/pieces/${piece_set}/bR.svg`),
                "22" : loadImage(`./assets/pieces/${piece_set}/bN.svg`),
                "23" : loadImage(`./assets/pieces/${piece_set}/bK.svg`),
                "24" : loadImage(`./assets/pieces/${piece_set}/bP.svg`),
                "25" : loadImage(`./assets/pieces/${piece_set}/bQ.svg`),
                "26" : loadImage(`./assets/pieces/${piece_set}/bB.svg`),
                "11" : loadImage(`./assets/pieces/${piece_set}/wR.svg`),
                "12" : loadImage(`./assets/pieces/${piece_set}/wN.svg`),
                "13" : loadImage(`./assets/pieces/${piece_set}/wK.svg`),
                "14" : loadImage(`./assets/pieces/${piece_set}/wP.svg`),
                "15" : loadImage(`./assets/pieces/${piece_set}/wQ.svg`),
                "16" : loadImage(`./assets/pieces/${piece_set}/wB.svg`),};
class chess_state {
  constructor(board, king_positions, enpeasant, check, castles, turn) {
    this.board = board;
    this.king_positions = king_positions;
    this.enpeasant = enpeasant;
    this.check = check;
    this.castles = castles;
    this.turn = turn;
  }
  static copy(other) {
    return new chess_state(structuredClone(other.board),
                           {...other.king_positions},
                           {...other.enpeasant},
                           {...other.check},
                           [...other.castles],
                           other.turn);
  }
}
let main_state = new chess_state([{TYPE: ROOK, COLOR: BLACK}, {TYPE: KNIGHT, COLOR: BLACK}, {TYPE: BISHOP, COLOR: BLACK}, {TYPE: QUEEN, COLOR: BLACK}, {TYPE: KING, COLOR: BLACK}, {TYPE: BISHOP, COLOR: BLACK}, {TYPE: KNIGHT, COLOR: BLACK}, {TYPE: ROOK, COLOR: BLACK},
                         {TYPE: PAWN, COLOR: BLACK}, {TYPE: PAWN, COLOR: BLACK}, {TYPE: PAWN, COLOR: BLACK}, {TYPE: PAWN, COLOR: BLACK}, {TYPE: PAWN, COLOR: BLACK}, {TYPE: PAWN, COLOR: BLACK}, {TYPE: PAWN, COLOR: BLACK}, {TYPE: PAWN, COLOR: BLACK},
                         {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},
                         {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},
                         {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},
                         {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},  {TYPE: EMPTY, COLOR: EMPTY},
                         {TYPE: PAWN, COLOR: WHITE}, {TYPE: PAWN, COLOR: WHITE}, {TYPE: PAWN, COLOR: WHITE}, {TYPE: PAWN, COLOR: WHITE}, {TYPE: PAWN, COLOR: WHITE}, {TYPE: PAWN, COLOR: WHITE}, {TYPE: PAWN, COLOR: WHITE}, {TYPE: PAWN, COLOR: WHITE},
                         {TYPE: ROOK, COLOR: WHITE}, {TYPE: KNIGHT, COLOR: WHITE}, {TYPE: BISHOP, COLOR: WHITE}, {TYPE: QUEEN, COLOR: WHITE}, {TYPE: KING, COLOR: WHITE}, {TYPE: BISHOP, COLOR: WHITE}, {TYPE: KNIGHT, COLOR: WHITE}, {TYPE: ROOK, COLOR: WHITE},],
                         {WHITE: 60, BLACK: 4},
                         {COLOR: 0, POSITION: -1},
                         {WHITE: false, BLACK: false},
                         [1,1,1,1],
                         WHITE);
let recent_from = -1;
let recent_to = -1;
let selected = -1;
let curr_player = WHITE;
let gitflip = false;
let promote_piece = 5;

function promote(input) {
  promote_piece = input;
}
function pickColor(input) {
  curr_player = input;
}
function flip() {
  gitflip = !gitflip;
  selected = -1;
  moves_highlight = [];
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
function rookMoves(from, color, state) {
  let moves = [];
  let [x, y] = nonlinear(from);
  // row check
  for (let i=from-1; i>=from-x; i--) {
    if (state.board[i].TYPE === EMPTY) {
      moves.push([from,i,0]);
    }
    else {
      if (state.board[i].COLOR !== color) {
        moves.push([from,i,0]);
      }
      break;
    }
  }
  for (let i = from+1; i<(y*w_squares)+8; i++) {
    if (state.board[i].TYPE === EMPTY) {
      moves.push([from,i,0]);
    }
    else {
      if (state.board[i].COLOR !== color) {
        moves.push([from,i,0]);
      }
      break;
    }
  }

  // column check

  for (let i=from-w_squares; i>=x; i-=w_squares) {
    if (state.board[i].TYPE === EMPTY) {
      moves.push([from,i,0]);
    }
    else {
      if (state.board[i].COLOR !== color) {
        moves.push([from,i,0]);
      }
      break;
    }
  }
  for (let i=from+w_squares; i<(w_squares*h_squares); i+=w_squares) {
    if (state.board[i].TYPE === EMPTY) {
      moves.push([from,i,0]);
    }
    else {
      if (state.board[i].COLOR !== color) {
        moves.push([from,i,0]);
      }
      break;
    }
  }
  return moves;
}

function knightMoves(from, color, state) {
  let moves = [];
  let [x,y] = nonlinear(from);
  let x_mov, y_mov, lin_pos;
  for (let i=-2;i<3;i++) {
    for (let j=-2;j<3;j++) {
      if (i===0 || j===0 || Math.abs(i)===Math.abs(j))
        continue;
      [x_mov,y_mov] = [x+i, y+j];
      lin_pos = linear(x_mov,y_mov);
      if (inBound(x_mov,y_mov) && (state.board[lin_pos].TYPE === EMPTY || state.board[lin_pos].COLOR  !== color))
        moves.push([from,lin_pos,0]);
    }
  }
  return moves;
}
function diag_calc(x, y, color, state, moves, from, booli) {
  if (booli && inBound(x, y)) {
      let pos = linear(x, y);
      if (state.board[pos].COLOR !== color) moves.push([from,pos,0]);
      if (state.board[pos].TYPE !== EMPTY) {
        return false;
      }
    }
  return booli;
}
function check_diag(x, y, color, board, checked, booli, offset) {
  if (booli[offset] && inBound(x, y)) {
    let pos = linear(x, y);
    if (board[pos].TYPE!==EMPTY) booli[offset] = false;
    if (board[pos].COLOR!==color && board[pos].TYPE>PAWN) {
      checked = true;
    }
  }
  return checked;
}
function bishopMoves(from, color, state) {
  let moves = [];
  let [x, y] = nonlinear(from);
  let direction = [true, true, true, true];
  for (let i = 1; i < w_squares; i++) {
    direction[0] = diag_calc(x+i,y+i,color,state,moves,from,direction[0]);
    direction[1] = diag_calc(x+i,y-i,color,state,moves,from,direction[1]);
    direction[2] = diag_calc(x-i,y+i,color,state,moves,from,direction[2]);
    direction[3] = diag_calc(x-i,y-i,color,state,moves,from,direction[3]);
  }
  return moves;
}
function kingMoves(from, color, state) {
  let moves = [];
  let [x, y] = nonlinear(from);
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if ((i===0&&j===0) || x+i<0 || x+i>7 || y+j<0 || y+j>7) continue;
      let pos = linear(x+i,y+j);
      if (state.board[pos].COLOR !== color) {
        moves.push([from,pos,0]);
      }
    }
  }
  if (color === WHITE) {
    if (state.castles[WCS] === 1) {
      if (state.board[from+1].TYPE === EMPTY && state.board[from+2].TYPE === EMPTY) {
        if (!underAttack(color, from+1, state) && !underAttack(color, from+2, state)) {
          moves.push([from, from+2, WCS_MOV]);
        }
      }
    }
    if (state.castles[WCL] === 1) {
      if (state.board[from-1].TYPE === EMPTY && state.board[from-2].TYPE === EMPTY && state.board[from-3].TYPE === EMPTY) {
        if (!underAttack(color, from-1, state) && !underAttack(color, from-2, state) && !underAttack(color, from-3, state)) {
          moves.push([from, from-2, WCL_MOV]);
        }
      }
    }
  }
  if (color === BLACK) {
    if (state.castles[BCS] === 1) {
      if (state.board[from+1].TYPE === EMPTY && state.board[from+2].TYPE === EMPTY) {
        if (!underAttack(color, from+1, state) && !underAttack(color, from+2, state)) {
          moves.push([from, from+2, BCS_MOV]);
        }
      }
    }
    if (state.castles[BCL] === 1) {
      if (state.board[from-1].TYPE === EMPTY && state.board[from-2].TYPE === EMPTY && state.board[from-3].TYPE === EMPTY) {
        if (!underAttack(color, from-1, state) && !underAttack(color, from-2, state) && !underAttack(color, from-3, state)) {
          moves.push([from, from-2, BCL_MOV]);
        }
      }
    }
  }
  return moves;
}
function pawnMoves(from, color, state) {
  let moves = [];
  let [x, y] = nonlinear(from);
  let going_up = (color===WHITE)
  let inc = w_squares - ((w_squares * 2) * going_up)
  if (state.board[from + inc].TYPE===EMPTY) {
    moves.push([from,from + inc,0]);
    if (((going_up && y===6) || (!going_up && y===1)) && (state.board[from + inc + inc].TYPE===EMPTY)) {
      moves.push([from,from + inc + inc,0]);
    }
  }
  let y_move = (going_up) ? y-1 : y+1;
  function calculate(x_offset) {
    let lin_pos = linear(x_offset, y_move);
    if ((state.board[lin_pos].TYPE!==EMPTY && state.board[lin_pos].COLOR!==color) || (state.board[lin_pos].TYPE===EMPTY && color!==state.enpeasant.COLOR && linear(x_offset, y)===state.enpeasant.POSITION)) {
      moves.push([from,linear(x_offset, y_move),0]);
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
function queenMoves(from, color, state) {
  let moves = [];
  let [x, y] = nonlinear(from);
  let direction = [true, true, true, true];
  for (let i = 1; i < w_squares; i++) {
    direction[0] = diag_calc(x+i,y+i,color,state,moves,from,direction[0]);
    direction[1] = diag_calc(x+i,y-i,color,state,moves,from,direction[1]);
    direction[2] = diag_calc(x-i,y+i,color,state,moves,from,direction[2]);
    direction[3] = diag_calc(x-i,y-i,color,state,moves,from,direction[3]);
  }
  for (let i=from-1; i>=from-x; i--) {
    if (state.board[i].TYPE === EMPTY) {
      moves.push([from,i,0]);
    }
    else {
      if (state.board[i].COLOR !== color) {
        moves.push([from,i,0]);
      }
      break;
    }
  }
  for (let i=from+1; i<(y*w_squares)+8; i++) {
    if (state.board[i].TYPE === EMPTY) {
      moves.push([from,i,0]);
    }
    else {
      if (state.board[i].COLOR !== color) {
        moves.push([from,i,0]);
      }
      break;
    }
  }

  // column check

  for (let i=from-w_squares; i>=x; i-=w_squares) {
    if (state.board[i].TYPE === EMPTY) {
      moves.push([from,i,0]);
    }
    else {
      if (state.board[i].COLOR !== color) {
        moves.push([from,i,0]);
      }
      break;
    }
  }
  for (let i=from+w_squares; i<(w_squares*h_squares); i+=w_squares) {
    if (state.board[i].TYPE === EMPTY) {
      moves.push([from,i,0]);
    }
    else {
      if (state.board[i].COLOR !== color) {
        moves.push([from,i,0]);
      }
      break;
    }
  }
  return moves;
}
function movesFrom(from, state) {
  let moves = [];
  let color = state.board[from].COLOR;
  switch(state.board[from].TYPE) {
    case ROOK:
      moves = rookMoves(from, color, state);
      break;
    case KNIGHT:
      moves = knightMoves(from, color, state);
      break;
    case BISHOP:
      moves = bishopMoves(from, color, state);
      break;
    case KING:
      moves = kingMoves(from, color, state);
      break;
    case QUEEN:
      moves = queenMoves(from, color, state);
      break;
    case PAWN:
      moves = pawnMoves(from, color, state);
      break;
    default:
      break;
  }
  return filter_moves(color, moves, state);
}
function filter_moves(color, moves, state) {
  let temp_state;
  let good_moves = [];
  for (let val of moves) {
    temp_state = chess_state.copy(state);
    move(val,temp_state);
    if (!underAttack(color, ((color === WHITE) ? temp_state.king_positions.WHITE : temp_state.king_positions.BLACK), temp_state)) {
      good_moves.push(val);
    }
  }
  return good_moves;
}
function underAttack(color, pos, state) {
  let [x,y] = nonlinear(pos);
  let checked = false;
  // pawn checks
  let temp_x,temp_y, temp_val;
  let offset = (color===WHITE) ? 1 : -1;
  for (let val of [x-1,x+1]) {
    if (inBound(val, y-offset)) {
      temp_val = linear(val, y-offset);
      if (state.board[temp_val].TYPE>KNIGHT && state.board[temp_val].COLOR!==color) {
        return true;
      }
    }
  }
  // oppo king check
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      temp_x = x+i;
      temp_y = y+j;
      if ((i===0&&j===0) || !inBound(temp_x,temp_y)) continue;
      if (state.board[linear(temp_x,temp_y)].TYPE===KING && state.board[linear(temp_x,temp_y)].COLOR!==color) {
        return true;
      }
    }
  }

  // diagonal check for queen/bishops
  let lines = [true, true, true, true];
  for (let i=1; i<w_squares; i++) {
    if (checked=check_diag(x+i,y+i,color,state.board,checked,lines,0))
      return checked;
    if (checked=check_diag(x+i,y-i,color,state.board,checked,lines,1))
      return checked;
    if (checked=check_diag(x-i,y+i,color,state.board,checked,lines,2))
      return checked;
    if (checked=check_diag(x-i,y-i,color,state.board,checked,lines,3))
      return checked;
  }
  // column/row check for queen/rooks
  for (let i=pos-1; i>=pos-x; i--) {
    if (state.board[i].TYPE!==EMPTY) {
      if (state.board[i].COLOR!==color && (state.board[i].TYPE===ROOK || state.board[i].TYPE===QUEEN)) {
          return true;
      }
      break;
    }
  }
  for (let i=pos+1; i<(y*w_squares)+8; i++) {
    if (state.board[i].TYPE!==EMPTY) {
      if (state.board[i].COLOR!==color && (state.board[i].TYPE===ROOK || state.board[i].TYPE===QUEEN)) {
          return true;
      }
      break;
    }
  }

  // column check

  for (let i=pos-w_squares; i>=x; i-=w_squares) {
    if (state.board[i].TYPE!==EMPTY) {
      if (state.board[i].COLOR!==color && (state.board[i].TYPE===ROOK || state.board[i].TYPE===QUEEN)) {
          return true;
      }
      break;
    }
  }
  for (let i=pos+w_squares; i<(w_squares*h_squares); i+=w_squares) {
    if (state.board[i].TYPE!==EMPTY) {
      if (state.board[i].COLOR!==color && (state.board[i].TYPE===ROOK || state.board[i].TYPE===QUEEN)) {
          return true;
      }
      break;
    }
  }
  // knight check
  for (let i=-2;i<3;i++) {
    for (let j=-2;j<3;j++) {
      if (i===0 || j===0 || Math.abs(i)===Math.abs(j))
        continue;
      [temp_x,temp_y] = [x+i, y+j];
      temp_val = linear(temp_x,temp_y);
      if (inBound(temp_x,temp_y) && state.board[temp_val].TYPE===KNIGHT && state.board[temp_val].COLOR!==color)
        return true;
    }
  }
  return checked;
}
function move(mov, state) {
  let from = mov[0];
  let to = mov[1];
  let special = mov[2];
  switch(to) {
    case 63:
      state.castles[WCS] = 0;
      break;
    case 56:
      state.castles[WCL] = 0;
      break;
    case 7:
      state.castles[BCS] = 0;
      break;
    case 0:
      state.castles[BCL] = 0;
      break;
  }
  if (state.board[from].TYPE===PAWN) {
    let [x, y] = nonlinear(to);
    if (Math.abs(to-from) > 15) {
      state.enpeasant.COLOR = state.board[from].COLOR;
      state.enpeasant.POSITION = to;
    }
    else if (y===0 || y===7) {
      state.board[from].TYPE = promote_piece;
      state.enpeasant.COLOR = 0;
      state.enpeasant.POSITION = -1;
    }
    else {
      state.enpeasant.COLOR = 0;
      state.enpeasant.POSITION = -1;
    }
  }
  else if (state.board[from].TYPE===ROOK) {
    if (from === 63) {
      state.castles[WCS] = 0;
    }
    else if (from === 56) {
      state.castles[WCL] = 0;
    }
    else if (from === 7) {
      state.castles[BCS] = 0;
    }
    else if (from === 0) {
      state.castles[BCL] = 0;
    }
  }
  else if (state.board[from].TYPE===KING) {
    if (state.board[from].COLOR===WHITE) {
      state.castles[WCS] = 0;
      state.castles[WCL] = 0;
      state.king_positions.WHITE = to;
    }
    else {
      state.castles[BCS] = 0;
      state.castles[BCL] = 0;
      state.king_positions.BLACK = to;
    }
  }
  state.board[to].TYPE = state.board[from].TYPE;
  state.board[to].COLOR = state.board[from].COLOR;
  state.board[from].TYPE = EMPTY;
  state.board[from].COLOR = EMPTY;
  switch(special) {
    case WCS_MOV:
      state.board[63].TYPE = EMPTY;
      state.board[63].COLOR = EMPTY;
      state.board[from+1].TYPE = ROOK;
      state.board[from+1].COLOR = state.board[to].COLOR;
      break;
    case WCL_MOV:
      state.board[56].TYPE = EMPTY;
      state.board[56].COLOR = EMPTY;
      state.board[from-1].TYPE = ROOK;
      state.board[from-1].COLOR = state.board[to].COLOR;
      break;
    case BCS_MOV:
      state.board[7].TYPE = EMPTY;
      state.board[7].COLOR = EMPTY;
      state.board[from+1].TYPE = ROOK;
      state.board[from+1].COLOR = state.board[to].COLOR;
      break;
    case BCL_MOV:
      state.board[0].TYPE = EMPTY;
      state.board[0].COLOR = EMPTY;
      state.board[from-1].TYPE = ROOK;
      state.board[from-1].COLOR = state.board[to].COLOR;
      break;
    default:
      break;
  }
}

////////////////////////////////////////////////////////////////////

function render_board() {
  for (let i = 0; i < w_squares; i++) {
    for (let j = 0; j < h_squares; j++) {
      ctx.fillStyle = border_color;
      ctx.fillRect(i*width,j*height,width,height);
      ctx.fillStyle = (j % 2 === i % 2) ? sq_lcolor : sq_dcolor;
      let [x,y] = (gitflip) ? [7-i,7-j] : [i,j]; 
      let pos = linear(x,y);
      if (selected === pos) ctx.fillStyle = selected_color;
      else if (findSelected(moves_highlight, pos) !== null) ctx.fillStyle = highlight_color;
      ctx.fillRect(i*width,j*height,width-1,height-1);
    }
  }
}
async function render_state() {
  render_board();
  for (let i in main_state.board) {
    if (main_state.board[i].TYPE===EMPTY) {
      continue;
    };
    let [x, y] = nonlinear(i);
    [x, y] = (gitflip) ? [7-x,7-y] : [x,y];
    let str = main_state.board[i].COLOR + "" + main_state.board[i].TYPE;
    let img = await images[str];
    ctx.drawImage(img, (x*width)+(width/16), (y*height)+(width/16), 65, 65);
  }
}
function findSelected(moves, pos) {
  for (let mov of moves) {
    if (mov[1] === pos) {
      return mov;
    }
  }
  return null;
}
function bind_click() {
  c.addEventListener("mousedown", function(e) {
    let rect = c.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / width) | 0;
    let y = ((e.clientY - rect.top) / height) | 0;
    if (x > 7 || y > 7) return;
    [x, y] = (gitflip) ? [7-x,7-y] : [x,y];
    let position = linear(x, y);
    if (selected === -1 && main_state.board[position].TYPE !== EMPTY && main_state.board[position].COLOR === curr_player) {
      selected = position;
      moves_highlight = movesFrom(position, main_state);
      if(moves_highlight.length < 1) selected = -1;
    }
    else if (selected !== -1) {
      let mov = findSelected(moves_highlight, position);
      if (mov !== null) {
        move(mov, main_state);
      }
      selected = -1;
      moves_highlight = [];
    }
    render_state();
  });
}
function init() {
  c.onselectstart = function () { return false; }
  render_state();
  bind_click();
}
window.addEventListener("DOMContentLoaded", init());
