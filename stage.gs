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

# keeps a list of dragged block idxs so they can be avoided
# for placement into and so they can be layered on top
list dragged_blocks;

var SCROLL_X = 0;
var SCROLL_Y = 0;
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
var LAST_SCREEN_REFRESH;
var TIMER_BASE;

list block_palette_text;
list dropdown_data;
list costume_names;
list sound_names "assets/data/sounds.txt";
list broadcasts = ["message1"];
list menu_buttons;

struct Token {
    type,
    val
}

list Token code;
list hats;
list messages; # for storing messages to be handled - events have: id, current time, name
list received_messages_exec_count; # stores number of times message received
list message_receiver_count;
list message_names;

list opcode_lookup "assets/data/opcodes.txt";

struct Sprite {
    name="",
    costume="",
    blocks="",
    vars="",
    lists="",
    custom_blocks="",
    scroll_x=0,
    scroll_y=0
}

list Sprite sprites;


struct AsyncAction {
    sprite_id,
    clone_id,
    action
}

struct Var {
    name,
    val
}

# stores actions like `say for secs` or `ask` that cause delays
# when calling `say for secs` params are added to the list
# when receiving it, all instances of that action by that sprite are removed
list AsyncAction async_actions;
# global vars for the runtime
list Var runtime_global_vars;
list r_global_lists;
list sprite_info;

var selected_workspace;

list global_vars;
list global_lists;
var var_tempo;

list save_code_output;

var editor_theme = "";
var editor_colors = "";

# data for the music extension
list drums "assets/data/drums.txt";
list instruments "assets/data/instruments.txt";

# settings
var Current_Editor_Theme;
var Current_Editor_Block_Colors;
var Editor_Theme_Switcher;
var Editor_Block_Colors_Switcher;

list Copyable_Text = [
    "This project wants you to copy the text below. Click outside this list to close.",
    ""
];

list custom_blocks; # definition, warp, parsed data

onflag {
    hide Current_Editor_Theme;
    hide Current_Editor_Block_Colors;
    hide Editor_Theme_Switcher;
    hide Editor_Block_Colors_Switcher;
    hide Copyable_Text;
    hide save_code_output;
}