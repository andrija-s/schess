import {chess_state} from "../scripts/chess_class.js";
import { strict as assert } from 'node:assert';
function PERFT(state, depth) {
  let legal_moves = state.allMoves();
  if (depth===1) {
    return legal_moves.length;
  }
  let temp_state;
  let sum=0;
  for (let mov of legal_moves) {
    temp_state = state.copy();
    temp_state.move(mov);
    sum += PERFT(temp_state, depth-1);
  }
  return sum;
}
function test(board, expected, depth) {
  let test_state = new chess_state(board);
  let time = Date.now();
  let nodes = PERFT(test_state, depth);
  time = ((Date.now() - time) / 1000).toFixed(2);
  let result = (expected===nodes) ? "\u2713\n" : "!!!\n";
  console.log(result + "expected: " + expected + " result: " + nodes + " \n" + "depth: " +depth+"\n"+ "time: " + time + " sec\n" + board + "\n");
  assert.deepEqual(nodes, expected);
}
let DEPTH = 3;
if (process.argv.length > 2 && Number.isInteger(Number(process.argv[2]))) {
  DEPTH = parseInt(process.argv[2]);
}
const POS2 = [0, 48, 2039, 97862, 4085603];
const POS3 = [0, 14, 191, 2812, 43238];
const POS4 = [0, 6, 264, 9467, 422333];
const POS5 = [0, 44, 1486, 62379, 2_103_487];
console.log("-- PERFT TESTS --\n")
test("r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -", POS2[DEPTH], DEPTH);
test("8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - -", POS3[DEPTH+1], DEPTH+1);
test("r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1", POS4[DEPTH+1], DEPTH+1);
test("rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8", POS5[DEPTH], DEPTH);
