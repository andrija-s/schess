const WCS = 0;
const WCL = 1;
const BCS = 2;
const BCL = 3;

export const ROOK   = 1;
export const KNIGHT = 2;
export const KING   = 3;
export const PAWN   = 4;
export const QUEEN  = 5;
export const BISHOP = 6;
export const ONPEASANT = 7;
const WCS_MOV = 11;
const WCL_MOV = 13;
const BCS_MOV = 15;
const BCL_MOV = 17;
export const Q_PROM = 18;
export const B_PROM = 25;
export const K_PROM = 32;
export const R_PROM = 39;
export const WHITE = 0;
export const BLACK = 1;
const NONE = -1;
export const EMPTY = 0;
export const w_squares = 8;
export const h_squares = 8;
class Move {
  constructor(from, to, special) {
    this.FROM = from;
    this.TO = to;
    this.SPECIAL = special;
  }
}
export class Game {
  constructor(board) {
    [this.board, this.king_positions, this.turn, this.castles, this.enpeasant] = Game.convert(board);
    this.history = [];
    this.game_over = false;
  }
  check_diag(x, y, color, checked, booli, offset) {
    if (booli[offset] && Game.in_bound(x, y)) {
      let pos = Game.linear(x, y);
      if (this.board[pos].TYPE!==EMPTY) booli[offset] = false;
      if (this.board[pos].COLOR!==color && this.board[pos].TYPE>PAWN) {
        checked = true;
      }
    }
    return checked;
  }
  under_attack(color, pos) {
    let [x,y] = Game.nonlinear(pos);
    let checked = false;
    // pawn checks
    let temp_x,temp_y, temp_val;
    let offset = (color===WHITE) ? 1 : -1;
    for (let val of [x-1,x+1]) {
      if (Game.in_bound(val, y-offset)) {
        temp_val = Game.linear(val, y-offset);
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
        temp_val = Game.linear(temp_x,temp_y);
        if (!(i===0&&j===0) && Game.in_bound(temp_x,temp_y) && this.board[temp_val].TYPE===KING 
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
        temp_val = Game.linear(temp_x,temp_y);
        if (Game.in_bound(temp_x,temp_y) && this.board[temp_val].TYPE===KNIGHT && this.board[temp_val].COLOR!==color)
          return true;
      }
    }
    return checked;
  }
  king_moves(from,test=false) {
    let color = this.board[from].COLOR;
    let moves = [];
    let pos;
    let [x, y] = Game.nonlinear(from);
    let special=0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (!(i===0&&j===0) && Game.in_bound(x+i,y+j)) {
          pos = Game.linear(x+i,y+j);
          if (this.board[pos].COLOR !== color) {
            moves.push(new Move(from, pos, special + this.board[pos].TYPE));
          }
        }
      }
    }
    if (!this.under_attack(color, from)){
      if (color===BLACK) {
        if (this.castles[BCS] && this.board[from+1].TYPE===EMPTY && this.board[from+2].TYPE===EMPTY
            && !this.under_attack(color, from+1) && !this.under_attack(color, from+2)) {
          moves.push(new Move(from, from+2, BCS_MOV));
        }
        if (this.castles[BCL] && this.board[from-1].TYPE===EMPTY && this.board[from-2].TYPE===EMPTY 
            && this.board[from-3].TYPE===EMPTY && !this.under_attack(color, from-1) 
            && !this.under_attack(color, from-2)) {
          moves.push(new Move(from, from-2, BCL_MOV));
        }
      }
      else {
        if (this.castles[WCS] && this.board[from+1].TYPE===EMPTY && this.board[from+2].TYPE===EMPTY 
            && !this.under_attack(color, from+1) && !this.under_attack(color, from+2)) {
          moves.push(new Move(from, from+2, WCS_MOV));
        }
        if (this.castles[WCL] && this.board[from-1].TYPE===EMPTY && this.board[from-2].TYPE===EMPTY
            && this.board[from-3].TYPE===EMPTY && !this.under_attack(color, from-1) 
            && !this.under_attack(color, from-2)) {
          moves.push(new Move(from, from-2, WCL_MOV));
        }
      }
    }
    return moves;
  }
  pawn_moves(from, test=false) {
    let color = this.board[from].COLOR;
    let moves = [];
    let [x, y] = Game.nonlinear(from);
    let going_up = (color===WHITE);
    let inc = w_squares - ((w_squares * 2) * going_up);
    let proms = ((going_up && y===1) || (!going_up && y===6)) ? true : false;
    let arr = [K_PROM,Q_PROM];
    if (test) {
      arr = [K_PROM,B_PROM,R_PROM,Q_PROM];
    }
    if (this.board[from + inc].TYPE===EMPTY) {
      if (proms) {
        arr.forEach(x => moves.push(new Move(from,from + inc,x)));
      }
      else {
        moves.push(new Move(from,from + inc,0));
      }
      if (((going_up && y===6) || (!going_up && y===1)) && (this.board[from + inc + inc].TYPE===EMPTY)) {
        let val = this.board[from + inc + inc].TYPE;
        moves.push(new Move(from,from + inc + inc,val));
      }
    }
    let y_move = (going_up) ? y-1 : y+1;
    function calculate(x_offset, state) {
      let lin_pos = Game.linear(x_offset, y_move);
      if ((state.board[lin_pos].TYPE!==EMPTY && state.board[lin_pos].COLOR!==color)) {
        if (proms) {
          arr.forEach(x => moves.push(new Move(from,lin_pos,x)));
        }
        else {
          moves.push(new Move(from,lin_pos,state.board[lin_pos].TYPE));
        }
      }
      else if (lin_pos===state.enpeasant) {
        moves.push(new Move(from,lin_pos,ONPEASANT));
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
    if (booli && Game.in_bound(x, y)) {
        let pos = Game.linear(x, y);
        if (this.board[pos].COLOR !== color) {
          moves.push(new Move(from,pos,this.board[pos].TYPE));
        }
        if (this.board[pos].TYPE !== EMPTY) {
          return false;
        }
      }
    return booli;
  }
  bishop_moves(from, test=false) {
    let moves = [];
    let [x, y] = Game.nonlinear(from);
    let direction = [true, true, true, true];
    for (let i = 1; i < w_squares; i++) {
      direction[0] = this.diag_calc(x+i,y+i,moves,from,direction[0]);
      direction[1] = this.diag_calc(x+i,y-i,moves,from,direction[1]);
      direction[2] = this.diag_calc(x-i,y+i,moves,from,direction[2]);
      direction[3] = this.diag_calc(x-i,y-i,moves,from,direction[3]);
    }
    return moves;
  }
  queen_moves(from, test=false) {
    let color = (this.turn % 2===0) ? WHITE : BLACK;
    let moves = [];
    let [x, y] = Game.nonlinear(from);
    let direction = [true, true, true, true];
    for (let i = 1; i < w_squares; i++) {
      direction[0] = this.diag_calc(x+i,y+i,moves,from,direction[0]);
      direction[1] = this.diag_calc(x+i,y-i,moves,from,direction[1]);
      direction[2] = this.diag_calc(x-i,y+i,moves,from,direction[2]);
      direction[3] = this.diag_calc(x-i,y-i,moves,from,direction[3]);
    }
    for (let i=from-1; i>=from-x; i--) {
      if (this.board[i].TYPE === EMPTY) {
        moves.push(new Move(from,i,this.board[i].TYPE));
      }
      else {
        if (this.board[i].COLOR !== color) {
          moves.push(new Move(from,i,this.board[i].TYPE));
        }
        break;
      }
    }
    for (let i=from+1; i<(y*w_squares)+8; i++) {
      if (this.board[i].TYPE === EMPTY) {
        moves.push(new Move(from,i,this.board[i].TYPE));
      }
      else {
        if (this.board[i].COLOR !== color) {
          moves.push(new Move(from,i,this.board[i].TYPE));
        }
        break;
      }
    }
    // column check
    for (let i=from-w_squares; i>=x; i-=w_squares) {
      if (this.board[i].TYPE === EMPTY) {
        moves.push(new Move(from,i,this.board[i].TYPE));
      }
      else {
        if (this.board[i].COLOR !== color) {
          moves.push(new Move(from,i,this.board[i].TYPE));
        }
        break;
      }
    }
    for (let i=from+w_squares; i<(w_squares*h_squares); i+=w_squares) {
      if (this.board[i].TYPE === EMPTY) {
        moves.push(new Move(from,i,this.board[i].TYPE));
      }
      else {
        if (this.board[i].COLOR !== color) {
          moves.push(new Move(from,i,this.board[i].TYPE));
        }
        break;
      }
    }
    return moves;
  }
  knight_moves(from, test=false) {
    let color = (this.turn % 2===0) ? WHITE : BLACK;
    let moves = [];
    let [x,y] = Game.nonlinear(from);
    let x_mov, y_mov, lin_pos;
    for (let i=-2;i<3;i++) {
      for (let j=-2;j<3;j++) {
        if (i===0 || j===0 || Math.abs(i)===Math.abs(j))
          continue;
        [x_mov,y_mov] = [x+i, y+j];
        lin_pos = Game.linear(x_mov,y_mov);
        if (Game.in_bound(x_mov,y_mov) && (this.board[lin_pos].TYPE === EMPTY || this.board[lin_pos].COLOR  !== color))
          moves.push(new Move(from,lin_pos,this.board[lin_pos].TYPE));
      }
    }
    return moves;
  }
  rook_moves(from, test=false) {
    let color = this.board[from].COLOR;
    let moves = [];
    let [x, y] = Game.nonlinear(from);
    let special = 0;
    // row check
    for (let i=from-1; i>=from-x; i--) {
      if (this.board[i].TYPE===EMPTY) {
        special = (special===0) ? this.board[i].TYPE : special;
        moves.push(new Move(from,i,special));
      }
      else {
        if (this.board[i].COLOR!==color) {
          special = (special===0) ? this.board[i].TYPE : special;
          moves.push(new Move(from,i,special));
        }
        break;
      }
    }
    for (let i = from+1; i<(y*w_squares)+8; i++) {
      if (this.board[i].TYPE===EMPTY) {
        special = (special===0) ? this.board[i].TYPE : special;
        moves.push(new Move(from,i,special));
      }
      else {
        if (this.board[i].COLOR!==color) {
          special = (special===0) ? this.board[i].TYPE : special;
          moves.push(new Move(from,i,special));
        }
        break;
      }
    }
    // column check
    for (let i=from-w_squares; i>=x; i-=w_squares) {
      if (this.board[i].TYPE===EMPTY) {
        special = (special===0) ? this.board[i].TYPE : special;
        moves.push(new Move(from,i,special));
      }
      else {
        if (this.board[i].COLOR!==color) {
          special = (special===0) ? this.board[i].TYPE : special;
          moves.push(new Move(from,i,special));
        }
        break;
      }
    }
    for (let i=from+w_squares; i<(w_squares*h_squares); i+=w_squares) {
      if (this.board[i].TYPE===EMPTY) {
        special = (special===0) ? this.board[i].TYPE : special;
        moves.push(new Move(from,i,special));
      }
      else {
        if (this.board[i].COLOR!==color) {
          special = (special===0) ? this.board[i].TYPE : special;
          moves.push(new Move(from,i,special));
        }
        break;
      }
    }
    return moves;
  }
  filter_moves(color, moves) {
    let good_moves = [];
    for (let mov of moves) {
      this.move(mov);
      if (!this.under_attack(color, this.king_positions[color])) {
        good_moves.push(mov);
      }
      this.unmove();
    }
    return good_moves;
  }
  all_moves(test=false) {
    let moves = [];
    let color = (this.turn % 2===0) ? WHITE : BLACK;
    for (let pos=0; pos<this.board.length;pos++) {
      if (this.board[pos].COLOR===color) {
      if (this.board[pos].TYPE===KING) { 
        moves.push(...this.king_moves(pos,test)); }
      else if (this.board[pos].TYPE===QUEEN) { 
        moves.push(...this.queen_moves(pos,test)); }
      else if (this.board[pos].TYPE===ROOK) { 
        moves.push(...this.rook_moves(pos,test)); }
      else if (this.board[pos].TYPE===KNIGHT) {
        moves.push(...this.knight_moves(pos,test)); }
      else if (this.board[pos].TYPE===BISHOP) { 
        moves.push(...this.bishop_moves(pos,test)); }
      else if (this.board[pos].TYPE===PAWN) { 
        moves.push(...this.pawn_moves(pos,test)); }
      }
    }
    return this.filter_moves(color, moves);
  }
  moves_from(from) {
    let moves = [];
    let color = this.board[from].COLOR;
    if (this.board[from].TYPE===ROOK)        { moves = this.rook_moves(from,true); }
    else if (this.board[from].TYPE===KNIGHT) { moves = this.knight_moves(from,true); }
    else if (this.board[from].TYPE===BISHOP) { moves = this.bishop_moves(from, true); }
    else if (this.board[from].TYPE===KING)   { moves = this.king_moves(from,true); }
    else if (this.board[from].TYPE===QUEEN)  { moves = this.queen_moves(from, true); }
    else if (this.board[from].TYPE===PAWN)   { moves = this.pawn_moves(from, true); }
    return this.filter_moves(color, moves);
  }
  move(mov, main=true) {
    if (main) this.history.push(this.duplicate());
    this.enpeasant = -1;
    if (this.board[mov.FROM].TYPE===PAWN) {
      let [x_to, y_to] = Game.nonlinear(mov.TO);
      if (Math.abs(mov.TO-mov.FROM) === 16) {
        this.enpeasant = (this.board[mov.FROM].COLOR===WHITE) ? mov.TO + 8 : mov.TO - 8;;
      }
      else if (y_to===0 || y_to===7) {
        switch(mov.SPECIAL) {
          case Q_PROM:
            this.board[mov.FROM].TYPE = QUEEN;
            break;
          case B_PROM:
            this.board[mov.FROM].TYPE = BISHOP;
            break;
          case K_PROM:
            this.board[mov.FROM].TYPE = KNIGHT;
            break;
          case R_PROM:
            this.board[mov.FROM].TYPE = ROOK;
            break;
        }
        if ((mov.TO===63 && this.castles[WCS]===1)
         || (mov.TO===56 && this.castles[WCL]===1) 
         || (mov.TO===7  && this.castles[BCS]===1) 
         || (mov.TO===0  && this.castles[BCL]===1)) {
        }
      }
      else {
        if (mov.SPECIAL===ONPEASANT) {
          let pos = (this.board[mov.FROM].COLOR===WHITE) ? mov.TO + 8 : mov.TO - 8;
          this.board[pos].TYPE = EMPTY;
          this.board[pos].COLOR = NONE;
        }
      }
    }
    else if (this.board[mov.FROM].TYPE===ROOK) {
      if      (mov.FROM===63) { this.castles[WCS] = 0; }
      else if (mov.FROM===56) { this.castles[WCL] = 0; }
      else if (mov.FROM===7)  { this.castles[BCS] = 0; }
      else if (mov.FROM===0)  { this.castles[BCL] = 0; }
    }
    else if (this.board[mov.FROM].TYPE===KING) {
      if (this.board[mov.FROM].COLOR===WHITE) {
        this.castles[WCS] = 0;
        this.castles[WCL] = 0;
        this.king_positions[WHITE] = mov.TO;
      }
      else {
        this.castles[BCS] = 0;
        this.castles[BCL] = 0;
        this.king_positions[BLACK] = mov.TO;
      }
    }
    this.board[mov.TO] = this.board[mov.FROM];
    this.board[mov.FROM] = {TYPE:EMPTY,COLOR:NONE};
    // castling
    if (mov.SPECIAL>=WCS_MOV && mov.SPECIAL<=BCL_MOV) {
      let rook_pos, r_mov;
      switch(mov.SPECIAL) {
        case WCS_MOV:
          r_mov = mov.FROM + 1;
          rook_pos = 63;
          break;
        case WCL_MOV:
          r_mov = mov.FROM - 1;
          rook_pos = 56;
          break;
        case BCS_MOV:
          r_mov = mov.FROM + 1;
          rook_pos = 7;
          break;
        case BCL_MOV:
          r_mov = mov.FROM - 1;
          rook_pos = 0;
          break;
      }
      this.board[rook_pos].TYPE = EMPTY;
      this.board[rook_pos].COLOR = NONE;
      this.board[r_mov].TYPE = ROOK;
      this.board[r_mov].COLOR = this.board[mov.TO].COLOR;
    }
    if      (mov.TO===63) { this.castles[WCS] = 0; }
    else if (mov.TO===56) { this.castles[WCL] = 0; }
    else if (mov.TO===7)  { this.castles[BCS] = 0; }
    else if (mov.TO===0)  { this.castles[BCL] = 0; }
    this.turn += 1;
  }
  
  unmove() {
    let temp = this.history.pop();
    this.board = temp.board;
    this.enpeasant = temp.enpeasant;
    this.turn = temp.turn;
    this.castles = temp.castles;
    this.king_positions = temp.king_positions;
    this.history = temp.history;
  }
  
  static in_bound(x, y) {
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
      enpeas = Game.linear(x[str_split[3].charAt(0)], 7-(parseInt(str_split[3].charAt(1)-1)))
    }
    let arr = [];
    let curr_char, type, color, upper, wk_pos, bk_pos;
    let count = 0;
    for (let i = 0; i < str_split[0].length; i++) {
      curr_char = str_split[0].toString().charAt(i);
      if (curr_char==="/") continue;
      if (!isNaN(parseInt(curr_char))) {
        for (let j = 0; j < parseInt(curr_char); j++) {
          arr.push({TYPE:EMPTY, COLOR:NONE});
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
  duplicate() {
    let ret = new Game("");
    ret.board = structuredClone(this.board);
    ret.enpeasant = this.enpeasant;
    ret.turn = this.turn;
    ret.castles = structuredClone(this.castles);
    ret.king_positions = [...this.king_positions];
    ret.history = [...this.history];
    return ret;
  }
}