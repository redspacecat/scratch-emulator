%include code/defs
%include code/block_data

%define wait_until(x) until x {}
%define while(x) until not x

%define BLOCK_LENGTH 55
%define TEXT_LABEL_LENGTH 2
%define INPUT_LENGTH 9
%define CUSTOM_BLOCK_LENGTH 21

%define c_block_prong_height 15
%define c_block_min_slot_height 12
%define c_block_min_width 85
%define c_x_offset 8
%define inner_offset 8

%define b_input_type_text 1
%define b_input_type_number 2
%define b_input_type_color 3

%define b_idx(blockID) ((blockID - 1) * BLOCK_LENGTH + 1)
%define b_id(blockIdx) ((blockIdx - 1) / BLOCK_LENGTH + 1)

%define get_block_input(blockIdx, inputNum, key) blocks[blockIdx + b_inputs + (inputNum - 1) * INPUT_LENGTH + key]
%define get_block_label(blockIdx, labelNum, key) blocks[blockIdx + b_labels + (labelNum - 1) * TEXT_LABEL_LENGTH + key]

%define block_in_palette(i) i < PALETTE_END

%define last_block_idx length blocks - BLOCK_LENGTH + 1

%define redraw REDRAW = true

%define d_x -180
%define d_y 100
%define d_width 360
%define d_height 240

%define REVERSE_TYPED(TYPE, LIST)                                                     \  
    local i = 1;                                                                     \  
    local j = length(LIST);                                                          \  
    repeat length(LIST) / 2 {                                                        \  
        local TYPE x = LIST[i];                                                      \  
        LIST[i] = LIST[j];                                                           \  
        LIST[j] = x;                                                                 \  
        i++;                                                                         \  
        j--;                                                                         \  
    }

%define stage_w stage_width
%define stage_h stage_height
%define stage_h_w half_stage_width
%define stage_h_h half_stage_height

%define btn(val) val - stage_w_change