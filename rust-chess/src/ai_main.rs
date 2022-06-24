use chess::{Piece, Board, ChessMove, BoardStatus, Color, MoveGen, ALL_SQUARES};
use std::{mem, cmp};

pub fn search(board: &Board, player: Color, depth: isize) -> (i32, Option<ChessMove>, usize) 
{
    let (value, ai_move, nodes, _) = ai(board, player, depth, i32::MIN, i32::MAX, true);
    
    return (value, ai_move, nodes);
}

fn eval_board(board: &Board, player: &Color) -> i32 
{
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
  
fn ai(board: &Board, player: Color, depth: isize, alpha: i32, beta: i32, max_player: bool) -> (i32, Option<ChessMove>, usize, isize)
{
    let mut best_val:i32 = if max_player { i32::MIN } else { i32::MAX };
    let mut best_move = None;
    let mut sum: usize = 1;
    let mut shallowest = isize::MIN;

    if depth < 1 {
      match board.status() {
        BoardStatus::Checkmate => return (best_val, best_move, sum, depth),
        BoardStatus::Stalemate => return (0, best_move, sum, depth),
        _ => return (eval_board(board, &player), best_move, sum, depth)
      }
    }
  
    let move_it = MoveGen::new_legal(board);
    if max_player {
      let mut curr_alpha = alpha;
      for m in move_it {
        match m.get_promotion() {
          Some(Piece::Bishop) | Some(Piece::Rook) | Some(Piece::Knight) => continue,
          _ => ()
        }
        let mut bresult = mem::MaybeUninit::<Board>::uninit();
        unsafe {
          board.make_move(m, &mut *bresult.as_mut_ptr());
          let (value, _, ret_sum, mov_depth) = ai(&*bresult.as_ptr(), player, depth - 1, curr_alpha, beta, !max_player);
          sum += ret_sum;
          if value > best_val || (value == best_val && mov_depth > shallowest) {
            best_val = value;
            best_move = Some(m);
            shallowest = mov_depth;
          }
          curr_alpha = cmp::max(curr_alpha, best_val);
          if best_val >= beta { break; }
        }
      }
    }
    else {
      let mut curr_beta = beta;
      for m in move_it {
        match m.get_promotion() {
          Some(Piece::Bishop) | Some(Piece::Rook) | Some(Piece::Knight) => continue,
          _ => ()
        }
        let mut bresult = mem::MaybeUninit::<Board>::uninit();
        unsafe {
          board.make_move(m, &mut *bresult.as_mut_ptr());
          let (value, _, ret_sum, mov_depth) = ai(&*bresult.as_ptr(), player, depth - 1, alpha, curr_beta, !max_player);
          sum += ret_sum;
          if value < best_val || (value == best_val && mov_depth > shallowest) {
            best_val = value;
            best_move = Some(m);
            shallowest = mov_depth;
          }
          curr_beta = cmp::min(curr_beta, best_val);
          if best_val <= alpha { break; }
        }
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