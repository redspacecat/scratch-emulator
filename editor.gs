%include code/PTE_font

%include code/helpful_utils
%include code/block_palette_parser
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

struct PreviewBlock {
    id="",
    input="",
    previewID=""
}

onflag {
    erase_all;
    delete blocks;
    delete roots;
    delete dragged_blocks;

    parse_block_palette;
    target_palette_x = 0;
    target_palette_y = 0;
    target_palette_x_time = 0;
    target_palette_y_time = 0;

    init_blocks;
    dragged_block = 0;
    dragged_script_id = 0;
    dragged_stack_end = 0;
    dragged_stack_end_idx = 0;
    highest_nesting_level = 0;
    highlight_lightly = false;
    InputRank highlighted_input = InputRank {};
    InputRank highlighted_conn = InputRank {};
    PreviewBlock h_c_placement = PreviewBlock {};
    broadcast "render_loop";
    broadcast "input_loop";
    broadcast "palette_display_loop";
}

onkey "v" {
    PALETTE_SHOWN = 1 - PALETTE_SHOWN;
}

onkey "up arrow" {
    if mouse_x() < PALETTE_MAX_X and PALETTE_SHOWN {
        PALETTE_SCROLL_Y += 20;
        if PALETTE_SCROLL_Y > 0 {
            PALETTE_SCROLL_Y = 0;
        }
    } else {
        SCROLL_Y += 20;
    }
}

onkey "down arrow" {
    if mouse_x() < PALETTE_MAX_X and PALETTE_SHOWN {
        PALETTE_SCROLL_Y -= 20;
        if PALETTE_SCROLL_Y < palette_y_max {
            PALETTE_SCROLL_Y = palette_y_max;
        }
    } else {
        SCROLL_Y -= 20;
    }
}

onkey "left arrow" {
    SCROLL_X -= 20;
}

onkey "right arrow" {
    SCROLL_X += 20;
}

on "render_loop" {
    forever {
        erase_all;
        broadcast "render_blocks";
    }
}

list InputRank tmp_input_ranking;
list block_scripts;

on "input_loop" {
    forever {
        handle_input;
    }
}

on "palette_display_loop" {
    forever {
        if mouse_x() < PALETTE_MIN_X and PALETTE_SHOWN == false and target_palette_x_time == 0 {
            PALETTE_SHOWN = true;
            PALETTE_SCROLL_X = 150;
            target_palette_x = 0;
            target_palette_x_time = 10;
        }
        if mouse_x() > PALETTE_HIDE_X and PALETTE_SHOWN == true and target_palette_x_time == 0 {
            # PALETTE_SHOWN = false;
            target_palette_x = 220;
            target_palette_x_time = 6;
        }

        if target_palette_y_time > 0 {
            PALETTE_SCROLL_Y += round((target_palette_y - PALETTE_SCROLL_Y) / 2.5);
            target_palette_y_time--;
        }
        if target_palette_x_time > 0 {
            PALETTE_SCROLL_X += round((target_palette_x - PALETTE_SCROLL_X) / 2.5);
            target_palette_x_time--;
            if target_palette_x_time == 0 and target_palette_x > 0 {
                PALETTE_SHOWN = false;
            }
            if target_palette_x_time == 0 and target_palette_x == 0 {
                PALETTE_SCROLL_X = 0;
            }
        }
    }
}

on "stage_click" {
    if mouse_x() < PALETTE_MIN_X and dragged_block == 0 {
        clicked_category = floor((177 - mouse_y()) / 30) + 1;
        if clicked_category <= length category_y {
            target_palette_y = category_y[clicked_category];
            target_palette_y_time = 20;
        }
    }
}

nowarp proc handle_input {
    wait_until(mouse_down());
    if mouse_x() < PALETTE_MAX_X and PALETTE_SHOWN {
        log "palette coords";
        local scroll_x_offset = 0;
        local scroll_y_offset = PALETTE_SCROLL_Y;
        local over_palette = true;
    } else {
        log "regular coords";
        local scroll_x_offset = SCROLL_X;
        local scroll_y_offset = SCROLL_Y;
        local over_palette = false;
    }
    mx = mouse_x() + scroll_x_offset;
    my = mouse_y() + scroll_y_offset;
    hovered_block = if (mouse_x() > PALETTE_MIN_X) find_hovered_block(mx, my) else 0;
    if hovered_block > 0 {
        wait_until((not mouse_down()) or abs(mouse_x() + scroll_x_offset - mx) > 2 or abs(mouse_y() + scroll_y_offset - my) > 2);
        if not mouse_down() {
            hovered_input = find_hovered_input(mx, my, hovered_block);
            if hovered_input > "" {
                # hovered input, prompt to replace text
                highlight_lightly = true;
                InputRank highlighted_input = InputRank {block: hovered_block, input: hovered_input};
                ask "Replace \"" & get_block_input(hovered_block, hovered_input, b_input_text) & "\" with?";
                local something_inputted = false;
                if answer() == "" {
                    ask "Do you want to set this input to an empty string? (y)";
                    if "y" in answer() {
                        inputted_text = "";
                        something_inputted = true;
                    }
                } else {
                    inputted_text = answer();
                    something_inputted = true;
                }
                if something_inputted {
                    set_block_input hovered_block, hovered_input, b_input_text, inputted_text;
                }
                InputRank highlighted_input = InputRank {};
                highlight_lightly = false;
                propagate_size_change hovered_block;
            }
        } else {
            # dragging block
            if over_palette and hovered_block * BLOCK_LENGTH < PALETTE_END {
                local new_block_idx = duplicate_block(hovered_block);
                dragged_block = new_block_idx;
                scroll_x_offset = SCROLL_X;
                scroll_y_offset = SCROLL_Y;
            } else {
                dragged_block = hovered_block;
            }
            dragged_block_idx = b_idx(dragged_block);
            drag_offset_x = mx - (b_x(dragged_block_idx) + scroll_x_offset);
            drag_offset_y = my - (b_y(dragged_block_idx) + scroll_y_offset);
            disconnect_block dragged_block;
            dragged_script_id = get_script_root(dragged_block_idx); # stores the dragged blocks root script id
            dragged_stack_end = get_stack_bottom(dragged_block);
            dragged_stack_end_idx = b_idx(dragged_stack_end);
            find_dragged_blocks dragged_block_idx;
            while(mouse_down()) {
                handle_drag;
            }
            if mouse_x() < PALETTE_MAX_X and PALETTE_SHOWN {
                delete_block_stack dragged_block_idx;
            } else {
                if highlighted_input.block > "" {
                    if get_block_input(highlighted_input.block, highlighted_input.input, b_input_nested_block) > "" {
                        # if there's a currently embedded block, we need to disconnect it
                        # to get rid of its parent reference
                        disconnect_block get_block_input(highlighted_input.block, highlighted_input.input, b_input_nested_block), shift: true;
                    }
                    put_block_in_block parentID: highlighted_input.block, childID: dragged_block, inputNumber: highlighted_input.input;
                    # when a block is put into an input, it brings that script to the front
                    move_script_to_front b_idx(highlighted_input.block);
                    highlighted_input = InputRank {};
                    highlighted_input_nested_block = "";
                }
                if highlighted_conn.block > "" {
                    # if the preview placement block exists while we are
                    # trying to place the actual block, remove it
                    if h_c_placement.previewID > "" {
                        delete_block h_c_placement.previewID, true;
                    }
                    PreviewBlock h_c_placement = PreviewBlock {};

                    connect_stack_block connectID: highlighted_conn.block, childID: dragged_block, location: highlighted_conn.input;
                    move_script_to_front b_idx(highlighted_conn.block);
                    InputRank highlighted_conn = InputRank {};
                }
            }
            dragged_block = 0;
            dragged_script_id = 0;
            dragged_stack_end = 0;
            dragged_stack_end_idx = 0;
            dragged_block_idx = 0;
            delete dragged_blocks;
        }
    }
}

