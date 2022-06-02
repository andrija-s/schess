const WCS = 0;
const WCL = 1;
const BCS = 2;
const BCL = 3;
const WCS_MOV = 9;
const WCL_MOV = 10;
const BCS_MOV = 11;
const BCL_MOV = 12;
const ONPEASANT = 13;
const ROOK   = 1;
const KNIGHT = 2;
const KING   = 3;
const PAWN   = 4;
const QUEEN  = 5;
const BISHOP = 6;
export const Q_PROM = 14;
export const B_PROM = 15;
export const K_PROM = 16;
export const R_PROM = 17;
export const WHITE = 0;
export const BLACK = 1;
export const EMPTY = -1;
export const w_squares = 8;
export const h_squares = 8;
export class chess_state {
  constructor(board) {
    [this.board, this.king_positions, this.turn, this.castles, this.enpeasant] = chess_state.convert(board);
  }
  check_diag(x, y, color, checked, booli, offset) {
    if (booli[offset] && chess_state.inBound(x, y)) {
      let pos = chess_state.linear(x, y);
      if (this.board[pos].TYPE!==EMPTY) booli[offset] = false;
      if (this.board[pos].COLOR!==color && this.board[pos].TYPE>PAWN) {
        checked = true;
      }
    }
    return checked;
  }
  underAttack(color, pos) {
    let [x,y] = chess_state.nonlinear(pos);
    let checked = false;
    // pawn checks
    let temp_x,temp_y, temp_val;
    let offset = (color===WHITE) ? 1 : -1;
    for (let val of [x-1,x+1]) {
      if (chess_state.inBound(val, y-offset)) {
        temp_val = chess_state.linear(val, y-offset);
        if (this.board[temp_val].TYPE>KNIGHT && this.board[temp_val].COLOR!==color) {
          return true;
        }
      }
    }
    // oppo king check
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        temp_x = x+i;
        temp_y = y+j;
        temp_val = chess_state.linear(temp_x,temp_y);
        if (!(i===0&&j===0) && chess_state.inBound(temp_x,temp_y) && this.board[temp_val].TYPE===KING 
            && this.board[temp_val].COLOR!==color) {
          return true;
        }
      }
    }

    // diagonal check for queen/bishops
    let lines = [true, true, true, true];
    for (let i=1; i<w_squares; i++) {
      if (checked=this.check_diag(x+i,y+i,color,checked,lines,0))
        return checked;
      if (checked=this.check_diag(x+i,y-i,color,checked,lines,1))
        return checked;
      if (checked=this.check_diag(x-i,y+i,color,checked,lines,2))
        return checked;
      if (checked=this.check_diag(x-i,y-i,color,checked,lines,3))
        return checked;
    }
    // column/row check for queen/rooks
    for (let i=pos-1; i>=pos-x; i--) {
      if (this.board[i].TYPE!==EMPTY) {
        if (this.board[i].COLOR!==color && (this.board[i].TYPE===ROOK || this.board[i].TYPE===QUEEN)) {
            return true;
        }
        break;
      }
    }
    for (let i=pos+1; i<(y*w_squares)+8; i++) {
      if (this.board[i].TYPE!==EMPTY) {
        if (this.board[i].COLOR!==color && (this.board[i].TYPE===ROOK || this.board[i].TYPE===QUEEN)) {
            return true;
        }
        break;
      }
    }

    // column check

    for (let i=pos-w_squares; i>=x; i-=w_squares) {
      if (this.board[i].TYPE!==EMPTY) {
        if (this.board[i].COLOR!==color && (this.board[i].TYPE===ROOK || this.board[i].TYPE===QUEEN)) {
            return true;
        }
        break;
      }
    }
    for (let i=pos+w_squares; i<(w_squares*h_squares); i+=w_squares) {
      if (this.board[i].TYPE!==EMPTY) {
        if (this.board[i].COLOR!==color && (this.board[i].TYPE===ROOK || this.board[i].TYPE===QUEEN)) {
            return true;
        }
        break;
      }
    }
    // knight check
    for (let i=-2;i<3;i++) {
      for (let j=-2;j<3;j++) {
        if (i===0 || j===0 || Math.abs(i)===Math.abs(j))
          continue;
        [temp_x,temp_y] = [x+i, y+j];
        temp_val = chess_state.linear(temp_x,temp_y);
        if (chess_state.inBound(temp_x,temp_y) && this.board[temp_val].TYPE===KNIGHT && this.board[temp_val].COLOR!==color)
          return true;
      }
    }
    return checked;
  }
  kingMoves(from) {
    let color = (this.turn % 2===0) ? WHITE : BLACK;
    let moves = [];
    let pos;
    let [x, y] = chess_state.nonlinear(from);
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (!(i===0&&j===0) && chess_state.inBound(x+i,y+j)) {
          pos = chess_state.linear(x+i,y+j);
          if (this.board[pos].COLOR !== color) {
            moves.push([from,pos,0]);
          }
        }
      }
    }
    if (!this.underAttack(color, from)){
      if (color===BLACK) {
        if (this.castles[BCS] && this.board[from+1].TYPE===EMPTY && this.board[from+2].TYPE===EMPTY
            && !this.underAttack(color, from+1) && !this.underAttack(color, from+2)) {
          moves.push([from, from+2, BCS_MOV]);
        }
        if (this.castles[BCL] && this.board[from-1].TYPE===EMPTY && this.board[from-2].TYPE===EMPTY 
            && this.board[from-3].TYPE===EMPTY && !this.underAttack(color, from-1) 
            && !this.underAttack(color, from-2)) {
          moves.push([from, from-2, BCL_MOV]);
        }
      }
      else {
        if (this.castles[WCS] && this.board[from+1].TYPE===EMPTY && this.board[from+2].TYPE===EMPTY 
            && !this.underAttack(color, from+1) && !this.underAttack(color, from+2)) {
          moves.push([from, from+2, WCS_MOV]);
        }
        if (this.castles[WCL] && this.board[from-1].TYPE===EMPTY && this.board[from-2].TYPE===EMPTY
            && this.board[from-3].TYPE===EMPTY && !this.underAttack(color, from-1) 
            && !this.underAttack(color, from-2)) {
          moves.push([from, from-2, WCL_MOV]);
        }
      }
    }
    return moves;
  }
  pawnMoves(from) {
    let color = (this.turn % 2===0) ? WHITE : BLACK;
    let moves = [];
    let [x, y] = chess_state.nonlinear(from);
    let going_up = (color===WHITE);
    let inc = w_squares - ((w_squares * 2) * going_up);
    let proms = ((going_up && y===1) || (!going_up && y===6)) ? [K_PROM,B_PROM, R_PROM, Q_PROM] : [0];
    if (this.board[from + inc].TYPE===EMPTY) {
      proms.forEach(x => moves.push([from,from + inc,x]));
      if (((going_up && y===6) || (!going_up && y===1)) && (this.board[from + inc + inc].TYPE===EMPTY)) {
        moves.push([from,from + inc + inc,0]);
      }
    }
    let y_move = (going_up) ? y-1 : y+1;
    function calculate(x_offset, state) {
      let lin_pos = chess_state.linear(x_offset, y_move);
      if ((state.board[lin_pos].TYPE!==EMPTY && state.board[lin_pos].COLOR!==color)) {
        proms.forEach(x => moves.push([from,lin_pos,x]));
      }
      else if (lin_pos===state.enpeasant) {
        moves.push([from,lin_pos,ONPEASANT]);
      }
    }
    if (x !== 7) {
      calculate(x+1, this);
    }
    if (x !== 0) {
      calculate(x-1, this);
    }
    return moves;
  }
  diag_calc(x, y, moves, from, booli) {
    let color = (this.turn % 2===0) ? WHITE : BLACK;
    if (booli && chess_state.inBound(x, y)) {
        let pos = chess_state.linear(x, y);
        if (this.board[pos].COLOR !== color) moves.push([from,pos,0]);
        if (this.board[pos].TYPE !== EMPTY) {
          return false;
        }
      }
    return booli;
  }
  bishopMoves(from) {
    let moves = [];
    let [x, y] = chess_state.nonlinear(from);
    let direction = [true, true, true, true];
    for (let i = 1; i < w_squares; i++) {
      direction[0] = this.diag_calc(x+i,y+i,moves,from,direction[0]);
      direction[1] = this.diag_calc(x+i,y-i,moves,from,direction[1]);
      direction[2] = this.diag_calc(x-i,y+i,moves,from,direction[2]);
      direction[3] = this.diag_calc(x-i,y-i,moves,from,direction[3]);
    }
    return moves;
  }
  queenMoves(from) {
    let color = (this.turn % 2===0) ? WHITE : BLACK;
    let moves = [];
    let [x, y] = chess_state.nonlinear(from);
    let direction = [true, true, true, true];
    for (let i = 1; i < w_squares; i++) {
      direction[0] = this.diag_calc(x+i,y+i,moves,from,direction[0]);
      direction[1] = this.diag_calc(x+i,y-i,moves,from,direction[1]);
      direction[2] = this.diag_calc(x-i,y+i,moves,from,direction[2]);
      direction[3] = this.diag_calc(x-i,y-i,moves,from,direction[3]);
    }
    for (let i=from-1; i>=from-x; i--) {
      if (this.board[i].TYPE === EMPTY) {
        moves.push([from,i,0]);
      }
      else {
        if (this.board[i].COLOR !== color) {
          moves.push([from,i,0]);
        }
        break;
      }
    }
    for (let i=from+1; i<(y*w_squares)+8; i++) {
      if (this.board[i].TYPE === EMPTY) {
        moves.push([from,i,0]);
      }
      else {
        if (this.board[i].COLOR !== color) {
          moves.push([from,i,0]);
        }
        break;
      }
    }
    // column check
    for (let i=from-w_squares; i>=x; i-=w_squares) {
      if (this.board[i].TYPE === EMPTY) {
        moves.push([from,i,0]);
      }
      else {
        if (this.board[i].COLOR !== color) {
          moves.push([from,i,0]);
        }
        break;
      }
    }
    for (let i=from+w_squares; i<(w_squares*h_squares); i+=w_squares) {
      if (this.board[i].TYPE === EMPTY) {
        moves.push([from,i,0]);
      }
      else {
        if (this.board[i].COLOR !== color) {
          moves.push([from,i,0]);
        }
        break;
      }
    }
    return moves;
  }
  knightMoves(from) {
    let color = (this.turn % 2===0) ? WHITE : BLACK;
    let moves = [];
    let [x,y] = chess_state.nonlinear(from);
    let x_mov, y_mov, lin_pos;
    for (let i=-2;i<3;i++) {
      for (let j=-2;j<3;j++) {
        if (i===0 || j===0 || Math.abs(i)===Math.abs(j))
          continue;
        [x_mov,y_mov] = [x+i, y+j];
        lin_pos = chess_state.linear(x_mov,y_mov);
        if (chess_state.inBound(x_mov,y_mov) && (this.board[lin_pos].TYPE === EMPTY || this.board[lin_pos].COLOR  !== color))
          moves.push([from,lin_pos,0]);
      }
    }
    return moves;
  }
  rookMoves(from) {
    let color = (this.turn % 2===0) ? WHITE : BLACK;
    let moves = [];
    let [x, y] = chess_state.nonlinear(from);
    // row check
    for (let i=from-1; i>=from-x; i--) {
      if (this.board[i].TYPE===EMPTY) {
        moves.push([from,i,0]);
      }
      else {
        if (this.board[i].COLOR!==color) {
          moves.push([from,i,0]);
        }
        break;
      }
    }
    for (let i = from+1; i<(y*w_squares)+8; i++) {
      if (this.board[i].TYPE===EMPTY) {
        moves.push([from,i,0]);
      }
      else {
        if (this.board[i].COLOR!==color) {
          moves.push([from,i,0]);
        }
        break;
      }
    }
    // column check
    for (let i=from-w_squares; i>=x; i-=w_squares) {
      if (this.board[i].TYPE===EMPTY) {
        moves.push([from,i,0]);
      }
      else {
        if (this.board[i].COLOR!==color) {
          moves.push([from,i,0]);
        }
        break;
      }
    }
    for (let i=from+w_squares; i<(w_squares*h_squares); i+=w_squares) {
      if (this.board[i].TYPE===EMPTY) {
        moves.push([from,i,0]);
      }
      else {
        if (this.board[i].COLOR!==color) {
          moves.push([from,i,0]);
        }
        break;
      }
    }
    return moves;
  }
  filter_moves(color, moves) {
    let temp_state;
    let good_moves = [];
    for (let val of moves) {
      temp_state = this.copy();
      temp_state.move(val);
      if (!temp_state.underAttack(color, temp_state.king_positions[color])) {
        good_moves.push(val);
      }
    }
    return good_moves;
  }
  allMoves() {
    let moves = [];
    let color = (this.turn % 2===0) ? WHITE : BLACK;
    for (let pos=0; pos<this.board.length;pos++) {
      if (this.board[pos].COLOR===color) {
      if (this.board[pos].TYPE===ROOK) { 
        moves.push(...this.rookMoves(pos)); }
      else if (this.board[pos].TYPE===KNIGHT) {
        moves.push(...this.knightMoves(pos)); }
      else if (this.board[pos].TYPE===BISHOP) { 
        moves.push(...this.bishopMoves(pos)); }
      else if (this.board[pos].TYPE===KING) { 
        moves.push(...this.kingMoves(pos)); }
      else if (this.board[pos].TYPE===QUEEN) { 
        moves.push(...this.queenMoves(pos)); }
      else if (this.board[pos].TYPE===PAWN) { 
        moves.push(...this.pawnMoves(pos)); }
      }
    }
    return this.filter_moves(color, moves);
  }
  movesFrom(from) {
    let moves = [];
    let color = this.board[from].COLOR;
    if (this.board[from].TYPE===ROOK)        { moves = this.rookMoves(from); }
    else if (this.board[from].TYPE===KNIGHT) { moves = this.knightMoves(from); }
    else if (this.board[from].TYPE===BISHOP) { moves = this.bishopMoves(from); }
    else if (this.board[from].TYPE===KING)   { moves = this.kingMoves(from); }
    else if (this.board[from].TYPE===QUEEN)  { moves = this.queenMoves(from); }
    else if (this.board[from].TYPE===PAWN)   { moves = this.pawnMoves(from); }
    return this.filter_moves(color, moves);
  }
  move(mov) {
    let from = mov[0];
    let to = mov[1];
    let special = mov[2];
    if (to===63)      { this.castles[WCS] = 0; }
    else if (to===56) { this.castles[WCL] = 0; }
    else if (to===7)  { this.castles[BCS] = 0; }
    else if (to===0)  { this.castles[BCL] = 0; }
    this.enpeasant = -1;
    if (this.board[from].TYPE===PAWN) {
      let [x_to, y_to] = chess_state.nonlinear(to);
      if (Math.abs(to-from) === 16) {
        this.enpeasant = (this.board[from].COLOR===WHITE) ? to + 8 : to - 8;;
      }
      else if (y_to===0 || y_to===7) {
        switch(special) {
          case B_PROM:
            this.board[from].TYPE = BISHOP;
            break;
          case Q_PROM:
            this.board[from].TYPE = QUEEN;
            break;
          case R_PROM:
            this.board[from].TYPE = ROOK;
            break;
          case K_PROM:
            this.board[from].TYPE = KNIGHT;
            break;
          default:
            this.board[from].TYPE = promote_piece
        }
      }
      else {
        if (special===ONPEASANT) {
          let pos = (this.board[from].COLOR===WHITE) ? to + 8 : to - 8;
          this.board[pos].TYPE = EMPTY;
          this.board[pos].COLOR = EMPTY;
        }
      }
    }
    else if (this.board[from].TYPE===ROOK) {
      if (from===63)      { this.castles[WCS] = 0; }
      else if (from===56) { this.castles[WCL] = 0; }
      else if (from===7)  { this.castles[BCS] = 0; }
      else if (from===0)  { this.castles[BCL] = 0; }
    }
    else if (this.board[from].TYPE===KING) {
      if (this.board[from].COLOR===WHITE) {
        this.castles[WCS] = 0;
        this.castles[WCL] = 0;
        this.king_positions[WHITE] = to;
      }
      else {
        this.castles[BCS] = 0;
        this.castles[BCL] = 0;
        this.king_positions[BLACK] = to;
      }
    }
    this.board[to].TYPE = this.board[from].TYPE;
    this.board[to].COLOR = this.board[from].COLOR;
    this.board[from].TYPE = EMPTY;
    this.board[from].COLOR = EMPTY;
    // castling
    if (special>=WCS_MOV && special<=BCL_MOV) {
      let rook_pos, r_mov;
      switch(special) {
        case WCS_MOV:
          r_mov = from + 1;
          rook_pos = 63;
          break;
        case WCL_MOV:
          r_mov = from - 1;
          rook_pos = 56;
          break;
        case BCS_MOV:
          r_mov = from + 1;
          rook_pos = 7;
          break;
        case BCL_MOV:
          r_mov = from - 1;
          rook_pos = 0;
          break;
      }
      this.board[rook_pos].TYPE = EMPTY;
      this.board[rook_pos].COLOR = EMPTY;
      this.board[r_mov].TYPE = ROOK;
      this.board[r_mov].COLOR = this.board[to].COLOR;
    }
    this.turn += 1;
  }
  static inBound(x, y) {
    return (x >= 0 && x < w_squares && y >= 0 && y < h_squares);
  }
  static linear(x, y) {
    return ((h_squares*y)+x);
  }
  static nonlinear(z) {
    let x = z % w_squares;
    let y = (z / h_squares) | 0;
    return [x, y];
  }
  static convert(string) {
    if (string==="") return [null,null,null,null,null];
    let str_split = string.split(' ');
    let turn = (str_split[1] === "w") ? 0 : 1;
    let castles = [0,0,0,0];
    for (let char of str_split[2]) {
      if (char==="K") castles[0]=1;
      else if (char==="Q") castles[1]=1;
      else if (char==="k") castles[2]=1;
      else if (char==="q") castles[3]=1;
    }
    let enpeas = -1;
    if (str_split[3]!=="-") {
      const x = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7, };
      enpeas = chess_state.linear(x[str_split[3].charAt(0)], 7-(parseInt(str_split[3].charAt(1)-1)))
    }
    let arr = [];
    let curr_char, type, color, upper, wk_pos, bk_pos;
    let count = 0;
    for (let i = 0; i < str_split[0].length; i++) {
      curr_char = str_split[0].toString().charAt(i);
      if (curr_char==="/") continue;
      if (!isNaN(parseInt(curr_char))) {
        for (let j = 0; j < parseInt(curr_char); j++) {
          arr.push({TYPE:EMPTY, COLOR:EMPTY});
          count += 1;
        }
        continue;
      }
      upper = curr_char.toUpperCase();
      color = (upper===curr_char) ? WHITE : BLACK;
      if (upper==="R") type = ROOK;
      else if (upper==="Q") type = QUEEN;
      else if (upper==="K") {
        type = KING;
        if (color===WHITE) wk_pos=count;
        else bk_pos=count;
      }
      else if (upper==="B") type = BISHOP;
      else if (upper==="N") type = KNIGHT;
      else if (upper==="P") type = PAWN;
      arr.push({TYPE:type,COLOR:color});
      count += 1;
    }
    return [arr, [wk_pos,bk_pos], turn, castles, enpeas];
  }
  copy() {
    let ret = new chess_state("");
    ret.board = structuredClone(this.board);
    ret.enpeasant = this.enpeasant;
    ret.turn = this.turn;
    ret.castles = structuredClone(this.castles);
    ret.king_positions = [...this.king_positions];
    return ret;
  }
}