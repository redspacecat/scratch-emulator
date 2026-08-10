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

list colors = [
    "#4c97ff", "#3373cc",
    "#9966ff", "#774dcb",
    "#cf63cf", "#bd42bd",
    "#ffbf00", "#cc9900",
    "#ffab19", "#cf8b17",
    "#5cb1d6", "#2e8eb8",
    "#59c059", "#389438",
    "#ff8c1a", "#db6e00",
    "#ff661a", "#e64d00",
    "#ff6680", "#ff3355",
    "#0fbd8c", "#0b8e69",
];

%define b_shape blocks[i]
%define b_category blocks[i+1]
%define b_x blocks[i+2]
%define b_y blocks[i+3]
%define b_width blocks[i+4]
%define b_height blocks[i+5]
%define b_parent blocks[i+6]
%define b_next blocks[i+7]

%define bl_shape(ID) blocks[ID]
%define bl_category(ID) blocks[ID+1]
%define bl_x(ID) blocks[ID+2]
%define bl_y(ID) blocks[ID+3]
%define bl_width(ID) blocks[ID+4]
%define bl_height(ID) blocks[ID+5]
%define bl_parent(ID) blocks[ID+6]
%define bl_next(ID) blocks[ID+7]

%define b_label1_text blocks[i+8]
%define b_label1_x blocks[i+9]
%define b_label2_text blocks[i+10]
%define b_label2_x blocks[i+11]
%define b_label3_text blocks[i+12]
%define b_label3_x blocks[i+13]

%define b_input1_shape blocks[i+14]
%define b_input1_x blocks[i+15]
%define b_input1_width blocks[i+16]
%define b_input1_height blocks[i+17]
%define b_input1_text blocks[i+18]
%define b_input1_nested_block blocks[i+19]
%define b_input2_shape blocks[i+20]
%define b_input2_x blocks[i+21]
%define b_input2_width blocks[i+22]
%define b_input2_height blocks[i+23]
%define b_input2_text blocks[i+24]
%define b_input2_nested_block blocks[i+25]
%define b_input3_shape blocks[i+26]
%define b_input3_x blocks[i+27]
%define b_input3_width blocks[i+28]
%define b_input3_height blocks[i+29]
%define b_input3_text blocks[i+30]
%define b_input3_nested_block blocks[i+31]

%define b_labels 8
%define b_inputs 14

%define b_input_shape 0
%define b_input_x 1
%define b_input_width 2
%define b_input_height 3
%define b_input_text 4
%define b_input_nested_block 5

%define b_label_text 0
%define b_label_x 1

%define b_idx(blockID) ((blockID - 1) * BLOCK_LENGTH + 1)

%define get_block_input(blockID, inputNum, key) blocks[b_idx(blockID) + b_inputs + ((inputNum - 1) * INPUT_LENGTH) + key]
%define get_block_idx_input(blockID, inputNum, key) blocks[blockID + b_inputs + ((inputNum - 1) * INPUT_LENGTH) + key]

%define get_block_label(blockID, labelNum, key) blocks[b_idx(blockID) + b_labels + ((labelNum - 1) * TEXT_LABEL_LENGTH) + key]
%define get_block_idx_label(blockID, labelNum, key) blocks[blockID + b_labels + ((labelNum - 1) * TEXT_LABEL_LENGTH) + key]