proc handle_drag no_recurse=false {
    start_time = days_since_2000();

    mx = mouse_x() + SCROLL_X;
    my = mouse_y() + SCROLL_Y;
    target_x = mx - drag_offset_x - SCROLL_X;
    target_y = my - drag_offset_y - SCROLL_Y;
    move_block_position dragged_block_idx, target_x - b_x(dragged_block_idx), target_y - b_y(dragged_block_idx);

    t_shape = b_shape(dragged_block_idx);
    t_x = b_x(dragged_block_idx);
    t_y = b_y(dragged_block_idx);
    if t_shape != "stack" and t_shape != "c" {
        t_y -= b_height(dragged_block_idx) / 2;
    }

    delete tmp_input_ranking;
    local i = PALETTE_END;
    repeat length blocks / BLOCK_LENGTH {
        if blocks[i] > "" {
            if PALETTE_SHOWN == false or (PALETTE_SHOWN == true and mouse_x() >= PALETTE_MAX_X) {
                if b_id(i) not in dragged_blocks and b_id(i) != h_c_placement.previewID { # avoid blocks we're currently holding and the preview placement block
                    if t_shape == "stack" or t_shape == "c" {
                        # stack block, try to find valid places to connect it
                        local target_height = b_height(i);
                        if point_in_rect(Point {x: t_x, y: t_y}, Rect {x1: b_x(i) - 20, y1: b_y(i) - target_height - 20, x2: b_x(i) + 20, y2: b_y(i) + 40}) {
                            local s = b_shape(i);
                            if s == "stack" or s == "c" {
                                if b_start_style(dragged_block_idx) != "hat" {
                                    # prevent cap blocks being put in the middle of a stack
                                    # allow if the next is the preview block, since it's the block
                                    # we're planning to place anyway. causes flickering between choices otherwise
                                    if (b_end_style(dragged_stack_end_idx) == "cap" and (b_next(i) == "" or b_next(i) == h_c_placement.previewID)) or b_end_style(dragged_stack_end_idx) != "cap" {
                                        # prevent attaching to the end of cap blocks
                                        if b_end_style(i) != "cap" {
                                            log "start style " & b_start_style(i);
                                            add InputRank {
                                                dist: DIST(t_x, t_y, b_x(i), b_y(i) - target_height),
                                                block: b_id(i), 
                                                input: 1 # bottom of block
                                            } to tmp_input_ranking;
                                        }
                                    }
                                }

                                # disabled top of block connections for now, finish full implementation later
                                # if b_parent(i) == "" and b_previous(i) == "" {
                                #     add InputRank {
                                #         dist: DIST(t_x, t_y - b_height(dragged_block_idx), b_x(i), b_y(i)),
                                #         block: b_id(i), 
                                #         input: 0 # top of block
                                #     } to tmp_input_ranking;
                                # }
                            }
                            if b_shape(i) == "c" and b_start_style(dragged_block_idx) != "hat" { # don't allow hat blocks where they shouldn't go
                                # prevent cap blocks being put in the middle of a stack
                                if (b_end_style(dragged_stack_end_idx) == "cap" and (b_slot_1_nested_block(i) == "" or b_slot_1_nested_block(i) == h_c_placement.previewID)) or b_end_style(dragged_stack_end_idx) != "cap" {
                                    add InputRank {
                                        dist: DIST(t_x, t_y, b_x(i), b_y(i) - b_prong_1_height(i)),
                                        block: b_id(i), 
                                        input: 2 # top slot of c block
                                    } to tmp_input_ranking;
                                }

                                if b_slot_count(i) > 1 {
                                    if (b_end_style(dragged_stack_end_idx) == "cap" and (b_slot_2_nested_block(i) == "" or b_slot_2_nested_block(i) == h_c_placement.previewID)) or b_end_style(dragged_stack_end_idx) != "cap" {
                                        add InputRank {
                                            dist: DIST(t_x, t_y, b_x(i), b_y(i) - b_prong_1_height(i) - b_slot_1_height(i) - c_block_prong_height),
                                            block: b_id(i), 
                                            input: 3 # bottom slot of c block
                                        } to tmp_input_ranking;
                                    }
                                }
                            }
                        }
                    } else {
                        # try to put the block in an input
                        local target_height = if (b_shape(i) == "c") b_prong_1_height(i) else b_height(i);
                        local counter = 0;
                        local inputNum = 1;
                        repeat 3 {
                            local offset = i + b_inputs + counter;
                            if blocks[offset + b_input_shape] > "" {
                                if is_input_valid(b_shape(dragged_block_idx), blocks[offset + b_input_shape], blocks[offset + b_input_dropdown_shape]) {
                                    if abs(t_x - blocks[offset + b_input_x]) < 40 and abs(t_y - (b_y(i) - target_height / 2)) < 40 {
                                        add InputRank {
                                            dist: DIST(t_x, t_y, blocks[offset + b_input_x], b_y(i) - target_height / 2),
                                            block: b_id(i), 
                                            input: inputNum
                                        } to tmp_input_ranking;
                                    }
                                }
                            }
                            counter += INPUT_LENGTH;
                            inputNum++;
                        }
                    }
                }
            }
        }

        i += BLOCK_LENGTH;
    }
    INSERTION_SORT_BY_FIELD(InputRank, tmp_input_ranking, .dist);

    if t_shape == "stack" or t_shape == "c" {
        if length tmp_input_ranking > 0 and tmp_input_ranking[1].dist <= 35 {
            InputRank highlighted_conn = tmp_input_ranking[1];
            # if the placement preview is not yet created, or the possible location
            # has since changed, delete and recreate the block to update it
            if h_c_placement.id == "" or h_c_placement.id != tmp_input_ranking[1].block or h_c_placement.input != tmp_input_ranking[1].input {
                log "updating placement preview";
                # delete old placement first
                if h_c_placement.previewID > "" {
                    delete_block h_c_placement.previewID, true;
                }
                add_block
                    shape: b_shape(dragged_block_idx),
                    category: Category.Preview,
                    x: 0,
                    y: 0,
                    width: b_width(dragged_block_idx),
                    height: b_height(dragged_block_idx),
                    slot_count: b_slot_count(dragged_block_idx),
                    prong_1_height: b_prong_1_height(dragged_block_idx),
                    prong_2_style: b_prong_2_style(dragged_block_idx),
                    prong_3_style: b_prong_3_style(dragged_block_idx),
                    end_style: b_end_style(dragged_block_idx);
                PreviewBlock h_c_placement = PreviewBlock {previewID: length blocks / BLOCK_LENGTH, id: highlighted_conn.block, input: highlighted_conn.input};
                update_block_dimensions h_c_placement.previewID, update_preview: true;
                # log b_width(dragged_block_idx);
                b_width(b_idx(h_c_placement.previewID)) = b_width(dragged_block_idx);
                # log highlighted_conn.block & " - " & h_c_placement.previewID;
                connect_stack_block connectID: highlighted_conn.block, childID: h_c_placement.previewID, location: highlighted_conn.input;
                propagate_size_change h_c_placement.previewID;
            }
        } else {
            if $no_recurse {
                stop_this_script;
            }
            InputRank highlighted_conn = InputRank {};
            if h_c_placement.previewID > "" {
                delete_block h_c_placement.previewID, true;
                PreviewBlock h_c_placement = PreviewBlock {};
                
                # after the block gets out range, we call the function again to recreate
                # the placement preview on the same frame, so there's no visual jump
                # since after getting rid of the old block it might've changed in a such
                # a way that there's a new valid placement position
                handle_drag no_recurse: true;
            }

        }
    } else {
        if tmp_input_ranking[1].dist <= 20 {
            InputRank highlighted_input = tmp_input_ranking[1];
            highlighted_input_nested_block = get_block_idx_input(b_idx(highlighted_input.block), highlighted_input.input, b_input_nested_block); # if there's a block in the input we want it so we can render a custom border around it if highlighted
        } else {
            InputRank highlighted_input = InputRank {};
            highlighted_input_nested_block = "";
        }
    }

    # log (days_since_2000() - start_time) * 86400000 & " ms/call";
}

