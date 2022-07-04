const WHITE = "w";
const BLACK = "b";
const EMPTY = "-0";
const ROOK = "R";
const KNIGHT = "N";
const KING = "K";
const PAWN = "P";
const QUEEN = "Q";
const BISHOP = "B";
const DEFAULT_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - n";
const STATUS_CM = "cm"; // checkmate
const STATUS_SM = "sm"; // stalemate
const STATUS_OG = "og"; // ongoing
const C_HEIGHT = window.innerHeight / 1.1; // canvas height
const C_WIDTH = C_HEIGHT;  // canvas width
const NUM_HORIZONTALSQ = 8;
const NUM_VERTICALSQ = 8;
const SQ_WIDTH = C_WIDTH / NUM_HORIZONTALSQ;   // square width
const SQ_HEIGHT = C_HEIGHT / NUM_VERTICALSQ; // square height
const PROM_IMG_W = NUM_HORIZONTALSQ + 3;
const PROM_IMG_H = NUM_VERTICALSQ + 3;
const BTN_HGHLT = "#d4d422";
const CHECK_COLOR = "#CC0000";
const BORDER_COLOR = "black"; // square border
const SELECT_COLOR = "goldenrod";
const LSQ_COLOR = "#F0D9B5"; // square light
const DSQ_COLOR = "#B58863";   // square dark
const MOVE_HGHLT_COLOR = "#FFC90E"; // move highlight
const HOVER_SQ = "#99D9EA";
const HOVER_SQ_ATTACK = "#DE7C4A";
const SQ_FROM_COLOR = "#F4E9A4";
const SQ_TO_COLOR = "#F4E9A4";
const PIECE_SETS = ["alpha", "anarcandy", "cburnett", "chessnut", "kosal", "maestro", "merida"];
const IMAGES = {}; // piece images
const AUDIO = {};
const DEPTHS = 6;
const WORKER_PATH = "./scripts/worker.js";
const AI_SEARCH = "ai_search";
const INIT_MOVES = "init_moves";
const MTDF_ID = "Adaptive";
/**
* regular moves:
* {(from #): [{TO: (to #), FEN: (fen #)}, {TO: (to #), FEN: (fen #)}, ...]}
* 
* prom moves:
* {(from #): {TO: [{PIECE: (piece type), FEN: (fen#)}, {PIECE: (piece type), FEN: (fen#)}, ...]}}
*/
let regular_moves = null;
function get_regular_moves()
{
  return regular_moves;
}
function set_regular_moves(moves)
{
  regular_moves = moves;
}

let prom_moves = null;
function get_prom_moves()
{
  return prom_moves;
}
function set_prom_moves(moves)
{
  prom_moves = moves;
}

class Record
{
  constructor()
  {
    this.STATE = structuredClone(get_state());
    this.WHITE_CHECKED = get_checked(WHITE);
    this.BLACK_CHECKED = get_checked(BLACK);
    this.R_MOVES = structuredClone(get_regular_moves());
    this.P_MOVES = structuredClone(get_prom_moves());
    this.FROM = get_recent_from();
    this.TO = get_recent_to();
  }
}

let history = null;
function reset_history()
{
  history = [];
  history.push(null);
}
function add_to_history()
{
  history.push(new Record());
}
function undo()
{
  if (history[history.length - 1] === null) { return; }
  let time_machine = history.pop();
  set_selected(-1);
  set_state(time_machine.STATE);
  set_check(WHITE, time_machine.WHITE_CHECKED);
  set_check(BLACK, time_machine.BLACK_CHECKED);
  set_regular_moves(time_machine.R_MOVES);
  set_prom_moves(time_machine.P_MOVES);
  set_recent_fromto(time_machine.FROM, time_machine.TO);
  set_game_over(false);
  set_move_flag(true);
  render_state();
}

let promote_fens = { "Q": null, "B": null, "R": null, "N": null };
let c = null; // canvas element
let ctx = null; // canvas context
let evaluation = 0;
let ai_time = 0.0;


class Piece
{
  constructor(color, type)
  {
    this.COLOR = color;
    this.TYPE = type;
  }
}

let board_state = null;
function get_state()
{
  return board_state;
}
function set_state(state)
{
  board_state = state;
}
function get_piece_at(pos)
{
  return get_state()[pos].TYPE;
}
function get_color_at(pos)
{
  return get_state()[pos].COLOR;
}

let curr_set = "kosal";
function get_set()
{
  return curr_set;
}
function set_set(set)
{
  curr_set = set;
}

