use chess::{Board, BoardStatus, ChessMove, Color, MoveGen, Piece};
use std::{cmp, mem};

#[path = "./evaluation.rs"]
mod evaluation;

const CHECK_MATE: i32 = 10_000;
/* static mut COUNTER: usize = 0; */

pub fn ai(board: &Board, player: Color, depth: i32) -> (i32, Option<ChessMove>) {
  /* unsafe{
    COUNTER = 0;
  } */
  return ab_search_top(board, player, depth);
}

fn ab_search_top(board: &Board, player: Color, depth: i32) -> (i32, Option<ChessMove>) {
  let mut best_val: i32 = i32::MIN;
  let mut ai_move = None;
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
      let value = ab_search(&*bresult.as_ptr(), player, depth - 1, best_val, beta, false);
      if value > best_val {
        best_val = value;
        ai_move = Some(m);
      }
    }
  }
  /* unsafe {
    crate::log(&("nodes traversed: ".to_owned() + &COUNTER.to_string()));
  } */
  return (best_val, ai_move);
}

fn ab_search(board: &Board, player: Color, depth: i32, alpha: i32, beta: i32, max_player: bool) -> i32 {
  /* unsafe {
    COUNTER += 1;
  } */
  let mut best_val: i32 = if max_player { alpha } else { beta };

  match board.status() {
    BoardStatus::Checkmate if max_player => return -CHECK_MATE - depth,
    BoardStatus::Checkmate if !max_player => return CHECK_MATE + depth,
    BoardStatus::Stalemate => return 0,
    _ => (),
  }

  if depth < 1 {
    return evaluation::evaluation(board, player);
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
        let value = ab_search(&*bresult.as_ptr(), player, depth - 1, best_val, beta, !max_player);
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
        let value = ab_search(&*bresult.as_ptr(), player, depth - 1, alpha, best_val, !max_player);
        best_val = cmp::min(value, best_val);
        if best_val <= alpha {
          break;
        }
      }
    }
  }
  return best_val;
}
