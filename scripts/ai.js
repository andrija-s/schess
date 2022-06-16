import {Game, WHITE, BLACK, EMPTY, BISHOP, QUEEN, PAWN, KNIGHT, ROOK, SQUARES_H, SQUARES_W} from "./game.js";

// const transpositions = {};
const PAWN_POS = 
[0, 0, 0, 0, 0, 0, 0, 0,
 50, 50, 50, 50, 50, 50, 50, 50,
 10, 10, 20, 30, 30, 20, 10, 10,
 5, 5, 10, 25, 25, 10, 5, 5,
 0, 0, 0, 20, 20, 0, 0, 0,
 5,-5,-10, 0, 0,-10,-5, 5,
 5, 10, 10,-25,-25, 10, 10, 5,
 0, 0, 0, 0, 0, 0, 0, 0];
const KNIGHT_POS = 
[-50,-40,-30,-30,-30,-30,-40,-50,
 -40,-20, 0, 0, 0, 0,-20,-40,
 -30, 0, 10, 15, 15, 10, 0,-30,
 -30, 5, 15, 20, 20, 15, 5,-30,
 -30, 0, 15, 20, 20, 15, 0,-30,
 -30, 5, 10, 15, 15, 10, 5,-30,
 -40,-20, 0, 5, 5, 0,-20,-40,
 -50,-40,-30,-30,-30,-30,-40,-50];
const BISHOP_POS = 
[-20,-10,-10,-10,-10,-10,-10,-20,
 -10, 0, 0, 0, 0, 0, 0,-10,
 -10, 0, 5, 10, 10, 5, 0,-10,
 -10, 5, 5, 10, 10, 5, 5,-10,
 -10, 0, 10, 10, 10, 10, 0,-10,
 -10, 10, 10, 10, 10, 10, 10,-10,
 -10, 5, 0, 0, 0, 0, 5,-10,
 -20,-10,-10,-10,-10,-10,-10,-20];
const ROOK_POS =
[0, 0, 0, 0, 0, 0, 0, 0,
 5, 10, 10, 10, 10, 10, 10, 5,
-5, 0, 0, 0, 0, 0, 0,-5,
-5, 0, 0, 0, 0, 0, 0,-5,
-5, 0, 0, 0, 0, 0, 0,-5,
-5, 0, 0, 0, 0, 0, 0,-5,
-5, 0, 0, 0, 0, 0, 0,-5,
 0, 0, 5, 5, 5, 0, 0, 0];
const QUEEN_POS =
[-20,-10,-10,-5,-5,-10,-10,-20,
 -10, 0, 0, 0, 0, 0, 0,-10,
 -10, 0, 5, 5, 5, 5, 0,-10,
 -5, 0, 5, 5, 5, 5, 0,-5,
  0, 0, 5, 5, 5, 5, 0,-5,
 -10, 5, 5, 5, 5, 5, 0,-10,
 -10, 0, 5, 0, 0, 0, 0,-10,
 -20,-10,-10,-5,-5,-10,-10,-20];
const KINGMID_POS =
[-30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -20,-30,-30,-40,-40,-30,-30,-20,
 -10,-20,-20,-20,-20,-20,-20,-10,
  20, 20, 0, 0, 0, 0, 20, 20,
  20, 30, 10, 0, 0, 10, 30, 20];
const KINGEND_POS =
[-50,-40,-30,-20,-20,-30,-40,-50,
 -30,-20,-10, 0, 0,-10,-20,-30,
 -30,-10, 20, 30, 30, 20,-10,-30,
 -30,-10, 30, 40, 40, 30,-10,-30,
 -30,-10, 30, 40, 40, 30,-10,-30,
 -30,-10, 20, 30, 30, 20,-10,-30,
 -30,-30, 0, 0, 0, 0. ,-30,-30,
 -50,-30,-30,-30,-30,-30,-30,-50];
/* function hasher(state) {
  let val = "";
  for (let i=0; i<state.board_color.length; i++) {
    val += state.board_color[i];
    val += state.board_type[i];
  }
  for (let i=0; i<state.castles.length; i++) {
    val += state.castles[i];
  }
  val += state.turn % 2;
  return val;
} */
/**
 * 
 * @param {Game} state state being evaluated
 * @param {Number} player player making the search
 * @returns Number evaluation value
 */