let player = WHITE;
function get_player()
{
  return player;
}
function set_player(color)
{
  player = color;
}
function change_color()
{
  set_player((get_player() === WHITE) ? BLACK : WHITE);
  prom_images();
  reset();
}


let recent_from = -1;
let recent_to = -1;
function get_recent_from()
{
  return recent_from;
}
function get_recent_to()
{
  return recent_to;
}
function set_recent_fromto(from, to)
{
  recent_from = from;
  recent_to = to;
}


let selected = -1;
function get_selected()
{
  return selected;
}
function set_selected(pos)
{
  if (moves_highlight.size < 1)
  {
    reset_move_highlight();
    selected = -1;
    return;
  }
  selected = pos;
}
function set_move_highlight(pos)
{
  if (get_regular_moves()[pos])
  {
    for (let mov of get_regular_moves()[pos])
    {
      moves_highlight.add(mov.TO);
    }
  }
  if (get_prom_moves()[pos])
  {
    for (let mov in get_prom_moves()[pos])
    {
      moves_highlight.add(parseInt(mov));
    }
  }
}

let curr_depth = 5;
function get_depth()
{
  return curr_depth;
}
function set_depth(value)
{
  curr_depth = value;
}

let worker = null
function set_worker()
{
  worker = new Worker(WORKER_PATH);
  worker.onmessage = worker_done;
}
function worker_done(event)
{
  if (event.data === "READY")
  {
    init_play();
    return;
  }
  if (event.data[0] === INIT_MOVES)
  {
    let [temp_regular_moves, temp_prom_moves] = parse_player_moves(event.data[1]);
    set_regular_moves(temp_regular_moves);
    set_prom_moves(temp_prom_moves);
    set_move_flag(true);
    return;
  }
  let result = parse_response(event.data[1]);
  // format: status, evaluation, ai move, new state, num nodes computed, get_player() moves
  evaluation = result[1].toFixed(2) * ((get_player() === WHITE) ? -1 : 1);
  let time = ((Date.now() - ai_time) / 1000).toFixed(2);
  console.log("depth base: %d\n%f secs\neval: %f\nmove: %O\n",
    get_depth(), time, evaluation, result[2]);

  let [state, white_checked, black_checked] = parse_fen(result[3]);
  set_state(state);
  set_check(WHITE, white_checked);
  set_check(BLACK, black_checked);
  set_recent_fromto(result[2][0], result[2][1]);
  play_audio();
  render_state();
  if (result[0] === STATUS_CM)
  {
    lose();
    set_game_over(true);
    return;
  }
  else if (result[0] === STATUS_SM)
  {
    draw();
    set_game_over(true);
    return;
  }
  set_regular_moves(result[4][0]);
  set_prom_moves(result[4][1]);
  // improves memory dealloc, slows down moves
  /* worker.terminate();
  set_worker(); */
  set_move_flag(true);
}
function init_play()
{
  if (get_player() === BLACK)
  {
    move_ai(DEFAULT_FEN);
  }
  else
  {
    worker.postMessage({ TYPE: INIT_MOVES, FEN: DEFAULT_FEN });
  }
  render_state();
}

let can_move_flag = true;
function can_move()
{
  return can_move_flag;
}
function set_move_flag(bool)
{
  can_move_flag = bool;
}

let checks = [false, false];
/**
 * @param {string} color  WHITE/BLACK
 * @returns 
 */
function get_checked(color)
{
  if (color === WHITE) return checks[0];
  else return checks[1];
}
function set_check(color, bool)
{
  if (color === WHITE) checks[0] = bool;
  else checks[1] = bool;
}

let is_flipped_flag = false;
function is_flipped()
{
  return is_flipped_flag;
}
/**
 * @param {boolean} change if called by change button, only flip to set player to bottom
 */
function flip(change = false)
{
  if (change && ((is_flipped_flag && get_player() === BLACK) || (!is_flipped_flag && get_player() === WHITE))) return;
  is_flipped_flag = !is_flipped_flag;
  if (can_move()) set_selected(-1);
  reset_move_highlight();
  render_state();
}

let moves_highlight = null;
function reset_move_highlight()
{
  moves_highlight = new Set();
}

let game_over_flag = false;
function set_game_over(bool)
{
  game_over_flag = bool;
}
function get_game_over()
{
  return game_over_flag;
}

function draw()
{
  alert("DRAW!");
}
function win()
{
  alert("YOU WIN!");
}
function lose()
{
  alert("YOU LOSE!");
}

