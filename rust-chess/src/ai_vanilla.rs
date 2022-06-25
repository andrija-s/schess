use chess::{Piece, Board, ChessMove, BoardStatus, Color, MoveGen};
use std::mem;

#[path = "./evaluation.rs"] mod evaluation;

pub fn ai(board: &Board, player: Color, depth: isize) -> (i32, Option<ChessMove>, usize)
{
  return ab_search_top(board, player, depth);
}

fn ab_search_top(board: &Board, player: Color, depth: isize) -> (i32, Option<ChessMove>, usize) 
{
  let mut best_val:i32 = i32::MIN;
  let mut ai_move = None;
  let mut sum: usize = 0;
  let mut shallowest = isize::MIN;
  let beta  = i32::MAX;
  
  match board.status() 
  {
    BoardStatus::Ongoing   => (),
    BoardStatus::Checkmate => return (best_val, ai_move, sum),
    BoardStatus::Stalemate => return (0, ai_move, sum),
  }

  let move_it = MoveGen::new_legal(board);
  for m in move_it
  {
    match m.get_promotion() {
      Some(Piece::Bishop) | Some(Piece::Rook) | Some(Piece::Knight) => continue,
      _ => ()
    }
    let mut bresult = mem::MaybeUninit::<Board>::uninit();
    unsafe {
      board.make_move(m, &mut *bresult.as_mut_ptr());
      let (value, ret_sum, mov_depth) = ab_search(&*bresult.as_ptr(), player, depth - 1, best_val, beta, false);
      sum += ret_sum;
      if value > best_val || (value == best_val && mov_depth > shallowest) {
        best_val = value;
        ai_move = Some(m);
        shallowest = mov_depth;
      }
    }
  }
  return (best_val, ai_move, sum);
}
  
fn ab_search(board: &Board, player: Color, depth: isize, alpha: i32, beta: i32, max_player: bool) -> (i32, usize, isize)
{
  let mut best_val:i32 = if max_player { alpha } else { beta };
  let mut sum: usize = 1;
  let mut shallowest = isize::MIN;


  if depth < 1 
  {
    return (evaluation::evaluation(board, &player), sum, depth);
  }

  let move_it = MoveGen::new_legal(board);
  if move_it.len() == 0 
  {
    match board.status() 
    {
      BoardStatus::Ongoing   => panic!("Ongoing and yet no moves. fen: {}.", board.to_string()),
      BoardStatus::Checkmate => return (if max_player { i32::MIN } else { i32::MAX }, sum, depth),
      BoardStatus::Stalemate => return (0, sum, depth),
    }
  }
  if max_player 
  {
    for m in move_it 
    {
      match m.get_promotion() 
      {
        Some(Piece::Bishop) | Some(Piece::Rook) | Some(Piece::Knight) => continue,
        _ => ()
      }
      let mut bresult = mem::MaybeUninit::<Board>::uninit();
      unsafe 
      {
        board.make_move(m, &mut *bresult.as_mut_ptr());
        let (value, ret_sum, mov_depth) = ab_search(&*bresult.as_ptr(), player, depth - 1, best_val, beta, !max_player);
        sum += ret_sum;
        if value > best_val || (value == best_val && mov_depth > shallowest) 
        {
          best_val = value;
          shallowest = mov_depth;
        }
        if best_val >= beta { break; }
      }
    }
  }
  else 
  {
    for m in move_it 
    {
      match m.get_promotion() 
      {
        Some(Piece::Bishop) | Some(Piece::Rook) | Some(Piece::Knight) => continue,
        _ => ()
      }
      let mut bresult = mem::MaybeUninit::<Board>::uninit();
      unsafe 
      {
        board.make_move(m, &mut *bresult.as_mut_ptr());
        let (value, ret_sum, mov_depth) = ab_search(&*bresult.as_ptr(), player, depth - 1, alpha, best_val, !max_player);
        sum += ret_sum;
        if value < best_val || (value == best_val && mov_depth > shallowest) 
        {
          best_val = value;
          shallowest = mov_depth;
        }
        if best_val <= alpha { break; }
      }
    }
  }
  return (best_val, sum, shallowest);
}