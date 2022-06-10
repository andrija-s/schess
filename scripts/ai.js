import {Game, WHITE, BLACK, EMPTY, BISHOP, QUEEN, PAWN, KNIGHT, ROOK, SQUARES_H, SQUARES_W} from "./game.js";

const PAWN_POS = 
[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
 0.1, 0.1, 0.2, 0.3, 0.3, 0.2, 0.1, 0.1,
 .05, .05, 0.1, .25, .25, 0.1, .05, .05,
 0.0, 0.0, 0.0, 0.2, 0.2, 0.0, 0.0, 0.0,
 .05,-.05,-0.1, 0.0, 0.0,-0.1,-.05, .05,
 .05, 0.1, 0.1,-.25,-.25, 0.1, 0.1, .05,
 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
const KNIGHT_POS = 
[-0.5,-0.4,-0.3,-0.3,-0.3,-0.3,-0.4,-0.5,
 -0.4,-0.2, 0.0, 0.0, 0.0, 0.0,-0.2,-0.4,
 -0.3, 0.0, 0.1, .15, .15, 0.1, 0.0,-0.3,
 -0.3, .05, .15, 0.2, 0.2, .15, .05,-0.3,
 -0.3, 0.0, .15, 0.2, 0.2, .15, 0.0,-0.3,
 -0.3, .05, 0.1, .15, .15, 0.1, .05,-0.3,
 -0.4,-0.2, 0.0, .05, .05, 0.0,-0.2,-0.4,
 -0.5,-0.4,-0.3,-0.3,-0.3,-0.3,-0.4,-0.5];
const BISHOP_POS = 
[-0.2,-0.1,-0.1,-0.1,-0.1,-0.1,-0.1,-0.2,
 -0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,-0.1,
 -0.1, 0.0, .05, 0.1, 0.1, .05, 0.0,-0.1,
 -0.1, .05, .05, 0.1, 0.1, .05, .05,-0.1,
 -0.1, 0.0, 0.1, 0.1, 0.1, 0.1, 0.0,-0.1,
 -0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,-0.1,
 -0.1, .05, 0.0, 0.0, 0.0, 0.0, .05,-0.1,
 -0.2,-0.1,-0.1,-0.1,-0.1,-0.1,-0.1,-0.2];
const ROOK_POS =
[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
 .05, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, .05,
-.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,-.05,
-.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,-.05,
-.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,-.05,
-.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,-.05,
-.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,-.05,
 0.0, 0.0, .05, .05, .05, 0.0, 0.0, 0.0];
const QUEEN_POS =
[-0.2,-0.1,-0.1,-.05,-.05,-0.1,-0.1,-0.2,
 -0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,-0.1,
 -0.1, 0.0, .05, .05, .05, .05, 0.0,-0.1,
 -.05, 0.0, .05, .05, .05, .05, 0.0,-.05,
  0.0, 0.0, .05, .05, .05, .05, 0.0,-.05,
 -0.1, .05, .05, .05, .05, .05, 0.0,-0.1,
 -0.1, 0.0, .05, 0.0, 0.0, 0.0, 0.0,-0.1,
 -0.2,-0.1,-0.1,-.05,-.05,-0.1,-0.1,-0.2];
const KINGMID_POS =
[-0.3,-0.4,-0.4,-0.5,-0.5,-0.4,-0.4,-0.3,
 -0.3,-0.4,-0.4,-0.5,-0.5,-0.4,-0.4,-0.3,
 -0.3,-0.4,-0.4,-0.5,-0.5,-0.4,-0.4,-0.3,
 -0.3,-0.4,-0.4,-0.5,-0.5,-0.4,-0.4,-0.3,
 -0.2,-0.3,-0.3,-0.4,-0.4,-0.3,-0.3,-0.2,
 -0.1,-0.2,-0.2,-0.2,-0.2,-0.2,-0.2,-0.1,
  0.2, 0.2, 0.0, 0.0, 0.0, 0.0, 0.2, 0.2,
  0.2, 0.3, 0.1, 0.0, 0.0, 0.1, 0.3, 0.2];
const KINGEND_POS =
[-0.5,-0.4,-0.3,-0.2,-0.2,-0.3,-0.4,-0.5,
 -0.3,-0.2,-0.1, 0.0, 0.0,-0.1,-0.2,-0.3,
 -0.3,-0.1, 0.2, 0.3, 0.3, 0.2,-0.1,-0.3,
 -0.3,-0.1, 0.3, 0.4, 0.4, 0.3,-0.1,-0.3,
 -0.3,-0.1, 0.3, 0.4, 0.4, 0.3,-0.1,-0.3,
 -0.3,-0.1, 0.2, 0.3, 0.3, 0.2,-0.1,-0.3,
 -0.3,-0.3, 0.0, 0.0, 0.0, 0. ,-0.3,-0.3,
 -0.5,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3,-0.5];
const BIG_DEC = 2;
const SMALL_DEC = 1;
function eval_board(state, player) {
  let value = 0;
  let w_queen_alive = false, b_queen_alive = false;
  let w_bishops = 0, b_bishops = 0, w_knights = 0, b_knights = 0, w_rooks = 0, b_rooks = 0;
  for (let i=0; i<SQUARES_H*SQUARES_W; i++) {
    if (state.get_type(i)===EMPTY) continue;
    let color = state.get_color(i);
    let c = (color===player) ? 1 : -1;
    let pos_eval = i;
    if (state.get_color(i)===BLACK) {
      let [x,y] = Game.nonlinear(i);
      [x, y] = [7-x,7-y];
      pos_eval = Game.linear(x,y);
    }
    switch (state.get_type(i)) {
      case BISHOP:
        value += (3.0+BISHOP_POS[pos_eval]) * c;
        if (color===WHITE) w_bishops += 1;
        else b_bishops += 1;
        break;
      case KNIGHT:
        value += (3.0+KNIGHT_POS[pos_eval]) * c;
        if (color===WHITE) w_knights += 1;
        else b_knights += 1;
        break;
      case QUEEN:
        value += (9.0+QUEEN_POS[pos_eval]) * c;
        if (color===WHITE) w_queen_alive = true;
        else b_queen_alive = true;
        break;
      case ROOK:
        value += (5.0+ROOK_POS[pos_eval]) * c;
        if (color===WHITE) w_rooks += 1;
        else b_rooks += 1;
        break;
      case PAWN:
        value += (1.0+PAWN_POS[pos_eval]) * c;
        break;
    }
  }
  let [x,y] = Game.nonlinear(state.bk_pos);
  [x, y] = [7-x,7-y];
  let bkpos = Game.linear(x,y);
  if (w_queen_alive || w_knights+w_bishops+w_rooks>3) {
    value += KINGMID_POS[bkpos] * ((BLACK===player) ? 1 : -1);
  } else {
    value += KINGEND_POS[bkpos] * ((BLACK===player) ? 1 : -1);
  }
  if (b_queen_alive || b_knights+b_bishops+b_rooks>3) {
    value += KINGMID_POS[state.wk_pos] * ((WHITE===player) ? 1 : -1);
  } else {
    value += KINGEND_POS[state.wk_pos] * ((WHITE===player) ? 1 : -1);
  }
  return value;
}
export function ai(depth, state, player, alpha=Number.NEGATIVE_INFINITY,
                                         beta=Number.POSITIVE_INFINITY,
                                         max_player=true) {

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
      let num = (mov.SPECIAL===ROOK || mov.SPECIAL===QUEEN) ? depth - SMALL_DEC : depth - BIG_DEC;
      explore = ai(num, state, player, alpha, beta, !max_player);
      value = explore[0];
      sum += explore[2];
      state.unmove()
      if (value > best_val) {
        best_val = value;
        best_move = mov;
      }
      alpha = Math.max(alpha, best_val);
      if (best_val >= beta) break;
    }
  }
  else {
    for (let mov of possible_moves) {
      state.move(mov);
      let num = (mov.SPECIAL===ROOK || mov.SPECIAL===QUEEN) ? depth - SMALL_DEC : depth - BIG_DEC;
      explore = ai(num, state, player, alpha, beta, !max_player);
      value = explore[0];
      sum += explore[2];
      state.unmove();
      if (value < best_val) {
        best_val = value;
        best_move = mov;
      }
      beta = Math.min(beta, best_val);
      if (best_val <= alpha) break;
    }
  }
  if (best_move===null) {
    let color = (state.turn % 2===0) ? WHITE : BLACK;
    if (!state.under_attack(color, state.king_pos(color))) best_val=0;
  }
  return [best_val, best_move, sum];
}
onmessage = function(event) {

  let state = new Game('');
  state.copy(event.data.state);

 
  let move = ai(event.data.depth, state, event.data.color);
  postMessage(move);

};