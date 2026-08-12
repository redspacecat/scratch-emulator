costumes "assets/blank.svg" as "backdrop1";

list blocks;
var BLOCK_LENGTH = 33;
var TEXT_LABEL_LENGTH = 2;
var INPUT_LENGTH = 6;
var scale = 1;

struct InputRank {
    dist="",
    block="",
    input="" # input id in block
}

var InputRank highlighted_input;