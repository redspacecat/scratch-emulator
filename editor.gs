%include code/PTE_font

%include std/list
%include std/math

%include code/helpful_utils
%include code/block_palette_parser
%include code/save_and_load_sprites
%include code/compiler

hide;

%define base_boolean_width 18

list local_vars;
list global_vars;
list local_lists;
list global_lists;

list dropdown_data_lists "assets/data/dropdowns.txt";

var first_time = true; # for storing whether it's the first time initializing since the project was loaded

enum Padding {
    base=5, # padding between elements
    start=5, # padding at the start of a block
    end=4, # padding at the end of a block
    reporter_edge_same=2, # padding where the block shape and input shape are both reporters
    boolean_edge_same=3, # padding where the block shape and input shape are both booleans
    end_other=5, # end padding for ending on other inputs
    text_padding=4, # padding around text in inputs
    boolean_edge=8, # padding around edges of boolean blocks
}

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

proc init_editor all { # all param is for initializing the editor for the first time, when project is first loaded
    delete roots;
    delete dragged_blocks;
    delete local_vars;
    delete local_lists;

    if $all {
        first_time = false;

        delete blocks;
        delete global_vars;
        delete global_lists;

        delete sprites;
        add Sprite {name: "Cat", costume: 1, blocks: "", vars: "", lists: ""} to sprites;
        add Sprite {name: "Dango Cat", costume: 10, blocks: "", vars: "", lists: ""} to sprites;
        add Sprite {name: "Gobo", costume: 4, blocks: "", vars: "", lists: ""} to sprites;

        parse_block_palette;
        create_palette_lookup;

        selected_sprite = 1;
        highlighted_sprite = "";

        init_blocks;
        handle_palette_vars;
        handle_palette_lists;

        switch_selected_sprite 1;
        auto_lag_mode_change = true;
    }

    target_palette_x = 0;
    target_palette_y = 0;
    target_palette_x_time = 0;
    target_palette_y_time = 0;
    target_sprites_x = 0;
    target_sprites_x_time = 0;
    no_category_switch = 0;
    
    dropdown = 0;

    dragged_block = 0;
    dragged_script_idx = 0;
    dragged_stack_end = 0;
    highest_nesting_level = 0;
    highlight_lightly = false;
    InputRank highlighted_input = InputRank {};
    InputRank highlighted_conn = InputRank {};
    PreviewBlock h_c_placement = PreviewBlock {};

    load_sprite selected_sprite;

    redraw;
}

onflag {
    erase_all;
    if RUNNING {
        RUNNING = false;

        broadcast "start_editor";
    } else {
        RUNNING = true;

        compile;
        broadcast_and_wait "create_sprites";
        broadcast_and_wait "init_runtime";
        broadcast_and_wait "run";

        wait 0.5;

        broadcast_and_wait "stop_program";
        RUNNING = false;

        broadcast "start_editor";
    }
}

on "start_editor" {
    init_editor first_time;
    broadcast "render_loop";
    broadcast "input_loop";
    broadcast "sidebar_display_loop";

    if not $tw_is_turbowarp {
        broadcast "lag_mode_checker";
    }
}

list past_fps;
on "lag_mode_checker" {
    delete past_fps;
    repeat 5 {
        fps_count = 0;
        start_timer = timer();
        until timer() > start_timer + 1 {
            fps_count++;
        }
        insert fps_count at past_fps[1];
    }

    check_past_fps;

    wait 15;
    broadcast "lag_mode_checker";
}

proc check_past_fps {
    local i = 1;
    local avg_fps = 0;
    repeat length past_fps {
        if past_fps[i] > "" {
            avg_fps += past_fps[i];
            i++;
        }
    }
    avg_fps = avg_fps / length past_fps;
    if avg_fps < 27 and auto_lag_mode_change {
        set_lag_mode true;
    }
}

proc set_lag_mode state {
    LAG_MODE = $state;
    PALETTE_MAX_X = if ($state) 16 else 0;
}

onkey "s" {
    if RUNNING {
        stop_this_script;
    }
    LAG_MODE = 1 - LAG_MODE;
    auto_lag_mode_change = false;
    if LAG_MODE {
        PALETTE_MAX_X = 16;
    } else {
        PALETTE_MAX_X = 0;
    }
}

onkey "l" {
    if RUNNING {
        stop_this_script;
    }
    ask "New local variable name?";
    if answer() > "" and not (answer() in local_vars or answer() in global_vars) {
        new_variable "local", answer();
    }
}

onkey "g" {
    if RUNNING {
        stop_this_script;
    }
    ask "New global variable name?";
    if answer() > "" and not (answer() in local_vars or answer() in global_vars) {
        new_variable "global", answer();
    }
}

onkey "n" {
    if RUNNING {
        stop_this_script;
    }
    ask "New local list name?";
    if answer() > "" and not (answer() in local_lists or answer() in global_lists) {
        new_list "local", answer();
    }
}

onkey "m" {
    if RUNNING {
        stop_this_script;
    }
    ask "New global list name?";
    if answer() > "" and not (answer() in local_lists or answer() in global_lists) {
        new_list "global", answer();
    }
}

onkey "e" {
    if RUNNING {
        stop_this_script;
    }
    ask "New message name?";
    if answer() > "" and not (answer() in broadcasts or answer() in broadcasts) {
        add answer() to broadcasts;
    }
}

onkey "up arrow" {
    if RUNNING {
        stop_this_script;
    }
    if not key_pressed("up arrow") {
        scroll_y 20;
        redraw;
    }
}

onkey "down arrow" {
    if RUNNING {
        stop_this_script;
    }
    if not key_pressed("down arrow") {
        scroll_y -20;
        redraw;
    }
}

proc scroll_y amount {
    if dropdown > 0 {
        if point_in_rect(Point {x: mouse_x(), y: mouse_y()}, Rect {x1: dropdown_x, y1: dropdown_y - dropdown_height + 1, x2: dropdown_x + dropdown_width, y2: dropdown_y}) {
            dropdown_scroll += $amount;
            if dropdown_scroll > 0 {
                dropdown_scroll = 0;
            }
            if dropdown_scroll < length dropdown_data * -20 + dropdown_height {
                dropdown_scroll = length dropdown_data * -20 + dropdown_height;
            }
            dropdown_hovered = floor((dropdown_y - mouse_y() - dropdown_scroll) / 20);
        }
    } else {
        if mouse_x() < PALETTE_MAX_X and PALETTE_SHOWN {
            PALETTE_SCROLL_Y += $amount;
            if PALETTE_SCROLL_Y < palette_y_max {
                PALETTE_SCROLL_Y = palette_y_max;
            }
        } else {
            SCROLL_Y += $amount;
        }
    }
    redraw;
}

on "render_loop" {
    forever {
        broadcast "render_editor";
    }
}

list InputRank tmp_input_ranking;
list block_scripts;

on "input_loop" {
    forever {
        handle_input;
    }
}

