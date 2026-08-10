hide;

%include code/PTE_font.gs
%include code/helpful_utils.gs
%include std/math

var scale = 1;

# onflag {
#     scale = 1;
#     offset_x = 0;
#     offset_y = 0;
#     forever {
#         erase_all;
#         draw_block "#4c97ff", 189, 21, -56 + offset_x, 0 + offset_y, "stack", scale, "#3373cc";
#         render_input -23 + offset_x, -4 + offset_y, 16, 12, 10, "reporter", scale, "#3373cc";
#         render_text_label -51 + offset_x, -6 + offset_y, "move", scale;
#         render_text_label 102 + offset_x, -6 + offset_y, "steps", scale;
#         draw_block "#9966ff", 105, 21, -56 + offset_x, -21 + offset_y, "stack", scale, "#774dcb";
#         render_input 28 + offset_x, -25 + offset_y, 16, 12, 10, "reporter", scale, "#774dcb";
#         render_text_label -51 + offset_x, -27 + offset_y, "change size by", scale;
#         draw_block "#ffab19", 93, 21, -56 + offset_x, -42 + offset_y, "stack", scale, "#cf8b17";
#         render_input -28 + offset_x, -46 + offset_y, 16, 12, 1, "reporter", scale, "#cf8b17";
#         render_text_label -51 + offset_x, -48 + offset_y, "wait", scale;
#         render_text_label -8 + offset_x, -48 + offset_y, "seconds", scale;
#         draw_block "#5cb1d6", 173, 21, -56 + offset_x, -63 + offset_y, "stack", scale, "#2e8eb8";
#         render_input -30 + offset_x, -67 + offset_y, 100, 12, "What's your name?", "reporter", scale, "#2e8eb8";
#         render_text_label -51 + offset_x, -69 + offset_y, "ask", scale;
#         render_text_label 75 + offset_x, -69 + offset_y, "and wait", scale;
#         draw_block "#ffab19", 183, 21, -56 + offset_x, -84 + offset_y, "stack", scale, "#cf8b17";
#         render_input -3 + offset_x, -89 + offset_y, 21, 12, "", "boolean", scale, "#cf8b17";
#         render_text_label -51 + offset_x, -90 + offset_y, "wait until", scale;
#         draw_block "#59c059", 119, 16, -23 + offset_x, -2 + offset_y, "reporter", scale, "#389438";
#         render_text_label -17 + offset_x, -6 + offset_y, "pick random", scale;
#         render_text_label 64 + offset_x, -6 + offset_y, "to", scale;
#         render_input 44 + offset_x, -4 + offset_y, 16, 12, 1, "reporter", scale, "#389438";
#         render_input 77 + offset_x, -4 + offset_y, 16, 12, 10, "reporter", scale, "#389438";
#         draw_block "#59c059", 125, 16, -3 + offset_x, -86 + offset_y, "boolean", scale, "#389438";
#         render_text_label 43 + offset_x, -90 + offset_y, "contains", scale;
#         render_text_label 110 + offset_x, -90 + offset_y, "?", scale;
#         render_input 4 + offset_x, -88 + offset_y, 34, 12, "apple", "reporter", scale, "#389438";
#         render_input 89 + offset_x, -88 + offset_y, 16, 12, "a", "reporter", scale, "#389438";
#     }
# }

on "render_blocks" {
    render_blocks;
}

proc render_blocks {
    local i = 1;
    repeat length(blocks) / BLOCK_LENGTH {
        # color and background color are obtained from index of category,
        # which is a number, in the colors list
        draw_block colors[b_category], b_width, b_height, b_x, b_y, b_shape, scale, colors[b_category + 1];
        
        local counter = 0; # rendering text labels
        repeat 3 {
            local offset = i + b_labels + counter;
            if (blocks[offset + 1] > "") { # checking + 1 to check x instead of text, which could be blank
                render_text_label blocks[offset + 1], (b_y - (b_height / 2)) + 4, blocks[offset], scale;
            }
            counter += TEXT_LABEL_LENGTH; # = number of properties in TextLabel
        }

        local counter = 0; # rendering inputs
        repeat 3 {
            local offset = i + b_inputs + counter;
            if (blocks[offset] > "") { # checks if inputs[shape] > "", if so valid input
                render_input
                    blocks[offset + b_input_x],
                    ((b_y + (b_y - b_height)) / 2) + blocks[offset + b_input_height] / 2,
                    blocks[offset + b_input_width],
                    blocks[offset + b_input_height],
                    blocks[offset + b_input_text],
                    blocks[offset + b_input_shape],
                    scale,
                    colors[b_category + 1];
            }
            counter += INPUT_LENGTH; # = number of properties in Input
        }
        i += 32;
    }
}

