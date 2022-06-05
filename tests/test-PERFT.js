import {Game} from "../scripts/game.js";

function PERFT(state, depth) {
  let legal_moves = state.allMoves();
  if (depth===1) {
    return legal_moves.length;
  }
  let temp_state;
  let sum=0;
  for (let mov of legal_moves) {
    //temp_state = state.copy();
    state.move(mov);
    sum += PERFT(state, depth-1);
    state.unmove();
  }
  return sum;
}
function test(board, expected, depth) {
  let test_state = new Game(board);
  console.log(board+"\ndepth: "+depth);
  let time = Date.now();
  let nodes;
  nodes = PERFT(test_state, depth);
  time = ((Date.now() - time) / 1000).toFixed(2);
  let result = (expected===nodes) ? "\u2705 " : "\u274c ";
  console.log("time: " + time + " sec\n" + "expected: " + expected + " result: " + nodes + " " +result +"\n");
  return( expected===nodes)
}
let DEPTH = 3;
if (process.argv.length > 2 && Number.isInteger(Number(process.argv[2])) 
    && parseInt(process.argv[2]) < 5) {
  DEPTH = parseInt(process.argv[2]);
}
const POSITIONS = [ 
      { FEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", 
        NODES: [1, 20, 400, 8902, 197281] },
      { FEN: "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - -", 
        NODES: [0, 14, 191, 2812, 43238] },
      { FEN: "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -", 
        NODES: [0, 48, 2039, 97862, 4085603] },
      { FEN: "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1", 
        NODES: [0, 6, 264, 9467, 422333] },
      { FEN: "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8",
        NODES: [0, 44, 1486, 62379, 2_103_487] },
      { FEN: "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10",
        NODES: [1, 46, 2079, 89890, 3_894_594] },
];

console.log("\n-- PERFT TESTS --\n")
let count = 0;
for (let pos of POSITIONS) {
  let temp = test(pos.FEN, pos.NODES[DEPTH], DEPTH);
  count += (temp) ? 1 : 0;
}


console.log(`${(count === POSITIONS.length ? "\u2705" : "\u274c")} ${count}/${POSITIONS.length} PERFT tests passed\n`);
if (count !== POSITIONS.length) process.exit(1);