func duplicate_block(id) {
    local i = b_idx($id);
    repeat BLOCK_LENGTH {
        add blocks[i] to blocks;
        i++;
    }
    return length blocks / BLOCK_LENGTH;
}

# update c prong end style
proc update_c_end_styles idx {
    local slot_1_end_style = b_end_style(b_idx(get_stack_bottom(b_slot_1_nested_block($idx))));
    local slot_2_end_style = b_end_style(b_idx(get_stack_bottom(b_slot_2_nested_block($idx))));
    b_prong_2_style($idx) = if (slot_1_end_style > "") slot_1_end_style else "normal";
    b_prong_3_style($idx) = if (slot_2_end_style > "") slot_2_end_style else "normal";
}

proc delete_block id, remove_items=false, entire_stack=false { # doesn't delete nested blocks
    local blockIdx = b_idx($id);
    local parentIdx = b_idx(b_parent(blockIdx));
    if b_nesting_level(blockIdx) == 0 {
        update_c_end_styles parentIdx;

        if b_previous(blockIdx) > "" {
            b_next(b_idx(b_previous(blockIdx))) = b_next(blockIdx);
        } else {
            if b_slot_1_nested_block(parentIdx) == $id {
                b_slot_1_nested_block(parentIdx) = b_next(blockIdx);
            }
            if b_slot_2_nested_block(parentIdx) == $id {
                b_slot_2_nested_block(parentIdx) = b_next(blockIdx);
            }
        }
        if b_next(blockIdx) > "" {
            b_previous(b_idx(b_next(blockIdx))) = b_previous(blockIdx);
            move_block_position b_idx(b_next(blockIdx)), 0, b_height(blockIdx);
        }
    }
    if $remove_items {
        repeat BLOCK_LENGTH {
            delete blocks[blockIdx];
        }
    } else {
        local i = blockIdx;
        repeat BLOCK_LENGTH {
            blocks[i] = "";
            i++;
        }
    }
    if parentIdx > "" {
        propagate_size_change b_id(parentIdx);
    }
    if $id in roots {
        delete roots[$id in roots];
    }
}

proc delete_block_stack bIdx {
    if (b_input1_nested_block($bIdx) > "") {delete_block_stack b_idx(b_input1_nested_block($bIdx));}
    if (b_input2_nested_block($bIdx) > "") {delete_block_stack b_idx(b_input2_nested_block($bIdx));}
    if (b_input3_nested_block($bIdx) > "") {delete_block_stack b_idx(b_input3_nested_block($bIdx));}
    if (b_slot_1_nested_block($bIdx) > "") {delete_block_stack b_idx(b_slot_1_nested_block($bIdx));}
    if (b_slot_2_nested_block($bIdx) > "") {delete_block_stack b_idx(b_slot_2_nested_block($bIdx));}

    if b_nesting_level($bIdx) == 0 and b_next($bIdx) > "" {
        delete_block_stack b_idx(b_next($bIdx));
    }

    if b_id($bIdx) in roots {
        delete roots[b_id($bIdx) in roots];
    }

    local i = $bIdx;
    repeat BLOCK_LENGTH {
        blocks[i] = "";
        i++;
    }
}

func is_input_valid(sourceShape, targetShape, dropdownShape) {
    if $dropdownShape != "square" {
        if $sourceShape == "reporter" and $targetShape == "reporter" {
            return true;
        }
        if $sourceShape == "boolean" and ($targetShape == "boolean" or $targetShape == "reporter") {
            return true;
        }
    }
    return false;
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
    if (b_slot_1_nested_block($bIdx) > "") {check_dragged_block b_idx(b_slot_1_nested_block($bIdx));}
    if (b_slot_2_nested_block($bIdx) > "") {check_dragged_block b_idx(b_slot_2_nested_block($bIdx));}

    if b_next($bIdx) > "" {
        check_dragged_block b_idx(b_next($bIdx));
    }
}

