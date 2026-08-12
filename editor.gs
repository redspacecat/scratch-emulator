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

var SCROLL_X = 0;
var SCROLL_Y = 0;

struct Point {
    x,
    y
}

struct Rect {
    x1,
    y1,
    x2,
    y2
}

struct Tri {
    x1,
    y1,
    x2,
    y2,
    x3,
    y3
}

onflag {
    erase_all;
    delete blocks;
    init_blocks;
    dragged_block = 0;
    highest_nesting_level = 0;
    broadcast "render_loop";
    broadcast "input_loop";

    show hovered_block;
    wait 0;
    show dragged_block;
    wait 0;
    show dragged_block_idx;
    wait 0;
    show drag_offset_x;
    wait 0;
    show drag_offset_y;
    wait 0;
    show highlighted_input_nested_block;
}

on "render_loop" {
    forever {
        erase_all;
        broadcast "render_blocks";
    }
}

struct InputRank {
    dist="",
    block="",
    input="" # input id in block
}

list InputRank tmp_input_ranking;

on "input_loop" {
    forever {
        handle_input;
    }
}

nowarp proc handle_input {
    wait_until(mouse_down());
    mx = mouse_x() - SCROLL_X;
    my = mouse_y() - SCROLL_Y;
    hovered_block = find_hovered_block(mx, my, scale);
    if hovered_block > 0 {
        dragged_block = hovered_block;
        dragged_block_idx = b_idx(dragged_block);
        drag_offset_x = mx - bl_x(dragged_block_idx);
        drag_offset_y = my - bl_y(dragged_block_idx);
        disconnect_block dragged_block;
        find_dragged_blocks dragged_block_idx;
        until not mouse_down() {
            handle_drag;
        }
        if highlighted_input.block > "" {
            if get_block_input(highlighted_input.block, highlighted_input.input, b_input_nested_block) > "" {
                # if there's a currently embedded block, we need to disconnect it
                # to get rid of its parent reference
                disconnect_block get_block_input(highlighted_input.block, highlighted_input.input, b_input_nested_block);
            }
            put_block_in_block parentID: highlighted_input.block, childID: dragged_block, inputNumber: highlighted_input.input;
            highlighted_input = InputRank {};
            highlighted_input_nested_block = "";
        }
        dragged_block = 0;
        dragged_block_idx = 0;
        delete dragged_blocks;
    }
}

proc handle_drag {
    start_time = days_since_2000();

    mx = mouse_x() - SCROLL_X;
    my = mouse_y() - SCROLL_Y;
    target_x = mx - drag_offset_x;
    target_y = my - drag_offset_y;
    move_block_position dragged_block_idx, target_x - bl_x(dragged_block_idx), target_y - bl_y(dragged_block_idx);

    t_x = bl_x(dragged_block_idx);
    t_y = bl_y(dragged_block_idx) - bl_height(dragged_block_idx) / 2;

    delete tmp_input_ranking;
    local i = 1;
    repeat length blocks / BLOCK_LENGTH {
        if not (b_id(i) in dragged_blocks) { # avoid blocks we're currently holding
            local counter = 0;
            local inputNum = 1;
            repeat 3 {
                local offset = i + b_inputs + counter;
                if blocks[offset + b_input_shape] > "" {
                    if abs(t_x - blocks[offset + b_input_x]) < 40 and abs(t_y - (bl_y(i) - bl_height(i) / 2)) < 40 {
                        add InputRank {
                            # dist: sqrt((blocks[offset + b_input_x] - t_x) * (blocks[offset + b_input_x] - t_x) + (blocks[offset + b_input_y] - t_y) * (blocks[offset + b_input_y] - t_y)),
                            dist: DIST(t_x, t_y, blocks[offset + b_input_x], bl_y(i) - bl_height(i) / 2),
                            block: b_id(i), 
                            input: inputNum
                        } to tmp_input_ranking;
                    }
                }
                counter += INPUT_LENGTH;
                inputNum++;
            }
        }

        i += BLOCK_LENGTH;
    }
    INSERTION_SORT_BY_FIELD(InputRank, tmp_input_ranking, .dist);

    if tmp_input_ranking[1].dist <= 20 {
        InputRank highlighted_input = tmp_input_ranking[1];
        highlighted_input_nested_block = get_block_idx_input(b_idx(highlighted_input.block), highlighted_input.input, b_input_nested_block); # if there's a block in the input we want it so we can render a custom border around it if highlighted
    } else {
        InputRank highlighted_input = InputRank {};
        highlighted_input_nested_block = "";
    }

    log (days_since_2000() - start_time) * 86400000 & " ms/call";
}

