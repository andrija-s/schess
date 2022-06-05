import {EMPTY, BISHOP, QUEEN, PAWN, KNIGHT, ROOK} from "./game.js";
function evaluateBoard (board, player) {
  let value = 0;
  for (let piece of board) {
    if (piece.COLOR===EMPTY) continue;
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
  if (depth === 0) {
    value = evaluateBoard(state.board, player);
    return [value, null]
  }
  let possibleMoves = state.allMoves();
  let bestMove = (possibleMoves.length > 0) ? possibleMoves[0] : null;
  possibleMoves.sort(function(a, b){return 0.5 - Math.random()});
  let bestMoveValue = max_player ? Number.NEGATIVE_INFINITY
                                         : Number.POSITIVE_INFINITY;
  let temp_state;
  if (max_player) {
    for (let mov of possibleMoves) {
      temp_state = state.copy();
      temp_state.move(mov);
      value = ai(depth-1, temp_state, player, alpha, beta, !max_player)[0];
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
      temp_state = state.copy();
      temp_state.move(mov);
      value = ai(depth-1, temp_state, player, alpha, beta, !max_player)[0];
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