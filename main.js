const WHITE = "w";
const BLACK = "b";
const EMPTY = "-0";
const ROOK = "R";
const KNIGHT = "N";
const KING = "K";
const PAWN = "P";
const QUEEN  = "Q";
const BISHOP = "B";
const DEFAULT_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - n";
const STATUS_CM = "cm"; // checkmate
const STATUS_SM = "sm"; // stalemate
const STATUS_OG = "og"; // ongoing
const c_height = window.innerHeight / 1.1; // canvas height
const c_width = c_height;  // canvas width
const SQUARES_W = 8;
const SQUARES_H = 8;
const width = c_width/SQUARES_W;   // square width
const height = c_height/SQUARES_H; // square height
const PROM_IMG_W = SQUARES_W+3;
const PROM_IMG_H = SQUARES_H+3;
const BTN_HGHLT = "#d4d422";
const CHECK_COLOR = "yellow";
const BORDER_COLOR = "black"; // square border
const SELECT_COLOR = "goldenrod";
const LSQ_COLOR = "#ff7a39"; // square light
const DSQ_COLOR = "brown";   // square dark
const MOVE_HGHLT_COLOR = "navajowhite"; // move highlight
const SQ_FROM_COLOR ="teal";
const SQ_TO_COLOR ="aqua";
const PIECE_SETS = ["alpha", "anarcandy", "cburnett", "chessnut", "kosal", "maestro", "merida"];
const IMAGES = {}; // piece images
const AUDIO = {};
const DEPTHS = [ 1, 2, 3, 4, 5, 6 ];
const WORKER_PATH = "./scripts/worker.js";
const AI_SEARCH = "ai_search";
const INIT_MOVES = "init_moves";

let promote_fens = {"Q": null, "B": null, "R": null, "N": null};
let curr_set = "kosal";
let worker = null
let player = WHITE;
let moves_highlight = null;
let recent_from = -1;
let recent_to = -1;
let selected = -1;
let is_flipped = false;
let c = null; // canvas element
let ctx = null; // canvas context
let evaluation = 0;
let can_move = true;
let ai_time = 0.0;
let curr_depth = 5;
let board_state = null;
let white_checked = null; 
let black_checked = null;
let regular_moves = null;
let prom_moves = null;
let game_over = false;

class Piece {
  constructor(color, type) {
    this.COLOR = color;
    this.TYPE = type;
  }
}

// TODO
function pick_color(input) {
  return;
}
function draw() {
  alert("DRAW!");
}
function win() {
  alert("YOU WIN!");
}
function lose() {
  alert("YOU LOSE!");
}
/**
 * @param {Number} x 
 * @param {Number} y 
 * @returns 
 */
function linear(x, y) {
  return ((SQUARES_H*y)+x);
}
/**
 * @param {Number} z 
 * @returns Array of Numbers
 */
function nonlinear(z) {
  let x = z % SQUARES_W;
  let y = (z / SQUARES_H) | 0;
  return [x, y];
}
/**
 * 
 * @param {Array} moves array of Move objects 
 * @param {Number} pos position of target move
 * @returns Move
 */
function selected_move(moves, pos) {
  for (let mov of moves) {
    if (mov.TO === pos) {
      return mov;
    }
  }
  return null;
}

async function render_board() {
  for (let i = 0; i < SQUARES_W; i++) {
    for (let j = 0; j < SQUARES_H; j++) {
      let [x,y] = (is_flipped) ? [7-i,7-j] : [i,j]; 
      let pos = linear(x,y);
      ctx.fillStyle =  BORDER_COLOR;
      ctx.fillRect(i*width,j*height,width,height);
      ctx.fillStyle = (j % 2 === i % 2) ? LSQ_COLOR : DSQ_COLOR;
      if (selected === pos) ctx.fillStyle = SELECT_COLOR;
      else if (moves_highlight.has(pos)) 
        ctx.fillStyle = MOVE_HGHLT_COLOR;
      else if ((board_state[pos].TYPE===KING && board_state[pos].COLOR===WHITE && white_checked) 
                || (board_state[pos].TYPE===KING && board_state[pos].COLOR===BLACK && black_checked)) 
        ctx.fillStyle = CHECK_COLOR;
      else if (pos === recent_from) 
        ctx.fillStyle = SQ_FROM_COLOR;
      else if (pos === recent_to)
        ctx.fillStyle = SQ_TO_COLOR;
      ctx.fillRect(i*width,j*height,width-1,height-1);
    }
  }
}