proc find_dragged_blocks bIdx {
    delete dragged_blocks;
    check_dragged_block $bIdx;    
}

proc check_dragged_block bIdx {
    add b_id($bIdx) to dragged_blocks;

    if (b_input1_nested_block($bIdx) > "") {check_dragged_block b_idx(b_input1_nested_block($bIdx));}
    if (b_input2_nested_block($bIdx) > "") {check_dragged_block b_idx(b_input2_nested_block($bIdx));}
    if (b_input3_nested_block($bIdx) > "") {check_dragged_block b_idx(b_input3_nested_block($bIdx));}
}

proc init_blocks {
    add_block "stack", Category.Control, -56, -42, 93, 21, parent: 3, next: 2, label1: TextLabel {x: -51, text: "wait"}, label2: TextLabel {x: -8, text: "seconds"}, input1: Input {shape: "reporter", x: -28, width: 16, height: 12, text: "1"};
    add_block "stack", Category.Control, -56, -63, 93, 21, parent: 1, next: "", label1: TextLabel {x: -51, text: "wait until"}, input1: Input {shape: "boolean", x: -4, width: 21, height: 12};
    add_block "stack", Category.Motion, -56, -21, 189, 21, parent: "", next: 1, label1: TextLabel {x: -51, text: "move"}, label2: TextLabel {x: 102, text: "steps"}, input1: Input {shape: "reporter", x: -23, width: 16, height: 12, text: 10};
    add_block "reporter", Category.Operators, -23, 81, 119, 16, label1: TextLabel {x: -17, text: "pick random"}, label2: TextLabel {x: 64, text: "to"}, input1: Input {shape: "reporter", x: 44, width: 16, height: 12, text: "1"}, input2: Input {shape: "reporter", x: 77, width: 16, height: 12, text: "10"};
    add_block "reporter", Category.Motion, 95, -57, 59, 16, label1: TextLabel {x: 100, text: "x position"};
    add_block "boolean", Category.Operators, -100, -120, 60, 16, label1: TextLabel {x: -72, text: "or"}, input1: Input {shape: "boolean", x: -97, width: 21, height: 12}, input2: Input {shape: "boolean", x: -57, width: 21, height: 12};
    add_block "boolean", Category.Operators, -100, -100, 125, 16, label1: TextLabel {x: -54, text: "contains"}, label2: TextLabel {x: 13, text: "?"}, input1: Input {shape: "reporter", x: -93, width: 34, height: 12, text: "apple"}, input2: Input {shape: "reporter", x: -8, width: 16, height: 12, text: "a"};
    add_block "reporter", Category.Operators, -100, -140, 60, 16, label1: TextLabel {x: -72, text: "+"}, input1: Input {shape: "reporter", x: -97, width: 16, height: 12, text: "1"}, input2: Input {shape: "reporter", x: -57, width: 16, height: 12, text: "127"};

    i = 1;
    repeat length blocks / BLOCK_LENGTH {
        update_block_dimensions i;
        i++;
    }
}

