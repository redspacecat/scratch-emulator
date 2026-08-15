costumes "assets/blank.svg" as "backdrop1";

list blocks;
list roots; # holds block ids of script roots
# var BLOCK_LENGTH = 33;
# var TEXT_LABEL_LENGTH = 2;
# var INPUT_LENGTH = 6;
var scale = 1;

struct InputRank {
    dist="",
    block="",
    input="" # input id in block
}

var InputRank highlighted_input;


# keeps a list of ids of dragged blocks so they can be avoided
# for placement into and so they can be layered on top
list dragged_blocks;