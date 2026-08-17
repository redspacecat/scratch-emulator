struct TextLabel {
    text="",
    x=""
}

struct Input {
    shape="",
    x="",
    width="",
    height="",
    text="",
    nested_block="",
}

enum Category {
    Motion=1,
    Looks=3,
    Sound=5,
    Events=7,
    Control=9,
    Sensing=11,
    Operators=13,
    Variables=15,
    Lists=17,
    CustomBlocks=19,
    Extensions=21
}

%define BLOCK_LENGTH 43
%define TEXT_LABEL_LENGTH 2
%define INPUT_LENGTH 6

%define c_block_prong_height 15
%define c_block_min_slot_height 12
%define c_block_min_width 85
%define c_x_offset 8
%define inner_offset 8

%define wait_until(x) until x {}

%define b_shape(i) blocks[i]
%define b_category(i) blocks[i+1]
%define b_x(i) blocks[i+2]
%define b_y(i) blocks[i+3]
%define b_width(i) blocks[i+4]
%define b_height(i) blocks[i+5]
%define b_previous(i) blocks[i+6]
%define b_parent(i) blocks[i+7]
%define b_next(i) blocks[i+8]
%define b_nesting_level(i) blocks[i+9]
%define b_slot_count(i) blocks[i+10]
%define b_prong_1_height(i) blocks[i+11]
%define b_prong_2_style(i) blocks[i+12]
%define b_prong_3_style(i) blocks[i+13]
%define b_end_style(i) blocks[i+14]
%define b_slot_1_height(i) blocks[i+15]
%define b_slot_2_height(i) blocks[i+16]
%define b_slot_1_nested_block(i) blocks[i+17]
%define b_slot_2_nested_block(i) blocks[i+18]

%define b_label1_text(i) blocks[i+19]
%define b_label1_x(i) blocks[i+20]
%define b_label2_text(i) blocks[i+21]
%define b_label2_x(i) blocks[i+22]
%define b_label3_text(i) blocks[i+23]
%define b_label3_x(i) blocks[i+24]

%define b_input1_shape(i) blocks[i+25]
%define b_input1_x(i) blocks[i+26]
%define b_input1_width(i) blocks[i+27]
%define b_input1_height(i) blocks[i+28]
%define b_input1_text(i) blocks[i+29]
%define b_input1_nested_block(i) blocks[i+30]
%define b_input2_shape(i) blocks[i+31]
%define b_input2_x(i) blocks[i+32]
%define b_input2_width(i) blocks[i+33]
%define b_input2_height(i) blocks[i+34]
%define b_input2_text(i) blocks[i+35]
%define b_input2_nested_block(i) blocks[i+36]
%define b_input3_shape(i) blocks[i+37]
%define b_input3_x(i) blocks[i+38]
%define b_input3_width(i) blocks[i+39]
%define b_input3_height(i) blocks[i+40]
%define b_input3_text(i) blocks[i+41]
%define b_input3_nested_block(i) blocks[i+42]

%define b_labels 19
%define b_inputs 25

%define b_input_shape 0
%define b_input_x 1
%define b_input_width 2
%define b_input_height 3
%define b_input_text 4
%define b_input_nested_block 5

%define b_label_text 0
%define b_label_x 1

%define b_idx(blockID) ((blockID - 1) * BLOCK_LENGTH + 1)
%define b_id(blockIdx) ((blockIdx - 1) / BLOCK_LENGTH + 1)

%define get_block_input(blockID, inputNum, key) blocks[b_idx(blockID) + b_inputs + (inputNum - 1) * INPUT_LENGTH + key]
%define get_block_idx_input(blockID, inputNum, key) blocks[blockID + b_inputs + (inputNum - 1) * INPUT_LENGTH + key]

%define get_block_label(blockID, labelNum, key) blocks[b_idx(blockID) + b_labels + (labelNum - 1) * TEXT_LABEL_LENGTH + key]
%define get_block_idx_label(blockID, labelNum, key) blocks[blockID + b_labels + (labelNum - 1) * TEXT_LABEL_LENGTH + key]
