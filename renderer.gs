hide;
costumes "assets/bcc12c24.svg" as "icon", "assets/71f420b2.svg" as "large", "assets/3339a295.svg" as " ", "assets/3339a295.svg" as "!", "assets/3339a295.svg" as "\"", "assets/3339a295.svg" as "#", "assets/3339a295.svg" as "$", "assets/3339a295.svg" as "%", "assets/3339a295.svg" as "&", "assets/3339a295.svg" as "'", "assets/3339a295.svg" as "(", "assets/3339a295.svg" as ")", "assets/3339a295.svg" as "*", "assets/3339a295.svg" as "+", "assets/3339a295.svg" as ",", "assets/3339a295.svg" as "-", "assets/3339a295.svg" as ".", "assets/3339a295.svg" as "/", "assets/3339a295.svg" as "0", "assets/3339a295.svg" as "1", "assets/3339a295.svg" as "2", "assets/3339a295.svg" as "3", "assets/3339a295.svg" as "4", "assets/3339a295.svg" as "5", "assets/3339a295.svg" as "6", "assets/3339a295.svg" as "7", "assets/3339a295.svg" as "8", "assets/3339a295.svg" as "9", "assets/3339a295.svg" as ":", "assets/3339a295.svg" as ";", "assets/3339a295.svg" as "<", "assets/3339a295.svg" as "=", "assets/3339a295.svg" as ">", "assets/3339a295.svg" as "?", "assets/3339a295.svg" as "@", "assets/3339a295.svg" as "A", "assets/3339a295.svg" as "B", "assets/3339a295.svg" as "C", "assets/3339a295.svg" as "D", "assets/3339a295.svg" as "E", "assets/3339a295.svg" as "F", "assets/3339a295.svg" as "G", "assets/3339a295.svg" as "H", "assets/3339a295.svg" as "I", "assets/3339a295.svg" as "J", "assets/3339a295.svg" as "K", "assets/3339a295.svg" as "L", "assets/3339a295.svg" as "M", "assets/3339a295.svg" as "N", "assets/3339a295.svg" as "O", "assets/3339a295.svg" as "P", "assets/3339a295.svg" as "Q", "assets/3339a295.svg" as "R", "assets/3339a295.svg" as "S", "assets/3339a295.svg" as "T", "assets/3339a295.svg" as "U", "assets/3339a295.svg" as "V", "assets/3339a295.svg" as "W", "assets/3339a295.svg" as "X", "assets/3339a295.svg" as "Y", "assets/3339a295.svg" as "Z", "assets/3339a295.svg" as "[", "assets/3339a295.svg" as "\\", "assets/3339a295.svg" as "]", "assets/3339a295.svg" as "^", "assets/3339a295.svg" as "_", "assets/3339a295.svg" as "`", "assets/3339a295.svg" as "a", "assets/3339a295.svg" as "b", "assets/3339a295.svg" as "c", "assets/3339a295.svg" as "d", "assets/3339a295.svg" as "e", "assets/3339a295.svg" as "f", "assets/3339a295.svg" as "g", "assets/3339a295.svg" as "h", "assets/3339a295.svg" as "i", "assets/3339a295.svg" as "j", "assets/3339a295.svg" as "k", "assets/3339a295.svg" as "l", "assets/3339a295.svg" as "m", "assets/3339a295.svg" as "n", "assets/3339a295.svg" as "o", "assets/3339a295.svg" as "p", "assets/3339a295.svg" as "q", "assets/3339a295.svg" as "r", "assets/3339a295.svg" as "s", "assets/3339a295.svg" as "t", "assets/3339a295.svg" as "u", "assets/3339a295.svg" as "v", "assets/3339a295.svg" as "w", "assets/3339a295.svg" as "x", "assets/3339a295.svg" as "y", "assets/3339a295.svg" as "z", "assets/3339a295.svg" as "{", "assets/3339a295.svg" as "|", "assets/3339a295.svg" as "}", "assets/3339a295.svg" as "~";

%include code/PTE_font.gs

