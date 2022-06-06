import {Game, WHITE, BLACK, KING, EMPTY, BISHOP, QUEEN, PAWN, KNIGHT, ROOK} from "./game.js";

const PAWN_POS   = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
                    0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
                    0.1, 0.1, 0.2, 0.3, 0.3, 0.2, 0.1, 0.1,
                    .05, .05, 0.1, .25, .25, 0.1, .05, .05,
                    0.0, 0.0, 0.0, 0.2, 0.2, 0.0, 0.0, 0.0,
                    .05,-.05,-0.1, 0.0, 0.0,-0.1,-.05, .05,
                    .05, 0.1, 0.1,-0.2,-0.2, 0.1, 0.1, .05,
                    0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
const KNIGHT_POS = [-0.5,-0.4,-0.3,-0.3,-0.3,-0.3,-0.4,-0.5,
                    -0.4,-0.2, 0.0, 0.0, 0.0, 0.0,-0.2,-0.4,
                    -0.3, 0.0, 0.1, .15, .15, 0.1, 0.0,-0.3,
                    -0.3, .05, .15, 0.2, 0.2, .15, .05,-0.3,
                    -0.3, 0.0, .15, 0.2, 0.2, .15, 0.0,-0.3,
                    -0.3, .05, 0.1, .15, .15, 0.1, .05,-0.3,
                    -0.4,-0.2, 0.0, .05, .05, 0.0,-0.2,-0.4,
                    -0.5,-0.4,-0.3,-0.3,-0.3,-0.3,-0.4,-0.5];
const BISHOP_POS = [-0.2,-0.1,-0.1,-0.1,-0.1,-0.1,-0.1,-0.2,
                    -0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,-0.1,
                    -0.1, 0.0, .05, 0.1, 0.1, .05, 0.0,-0.1,
                    -0.1, .05, .05, 0.1, 0.1, .05, .05,-0.1,
                    -0.1, 0.0, 0.1, 0.1, 0.1, 0.1, 0.0,-0.1,
                    -0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,-0.1,
                    -0.1, .05, 0.0, 0.0, 0.0, 0.0, .05,-0.1,
                    -0.2,-0.1,-0.1,-0.1,-0.1,-0.1,-0.1,-0.2];
const ROOK_POS   = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
                    .05, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, .05,
                   -.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,-.05,
                   -.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,-.05,
                   -.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,-.05,
                   -.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,-.05,
                   -.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,-.05,
                    0.0, 0.0, .05, .05, .05, 0.0, 0.0, 0.0];
const QUEEN_POS = [-0.2,-0.1,-0.1,-.05,-.05,-0.1,-0.1,-0.2,
                   -0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,-0.1,
                   -0.1, 0.0, .05, .05, .05, .05, 0.0,-0.1,
                   -.05, 0.0, .05, .05, .05, .05, 0.0,-.05,
                    0.0, 0.0, .05, .05, .05, .05, 0.0,-.05,
                   -0.1, .05, .05, .05, .05, .05, 0.0,-0.1,
                   -0.1, 0.0, .05, 0.0, 0.0, 0.0, 0.0,-0.1,
                   -0.2,-0.1,-0.1,-.05,-.05,-0.1,-0.1,-0.2];
const KING_POS  = [-0.3,-0.4,-0.4,-0.5,-0.5,-0.4,-0.4,-0.3,
                   -0.3,-0.4,-0.4,-0.5,-0.5,-0.4,-0.4,-0.3,
                   -0.3,-0.4,-0.4,-0.5,-0.5,-0.4,-0.4,-0.3,
                   -0.3,-0.4,-0.4,-0.5,-0.5,-0.4,-0.4,-0.3,
                   -0.2,-0.3,-0.3,-0.4,-0.4,-0.3,-0.3,-0.2,
                   -0.1,-0.2,-0.2,-0.2,-0.2,-0.2,-0.2,-0.1,
                    0.2, 0.2, 0.0, 0.0, 0.0, 0.0, 0.2, 0.2,
                    0.2, 0.3, 0.1, 0.0, 0.0, 0.1, 0.3, 0.2];
function evaluateBoard (board, player) {
  let value = 0;
  for (let pos in board) {
    if (board[pos].TYPE===EMPTY) continue;
    let c = (board[pos].COLOR===player) ? 1 : -1;
    let [x,y] = Game.nonlinear(pos);
    [x, y] = (board[pos].COLOR===BLACK) ? [7-x,7-y] : [x,y];
    let pos_eval = Game.linear(x,y);
    switch (board[pos].TYPE) {
      case BISHOP:
        value += (3.0+BISHOP_POS[pos_eval]) * c;
        break;
      case KNIGHT:
        value += (3.0+KNIGHT_POS[pos_eval]) * c;
        break;
      case QUEEN:
        value += (9.0+QUEEN_POS[pos_eval]) * c;
        break;
      case ROOK:
        value += (5.0+ROOK_POS[pos_eval]) * c;
        break;
      case PAWN:
        value += (1.0+PAWN_POS[pos_eval]) * c;
        break;
      case KING:
        value += (KING_POS[pos_eval]) * c;
        break;
    }
  }
  return value;
}
export function ai(depth, state, player, alpha=Number.NEGATIVE_INFINITY,beta=Number.POSITIVE_INFINITY,max_player=true) {

  let value;
  if (depth < 1) {
    value = evaluateBoard(state.board, player);
    return [value, null]
  }
  let possibleMoves = state.allMoves();
  let best_move = (possibleMoves.length > 0) ? possibleMoves[0] : null;
  let best_val = max_player ? Number.NEGATIVE_INFINITY
                                         : Number.POSITIVE_INFINITY;
  if (max_player) {
    for (let mov of possibleMoves) {
      state.move(mov);
      let num = (mov.SPECIAL===QUEEN||mov.SPECIAL===ROOK) ? depth -3 : depth - 4;
      value = ai(num, state, player, alpha, beta, !max_player)[0];
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
    for (let mov of possibleMoves) {
      state.move(mov);
      let num = (mov.SPECIAL===QUEEN||mov.SPECIAL===ROOK) ? depth -3 : depth - 4;
      value = ai(num, state, player, alpha, beta, !max_player)[0];
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
    if (!state.underAttack(color, state.king_positions[color])) best_val=0;
  }
  return [best_val, best_move];
}