func find_hovered_block(x, y, scale, ignoreIdx=0) {
    local Point p = Point {x: $x, y: $y};
    local nesting_level = "renderer"."max_nesting_level";
    until nesting_level == -1 {
        local i = 1;
        repeat length blocks / BLOCK_LENGTH {
            if bl_nesting_level(i) == nesting_level {
                local shape = bl_shape(i);
                local x = bl_x(i);
                local y = bl_y(i);
                local width = bl_width(i);
                local height = bl_height(i);

                if point_in_rect(p, Rect {x1: x - 5, y1: y - height, x2: x + width + 5, y2: y}) {
                    if shape == "reporter" {
                        local radius = height / 2;
                        if point_in_circle(p, Point {x: x + radius, y: y - radius}, radius) or 
                        point_in_circle(p, Point {x: x + width - radius, y: y - radius}, radius) or
                        point_in_rect(p, Rect {x1: x + radius, y1: y - height, x2: x + width - radius, y2: y}) {
                            if $ignoreIdx != i {
                                return b_id(i);
                            }
                        }
                    } elif shape == "boolean" {
                        local seg_l = height / 2; # segment length
                        if point_in_tri(p, Tri {x1: x, y1: y - seg_l, x2: x + seg_l, y2: y, x3: x + seg_l, y3: y - height}) or
                        point_in_tri(p, Tri {x1: x + width, y1: y - seg_l, x2: x + width - seg_l, y2: y, x3: x + width - seg_l, y3: y - height}) or
                        point_in_rect(p, Rect {x1: x + seg_l, y1: y - height, x2: x + width - seg_l, y2: y}) {
                            if $ignoreIdx != i {
                                return b_id(i);
                            }
                        }
                    } elif shape == "stack" {
                        if point_in_rect(p, Rect {x1: x, x2: x + 8, y1: y - height, y2: y}) or
                        point_in_rect(p, Rect {x1: x + 8, y1: y - height - 3, x2: x + 18, y2: y - 3}) or
                        point_in_rect(p, Rect {x1: x + 18, y1: y - height, x2: x + width, y2: y}) {
                            if $ignoreIdx != i {
                                return b_id(i);
                            }
                        }
                    }
                }
            }
            i += BLOCK_LENGTH;

        }

        nesting_level--;
    }
    return 0;
}

func point_in_rect(Point p, Rect rect) {
    return ($p.x >= $rect.x1 and $p.x <= $rect.x2 and $p.y >= $rect.y1 and $p.y <= $rect.y2);
}

func point_in_circle(Point p, Point c, radius) {
    return (((($p.x - $c.x) * ($p.x - $c.x)) + (($p.y - $c.y) * ($p.y - $c.y))) <= ($radius * $radius));
}