proc init_blocks {
    # add_block "control_waituntil", "stack", Category.Control, -42, 22, 93, 21, parent: 9, previous: 3, label1: TextLabel {x: -51, text: "wait"}, label2: TextLabel {x: -8, text: "seconds"}, input1: Input {shape: "reporter", x: -28, width: 16, height: 12, text: "1"};
    # add_block "control_waitsecs", "stack", Category.Control, -50, -63, 93, 21, label1: TextLabel {x: -51, text: "wait until"}, input1: Input {shape: "boolean", x: -4, width: 21, height: 12};
    # add_block "placeholder", "stack", Category.Motion, -42, 43, 189, 21, parent: 9, previous: "", next: 1, label1: TextLabel {x: -51, text: "move"}, label2: TextLabel {x: 102, text: "steps"}, input1: Input {shape: "reporter", x: -23, width: 16, height: 12, text: 10};
    # add_block "placeholder", "reporter", Category.Operators, -23, -142, 119, 16, label1: TextLabel {x: -17, text: "pick random"}, label2: TextLabel {x: 64, text: "to"}, input1: Input {shape: "reporter", x: 44, width: 16, height: 12, text: "1"}, input2: Input {shape: "reporter", x: 77, width: 16, height: 12, text: "10"};
    # add_block "placeholder", "reporter", Category.Motion, 95, -57, 59, 16, label1: TextLabel {x: 100, text: "x position"};
    # add_block "placeholder", "boolean", Category.Operators, -100, -120, 60, 16, label1: TextLabel {x: -72, text: "or"}, input1: Input {shape: "boolean", x: -97, width: 21, height: 12}, input2: Input {shape: "boolean", x: -57, width: 21, height: 12};
    # add_block "placeholder", "boolean", Category.Operators, -100, -100, 125, 16, label1: TextLabel {x: -54, text: "contains"}, label2: TextLabel {x: 13, text: "?"}, input1: Input {shape: "reporter", x: -93, width: 34, height: 12, text: "apple"}, input2: Input {shape: "reporter", x: -8, width: 16, height: 12, text: "a"};
    # add_block "placeholder", "reporter", Category.Operators, -100, -140, 60, 16, label1: TextLabel {x: -72, text: "+"}, input1: Input {shape: "reporter", x: -97, width: 16, height: 12, text: "1"}, input2: Input {shape: "reporter", x: -57, width: 16, height: 12, text: "127"};
    # add_block "placeholder", "c", Category.Control, -50, 100, 85, 105, parent: 12, next: 11, slot_count: 2, prong_1_height: 21, prong_2_style: "normal", prong_3_style: "normal", end_style: "normal", slot_1_height: 42, slot_2_height: 12, slot_1_nested_block: 10, slot_2_nested_block: 3, label1: TextLabel {x: -86, text: "if"}, label2: TextLabel {x: -44, text: "then"}, label3: TextLabel {x: -45, text: "else"}, input1: Input {shape: "boolean", x: -69, width: 18, height: 12}; 
    # add_block "placeholder", "stack", Category.Looks, -42, 79, 189, 21, parent: 9, next: "", label1: TextLabel {x: -51, text: "say"}, input1: Input {shape: "reporter", x: -23, width: 16, height: 12, text: "Hello!"};
    # add_block "placeholder", "stack", Category.Sensing, -50, -14, 189, 21, parent: 12, previous: 9, next: "", label1: TextLabel {x: -51, text: "ask"}, input1: Input {shape: "reporter", x: -23, width: 16, height: 12, text: "What's your name?"}, label2: TextLabel {x: 13, text: "and wait"};
    # add_block "placeholder", "c", Category.Control, -58, 121, 85, 105, parent: "", slot_count: 1, prong_1_height: 21, prong_2_style: "normal", end_style: "normal", slot_1_height: 12, slot_2_height: 12, slot_1_nested_block: 9, label1: TextLabel {x: -86, text: "repeat"}, input1: Input {shape: "reporter", x: -69, width: 18, height: 12, text: "100"}; 
    # add_block "placeholder", "stack", Category.Motion, 54, -82, 200, 21, next: 14, label1: TextLabel {x: -51, text: "go to"}, input1: Input {shape: "reporter", dropdown_shape: "round", dropdown_list: "sprites", x: -23, width: 16, height: 12, text: "random position"};
    # add_block "placeholder", "stack", Category.Looks, 54, -103, 200, 21, previous: 13, label1: TextLabel {x: -51, text: "change"}, label2: TextLabel {x: -10, text: "effect by"}, input1: Input {shape: "reporter", dropdown_shape: "square", dropdown_list: "graphicEffects", x: -23, width: 16, height: 12, text: "color"}, input2: Input {shape: "reporter", x: 20, width: 16, height: 12, text: "25"};

    add_block "motion_movesteps", "stack", Category.Motion, 100, 43, 189, 21, label1: TextLabel {x: -51, text: "move"}, label2: TextLabel {x: 102, text: "steps"}, input1: Input {shape: "reporter", x: -23, width: 16, height: 12, text: 10};

    i = 1;
    repeat length blocks / BLOCK_LENGTH {
        if blocks[i] > "" {
            update_block_dimensions b_id(i), false; # we need to not move c block's inputs before the block is sized correctly
        }
        i += BLOCK_LENGTH;
    }
}

func find_hovered_block(x, y, ignoreIdx=0) {
    local Point p = Point {x: $x, y: $y};

    delete block_scripts;
    local i = 1;
    repeat length blocks / BLOCK_LENGTH {
        if blocks[i] > "" {
            add get_script_root(i) to block_scripts;
        } else {
            add "" to block_scripts;
        }
        i += BLOCK_LENGTH;
    }

    if PALETTE_SHOWN {
        local i = 1;
        until i == PALETTE_END {
            local result = check_hovered_block(p, i, $ignoreIdx);
            if result > 0 {
                log "palette click detected";
                return result;
            }

            i += BLOCK_LENGTH;
        }
    }

    local j = length roots;
    repeat length roots {
        local root = roots[j];
        local nesting_level = "renderer"."max_nesting_level";
        until nesting_level == -1 {
            local i = PALETTE_END;
            until i > length blocks * BLOCK_LENGTH {
                if blocks[i] > "" {
                    # prevent picking up blocks behind the block palette while it's shown
                    if PALETTE_SHOWN and mouse_x() >= PALETTE_MAX_X or PALETTE_SHOWN == false {
                        if b_nesting_level(i) == nesting_level and block_scripts[b_id(i)] == root {
                            local result = check_hovered_block(p, i, $ignoreIdx);
                            if result > 0 {
                                return result;
                            }
                        }
                    }
                }
                i += BLOCK_LENGTH;

            }

            nesting_level--;
        }

        j--;
    }
    return 0;
}

