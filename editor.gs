%include code/PTE_font.gs

%include code/helpful_utils.gs
%include std/list
%include std/math

hide;

var base_boolean_width = 18; # width of a empty boolean input
var padding = 5; # padding between elements
var start_padding = 5; # padding at the start of a block
var end_padding = 4; # padding at the end of a block
var edge_padding_same = 3; # padding where the block shape and input shape are the same (e.g. (() - ()) block)
var end_padding_other = 5; # end padding for ending on other inputs
var text_padding = 4; # padding around text in inputs
var boolean_edge_padding = 8; # padding around edges of boolean blocks


onflag {
    delete blocks;
    add_block "stack", Category.Control, -56, -42, 93, 21, label1: TextLabel {x: -51, text: "wait"}, label2: TextLabel {x: -8, text: "seconds"}, input1: Input {shape: "reporter", x: -28, width: 16, height: 12, text: "1"};
    add_block "stack", Category.Control, -56, -63, 93, 21, label1: TextLabel {x: -51, text: "wait until"}, input1: Input {shape: "boolean", x: -4, width: 21, height: 12};
    add_block "stack", Category.Motion, -56, -21, 189, 21, label1: TextLabel {x: -51, text: "move"}, label2: TextLabel {x: 102, text: "steps"}, input1: Input {shape: "reporter", x: -23, width: 16, height: 12, text: 10};
    add_block "reporter", Category.Operators, -23, 81, 119, 16, label1: TextLabel {x: -17, text: "pick random"}, label2: TextLabel {x: 64, text: "to"}, input1: Input {shape: "reporter", x: 44, width: 16, height: 12, text: "1"}, input2: Input {shape: "reporter", x: 77, width: 16, height: 12, text: "10"};
    add_block "reporter", Category.Motion, 95, -57, 59, 16, label1: TextLabel {x: 100, text: "x position"};
    add_block "boolean", Category.Operators, -100, -120, 60, 16, label1: TextLabel {x: -72, text: "or"}, input1: Input {shape: "boolean", x: -97, width: 21, height: 12}, input2: Input {shape: "boolean", x: -57, width: 21, height: 12};
    add_block "boolean", Category.Operators, -100, -100, 125, 16, label1: TextLabel {x: -54, text: "contains"}, label2: TextLabel {x: 13, text: "?"}, input1: Input {shape: "reporter", x: -93, width: 34, height: 12, text: "apple"}, input2: Input {shape: "reporter", x: -8, width: 16, height: 12, text: "a"};
    add_block "reporter", Category.Operators, -100, -140, 60, 16, label1: TextLabel {x: -72, text: "+"}, input1: Input {shape: "reporter", x: -97, width: 16, height: 12, text: "1"}, input2: Input {shape: "reporter", x: -57, width: 16, height: 12, text: "127"};

    forever {
        erase_all;
        broadcast "render_blocks";
    }
}

onkey "1" {
    put_block_in_block childID: 4, parentID: 3, inputNumber: 1;
}

onkey "2" {
    put_block_in_block childID: 5, parentID: 1, inputNumber: 1;
}

onkey "3" {
    put_block_in_block childID: 7, parentID: 6, inputNumber: 1;
}

onkey "4" {
    put_block_in_block childID: 5, parentID: 4, inputNumber: 1;
}

onkey "5" {
    put_block_in_block childID: 5, parentID: 4, inputNumber: 2;
}

onkey "6" {
    put_block_in_block childID: 4, parentID: 7, inputNumber: 1;
}

onkey "7" {
    put_block_in_block childID: 7, parentID: 2, inputNumber: 1;
}

onkey "a" {
    update_block_dimensions 1;
}

onkey "b" {
    update_block_dimensions 3;
}

onkey "c" {
    update_block_dimensions 4;
}

onkey "d" {
    update_block_dimensions 2;
}

onkey "e" {
    update_block_dimensions 6;
}

onkey "f" {
    update_block_dimensions 7;
}

onkey "g" {
    update_block_dimensions 8;
}

