costumes "assets/images/blank.svg" as "backdrop1";

%include code/helpful_utils

list blocks;
list roots; # holds block idxs of script roots

struct InputRank {
    dist="",
    block="",
    input="" # input id in block
}

struct PreviewBlock {
    block_idx="",
    input="",
    preview_idx=""
}

var InputRank highlighted_input;
var PreviewBlock h_c_placement;

onclick {
    wait_until(not mouse_down());
    broadcast "stage_click";
}


# keeps a list of dragged block idxs so they can be avoided
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
var SPRITES_SCROLL_X = 0;
var SPRITES_SCROLL_Y = 0;
var SPRITES_MAX_X = 240;
var SPRITES_MIN_X = 165;
var SPRITES_SHOWN = false;
var LAG_MODE;
var REDRAW = true;

var RUNNING = true;

var CURRENT_CLONE_ID;
var CURRENT_BROADCAST_ID;

list block_palette_text;

struct Token {
    type,
    val
}

list Token code;
list hats;
list messages; # for storing messages to be handled - events have: id, current time, name

list opcode_lookup "assets/data/opcodes.txt";

struct Sprite {
    name,
    costume,
    blocks,
    vars,
    lists
}

list Sprite sprites;


struct AsyncAction {
    sprite_id,
    clone_id,
    action
}

# stores actions like `say for secs` or `ask` that cause delays
# when calling `say for secs` params are added to the list
# when receiving it, all instances of that action by that sprite are removed
list AsyncAction async_actions;