function eval_board(state, player) {
  let value = 0;
  let w_queen_alive = false, b_queen_alive = false;
  let w_bishops = 0, b_bishops = 0, w_knights = 0, b_knights = 0, w_rooks = 0, b_rooks = 0;
  for (let i=0; i<SQUARES_H*SQUARES_W; i++) {
    if (state.get_type(i)===EMPTY) continue;
    let color = state.get_color(i);
    let c = (color===player) ? 1 : -1;
    let pos_eval = (state.get_color(i)===BLACK) ? 63 - i : i;
    switch (state.get_type(i)) {
      case BISHOP:
        value += (330+BISHOP_POS[pos_eval]) * c;
        if (color===WHITE) w_bishops += 1;
        else b_bishops += 1;
        break;
      case KNIGHT:
        value += (320+KNIGHT_POS[pos_eval]) * c;
        if (color===WHITE) w_knights += 1;
        else b_knights += 1;
        break;
      case QUEEN:
        value += (900+QUEEN_POS[pos_eval]) * c;
        if (color===WHITE) w_queen_alive = true;
        else b_queen_alive = true;
        break;
      case ROOK:
        value += (500+ROOK_POS[pos_eval]) * c;
        if (color===WHITE) w_rooks += 1;
        else b_rooks += 1;
        break;
      case PAWN:
        value += (100+PAWN_POS[pos_eval]) * c;
        break;
    }
  }
  if (w_queen_alive || w_knights+w_bishops+w_rooks>3) {
    value += KINGMID_POS[63 - state.king_pos(BLACK)] * ((BLACK===player) ? 1 : -1);
  } else {
    value += KINGEND_POS[63 - state.king_pos(BLACK)] * ((BLACK===player) ? 1 : -1);
  }
  if (b_queen_alive || b_knights+b_bishops+b_rooks>3) {
    value += KINGMID_POS[state.king_pos(WHITE)] * ((WHITE===player) ? 1 : -1);
  } else {
    value += KINGEND_POS[state.king_pos(WHITE)] * ((WHITE===player) ? 1 : -1);
  }
  return value;
}
/**
 * 
 * @param {Number} depth 
 * @param {Game} state 
 * @param {Number} player 
 * @param {Number} alpha default: -inf
 * @param {Number} beta default: inf
 * @param {Boolean} max_player default: true
 * @returns Array [Number, Move object, Number]
 */
function ai(depth, state, player, alpha=Number.NEGATIVE_INFINITY,
                                  beta=Number.POSITIVE_INFINITY,
                                  max_player=true) {
  
  /* let hash = hasher(state);
  if (transpositions.hasOwnProperty(hash)) {
    if (transpositions[hash].DEPTH >= depth) return [transpositions[hash].VALUE, transpositions[hash].MOVE, 1];
  } */
  let value;
  if (depth < 1) {
    value = eval_board(state, player);
    return [value, null, 1]
  }
  let possible_moves = state.all_moves();
  let best_move = (possible_moves.length > 0) ? possible_moves[0] : null;
  let best_val = max_player ? Number.NEGATIVE_INFINITY
                            : Number.POSITIVE_INFINITY;
  let sum = 0;
  let explore;
  if (max_player) {
    for (let mov of possible_moves) {
      state.move(mov);
      explore = ai(depth-1, state, player, alpha, beta, !max_player);
      value = explore[0];
      sum += explore[2];
      state.unmove()
      if (value > best_val) {
        best_val = value;
        best_move = mov;
      }
      if (best_val >= beta) break;
      alpha = Math.max(alpha, best_val);
    }
  }
  else {
    for (let mov of possible_moves) {
      state.move(mov);
      explore = ai(depth-1, state, player, alpha, beta, !max_player);
      value = explore[0];
      sum += explore[2];
      state.unmove();
      if (value < best_val) {
        best_val = value;
        best_move = mov;
      }
      if (best_val <= alpha) break;
      beta = Math.min(beta, best_val);
    }
  }
  // tie
  if (best_move===null) {
    let color = (state.turn % 2===0) ? WHITE : BLACK;
    if (!state.under_attack(color, state.king_pos(color))) best_val=0;
  }
  /* transpositions[hash] = {DEPTH: depth, VALUE: best_val, MOVE: best_move}; */
  return [best_val, best_move, sum];
}
onmessage = function(event) {
  let state = new Game('');
  state.copy(event.data.state);

 
  let move = ai(event.data.depth, state, event.data.color);
  postMessage(move);

};