async function render_state() {
  await render_board();

  for (let i=0; i<SQUARES_H*SQUARES_W; i++) {
    if (board_state[i].TYPE===EMPTY) {
      continue;
    };
    let [x, y] = nonlinear(i);
    [x, y] = (is_flipped) ? [7-x,7-y] : [x,y];
    let str = board_state[i].COLOR + "" + board_state[i].TYPE;
    let img = IMAGES[str];
    ctx.drawImage(img, (x*width)+(width/(SQUARES_W+SQUARES_W)), (y*height)+(height/(SQUARES_H+SQUARES_H)), c.width/(SQUARES_W+1), c.height/(SQUARES_H+1));
  }
}

async function flip(change=false) {
  if (change && ((is_flipped && player===BLACK) || (!is_flipped && player===WHITE))) return;
  is_flipped = !is_flipped;
  if(can_move) selected = -1;
  moves_highlight = new Set();
  await render_state();
}

function load_image(key, url) {
  return new Promise((resolve, reject) => { 
                        let i = new Image();
                        IMAGES[key] = i;
                        i.addEventListener('load', () => resolve(i));
                        i.addEventListener('error', (err) => reject(err));
                        i.src = url; 
                      });
}
async function init_images(set) {
  let jar = [];
  jar.push(load_image(BLACK+ROOK,   `./assets/pieces/${set}/bR.svg`));
  jar.push(load_image(BLACK+KNIGHT, `./assets/pieces/${set}/bN.svg`));
  jar.push(load_image(BLACK+KING,   `./assets/pieces/${set}/bK.svg`));
  jar.push(load_image(BLACK+PAWN,   `./assets/pieces/${set}/bP.svg`));
  jar.push(load_image(BLACK+QUEEN,  `./assets/pieces/${set}/bQ.svg`));
  jar.push(load_image(BLACK+BISHOP, `./assets/pieces/${set}/bB.svg`));
  jar.push(load_image(WHITE+ROOK,   `./assets/pieces/${set}/wR.svg`));
  jar.push(load_image(WHITE+KNIGHT, `./assets/pieces/${set}/wN.svg`));
  jar.push(load_image(WHITE+KING,   `./assets/pieces/${set}/wK.svg`));
  jar.push(load_image(WHITE+PAWN,   `./assets/pieces/${set}/wP.svg`));
  jar.push(load_image(WHITE+QUEEN,  `./assets/pieces/${set}/wQ.svg`));
  jar.push(load_image(WHITE+BISHOP, `./assets/pieces/${set}/wB.svg`));
  await Promise.all(jar);
}

async function init_audio() {
  AUDIO["move"] = new Audio("./assets/sound/move.wav");
}

function reset_highlight(iter) {
  for (let opt of iter.children) {
        opt.style["background-color"] = "";
  }
}

function set_worker() {
  worker = new Worker(WORKER_PATH);
  worker.onmessage = ai_done;
}

async function reset() {
  if (worker !== null)  worker.terminate();
  set_worker();
  hide_prom();
  [board_state, white_checked, black_checked] = await parse_fen(DEFAULT_FEN);
  moves_highlight = new Set();
  recent_from = -1;
  recent_to = -1;
  selected = -1;
  can_move = false;
  game_over = false;
  if (player===BLACK) {
    move_ai(DEFAULT_FEN);
  }
  else {
    worker.postMessage({TYPE: INIT_MOVES, FEN: DEFAULT_FEN});
  }
  await render_state();
}
function prom_images() {
  for (let prom of document.getElementById("drop-prom").children) {
    prom.innerHTML = `<img src="./assets/pieces/${curr_set}/${player}${prom.id}.svg" width="${c.width/PROM_IMG_W}" height="${c.height/PROM_IMG_H}"/>`;
  }
}
function change_color() {
  player = (player===WHITE) ? BLACK : WHITE;
  prom_images();
  reset();
}