proc add_block shape, category, x, y, width, height, parent="", next="", TextLabel label1=TextLabel {}, TextLabel label2=TextLabel {}, TextLabel label3=TextLabel {}, Input input1=Input {}, Input input2=Input {}, Input input3=Input {}, nesting_level=0 {
    add $shape to blocks;
    add $category to blocks;
    add $x to blocks;
    add $y to blocks;
    add $width to blocks;
    add $height to blocks;
    add $parent to blocks;
    add $next to blocks;
    add $nesting_level to blocks;

    add $label1.text to blocks; add $label1.x to blocks;
    add $label2.text to blocks; add $label2.x to blocks;
    add $label3.text to blocks; add $label3.x to blocks;

    add $input1.shape to blocks;
    add $input1.x to blocks;
    add $input1.width to blocks;
    add $input1.height to blocks;
    add $input1.text to blocks;
    add $input1.nested_block to blocks;

    add $input2.shape to blocks;
    add $input2.x to blocks;
    add $input2.width to blocks;
    add $input2.height to blocks;
    add $input2.text to blocks;
    add $input2.nested_block to blocks;

    add $input3.shape to blocks;
    add $input3.x to blocks;
    add $input3.width to blocks;
    add $input3.height to blocks;
    add $input3.text to blocks;
    add $input3.nested_block to blocks;
}

proc put_block_in_block childID, parentID, inputNumber {
    local parentIdx = b_idx($parentID);
    local childIdx = b_idx($childID);
    local x_change = get_block_idx_input(parentIdx, $inputNumber, b_input_x) - bl_x(childIdx);
    local y_change = ((bl_y(parentIdx) - bl_height(parentIdx) / 2) + (bl_height(childIdx) / 2)) - bl_y(childIdx);
    if (bl_shape(parentIdx) == "stack") {
        y_change += 0.5;
    }
    set_block_idx_input parentIdx, $inputNumber, b_input_nested_block, $childID;
    bl_parent(childIdx) = $parentID;
    update_nesting_level childIdx;
    move_block_position childIdx, x_change, y_change;
}

proc update_nesting_level bIdx {
    # get nesting level from parent and increment
    bl_nesting_level($bIdx) = bl_nesting_level(b_idx(bl_parent($bIdx))) + 1;
    # check inputs recursively for nesting level updates
    if (b_input1_nested_block($bIdx) > "") {update_nesting_level b_idx(b_input1_nested_block($bIdx));}
    if (b_input2_nested_block($bIdx) > "") {update_nesting_level b_idx(b_input2_nested_block($bIdx));}
    if (b_input3_nested_block($bIdx) > "") {update_nesting_level b_idx(b_input3_nested_block($bIdx));}
}

struct TMPInput {
    x,
    index # 1-6 where 1-3 are text labels and 4-6 are inputs
}