/**
 * @param {number} x 
 * @param {number} y 
 * @returns 
 */
function linear(x, y)
{
  return (NUM_VERTICALSQ * y) + x;
}
/**
 * @param {number} i 
 * @returns x, y converted from i
 */
function nonlinear(i)
{
  let x = i % NUM_HORIZONTALSQ;
  let y = (i / NUM_VERTICALSQ) | 0;
  return [x, y];
}
/**
 * Rust code counts squares 0-63 starting at a1, javascript code counts from top left corner (a8)
 * @param {number} pos 
 * @returns number
 */
function pos_conversion(pos)
{
  let x = pos % NUM_HORIZONTALSQ;
  let y = NUM_VERTICALSQ - 1 - ((pos / NUM_VERTICALSQ) | 0);
  return (NUM_VERTICALSQ * y) + x;
}

function render_board(mouse_x, mouse_y)
{
  mouse_x = (mouse_x / SQ_WIDTH) | 0;
  mouse_y = (mouse_y / SQ_HEIGHT) | 0;
  [mouse_x, mouse_y] = (is_flipped()) ? [7 - mouse_x, 7 - mouse_y] : [mouse_x, mouse_y];
  let hover_pos = (mouse_x > 7 || mouse_y > 7) ? -1 : linear(mouse_x, mouse_y);
  for (let i = 0; i < NUM_HORIZONTALSQ; i++)
  {
    for (let j = 0; j < NUM_VERTICALSQ; j++)
    {
      let [x, y] = (is_flipped()) ? [NUM_HORIZONTALSQ - 1 - i, NUM_VERTICALSQ - 1 - j] : [i, j];
      let pos = linear(x, y);
      ctx.fillStyle = BORDER_COLOR;
      ctx.fillRect(i * SQ_WIDTH, j * SQ_HEIGHT, SQ_WIDTH, SQ_HEIGHT);
      ctx.fillStyle = (j % 2 === i % 2) ? LSQ_COLOR : DSQ_COLOR;
      if (get_selected() === pos) ctx.fillStyle = SELECT_COLOR;
      else if (moves_highlight.has(pos))
      {
        if (pos === hover_pos)
        {
          ctx.fillStyle = (get_piece_at(pos) !== EMPTY) ? HOVER_SQ_ATTACK : HOVER_SQ;
        }
        else
        {
          ctx.fillStyle = MOVE_HGHLT_COLOR;
        }
      }
      else if ((get_piece_at(pos) === KING && get_color_at(pos) === WHITE && get_checked(WHITE))
        || (get_piece_at(pos) === KING && get_color_at(pos) === BLACK && get_checked(BLACK)))
        ctx.fillStyle = CHECK_COLOR;
      else if (pos === get_recent_from())
        ctx.fillStyle = SQ_FROM_COLOR;
      else if (pos === get_recent_to())
        ctx.fillStyle = SQ_TO_COLOR;
      ctx.fillRect(i * SQ_WIDTH, j * SQ_HEIGHT, SQ_WIDTH - 1, SQ_HEIGHT - 1);
    }
  }
}
/**
 * @param {number} mask pos to be made invisible and rendered at mouse location 
 * @param {number} mouse_x
 * @param {number} mouse_y
 */
function render_state(mask = -1, mouse_x = -1, mouse_y = -1)
{
  render_board(mouse_x, mouse_y);
  for (let i = 0; i < NUM_VERTICALSQ * NUM_HORIZONTALSQ; i++)
  {
    if (get_piece_at(i) === EMPTY || mask === i) { continue; };
    let [x, y] = nonlinear(i);
    [x, y] = (is_flipped()) ? [NUM_HORIZONTALSQ - 1 - x, NUM_VERTICALSQ - 1 - y] : [x, y];
    let str = get_color_at(i) + "" + get_piece_at(i);
    let img = IMAGES[str];
    ctx.drawImage(img, (x * SQ_WIDTH) + (SQ_WIDTH / (NUM_HORIZONTALSQ * 2)), (y * SQ_HEIGHT) + (SQ_HEIGHT / (NUM_VERTICALSQ * 2)), C_WIDTH / (NUM_HORIZONTALSQ + 1), C_HEIGHT / (NUM_VERTICALSQ + 1));
  }
  if (mask !== -1)
  {
    let str = get_color_at(mask) + "" + get_piece_at(mask);
    let img = IMAGES[str];
    ctx.drawImage(img, mouse_x - 50, mouse_y - 50, C_WIDTH / (NUM_HORIZONTALSQ + 1), C_HEIGHT / (NUM_VERTICALSQ + 1));

  }
}

