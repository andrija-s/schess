import { Game,
         Q_PROM,R_PROM,B_PROM,K_PROM,ONPEASANT,
         WHITE,BLACK,EMPTY,
         SQUARES_W, SQUARES_H } from "./scripts/game.js";


const c_width = 700;  // canvas width
const c_height = 700; // canvas height
const width = c_width/SQUARES_W;   // square width
const height = c_height/SQUARES_H; // square height
const btn_highl = "#bb7836";
const check_color = "blue";
const border_color = "black"; // square border
const selected_color = "yellow";
const sq_lcolor = "#ff7a39"; // square light
const sq_dcolor = "green";   // square dark
const highlight_color = "navajowhite"; // move highlight
const sq_from ="teal";
const sq_to ="aqua";
const piece_sets = ["alpha", "anarcandy", "cburnett", "chessnut", "kosal", "maestro", "merida"];
const images = {}; // piece images
const audio = {};


let worker = null
let curr_set = "anarcandy";
let main_state = null;
let player = WHITE;
let moves_highlight = [];
let recent_from = -1;
let recent_to = -1;
let selected = -1;
let is_black_checked = false;
let is_white_checked = false;
let is_flipped = false;
let c = null; // canvas element
let ctx = null; // canvas context
let evaluation = 0.0;
let can_move = true;

let ai_level = 2;
const ai_vals = [ 
  { string: "Level Zero",  value :  2 },
  { string: "Level One",   value :  8 },
  { string: "Level Two",   value : 10 },
  { string: "Level Three", value : 12 } 
];
let num_levels = ai_vals.length;

let promote_piece = Q_PROM;
const promotes = { 
  "Queen":  Q_PROM,
  "Rook":   R_PROM,
  "Knight": K_PROM,
  "Bishop": B_PROM 
};

function curr_depth() {
  return ai_vals[ai_level].value;
}
function string_level(index=ai_level) {
  return ai_vals[index].string;
}
// yet to be used
function promote(input) {
  promote_piece = input;
}
// yet to be used
function pick_color(input) {
  return;
}

function selected_move(moves, pos) {
  for (let mov of moves) {
    if (mov.TO === pos) {
      return mov;
    }
  }
  return null;
}

function render_board() {
  for (let i = 0; i < SQUARES_W; i++) {
    for (let j = 0; j < SQUARES_H; j++) {
      let [x,y] = (is_flipped) ? [7-i,7-j] : [i,j]; 
      let pos = Game.linear(x,y);
      ctx.fillStyle =  border_color;
      ctx.fillRect(i*width,j*height,width,height);
      ctx.fillStyle = ((pos===main_state.wk_pos && is_white_checked) 
                      || (pos===main_state.bk_pos && is_black_checked)) 
                      ? check_color : 
                        ((j % 2 === i % 2) ? sq_lcolor : sq_dcolor);
      if (selected === pos) ctx.fillStyle = selected_color;
      else if (selected_move(moves_highlight, pos) !== null) ctx.fillStyle = highlight_color;
      else if (pos === recent_from) ctx.fillStyle = sq_from;
      else if (pos === recent_to) ctx.fillStyle = sq_to;
      ctx.fillRect(i*width,j*height,width-1,height-1);
    }
  }
}

function render_state() {
  render_board();
  for (let i=0; i<SQUARES_H*SQUARES_W; i++) {
    if (main_state.get_type(i)===EMPTY) {
      continue;
    };
    let [x, y] = Game.nonlinear(i);
    [x, y] = (is_flipped) ? [7-x,7-y] : [x,y];
    let str = main_state.get_color(i) + "" + main_state.get_type(i);
    let img = images[str];
    ctx.drawImage(img, (x*width)+(width/(SQUARES_W+SQUARES_W)), (y*height)+(height/(SQUARES_H+SQUARES_H)), c.width/(SQUARES_W+1), c.height/(SQUARES_H+1));
  }
}

function flip(change=false) {
  if (change && ((is_flipped && player===BLACK) || (!is_flipped && player===WHITE))) return;
  is_flipped = !is_flipped;
  selected = -1;
  moves_highlight = [];
  render_state();
}

function load_image(url) {
  return new Promise(r => { let i = new Image(); i.onload = (() => r(i)); i.src = url; });
}

async function init_images() {
  images["11"] = await load_image(`./assets/pieces/${curr_set}/bR.svg`);
  images["12"] = await load_image(`./assets/pieces/${curr_set}/bN.svg`);
  images["13"] = await load_image(`./assets/pieces/${curr_set}/bK.svg`);
  images["14"] = await load_image(`./assets/pieces/${curr_set}/bP.svg`);
  images["15"] = await load_image(`./assets/pieces/${curr_set}/bQ.svg`);
  images["16"] = await load_image(`./assets/pieces/${curr_set}/bB.svg`);
  images["01"] = await load_image(`./assets/pieces/${curr_set}/wR.svg`);
  images["02"] = await load_image(`./assets/pieces/${curr_set}/wN.svg`);
  images["03"] = await load_image(`./assets/pieces/${curr_set}/wK.svg`);
  images["04"] = await load_image(`./assets/pieces/${curr_set}/wP.svg`);
  images["05"] = await load_image(`./assets/pieces/${curr_set}/wQ.svg`);
  images["06"] = await load_image(`./assets/pieces/${curr_set}/wB.svg`);
}

async function init_audio() {
  audio["move"] = new Audio("./assets/sound/move.wav")
}

function reset_highlight(iter) {
  for (let opt of iter.children) {
        opt.style["background-color"] = "";
  }
}
function set_worker() {
  worker = new Worker("./scripts/ai.js", { type: "module" });
  worker.onmessage = ai_done;
}
function reset() {
  if (!can_move) {
    worker.terminate();
    set_worker();
  }
  main_state = new Game();
  moves_highlight = [];
  recent_from = -1;
  recent_to = -1;
  selected = -1;
  is_black_checked = false;
  is_white_checked = false;
  can_move = true;
  if (player===BLACK) {
    move_ai(WHITE);
  }
  render_state();
}