func check_hovered_block(Point p, i, ignoreIdx) {
    local shape = b_shape($i);
    local x = b_x($i);
    local y = b_y($i);
    local width = b_width($i);
    local height = b_height($i);

    # check if in initial bounding box, making sure to check for hat blocks too
    if point_in_rect($p, Rect {x1: x - 5, y1: y - height, x2: x + width + 5, y2: y + 13}) and $ignoreIdx != i {
        if shape == "reporter" {
            local radius = height / 2;
            if point_in_circle($p, Point {x: x + radius, y: y - radius}, radius) or 
            point_in_circle($p, Point {x: x + width - radius, y: y - radius}, radius) or
            point_in_rect($p, Rect {x1: x + radius, y1: y - height, x2: x + width - radius, y2: y}) {
                return b_id($i);
            }
        } elif shape == "boolean" {
            local seg_l = height / 2; # segment length
            if point_in_tri($p, Tri {x1: x, y1: y - seg_l, x2: x + seg_l, y2: y, x3: x + seg_l, y3: y - height}) or
            point_in_tri($p, Tri {x1: x + width, y1: y - seg_l, x2: x + width - seg_l, y2: y, x3: x + width - seg_l, y3: y - height}) or
            point_in_rect($p, Rect {x1: x + seg_l, y1: y - height, x2: x + width - seg_l, y2: y}) {
                return b_id($i);
            }
        } elif shape == "stack" {
            log b_start_style($i);
            if point_in_rect($p, Rect {x1: x, x2: x + 8, y1: y - height, y2: y}) or
            point_in_rect($p, Rect {x1: x + 8, y1: y - height - 3, x2: x + 18, y2: y - 3}) or
            point_in_rect($p, Rect {x1: x + 18, y1: y - height, x2: x + width, y2: y}) or
            ((point_in_rect($p, Rect {x1: x, y1: y - 1, x2: x + 55, y2: y + 4}) or
            point_in_tri($p, Tri {x1: x, y1: y + 4, x2: x + 30, y2: y + 16, x3: x + 30, y3: y + 3}) or 
            point_in_tri($p, Tri {x1: x + 60, y1: y + 4, x2: x + 30, y2: y + 16, x3: x + 30, y3: y + 3})
            ) and b_start_style($i) == "hat") {
                return b_id($i);
            }
        } elif shape == "c" {
            local midy = y - b_prong_1_height($i) - b_slot_1_height($i) - c_block_prong_height;
            if point_in_rect($p, Rect {x1: x, x2: x + 8, y1: y - height, y2: y}) or
            point_in_rect($p, Rect {x1: x, x2: x + width, y1: y - b_prong_1_height($i), y2: y}) or 
            point_in_rect($p, Rect {x1: x, x2: x + width, y1: midy, y2: midy + c_block_prong_height}) or 
            point_in_rect($p, Rect {x1: x, x2: x + width, y1: midy - b_slot_2_height($i) - c_block_prong_height, y2: midy - b_slot_2_height($i)}) * (b_slot_count($i) > 1){
                return b_id($i);
            }
        }
    }
    return 0;
}