function load_image(key, url)
{
  return new Promise((resolve, reject) =>
  {
    let i = new Image();
    IMAGES[key] = i;
    i.addEventListener('load', () => resolve(i));
    i.addEventListener('error', (err) => reject(err));
    i.src = url;
  });
}
// has to go off get_set() as input and not get_set() directly because bind_buttons needs to pass its input
async function init_images(set)
{
  let jar = [];
  jar.push(load_image(BLACK + ROOK, `./assets/pieces/${set}/bR.svg`));
  jar.push(load_image(BLACK + KNIGHT, `./assets/pieces/${set}/bN.svg`));
  jar.push(load_image(BLACK + KING, `./assets/pieces/${set}/bK.svg`));
  jar.push(load_image(BLACK + PAWN, `./assets/pieces/${set}/bP.svg`));
  jar.push(load_image(BLACK + QUEEN, `./assets/pieces/${set}/bQ.svg`));
  jar.push(load_image(BLACK + BISHOP, `./assets/pieces/${set}/bB.svg`));
  jar.push(load_image(WHITE + ROOK, `./assets/pieces/${set}/wR.svg`));
  jar.push(load_image(WHITE + KNIGHT, `./assets/pieces/${set}/wN.svg`));
  jar.push(load_image(WHITE + KING, `./assets/pieces/${set}/wK.svg`));
  jar.push(load_image(WHITE + PAWN, `./assets/pieces/${set}/wP.svg`));
  jar.push(load_image(WHITE + QUEEN, `./assets/pieces/${set}/wQ.svg`));
  jar.push(load_image(WHITE + BISHOP, `./assets/pieces/${set}/wB.svg`));
  await Promise.all(jar);
}

function init_audio()
{
  AUDIO["move"] = new Audio("./assets/sound/move.wav");
}

function reset()
{
  if (worker !== null) worker.terminate();
  reset_history();
  hide_prom();
  let [state, white_checked, black_checked] = parse_fen(DEFAULT_FEN);
  set_state(state);
  set_check(WHITE, white_checked);
  set_check(BLACK, black_checked);
  reset_move_highlight();
  set_recent_fromto(-1, -1);
  set_selected(-1);
  set_move_flag(false);
  set_game_over(false);
  set_worker();
}

function reset_dropdown_highlight(iter)
{
  for (let opt of iter.children)
  {
    opt.style["background-color"] = "";
  }
}
function prom_images()
{
  for (let prom of document.getElementById("drop-prom").children)
  {
    prom.innerHTML = `<img src="./assets/pieces/${get_set()}/${get_player()}${prom.id}.svg" width="${C_WIDTH / PROM_IMG_W}" height="${C_HEIGHT / PROM_IMG_H}"/>`;
  }
}
function hide_prom()
{
  document.querySelector(".proms").style.display = "none";
}
function bind_buttons()
{

  let ai_iter = document.getElementById("drop-ai");
  for (let i = 0; i <= DEPTHS; i++)
  {
    let tag = document.createElement("a");
    tag.innerHTML = (i > 0) ? "Depth " + i : MTDF_ID;
    if (tag.innerHTML === "Depth " + get_depth()) tag.style["background-color"] = BTN_HGHLT;
    tag.addEventListener("click", (e) =>
    {
      if (tag.innerHTML === "Depth " + get_depth() || (tag.innerHTML === MTDF_ID && get_depth == 0)) { return; }
      reset_dropdown_highlight(ai_iter);
      e.target.style["background-color"] = BTN_HGHLT;
      set_depth(i);
    });
    ai_iter.appendChild(tag);
  }
  let flip_btn = document.getElementById("flipbtn");
  flip_btn.addEventListener("click", () =>
  {
    flip();
  });

  let prom_iter = document.getElementById("drop-prom");
  for (const piece in promote_fens)
  {
    let tag = document.createElement("a");
    tag.id = piece
    tag.addEventListener("click", () =>
    {
      conclude_move(promote_fens[piece]);
      hide_prom();
    });
    prom_iter.appendChild(tag);
  }
  prom_images();
  let set_iter = document.getElementById("drop-sets");
  for (const set of PIECE_SETS)
  {
    let tag = document.createElement("a");
    tag.innerHTML = set;
    if (tag.innerHTML === get_set()) tag.style["background-color"] = BTN_HGHLT;
    tag.addEventListener("click", async function (e)
    {
      if (tag.innerHTML === get_set()) { return; }
      try { await init_images(tag.innerHTML); }
      catch (e) { return; }
      set_set(tag.innerHTML);
      reset_dropdown_highlight(set_iter);
      e.target.style["background-color"] = BTN_HGHLT;
      prom_images();
      render_state();
    });
    set_iter.appendChild(tag);
  }

  let reset_btn = document.getElementById("resetbtn");
  reset_btn.addEventListener("click", () =>
  {
    reset();
  });
  let undobtn_btn = document.getElementById("undobtn");
  undobtn_btn.addEventListener("click", () =>
  {
    if (!can_move() && !get_game_over()) { return; }
    undo();
  });
  let change_btn = document.getElementById("changebtn");
  change_btn.addEventListener("click", () =>
  {
    change_color();
    flip(true);
  });
}

