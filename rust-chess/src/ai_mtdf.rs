use chess::{Board, BoardStatus, ChessMove, Color, MoveGen, Piece};
use std::{cmp, collections::HashMap, mem};

#[path = "./evaluation.rs"]
mod evaluation;

struct Bounds {
  low: i32,
  high: i32,
  best: Option<ChessMove>,
  order: [Piece; 6],
  depth: i32,
}
impl Bounds {
  fn new(low: i32, high: i32, best: Option<ChessMove>, order: [Piece; 6], depth: i32) -> Bounds {
    Bounds { low, high, best, order, depth }
  }
}

const TOTAL_LIMIT: f64 = 5000.0;
const ITER_LIMIT: f64 = 2000.0;
const CHECK_MATE: i32 = 10_000; // to help differentiate checkmates by depth

// https://people.csail.mit.edu/plaat/mtdf.html
pub fn ai(board: &Board) -> (i32, Option<ChessMove>) {
  let mut table: HashMap<u64, Bounds> = HashMap::with_capacity(512_000);
  let mut result = (0, None);
  let start_total = crate::now();
  let mut i = 1;
  while (crate::now() - start_total) < TOTAL_LIMIT {
    let temp_result = mtdf(board, result.0, i, &mut table);
    if temp_result.2 {
      result = (temp_result.0, temp_result.1);
    } else {
      break;
    }
    i += 1;
  }
  crate::log(&("max depth: ".to_owned() + &i.to_string() + " table entries: " + &table.len().to_string()));
  drop(table);

  if result.1.is_none() {
    let mut move_it = MoveGen::new_legal(board);
    result = (result.0, move_it.next());
  }

  return (result.0, result.1);
}

fn mtdf(root_board: &Board, mut guess: i32, depth: i32, table: &mut HashMap<u64, Bounds>) -> (i32, Option<ChessMove>, bool) {
  let mut best_move = None;
  let mut upperbound = i32::MAX;
  let mut lowerbound = i32::MIN;
  let start_iter = crate::now();
  while lowerbound < upperbound {
    let beta = if guess == lowerbound { guess + 1 } else { guess };
    (guess, best_move) = ab_with_mem(root_board, beta - 1, beta, depth, table, true);

    if crate::now() - start_iter > ITER_LIMIT {
      return (0, None, false);
    }

    if guess < beta {
      upperbound = guess;
    } else {
      lowerbound = guess;
    }
  }
  return (guess, best_move, true);
}
#[inline]
fn get_ai_color(board: &Board, max_player: bool) -> Color {
  return if max_player {
    (*board).side_to_move()
  } else {
    !(*board).side_to_move()
  };
}

fn ab_with_mem(
  board: &Board, mut alpha: i32, mut beta: i32, depth: i32, table: &mut HashMap<u64, Bounds>, max_player: bool,
) -> (i32, Option<ChessMove>) {
  match board.status() {
    BoardStatus::Stalemate => return (0, None),
    BoardStatus::Checkmate if max_player => return (-CHECK_MATE - depth, None),
    BoardStatus::Checkmate if !max_player => return (CHECK_MATE + depth, None),
    _ => (),
  }
  let mut best_value = if max_player { i32::MIN } else { i32::MAX };
  let mut order: [Piece; 6] = [Piece::Pawn, Piece::Knight, Piece::Bishop, Piece::Queen, Piece::Rook, Piece::King];
  let mut piece_values: [i8; 6] = [0,0,0,0,0,0];
  let mut best_move: Option<ChessMove> = None;

  let entry = table.get(&board.get_hash());
  match entry {
    Some(t) => {
      if t.depth >= depth {
        best_move = t.best;
        if t.low >= beta {
          return (t.low, best_move);
        }
        if t.high <= alpha {
          return (t.high, best_move);
        }
        alpha = cmp::max(alpha, t.low);
        beta = cmp::min(beta, t.high);
      }
      order = t.order;
    }
    None => (),
  }
  if depth < 1 {
    best_value = evaluation::evaluation(board, get_ai_color(board, max_player));
  } else if max_player {
    let mut a = alpha;
    if best_value < beta {
      let move_it = MoveGen::new_legal_ordered(board, &mut order);
      let mut bresult = mem::MaybeUninit::<Board>::uninit();
      for m in move_it {
        match m.get_promotion() {
          Some(Piece::Bishop) | Some(Piece::Rook) | Some(Piece::Knight) => continue,
          _ => (),
        }
        unsafe {
          board.make_move(m, &mut *bresult.as_mut_ptr());
          let (value, _) = ab_with_mem(&*bresult.as_ptr(), a, beta, depth - 1, table, !max_player);
          let piece_in = board.piece_on(m.get_source()).unwrap().to_index();
          if value > 0 {
            piece_values[piece_in] += 1
          }
          else if value < 0 {
            piece_values[piece_in] -= 1
          }
          if value > best_value {
            best_value = value;
            best_move = Some(m);
          }
          a = cmp::max(a, best_value);
          if best_value >= beta {
            break;
          }
        }
      }
    }
    order.sort_by(
      |a, b| 
      piece_values[b.to_index()].partial_cmp(&piece_values[a.to_index()]).unwrap()
    );
  } else {
    let mut b = beta;
    if best_value > alpha {
      let move_it = MoveGen::new_legal_ordered(board, &mut order);
      let mut bresult = mem::MaybeUninit::<Board>::uninit();
      for m in move_it {
        match m.get_promotion() {
          Some(Piece::Bishop) | Some(Piece::Rook) | Some(Piece::Knight) => continue,
           _ => (),
        }
        unsafe {
          board.make_move(m, &mut *bresult.as_mut_ptr());
          let (value, _) = ab_with_mem(&*bresult.as_ptr(), alpha, b, depth - 1, table, !max_player);
          let piece_in = board.piece_on(m.get_source()).unwrap().to_index();
          if value < 0 {
            piece_values[piece_in] += 1
          }
          else if value > 0 {
            piece_values[piece_in] -= 1
          }
          if value < best_value {
            best_value = value;
            best_move = Some(m);
          }
          b = cmp::min(b, best_value);
          if best_value <= alpha {
            break;
          }
        }
      }
    }
    order.sort_by(
      |a, b| 
      piece_values[b.to_index()].partial_cmp(&piece_values[a.to_index()]).unwrap()
    );
  }
  if best_value <= alpha {
    table.insert((*board).get_hash(), Bounds::new(i32::MIN, best_value, best_move, order, depth));
  } else if best_value >= beta {
    table.insert((*board).get_hash(), Bounds::new(best_value, i32::MAX, best_move, order, depth));
  } else {
    // best_value > alpha && best_value < beta
    table.insert((*board).get_hash(), Bounds::new(best_value, best_value, best_move, order, depth));
  }

  return (best_value, best_move);
}