proc plain_text x, y, size, text, align {
    set_pen_size $size;
    local x_offset = $x;
    local y_offset = $y;
    if $align == "c" {
        local text_width = width_of_size($text, $size);
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

func width_of_size(text, size) {
    local text_width = 0;
    local txt_i = 1;
    repeat length($text) {
        switch_costume $text[txt_i];
        font_char_index = pte_font_1[costume_number() + 6];
        text_width += $size * (2 + pte_font_1[2 + font_char_index]);
        txt_i += 1;
    }
    return text_width;
}

proc draw_block color, width, height, x, y, shape, scale, border_color {
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
        tri_fill drawx + 7 * $scale, drawy, drawx + 10 * $scale, drawy - 3 * $scale, drawx + 7 * $scale, drawy - 3 * $scale, 1 * $scale;
        tri_fill drawx + 19 * $scale, drawy, drawx + 19 * $scale, drawy - 3 * $scale, drawx + 16 * $scale, drawy - 3 * $scale, 1 * $scale;
        tri_fill drawx + 7 * $scale, drawy - scaled_h, drawx + 10 * $scale, drawy - scaled_h - 3 * $scale, drawx + 19 * $scale, drawy - scaled_h, 1 * $scale;
        tri_fill drawx + 19 * $scale, drawy - scaled_h, drawx + 16 * $scale, drawy - scaled_h - 3 * $scale, drawx + 10 * $scale, drawy - scaled_h - 3 * $scale, 1 * $scale;
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
        repeat 3 {
            turn_right 30;
            move 1 * $scale;
        }
        goto drawx + scaled_w, drawy - scaled_h + 2 * $scale;
        repeat 3 {
            turn_right 30;
            move 1 * $scale;
        }
        goto drawx + 19 * $scale, drawy - scaled_h;
        goto drawx + 16 * $scale, drawy - scaled_h - 3 * $scale;
        goto drawx + 10 * $scale, drawy - scaled_h - 3 * $scale;
        goto drawx + 7 * $scale, drawy - scaled_h;
        goto drawx + 2 * $scale, drawy - scaled_h;
        point_in_direction -90;
        repeat 3 {
            turn_right 30;
            move 1 * $scale;
        }
        goto drawx, drawy - 2 * $scale;
        repeat 3 {
            turn_right 30;
            move 1 * $scale;
        }
        goto drawx + 3 * $scale, drawy;
        pen_up;
    }
    elif $shape == "reporter" {
        pen_size = $height * $scale + 2 * $scale;
        set_pen_color $border_color;
        set_pen_size pen_size;
        goto $x * $scale + pen_size / 2 - 1 * $scale, $y * $scale - pen_size / 2 + 1 * $scale;
        pen_down;
        change_x $width * $scale - pen_size + 2 * $scale;
        pen_up;
        pen_size = $height * $scale;
        set_pen_color $color;
        set_pen_size pen_size;
        goto $x * $scale + pen_size / 2, $y * $scale - pen_size / 2;
        pen_down;
        change_x $width * $scale - pen_size;
        pen_up;
    }
    elif $shape == "boolean" {
        set_pen_color $color;
        tri_fill $x * $scale + 7 * $scale, $y * $scale, $x * $scale, $y * $scale - $height * $scale / 2, $x * $scale + 7 * $scale, $y * $scale - $height * $scale, 1 * $scale;
        fill_rect $x * $scale + 7 * $scale, $x * $scale + $width * $scale - 7 * $scale, $y * $scale - $height * $scale, $y * $scale, 2;
        tri_fill $x * $scale + $width * $scale, $y * $scale - $height * $scale / 2, $x * $scale + $width * $scale - 7 * $scale, $y * $scale, $x * $scale + $width * $scale - 7 * $scale, $y * $scale - $height * $scale, 1 * $scale;
        goto $x * $scale + 6 * $scale, $y * $scale - $height * $scale - 1 * $scale;
        set_pen_size 1 * $scale;
        set_pen_color $border_color;
        pen_down;
        goto $x * $scale - 1 * $scale, $y * $scale - $height * $scale / 2;
        goto $x * $scale + 6 * $scale, $y * $scale;
        goto $x * $scale + $width * $scale - 6 * $scale, $y * $scale;
        goto $x * $scale + $width * $scale + 1 * $scale, $y * $scale - $height * $scale / 2;
        goto $x * $scale + $width * $scale - 6 * $scale, $y * $scale - $height * $scale - 1 * $scale;
        goto $x * $scale + 6 * $scale, $y * $scale - $height * $scale - 1 * $scale;
        pen_up;
    }
}

proc render_text_label x, y, text, scale {
    set_pen_color "#ffffff";
    print $x * $scale, ($y * $scale) - 7 * $scale, 1 * $scale, $text;
}

proc render_input x, y, width, height, text, shape, scale, color {
    if $shape == "reporter" {
        set_pen_color $color;
        pen_size = $height * $scale + 2 * $scale;
        set_pen_size pen_size;
        goto $x * $scale + pen_size / 2 - 1 * $scale, $y * $scale - pen_size / 2 + 1 * $scale;
        pen_down;
        change_x $width * $scale - pen_size + 2 * $scale;
        pen_up;
        pen_size = $height * $scale;
        set_pen_size pen_size;
        set_pen_color "#ffffff";
        goto $x * $scale + pen_size / 2, $y * $scale - pen_size / 2;
        pen_down;
        change_x $width * $scale - pen_size;
        pen_up;
        set_pen_color "#000000";
        local text_x = $x * $scale + ($width * $scale) / 2;
        local text_y = ($y * $scale + ($y * $scale - $height * $scale)) / 2 - 4 * $scale;
        print text_x, text_y, 1 * $scale, $text, align: "c";
    }
    elif $shape == "boolean" {
        set_pen_color $color;
        tri_fill $x * $scale + ($width * $scale) / 3, $y * $scale, $x * $scale, $y * $scale - $height * $scale / 2, $x * $scale + ($width * $scale) / 3, $y * $scale - $height * $scale, 1 * $scale;
        fill_rect $x * $scale + ($width * $scale) / 3, $x * $scale + ($width * $scale) / 3 * 2, $y * $scale - $height * $scale, $y * $scale, 2;
        tri_fill $x * $scale + $width * $scale, $y * $scale - $height * $scale / 2, $x * $scale + ($width * $scale) / 3 * 2, $y * $scale, $x * $scale + ($width * $scale) / 3 * 2, $y * $scale - $height * $scale, 1 * $scale;
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

# onkey "left arrow" {
#     offset_x += -1;
# }

# onkey "right arrow" {
#     offset_x += 1;
# }

# onkey "up arrow" {
#     offset_y += 1;
# }

# onkey "down arrow" {
#     offset_y += -1;
# }
