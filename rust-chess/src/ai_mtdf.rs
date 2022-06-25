use chess::{Board, ChessMove, BoardStatus, Color, MoveGen};
use std::{cmp, collections::HashMap};

#[path = "./evaluation.rs"] mod evaluation;

struct Bounds
{
  low: i32,
  high: i32,
  best: Option<ChessMove>,
  depth: i32,
}
impl Bounds
{
  fn new(lower: i32, upper: i32, best_move: Option<ChessMove>, remaining_depth: i32) -> Bounds 
  {
    Bounds { low: lower, high: upper, best: best_move, depth: remaining_depth }
  }
}

const TOTAL_LIMIT: f64 = 4500.0;
const ITER_LIMIT: f64 = 1400.0;
const PADDING: i32 = 50; // to help differentiate checkmates by depth

// https://people.csail.mit.edu/plaat/mtdf.html
pub fn ai(board: &Board) -> (i32, Option<ChessMove>)
{
  let mut table:HashMap<u64, Bounds> = HashMap::with_capacity(256_000);
  let mut result = (0, None);
  let start_total = crate::now();
  let mut end = start_total;
  let mut i = 1;
  while (end - start_total) < TOTAL_LIMIT
  {
    let temp_result = mtdf(board, result.0, i, &mut table);
    if temp_result.2 { result = (temp_result.0, temp_result.1); }
    else { break; }
    end = crate::now();
    i += 1;
  }
  crate::log(&("max depth: ".to_owned() + &i.to_string() + " table entries: " + &table.len().to_string()));
  drop(table);

  if result.1.is_none() {
    let mut move_it = MoveGen::new_legal(board);
    result = (result.0, move_it.next());
  }

  return (result.0,result.1);
}

fn mtdf(root_board: &Board, f: i32, depth: i32, table: &mut HashMap<u64, Bounds>) -> (i32, Option<ChessMove>, bool)
{
  let mut guess = f;
  let mut best_move = None;
  let mut upperbound = i32::MAX;
  let mut lowerbound = i32::MIN;
  let start_iter = crate::now();
  while lowerbound < upperbound
  {
    let beta = if guess == lowerbound { guess + 1 } else { guess };
    (guess, best_move) = ab_with_mem(root_board, beta - 1, beta, depth, table, true);

    if crate::now() - start_iter > ITER_LIMIT { return (0, None, false) }

    if guess < beta { upperbound = guess; }
    else            { lowerbound = guess; }
  }
  return (guess, best_move, true);
}

fn get_ai_color(board: &Board, max_player: bool) -> Color 
{
  match board.side_to_move() {
    Color::White => return if max_player { Color::White } else { Color::Black },
    Color::Black => return if max_player { Color::Black } else { Color::White },
  }
}

fn ab_with_mem(board: &Board, mut alpha: i32, mut beta: i32, depth: i32, table: &mut HashMap<u64, Bounds>, max_player: bool) -> (i32, Option<ChessMove>) 
{
  let entry = table.get(&board.get_hash());
  let mut best_value = if max_player { i32::MIN } else { i32::MAX };
  let mut best_move = None;
  match entry {
    Some(t) => 
    {
      if t.depth >= depth 
      {
        if t.low >= beta { return (t.low, t.best) }
        if t.high <= alpha { return (t.high, t.best) }
        alpha = cmp::max(alpha, t.low);
        beta = cmp::min(beta, t.high);
        best_move = t.best;
      }
    },
    None => ()
  }

  if depth < 1
  {
    match board.status() {
      BoardStatus::Stalemate => best_value = 0,
      BoardStatus::Ongoing   => best_value = evaluation::evaluation(board, &get_ai_color(board, max_player)),
      BoardStatus::Checkmate => best_value += if max_player { PADDING - depth } else { depth - PADDING }
    }
  }
  else if max_player
  {
    let mut a = alpha;
    // handle best_move from table
    if best_move.is_some() 
    {
      let (value, _) =  ab_with_mem(&board.make_move_new(best_move.unwrap()), a, beta, depth - 1, table, !max_player);
      best_value = value;
      a = cmp::max(a, best_value);
    }
    if best_value < beta
    {
      let move_it = MoveGen::new_legal(board);
      for m in move_it
      {
        let (value, _) =  ab_with_mem(&board.make_move_new(m), a, beta, depth - 1, table, !max_player);
        if value > best_value
        {
          best_value = value;
          best_move = Some(m);
        } 
        a = cmp::max(a, best_value);
        if best_value >= beta { break; }
      }
    }
  }
  else
  {
    let mut b = beta;
    // see max_player comment
    if best_move.is_some()
    {
      let (value, _) =  ab_with_mem(&board.make_move_new(best_move.unwrap()), alpha, b, depth - 1, table, !max_player);
      best_value = value;
      b = cmp::min(b, best_value);
    }
    if best_value > alpha
    {
      let move_it = MoveGen::new_legal(board);
      for m in move_it
      {
        let (value, _) =  ab_with_mem(&board.make_move_new(m), alpha, b, depth - 1, table, !max_player);
        if value < best_value
        {
          best_value = value;
          best_move = Some(m);
        } 
        b = cmp::min(b, best_value);
        if best_value <= alpha { break; }
      }
    }
  }
  let mut temp_lower = i32::MIN;
  let mut temp_upper = i32::MAX;
  if best_value <= alpha
  {
    temp_upper = best_value;
    table.insert((*board).get_hash(), Bounds::new(temp_lower, temp_upper, best_move, depth));
  }
  else if best_value >= beta {
    temp_lower = best_value;
    table.insert((*board).get_hash(), Bounds::new(temp_lower, temp_upper, best_move, depth));
  }
  else // best_value > alpha && best_value < beta
  {
    temp_lower = best_value;
    temp_upper = best_value;
    table.insert((*board).get_hash(), Bounds::new(temp_lower, temp_upper, best_move, depth));
  }

  return (best_value, best_move)
}