on "sidebar_display_loop" {
    forever {
        # input
        if key_pressed("left arrow") {
            SCROLL_X -= 15;
            redraw;
        }
        if key_pressed("right arrow") {
            SCROLL_X += 15;
            redraw;
        }
        if key_pressed("up arrow") {
            scroll_y 15;
        }
        if key_pressed("down arrow") {
            scroll_y -15;
        }

        # palette handling
        if mouse_x() < PALETTE_MIN_X and mouse_y() < 180 and PALETTE_SHOWN == false and target_palette_x_time == 0 {
            PALETTE_SHOWN = true;
            PALETTE_SCROLL_X = 150;
            target_palette_x = 0;
            
            if LAG_MODE {
                target_palette_x_time = 1;
            } else {
                target_palette_x_time = 10;
            }
        }
        if (mouse_x() > PALETTE_HIDE_X or mouse_y() > 179) and PALETTE_SHOWN == true and target_palette_x_time == 0 {
            target_palette_x = 220;
            close_dropdown;

            if LAG_MODE {
                target_palette_x_time = 1;
            } else {
                target_palette_x_time = 6;
            }
        }

        if target_palette_y_time > 0 {
            PALETTE_SCROLL_Y += round((target_palette_y - PALETTE_SCROLL_Y) / 2.5);
            target_palette_y_time--;
        }
        if target_palette_x_time > 0 {
            PALETTE_SCROLL_X += round((target_palette_x - PALETTE_SCROLL_X) / 2.5);
            target_palette_x_time--;
            redraw;
            if target_palette_x_time == 0 and target_palette_x > 0 {
                PALETTE_SHOWN = false;
            }
            if target_palette_x_time == 0 and target_palette_x == 0 {
                PALETTE_SCROLL_X = 0;
            }
        }
        if no_category_switch > 0 {
            no_category_switch--;
        }

        # sprite list
        if mouse_x() > 235 and SPRITES_SHOWN == false and target_sprites_x_time == 0 {
            SPRITES_SHOWN = true;
            SPRITES_SCROLL_X = 100;
            target_sprites_x = 0;
            if LAG_MODE {
                target_sprites_x_time = 1;
            } else {
                target_sprites_x_time = 8;
            }
        }
        if mouse_x() < SPRITES_MIN_X and SPRITES_SHOWN == true and target_sprites_x_time == 0 {
            target_sprites_x = 80;
            if LAG_MODE {
                target_sprites_x_time = 1;
            } else {
                target_sprites_x_time = 8;
            }
        }

        if target_sprites_x_time > 0 {
            SPRITES_SCROLL_X += round((target_sprites_x - SPRITES_SCROLL_X) / 2.5);
            target_sprites_x_time--;
            redraw;
            if target_sprites_x_time == 0 and target_sprites_x > 0 {
                SPRITES_SHOWN = false;
            }
            if target_sprites_x_time == 0 and target_sprites_x == 0 {
                SPRITES_SCROLL_X = 0;
            }
        }

        if SPRITES_SHOWN {
            if dragged_block > 0 {
                highlighted_sprite = "";
            } else {
                highlighted_sprite = find_hovered_sprite(mouse_x(), mouse_y());
                get_sprite_hovered_text mouse_x(), mouse_y();
            }
        }

        if not LAG_MODE {
            redraw;
        }
    }
}

func find_hovered_sprite(x, y) {
    local i = 1;
    local x = 170 + 3 + SPRITES_SCROLL_X;
    local y = 155 + 3 - SPRITES_SCROLL_Y;
    repeat length sprites {
        if point_in_rect(Point {x: $x, y: $y}, Rect {x1: x, x2: x + 65 - 6, y1: y - 65, y2: y - 6}) {
            return i;
        }
        i++;
        y -= 67;
    }
    return "";
}

proc get_sprite_hovered_text x, y { # checks if the sprite's name in the sprite menu is hovered over
    sprite_name_underline = "";
    local i = 1;
    local x = 170 + 3 + SPRITES_SCROLL_X;
    local y = 155 + 3 - SPRITES_SCROLL_Y;
    repeat length sprites {
        if point_in_rect(Point {x: $x, y: $y}, Rect {x1: x, x2: x + 65 - 6, y1: y - 65, y2: y - 50}) {
            sprite_name_underline = i;
        }
        i++;
        y -= 67;
    }
}

nowarp proc handle_input {
    wait_until(mouse_down());
    if mouse_x() > SPRITES_MIN_X and SPRITES_SHOWN {
        wait_until(not mouse_down());
        local clicked_sprite = find_hovered_sprite(mouse_x(), mouse_y());
        log "clicked on sprite " & clicked_sprite;
        if clicked_sprite > "" {
            if clicked_sprite == selected_sprite {
                if sprite_name_underline > "" {
                    ask "Enter new name for sprite \"" & sprites[selected_sprite].name & "\" (enter nothing to cancel)";
                    if answer() > "" {
                        sprites[selected_sprite].name = answer();
                    }
                } elif point_in_circle(
                    Point {x: mouse_x() + SPRITES_SCROLL_X, y: mouse_y() - SPRITES_SCROLL_Y},
                    Point {x: 170 + 57 + SPRITES_SCROLL_X, y: (155 - (67 * (selected_sprite - 1))) - 6 - SPRITES_SCROLL_Y},
                    11) and length sprites > 1 {
                    ask "Are you sure you want to delete the sprite \"" & sprites[selected_sprite].name & "\"? (y/n)";
                    if "y" in answer() {
                        delete sprites[selected_sprite];
                        switch_selected_sprite 1;
                    }
                }
            } else {
                switch_selected_sprite clicked_sprite;
            }
        }
    } elif mouse_x() < PALETTE_MIN_X and dragged_block == 0 {
        clicked_category = floor((177 - mouse_y()) / 30) + 1;
        if clicked_category <= length category_y {
            target_palette_y = category_y[clicked_category];
            target_palette_y_time = 20;
        }
    } else {
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
                    # hovered input, prompt to edit input
                    highlight_lightly = true;
                    InputRank highlighted_input = InputRank {block: hovered_block, input: hovered_input};
                    redraw;
                    if get_block_input(hovered_block, hovered_input, b_input_dropdown_shape) {
                        # open dropdown menu
                        dropdown = hovered_block;
                        dropdown_input = hovered_input;
                        dropdown_scroll = 0;
                        open_dropdown;

                        bx = b_x(dropdown) - scroll_x_offset;
                        by = b_y(dropdown) - scroll_y_offset;
                        dropdown_height = MIN(140, length dropdown_data * 20);
                        if by - b_height(dropdown) - 10 - dropdown_height < -175 { # goes off bottom of screen
                            dropdown_direction = 1; # 1 is up
                            dropdown_y = by + 12 + dropdown_height;
                            dropdown_offset = -10;
                        } else {
                            dropdown_direction = 0; # 0 is down
                            dropdown_y = by - b_height(dropdown) - 10;
                            dropdown_offset = 10;
                        }
                        dropdown_input_x = get_block_input(dropdown, dropdown_input, b_input_x) - scroll_x_offset + get_block_input(dropdown, dropdown_input, b_input_width) / 2; # center of dropdown input
                        dropdown_x = dropdown_input_x - dropdown_width / 2;
                        # keep dropdown within screen area
                        if dropdown_x < -200 {
                            dropdown_x = -200;
                        }
                        if dropdown_x + dropdown_width > 235 {
                            dropdown_x = 235 - dropdown_width;
                        }
                        if dropdown_input_x < -192 {
                            dropdown_input_x = -192;
                        }
                        if dropdown_input_x > 228 {
                            dropdown_input_x = 228;
                        }

                        until mouse_down() {
                            set_dropdown_hovered;
                            redraw;
                        }
                        until not mouse_down() {
                            set_dropdown_hovered;
                            redraw;
                        }
                        if point_in_rect(Point {x: mouse_x(), y: mouse_y()}, Rect {x1: dropdown_x, y1: dropdown_y - dropdown_height + 1, x2: dropdown_x + dropdown_width, y2: dropdown_y}) {
                            dropdown_hovered = floor((dropdown_y - mouse_y() - dropdown_scroll) / 20);
                            set_block_input hovered_block, hovered_input, b_input_text, dropdown_data[dropdown_hovered + 1];
                            propagate_size_change hovered_block;
                        }

                        close_dropdown;
                        redraw;
                    } else {
                        # edit block text
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
                            if get_block_input(hovered_block, hovered_input, b_input_type) == b_input_type_number {
                                inputted_text = filter_only_numbers(inputted_text);
                            }
                            set_block_input hovered_block, hovered_input, b_input_text, inputted_text;
                            propagate_size_change hovered_block;
                        }
                        InputRank highlighted_input = InputRank {};
                        highlight_lightly = false;
                        redraw;
                    }
                }
            } else {
                # dragging block
                if over_palette and hovered_block < PALETTE_END {
                    dragged_block = duplicate_block(hovered_block);
                    scroll_x_offset = SCROLL_X;
                    scroll_y_offset = SCROLL_Y;
                } else {
                    dragged_block = hovered_block;
                }
                drag_offset_x = mx - (b_x(dragged_block) + scroll_x_offset);
                drag_offset_y = my - (b_y(dragged_block) + scroll_y_offset);
                disconnect_block dragged_block;
                dragged_script_idx = get_script_root(dragged_block); # stores the dragged block's root script idx
                dragged_stack_end = get_stack_bottom(dragged_block);
                find_dragged_blocks dragged_block;
                while(mouse_down()) {
                    handle_drag;
                    redraw;
                }
                if mouse_x() < PALETTE_MAX_X and ((target_palette_x == 0 and PALETTE_SHOWN) or (target_palette_x_time > 5)) {
                    delete_block_stack dragged_block;
                    no_category_switch = 2;
                } else {
                    if highlighted_input.block > "" {
                        if get_block_input(highlighted_input.block, highlighted_input.input, b_input_nested_block) > "" {
                            # if there's a currently embedded block, we need to disconnect it
                            # to get rid of its parent reference
                            disconnect_block get_block_input(highlighted_input.block, highlighted_input.input, b_input_nested_block), shift: true;
                        }
                        put_block_in_block parentIdx: highlighted_input.block, childIdx: dragged_block, inputNumber: highlighted_input.input;
                        # when a block is put into an input, it brings that script to the front
                        move_script_to_front highlighted_input.block;
                        highlighted_input = InputRank {};
                        highlighted_input_nested_block = "";
                    }
                    if highlighted_conn.block > "" {
                        # if the preview placement block exists while we are
                        # trying to place the actual block, remove it
                        if h_c_placement.preview_idx > "" {
                            delete_block h_c_placement.preview_idx, true;
                        }
                        PreviewBlock h_c_placement = PreviewBlock {};

                        connect_stack_block connectIdx: highlighted_conn.block, childIdx: dragged_block, location: highlighted_conn.input;
                        move_script_to_front highlighted_conn.block;
                        InputRank highlighted_conn = InputRank {};
                    }
                }
                dragged_block = 0;
                dragged_script_idx = 0;
                dragged_stack_end = 0;
                delete dragged_blocks;

                redraw;
            }
        } else {
            if not (PALETTE_SHOWN or SPRITES_SHOWN) {
                # if not moving a block, drag the code area
                mx = mouse_x();
                my = mouse_y();
                until not mouse_down() {
                    SCROLL_X -= mouse_x() - mx;
                    SCROLL_Y -= mouse_y() - my;
                    mx = mouse_x();
                    my = mouse_y();
                    redraw;
                }
            }
        }
    }
}