function hide_prom() {
  document.querySelector(".proms").style.display = "none";
}
function bind_buttons() {

  let ai_iter = document.getElementById("drop-ai");
  for (let i=0; i<DEPTHS.length; i++) {
    let tag = document.createElement("a");
    tag.innerHTML = "Depth " + DEPTHS[i];
    if (tag.innerHTML==="Depth " + curr_depth) tag.style["background-color"] = BTN_HGHLT;
    tag.addEventListener("click", (e) => {
      if (tag.innerHTML==="Depth " + curr_depth) { return; }
      reset_highlight(ai_iter);
      e.target.style["background-color"] = BTN_HGHLT;
      curr_depth = DEPTHS[i];
    });
    ai_iter.appendChild(tag);
  }
  let flip_btn = document.getElementById("flipbtn");
  flip_btn.addEventListener("click", () => {
    flip();
  });

  let prom_iter = document.getElementById("drop-prom");
  for (const piece in promote_fens) {
    let tag = document.createElement("a");
    tag.id = piece
    tag.addEventListener("click", () => {
      conclude_move(promote_fens[piece]);
      hide_prom();
    });
    prom_iter.appendChild(tag);
  }
  prom_images();
  let set_iter = document.getElementById("drop-sets");
  for (const set of PIECE_SETS) {
    let tag = document.createElement("a");
    tag.innerHTML = set;
    if (tag.innerHTML===curr_set) tag.style["background-color"] = BTN_HGHLT;
    tag.addEventListener("click", async function(e) {
      if (tag.innerHTML===curr_set) { return; }
      try { await init_images(tag.innerHTML); }
      catch(e) { return; }
      curr_set = tag.innerHTML;
      reset_highlight(set_iter);
      e.target.style["background-color"] = BTN_HGHLT;
      prom_images();
      await render_state();
    });
    set_iter.appendChild(tag);
  }

  let reset_btn = document.getElementById("resetbtn");
  reset_btn.addEventListener("click", () => {
    reset();
  });

  let change_btn = document.getElementById("changebtn");
  change_btn.addEventListener("click", () => {
    change_color();
    flip(true);
  });
}

async function ai_done(event) {
  //console.log(event.data);
  if (event.data[0]===INIT_MOVES) {
    [regular_moves, prom_moves] = parse_player_moves(event.data[1]);
    can_move = true;
    worker.terminate();
    set_worker();
    return;
  }
  let result = parse_response(event.data[1]);
  // format: status, evaluation, ai move, new state, num nodes computed, player moves
  evaluation = result[1].toFixed(2) * ((player===WHITE) ? -1 : 1);
  let time = ((Date.now() - ai_time) / 1000).toFixed(2);
  console.log("depth base: %d\n%f secs\neval: %f\nmove: %O\nleaf nodes:%i", 
              curr_depth, time, evaluation, result[2], result[4]);

  [board_state, white_checked, black_checked] = await parse_fen(result[3]);
  recent_from = result[2][0];
  recent_to = result[2][1];
  play_audio();
  await render_state();
  if (result[0] === STATUS_CM) {
    lose();
    game_over = true;
    return;
  }
  else if (result[0] === STATUS_SM) {
    draw();
    game_over = true;
    return;
  }
  regular_moves = result[5][0];
  prom_moves = result[5][1];
  worker.terminate();
  set_worker();
  can_move = true;
}
/**
 * @param {String} fen 
 */
function move_ai(fen) {
  can_move = false;
  ai_time = Date.now();
  worker.postMessage({TYPE: AI_SEARCH, DEPTH: curr_depth, FEN: fen, TIME: ai_time});
}
/**
 * @param {Move} move 
 */
function play_audio() {
  AUDIO["move"].play();
}
/**
 * @param {Move} move 
 */
async function conclude_move(move) {
  selected = -1
  moves_highlight = new Set();
  [board_state, white_checked, black_checked] = await parse_fen(move.FEN);
  await render_state();
  play_audio();
  if (move.STATUS !== STATUS_OG) {
    if (move.STATUS === STATUS_CM) {
      win();
    }
    else {
      draw();
    }
    game_over = true;
    return;
  }
  move_ai(move.FEN);
}
function bind_click() {
  c.addEventListener("mousedown", async function(e) {
    if (game_over || !can_move) return;
    let rect = c.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / width) | 0;
    let y = ((e.clientY - rect.top) / height) | 0;
    if (x > 7 || y > 7) return;
    [x, y] = (is_flipped) ? [7-x,7-y] : [x,y];
    let pos = linear(x, y);

    if (selected===-1 && board_state[pos].TYPE!==EMPTY && board_state[pos].COLOR===player) {
      selected = pos;
      if (regular_moves[pos]) {
        for (let mov of regular_moves[pos]) {
          moves_highlight.add(mov.TO);
        }
      }
      if (prom_moves[pos]) {
        for (let mov in prom_moves[pos]) {
          moves_highlight.add(parseInt(mov));
        }
      }
      if(moves_highlight.size<1) selected = -1;
    }
    else if (selected!==-1) {
      let move = null;
      if (regular_moves[selected]) {
        for (let mov of regular_moves[selected]) {
          if (mov.TO==pos) {
            move = {FEN: mov.FEN, STATUS: mov.STATUS};
            break;
          };
        }
      }
      if (move !== null) {
        conclude_move(move);
        return;
      }
      else if (prom_moves[selected] && prom_moves[selected][pos]) {

        for (let mov of prom_moves[selected][pos]) {
          promote_fens[mov.PIECE] = {FEN: mov.FEN, STATUS: mov.STATUS};
        }
        can_move = false;
        let proms = document.querySelector(".proms");
        proms.style.display = "block";
        proms.style.position = "absolute";
        proms.style.left = `${e.clientX}px`;
        proms.style.top = `${e.clientY}px`;
        return;
      }
      else {
        selected = -1
        moves_highlight = new Set();
      }
    }
    if (can_move) await render_state();
  });
}