proc plain_text x, y, size, text, align {
    set_pen_size $size;
    local x_offset = $x;
    local y_offset = $y;
    if $align == "c" {
        local text_width = width_of_size($text, $size);
        x_offset += text_width / -2;
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

onflag {
    scale = 1;
    offset_x = 0;
    offset_y = 0;
    forever {
        erase_all;
        draw_block "#4c97ff", 189, 21, -56 + offset_x, 0 + offset_y, "stack", scale, "#3373cc";
        render_input -23 + offset_x, -3 + offset_y, 16, 14, 10, "reporter", scale, "#3373cc";
        render_text_label -51 + offset_x, -6 + offset_y, "move", scale;
        render_text_label 102 + offset_x, -6 + offset_y, "steps", scale;
        draw_block "#9966ff", 105, 21, -56 + offset_x, -21 + offset_y, "stack", scale, "#774dcb";
        render_input 28 + offset_x, -24 + offset_y, 16, 14, 10, "reporter", scale, "#774dcb";
        render_text_label -51 + offset_x, -27 + offset_y, "change size by", scale;
        draw_block "#ffab19", 93, 21, -56 + offset_x, -42 + offset_y, "stack", scale, "#cf8b17";
        render_input -28 + offset_x, -45 + offset_y, 16, 14, 1, "reporter", scale, "#cf8b17";
        render_text_label -51 + offset_x, -48 + offset_y, "wait", scale;
        render_text_label -8 + offset_x, -48 + offset_y, "seconds", scale;
        draw_block "#5cb1d6", 173, 21, -56 + offset_x, -63 + offset_y, "stack", scale, "#2e8eb8";
        render_input -30 + offset_x, -66 + offset_y, 100, 14, "What's your name?", "reporter", scale, "#2e8eb8";
        render_text_label -51 + offset_x, -69 + offset_y, "ask", scale;
        render_text_label 75 + offset_x, -69 + offset_y, "and wait", scale;
        draw_block "#ffab19", 183, 21, -56 + offset_x, -84 + offset_y, "stack", scale, "#cf8b17";
        render_input -3 + offset_x, -87 + offset_y, 21, 14, "", "boolean", scale, "#cf8b17";
        render_text_label -51 + offset_x, -90 + offset_y, "wait until", scale;
        draw_block "#59c059", 119, 16, -23 + offset_x, -2 + offset_y, "reporter", scale, "#389438";
        render_text_label -17 + offset_x, -6 + offset_y, "pick random", scale;
        render_text_label 64 + offset_x, -6 + offset_y, "to", scale;
        render_input 44 + offset_x, -3 + offset_y, 16, 14, 1, "reporter", scale, "#389438";
        render_input 78 + offset_x, -3 + offset_y, 16, 14, 10, "reporter", scale, "#389438";
        draw_block "#59c059", 125, 16, -3 + offset_x, -86 + offset_y, "boolean", scale, "#389438";
        render_text_label 43 + offset_x, -90 + offset_y, "contains", scale;
        render_text_label 110 + offset_x, -90 + offset_y, "?", scale;
        render_input 4 + offset_x, -87 + offset_y, 34, 14, "apple", "reporter", scale, "#389438";
        render_input 89 + offset_x, -87 + offset_y, 16, 14, "a", "reporter", scale, "#389438";
    }
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
        local text_y = ($y * $scale + ($y * $scale - $height * $scale)) / 2 - 3 * $scale;
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
    local sideab = sqrt(($ax - $bx) * ($ax - $bx) + ($ay - $by) * ($ay - $by));
    local sideac = sqrt(($ax - $cx) * ($ax - $cx) + ($ay - $cy) * ($ay - $cy));
    local sidebc = sqrt(($bx - $cx) * ($bx - $cx) + ($by - $cy) * ($by - $cy));
    local semiperimiter = (sideab + (sideac + sidebc)) / 2;
    local radius = sqrt((semiperimiter - sideab) * ((semiperimiter - sideac) * (semiperimiter - sidebc)) / semiperimiter);
    set_x (sidebc * $ax + (sideac * $bx + sideab * $cx)) / (semiperimiter * 2);
    set_y (sidebc * $ay + (sideac * $by + sideab * $cy)) / (semiperimiter * 2);
    set_pen_size radius * 2;
    pen_down;
    if sideab < sidebc or sideac < sidebc {
        if sideab < sideac {
            local radius_factor = sqrt((x_position() - $cx) * (x_position() - $cx) + (y_position() - $cy) * (y_position() - $cy));
        }
        else {
            local radius_factor = sqrt((x_position() - $bx) * (x_position() - $bx) + (y_position() - $by) * (y_position() - $by));
        }
    }
    else {
        local radius_factor = sqrt((x_position() - $ax) * (x_position() - $ax) + (y_position() - $ay) * (y_position() - $ay));
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

onkey "left arrow" {
    offset_x += -1;
}

onkey "right arrow" {
    offset_x += 1;
}

onkey "up arrow" {
    offset_y += 1;
}

onkey "down arrow" {
    offset_y += -1;
}
