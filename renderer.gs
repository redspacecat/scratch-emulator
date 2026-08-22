hide;

%include code/PTE_font.gs
%include code/helpful_utils.gs
%include std/math

list colors = [
    "#4c97ff", "#3373cc", "#4280d7",
    "#9966ff", "#774dcb", "#855cd6",
    "#cf63cf", "#bd42bd", "#c94fc9",
    "#ffbf00", "#cc9900", "#e6ac00",
    "#ffab19", "#cf8b17", "#ec9c13",
    "#5cb1d6", "#2e8eb8", "#3c9ec7",
    "#59c059", "#389438", "#389438",
    "#ff8c1a", "#db6e00", "#db6e00",
    "#ff661a", "#e64d00", "#e64d00",
    "#ff6680", "#ff3355", "#ff3355",
    "#0fbd8c", "#0b8e69", "#0da57a",
    "#d6d6d6", "#d6d6d6", "#d6d6d6",
];

on "render_blocks" {
    start_time = days_since_2000();
    render_blocks;
    render_palette_sidebar;
    # log "rendering took " & (days_since_2000() - start_time) * 86400000 & " ms";
}

list queue;
list visited;

proc render_blocks {
    # # render regular blocks
    max_nesting_level = 0;
    InputRank h_i = highlighted_input;

    set_pen_size 240;
    goto 120, 180;
    set_pen_color "#ffffff";
    pen_down;
    change_y -360;
    pen_up;
    
    local i = 1;
    repeat length roots {
        local root = roots[i];
        if root != "editor"."dragged_script_id" { # don't draw dragged blocks so they can be drawn on top
            render_one_root root;
        }
        
        i++;
    }

    if PALETTE_SHOWN {
        set_pen_size 0;
        goto -102 - PALETTE_SCROLL_X, 180;
        set_pen_color "#e5f4f8";
        set_pen_transparency 30;
        pen_down;
        set_pen_size 205;
        change_y -360;
        pen_up;

        local i = 1;
        until i == PALETTE_END {
            render_one_block b_id(i), i;
            i += BLOCK_LENGTH;
        }

        render_palette_text;
    }

    render_one_root "editor"."dragged_script_id";
    # local i = 1;
    # until i > length dragged_blocks {
    #     render_one_block dragged_blocks[i], b_idx(dragged_blocks[i]);
    #     i++;
    # }
}

proc render_palette_text {
    set_pen_color "#000000";
    local i  = 1;
    repeat length block_palette_text / 3 {
        plain_text block_palette_text[i] - PALETTE_SCROLL_X, block_palette_text[i+1] - PALETTE_SCROLL_Y, 1, block_palette_text[i+2], "l";
        i += 3;
    }
}

proc render_palette_sidebar {
    # if not PALETTE_SHOWN {
        set_pen_size 0;
        goto -223, 180;
        set_pen_color "#e5f4f8";
        set_pen_transparency 30;
        pen_down;
        set_pen_size 35;
        change_y -360;
        pen_up;
    # }

    goto -223, 162;
    i = 1;
    repeat 9 {
        set_pen_size 22;
        set_pen_color colors[i+1];
        pen_down;
        pen_up;
        
        set_pen_size 20;
        set_pen_color colors[i];
        pen_down;
        pen_up;

        i += 3;
        change_y -30;
    }
}