func point_in_tri(Point p, Tri t) {
    local d1 = ($p.x - $t.x2) * ($t.y1 - $t.y2) - ($t.x1 - $t.x2) * ($p.y - $t.y2);
    local d2 = ($p.x - $t.x3) * ($t.y2 - $t.y3) - ($t.x2 - $t.x3) * ($p.y - $t.y3);
    local d3 = ($p.x - $t.x1) * ($t.y3 - $t.y1) - ($t.x3 - $t.x1) * ($p.y - $t.y1);

    local has_neg = (d1 < 0) or (d2 < 0) or (d3 < 0);
    local has_pos = (d1 > 0) or (d2 > 0) or (d3 > 0);

    return not (has_neg and has_pos);
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

proc put_block_in_block childID, parentID, inputNumber, update_sizes=true {
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

    if ($update_sizes) {
        propagate_size_change $parentID;
    }
}

proc disconnect_block blockID {
    local blockIdx = b_idx($blockID);
    local parentID = bl_parent(blockIdx);
    local parentIdx = b_idx(parentID);
    bl_parent(blockIdx) = "";
    bl_next(blockIdx) = "";

    # if we're disconnecting a stack block, remove the parent's next so that
    # it is fully disconnected and won't get moved around in the future
    # if it's not a stack block, then removing the parent's next could remove a connection
    # that shouldn't be removed
    if bl_shape(blockIdx) == "stack" {
        bl_next(parentIdx) = "";
    }

    # go through parent's inputs and disconnect all places the block is referenced
    if b_input1_nested_block(parentIdx) == $blockID {set_block_idx_input parentIdx, 1, b_input_nested_block, "";}
    if b_input2_nested_block(parentIdx) == $blockID {set_block_idx_input parentIdx, 2, b_input_nested_block, "";}
    if b_input3_nested_block(parentIdx) == $blockID {set_block_idx_input parentIdx, 3, b_input_nested_block, "";}
    
    update_nesting_level blockIdx;
    propagate_size_change parentID;
}

proc propagate_size_change blockID {
    local idx = b_idx($blockID);
    if (bl_shape(idx) == "boolean" or bl_shape(idx) == "reporter") {
        # log "updating block dimensions " & $blockID;
        update_block_dimensions $blockID;
        if bl_parent(idx) > "" {
            propagate_size_change bl_parent(idx);
        } else {
            # log "no parent, no propagating " & $blockID;
        }
    } else {
        # log "updating stack block dimensions " & $blockID;
        local height_before = bl_height(idx);
        update_block_dimensions $blockID;
        local height_change = bl_height(idx) - height_before;
        # log "height change " & height_change & " next " & bl_next(idx);
        if bl_next(idx) > "" {
            shift_next_block_down b_idx(bl_next(idx)), height_change;
        }
    }
}

proc shift_next_block_down blockIdx, amount {
    # log "shifting idx " & $blockIdx & " down " & $amount;
    # bl_y($blockIdx) -= $amount;
    move_block_position $blockIdx, 0, -$amount;
    # log "next block " & bl_next($blockIdx);
    if bl_next($blockIdx) > "" {
        shift_next_block_down b_idx(bl_next($blockIdx)), $amount;
    }
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
    # local block_total_height = bl_height(blockIdx);
    local shape = bl_shape(blockIdx);
    local block_total_height = 16;
    if shape == "stack" {
        block_total_height = 21;
    } else {
        block_total_height = 16;
    }
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
                # we override shape, to allow for the nested block shape not being
                # the same as the input's block shape
                shape = bl_shape(b_idx(nested_block));
                local input_width = bl_width(b_idx(nested_block));
                local input_height = bl_height(b_idx(nested_block)) + 4; # = top and bottom padding
                if bl_shape(blockIdx) == "stack" {
                    input_height += 2;
                }
                if (input_height > block_total_height) { # expand the parent block's height if necessary
                    block_total_height = input_height;
                    bl_height(blockIdx) = block_total_height; # update block height
                }
                # log "nested input width: " & input_width;
            } else {
                if (shape == "reporter") {
                    local text = get_block_idx_input(blockIdx, inputNum, b_input_text);
                    # log "handling text: " & text;
                    local input_width = MAX(16, width_of_text(text, 1) + text_padding * 2); # minimum input width of 16
                    # log input_width;
                    # local input_height = get_block_idx_input(blockIdx, inputNum, b_input_height) + 6;
                    # if input_height > block_total_height {
                    #     block_total_height = input_height;
                    # }
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
        } elif (bl_shape(blockIdx) == "boolean") { # add more padding to the end of boolean blocks
            # have to add this or else the padding isn't the same as the start, and there isn't enough
            current_x += boolean_edge_padding;
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
    bl_height(blockIdx) = block_total_height; # update block height

    # after updating block width, go over all embedded blocks and reposition them
    # we need to move the block to center it vertically in the input
    # since the y position stays the same otherwise
    # additionally we need to update the x if something was inserted on an earlier input

    local i = 1;
    repeat length tmp_item_order {
        local TMPInput item = tmp_item_order[i];
        if (item.index >= 4) {
            local inputNum = item.index - 3;
            local nested_block = get_block_idx_input(blockIdx, inputNum, b_input_nested_block);
            local shape = get_block_idx_input(blockIdx, inputNum, b_input_shape);
            if (nested_block > "") {
                # log "updating block pos " & nested_block & " in input " & inputNum;
                put_block_in_block nested_block, $blockID, inputNum, update_sizes: false;
            }
        }
        i++;
    }
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