/**
 * @param {string} fen 
 */
function move_ai(fen)
{
  set_move_flag(false);
  ai_time = Date.now();
  worker.postMessage({ TYPE: AI_SEARCH, DEPTH: get_depth(), FEN: fen });
}

function play_audio()
{
  AUDIO["move"].play();
}

/**
 * @param {JSON} move {FEN: fen, STATUS: ongoing/chechmate/stalemate} 
 */
function conclude_move(move)
{
  set_selected(-1);
  reset_move_highlight();
  add_to_history();
  let [state, white_checked, black_checked] = parse_fen(move.FEN);
  set_state(state);
  set_check(WHITE, white_checked);
  set_check(BLACK, black_checked);
  render_state();
  play_audio();
  if (move.STATUS !== STATUS_OG)
  {
    if (move.STATUS === STATUS_CM)
    {
      win();
    }
    else
    {
      draw();
    }
    set_game_over(true);
    return;
  }
  move_ai(move.FEN);
}

// https://stackoverflow.com/a/59741870
// fucking nightmare
function bind_click()
{
  const delta = 6;
  let rect = c.getBoundingClientRect();
  let mouse_x;
  let mouse_y;
  onmousemove = function (e) { mouse_x = e.clientX; mouse_y = e.clientY; }
  let start_x;
  let start_y;
  let mask;
  let animation_id = null;
  let initial_select;
  window.addEventListener('mouseup', function (e)
  {
    if (animation_id)
    {
      cancelAnimationFrame(animation_id);
      animation_id = null;
    }
    up_x = e.clientX;
    up_y = e.clientY;
    if (up_x < rect.left || up_x > rect.right || up_y < rect.top || up_y > rect.bottom)
    {
      set_selected(-1);
      reset_move_highlight();
    }
    render_state();
  })
  c.addEventListener("mousedown", function (e)
  {
    if (get_game_over() || !can_move()) return;
    rect = c.getBoundingClientRect();
    start_x = e.clientX;
    start_y = e.clientY;
    mask = board_pos(start_x, start_y);
    if (get_selected() === -1 || get_color_at(mask) === get_player())
    {
      if (get_color_at(mask) === EMPTY) return;
      initial_select = true;
    }
    else
    {
      initial_select = false;
      if (get_color_at(mask) !== get_player())
      {
        return;
      }
    }
    function animate_drag()
    {
      render_state(mask, (mouse_x - rect.left), (mouse_y - rect.top));
      animation_id = requestAnimationFrame(animate_drag);
    }
    reset_move_highlight();
    set_move_highlight(mask);
    set_selected(mask);
    animate_drag();
  });
  c.addEventListener('mouseup', function (e)
  {
    if (get_game_over() || !can_move()) return;
    const end_x = e.clientX;
    const end_y = e.clientY;
    const diffX = Math.abs(end_x - start_x);
    const diffY = Math.abs(end_y - start_y);

    if (diffX < delta && diffY < delta)
    {
      if (initial_select)
      {
        return;
      }
      click(start_x, start_y, get_selected());
      if (can_move()) render_state();
    }
    else
    {
      click(end_x, end_y, get_selected());
      if (can_move()) render_state();
    }
  });
  function board_pos(input_x, input_y)
  {
    let x = ((input_x - rect.left) / SQ_WIDTH) | 0;
    let y = ((input_y - rect.top) / SQ_HEIGHT) | 0;
    if (x > 7 || y > 7) return;
    [x, y] = (is_flipped()) ? [7 - x, 7 - y] : [x, y];
    return linear(x, y);
  }
  function click(input_x, input_y, from)
  {
    let pos = board_pos(input_x, input_y);

    let move = null;
    if (get_regular_moves()[from])
    {
      for (let mov of get_regular_moves()[from])
      {
        if (mov.TO == pos)
        {
          move = { FEN: mov.FEN, STATUS: mov.STATUS };
          break;
        };
      }
    }
    if (move !== null)
    {
      conclude_move(move);
      return;
    }
    else if (get_prom_moves()[from] && get_prom_moves()[from][pos])
    {
      for (let mov of get_prom_moves()[from][pos])
      {
        promote_fens[mov.PIECE] = { FEN: mov.FEN, STATUS: mov.STATUS };
      }
      set_move_flag(false);
      let proms = document.querySelector(".proms");
      proms.style.display = "block";
      proms.style.position = "absolute";
      proms.style.left = `${mouse_x}px`;
      proms.style.top = `${mouse_y}px`;
      return;
    }
    else
    {
      set_selected(-1);
      reset_move_highlight();
    }
  }
}

