costumes "assets/images/blank.svg" as "backdrop1";

%include code/helpful_utils

list blocks;
list roots; # holds block ids of script roots

struct InputRank {
    dist="",
    block="",
    input="" # input id in block
}

var InputRank highlighted_input;

onclick {
    wait_until(not mouse_down());
    broadcast "stage_click";
}


# keeps a list of ids of dragged blocks so they can be avoided
# for placement into and so they can be layered on top
list dragged_blocks;

var SCROLL_X = 30;
var SCROLL_Y = 15;
var PALETTE_SCROLL_X = 0;
var PALETTE_SCROLL_Y = 0;
var PALETTE_MIN_X = -205;
var PALETTE_MAX_X = 0;
var PALETTE_HIDE_X = -100;
var PALETTE_SHOWN = false;
var PALETTE_END;

list block_palette_text;

struct Token {
    type,
    val
}

list Token code;