list TMPInput tmp_item_order;
proc update_block_dimensions blockID {
    # order text + inputs by x, left -> right
    # get width of each item, keeping track of a cumulative x position and adding padding
    # if input is a block, include that width
    # block height = tallest input + 2px padding top and bottom
    # update positions of items as needed
    # update total block with when done
    delete tmp_item_order;
    local blockIdx = b_idx($blockID);

    local counter = 0;
    local index = 1;
    repeat 3 {
        local offset = blockIdx + b_labels + counter;
        if (blocks[offset + 1] > "") { # checking + 1 to check x instead of text, which could be blank
            add TMPInput {x: blocks[offset + 1], index: index} to tmp_item_order;
        }
        counter += TEXT_LABEL_LENGTH; # = number of properties in TextLabel
        index++;
    }
    local counter = 0;
    local index = 4;
    repeat 3 {
        local offset = blockIdx + b_inputs + counter;
        if (blocks[offset] > "") { # checks if inputs[shape] > "", if so valid input
            add TMPInput {x: blocks[offset + b_input_x], index: index} to tmp_item_order;
        }
        counter += INPUT_LENGTH; # = number of properties in Input
        index++;
    }
    INSERTION_SORT_BY_FIELD(TMPInput, tmp_item_order, .x);

    local start_x = bl_x(blockIdx);
    local current_x = start_x;
    local block_total_height = bl_height(blockIdx);
    local i = 1;
    repeat length tmp_item_order {
        local TMPInput item = tmp_item_order[i];
        if (item.index <= 3) {
            local text = get_block_idx_label(blockIdx, item.index, b_label_text);
            local text_width = width_of_text(text, 1) - 1;
            # log text;
            # log text_width;
            # log item.x;
            # log item.index;

            if (current_x == start_x) {
                current_x += start_padding;
            } else {
                current_x += padding;
            }
            set_block_idx_label blockIdx, item.index, b_label_x, current_x;
            current_x += text_width;
        } elif (item.index >= 4) {
            local inputNum = item.index - 3;
            # log "handling input: " & inputNum;
            local nested_block = get_block_idx_input(blockIdx, inputNum, b_input_nested_block);
            local shape = get_block_idx_input(blockIdx, inputNum, b_input_shape);
            if (nested_block > "") {
                local input_width = bl_width(b_idx(nested_block));
                local input_height = bl_height(b_idx(nested_block)) + 4; # 4 = top and bottom padding
                if (input_height > block_total_height) { # expand the parent block's height if necessary
                    block_total_height = input_height;
                    bl_height(blockIdx) = block_total_height; # update block height
                    # we need to move the block to center it vertically in the input
                    # since the y position stays the same otherwise
                    put_block_in_block nested_block, $blockID, inputNum;
                }
                # log "nested input width: " & input_width;
            } else {
                if (shape == "reporter") {
                    local text = get_block_idx_input(blockIdx, inputNum, b_input_text);
                    # log "handling text: " & text;
                    local input_width = MAX(16, width_of_text(text, 1) + text_padding * 2); # minimum input width of 16
                    # log input_width;
                    set_block_idx_input blockIdx, inputNum, b_input_width, input_width;
                } elif (shape == "boolean") { # boolean inputs don't have text, so use just set width
                    local input_width = base_boolean_width;
                    # boolean inputs are always a fixed width, as
                    # there's nothing changeable about them
                    set_block_idx_input blockIdx, inputNum, b_input_width, input_width;
                }
            }

            if (current_x == start_x) {
                if (bl_shape(blockIdx) == shape) {
                    current_x += edge_padding_same;
                } elif (bl_shape(blockIdx) == "boolean") { # add more padding to boolean blocks
                    current_x += boolean_edge_padding;
                } else {
                    current_x += start_padding;
                }
            } else {
                current_x += padding;
            }
            set_block_idx_input blockIdx, inputNum, b_input_x, current_x;
            current_x += input_width;
        }
        i++;
    }

    if (item.index >= 4) {
        if (bl_shape(blockIdx) == shape) {
            current_x += edge_padding_same;
        } else {
            current_x += end_padding_other;
        }
    } else {
        if (bl_shape(blockIdx) == "boolean") { # add more padding to boolean blocks
            current_x += boolean_edge_padding;
        } else {
            current_x += end_padding;
        }
    }
    local total_width = current_x - start_x;
    bl_width(blockIdx) = total_width;
}

proc set_block_input blockID, inputNum, key, val {
    blocks[b_idx($blockID) + b_inputs + (($inputNum - 1) * INPUT_LENGTH) + $key] = $val;
}

proc set_block_idx_input blockIdx, inputNum, key, val {
    blocks[$blockIdx + b_inputs + (($inputNum - 1) * INPUT_LENGTH) + $key] = $val;
}

proc set_block_label blockID, labelNum, key, val {
    blocks[b_idx($blockID) + b_labels + (($labelNum - 1) * TEXT_LABEL_LENGTH) + $key] = $val;
}

proc set_block_idx_label blockIdx, labelNum, key, val {
    blocks[$blockIdx + b_labels + (($labelNum - 1) * TEXT_LABEL_LENGTH) + $key] = $val;
}

proc move_block_position bIdx, x_change, y_change {
    bl_x($bIdx) += $x_change;
    bl_y($bIdx) += $y_change;

    if (b_label1_x($bIdx) > "") {b_label1_x($bIdx) += $x_change;}
    if (b_label2_x($bIdx) > "") {b_label2_x($bIdx) += $x_change;}
    if (b_label3_x($bIdx) > "") {b_label3_x($bIdx) += $x_change;}
    if (b_input1_shape($bIdx) > "") {b_input1_x($bIdx) += $x_change;}
    if (b_input2_shape($bIdx) > "") {b_input2_x($bIdx) += $x_change;}
    if (b_input3_shape($bIdx) > "") {b_input3_x($bIdx) += $x_change;}
    if (b_input1_nested_block($bIdx) > "") {move_block_position b_idx(b_input1_nested_block($bIdx)), $x_change, $y_change;}
    if (b_input2_nested_block($bIdx) > "") {move_block_position b_idx(b_input2_nested_block($bIdx)), $x_change, $y_change;}
    if (b_input3_nested_block($bIdx) > "") {move_block_position b_idx(b_input3_nested_block($bIdx)), $x_change, $y_change;}
}