/**
 * @param {string} fen fen 
 * @returns state / white checked? / black checked?
 */
function parse_fen(fen)
{

  if (fen === "") return [null, null, null];
  let split_fen = fen.split(' ');
  let state = [];
  for (let i = 0; i < split_fen[0].length; i++)
  {
    let curr_char = split_fen[0].charAt(i);
    if (curr_char === "/") continue;
    if (!isNaN(parseInt(curr_char)))
    {
      for (let j = 0; j < parseInt(curr_char); j++)
      {
        state.push(new Piece(EMPTY, EMPTY));
      }
      continue;
    }
    let upper = curr_char.toUpperCase();
    let color = (upper === curr_char) ? WHITE : BLACK;
    state.push(new Piece(color, upper));
  }
  let black_checked = (split_fen[1] === BLACK && split_fen[6] === "y") ? true : false;
  let white_checked = (split_fen[1] === WHITE && split_fen[6] === "y") ? true : false;

  return [state, white_checked, black_checked];
}

/**
 * @param {string} fens fens separated by ';'
 * @returns JSON of regular fens / JSON of prom fens
 */
function parse_player_moves(fens)
{

  let player_moves = fens.split(";");
  let regular_list = {};
  let prom_list = {};

  for (let state of player_moves)
  {
    let splitty = state.split("?");
    splitty[0] = pos_conversion(parseInt(splitty[0]));
    splitty[1] = pos_conversion(parseInt(splitty[1]));
    if (splitty[2] === "0")
    {
      if (!regular_list[splitty[0]])
      {
        regular_list[splitty[0]] = [];
      }
      regular_list[splitty[0]].push({ TO: splitty[1], FEN: splitty[3], STATUS: splitty[4] });
    }
    else
    {
      if (!prom_list[splitty[0]])
      {
        prom_list[splitty[0]] = {};
      }
      if (!prom_list[splitty[0]][splitty[1]])
      {
        prom_list[splitty[0]][splitty[1]] = [];
      }
      prom_list[splitty[0]][splitty[1]].push({ PIECE: splitty[2], FEN: splitty[3], STATUS: splitty[4] });
    }
  }
  return [regular_list, prom_list];
}

/**
 * @param {string} response response from worker, separated by ","
 * @returns status, evaluation, ai move, new state, num nodes computed, player moves
 */
function parse_response(response)
{
  let str_split = response.split(',');
  let state_eval = parseInt(str_split[1]);
  let ai_move = str_split[2].split("?");
  ai_move = [pos_conversion(parseInt(ai_move[0])), pos_conversion(parseInt(ai_move[1]))];
  let new_state = str_split[3];

  let player_moves = parse_player_moves(str_split[4]);

  return [str_split[0], state_eval, ai_move, new_state, player_moves];
}

////////////////////////////////////////////////////////////////////
async function init()
{
  c = document.createElement("canvas");
  let attrs = {
    id: "chessBoard",
    width: C_WIDTH,
    height: C_HEIGHT,
    style: "border:.25em solid black; position:relative; top:2rem; left:15rem;"
  };
  for (let key in attrs)
  {
    c.setAttribute(key, attrs[key]);
  };
  c.onselectstart = function () { return false; }
  document.body.appendChild(c);
  ctx = c.getContext("2d", { alpha: false });
  await init_images(get_set());
  init_audio();
  reset();
  bind_buttons();
  bind_click();
}

window.addEventListener("DOMContentLoaded", init());
////////////////////////////////////////////////////////////////////