proc render_one_root root {
    delete queue;
    delete visited;

    add $root to queue;
    add $root to visited;
    until length queue == 0 {
        local current = queue[1];
        local currentIdx = b_idx(current);
        delete queue[1];
        render_one_block current, currentIdx;

        if b_nesting_level(currentIdx) > max_nesting_level {
            max_nesting_level = b_nesting_level(currentIdx);
        }

        local next = b_next(currentIdx);
        if next > "" and next not in visited {
            add next to visited;
            add next to queue;
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
}

proc render_one_block blockID, blockIdx {
    local i = $blockIdx;
    if block_in_palette(i) {
        if not PALETTE_SHOWN {
            stop_this_script;
        }
        local scroll_x_offset = PALETTE_SCROLL_X;
        local scroll_y_offset = PALETTE_SCROLL_Y;
    } else {
        local scroll_x_offset = SCROLL_X;
        local scroll_y_offset = SCROLL_Y;
    }

    # don't render offscreen blocks
    if not ( b_x(i) - scroll_x_offset + b_width(i) > -240 and
    b_x(i) - scroll_x_offset < 240 and
    b_y(i) - scroll_y_offset > -180 and
    b_y(i) - scroll_y_offset - b_height(i) < 180) {
        stop_this_script;
    }

    # color and background color are obtained from index of category,
    # which is a number, in the colors list

    if b_shape(i) == "c" {
        render_c_block
            x: b_x(i) - scroll_x_offset,
            y: b_y(i) - scroll_y_offset,
            width: b_width(i),
            height: b_height(i),
            slot_count: b_slot_count(i),
            prong_1_height: b_prong_1_height(i),
            prong_2_height: c_block_prong_height,
            prong_3_height: c_block_prong_height,
            prong_2_style: b_prong_2_style(i),
            prong_3_style: b_prong_3_style(i),
            end_style: b_end_style(i),
            slot_1_height: b_slot_1_height(i),
            slot_2_height: b_slot_2_height(i),
            color: colors[b_category(i)],
            border_color: colors[b_category(i) + 1];
        
        local counter = 0; # rendering text labels
        repeat 2 {
            local offset = i + b_labels + counter;
            if (blocks[offset + b_label_x] > "") { # checking + 1 to check x instead of text, which could be blank
                render_text_label
                    blocks[offset + b_label_x] - scroll_x_offset,
                    (b_y(i) - (b_prong_1_height(i) / 2)) + 4 - scroll_y_offset,
                    blocks[offset];
            }
            counter += TEXT_LABEL_LENGTH; # = number of properties in TextLabel
        }

        if b_label3_x(i) > "" {
            render_text_label
                b_label3_x(i) - scroll_x_offset,
                (b_y(i) - b_prong_1_height(i) - b_slot_1_height(i) - (c_block_prong_height / 2)) + 3 - scroll_y_offset,
                b_label3_text(i);
        }

        if b_input1_x(i) > "" and b_input1_nested_block(i) == "" {
            render_input
                b_shape(i),
                b_input1_x(i) - scroll_x_offset,
                b_y(i) - (b_prong_1_height(i) / 2) + b_input1_height(i) / 2 - scroll_y_offset,
                b_input1_width(i),
                b_input1_height(i),
                b_input1_text(i),
                b_input1_shape(i),
                colors[b_category(i) + 1],
                is_highlighted: h_i.block == $blockID and h_i.input == 1,
                dropdown_shape: b_input1_dropdown_shape(i),
                dropdown_color: colors[b_category(i) + 2];
        }
    } else {
        draw_block
            colors[b_category(i)],
            b_width(i),
            b_height(i),
            b_x(i) - scroll_x_offset,
            b_y(i) - scroll_y_offset,
            b_shape(i),
            b_end_style(i),
            b_start_style(i),
            colors[b_category(i) + 1],
            is_highlighted: h_i.block == b_parent(i) and "editor"."highlighted_input_nested_block" == $blockID;

        local counter = 0; # rendering text labels
        repeat 3 {
            local offset = i + b_labels + counter;
            if (blocks[offset + b_label_x] > "") { # checking + 1 to check x instead of text, which could be blank
                render_text_label
                    blocks[offset + b_label_x] - scroll_x_offset,
                    (b_y(i) - (b_height(i) / 2)) + 4 - scroll_y_offset,
                    blocks[offset];
            }
            counter += TEXT_LABEL_LENGTH; # = number of properties in TextLabel
        }

        local counter = 0; # rendering inputs
        local inputNum = 1;
        repeat 3 {
            local offset = i + b_inputs + counter;
            # checks if inputs[shape] > "", if so valid input
            # also check that there's not a nested block inside
            # if so, no need to render it
            if (blocks[offset] > "" and blocks[offset + b_input_nested_block] == "") {
                render_input
                    b_shape(i),
                    blocks[offset + b_input_x] - scroll_x_offset,
                    ((b_y(i) + (b_y(i) - b_height(i))) / 2) + blocks[offset + b_input_height] / 2 - scroll_y_offset,
                    blocks[offset + b_input_width],
                    blocks[offset + b_input_height],
                    blocks[offset + b_input_text],
                    blocks[offset + b_input_shape],
                    colors[b_category(i) + 1],
                    is_highlighted: h_i.block == $blockID and h_i.input == inputNum,
                    dropdown_shape: blocks[offset + b_input_dropdown_shape],
                    dropdown_color: colors[b_category(i) + 2];
            }
            counter += INPUT_LENGTH; # = number of properties in Input
            inputNum++;
        }
    }
}

proc plain_text x, y, size, text, align {
    set_pen_size $size;
    local x_offset = $x;
    local y_offset = $y;
    if $align == "c" {
        local text_width = width_of_text($text, $size);
        x_offset += round(text_width / -2);
    }
    switch_costume "large";
    local txt_i = 1;
    repeat length($text) {
        switch_costume $text[txt_i];
        local font_char_index = pte_font_1[costume_number() + 6];
        switch_costume "large";
        local font_i = 3 + font_char_index;
        repeat pte_font_1[5 + font_char_index] {
            font_i += 4;
            goto x_offset + $size * pte_font_1[font_i + 1], y_offset + $size * pte_font_1[font_i + 2];
            pen_down;
            repeat pte_font_1[font_i] {
                font_i += 2;
                goto x_offset + $size * pte_font_1[font_i + 1], y_offset + $size * pte_font_1[font_i + 2];
            }
            pen_up;
        }
        x_offset += $size * (2 + pte_font_1[2 + font_char_index]);
        txt_i += 1;
    }
}

proc draw_block color, width, height, x, y, shape, end_style, start_style, border_color, is_highlighted {
    if $shape == "stack" {
        set_pen_color $color;
        set_pen_size 4;
        goto $x + 2, $y - 2 + (3 * ($start_style == "hat"));
        pen_down;
        goto $x + 2, $y - $height + 3;
        pen_up;
        set_pen_size 4;
        goto $x + $width - 2, $y - 2;
        pen_down;
        goto $x + $width - 2, $y - $height + 2;
        pen_up;
        if $start_style != "hat" {
            fill_rect $x + 2, $x + 7, $y - $height, $y, 1;
            fill_rect $x + 19, $x + $width - 2, $y - $height + 1, $y, 1;

            fill_rect $x + 7, $x + 19, $y - $height, $y - 3, 1;
            tri_fill $x + 7, $y, $x + 10, $y - 3, $x + 7, $y - 3, 0.5;
            tri_fill $x + 19, $y, $x + 19, $y - 3, $x + 16, $y - 3, 0.5;
        } else {
            fill_rect $x + 2, $x + $width - 2, $y - $height, $y, 1;
            goto $x + 5, $y + 1;
            set_pen_size 10;
            point_in_direction 60;
            pen_down;
            repeat 8 {
                move 7;
                turn_right 10;
            }
            goto $x + 10, $y + 3;
            pen_up;
        }
        if $end_style != "cap" {
            tri_fill $x + 8, $y - $height, $x + 11, $y - $height - 2, $x + 19, $y - $height, 0.5;
            tri_fill $x + 19, $y - $height, $x + 16, $y - $height - 2, $x + 10, $y - $height - 2, 0.5; # change numbers to make tri more accurate
        }
        set_pen_size 1;
        set_pen_color $border_color;
        if $start_style != "hat" {
            goto $x + 3, $y;
            pen_down;
            goto $x + 7, $y;
            goto $x + 10, $y - 3;
            goto $x + 16, $y - 3;
            goto $x + 19, $y;
        } else {
            goto $x, $y;
            pen_down;
            change_y 3;
            point_in_direction 58;
            repeat 9 {
                move 7;
                turn_right 8.5;
            }
            goto x_position() + 1, $y;
        }
        goto $x + $width - 2, $y;
        point_in_direction 90;
        local move_amount = 2 / 1.366;
        repeat 2 {
            turn_right 30;
            move move_amount;
        }
        # goto $x + $width, $y - 2;
        goto $x + $width, $y - $height + 2;
        point_in_direction 180;
        repeat 2 {
            turn_right 30;
            move move_amount;
        }
        if $end_style != "cap" {
            goto $x + 19, $y - $height;
            goto $x + 16, $y - $height - 3;
            goto $x + 10, $y - $height - 3;
            goto $x + 7, $y - $height;
        }
        goto $x + 2, $y - $height;
        point_in_direction 270;
        repeat 2 {
            turn_right 30;
            move move_amount;
        }
        if $start_style != "hat" {
            goto $x, $y - 2;
            point_in_direction 0;
            repeat 2 {
                turn_right 30;
                move move_amount;
            }
            goto $x + 3, $y;
        } else {
            goto $x, $y;
        }
        pen_up;
    }
    elif $shape == "reporter" {
        if $is_highlighted {
            set_pen_color "#ffffff";
            pen_size = $height + 6;
            set_pen_size 0; # this has to be done to avoid a second pen stroke adding a few extra pixels
            goto $x + pen_size / 2 - 3, $y - pen_size / 2 + 3;
            pen_down;
            set_pen_size pen_size;
            change_x $width - pen_size + 6;
            pen_up;
        }

        pen_size = $height + 2;
        set_pen_color $border_color;
        set_pen_size 0;
        goto $x + pen_size / 2 - 1, $y - pen_size / 2 + 1;
        pen_down;
        set_pen_size pen_size;
        change_x $width - pen_size + 2;
        pen_up;

        pen_size = $height;
        set_pen_color $color;
        set_pen_size 0;
        goto $x + pen_size / 2, $y - pen_size / 2;
        pen_down;
        set_pen_size pen_size;
        change_x $width - pen_size;
        pen_up;
    }
    elif $shape == "boolean" {
        set_pen_color $color;
        local seg_amount = $height / 2;
        tri_fill $x + seg_amount, $y - $height, $x, $y - seg_amount, $x + seg_amount, $y, 1;
        fill_rect $x + seg_amount, $x + $width - seg_amount, $y - $height, $y, 1;
        tri_fill $x + $width - seg_amount, $y - $height, $x + $width, $y - seg_amount, $x + $width - seg_amount, $y, 1;
        
        goto $x + seg_amount, $y - $height - 1;
        set_pen_size 1;
        set_pen_color $border_color;
        pen_down;
        goto $x - 1, $y - $height / 2;
        goto $x + seg_amount, $y;
        goto $x + $width - seg_amount, $y;
        goto $x + $width + 1, $y - $height / 2;
        goto $x + $width - seg_amount, $y - $height - 1;
        goto $x + seg_amount, $y - $height - 1;
        pen_up;

        if $is_highlighted {
            set_pen_color "#ffffff";
            set_pen_size 2;
            goto $x + seg_amount, $y - $height - 1;
            pen_down;
            goto $x - 2, $y - $height / 2;
            goto $x + seg_amount, $y + 1;
            goto $x + $width - seg_amount, $y + 1;
            goto $x + $width + 2, $y - $height / 2;
            goto $x + $width - seg_amount, $y - $height - 1;
            goto $x + seg_amount, $y - $height - 1;
            pen_up;
        }
    }
}

proc render_c_block x, y, width, height, slot_count, prong_1_height, prong_2_height, prong_3_height=0, prong_2_style="normal", prong_3_style="normal", end_style="normal", slot_1_height, slot_2_height=0, color, border_color {
    set_pen_color $color;
    local prong2y = $y - $prong_1_height - $slot_1_height;
    local prong3y = $y - $prong_1_height - $slot_1_height - $prong_2_height - $slot_2_height;


    # outer wall
    fill_rect $x + 2, $x + c_x_offset, $y - $height, $y - 1, 1;
    set_pen_size 4;
    goto $x + 2, $y - 2;
    pen_down;
    goto $x + 2, $y - $height + 2;
    pen_up;

    set_pen_size 4;
    goto $x + $width - 2, $y - 2;
    pen_down;
    goto $x + $width - 2, $y - $prong_1_height + 2;
    pen_up;

    set_pen_size 4;
    goto $x + $width - 2, prong2y - 2;
    pen_down;
    goto $x + $width - 2, prong2y - $prong_2_height + 2;
    pen_up;

    if $slot_count > 1 {
        set_pen_size 4;
        goto $x + $width - 2, prong3y - 2;
        pen_down;
        goto $x + $width - 2, prong3y - $prong_3_height + 2;
        pen_up;
    }

    # top prong top nub
    fill_rect $x + 7, $x + $width - 2, $y - $prong_1_height, $y - 3, 1;
    tri_fill $x + 7, $y, $x + 10, $y - 3, $x + 7, $y - 3, 0.5;
    tri_fill $x + 19, $y, $x + 16, $y - 3, $x + 19, $y - 3, 0.5;

    fill_rect $x + 19, $x + $width - 2, $y - 3, $y, 1; # fill top line

    fill_rect $x + inner_offset + 10, $x + inner_offset + 16, $y - $prong_1_height - 3, $y - $prong_1_height, 1; # top prong button nub
    tri_fill $x + inner_offset + 7, $y - $prong_1_height, $x + inner_offset + 10, $y - $prong_1_height - 3, $x + inner_offset + 10, $y - $prong_1_height, 0.5;
    tri_fill $x + inner_offset + 19, $y - $prong_1_height, $x + inner_offset + 16, $y - $prong_1_height - 3, $x + inner_offset + 16, $y - $prong_1_height, 0.5;

    # second prong
    if $prong_2_style == "cap" {
        fill_rect $x + c_x_offset, $x + $width - 2, prong2y - $prong_2_height, prong2y, 1;
    } else {
        tri_fill $x + inner_offset + 7, prong2y, $x + inner_offset + 10, prong2y - 3, $x + inner_offset + 7, prong2y - 3, 0.5;
        tri_fill $x + inner_offset + 19, prong2y, $x + inner_offset + 16, prong2y - 3, $x + inner_offset + 19, prong2y - 3, 0.5;
        fill_rect $x + c_x_offset, $x + inner_offset + 7, prong2y - 3, prong2y, 1;
        fill_rect $x + inner_offset + 19, $x + $width - 2, prong2y - 3, prong2y, 1;
        fill_rect $x + c_x_offset, $x + $width - 2, prong2y - $prong_2_height, prong2y - 3, 1;
    }

    if $slot_count > 1 {
        # second prong nub
        fill_rect $x + inner_offset + 10, $x + inner_offset + 16, prong2y - $prong_2_height - 3, prong2y - $prong_2_height, 1;
        tri_fill $x + inner_offset + 7, prong2y - $prong_2_height, $x + inner_offset + 10, prong2y - $prong_2_height - 3, $x + inner_offset + 10, prong2y - $prong_2_height, 0.5;
        tri_fill $x + inner_offset + 19, prong2y - $prong_2_height, $x + inner_offset + 16, prong2y - $prong_2_height - 3, $x + inner_offset + 16, prong2y - $prong_2_height, 0.5;

        # third prong
        if $prong_3_style == "cap" {
            fill_rect $x + c_x_offset, $x + $width - 2, prong3y - $prong_2_height, prong3y, 1;
        } else {
            tri_fill $x + inner_offset + 7, prong3y, $x + inner_offset + 10, prong3y - 3, $x + inner_offset + 7, prong3y - 3, 0.5;
            tri_fill $x + inner_offset + 19, prong3y, $x + inner_offset + 16, prong3y - 3, $x + inner_offset + 19, prong3y - 3, 0.5;
            fill_rect $x + c_x_offset, $x + inner_offset + 7, prong3y - 3, prong3y, 1;
            fill_rect $x + inner_offset + 19, $x + $width - 2, prong3y - 3, prong3y, 1;
            fill_rect $x + c_x_offset, $x + $width - 2, prong3y - $prong_2_height, prong3y - 3, 1;
        }

        if $end_style == "normal" {
            # third prong nub
            fill_rect $x + 10, $x + 16, prong3y - $prong_2_height - 3, prong3y - $prong_2_height, 1;
            tri_fill $x + 7, prong3y - $prong_2_height, $x + 10, prong3y - $prong_2_height - 3, $x + 10, prong3y - $prong_2_height, 0.5;
            tri_fill $x + 19, prong3y - $prong_2_height, $x + 16, prong3y - $prong_2_height - 3, $x + 16, prong3y - $prong_2_height, 0.5;
        }
    } else {
        if $end_style == "normal" {
            # second prong nub
            fill_rect $x + 10, $x + 16, prong2y - $prong_2_height - 3, prong2y - $prong_2_height, 1;
            tri_fill $x + 7, prong2y - $prong_2_height, $x + 10, prong2y - $prong_2_height - 3, $x + 10, prong2y - $prong_2_height, 0.5;
            tri_fill $x + 19, prong2y - $prong_2_height, $x + 16, prong2y - $prong_2_height - 3, $x + 16, prong2y - $prong_2_height, 0.5;
        }
    }

    # border rendering
    set_pen_size 1;
    set_pen_color $border_color;
    goto $x + 2, $y;
    pen_down;
    goto $x + 7, $y;
    goto $x + 10, $y - 3;
    goto $x + 16, $y - 3;
    goto $x + 19, $y;
    goto $x + $width - 2, $y;
    point_in_direction 90;
    local move_amount = 2 / 1.366;
    repeat 2 {
        turn_right 30;
        move move_amount;
    }
    goto $x + $width, $y - $prong_1_height + 2;
    point_in_direction 180;
    repeat 2 {
        turn_right 30;
        move move_amount;
    }
    goto $x + inner_offset + 19, $y - $prong_1_height;
    goto $x + inner_offset + 16, $y - $prong_1_height - 3;
    goto $x + inner_offset + 10, $y - $prong_1_height - 3;
    goto $x + inner_offset + 7, $y - $prong_1_height;
    goto $x + c_x_offset, $y - $prong_1_height;
    goto $x + c_x_offset, prong2y;

    if $prong_2_style == "normal" {
        goto $x + inner_offset + 7, prong2y;
        goto $x + inner_offset + 10, prong2y - 3;
        goto $x + inner_offset + 16, prong2y - 3;
        goto $x + inner_offset + 19, prong2y;
    }
    goto $x + $width - 2, prong2y;
    point_in_direction 90;
    repeat 2 {
        turn_right 30;
        move move_amount;
    }
    goto $x + $width, prong2y - $prong_2_height + 2;
    point_in_direction 180;
    repeat 2 {
        turn_right 30;
        move move_amount;
    }

    if $slot_count > 1 {
        goto $x + inner_offset + 19, prong2y - $prong_2_height;
        goto $x + inner_offset + 16, prong2y - $prong_2_height - 3;
        goto $x + inner_offset + 10, prong2y - $prong_2_height - 3;
        goto $x + inner_offset + 7, prong2y - $prong_2_height;

        goto $x + c_x_offset, prong2y - $prong_2_height;
        goto $x + c_x_offset, prong3y;

        if $prong_3_style == "normal" {
            goto $x + inner_offset + 7, prong3y;
            goto $x + inner_offset + 10, prong3y - 3;
            goto $x + inner_offset + 16, prong3y - 3;
            goto $x + inner_offset + 19, prong3y;
        }
        goto $x + $width - 2, prong3y;
        point_in_direction 90;
        repeat 2 {
            turn_right 30;
            move move_amount;
        }
        goto $x + $width, prong3y - $prong_2_height + 2;
        point_in_direction 180;
        repeat 2 {
            turn_right 30;
            move move_amount;
        }

        if $end_style == "normal" {
            # bottom of prong 3
            goto $x + 19, prong3y - $prong_3_height;
            goto $x + 16, prong3y - $prong_3_height - 3;
            goto $x + 10, prong3y - $prong_3_height - 3;
            goto $x + 7, prong3y - $prong_3_height;
        }
    } else {
        if $end_style == "normal" {
            goto $x + 19, prong2y - $prong_2_height;
            goto $x + 16, prong2y - $prong_2_height - 3;
            goto $x + 10, prong2y - $prong_2_height - 3;
            goto $x + 7, prong2y - $prong_2_height;
        }
    }
    set_x $x + 2;

    point_in_direction 270;
    repeat 2 {
        turn_right 30;
        move move_amount;
    }
    goto $x, $y - 2;
    point_in_direction 0;
    repeat 2 {
        turn_right 30;
        move move_amount;
    }

    pen_up;

}

proc render_text_label x, y, text {
    set_pen_color "#ffffff";
    print $x, ($y) - 7, 1, $text;
}

proc render_input block_shape, x, y, width, height, text, shape, color, is_highlighted, dropdown_shape, dropdown_color {
    if $shape == "reporter" {
        if $is_highlighted {
            # if dropdown shape is nothing or round, then we want to highlight if NOT editing an input (highlight_lightly)
            # since when editing an input, for dropdowns it's rendered differently
            # we also highlight it if dropdown shape is nothing and it's highlighted lightly,
            # since that's just editing a regular text input
            if ($dropdown_shape != "square" and not "editor"."highlight_lightly") or ($dropdown_shape == "" and "editor"."highlight_lightly") {
                set_pen_color "#ffffff";
                if "editor"."highlight_lightly" {
                    set_pen_transparency 50;
                }
                pen_size = $height + 6;
                set_pen_size 0;
                goto $x + pen_size / 2 - 3, $y - pen_size / 2 + 3;
                pen_down;
                set_pen_size pen_size;
                change_x $width - pen_size + 6;
                pen_up;

                set_pen_transparency 0;
            } elif $dropdown_shape == "square" {
                set_pen_color $color;
                if $block_shape == "reporter" or $block_shape == "boolean" {
                    fill_rect $x + 1, $x + $width - 2, $y - $height, $y - 1, 1;
                } else {
                    fill_rect $x + 1, $x + $width - 1, $y - $height - 1, $y + 1, 1;
                }
            }
        }
        if $dropdown_shape != "square" {
            set_pen_color $color;
            pen_size = $height + 2;
            set_pen_size 0;
            goto $x + pen_size / 2 - 1, $y - pen_size / 2 + 1;
            pen_down;
            set_pen_size pen_size;
            change_x $width - pen_size + 2;
            pen_up;

            if $dropdown_shape > "" {
                set_pen_color $dropdown_color;
            } else {
                set_pen_color "#ffffff";
            }
            if (not $is_highlighted and $dropdown_shape == "round") or $dropdown_shape == "" {
                pen_size = $height;
                set_pen_size 0;
                goto $x + pen_size / 2, $y - pen_size / 2;
                pen_down;
                set_pen_size pen_size;
                change_x $width - pen_size;
                pen_up;
            }
        } else {
            local move_amount = 2 / 1.366; # amount to turn per spet

            set_pen_size 1;
            set_pen_color $color;

            if $block_shape == "reporter" or $block_shape == "boolean" {
                goto $x, $y - 2.5;
                pen_down;
                point_in_direction 0;
                repeat 2 {
                    turn_right 30;
                    move move_amount;
                }
                goto $x + $width - 3, $y - 0.5;
                point_in_direction 90;
                repeat 2 {
                    turn_right 30;
                    move move_amount;
                }
                goto $x + $width - 1, $y - $height + 1.5;
                point_in_direction 180;
                repeat 2 {
                    turn_right 30;
                    move move_amount;
                }
                goto $x + 2, $y - $height - 0.5;
                point_in_direction 270;
                repeat 2 {
                    turn_right 30;
                    move move_amount;
                }
                goto $x, $y - 3.5;
            } else {
                goto $x, $y - 1;
                pen_down;
                point_in_direction 0;
                repeat 2 {
                    turn_right 30;
                    move move_amount;
                }
                goto $x + $width - 2, $y + 1;
                point_in_direction 90;
                repeat 2 {
                    turn_right 30;
                    move move_amount;
                }
                goto $x + $width, $y - $height + 0;
                point_in_direction 180;
                repeat 2 {
                    turn_right 30;
                    move move_amount;
                }
                goto $x + 2, $y - $height - 2;
                point_in_direction 270;
                repeat 2 {
                    turn_right 30;
                    move move_amount;
                }
                goto $x, $y - 2;
            }
            pen_up;
        }

        if $dropdown_shape > "" {
            pen_size = $height;
            set_pen_color "#ffffff";

            # dropdown arrow
            goto $x + $width - pen_size / 2, round($y - pen_size / 2);
            set_pen_size 0;
            pen_down;
            set_pen_size 1;
            change_x -4;
            goto x_position() + 2, y_position() - 2;
            goto x_position() + 2, y_position() + 2;
            pen_up;
            goto x_position() - 1.5, y_position() - 0.5;
            set_pen_size 2;
            pen_down;
            pen_up;
        } else {
            set_pen_color "#000000";
        }
        local text_x = $x + ($width) / 2;
        if $dropdown_shape > "" {
            text_x -= 4;
        }
        local text_y = ($y + ($y - $height)) / 2 - 4 + 1 * ($dropdown_shape == "square");
        print text_x, text_y, 1, $text, align: "c";
    }
    elif $shape == "boolean" {
        set_pen_color $color;
        local seg_amount = $height / 2;
        tri_fill $x + seg_amount, $y - $height, $x, $y - seg_amount, $x + seg_amount, $y, 0.5;
        fill_rect_hq $x + seg_amount, $x + $width - seg_amount, $y - $height, $y, 2;
        tri_fill $x + $width - seg_amount, $y - $height, $x + $width, $y - seg_amount, $x + $width - seg_amount, $y, 0.5;
        if $is_highlighted {
            set_pen_color "#ffffff";
            local seg_amount = $height / 2;
            set_pen_size 2;
            goto $x + seg_amount, $y - $height - 1;
            pen_down;
            goto $x - 2, $y - $height / 2;
            goto $x + seg_amount, $y + 1;
            goto $x + $width - seg_amount, $y + 1;
            goto $x + $width + 2, $y - $height / 2;
            goto $x + $width - seg_amount, $y - $height - 1;
            goto $x + seg_amount, $y - $height - 1;
            pen_up;
        }
    }
}

proc tri_fill ax, ay, bx, by, cx, cy, resolution {
    pen_up;
    set_pen_size $resolution;
    goto $ax, $ay;
    pen_down;
    goto $bx, $by;
    goto $cx, $cy;
    goto $ax, $ay;
    pen_up;
    local sideab = DIST($bx, $by, $ax, $ay);
    local sideac = DIST($cx, $cy, $ax, $ay);
    local sidebc = DIST($cx, $cy, $bx, $by);
    local semiperimiter = (sideab + (sideac + sidebc)) / 2;
    local radius = sqrt((semiperimiter - sideab) * ((semiperimiter - sideac) * (semiperimiter - sidebc)) / semiperimiter);
    set_x (sidebc * $ax + (sideac * $bx + sideab * $cx)) / (semiperimiter * 2);
    set_y (sidebc * $ay + (sideac * $by + sideab * $cy)) / (semiperimiter * 2);
    set_pen_size radius * 2;
    pen_down;
    if sideab < sidebc or sideac < sidebc {
        if sideab < sideac {
            local radius_factor = DIST(x_position(), y_position(), $cx, $cy);
        }
        else {
            local radius_factor = DIST(x_position(), y_position(), $bx, $by);
        }
    }
    else {
        local radius_factor = DIST(x_position(), y_position(), $ax, $ay);
    }
    radius_factor = (radius_factor - radius) / (2 * radius_factor);
    local offset_ax = (x_position() - $ax) / radius;
    local offset_ay = (y_position() - $ay) / radius;
    local offset_bx = (x_position() - $bx) / radius;
    local offset_by = (y_position() - $by) / radius;
    local offset_cx = (x_position() - $cx) / radius;
    local offset_cy = (y_position() - $cy) / radius;
    until radius < $resolution {
        radius *= radius_factor;
        set_pen_size radius * 2 + 0.5;
        goto $ax + radius * offset_ax, $ay + radius * offset_ay;
        goto $bx + radius * offset_bx, $by + radius * offset_by;
        goto $cx + radius * offset_cx, $cy + radius * offset_cy;
        goto $ax + radius * offset_ax, $ay + radius * offset_ay;
    }
    pen_up;
}

proc fill_rect_hq fromx, tox, fromy, toy, iter {
    local filler_width = $tox - $fromx;
    local filler_height = $toy - $fromy;
    if filler_width > filler_height {
        set_pen_size filler_height;
        goto $fromx + filler_height * 0.5, $fromy + filler_height * 0.5;
        pen_down;
        change_x filler_width - filler_height;
        local filler_inset = filler_height * 0.0732233047035;
    }
    else {
        set_pen_size filler_width;
        goto $fromx + filler_width * 0.5, $fromy + filler_width * 0.5;
        pen_down;
        if filler_width < filler_height {
            change_y filler_height - filler_width;
        }
        filler_inset = filler_width * 0.0732233047035;
    }
    repeat $iter {
        set_pen_size filler_inset * 2;
        goto $tox - filler_inset, $toy - filler_inset;
        set_x $fromx + filler_inset;
        set_y $fromy + filler_inset;
        set_x $tox - filler_inset;
        set_y $toy - filler_inset;
        filler_inset *= 0.146446609407;
    }
    pen_up;
}

proc fill_rect x1, x2, y1, y2, blah {
    set_pen_size 1;
    goto $x1, $y1;
    pen_down;
    set_x $x2;
    set_y $y2;
    set_x $x1;
    set_y $y1;
    pen_up;
    i0 = $x2 - $x1;
    i1 = $y2 - $y1;
    if i0 < 1 or i1 < 1 {
        stop_this_script;
    }
    if i1 < i0 {
        i0 = floor(i1);
        i1 = i0 / 2;
        set_pen_size i0;
        goto $x1 + i1, ($y1 + $y2) / 2;
        pen_down;
        set_x $x2 - i1;
        pen_up;
    }
    else {
        i0 = floor(i0);
        i1 = i0 / 2;
        set_pen_size i0;
        goto ($x1 + $x2) / 2, $y1 + i1;
        pen_down;
        set_y $y2 - i1;
        pen_up;
    }
    until i0 < 2 {
        i0 = 0.146446609 * i0;
        i1 = i0 / 2;
        set_pen_size i0;
        goto $x1 + i1, $y1 + i1;
        pen_down;
        set_x $x2 - i1;
        set_y $y2 - i1;
        set_x $x1 + i1;
        set_y $y1 + i1;
        pen_up;
    }
}


proc print x, y, size, text, align="" {
    plain_text round($x), round($y), $size, $text, $align;
}