async function parse_fen(string) {
  if (string==="") return [null,null,null];
  let str_split = string.split(' ');
  let board = [];
  for (let i = 0; i < str_split[0].length; i++) {
    let curr_char = str_split[0].toString().charAt(i);
    if (curr_char==="/") continue;
    if (!isNaN(parseInt(curr_char))) {
      for (let j = 0; j < parseInt(curr_char); j++) {
        board.push(new Piece(EMPTY, EMPTY));
      }
      continue;
    }
    let upper = curr_char.toUpperCase();
    let color = (upper===curr_char) ? WHITE : BLACK;
    board.push(new Piece(color, upper));
  }
  let black_checked = (str_split[1]===BLACK && str_split[4]==="y") ? true : false;
  let white_checked = (str_split[1]===WHITE && str_split[4]==="y") ? true : false;
  
  return [board, white_checked, black_checked];
}
function parse_player_moves(fens) {
  let player_moves = fens.split(";");
  /**
   * regular moves:
   * {(from #): [{TO: (to #), FEN: (fen #)}, {TO: (to #), FEN: (fen #)}, ...]}
   * 
   * prom moves:
   * {(from #): {TO: [{PIECE: (piece type), FEN: (fen#)}, {PIECE: (piece type), FEN: (fen#)}, ...]}}
   */
  let regular_list = {};
  let prom_list = {};
  for (let state of player_moves) {
    let splitty = state.split("?");
    splitty[0] = pos_conversion(parseInt(splitty[0]));
    splitty[1] = pos_conversion(parseInt(splitty[1]));
    if (splitty[2]==="0") {
      if (!regular_list[splitty[0]]) {
        regular_list[splitty[0]] = [];
      }
      regular_list[splitty[0]].push({TO: splitty[1], FEN: splitty[3], STATUS: splitty[4]});
    }
    else {
      if (!prom_list[splitty[0]]) {
        prom_list[splitty[0]] = {};
      }
      if (!prom_list[splitty[0]][splitty[1]]) {
        prom_list[splitty[0]][splitty[1]] = [];
      }
      prom_list[splitty[0]][splitty[1]].push({PIECE: splitty[2], FEN: splitty[3], STATUS: splitty[4]});
    }
  }
  return [regular_list,prom_list];
}
// format: status, evaluation, ai move, new state, num nodes computed, player moves
function parse_response(string) {
  let str_split = string.split(',');
  let state_eval = parseInt(str_split[1]);
  let ai_move = str_split[2].split("?");
  ai_move = [pos_conversion(parseInt(ai_move[0])), pos_conversion(parseInt(ai_move[1]))];
  let new_state = str_split[3];
  let nodes_traversed = parseInt(str_split[4]);

  let player_moves = parse_player_moves(str_split[5]);

  return [str_split[0],state_eval,ai_move,new_state,nodes_traversed,player_moves];
}
function pos_conversion(pos) {
  let x = (pos % SQUARES_W);
  let y = 7-((pos / SQUARES_H) | 0);
  return ((SQUARES_H*y)+x);
}
////////////////////////////////////////////////////////////////////
async function init() {
  c = document.createElement("canvas");
  let attrs = { 
    id: "chessBoard", 
    width: c_width, 
    height: c_height, 
    style: "border:.25em solid black; position:relative; top:2rem; left:15rem;"
  };
  for(let key in attrs) {
    c.setAttribute(key, attrs[key]);
  };
  c.onselectstart = function () { return false; }
  document.body.appendChild(c);
  ctx = c.getContext("2d");
  await init_images(curr_set);
  await init_audio();
  reset();
  bind_buttons();
  bind_click();
}

window.addEventListener("DOMContentLoaded", init());
////////////////////////////////////////////////////////////////////