func find_hovered_input(x, y, id) {
    local Point p = Point {x: $x, y: $y};

    local counter = 0;
    local inputNum = 1;
    local idx = b_idx($id);
    repeat 3 {
        local offset = idx + b_inputs + counter;
        # checks if inputs[shape] > "", if so valid input
        # also check that there's not a nested block inside
        # if so, it's no editable so we can ignore it
        log "checking input " & inputNum;
        if (blocks[offset + b_input_shape] > "" and blocks[offset + b_input_nested_block] == "") {
            log "valid input " & inputNum;
            local shape = blocks[offset + b_input_shape];
            local bheight = if (b_shape(idx) == "c") b_prong_1_height(idx) else b_height(idx);
            local x = blocks[offset + b_input_x];
            local y = b_y(idx) - bheight / 2 + blocks[offset + b_input_height] / 2;
            local width = blocks[offset + b_input_width];
            local height = blocks[offset + b_input_height];
            log shape & ", " & x & ", " & y & ", " & width & ", " & height;
            if blocks[offset + b_input_shape] == "reporter" {
                local radius = height / 2;
                if point_in_circle(p, Point {x: x + radius, y: y - radius}, radius) or 
                point_in_circle(p, Point {x: x + width - radius, y: y - radius}, radius) or
                point_in_rect(p, Rect {x1: x + radius, y1: y - height, x2: x + width - radius, y2: y}) {
                    return inputNum;
                }
            }
        }

        counter += INPUT_LENGTH; # = number of properties in Input
        inputNum++;
    }

    return "";
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

proc add_block
        opcode="placeholder",
        shape,
        category,
        x,
        y,
        width,
        height,
        previous="",
        parent="",
        next="",
        slot_count="",
        prong_1_height="",
        prong_2_style="",
        prong_3_style="",
        end_style="",
        start_style="",
        slot_1_height="",
        slot_2_height="",
        slot_1_nested_block="",
        slot_2_nested_block="",
        TextLabel label1=TextLabel {},
        TextLabel label2=TextLabel {},
        TextLabel label3=TextLabel {},
        Input input1=Input {},
        Input input2=Input {},
        Input input3=Input {},
        nesting_level=0 {
        
    add $opcode to blocks;
    add $shape to blocks;
    add $category to blocks;
    add $x to blocks;
    add $y to blocks;
    add $width to blocks;
    add $height to blocks;
    add $previous to blocks;
    add $parent to blocks;
    add $next to blocks;
    add $nesting_level to blocks;
    add $slot_count to blocks;
    add $prong_1_height to blocks;
    add $prong_2_style to blocks;
    add $prong_3_style to blocks;
    add $end_style to blocks;
    add $start_style to blocks;
    add $slot_1_height to blocks;
    add $slot_2_height to blocks;
    add $slot_1_nested_block to blocks;
    add $slot_2_nested_block to blocks;

    add $label1.text to blocks; add $label1.x to blocks;
    add $label2.text to blocks; add $label2.x to blocks;
    add $label3.text to blocks; add $label3.x to blocks;

    add $input1.shape to blocks;
    add $input1.dropdown_shape to blocks;
    add $input1.dropdown_list to blocks;
    add $input1.x to blocks;
    add $input1.width to blocks;
    add $input1.height to blocks;
    add $input1.text to blocks;
    add $input1.nested_block to blocks;

    add $input2.shape to blocks;
    add $input2.dropdown_shape to blocks;
    add $input2.dropdown_list to blocks;
    add $input2.x to blocks;
    add $input2.width to blocks;
    add $input2.height to blocks;
    add $input2.text to blocks;
    add $input2.nested_block to blocks;

    add $input3.shape to blocks;
    add $input3.dropdown_shape to blocks;
    add $input3.dropdown_list to blocks;
    add $input3.x to blocks;
    add $input3.width to blocks;
    add $input3.height to blocks;
    add $input3.text to blocks;
    add $input3.nested_block to blocks;

    local blockID = length blocks / BLOCK_LENGTH;
    # if a block is not being added as part of a script, add it to roots
    if $parent == "" and $previous == "" {
        add blockID to roots;
    }
}

proc put_block_in_block childID, parentID, inputNumber, update_sizes=true {
    local parentIdx = b_idx($parentID);
    local childIdx = b_idx($childID);
    local x_change = get_block_idx_input(parentIdx, $inputNumber, b_input_x) - b_x(childIdx);
    local height = if (b_shape(parentIdx) == "c") b_prong_1_height(parentIdx) else b_height(parentIdx);
    local y_change = ((b_y(parentIdx) - height / 2) + (b_height(childIdx) / 2)) - b_y(childIdx);
    if b_shape(parentIdx) == "stack" or b_shape(parentIdx) == "c" {
        y_change += 0.5;
    }
    set_block_idx_input parentIdx, $inputNumber, b_input_nested_block, $childID;
    b_parent(childIdx) = $parentID;
    update_nesting_level childIdx;
    move_block_position childIdx, x_change, y_change;

    # when a block is put in another block, it is no longer a top level block, it is not a root
    if $childID in roots {
        delete roots[$childID in roots];
    }

    if ($update_sizes) {
        log "starting size change propagation " & $parentID;
        propagate_size_change $parentID;
    }
}

proc connect_stack_block connectID, childID, location {
    local prevIdx = b_idx($connectID);
    local parentIdx = b_idx($connectID);
    local childIdx = b_idx($childID);
    local stack_height = measure_stack_height($childID);

    if $childID in roots {
        delete roots[$childID in roots];
    }

    # location determines where the placement goes
    # 0 = top of stack block
    # 1 = bottom of stack or c block
    # 2 = top slot of c block
    # 3 = bottom slot of c block

    if $location == 0 {
        # when connecting to the top of a block, swap childID and connectID
        # to effectively connect it the other way around
        local prevIdx = b_idx($childID);
        local childIdx = b_idx($connectID);
        local stack_height = measure_stack_height($connectID);
        local x_change = b_x(prevIdx) - b_x(childIdx);
        local y_change = b_y(prevIdx) - b_height(prevIdx) - b_y(childIdx);
        move_block_position childIdx, x_change, y_change;
        inserting_in_middle = false;

        b_previous(childIdx) = $childID;

        # putting it in the middle of a stack
        # if the previous block start's out with a next,
        # we know there must be something after it
        if b_next(prevIdx) > "" {
            local last = b_idx(get_stack_bottom($connectID));
            local lastID = b_id(last);
            # we need to set the next block in the place we're inserting
            # to have the bottom block in our dragged stack as a previous
            log "last " & b_id(last);
            b_next(last) = b_next(prevIdx);
            b_previous(b_idx(b_next(last))) = b_id(last);
            inserting_in_middle = true;
        }
        b_next(prevIdx) = $connectID;
        b_parent(childIdx) = b_parent(prevIdx); # keep parent the same
        update_stack_parents $connectID, b_parent(childIdx);

        # if inserted in the middle of a stack, we need to move the blocks beneath us down
        if inserting_in_middle {
            log "moving lower stack down";
            move_block_position b_idx(b_next(last)), 0, -stack_height;
        }
        propagate_size_change b_parent(childIdx);
    } elif $location == 1 {
        local x_change = b_x(prevIdx) - b_x(childIdx);
        local y_change = b_y(prevIdx) - b_height(prevIdx) - b_y(childIdx);
        move_block_position childIdx, x_change, y_change;
        inserting_in_middle = false;

        b_previous(childIdx) = $connectID;

        # putting it in the middle of a stack
        # if the previous block start's out with a next,
        # we know there must be something after it
        if b_next(prevIdx) > "" {
            local last = b_idx(get_stack_bottom($childID));
            local lastID = b_id(last);
            # we need to set the next block in the place we're inserting
            # to have the bottom block in our dragged stack as a previous
            log "last " & b_id(last);
            b_next(last) = b_next(prevIdx);
            b_previous(b_idx(b_next(last))) = b_id(last);
            inserting_in_middle = true;
        }
        b_next(prevIdx) = $childID;
        b_parent(childIdx) = b_parent(prevIdx); # keep parent the same
        update_stack_parents $childID, b_parent(childIdx);

        # update end style for cap blocks
        update_c_end_styles b_idx(b_parent(childIdx));

        # if inserted in the middle of a stack, we need to move the blocks beneath us down
        if inserting_in_middle {
            log "moving lower stack down";
            move_block_position b_idx(b_next(last)), 0, -stack_height;
        }
        propagate_size_change b_parent(childIdx);
    } elif $location == 2 {
        local x_change = b_x(parentIdx) + c_x_offset - b_x(childIdx);
        local y_change = b_y(parentIdx) - b_prong_1_height(parentIdx) - b_y(childIdx);
        move_block_position childIdx, x_change, y_change;
        inserting_in_middle = false;

        b_parent(childIdx) = $connectID;

        # putting it in the middle of a stack
        # if the previous block start's out with a next,
        # we know there must be something after it
        if b_slot_1_nested_block(parentIdx) > "" {
            local last = b_idx(get_stack_bottom($childID));
            local lastID = b_id(last);
            # we need to set the next block in the place we're inserting
            # to have the bottom block in our dragged stack as a previous
            log "last " & b_id(last);
            b_next(last) = b_slot_1_nested_block(parentIdx);
            b_previous(b_idx(b_next(last))) = b_id(last);
            inserting_in_middle = true;
        }
        update_stack_parents $childID, $connectID;
        b_slot_1_nested_block(parentIdx) = $childID;
        # b_parent(childIdx) = b_parent(prevIdx); # keep parent the same

        # update end style for cap blocks
        b_prong_2_style(parentIdx) = b_end_style(b_idx(get_stack_bottom(b_slot_1_nested_block(parentIdx))));

        # if inserted in the middle of a stack, we need to move the blocks beneath us down
        if inserting_in_middle {
            log "moving lower stack down";
            move_block_position b_idx(b_next(last)), 0, -stack_height;
        }
        propagate_size_change b_parent(childIdx);
    } elif $location == 3 {
        local x_change = b_x(parentIdx) + c_x_offset - b_x(childIdx);
        local y_change = b_y(parentIdx) - b_prong_1_height(parentIdx) - b_slot_1_height(parentIdx) - c_block_prong_height - b_y(childIdx);
        move_block_position childIdx, x_change, y_change;
        inserting_in_middle = false;

        b_parent(childIdx) = $connectID;

        # putting it in the middle of a stack
        # if the previous block start's out with a next,
        # we know there must be something after it
        if b_slot_2_nested_block(parentIdx) > "" {
            local last = b_idx(get_stack_bottom($childID));
            local lastID = b_id(last);
            # we need to set the next block in the place we're inserting
            # to have the bottom block in our dragged stack as a previous
            log "last " & b_id(last);
            b_next(last) = b_slot_2_nested_block(parentIdx);
            b_previous(b_idx(b_next(last))) = b_id(last);
            inserting_in_middle = true;
        }
        update_stack_parents $childID, $connectID;
        b_slot_2_nested_block(parentIdx) = $childID;
        # b_parent(childIdx) = b_parent(prevIdx); # keep parent the same

        # update end style for cap blocks
        b_prong_3_style(parentIdx) = b_end_style(b_idx(get_stack_bottom(b_slot_2_nested_block(parentIdx))));

        # if inserted in the middle of a stack, we need to move the blocks beneath us down
        if inserting_in_middle {
            log "moving lower stack down";
            move_block_position b_idx(b_next(last)), 0, -stack_height;
        }
        propagate_size_change b_parent(childIdx);
    }
}

proc update_stack_parents startID, parent {
    # when connecting or disconnecting a stack of blocks,
    # we need to update the block's parent
    # start on the block after the current one
    local idx = b_idx($startID);
    local stop = false;
    log "starting parent updates: idx " & idx;
    until stop {
        log "updating: idx " & idx;
        b_parent(idx) = $parent;
        stop = b_next(idx) == "";
        idx = b_idx(b_next(idx));
    }
}

proc move_script_to_front blockIdx {
    local id = get_script_root($blockIdx);
    delete roots[id in roots]; # when a block is disconnected it's moved to the front
    add id to roots;
}

proc move_script_to_back blockIdx {
    local id = get_script_root($blockIdx);
    delete roots[id in roots]; # when a block is disconnected it's moved to the front
    insert id at roots[1];
}

func get_script_root(blockIdx) {
    local idx = $blockIdx;
    until b_parent(idx) == "" {
        idx = b_idx(b_parent(idx));
    }
    until b_previous(idx) == "" {
        idx = b_idx(b_previous(idx));
    }
    return b_id(idx);
}

proc disconnect_block blockID, shift=false {
    local blockIdx = b_idx($blockID);
    local parentID = b_parent(blockIdx);
    local parentIdx = b_idx(parentID);
    local prevIdx = b_idx(b_previous(blockIdx));
    if b_nesting_level(blockIdx) == 0 {
        b_next(prevIdx) = "";
        b_previous(blockIdx) = "";
        b_parent(blockIdx) = "";
        update_c_end_styles parentIdx;

        update_stack_parents b_next(blockIdx), b_parent(blockIdx);
        # b_next(blockIdx) = ""; # do this if you want to pick out this one stack block
        # b_previous(b_idx(b_next(blockIdx)));
    } else {
        b_parent(blockIdx) = "";
        # b_next(parentIdx) = "";
    }

    delete roots[$blockID in roots]; # when a block is disconnected it's moved to the front
    add $blockID to roots;

    if $shift {
        move_block_position blockIdx, 10, -10;
    }

    if b_nesting_level(blockIdx) == 0 {
        # if it's top level, it could only be in a c block
        # if so mark it as disconnected from that
        if b_slot_1_nested_block(parentIdx) == $blockID {b_slot_1_nested_block(parentIdx) = "";}
        if b_slot_2_nested_block(parentIdx) == $blockID {b_slot_2_nested_block(parentIdx) = "";}
    } else {
        # go through parent's inputs and disconnect all places the block is referenced
        if b_input1_nested_block(parentIdx) == $blockID {set_block_idx_input parentIdx, 1, b_input_nested_block, "";}
        if b_input2_nested_block(parentIdx) == $blockID {set_block_idx_input parentIdx, 2, b_input_nested_block, "";}
        if b_input3_nested_block(parentIdx) == $blockID {set_block_idx_input parentIdx, 3, b_input_nested_block, "";}
    }

    update_nesting_level blockIdx, useParent: false; # to make sure the nesting level is 0
    propagate_size_change parentID;
}

proc propagate_size_change blockID {
    local idx = b_idx($blockID);
    # if it's not a top-level block, update the block then propagate to the parent
    if b_nesting_level(idx) > 0 {
        log "updating block dimensions " & $blockID;
        update_block_dimensions $blockID;
        if b_parent(idx) > "" {
            propagate_size_change b_parent(idx);
        } else {
            # log "no parent, no propagating " & $blockID;
        }
    } else {
        log "updating stack block dimensions " & $blockID;
        local height_before = b_height(idx);
        update_block_dimensions $blockID;
        local height_change = b_height(idx) - height_before;
        log "height change " & height_change & " next " & b_next(idx);
        if b_next(idx) > "" {
            move_block_position b_idx(b_next(idx)), 0, -height_change;
            # shift_next_block_down b_idx(b_next(idx)), height_change;
        }

        # once we finish updating the size on the current block, go on to update any parents, like c blocks
        if b_parent(idx) > "" {
            propagate_size_change b_parent(idx);
        }
    }
}

proc shift_next_block_down blockIdx, amount {
    # log "shifting idx " & $blockIdx & " down " & $amount;
    # b_y($blockIdx) -= $amount;
    move_block_position $blockIdx, 0, -$amount;
    # log "next block " & b_next($blockIdx);
    # if b_next($blockIdx) > "" {
    #     shift_next_block_down b_idx(b_next($blockIdx)), $amount;
    # }
}

proc update_nesting_level bIdx, useParent=true {
    if $useParent {
        # get nesting level from parent and increment
        b_nesting_level($bIdx) = b_nesting_level(b_idx(b_parent($bIdx))) + 1;
    } else {
        # we want to allow setting the nesting level to 0 initally,
        # if updating a top level reporter/boolean block instead of a nested block
        b_nesting_level($bIdx) = 0;
    }
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
proc update_block_dimensions blockID, should_move_c_inputs=true, update_preview=false {
    # order text + inputs by x, left -> right
    # get width of each item, keeping track of a cumulative x position and adding padding
    # if input is a block, include that width
    # block height = tallest input + 2px padding top and bottom
    # update positions of items as needed
    # update total block with when done

    if $blockID == h_c_placement.previewID and $update_preview == false {
        stop_this_script;
    }

    delete tmp_item_order;
    local blockIdx = b_idx($blockID);
    local bshape = b_shape(blockIdx);

    local counter = 0;
    local index = 1;
    local repeat_count = if (bshape == "c") 2 else 3; # ignore the last text label for c blocks since it would be "else" which is handled separately
    repeat repeat_count {
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

    local start_x = b_x(blockIdx);
    local current_x = start_x;
    local block_starting_height = b_height(blockIdx);
    local block_total_height = if (bshape == "stack" or bshape == "c") 21 else 16;

    if bshape == "c" {
        # we want to measure the current position of the two block stacks,
        # so when finished resizing we can move them to the correct spots
        local starting_slot_1_y = b_y(blockIdx) - b_prong_1_height(blockIdx);
        if b_slot_count(blockIdx) > 1 {
            local starting_slot_2_y = b_y(blockIdx) - b_prong_1_height(blockIdx) - b_slot_1_height(blockIdx) - c_block_prong_height;
        }
    }

    local i = 1;
    repeat length tmp_item_order {
        local TMPInput item = tmp_item_order[i];
        if (item.index <= 3) {
            local text = get_block_idx_label(blockIdx, item.index, b_label_text);
            local text_width = width_of_text(text, 1) - 1;
            if text == "if" and bshape == "c" {
                text_width += 7;
            }

            if (current_x == start_x) {
                if bshape == "boolean" {
                    current_x += boolean_edge_padding;
                } else {
                    current_x += start_padding;
                }
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
                shape = b_shape(b_idx(nested_block));
                local input_width = b_width(b_idx(nested_block));
                local input_height = b_height(b_idx(nested_block)) + 4; # = top and bottom padding
                if bshape == "stack" or bshape == "c" {
                    input_height += 2;
                }
                if (input_height > block_total_height) { # expand the parent block's height if necessary
                    block_total_height = input_height;
                    if bshape == "c" {
                        # we don't want to update the block's total height,
                        # just the first prong's height we're measuring
                        b_prong_1_height(blockIdx) = block_total_height;
                    } else {
                        b_height(blockIdx) = block_total_height; # update block height
                    }
                }
                # log "nested input width: " & input_width;
            } else {
                if (shape == "reporter") {
                    local text = get_block_idx_input(blockIdx, inputNum, b_input_text);
                    # log "handling text: " & text;
                    local input_width = MAX(16, width_of_text(text, 1) + text_padding * 2); # minimum input width of 16
                    if get_block_idx_input(blockIdx, inputNum, b_input_dropdown_shape) > "" { # if there's a dropdown, add extra padding for the arrow
                        input_width += 12;
                    }
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
                if (bshape == shape) {
                    current_x += edge_padding_same;
                } elif (bshape == "boolean") { # add more padding to boolean blocks
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
        if (bshape == shape) {
            current_x += edge_padding_same;
        } elif (bshape == "boolean") { # add more padding to the end of boolean blocks
            # have to add this or else the padding isn't the same as the start, and there isn't enough
            current_x += boolean_edge_padding;
        } else {
            current_x += end_padding_other;
        }
    } else {
        if (bshape == "boolean") { # add more padding to boolean blocks
            current_x += boolean_edge_padding;
        } else {
            current_x += end_padding;
        }
    }
    local total_width = current_x - start_x;
    if bshape == "c" {
        total_width = MAX(c_block_min_width, total_width);
    }
    b_width(blockIdx) = total_width;

    if bshape == "c" {
        b_prong_1_height(blockIdx) = block_total_height;
    } else {
        b_height(blockIdx) = block_total_height; # update block height
    }

    # after updating block width, go over all embedded blocks and reposition them
    # we need to move the block to center it vertically in the input
    # since the y position stays the same otherwise
    # additionally we need to update the x if something was inserted in an earlier input

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

    # c block handling
    if bshape == "c" {
        # we need to measure the slot heights and calculate the block's total height
        b_slot_1_height(blockIdx) = MAX(c_block_min_slot_height, measure_stack_height(b_slot_1_nested_block(blockIdx)));
        if b_slot_count(blockIdx) > 1 {
            b_slot_2_height(blockIdx) = MAX(c_block_min_slot_height, measure_stack_height(b_slot_2_nested_block(blockIdx)));
        }

        b_height(blockIdx) =
            b_prong_1_height(blockIdx) + 
            b_slot_1_height(blockIdx) +
            c_block_prong_height +
            ((b_slot_2_height(blockIdx) +
            c_block_prong_height) * (b_slot_count(blockIdx) > 1));
        
        # local height_change = b_height(blockIdx) - block_starting_height;
        # log "height change " & height_change;
        local slot_1_y_change = (b_y(blockIdx) - b_prong_1_height(blockIdx)) - starting_slot_1_y;
        if b_slot_count(blockIdx) > 1 {
            local slot_2_y_change = (b_y(blockIdx) - b_prong_1_height(blockIdx) - b_slot_1_height(blockIdx) - c_block_prong_height) - starting_slot_2_y;
        }
        # log block_starting_height;
        # log block_total_height;
        if $should_move_c_inputs {
            if (b_slot_1_nested_block(blockIdx) > "") {move_block_position b_idx(b_slot_1_nested_block(blockIdx)), 0, slot_1_y_change;}
            if (b_slot_2_nested_block(blockIdx) > "") {move_block_position b_idx(b_slot_2_nested_block(blockIdx)), 0, slot_2_y_change;}
        }
    }
}

func measure_stack_height(startID) {
    local total_height = 0;
    local idx = b_idx($startID);
    local end_reached = false;
    until end_reached {
        total_height += b_height(idx);
        end_reached = b_next(idx) == "";
        idx = b_idx(b_next(idx));
    }
    return total_height;
}

func get_stack_bottom(startID) {
    local idx = b_idx($startID);
    # if there's only one block, we might want to stop immediately
    local end_reached = b_next(idx) == "";
    until end_reached {
        idx = b_idx(b_next(idx));
        end_reached = b_next(idx) == "";
    }
    return b_id(idx);
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

proc move_block_position bIdx, x_change, y_change, moveStack=true {
    b_x($bIdx) += $x_change;
    b_y($bIdx) += $y_change;

    if (b_label1_x($bIdx) > "") {b_label1_x($bIdx) += $x_change;}
    if (b_label2_x($bIdx) > "") {b_label2_x($bIdx) += $x_change;}
    if (b_label3_x($bIdx) > "") {b_label3_x($bIdx) += $x_change;}
    if (b_input1_shape($bIdx) > "") {b_input1_x($bIdx) += $x_change;}
    if (b_input2_shape($bIdx) > "") {b_input2_x($bIdx) += $x_change;}
    if (b_input3_shape($bIdx) > "") {b_input3_x($bIdx) += $x_change;}
    if (b_input1_nested_block($bIdx) > "") {move_block_position b_idx(b_input1_nested_block($bIdx)), $x_change, $y_change;}
    if (b_input2_nested_block($bIdx) > "") {move_block_position b_idx(b_input2_nested_block($bIdx)), $x_change, $y_change;}
    if (b_input3_nested_block($bIdx) > "") {move_block_position b_idx(b_input3_nested_block($bIdx)), $x_change, $y_change;}
    if (b_slot_1_nested_block($bIdx) > "") {move_block_position b_idx(b_slot_1_nested_block($bIdx)), $x_change, $y_change;}
    if (b_slot_2_nested_block($bIdx) > "") {move_block_position b_idx(b_slot_2_nested_block($bIdx)), $x_change, $y_change;}

    if b_nesting_level($bIdx) == 0 and b_next($bIdx) > "" and $moveStack {
        move_block_position b_idx(b_next($bIdx)), $x_change, $y_change, $moveStack;
    }
}