function change_color() {
  player = (player===WHITE) ? BLACK : WHITE;
  reset();
}

function bind_buttons() {

  let set_iter = document.getElementById("drop-sets");
  for (const set of piece_sets) {
    let tag = document.createElement("a");
    tag.innerHTML = set;
    if (tag.innerHTML===curr_set) tag.style["background-color"] = btn_highl;
    tag.addEventListener("click", async function(e) {
      if (tag.innerHTML===curr_set) { return; }
      reset_highlight(set_iter);
      e.target.style["background-color"] = btn_highl;
      curr_set = tag.innerHTML;
      await init_images();
      render_state();
    });
    set_iter.appendChild(tag);
  }

  let ai_iter = document.getElementById("drop-ai");
  for (let i=0; i<num_levels; i++) {
    let tag = document.createElement("a");
    tag.innerHTML = string_level(i);
    if (tag.innerHTML===string_level()) tag.style["background-color"] = btn_highl;
    tag.addEventListener("click", (e) => {
      if (tag.innerHTML===string_level()) { return; }
      reset_highlight(ai_iter);
      e.target.style["background-color"] = btn_highl;
      ai_level = i;
    });
    ai_iter.appendChild(tag);
  }

  let flip_btn = document.getElementById("flipbtn");
  flip_btn.addEventListener("click", () => {
    flip();
  });

  let prom_iter = document.getElementById("drop-prom");
  for (const piece in promotes) {
    let tag = document.createElement("a");
    tag.innerHTML = piece;
    if (promotes[piece]==promote_piece) tag.style["background-color"] = btn_highl;
    tag.addEventListener("click", (e) => {
      if (promotes[tag.innerHTML]==promote_piece) { return; }
      reset_highlight(prom_iter);
      e.target.style["background-color"] = btn_highl;
      promote_piece = promotes[tag.innerHTML];
    });
    prom_iter.appendChild(tag);
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


function set_check() {
  is_white_checked = main_state.under_attack(WHITE, main_state.wk_pos);
  is_black_checked = main_state.under_attack(BLACK, main_state.bk_pos);
}

function ai_done(event) {
  let ai_move = event.data;
  evaluation = ai_move[0].toFixed(2) * ((player===WHITE) ? -1 : 1);
  let time = ((Date.now() - ai_time) / 1000).toFixed(2);
  console.log("depth base: %d\n%f secs\neval: %f\nmove: %O\nleaf nodes:%i", 
              curr_depth()/2, time, evaluation, ai_move[1], ai_move[2]);

  if (ai_move[1] !== null) {
    main_state.move(ai_move[1]);
    recent_from = ai_move[1].FROM;
    recent_to = ai_move[1].TO;
    if (ai_move[0]==Number.POSITIVE_INFINITY && main_state.all_moves(true).length===0) {
      alert("YOU LOSE!");
      main_state.game_over = true;
    }
  }
  else {
    recent_from = -1;
    recent_to = -1;
    if (ai_move[0]===0) alert("DRAW!");
    else if (ai_move[0]<0) alert("YOU WIN!");
    main_state.game_over = true;
  }
  if (!main_state.game_over) {
    can_move = true;
  }
  set_check();
  render_state();
}

let ai_time = 0.0;
function move_ai(color) {
  can_move = false;
  ai_time = Date.now();
  worker.postMessage(
   { 
    depth: curr_depth(),
    state: main_state,
    color: color }
  );
}

function bind_click() {
  c.addEventListener("mousedown", function(e) {
    if (main_state.game_over || !can_move) return;
    let rect = c.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / width) | 0;
    let y = ((e.clientY - rect.top) / height) | 0;
    if (x > 7 || y > 7) return;
    [x, y] = (is_flipped) ? [7-x,7-y] : [x,y];
    let pos = Game.linear(x, y);
    if (selected===-1 && main_state.get_type(pos)!==EMPTY && main_state.get_color(pos)===player) {
      selected = pos;
      moves_highlight = main_state.moves_from(pos);
      if(moves_highlight.length<1) selected = -1;
    }
    else if (selected!==-1) {
      let mov = selected_move(moves_highlight, pos);
      if (mov !== null) {
        let ai_color = (player===WHITE) ? BLACK : WHITE;
        if (mov.SPECIAL>=Q_PROM && mov.SPECIAL<=R_PROM) {
          mov.SPECIAL = promote_piece;
        }
        if (main_state.get_type(mov.TO)!==EMPTY || mov.SPECIAL===ONPEASANT) {
          audio["move"].play();
        }
        else {
          audio["move"].play();
        }
        main_state.move(mov);
        moves_highlight = [];
        selected = -1
        set_check();
        render_state();
        move_ai(ai_color);
      }
      selected = -1;
      moves_highlight = [];
    }
    if (can_move) render_state();
  });
}
////////////////////////////////////////////////////////////////////
async function init() {
  c = document.createElement("canvas");
  let attrs = { 
                id: "chessBoard", 
                width: c_width, 
                height: c_height, 
                style: "border:2px solid #913c3c; position:fixed; top:60px; left:250px;"
              };
  for(let key in attrs) {
    c.setAttribute(key, attrs[key]);
  };
  c.onselectstart = function () { return false; }
  document.body.appendChild(c);
  ctx = c.getContext("2d");
  set_worker();
  await init_images();
  await init_audio();
  reset();
  bind_buttons();
  bind_click();
}

window.addEventListener("DOMContentLoaded", init());
////////////////////////////////////////////////////////////////////