proc set_dropdown_hovered {
    if point_in_rect(Point {x: mouse_x(), y: mouse_y()}, Rect {x1: dropdown_x, y1: dropdown_y - dropdown_height + 1, x2: dropdown_x + dropdown_width, y2: dropdown_y}) {
        dropdown_hovered = floor((dropdown_y - mouse_y() - dropdown_scroll) / 20);
    } else {
        dropdown_hovered = -1;
    }
    dropdown_offset += (0 - dropdown_offset) / 2.5;
}

proc handle_drag no_recurse=false {
    start_time = days_since_2000();

    mx = mouse_x() + SCROLL_X;
    my = mouse_y() + SCROLL_Y;
    target_x = mx - drag_offset_x - SCROLL_X;
    target_y = my - drag_offset_y - SCROLL_Y;
    move_block_position dragged_block, target_x - b_x(dragged_block), target_y - b_y(dragged_block);

    t_shape = b_shape(dragged_block);
    t_x = b_x(dragged_block);
    t_y = b_y(dragged_block);
    if t_shape != "stack" and t_shape != "c" {
        t_y -= b_height(dragged_block) / 4;
    }

    delete tmp_input_ranking;
    local i = PALETTE_END;
    repeat length blocks / BLOCK_LENGTH {
        if blocks[i] > "" {
            if PALETTE_SHOWN == false or (PALETTE_SHOWN == true and mouse_x() >= PALETTE_MAX_X) {
                if i not in dragged_blocks and i != h_c_placement.preview_idx { # avoid blocks we're currently holding and the preview placement block
                    if t_shape == "stack" or t_shape == "c" {
                        # stack block, try to find valid places to connect it
                        local target_height = b_height(i);
                        if point_in_rect(Point {x: t_x, y: t_y}, Rect {x1: b_x(i) - 20, y1: b_y(i) - target_height - 20, x2: b_x(i) + 20, y2: b_y(i) + 40}) {
                            local s = b_shape(i);
                            if s == "stack" or s == "c" {
                                if b_start_style(dragged_block) != "hat" {
                                    # prevent cap blocks being put in the middle of a stack
                                    # allow if the next is the preview block, since it's the block
                                    # we're planning to place anyway. causes flickering between choices otherwise
                                    if (b_end_style(dragged_stack_end) == "cap" and (b_next(i) == "" or b_next(i) == h_c_placement.preview_idx)) or b_end_style(dragged_stack_end) != "cap" {
                                        # prevent attaching to the end of cap blocks
                                        if b_end_style(i) != "cap" {
                                            log "start style " & b_start_style(i);
                                            add InputRank {
                                                dist: DIST(t_x, t_y, b_x(i), b_y(i) - target_height),
                                                block: i,
                                                input: 1 # bottom of block
                                            } to tmp_input_ranking;
                                        }
                                    }
                                }

                                # disabled top of block connections for now, finish full implementation later
                                # if b_parent(i) == "" and b_previous(i) == "" {
                                #     add InputRank {
                                #         dist: DIST(t_x, t_y - b_height(dragged_block), b_x(i), b_y(i)),
                                #         block: i,
                                #         input: 0 # top of block
                                #     } to tmp_input_ranking;
                                # }
                            }
                            if b_shape(i) == "c" and b_start_style(dragged_block) != "hat" { # don't allow hat blocks where they shouldn't go
                                # prevent cap blocks being put in the middle of a stack
                                if (b_end_style(dragged_stack_end) == "cap" and (b_slot_1_nested_block(i) == "" or b_slot_1_nested_block(i) == h_c_placement.preview_idx)) or b_end_style(dragged_stack_end) != "cap" {
                                    add InputRank {
                                        dist: DIST(t_x, t_y, b_x(i), b_y(i) - b_prong_1_height(i)),
                                        block: i,
                                        input: 2 # top slot of c block
                                    } to tmp_input_ranking;
                                }

                                if b_slot_count(i) > 1 {
                                    if (b_end_style(dragged_stack_end) == "cap" and (b_slot_2_nested_block(i) == "" or b_slot_2_nested_block(i) == h_c_placement.preview_idx)) or b_end_style(dragged_stack_end) != "cap" {
                                        add InputRank {
                                            dist: DIST(t_x, t_y, b_x(i), b_y(i) - b_prong_1_height(i) - b_slot_1_height(i) - c_block_prong_height),
                                            block: i,
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
                                if is_input_valid(b_shape(dragged_block), blocks[offset + b_input_shape], blocks[offset + b_input_dropdown_shape]) {
                                    if abs(t_x - blocks[offset + b_input_x]) < 40 and abs(t_y - (b_y(i) - target_height / 2)) < 40 {
                                        add InputRank {
                                            dist: DIST(t_x, t_y, blocks[offset + b_input_x], b_y(i) - target_height / 2),
                                            block: i,
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
            if h_c_placement.block_idx == "" or h_c_placement.block_idx != tmp_input_ranking[1].block or h_c_placement.input != tmp_input_ranking[1].input {
                log "updating placement preview";
                # delete old placement first
                if h_c_placement.preview_idx > "" {
                    delete_block h_c_placement.preview_idx, true;
                }
                add_block
                    shape: b_shape(dragged_block),
                    category: Category.Preview,
                    x: 0,
                    y: 0,
                    width: b_width(dragged_block),
                    height: b_height(dragged_block),
                    slot_count: b_slot_count(dragged_block),
                    prong_1_height: b_prong_1_height(dragged_block),
                    prong_2_style: b_prong_2_style(dragged_block),
                    prong_3_style: b_prong_3_style(dragged_block),
                    end_style: b_end_style(dragged_block);
                PreviewBlock h_c_placement = PreviewBlock {preview_idx: last_block_idx, block_idx: highlighted_conn.block, input: highlighted_conn.input};
                update_block_dimensions h_c_placement.preview_idx, update_preview: true, extension: b_category(dragged_block) == Category.Extensions;
                # log b_width(dragged_block);
                b_width(h_c_placement.preview_idx) = b_width(dragged_block);
                # log highlighted_conn.block & " - " & h_c_placement.preview_idx;
                connect_stack_block connectIdx: highlighted_conn.block, childIdx: h_c_placement.preview_idx, location: highlighted_conn.input;
                propagate_size_change h_c_placement.preview_idx;
            }
        } else {
            if $no_recurse {
                stop_this_script;
            }
            InputRank highlighted_conn = InputRank {};
            if h_c_placement.preview_idx > "" {
                delete_block h_c_placement.preview_idx, true;
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
            highlighted_input_nested_block = get_block_input(highlighted_input.block, highlighted_input.input, b_input_nested_block); # if there's a block in the input we want it so we can render a custom border around it if highlighted
        } else {
            InputRank highlighted_input = InputRank {};
            highlighted_input_nested_block = "";
        }
    }

    # log (days_since_2000() - start_time) * 86400000 & " ms/call";
}

proc open_dropdown {
    delete dropdown_data;
    max_text_width = 0;
    local i = (get_block_input(dropdown, dropdown_input, b_input_dropdown_list) in dropdown_data_lists) + 1;
    until dropdown_data_lists[i] == "" {
        local t = dropdown_data_lists[i];
        if t[1] == "$" and t[length t] == "$" {
            # if special dropdown list
            handle_custom_dropdown t;
        } else {
            add_dropdown_item t;
        }
        i++;
    }
    if length dropdown_data == 0 {
        add "" to dropdown_data;
    }
    dropdown_width = MAX(90, max_text_width + 40);
}

list tmp_all; # for temporarily combining local and global variables and lists

proc handle_custom_dropdown t {
    if $t == "$sprites$" {
        local i = 1;
        repeat length sprites {
            add_dropdown_item sprites[i].name;
            i++;
        }
    } elif $t == "$costumes$" {
        local i = 1;
        repeat length costume_names {
            add_dropdown_item costume_names[i];
            i++;
        }
    } elif $t == "$sounds$" {
        local i = 1;
        repeat length sound_names {
            add_dropdown_item sound_names[i];
            i++;
        }
    } elif $t == "$messages$" {
        local i = 1;
        repeat length broadcasts {
            add_dropdown_item broadcasts[i];
            i++;
        }
    } elif $t == "$variables$" or $t == "$lists$" {
        delete tmp_all;
        if $t == "$variables$" {
            EXTEND(local_vars, tmp_all);
            EXTEND(global_vars, tmp_all);
        } else {
            EXTEND(local_lists, tmp_all);
            EXTEND(global_lists, tmp_all);
        }
        INSERTION_SORT(tmp_all);

        local i = 1;
        repeat length tmp_all {
            add_dropdown_item tmp_all[i];
            i++;
        }

        if $t == "$variables$" {
            add_dropdown_item "Rename variable";
            add_dropdown_item "Delete the \"" & get_block_input(dropdown, dropdown_input, b_input_text) & "\" variable";
        } else {
            add_dropdown_item "Rename list";
            add_dropdown_item "Delete the \"" & get_block_input(dropdown, dropdown_input, b_input_text) & "\" list";
        }
    }
}

proc add_dropdown_item str {
    add $str to dropdown_data;
    local w = width_of_text($str, 1);
    if w > max_text_width {
        max_text_width = w;
    }

}

proc close_dropdown {
    dropdown = 0;
    InputRank highlighted_input = InputRank {};
    highlight_lightly = false;
}

proc new_variable scope, name {
    # insert a new variable at the correct position
    if $scope == "local" {
        add $name to local_vars;
    } else {
        add $name to global_vars;
    }

    handle_palette_vars;
}

proc new_list scope, name {
    # insert a new list at the correct position
    if $scope == "local" {
        add $name to local_lists;
    } else {
        add $name to global_lists;
    }

    handle_palette_lists;
}

proc handle_palette_vars {
    # shift all items in palette
    # shift all next indexes

    INSERTION_SORT(local_vars);
    INSERTION_SORT(global_vars);

    local start_idx = ("operator_mathop" in blocks) + BLOCK_LENGTH;
    local end_idx = "data_setvariableto" in blocks;

    # remove all variables
    until blocks[start_idx] == "data_setvariableto" {
        delete blocks[start_idx];
    }

    local y = b_y(("operator_mathop" in blocks)) - 71;
    local start_y = y;
    local i = 1;
    local pos = start_idx;
    repeat length global_vars {
        add_block
            opcode: "data_variable",
            shape: "reporter",
            category: Category.Variables,
            x: -205,
            y: y,
            width: 100,
            height: 16,
            insert_positition: pos,
            label1: TextLabel {x: -100, text: global_vars[i]};
        update_block_dimensions pos;
        i++;
        pos += BLOCK_LENGTH;
        y -= 21;
    }

    y -= 10;
    block_palette_text[29] = y; # variables for this sprite only text y pos
    y -= 10;
    local i = 1;
    repeat length local_vars {
        add_block
            opcode: "data_variable",
            shape: "reporter",
            category: Category.Variables,
            x: -205,
            y: y,
            width: 100,
            height: 16,
            insert_positition: pos,
            label1: TextLabel {x: -100, text: local_vars[i]};
        update_block_dimensions pos;
        i++;
        pos += BLOCK_LENGTH;
        y -= 21;
    }

    local idx_change = ("data_setvariableto" in blocks) - end_idx;
    PALETTE_END += idx_change;
    local y_change = y - (b_y(("data_setvariableto" in blocks)) + 5);

    palette_y_max += y_change;
    category_y[9] += y_change;
    category_y[10] += y_change;
    # shift palette text labels down
    local i = 32; # start at the y position of the next text label
    until i > length block_palette_text {
        block_palette_text[i] += y_change;
        i += 3;
    }
    # shift palette blocks down
    move_blocks_in_palette_down ("data_setvariableto" in blocks), y_change;
    # shift block indexes down
    shift_block_indexes_down PALETTE_END, PALETTE_END - idx_change - 1, idx_change;
}

proc handle_palette_lists {
    # shift all items in palette
    # shift all next indexes

    INSERTION_SORT(local_lists);
    INSERTION_SORT(global_lists);

    local start_idx = ("data_hidevariable" in blocks) + BLOCK_LENGTH;
    local end_idx = "datalist_addtolist" in blocks;

    # remove all lists
    until blocks[start_idx] == "datalist_addtolist" {
        delete blocks[start_idx];
    }

    local y = b_y(("data_hidevariable" in blocks)) - 78;
    local start_y = y;
    local i = 1;
    local pos = start_idx;
    repeat length global_lists {
        add_block
            opcode: "datalist_listcontents",
            shape: "reporter",
            category: Category.Lists,
            x: -205,
            y: y,
            width: 100,
            height: 16,
            insert_positition: pos,
            label1: TextLabel {x: -100, text: global_lists[i]};
        update_block_dimensions pos;
        i++;
        pos += BLOCK_LENGTH;
        y -= 21;
    }

    y -= 10;
    block_palette_text[38] = y; # lists for this sprite only text y pos
    y -= 10;
    local i = 1;
    repeat length local_lists {
        add_block
            opcode: "datalist_listcontents",
            shape: "reporter",
            category: Category.Lists,
            x: -205,
            y: y,
            width: 100,
            height: 16,
            insert_positition: pos,
            label1: TextLabel {x: -100, text: local_lists[i]};
        update_block_dimensions pos;
        i++;
        pos += BLOCK_LENGTH;
        y -= 21;
    }

    local idx_change = ("datalist_addtolist" in blocks) - end_idx;
    PALETTE_END += idx_change;
    local y_change = y - (b_y(("datalist_addtolist" in blocks)) + 5);

    palette_y_max += y_change;
    category_y[10] += y_change;
    # shift palette text labels down
    local i = 38; # start at the y position of the next text label
    until i > length block_palette_text {
        block_palette_text[i] += y_change;
        i += 3;
    }
    # shift palette blocks down
    move_blocks_in_palette_down ("datalist_addtolist" in blocks), y_change;
    # shift block indexes down
    shift_block_indexes_down PALETTE_END, PALETTE_END - idx_change - 1, idx_change;
}

proc move_blocks_in_palette_down idx, change {
    local idx = $idx;
    until idx == PALETTE_END {
        b_y(idx) += $change;
        idx += BLOCK_LENGTH;
    }
}

proc shift_block_indexes_down start, idx, change {
    local idx = $start;
    until idx > length blocks {
        if b_parent(idx) > $idx {b_parent(idx) += $change;}
        if b_previous(idx) > $idx {b_previous(idx) += $change;}
        if b_next(idx) > $idx {b_next(idx) += $change;}
        if b_input1_nested_block(idx) > $idx {b_input1_nested_block(idx) += $change;}
        if b_input2_nested_block(idx) > $idx {b_input2_nested_block(idx) += $change;}
        if b_input3_nested_block(idx) > $idx {b_input3_nested_block(idx) += $change;}
        if b_slot_1_nested_block(idx) > $idx {b_slot_1_nested_block(idx) += $change;}
        if b_slot_2_nested_block(idx) > $idx {b_slot_2_nested_block(idx) += $change;}
        idx += BLOCK_LENGTH;
    }

    local i = 1;
    repeat length roots {
        if roots[i] > $idx {
            roots[i] += $change;
        }
        i++;
    }
}

func duplicate_block(idx) {
    local i = $idx;
    repeat BLOCK_LENGTH {
        add blocks[i] to blocks;
        i++;
    }
    return last_block_idx;
}

# update c prong end style
proc update_c_end_styles idx {
    log "updating c end styles " & $idx;
    local slot_1_end_style = b_end_style(get_stack_bottom(b_slot_1_nested_block($idx)));
    local slot_2_end_style = b_end_style(get_stack_bottom(b_slot_2_nested_block($idx)));
    log slot_1_end_style;
    log slot_2_end_style;
    b_prong_2_style($idx) = if (slot_1_end_style > "") slot_1_end_style else "normal";
    b_prong_3_style($idx) = if (slot_2_end_style > "") slot_2_end_style else "normal";
}

proc delete_block idx, remove_items=false, entire_stack=false { # doesn't delete nested blocks
    local blockIdx = $idx;
    local parentIdx = b_parent(blockIdx);
    if b_nesting_level(blockIdx) == 0 {
        if b_previous(blockIdx) > "" {
            b_next(b_previous(blockIdx)) = b_next(blockIdx);
        } else {
            if b_slot_1_nested_block(parentIdx) == $idx {
                b_slot_1_nested_block(parentIdx) = b_next(blockIdx);
            }
            if b_slot_2_nested_block(parentIdx) == $idx {
                b_slot_2_nested_block(parentIdx) = b_next(blockIdx);
            }
        }
        if b_next(blockIdx) > "" {
            b_previous(b_next(blockIdx)) = b_previous(blockIdx);
            move_block_position b_next(blockIdx), 0, b_height(blockIdx);
        }

        update_c_end_styles parentIdx;
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
        propagate_size_change parentIdx;
    }
    if $idx in roots {
        delete roots[$idx in roots];
    }
}

proc delete_block_stack bIdx {
    if (b_input1_nested_block($bIdx) > "") {delete_block_stack b_input1_nested_block($bIdx);}
    if (b_input2_nested_block($bIdx) > "") {delete_block_stack b_input2_nested_block($bIdx);}
    if (b_input3_nested_block($bIdx) > "") {delete_block_stack b_input3_nested_block($bIdx);}
    if (b_slot_1_nested_block($bIdx) > "") {delete_block_stack b_slot_1_nested_block($bIdx);}
    if (b_slot_2_nested_block($bIdx) > "") {delete_block_stack b_slot_2_nested_block($bIdx);}

    if b_nesting_level($bIdx) == 0 and b_next($bIdx) > "" {
        delete_block_stack b_next($bIdx);
    }

    if $bIdx in roots {
        delete roots[$bIdx in roots];
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
    add $bIdx to dragged_blocks;

    if (b_input1_nested_block($bIdx) > "") {check_dragged_block b_input1_nested_block($bIdx);}
    if (b_input2_nested_block($bIdx) > "") {check_dragged_block b_input2_nested_block($bIdx);}
    if (b_input3_nested_block($bIdx) > "") {check_dragged_block b_input3_nested_block($bIdx);}
    if (b_slot_1_nested_block($bIdx) > "") {check_dragged_block b_slot_1_nested_block($bIdx);}
    if (b_slot_2_nested_block($bIdx) > "") {check_dragged_block b_slot_2_nested_block($bIdx);}

    if b_next($bIdx) > "" {
        check_dragged_block b_next($bIdx);
    }
}

proc init_blocks start=1 {
    i = $start;
    until i > length blocks {
        if blocks[i] > "" {
            update_block_dimensions i, false; # we need to not move c block's inputs before the block is sized correctly
        }
        i += BLOCK_LENGTH;
    }
}

list queue;
list visited;

proc update_all_blocks_sizes {
    delete sort_order;

    # do a breadth first search and then apply updates in reverse order
    # this ensures inner blocks are calculated first, even when
    # nesting levels are the same
    local i = 1;
    repeat length roots {
        delete queue;
        delete visited;

        add roots[i] to queue;
        add roots[i] to visited;
        until length queue == 0 {
            local currentIdx = queue[1];
            delete queue[1];
            add currentIdx to sort_order;

            local nextIdx = b_next(currentIdx);
            if nextIdx > "" and nextIdx not in visited {
                add nextIdx to visited;
                add nextIdx to queue;
            }
            local input1 = b_input1_nested_block(currentIdx);
            local input2 = b_input2_nested_block(currentIdx);
            local input3 = b_input3_nested_block(currentIdx);
            local c_nested1 = b_slot_1_nested_block(currentIdx); # blocks nested in c blocks
            local c_nested2 = b_slot_2_nested_block(currentIdx);
            if input1 > "" and input1 not in visited { add input1 to visited; add input1 to queue; }
            if input2 > "" and input2 not in visited { add input2 to visited; add input2 to queue; }
            if input3 > "" and input3 not in visited { add input3 to visited; add input3 to queue; }
            if c_nested1 > "" and c_nested1 not in visited { add c_nested1 to visited; add c_nested1 to queue; }
            if c_nested2 > "" and c_nested2 not in visited { add c_nested2 to visited; add c_nested2 to queue; }
        }
        i++;
    }

    # update block dimensions, iterating in reverse bfs order to start with the most nested blocks
    local i = length sort_order;
    repeat length sort_order {
        update_block_dimensions sort_order[i], false;
        i--;
    }
}

proc update_all_blocks_c_styles {
    local i = PALETTE_END;
    until i > length blocks {
        if b_shape(i) == "c" {
            update_c_end_styles(i);
        }
        i += BLOCK_LENGTH;
    }
}

func find_hovered_block(x, y, ignoreIdx=0) {
    local Point p = Point {x: $x, y: $y};

    delete block_scripts;
    local i = 1;
    until i > length blocks {
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
            until i > length blocks {
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
                return $i;
            }
        } elif shape == "boolean" {
            local seg_l = height / 2; # segment length
            if point_in_tri($p, Tri {x1: x, y1: y - seg_l, x2: x + seg_l, y2: y, x3: x + seg_l, y3: y - height}) or
            point_in_tri($p, Tri {x1: x + width, y1: y - seg_l, x2: x + width - seg_l, y2: y, x3: x + width - seg_l, y3: y - height}) or
            point_in_rect($p, Rect {x1: x + seg_l, y1: y - height, x2: x + width - seg_l, y2: y}) {
                return $i;
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
                return $i;
            }
        } elif shape == "c" {
            local midy = y - b_prong_1_height($i) - b_slot_1_height($i) - c_block_prong_height;
            if point_in_rect($p, Rect {x1: x, x2: x + 8, y1: y - height, y2: y}) or
            point_in_rect($p, Rect {x1: x, x2: x + width, y1: y - b_prong_1_height($i), y2: y}) or 
            point_in_rect($p, Rect {x1: x, x2: x + width, y1: midy, y2: midy + c_block_prong_height}) or 
            point_in_rect($p, Rect {x1: x, x2: x + width, y1: midy - b_slot_2_height($i) - c_block_prong_height, y2: midy - b_slot_2_height($i)}) * (b_slot_count($i) > 1){
                return $i;
            }
        }
    }
    return 0;
}

func find_hovered_input(x, y, idx) {
    local Point p = Point {x: $x, y: $y};

    local counter = 0;
    local inputNum = 1;
    repeat 3 {
        local offset = $idx + b_inputs + counter;
        # checks if inputs[shape] > "", if so valid input
        # also check that there's not a nested block inside
        # if so, it's no editable so we can ignore it
        log "checking input " & inputNum;
        if (blocks[offset + b_input_shape] > "" and blocks[offset + b_input_nested_block] == "") {
            log "valid input " & inputNum;
            local shape = blocks[offset + b_input_shape];
            local bheight = if (b_shape($idx) == "c") b_prong_1_height($idx) else b_height($idx);
            local x = blocks[offset + b_input_x];
            local y = b_y($idx) - bheight / 2 + blocks[offset + b_input_height] / 2;
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
        nesting_level=0,
        insert_positition="" {
        
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
    add $input1.type to blocks;
    add $input1.dropdown_shape to blocks;
    add $input1.dropdown_list to blocks;
    add $input1.x to blocks;
    add $input1.width to blocks;
    add $input1.height to blocks;
    add $input1.text to blocks;
    add $input1.nested_block to blocks;

    add $input2.shape to blocks;
    add $input2.type to blocks;
    add $input2.dropdown_shape to blocks;
    add $input2.dropdown_list to blocks;
    add $input2.x to blocks;
    add $input2.width to blocks;
    add $input2.height to blocks;
    add $input2.text to blocks;
    add $input2.nested_block to blocks;

    add $input3.shape to blocks;
    add $input3.type to blocks;
    add $input3.dropdown_shape to blocks;
    add $input3.dropdown_list to blocks;
    add $input3.x to blocks;
    add $input3.width to blocks;
    add $input3.height to blocks;
    add $input3.text to blocks;
    add $input3.nested_block to blocks;

    local blockIdx = last_block_idx;
    if $insert_positition > "" {
        # move blocks to insert position
        blockIdx = length blocks;
        repeat BLOCK_LENGTH {
            insert blocks[blockIdx] at blocks[$insert_positition];
            # blockIdx++;
            delete blocks[blockIdx + 1];
        }
    } else {
        # if a block is not being added as part of a script, add it to roots
        if $parent == "" and $previous == "" {
            add blockIdx to roots;
        }
    }
}

proc put_block_in_block childIdx, parentIdx, inputNumber, update_sizes=true {
    local parentIdx = $parentIdx;
    local childIdx = $childIdx;
    local x_change = get_block_input(parentIdx, $inputNumber, b_input_x) - b_x(childIdx);
    local height = if (b_shape(parentIdx) == "c") b_prong_1_height(parentIdx) else b_height(parentIdx);
    local y_change = ((b_y(parentIdx) - height / 2) + (b_height(childIdx) / 2)) - b_y(childIdx);
    if b_shape(parentIdx) == "stack" or b_shape(parentIdx) == "c" {
        y_change += 0.5;
    }
    set_block_input parentIdx, $inputNumber, b_input_nested_block, $childIdx;
    b_parent(childIdx) = $parentIdx;
    update_nesting_level childIdx;
    move_block_position childIdx, x_change, y_change;

    # when a block is put in another block, it is no longer a top level block, it is not a root
    if $childIdx in roots {
        delete roots[$childIdx in roots];
    }

    if ($update_sizes) {
        log "starting size change propagation " & $parentIdx;
        propagate_size_change $parentIdx;
    }
}

proc connect_stack_block connectIdx, childIdx, location {
    log "connecting " & $connectIdx & " " & $childIdx;
    local connectIdx = $connectIdx;
    local prevIdx = connectIdx;
    local parentIdx = connectIdx;
    local childIdx = $childIdx;
    local stack_height = measure_stack_height($childIdx);

    if $childIdx in roots {
        delete roots[$childIdx in roots];
    }

    # location determines where the placement goes
    # 0 = top of stack block
    # 1 = bottom of stack or c block
    # 2 = top slot of c block
    # 3 = bottom slot of c block

    if $location == 0 {
        # when connecting to the top of a block, swap childID and connectID
        # to effectively connect it the other way around
        local prevIdx = $childIdx;
        local childIdx = $connectIdx;
        local stack_height = measure_stack_height($connectIdx);
        local x_change = b_x(prevIdx) - b_x(childIdx);
        local y_change = b_y(prevIdx) - b_height(prevIdx) - b_y(childIdx);
        move_block_position childIdx, x_change, y_change;
        inserting_in_middle = false;

        b_previous(childIdx) = $childIdx;

        # putting it in the middle of a stack
        # if the previous block start's out with a next,
        # we know there must be something after it
        if b_next(prevIdx) > "" {
            local last = get_stack_bottom(prevIdx);
            # we need to set the next block in the place we're inserting
            # to have the bottom block in our dragged stack as a previous
            log "last " & last;
            b_next(last) = b_next(prevIdx);
            b_previous(b_next(last)) = last;
            inserting_in_middle = true;
        }
        b_next(prevIdx) = connectIdx;
        b_parent(childIdx) = b_parent(prevIdx); # keep parent the same
        update_stack_parents connectIdx, b_parent(childIdx);

        # if inserted in the middle of a stack, we need to move the blocks beneath us down
        if inserting_in_middle {
            log "moving lower stack down";
            move_block_position b_next(last), 0, -stack_height;
        }
        if b_parent(childIdx) > "" {
            propagate_size_change b_parent(childIdx);
        }
    } elif $location == 1 {
        local x_change = b_x(prevIdx) - b_x(childIdx);
        local y_change = b_y(prevIdx) - b_height(prevIdx) - b_y(childIdx);
        move_block_position childIdx, x_change, y_change;
        inserting_in_middle = false;

        b_previous(childIdx) = connectIdx;

        # putting it in the middle of a stack
        # if the previous block start's out with a next,
        # we know there must be something after it
        if b_next(prevIdx) > "" {
            local last = get_stack_bottom(childIdx);
            # we need to set the next block in the place we're inserting
            # to have the bottom block in our dragged stack as a previous
            log "last " & last;
            b_next(last) = b_next(prevIdx);
            b_previous(b_next(last)) = last;
            inserting_in_middle = true;
        }
        b_next(prevIdx) = childIdx;
        b_parent(childIdx) = b_parent(prevIdx); # keep parent the same
        update_stack_parents childIdx, b_parent(childIdx);

        if b_parent(childIdx) > "" {
            # update end style for cap blocks
            update_c_end_styles b_parent(childIdx);
        }

        # if inserted in the middle of a stack, we need to move the blocks beneath us down
        if inserting_in_middle {
            log "moving lower stack down";
            move_block_position b_next(last), 0, -stack_height;
        }
        if b_parent(childIdx) > "" {
            propagate_size_change b_parent(childIdx);
        }
    } elif $location == 2 {
        local x_change = b_x(parentIdx) + c_x_offset - b_x(childIdx);
        local y_change = b_y(parentIdx) - b_prong_1_height(parentIdx) - b_y(childIdx);
        move_block_position childIdx, x_change, y_change;
        inserting_in_middle = false;

        b_parent(childIdx) = connectIdx;

        # putting it in the middle of a stack
        # if the previous block start's out with a next,
        # we know there must be something after it
        if b_slot_1_nested_block(parentIdx) > "" {
            local last = get_stack_bottom(childIdx);
            # we need to set the next block in the place we're inserting
            # to have the bottom block in our dragged stack as a previous
            log "last " & last;
            b_next(last) = b_slot_1_nested_block(parentIdx);
            b_previous(b_next(last)) = last;
            inserting_in_middle = true;
        }
        update_stack_parents childIdx, connectIdx;
        b_slot_1_nested_block(parentIdx) = childIdx;
        # b_parent(childIdx) = b_parent(prevIdx); # keep parent the same

        # update end style for cap blocks
        b_prong_2_style(parentIdx) = b_end_style(get_stack_bottom(b_slot_1_nested_block(parentIdx)));

        # if inserted in the middle of a stack, we need to move the blocks beneath us down
        if inserting_in_middle {
            log "moving lower stack down";
            move_block_position b_next(last), 0, -stack_height;
        }
        if b_parent(childIdx) > "" {
            propagate_size_change b_parent(childIdx);
        }
    } elif $location == 3 {
        local x_change = b_x(parentIdx) + c_x_offset - b_x(childIdx);
        local y_change = b_y(parentIdx) - b_prong_1_height(parentIdx) - b_slot_1_height(parentIdx) - c_block_prong_height - b_y(childIdx);
        move_block_position childIdx, x_change, y_change;
        inserting_in_middle = false;

        b_parent(childIdx) = connectIdx;

        # putting it in the middle of a stack
        # if the previous block start's out with a next,
        # we know there must be something after it
        if b_slot_2_nested_block(parentIdx) > "" {
            local last = get_stack_bottom(childIdx);
            # we need to set the next block in the place we're inserting
            # to have the bottom block in our dragged stack as a previous
            log "last " & last;
            b_next(last) = b_slot_2_nested_block(parentIdx);
            b_previous(b_next(last)) = last;
            inserting_in_middle = true;
        }
        update_stack_parents childIdx, connectIdx;
        b_slot_2_nested_block(parentIdx) = childIdx;
        # b_parent(childIdx) = b_parent(prevIdx); # keep parent the same

        # update end style for cap blocks
        b_prong_3_style(parentIdx) = b_end_style(get_stack_bottom(b_slot_2_nested_block(parentIdx)));

        # if inserted in the middle of a stack, we need to move the blocks beneath us down
        if inserting_in_middle {
            log "moving lower stack down";
            move_block_position b_next(last), 0, -stack_height;
        }
        if b_parent(childIdx) > "" {
            propagate_size_change b_parent(childIdx);
        }
    }
}

proc update_stack_parents startID, parent {
    # when connecting or disconnecting a stack of blocks,
    # we need to update the block's parent
    # start on the block after the current one
    local idx = $startID;
    local stop = false;
    log "starting parent updates: idx " & idx;
    until stop {
        log "updating: idx " & idx;
        b_parent(idx) = $parent;
        stop = b_next(idx) == "";
        idx = b_next(idx);
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
        idx = b_parent(idx);
    }
    until b_previous(idx) == "" {
        idx = b_previous(idx);
    }
    return idx;
}

proc disconnect_block blockIdx, shift=false {
    local blockIdx = $blockIdx;
    local parentIdx = b_parent(blockIdx);
    local prevIdx = b_previous(blockIdx);
    if b_nesting_level(blockIdx) == 0 {
        b_next(prevIdx) = "";
        b_previous(blockIdx) = "";
        b_parent(blockIdx) = "";

        update_stack_parents b_next(blockIdx), b_parent(blockIdx);
        # b_next(blockIdx) = ""; # do this if you want to pick out this one stack block
        # b_previous(b_idx(b_next(blockIdx)));
    } else {
        b_parent(blockIdx) = "";
        # b_next(parentIdx) = "";
    }

    delete roots[$blockIdx in roots]; # when a block is disconnected it's moved to the front
    add $blockIdx to roots;

    if $shift {
        move_block_position blockIdx, 10, -10;
    }

    if b_nesting_level(blockIdx) == 0 {
        # if it's top level, it could only be in a c block
        # if so mark it as disconnected from that
        if b_slot_1_nested_block(parentIdx) == $blockIdx {b_slot_1_nested_block(parentIdx) = "";}
        if b_slot_2_nested_block(parentIdx) == $blockIdx {b_slot_2_nested_block(parentIdx) = "";}
    } else {
        # go through parent's inputs and disconnect all places the block is referenced
        if b_input1_nested_block(parentIdx) == $blockIdx {set_block_input parentIdx, 1, b_input_nested_block, "";}
        if b_input2_nested_block(parentIdx) == $blockIdx {set_block_input parentIdx, 2, b_input_nested_block, "";}
        if b_input3_nested_block(parentIdx) == $blockIdx {set_block_input parentIdx, 3, b_input_nested_block, "";}
    }

    update_c_end_styles parentIdx;

    update_nesting_level blockIdx, useParent: false; # to make sure the nesting level is 0
    propagate_size_change parentIdx;
}

proc propagate_size_change blockIdx {
    local idx = $blockIdx;
    log "propagating size change for block idx " & idx;

    # if it's not a top-level block, update the block then propagate to the parent
    if b_nesting_level(idx) > 0 {
        log "updating block dimensions " & $blockIdx;
        update_block_dimensions $blockIdx;
        if b_parent(idx) > "" {
            propagate_size_change b_parent(idx);
        } else {
            # log "no parent, no propagating " & idx;
        }
    } else {
        log "updating stack block dimensions " & idx;
        local height_before = b_height(idx);
        update_block_dimensions idx;
        local height_change = b_height(idx) - height_before;
        log "height change " & height_change & " next " & b_next(idx);
        if b_next(idx) > "" {
            move_block_position b_next(idx), 0, -height_change;
            # shift_next_block_down b_next(idx), height_change;
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
    #     shift_next_block_down b_next($blockIdx), $amount;
    # }
}

proc update_nesting_level bIdx, useParent=true {
    if $useParent {
        # get nesting level from parent and increment
        b_nesting_level($bIdx) = b_nesting_level(b_parent($bIdx)) + 1;
    } else {
        # we want to allow setting the nesting level to 0 initally,
        # if updating a top level reporter/boolean block instead of a nested block
        b_nesting_level($bIdx) = 0;
    }
    # check inputs recursively for nesting level updates
    if (b_input1_nested_block($bIdx) > "") {update_nesting_level b_input1_nested_block($bIdx);}
    if (b_input2_nested_block($bIdx) > "") {update_nesting_level b_input2_nested_block($bIdx);}
    if (b_input3_nested_block($bIdx) > "") {update_nesting_level b_input3_nested_block($bIdx);}


}

struct TMPInput {
    x,
    index # 1-6 where 1-3 are text labels and 4-6 are inputs
}

list TMPInput tmp_item_order;
proc update_block_dimensions blockIdx, should_move_c_inputs=true, update_preview=false, extension=false {
    # order text + inputs by x, left -> right
    # get width of each item, keeping track of a cumulative x position and adding padding
    # if input is a block, include that width
    # block height = tallest input + 2px padding top and bottom
    # update positions of items as needed
    # update total block dimensions when done

    if $blockIdx == h_c_placement.preview_idx and $update_preview == false {
        stop_this_script;
    }

    delete tmp_item_order;
    local blockIdx = $blockIdx;
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
    if (bshape == "stack" or bshape == "c") {
        if (b_category(blockIdx) == Category.Extensions or $extension) {
            local block_total_height = 25;
        } else {
            local block_total_height = 21;
        }
    } else {
        if (b_category(blockIdx) == Category.Extensions or $extension) {
            local block_total_height = 20;
        } else {
            local block_total_height = 16;
        }
    }
    # local block_total_height = if (bshape == "stack" or bshape == "c") if (b_category(blockIdx) == Category.Extensions or $extension) 25 else 21 else 16;

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
            local text = get_block_label(blockIdx, item.index, b_label_text);
            local text_width = width_of_text(text, 1) - 1;
            if text == "if" and bshape == "c" {
                text_width += 7;
            }

            if (current_x == start_x) {
                if bshape == "boolean" {
                    current_x += Padding.boolean_edge;
                } else {
                    current_x += Padding.start;
                }
            } else {
                current_x += Padding.base;
            }
            set_block_label blockIdx, item.index, b_label_x, current_x;
            current_x += text_width;
        } elif (item.index >= 4) {
            local inputNum = item.index - 3;
            # log "handling input: " & inputNum;
            local nested_block = get_block_input(blockIdx, inputNum, b_input_nested_block);
            local shape = get_block_input(blockIdx, inputNum, b_input_shape);
            if (nested_block > "") {
                # we override shape, to allow for the nested block shape not being
                # the same as the input's block shape
                shape = b_shape(nested_block);
                local input_width = b_width(nested_block);
                local input_height = b_height(nested_block) + 4; # = top and bottom padding
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
                    local text = get_block_input(blockIdx, inputNum, b_input_text);
                    local input_width = MAX(16, width_of_text(text, 1) + Padding.text_padding * 2); # minimum input width of 16
                    if get_block_input(blockIdx, inputNum, b_input_dropdown_shape) > "" { # if there's a dropdown, add extra padding for the arrow
                        input_width += 12;
                    }
                    if get_block_input(blockIdx, inputNum, b_input_type) == b_input_type_color { # if there's a color input, make it regular sized
                        input_width = 16;
                    }

                    set_block_input blockIdx, inputNum, b_input_width, input_width;
                } elif (shape == "boolean") { # boolean inputs don't have text, so use just set width
                    local input_width = base_boolean_width;
                    # boolean inputs are always a fixed width, as
                    # there's nothing changeable about them
                    set_block_input blockIdx, inputNum, b_input_width, input_width;
                }
            }

            if (current_x == start_x) {
                if (bshape == shape) {
                    current_x += if (bshape == "boolean") Padding.boolean_edge_same else Padding.reporter_edge_same;
                } elif (bshape == "boolean") { # add more padding to boolean blocks
                    current_x += Padding.boolean_edge;
                } else {
                    current_x += Padding.start;
                }
            } else {
                current_x += Padding.base;
            }
            set_block_input blockIdx, inputNum, b_input_x, current_x;
            current_x += input_width;
        }
        i++;
    }

    if (item.index >= 4) {
        if (bshape == shape) {
            current_x += if (bshape == "boolean") Padding.boolean_edge_same else Padding.reporter_edge_same;
        } elif (bshape == "boolean") { # add more padding to the end of boolean blocks
            # have to add this or else the padding isn't the same as the start, and there isn't enough
            current_x += Padding.boolean_edge;
        } else {
            current_x += Padding.end_other;
        }
    } else {
        if (bshape == "boolean") { # add more padding to boolean blocks
            current_x += Padding.boolean_edge;
        } else {
            current_x += Padding.end;
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
            local nested_block = get_block_input(blockIdx, inputNum, b_input_nested_block);
            local shape = get_block_input(blockIdx, inputNum, b_input_shape);
            if (nested_block > "") {
                # log "updating block pos " & nested_block & " in input " & inputNum;
                put_block_in_block nested_block, $blockIdx, inputNum, update_sizes: false;
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
            if (b_slot_1_nested_block(blockIdx) > "") {move_block_position b_slot_1_nested_block(blockIdx), 0, slot_1_y_change;}
            if (b_slot_2_nested_block(blockIdx) > "") {move_block_position b_slot_2_nested_block(blockIdx), 0, slot_2_y_change;}
        }
    }
}

func measure_stack_height(startIdx) {
    if $startIdx == "" {
        return c_block_min_slot_height;
    }

    local total_height = 0;
    local idx = $startIdx;
    local end_reached = false;
    until end_reached {
        total_height += b_height(idx);
        end_reached = b_next(idx) == "";
        idx = b_next(idx);
    }
    return total_height;
}

func get_stack_bottom(startIdx) {
    local idx = $startIdx;
    # if there's only one block, we might want to stop immediately
    local end_reached = b_next(idx) == "";
    until end_reached {
        idx = b_next(idx);
        end_reached = b_next(idx) == "";
    }
    return idx;
}

proc set_block_input blockIdx, inputNum, key, val {
    blocks[$blockIdx + b_inputs + (($inputNum - 1) * INPUT_LENGTH) + $key] = $val;
}

proc set_block_label blockIdx, labelNum, key, val {
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
    if (b_input1_nested_block($bIdx) > "") {move_block_position b_input1_nested_block($bIdx), $x_change, $y_change;}
    if (b_input2_nested_block($bIdx) > "") {move_block_position b_input2_nested_block($bIdx), $x_change, $y_change;}
    if (b_input3_nested_block($bIdx) > "") {move_block_position b_input3_nested_block($bIdx), $x_change, $y_change;}
    if (b_slot_1_nested_block($bIdx) > "") {move_block_position b_slot_1_nested_block($bIdx), $x_change, $y_change;}
    if (b_slot_2_nested_block($bIdx) > "") {move_block_position b_slot_2_nested_block($bIdx), $x_change, $y_change;}

    if b_nesting_level($bIdx) == 0 and b_next($bIdx) > "" and $moveStack {
        move_block_position b_next($bIdx), $x_change, $y_change, $moveStack;
    }
}

func filter_only_numbers(input) {
    local i = 1;
    local output = "";
    repeat length $input {
        if ($input[i] >= 0 and $input[i] <= 9) or $input[i] == "e" or $input[i] == "." or $input[i] == "-" {
            output &= $input[i];
        }
        i++;
    }
    return output;
}