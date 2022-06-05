import {EMPTY, BISHOP, QUEEN, PAWN, KNIGHT, ROOK} from "./game.js";
function evaluateBoard (board, player) {
  let value = 0;
  for (let piece of board) {
    if (piece.TYPE===EMPTY) continue;
    let c = (piece.COLOR===player) ? 1 : -1;
    switch (piece.TYPE) {
      case BISHOP:
      case KNIGHT:
        value += 3 * c;
        break;
      case QUEEN:
        value += 9 * c;
        break;
      case ROOK:
        value += 5 * c;
        break;
      case PAWN:
        value += 1 * c;
        break;
    }
  }
  return value;
}
export function ai(depth, state, player,
                            alpha=Number.NEGATIVE_INFINITY,
                            beta=Number.POSITIVE_INFINITY,
                            max_player=true) {
  let value;
  if (depth < 1) {
    value = evaluateBoard(state.board, player);
    return [value, null]
  }
  let possibleMoves = state.allMoves();
  let bestMove = (possibleMoves.length > 0) ? possibleMoves[0] : null;
  let bestMoveValue = max_player ? Number.NEGATIVE_INFINITY
                                         : Number.POSITIVE_INFINITY;
  let temp_state;
  if (max_player) {
    for (let mov of possibleMoves) {
      state.move(mov);
      let num = (mov.SPECIAL > 0) ? depth -2 : depth - 4;
      value = ai(num, state, player, alpha, beta, !max_player)[0];
      state.unmove()
      if (value > bestMoveValue) {
        bestMoveValue = value;
        bestMove = mov;
      }
      if (bestMoveValue >= beta) break;
      alpha = Math.max(alpha, bestMoveValue);
    }
  }
  else {
    for (let mov of possibleMoves) {
      state.move(mov);
      let num = (mov.SPECIAL > 0) ? depth -2 : depth - 4;
      value = ai(num, state, player, alpha, beta, !max_player)[0];
      state.unmove();
      if (value < bestMoveValue) {
        bestMoveValue = value;
        bestMove = mov;
      }
      if (bestMoveValue <= alpha) break;
      beta = Math.min(beta, bestMoveValue);
    }
  }
  return [bestMoveValue, bestMove];
}