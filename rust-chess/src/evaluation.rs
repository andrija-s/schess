use chess::{Board, Color, Piece, ALL_PIECES};

pub fn evaluation(board: &Board, player: Color) -> i32 {
  let mut value = 0;
  for piece in ALL_PIECES {
    value += material_value(piece) * (board.count_piece(piece, player) as i32 - board.count_piece(piece, !player) as i32)
  }
  return value;
}

#[inline]
fn material_value(piece: Piece) -> i32 {
  match piece {
    Piece::King => 0,
    Piece::Pawn => 107,
    Piece::Rook => 503,
    Piece::Queen => 901,
    Piece::Bishop => 335,
    Piece::Knight => 323,
  }
}
