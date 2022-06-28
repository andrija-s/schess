use chess::{Board, get_rank, Color, Piece, Rank, ALL_PIECES, get_file};
const NUM_RANKS: usize = 6;
const PAWN_RANKS: [Rank; NUM_RANKS] = [
    Rank::Second,
    Rank::Third,
    Rank::Fourth,
    Rank::Fifth,
    Rank::Sixth,
    Rank::Seventh,
];
pub fn evaluation(board: &Board, player: Color) -> i32 {
  let mut value = 0;
  let c = if player == Color::White { 1 } else { -1 };
  let num_checkers = board.checkers().popcnt();
  if num_checkers == 1 {
    value += 50 * if board.side_to_move() == player { -1 } else { 1 };
  }
  else if num_checkers == 2 {
    value += 100 * if board.side_to_move() == player { -1 } else { 1 };
  }
  value += (board.pieces(Piece::Knight) & board.color_combined(Color::Black) & get_file(chess::File::A)).popcnt() as i32 * 30 * (c);
  value += (board.pieces(Piece::Knight) & board.color_combined(Color::White) & get_file(chess::File::A)).popcnt() as i32 * 30 * (c * -1);
  value += (board.pieces(Piece::Knight) & board.color_combined(Color::Black) & get_file(chess::File::H)).popcnt() as i32 * 30 * (c);
  value += (board.pieces(Piece::Knight) & board.color_combined(Color::White) & get_file(chess::File::H)).popcnt() as i32 * 30 * (c * -1);
  for rank in PAWN_RANKS {
    match rank {
        Rank::Second => { 
          value += (board.pieces(Piece::Pawn) & board.color_combined(Color::Black) & get_rank(rank)).popcnt() as i32 * 20 * (c * -1); 
        },
        Rank::Third => { 
          value += (board.pieces(Piece::Pawn) & board.color_combined(Color::Black) & get_rank(rank)).popcnt() as i32 * 10 * (c * -1);
          value += (board.pieces(Piece::Pawn) & board.color_combined(Color::White) & get_rank(rank)).popcnt() as i32 * 5 * (c); 
        },
        Rank::Fourth => { 
          value += (board.pieces(Piece::Pawn) & board.color_combined(Color::Black) & get_rank(rank)).popcnt() as i32 * 10 * (c * -1);
          value += (board.pieces(Piece::Pawn) & board.color_combined(Color::White) & get_rank(rank)).popcnt() as i32 * 10 * (c); 
        },
        Rank::Fifth => { 
          value += (board.pieces(Piece::Pawn) & board.color_combined(Color::Black) & get_rank(rank)).popcnt() as i32 * 10 * (c * -1);
          value += (board.pieces(Piece::Pawn) & board.color_combined(Color::White) & get_rank(rank)).popcnt() as i32 * 10 * (c); 
        },
        Rank::Sixth => { 
          value += (board.pieces(Piece::Pawn) & board.color_combined(Color::Black) & get_rank(rank)).popcnt() as i32 * 5 * (c * -1);
          value += (board.pieces(Piece::Pawn) & board.color_combined(Color::White) & get_rank(rank)).popcnt() as i32 * 10 * (c); 
        },
        Rank::Seventh => { 
          value += (board.pieces(Piece::Pawn) & board.color_combined(Color::White) & get_rank(rank)).popcnt() as i32 * 20 * (c); 
        },
        _ => ()
    }
  }
  for piece in ALL_PIECES {
    value += material_value(piece) * (board.count_piece(piece, player) as i32 - board.count_piece(piece, !player) as i32)
  }
  return value;
}

#[inline]
fn material_value(piece: Piece) -> i32 {
  match piece {
    Piece::King => 0,
    Piece::Pawn => 103,
    Piece::Rook => 507,
    Piece::Queen => 901,
    Piece::Bishop => 335,
    Piece::Knight => 323,
  }
}
