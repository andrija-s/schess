use chess::{Piece, Board, ChessMove, BoardStatus, Color, MoveGen, ALL_SQUARES};
use std::{cmp, collections::HashMap};

struct Entry {
    depth: i32,
    flags: i32,
    eval: i32,
    chess_move: Option<ChessMove>,
}
const HASHF_EXACT: i32 = 0;
const HASHF_ALPHA: i32 = 1;
const HASHF_BETA : i32 = 2;
/* int AlphaBeta(int depth, int alpha, int beta) 
{
    int hashf = hashfALPHA;

    if ((val = ProbeHash(depth, alpha, beta)) != valUNKNOWN)
        return val;
    if (depth == 0) {
        val = Evaluate();
        RecordHash(depth, val, hashfEXACT);

        return val;
    }
    GenerateLegalMoves();
    while (MovesLeft()) {
        MakeNextMove();
        val = -AlphaBeta(depth - 1, -beta, -alpha);
        UnmakeMove();
        if (val >= beta) {
            RecordHash(depth, beta, hashfBETA);
            return beta;
        }
        if (val > alpha) {
            hashf = hashfEXACT;
            alpha = val;
        }
    }
    RecordHash(depth, alpha, hashf);

    return alpha;
} 
int ProbeHash(int depth, int alpha, int beta)
{
    HASHE * phashe = &hash_table[ZobristKey() % TableSize()];

    if (phashe->key == ZobristKey()) {
        if (phashe->depth >= depth) {
            if (phashe->flags == hashfEXACT)
                return phashe->val;
            if ((phashe->flags == hashfALPHA) &&
                (phashe->val <= alpha))
                return alpha;
            if ((phashe->flags == hashfBETA) &&
                (phashe->val >= beta))
                return beta;
        }
        RememberBestMove();
    }
    return valUNKNOWN;
}

void RecordHash(int depth, int val, int hashf)
{
    HASHE * phashe = &hash_table[ZobristKey() % TableSize()];

    phashe->key = ZobristKey();
    phashe->best = BestMove();
    phashe->val = val;
    phashe->hashf = hashf;
    phashe->depth = depth;
}
*/

pub fn search(board: &Board, player: Color, depth: isize) -> (i32, Option<ChessMove>, usize) {

    let scores:HashMap<u64, Entry> = HashMap::new();

    let (value, ai_move, nodes, _) = ai(board, player, depth, i32::MIN, i32::MAX, &scores, true);
    
    return (value, ai_move, nodes);
}

fn eval_board(board: &Board, player: &Color) -> i32 {
    let mut value = 0;
    for sq in ALL_SQUARES.iter() {
      let col = board.color_on(*sq);
      if board.piece_on(*sq).is_none() || col.is_none() { continue; };
      let c = if col==Some(*player) { 1 } else { -1 };
      match board.piece_on(*sq) {
        Some(Piece::Bishop) => {
          value += (330) * c;
        },
        Some(Piece::Knight) => {
          value += (320) * c;
        },
        Some(Piece::Queen) => {
          value += (900) * c;
        },
        Some(Piece::Rook) => {
          value += (500) * c;
        },
        Some(Piece::Pawn) => {
          value += (100) * c;
        },
        _ => (),
      }
    }
    return value;
  }
  
fn ai(board: &Board, player: Color, depth: isize, alpha: i32, beta: i32, transpositions: &HashMap<u64, Entry>, max_player: bool) -> (i32, Option<ChessMove>, usize, isize) {
    
    let mut best_val:i32 = if max_player { i32::MIN } else { i32::MAX };
    let mut best_move = None;
    let mut sum: usize = 1;
    let mut shallowest = isize::MIN;
    /* let transposition_entry = transpositions.get(&board.get_hash());
    match transposition_entry {
      None => (),
      
    } */
    if depth < 1 {
      match board.status() {
        BoardStatus::Checkmate => return (best_val, best_move, sum, depth),
        BoardStatus::Stalemate => return (0, best_move, sum, depth),
        _ => return (eval_board(board, &player), best_move, sum, depth)
      }
    }
  
    let move_it = MoveGen::new_legal(board);
    let mut boards = Vec::new();
    for m in move_it {
      match m.get_promotion() {
        Some(Piece::Bishop) | Some(Piece::Rook) | Some(Piece::Knight) => continue,
        _ => ()
      }
      let transmuted = board.make_move_new(m);
      boards.push((m, transmuted, transmuted.get_hash()));
    }
    if max_player {
      let mut curr_alpha = alpha;
      for item in &boards {
        let (value, _, ret_sum, mov_depth) = ai(&item.1, player, depth - 1, curr_alpha, beta, transpositions, !max_player);
        sum += ret_sum;
        if value > best_val || (value == best_val && mov_depth > shallowest) {
          best_val = value;
          best_move = Some(item.0);
          shallowest = mov_depth;
        }
        curr_alpha = cmp::max(curr_alpha, best_val);
        if best_val >= beta { break; }
      }
    }
    else {
      let mut curr_beta = beta;
      for item in &boards {
        let (value, _, ret_sum, mov_depth) = ai(&item.1, player, depth - 1, alpha, curr_beta, transpositions, !max_player);
        sum += ret_sum;
        if value < best_val || (value == best_val && mov_depth > shallowest) {
          best_val = value;
          best_move = Some(item.0);
          shallowest = mov_depth;
        }
        curr_beta = cmp::min(curr_beta, best_val);
        if best_val <= alpha { break; }
      }
    }
    // hotfix until minimax logic is worked out
    match best_move {
      None => {
        best_move = MoveGen::new_legal(board).next();
        match board.status() {
          BoardStatus::Stalemate => return (0, best_move, sum, depth),
          _ => return (best_val, best_move, sum, depth),
        }
      }
      _ => return (best_val, best_move, sum, shallowest),
    }
  }