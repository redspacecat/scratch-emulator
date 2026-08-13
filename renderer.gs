hide;

%include code/PTE_font.gs
%include code/helpful_utils.gs
%include std/math

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

on "render_blocks" {
    start_time = days_since_2000();
    render_blocks;
    log "rendering took " & (days_since_2000() - start_time) * 86400000 & " ms";
}

struct InputRank {
    dist,
    block,
    input # input id in block
}

list queue;
list visited;

proc render_blocks {
    # # render regular blocks
    max_nesting_level = 0;
    InputRank h_i = highlighted_input;
    
    local i = 1;
    repeat length roots {
        local root = roots[i];
        delete queue;
        delete visited;

        add root to queue;
        add root to visited;
        until length queue == 0 {
            local current = queue[1];
            local currentIdx = b_idx(current);
            delete queue[1];
            render_one_block current, currentIdx;

            if bl_nesting_level(currentIdx) > max_nesting_level {
                max_nesting_level = bl_nesting_level(currentIdx);
            }

            local next = bl_next(currentIdx);
            if next > "" and next not in visited {
                add next to visited;
                add next to queue;
            }
            local input1 = b_input1_nested_block(currentIdx);
            local input2 = b_input2_nested_block(currentIdx);
            local input3 = b_input3_nested_block(currentIdx);
            if input1 > "" and input1 not in visited { add input1 to visited; add input1 to queue; }
            if input2 > "" and input2 not in visited { add input2 to visited; add input2 to queue; }
            if input3 > "" and input3 not in visited { add input3 to visited; add input3 to queue; }
        }
        
        i++;
    }
}

