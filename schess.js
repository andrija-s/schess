const c = document.getElementById("chessBoard");
const ctx = c.getContext("2d");
const w_squares = 8;
const h_squares = 8;
const width = c.width/w_squares;
const height = c.height/h_squares;

function loadImage(url) {
  return new Promise(r => { let i = new Image(); i.onload = (() => r(i)); i.src = url; });
}
let state = {"00": "rb", "01": "nb", "02": "bb","03": "kb","04": "qb", "05": "bb", "06": "nb", "07": "rb",
                 "10": "pw", "11": "pw", "12": "pw","13": "pw","14": "pw", "15": "pw", "16": "pw", "17": "pw",
                 "20": "e", "21": "e", "22": "e","23": "e","24": "e", "25": "e", "26": "e", "27": "e",
                 "30": "e", "31": "e", "32": "e","33": "e","34": "e", "35": "e", "36": "e", "37": "e",
                 "40": "e", "41": "e", "42": "e","43": "e","44": "e", "45": "e", "46": "e", "47": "e",
                 "50": "e", "51": "e", "52": "e","53": "e","54": "e", "55": "e", "56": "e", "57": "e",
                 "60": "pw", "61": "pw", "62": "pw","63": "pw","64": "pw", "65": "pw", "66": "pw", "67": "pw",
                 "70": "rw", "71": "nw", "72": "bw","73": "kw","74": "qw", "75": "bw", "76": "nw", "77": "rw",};
let selected = "";
const selected_color = "gray";
const piece_color = "black";
const sq_lcolor = "#ff7a39";
const sq_dcolor = "green";

function has_move(position, board) {
  if (board[position] !== "e") {
    return true;
  }
  else {
    return false;
  }
}
function legal_move(from, to, board) {
  return true;
}
function render_board() {
  for (let i = 0; i < w_squares; i++) {
    for (let j = 0; j < h_squares; j++) {
      ctx.fillStyle = (j % 2 === i % 2) ? sq_lcolor : sq_dcolor;
      let pos = j.toString() + i.toString();
      if (selected === pos) ctx.fillStyle = selected_color;
      ctx.fillRect(i*width,j*height,width,height);
    }
  }
}
async function render_square(square) {
  let x = parseInt(square.charAt(1));
  let y = parseInt(square.charAt(0));
  ctx.fillStyle = (square === selected) ? selected_color : ((x % 2 === y % 2) ? sq_lcolor : sq_dcolor);
  ctx.fillRect(x*width,y*height,width,height);
  if (state[square] !== "e") {
    let img = await loadImage(`./assets/${state[square]}.png`);
    ctx.drawImage(img, (x*width)+(width/8), (y*height)+(width/8), 50, 50);
  }
}
async function render_state(board) {
  render_board();
  for (const square in board) {
    if (board[square] === 'e') {
      continue;
    };
    let x = parseInt(square.charAt(1));
    let y = parseInt(square.charAt(0));
    let img = await loadImage(`./assets/${board[square]}.png`);
    ctx.drawImage(img, (x*width)+(width/8), (y*height)+(width/8), 50, 50);
  }
}
function bind_clicks() {
  c.addEventListener("mousedown", async function(e) {
    let rect = c.getBoundingClientRect();
    let x = parseInt((e.clientX - rect.left) / (c.width / w_squares));
    let y = parseInt((e.clientY - rect.top) / (c.height / h_squares));
    let position = y.toString();
    position = position + x.toString();
    if (selected === "" && has_move(position, state)) {
      selected = position;
      render_square(selected);
    }
    else if (selected !== "") {
      if (legal_move(selected, position, state)) {
        state[position] = state[selected];
        state[selected] = "e";
        render_square(position);
      }
      let prev = selected;
      selected = "";
      render_square(prev);
    }
    //render_state(positions);
  });
}
function init() {
  render_board();
  render_state(state);
  bind_clicks();
}
init();
