use chess::{Board, BoardStatus, ChessMove, Color, MoveGen, Piece};
use std::{cmp, mem};

#[path = "./evaluation.rs"]
mod evaluation;

const CHECK_MATE: i32 = 10_000;

pub fn ai(board: &Board, player: Color, depth: i32) -> (i32, Option<ChessMove>) {
  return ab_search_top(board, player, depth);
}

fn ab_search_top(board: &Board, player: Color, depth: i32) -> (i32, Option<ChessMove>) {
  let mut best_val: i32 = i32::MIN;
  let mut ai_move = None;
  let mut sum: usize = 0;
  let beta = i32::MAX;

  match board.status() {
    BoardStatus::Ongoing => (),
    BoardStatus::Checkmate => return (best_val, ai_move),
    BoardStatus::Stalemate => return (0, ai_move),
  }

  let move_it = MoveGen::new_legal(board);
  for m in move_it {
    match m.get_promotion() {
      Some(Piece::Bishop) | Some(Piece::Rook) | Some(Piece::Knight) => continue,
      _ => (),
    }
    let mut bresult = mem::MaybeUninit::<Board>::uninit();
    unsafe {
      board.make_move(m, &mut *bresult.as_mut_ptr());
      let (value, ret_sum) = ab_search(&*bresult.as_ptr(), player, depth - 1, best_val, beta, false);
      sum += ret_sum;
      if value > best_val {
        best_val = value;
        ai_move = Some(m);
      }
    }
  }
  crate::log(&("nodes traversed: ".to_owned() + &sum.to_string()));
  return (best_val, ai_move);
}

fn ab_search(board: &Board, player: Color, depth: i32, alpha: i32, beta: i32, max_player: bool) -> (i32, usize) {
  let mut best_val: i32 = if max_player { alpha } else { beta };
  let mut sum: usize = 1;

  match board.status() {
    BoardStatus::Checkmate if max_player => return (-CHECK_MATE - depth, sum),
    BoardStatus::Checkmate if !max_player => return (CHECK_MATE + depth, sum),
    BoardStatus::Stalemate => return (0, sum),
    _ => (),
  }

  if depth < 1 {
    return (evaluation::evaluation(board, player), sum);
  }

  let move_it = MoveGen::new_legal(board);
  if move_it.len() == 0 {
    panic!("Ongoing and yet no moves. fen: {}.", (*board).to_string());
  }
  if max_player {
    for m in move_it {
      match m.get_promotion() {
        Some(Piece::Bishop) | Some(Piece::Rook) | Some(Piece::Knight) => continue,
        _ => (),
      }
      let mut bresult = mem::MaybeUninit::<Board>::uninit();
      unsafe {
        board.make_move(m, &mut *bresult.as_mut_ptr());
        let (value, ret_sum) = ab_search(&*bresult.as_ptr(), player, depth - 1, best_val, beta, !max_player);
        sum += ret_sum;
        best_val = cmp::max(value, best_val);
        if best_val >= beta {
          break;
        }
      }
    }
  } else {
    for m in move_it {
      match m.get_promotion() {
        Some(Piece::Bishop) | Some(Piece::Rook) | Some(Piece::Knight) => continue,
        _ => (),
      }
      let mut bresult = mem::MaybeUninit::<Board>::uninit();
      unsafe {
        board.make_move(m, &mut *bresult.as_mut_ptr());
        let (value, ret_sum) = ab_search(&*bresult.as_ptr(), player, depth - 1, alpha, best_val, !max_player);
        sum += ret_sum;
        best_val = cmp::min(value, best_val);
        if best_val <= alpha {
          break;
        }
      }
    }
  }
  return (best_val, sum);
}