proc render_one_block blockID, blockIdx {
    local i = $blockIdx;
    # color and background color are obtained from index of category,
    # which is a number, in the colors list
    draw_block
        colors[b_category],
        b_width,
        b_height,
        b_x,
        b_y,
        b_shape,
        scale,
        colors[b_category + 1],
        is_highlighted: h_i.block == b_parent and "editor"."highlighted_input_nested_block" == $blockID;

    local counter = 0; # rendering text labels
    repeat 3 {
        local offset = i + b_labels + counter;
        if (blocks[offset + 1] > "") { # checking + 1 to check x instead of text, which could be blank
            render_text_label
                blocks[offset + 1],
                (b_y - (b_height / 2)) + 4,
                blocks[offset],
                scale;
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
                blocks[offset + b_input_x],
                ((b_y + (b_y - b_height)) / 2) + blocks[offset + b_input_height] / 2,
                blocks[offset + b_input_width],
                blocks[offset + b_input_height],
                blocks[offset + b_input_text],
                blocks[offset + b_input_shape],
                scale,
                colors[b_category + 1],
                is_highlighted: h_i.block == $blockID and h_i.input == inputNum;
        }
        counter += INPUT_LENGTH; # = number of properties in Input
        inputNum++;
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

proc draw_block color, width, height, x, y, shape, scale, border_color, is_highlighted {
    if $shape == "stack" {
        set_pen_color $color;
        local drawx = $x * $scale;
        local drawy = $y * $scale;
        local scaled_w = $width * $scale;
        local scaled_h = $height * $scale;
        fill_rect drawx + 2 * $scale, drawx + 7 * $scale, drawy - scaled_h, drawy, 2;
        set_pen_size 4 * $scale;
        goto drawx + 2 * $scale, drawy - 2 * $scale;
        pen_down;
        goto drawx + 2 * $scale, drawy - scaled_h + 2 * $scale;
        pen_up;
        fill_rect drawx + 19 * $scale, drawx + scaled_w - 2 * $scale, drawy - scaled_h, drawy, 2;
        set_pen_size 4 * $scale;
        goto drawx + scaled_w - 2 * $scale, drawy - 2 * $scale;
        pen_down;
        goto drawx + scaled_w - 2 * $scale, drawy - scaled_h + 2 * $scale;
        pen_up;
        fill_rect drawx + 7 * $scale, drawx + 19 * $scale, drawy - scaled_h, drawy - 3 * $scale, 2;
        tri_fill drawx + 7 * $scale, drawy, drawx + 10 * $scale, drawy - 3 * $scale, drawx + 7 * $scale, drawy - 3 * $scale, 0.5;
        tri_fill drawx + 19 * $scale, drawy, drawx + 19 * $scale, drawy - 3 * $scale, drawx + 16 * $scale, drawy - 3 * $scale, 0.5;
        tri_fill drawx + 7 * $scale, drawy - scaled_h, drawx + 10 * $scale, drawy - scaled_h - 3 * $scale, drawx + 19 * $scale, drawy - scaled_h, 0.5;
        tri_fill drawx + 19 * $scale, drawy - scaled_h, drawx + 16 * $scale, drawy - scaled_h - 3 * $scale, drawx + 10 * $scale, drawy - scaled_h - 3 * $scale, 0.5;
        set_pen_size 1 * $scale;
        set_pen_color $border_color;
        goto drawx + 3 * $scale, drawy;
        pen_down;
        goto drawx + 7 * $scale, drawy;
        goto drawx + 10 * $scale, drawy - 3 * $scale;
        goto drawx + 16 * $scale, drawy - 3 * $scale;
        goto drawx + 19 * $scale, drawy;
        goto drawx + scaled_w - 2 * $scale, drawy;
        point_in_direction 90;
        local move_amount = 2 / 1.366;
        repeat 2 {
            turn_right 30;
            move move_amount * $scale;
        }
        # goto drawx + scaled_w, drawy - 2 * $scale;
        goto drawx + scaled_w, drawy - scaled_h + 2 * $scale;
        point_in_direction 180;
        repeat 2 {
            turn_right 30;
            move move_amount * $scale;
        }
        goto drawx + 19 * $scale, drawy - scaled_h;
        goto drawx + 16 * $scale, drawy - scaled_h - 3 * $scale;
        goto drawx + 10 * $scale, drawy - scaled_h - 3 * $scale;
        goto drawx + 7 * $scale, drawy - scaled_h;
        goto drawx + 2 * $scale, drawy - scaled_h;
        point_in_direction 270;
        repeat 2 {
            turn_right 30;
            move move_amount * $scale;
        }
        goto drawx, drawy - 2 * $scale;
        point_in_direction 0;
        repeat 2 {
            turn_right 30;
            move move_amount * $scale;
        }
        goto drawx + 3 * $scale, drawy;
        pen_up;
    }
    elif $shape == "reporter" {
        if $is_highlighted {
            set_pen_color "#ffffff";
            pen_size = $height * $scale + 6 * $scale;
            set_pen_size 0; # this has to be done to avoid a second pen stroke adding a few extra pixels
            goto $x * $scale + pen_size / 2 - 3 * $scale, $y * $scale - pen_size / 2 + 3 * $scale;
            pen_down;
            set_pen_size pen_size;
            change_x $width * $scale - pen_size + 6 * $scale;
            pen_up;
        }

        pen_size = $height * $scale + 2 * $scale;
        set_pen_color $border_color;
        set_pen_size 0;
        goto $x * $scale + pen_size / 2 - 1 * $scale, $y * $scale - pen_size / 2 + 1 * $scale;
        pen_down;
        set_pen_size pen_size;
        change_x $width * $scale - pen_size + 2 * $scale;
        pen_up;

        pen_size = $height * $scale;
        set_pen_color $color;
        set_pen_size 0;
        goto $x * $scale + pen_size / 2, $y * $scale - pen_size / 2;
        pen_down;
        set_pen_size pen_size;
        change_x $width * $scale - pen_size;
        pen_up;
    }
    elif $shape == "boolean" {
        set_pen_color $color;
        local seg_amount = $height / 2 * $scale;
        tri_fill $x * $scale + seg_amount, $y * $scale - $height * $scale, $x * $scale, $y * $scale - seg_amount, $x * $scale + seg_amount, $y * scale, 1;
        fill_rect $x * $scale + seg_amount, $x * $scale + $width * $scale - seg_amount, $y * $scale - $height * $scale, $y * $scale, 2;
        tri_fill $x * $scale + $width * $scale - seg_amount, $y * $scale - $height * $scale, $x * $scale + $width * $scale, $y * $scale - seg_amount, $x * scale + $width * $scale - seg_amount, $y * scale, 1;
        
        goto $x * $scale + seg_amount, $y * $scale - $height * $scale - 1 * $scale;
        set_pen_size 1 * $scale;
        set_pen_color $border_color;
        pen_down;
        goto $x * $scale - 1 * $scale, $y * $scale - $height * $scale / 2;
        goto $x * $scale + seg_amount, $y * $scale;
        goto $x * $scale + $width * $scale - seg_amount, $y * $scale;
        goto $x * $scale + $width * $scale + 1 * $scale, $y * $scale - $height * $scale / 2;
        goto $x * $scale + $width * $scale - seg_amount, $y * $scale - $height * $scale - 1 * $scale;
        goto $x * $scale + seg_amount, $y * $scale - $height * $scale - 1 * $scale;
        pen_up;

        if $is_highlighted {
            set_pen_color "#ffffff";
            set_pen_size 2;
            goto $x * $scale + seg_amount, $y * $scale - $height * $scale - 1 * $scale;
            pen_down;
            goto $x * $scale - 2 * $scale, $y * $scale - $height * $scale / 2;
            goto $x * $scale + seg_amount, $y * $scale + 1;
            goto $x * $scale + $width * $scale - seg_amount, $y * $scale + 1;
            goto $x * $scale + $width * $scale + 2 * $scale, $y * $scale - $height * $scale / 2;
            goto $x * $scale + $width * $scale - seg_amount, $y * $scale - $height * $scale - 1 * $scale;
            goto $x * $scale + seg_amount, $y * $scale - $height * $scale - 1 * $scale;
            pen_up;
        }
    }
}

proc render_text_label x, y, text, scale {
    set_pen_color "#ffffff";
    print $x * $scale, ($y * $scale) - 7 * $scale, 1 * $scale, $text;
}

proc render_input x, y, width, height, text, shape, scale, color, is_highlighted {
    if $shape == "reporter" {
        if $is_highlighted {
            set_pen_color "#ffffff";
            pen_size = $height * $scale + 6 * $scale;
            set_pen_size 0;
            goto $x * $scale + pen_size / 2 - 3 * $scale, $y * $scale - pen_size / 2 + 3 * $scale;
            pen_down;
            set_pen_size pen_size;
            change_x $width * $scale - pen_size + 6 * $scale;
            pen_up;
        }
        set_pen_color $color;
        pen_size = $height * $scale + 2 * $scale;
        set_pen_size 0;
        goto $x * $scale + pen_size / 2 - 1 * $scale, $y * $scale - pen_size / 2 + 1 * $scale;
        pen_down;
        set_pen_size pen_size;
        change_x $width * $scale - pen_size + 2 * $scale;
        pen_up;

        pen_size = $height * $scale;
        set_pen_size 0;
        set_pen_color "#ffffff";
        goto $x * $scale + pen_size / 2, $y * $scale - pen_size / 2;
        pen_down;
        set_pen_size pen_size;
        change_x $width * $scale - pen_size;
        pen_up;

        set_pen_color "#000000";
        local text_x = $x * $scale + ($width * $scale) / 2;
        local text_y = ($y * $scale + ($y * $scale - $height * $scale)) / 2 - 4 * $scale;
        print text_x, text_y, 1 * $scale, $text, align: "c";
    }
    elif $shape == "boolean" {
        set_pen_color $color;
        local seg_amount = $height / 2 * $scale;
        tri_fill $x * $scale + seg_amount, $y * $scale - $height * $scale, $x * $scale, $y * $scale - seg_amount, $x * $scale + seg_amount, $y * $scale, 0.5;
        fill_rect $x * $scale + seg_amount, $x * $scale + $width * $scale - seg_amount, $y * $scale - $height * $scale, $y * $scale, 2;
        tri_fill $x * $scale + $width * $scale - seg_amount, $y * $scale - $height * $scale, $x * $scale + $width * $scale, $y * $scale - seg_amount, $x * $scale + $width * $scale - seg_amount, $y * $scale, 0.5;
        if $is_highlighted {
            set_pen_color "#ffffff";
            local seg_amount = $height / 2 * $scale;
            set_pen_size 2;
            goto $x * $scale + seg_amount, $y * $scale - $height * $scale - 1 * $scale;
            pen_down;
            goto $x * $scale - 2 * $scale, $y * $scale - $height * $scale / 2;
            goto $x * $scale + seg_amount, $y * $scale + 1;
            goto $x * $scale + $width * $scale - seg_amount, $y * $scale + 1;
            goto $x * $scale + $width * $scale + 2 * $scale, $y * $scale - $height * $scale / 2;
            goto $x * $scale + $width * $scale - seg_amount, $y * $scale - $height * $scale - 1 * $scale;
            goto $x * $scale + seg_amount, $y * $scale - $height * $scale - 1 * $scale;
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

proc fill_rect fromx, tox, fromy, toy, iter {
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

proc print x, y, size, text, align="" {
    plain_text round($x), round($y), $size, $text, $align;
}