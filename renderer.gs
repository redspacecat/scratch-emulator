%include std/math
%include std/list
%include code/PTE_font
%include code/PTE_costumes
%include code/helpful_utils
%include code/themes

costumes "assets/images/costumes/main/*";
costumes "assets/images/costumes/other/*";
costumes "assets/images/costumes/other2/*";
costumes "assets/images/large.svg" as "big";

costumes "assets/images/rotate-right.svg" as "@r",
"assets/images/rotate-left.svg" as "@l",
"assets/images/greenflag.svg" as "@g",
"assets/images/pen-icon.svg" as "@p",
"assets/images/music-icon.svg" as "@m",
"assets/images/delete-icon.png",
"assets/images/light-dark-detector.svg",
"assets/images/small-dot.png";

list ui_colors;
list colors;

list costume_widths;
list costume_heights;

on "update_resolution" {
    measure_resolution;
}

on "init_renderer" {
    measure_resolution;
    measure_costumes;
    get_color_theme;
    load_theme editor_theme, "normal";
}

on "update_theme" {
    load_theme editor_theme, editor_colors;
}

nowarp proc get_color_theme {
    editor_theme = "";
    switch_costume "light-dark-detector";
    show;
    clone;
    wait_until(editor_theme > "");
    hide;
}

onclone {
    # check if the clone is touching the a certain color in the costume
    # this color changes depending on whether the device is in light or dark mode
    editor_theme = if (touching_color("#008000")) "dark" else "light";
    delete_this_clone;
}

onkey "t" {
    if RUNNING {
        stop_this_script;
    }

    if editor_theme == "light" {
        load_theme "dark", editor_colors;
    } else {
        if editor_colors == "dark" {
            load_theme "light", "normal";
        } else {
            load_theme "light", editor_colors;
        }
    }
}

onkey "b" {
    if RUNNING {
        stop_this_script;
    }
    
    if editor_colors == "normal" {
        load_theme editor_theme, "high contrast";
    } elif editor_colors == "high contrast" {
        if editor_theme == "dark" {
            load_theme editor_theme, "dark";
        } else {
            load_theme editor_theme, "normal";
        }
    } else {
        load_theme editor_theme, "normal";
    }
}

on "render_editor" {
    if REDRAW {
        erase_all;
    }

    switch_costume "large";

    if selected_workspace == Workspace.Code {
        render_dots;
        render_blocks;
        render_palette_sidebar;
        render_dragged_blocks;
        render_other_ui;
    } elif selected_workspace == Workspace.Costumes {
        if REDRAW {
            render_costumes;
        }
    } else {
        if REDRAW {
            render_sounds;
        }
    }
    render_demo_projects;
    render_menubar;
    render_sprite_sidebar;

    REDRAW = false;
}

list queue;
list visited;

proc render_blocks {
    if REDRAW {
        # render regular blocks
        max_nesting_level = 0;
        InputRank h_i = highlighted_input;

        if h_c_placement.preview_idx > "" {
            render_one_block h_c_placement.preview_idx;
        }
        
        local i = 1;
        repeat length roots {
            local rootIdx = roots[i];
            if rootIdx != "editor"."dragged_script_idx" { # don't draw dragged blocks so they can be drawn on top
                render_one_root rootIdx;
            }

            i++;
        }
    }

    if PALETTE_SHOWN {
        set_pen_size 0;
        goto (-205 + PALETTE_MAX_X) / 2 - PALETTE_SCROLL_X - 1 - stage_w_change, 180;
        if LAG_MODE {
            pen_down;
            set_pen_color ui_c(Main);
            set_pen_size 205 + PALETTE_MAX_X;
        } else {
            pen_down;
            set_pen_color ui_c(MainTransparent);
            set_pen_transparency 30;
            set_pen_size 205 + PALETTE_MAX_X;
        }
        change_y -360;
        pen_up;

        local i = 1;
        until i == PALETTE_END {
            render_one_block i;
            i += BLOCK_LENGTH;
        }

        set_pen_size 4;
        set_pen_color ui_c(PaletteScrollbar);
        goto PALETTE_MAX_X - 4 - PALETTE_SCROLL_X - stage_w_change, 156 - (344 - 7 - 30) * (PALETTE_SCROLL_Y / "editor"."palette_y_max");
        pen_down;
        change_y -30;
        pen_up;

        render_palette_text;
    }

    render_dropdown;
}

proc render_dragged_blocks {
    if "editor"."dragged_script_idx" > 0 {
        render_one_root "editor"."dragged_script_idx";
    }
}

proc render_dropdown {
    if REDRAW {
        local d = "editor"."dropdown";
        if d > 0 {
            local dx = "editor"."dropdown_x";
            local dy = "editor"."dropdown_y" + round("editor"."dropdown_offset");
            local dwidth = "editor"."dropdown_width";
            local dheight = "editor"."dropdown_height";
            local dscroll = "editor"."dropdown_scroll";
            local dhovered = "editor"."dropdown_hovered";
            local dfacing = "editor"."dropdown_direction";

            # dropdown arrow
            set_pen_size 2;
            set_pen_color colors[b_category(d) + 1];
            if dfacing == 0 {
                goto "editor"."dropdown_input_x" - 8, dy;
                pen_down;
                goto x_position() + 8, y_position() + 6;
                goto x_position() + 8, y_position() - 6;
                pen_up;
            } else {
                goto "editor"."dropdown_input_x" - 8, dy - dheight - 2;
                pen_down;
                goto x_position() + 8, y_position() - 6;
                goto x_position() + 8, y_position() + 6;
                pen_up;
            }

            # borders around dropdown
            set_pen_color colors[b_category(d) + 1];
            goto dx + 2, dy - 2;
            set_pen_size 6;
            pen_down;
            change_x dwidth - 2;
            change_y -(dheight - 2);
            change_x -(dwidth - 2);
            change_y dheight - 2;
            pen_up;
            set_pen_color colors[b_category(d)];
            goto dx + 3, dy - 3;
            set_pen_size 6;
            pen_down;
            change_x dwidth - 4;
            change_y -(dheight - 4);
            change_x -(dwidth - 4);
            change_y dheight - 4;
            pen_up;

            # hovered item
            set_pen_color colors[b_category(d)];
            fill_rect dx + 5, dx + dwidth - 3, dy - dheight + 4, dy - 4;
            if dhovered > -1 {
                set_pen_color colors[b_category(d) + 2];
                local y = dy - dhovered * 20 - dscroll;
                fill_rect dx + 2, dx + dwidth - 2, MAX(dy - dheight, y - 20), MIN(dy - 3, y - 3);
            }

            # text
            local i = 1;
            repeat length dropdown_data {
                local y = dy - i * 20 + 7 - dscroll;
                if y < dy - 8 and y > dy - dheight + 3 {
                    if dropdown_data[i] == get_block_input(d, "editor"."dropdown_input", b_input_text) {
                        set_pen_color ui_c(DropdownCheckMark);
                        set_pen_size 1;
                        goto dx + 11, y + 6;
                        pen_down;
                        goto dx + 7, y - 2;
                        goto dx + 4, y + 1;
                        pen_up;
                    }
                    set_pen_color ui_c(BlockText);
                    plain_text round(dx + 17), round(y), 1, dropdown_data[i], "l", true; 
                }
                i++;
            }

            # scrollbar
            if length dropdown_data > 7 {
                set_pen_color ui_c(DropdownScrollbar);
                set_pen_size 4;
                local total_height = length dropdown_data * 20;
                local track_height = dheight - 5;
                local scrollbar_height = track_height * (dheight / total_height);
                goto dx + dwidth - 2, dy - 2 - track_height * (-dscroll / total_height);
                pen_down;
                change_y -scrollbar_height;
                pen_up;
            }

            # dropdown arrow fill
            set_pen_size 2;
            set_pen_color colors[b_category(d)];
            if dfacing == 0 {
                set_pen_color colors[b_category(d)];
                goto "editor"."dropdown_input_x" - 7, dy - 0.5;
                pen_down;
                goto x_position() + 7, y_position() + 5;
                goto x_position() + 7, y_position() - 5;
                pen_up;
            } else {
                set_pen_color colors[b_category(d)];
                goto "editor"."dropdown_input_x" - 7, dy - dheight - 1.5;
                pen_down;
                goto x_position() + 7, y_position() - 5;
                goto x_position() + 7, y_position() + 5;
                pen_up;
            }
            goto "editor"."dropdown_input_x", if (dfacing) dy - dheight - 4 else dy + 2;
            set_pen_size 6;
            pen_down;
            pen_up;
            goto "editor"."dropdown_input_x" - 4, if (dfacing) dy - dheight - 2 else dy;
            set_pen_size 2;
            pen_down;
            change_x 8;
            pen_up;
        }
    }
}

proc render_demo_projects {
        if REDRAW {
        if "editor"."demo_projects_open" > 0 {
            local dscroll = 0;
            local dhovered = "editor"."demo_projects_hovered";

            # borders around menu
            set_pen_color ui_c(NavButtonSelected);
            goto d_x + 2, d_y - 2;
            set_pen_size 16;
            pen_down;
            change_x d_width - 2;
            change_y -(d_height - 2);
            change_x -(d_width - 2);
            change_y d_height - 2;
            pen_up;

            set_pen_color ui_c(Main);
            fill_rect d_x + 2, d_x + d_width - 2, d_y - d_height + 2, d_y - 2;
            if dhovered > -1 {
                set_pen_color ui_c(NavButtonHovered);
                local y = d_y - 20 - dhovered * 20 - dscroll;
                fill_rect d_x + 2, d_x + d_width - 2, MAX(d_y - d_height, y - 20), MIN(d_y - 3, y - 3);
            }

            set_pen_color ui_c(MainText);
            plain_text d_x + d_width / 2, d_y - 14, 1, "Demo Projects", "c", true;
            plain_text d_x + d_width / 2, d_y - d_height + 7, 1, "Click on a demo project name to load it", "c", true;

            # text
            local i = 1;
            local pos = 1;
            repeat length demo_projects / 2 {
                local y = d_y - 20 - i * 20 + 6 - dscroll;
                if y < d_y - 8 and y > d_y - d_height + 3 {
                    set_pen_color ui_c(MainText);
                    plain_text round(d_x + 17), round(y), 1, demo_projects[pos], "l", true, false; 
                }
                i++;
                pos += 2;
            }

            # # scrollbar, in case it's needed
            # if length dropdown_data > 7 {
            #     set_pen_color ui_c(DropdownScrollbar);
            #     set_pen_size 4;
            #     local total_height = length dropdown_data * 20;
            #     local track_height = d_height - 5;
            #     local scrollbar_height = track_height * (d_height / total_height);
            #     goto d_x + d_width - 2, d_y - 2 - track_height * (-dscroll / total_height);
            #     pen_down;
            #     change_y -scrollbar_height;
            #     pen_up;
            # }
        }
    }
}

proc render_background {
    set_pen_size stage_w;
    goto 0, 180;
    set_pen_color ui_c(Background);
    pen_down;
    change_y -360;
    pen_up;
}

proc render_dots {
    if REDRAW {
        render_background;

        set_pen_color ui_c(Dot);
        set_pen_size 1;
        goto -stage_h_h - SCROLL_X % 20, -180 - SCROLL_Y % 20;
        repeat 19 {
            repeat 25 {
                pen_down;
                pen_up;
                change_x 20;
            }
            change_y 20;
            set_x -stage_h_w - SCROLL_X % 20;
        }
    }
}

proc render_palette_text {
    set_pen_color ui_c(MainText);
    local i = 1;
    repeat length block_palette_text / 3 {
        plain_text block_palette_text[i] - PALETTE_SCROLL_X - stage_w_change, block_palette_text[i+1] - PALETTE_SCROLL_Y, 1, block_palette_text[i+2], "l", true;
        i += 3;
    }

    # new variable button
    goto btn(-197) - PALETTE_SCROLL_X, block_palette_text[23] - PALETTE_SCROLL_Y - 17;
    set_pen_color ui_c(ButtonBorder);
    set_pen_size 18;
    pen_down;
    change_x 68;
    pen_up;
    goto btn(-197) - PALETTE_SCROLL_X, block_palette_text[23] - PALETTE_SCROLL_Y - 17;
    if "editor"."new_variable_btn_hovered" {
        set_pen_color ui_c(ButtonColorHovered);
    } else {
        set_pen_color ui_c(ButtonColor);
    }
    set_pen_size 16;
    pen_down;
    change_x 68;
    pen_up;
    set_pen_color ui_c(MainText);
    plain_text btn(-200) - PALETTE_SCROLL_X, block_palette_text[23] - PALETTE_SCROLL_Y - 20, 1, "Make a Variable", "l", true;

    # new list button
    goto btn(-197) - PALETTE_SCROLL_X, block_palette_text[32] - PALETTE_SCROLL_Y - 17;
    set_pen_color ui_c(ButtonBorder);
    set_pen_size 18;
    pen_down;
    change_x 47;
    pen_up;
    goto btn(-197) - PALETTE_SCROLL_X, block_palette_text[32] - PALETTE_SCROLL_Y - 17;
    if "editor"."new_list_btn_hovered" {
        set_pen_color ui_c(ButtonColorHovered);
    } else {
        set_pen_color ui_c(ButtonColor);
    }
    set_pen_size 16;
    pen_down;
    change_x 47;
    pen_up;
    set_pen_color ui_c(MainText);
    plain_text btn(-200) - PALETTE_SCROLL_X, block_palette_text[32] - PALETTE_SCROLL_Y - 20, 1, "Make a List", "l", true;

    # remove unused broadcasts button
    goto btn(-197) - PALETTE_SCROLL_X, block_palette_text[14] - PALETTE_SCROLL_Y + 132;
    set_pen_color ui_c(ButtonBorder);
    set_pen_size 18;
    pen_down;
    change_x 125;
    pen_up;
    goto btn(-197) - PALETTE_SCROLL_X, block_palette_text[14] - PALETTE_SCROLL_Y + 132;
    if "editor"."clean_messages_btn_hovered" {
        set_pen_color ui_c(ButtonColorHovered);
    } else {
        set_pen_color ui_c(ButtonColor);
    }
    set_pen_size 16;
    pen_down;
    change_x 125;
    pen_up;
    set_pen_color ui_c(MainText);
    plain_text btn(-200) - PALETTE_SCROLL_X, block_palette_text[14] - PALETTE_SCROLL_Y + 129, 1, "Removed Unused Messages", "l", true;

    # new block button
    goto btn(-197) - PALETTE_SCROLL_X, block_palette_text[41] - PALETTE_SCROLL_Y - 17;
    set_pen_color ui_c(ButtonBorder);
    set_pen_size 18;
    pen_down;
    change_x 54;
    pen_up;
    goto btn(-197) - PALETTE_SCROLL_X, block_palette_text[41] - PALETTE_SCROLL_Y - 17;
    if "editor"."make_block_btn_hovered" {
        set_pen_color ui_c(ButtonColorHovered);
    } else {
        set_pen_color ui_c(ButtonColor);
    }
    set_pen_size 16;
    pen_down;
    change_x 54;
    pen_up;
    set_pen_color ui_c(MainText);
    plain_text btn(-200) - PALETTE_SCROLL_X, block_palette_text[41] - PALETTE_SCROLL_Y - 20, 1, "Make a Block", "l", true;
}

proc render_palette_sidebar {
    set_pen_size 0;
    goto -223 - stage_w_change, 180;
    if LAG_MODE {
        set_pen_color ui_c(Main);
    } else {
        set_pen_color ui_c(MainTransparent);
        set_pen_transparency 30;
    }
    pen_down;
    set_pen_size 34;
    change_y -360;
    pen_up;

    goto -223 - stage_w_change, 147;
    i = 1;
    repeat 11 {
        draw_category i;
        i += 4;
        change_y -30;
    }
}

proc draw_category i {
    set_pen_size 22;
    set_pen_color colors[$i+1];
    pen_down;
    pen_up;
    
    set_pen_size 20;
    set_pen_color colors[$i];
    pen_down;
    pen_up;
}

proc measure_costumes {
    delete costume_widths;
    delete costume_heights;
    delete costume_names;
    switch_costume "Cat-a";
    base_costume = costume_number() - 1;
    until costume_name() == "@r" {
        add costume_name() to costume_names;
        goto -stage_h_w, 0;
        until not touching_edge() or x_position() == 0 {
            change_x 1;
        }
        if x_position() == 0 {
            add stage_w to costume_widths;
            add 0 to costume_heights;
        } else {
            add (x_position() + stage_h_w) * 2 to costume_widths;

            goto 0, -180;
            until not touching_edge() {
                change_y 1;
            }
            add (y_position() + stage_h_h) * 2 to costume_heights;
        }
        next_costume;
    }
}

proc render_costumes {
    # costumes
    
    render_background;

    set_pen_color ui_c(Main); # background
    set_pen_size 270;
    goto -stage_h_w, -3;
    pen_down;
    change_x stage_w;
    pen_up;

    set_pen_color ui_c(MainText);
    # plain_text 0, 155, 1, "Costumes", "c", true;

    local x = -233;
    local i = 1;
    local y = 157;
    local width = 65;
    repeat length costume_names {
        if sprites["editor"."selected_sprite"].costume == i {
            draw_sprite_box x, y, width;

            set_pen_color ui_c(AltText);
            plain_text x + 33, y - 58, 1, costume_names[i], "c", true;
        } else {
            set_pen_color if ("editor"."highlighted_costume" == i) ui_c(CostumeDark) else ui_c(SpriteBackground);
            draw_square x + 3, y - 3, 59, 59, 14;
            set_pen_color if ("editor"."highlighted_costume" == i) ui_c(Background) else ui_c(Main);
            draw_square x + 4, y - 4, 57, 57, 13;

            set_pen_size 45;
            goto x + width / 2, y - width / 2;
            pen_down;
            pen_up;

            set_pen_color ui_c(MainText);
            plain_text x + 33, y - 58, 1, costume_names[i], "c", true;
        }

        # render preview of sprite
        goto x + width / 2, y - 25;
        switch_costume "large";
        set_size 35 / MAX(costume_widths[i], costume_heights[i]) * 100;
        switch_costume base_costume + i; # i var is costume number
        stamp;
        switch_costume "large";

        x += 67;
        if x > 233 {
            y -= 67;
            x = -233;
        }
        i++;
    }
}

proc render_sounds {
    # sounds

    render_background;

    set_pen_color ui_c(MainText);
    plain_text 0, 147, 1, "Sounds", "c", true;
    local i = 1;
    local x = -50;
    local y = 125;
    repeat length sound_names {
        plain_text x, y, 1, i & ". " & sound_names[i], "l", true;
        y -= 15;
        i++;
    }
}

proc render_sprite_sidebar {
    if SPRITES_SHOWN {
        point_in_direction 90;
        # background
        set_pen_size 0;
        goto 203 + SPRITES_SCROLL_X, 180;
        if LAG_MODE {
            set_pen_color ui_c(Main);
        } else {
            set_pen_color ui_c(MainTransparent);
            set_pen_transparency 30;
        }
        pen_down;
        set_pen_size 75;
        change_y -360;
        pen_up;

        # text
        set_pen_color ui_c(MainText);
        plain_text 203 + SPRITES_SCROLL_X, 165 - SPRITES_SCROLL_Y, 1, "Sprites", "c", true;

        # sprites
        local x = 170 + SPRITES_SCROLL_X;
        local i = 1;
        local y = 155 - SPRITES_SCROLL_Y;
        local width = 65;
        repeat length sprites {
            if "editor"."selected_sprite" == i {
                draw_sprite_box x, y, width;

                if length sprites > 1 {
                    goto x + 57, y - 6;
                    set_pen_color ui_c(CostumeLight);
                    set_pen_size 23;
                    pen_down;
                    pen_up;
                    set_pen_color ui_c(CostumeDark);
                    set_pen_size 20;
                    pen_down;
                    pen_up;
                    switch_costume "delete-icon";
                    set_size 75;
                    stamp;
                    set_size 100;
                    switch_costume "large";
                }

                set_pen_color ui_c(AltText);
                plain_text 203 + SPRITES_SCROLL_X, y - 58, 1, sprites[i].name, "c", true;
                if "editor"."sprite_name_underline" == i {
                    local text_width = width_of_text(sprites[i].name, 1);
                    goto 202 + SPRITES_SCROLL_X - text_width / 2, y - 60;
                    set_pen_size 0;
                    pen_down;
                    set_pen_size 1;
                    change_x text_width;
                    pen_up;
                }
            } else {
                set_pen_color if ("editor"."highlighted_sprite" == i) ui_c(CostumeDark) else ui_c(SpriteBackground);
                draw_square x + 3, y - 3, 59, 59, 14;
                set_pen_color if ("editor"."highlighted_sprite" == i) ui_c(Background) else ui_c(Main);
                draw_square x + 4, y - 4, 57, 57, 13;

                set_pen_size 45;
                goto x + width / 2, y - width / 2;
                pen_down;
                pen_up;

                set_pen_color ui_c(MainText);
                plain_text 203 + SPRITES_SCROLL_X, y - 58, 1, sprites[i].name, "c", true;
            }

            # render preview of sprite
            goto x + width / 2, y - 25;
            switch_costume "large";
            set_size 35 / MAX(costume_widths[sprites[i].costume], costume_heights[sprites[i].costume]) * 100;
            switch_costume base_costume + sprites[i].costume;
            stamp;
            switch_costume "large";

            y -= 67;
            i++;
        }

        # new sprite button
        goto 176 + SPRITES_SCROLL_X, -174;
        set_pen_color ui_c(NewSpriteButton);
        set_pen_size 20;
        pen_down;
        change_x 100;
        pen_up;
        set_pen_color ui_c(MainText);
        plain_text 203 + SPRITES_SCROLL_X, -176, 1, "Make a Sprite", "c", true;
        
    }
    set_size 100;
    switch_costume "large";
}

proc draw_sprite_box x, y, size {
    set_pen_color ui_c(CostumeLight);
    draw_square $x, $y, 65, 65, 20;
    set_pen_color ui_c(CostumeDark);
    draw_square $x + 3, $y - 3, 59, 59, 14;
    set_pen_color ui_c(Background);
    draw_square $x + 4, $y - 4, 57, 57, 13;

    set_pen_size 45;
    goto $x + $size / 2, $y - $size / 2;
    pen_down;
    pen_up;

    set_pen_color ui_c(CostumeDark);
    set_pen_size 14;
    goto $x + 4 + 13 / 2, $y - 4 - 57 + 13 / 2;
    pen_down;
    change_x 57 - 13;
    pen_up;

    set_pen_color ui_c(CostumeDark);
    set_pen_size 4;
    goto $x + 5, $y - 4 - 57 + 12;
    pen_down;
    change_x 55;
    change_y -3;
    change_x -55;
    pen_up;
}

proc render_menubar { # bar at top of screen
    # background line
    set_pen_color ui_c(Main);
    set_pen_size 17;
    goto -stage_h_w, 173;
    pen_down;
    change_x stage_w;
    pen_up;

    # hovered button
    set_pen_color ui_c(NavButtonHovered);
    if "editor"."hovered_menu_button" > "" {
        fill_rect menu_buttons["editor"."hovered_menu_button"] - 7, menu_buttons["editor"."hovered_menu_button"] + menu_buttons["editor"."hovered_menu_button" + 2] + 7, 165, 181;
    }
    set_pen_color ui_c(NavButtonSelected);
    fill_rect menu_buttons[selected_workspace] - 7, menu_buttons[selected_workspace] + menu_buttons[selected_workspace + 2] + 7, 165, 181;

    # text
    set_pen_color ui_c(MainText);
    local i = 1;
    repeat length menu_buttons / 3 {
        plain_text menu_buttons[i], 168, 1, menu_buttons[i + 1], "l", true;
        i += 3;
    }

    if not SPRITES_SHOWN {
        plain_text stage_h_w - 38, 168, 1, "Sprites -->", "c", true; # offset 38 pixels from the right edge
    }
}

proc draw_square x, y, width, height, size {
    set_pen_size 0;
    goto $x + $size / 2, $y - $size / 2;
    pen_down;
    set_pen_size $size;
    change_x $width - $size;
    change_y -$height + $size;
    change_x -$width + $size;
    change_y $height - $size;
    pen_up;
}

proc render_one_root rootIdx {
    delete queue;
    delete visited;

    add $rootIdx to queue;
    add $rootIdx to visited;
    until length queue == 0 {
        local currentIdx = queue[1];
        delete queue[1];
        if currentIdx != h_c_placement.preview_idx {
            render_one_block currentIdx;
        }

        if b_nesting_level(currentIdx) > max_nesting_level {
            max_nesting_level = b_nesting_level(currentIdx);
        }

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
}

proc render_one_block blockIdx {
    local i = $blockIdx;
    if block_in_palette(i) {
        if not PALETTE_SHOWN {
            stop_this_script;
        }
        local scroll_x_offset = PALETTE_SCROLL_X + stage_w_change;
        local scroll_y_offset = PALETTE_SCROLL_Y;
    } else {
        local scroll_x_offset = SCROLL_X + stage_w_change;
        local scroll_y_offset = SCROLL_Y;
    }

    # don't render offscreen blocks
    if not ( b_x(i) - scroll_x_offset + b_width(i) > -stage_h_w and
    b_x(i) - scroll_x_offset < stage_h_w and
    b_y(i) - scroll_y_offset > -stage_h_h and
    b_y(i) - scroll_y_offset - b_height(i) < stage_h_h + 3) { # keep block connectors visible
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
                b_input1_type(i),
                b_input1_x(i) - scroll_x_offset,
                b_y(i) - (b_prong_1_height(i) / 2) + b_input1_height(i) / 2 - scroll_y_offset,
                b_input1_width(i),
                b_input1_height(i),
                b_input1_text(i),
                b_input1_shape(i),
                colors[b_category(i) + 1],
                is_highlighted: h_i.block == $blockIdx and h_i.input == 1,
                dropdown_shape: b_input1_dropdown_shape(i),
                dropdown_color: colors[b_category(i) + 2],
                dropdown_highlight_color: colors[b_category(i) + 3];
        }
    } else {
        draw_block
            colors[b_category(i) + (3 * (b_opcode(i) == "procedures_prototype"))], # use a different main block color for rendering the prototype
            b_width(i),
            b_height(i),
            b_x(i) - scroll_x_offset,
            b_y(i) - scroll_y_offset,
            b_shape(i),
            b_end_style(i),
            b_start_style(i),
            colors[b_category(i) + 1],
            is_highlighted: h_i.block == b_parent(i) and "editor"."highlighted_input_nested_block" == $blockIdx;

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
                    blocks[offset + b_input_type],
                    blocks[offset + b_input_x] - scroll_x_offset,
                    ((b_y(i) + (b_y(i) - b_height(i))) / 2) + blocks[offset + b_input_height] / 2 - scroll_y_offset,
                    blocks[offset + b_input_width],
                    blocks[offset + b_input_height],
                    blocks[offset + b_input_text],
                    blocks[offset + b_input_shape],
                    colors[b_category(i) + 1],
                    is_highlighted: h_i.block == $blockIdx and h_i.input == inputNum,
                    dropdown_shape: blocks[offset + b_input_dropdown_shape],
                    dropdown_color: colors[b_category(i) + 2],
                    dropdown_highlight_color: colors[b_category(i) + 3];
            }
            counter += INPUT_LENGTH; # = number of properties in Input
            inputNum++;
        }
    }
}

proc plain_text x, y, size, text, align, case_sensitive, convert=true {
    set_pen_size $size;
    local x_offset = $x;
    local y_offset = $y;
    if $align == "c" {
        local text_width = width_of_text($text, $size);
        x_offset += round(text_width / -2);
    }
    point_in_direction 90;
    local txt_i = 1;
    goto $x - 2, $y - 2;
    repeat length($text) {
        if $case_sensitive {
            switch_costume $text[txt_i];
            local font_char_index = pte_font_1[costume_number() + 6];
            switch_costume "large";
        } else {
            local font_char_index = pte_font_1[($text[txt_i] in char_lookup) + 7]; # use cached lookup, faster
        }

        if ($text[txt_i] == "@") and $convert {
            switch_costume "@" & $text[txt_i + 1];
            change_x 12;
            change_y 3;
            set_size 60;
            stamp;
            set_size 100;
        } elif $text[txt_i - 1] == "@" and $convert {
            x_offset += 3;
        } else {
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
        }
        x_offset += $size * (2 + pte_font_1[2 + font_char_index]);
        txt_i += 1;
    }
    switch_costume "large";
}

proc draw_block color, width, height, x, y, shape, end_style, start_style, border_color, is_highlighted {
    if $shape == "stack" {
        set_pen_color $color;
        set_pen_size 4;
        goto $x + 2, $y - 2 + (3 * ($start_style == "hat")) - (5 * ($start_style == "proc"));
        pen_down;
        goto $x + 2, $y - $height + 3;
        pen_up;
        set_pen_size 4;
        goto $x + $width - 2, $y - 2;
        pen_down;
        goto $x + $width - 2, $y - $height + 2;
        pen_up;
        if $start_style == "normal" or $start_style == "" {
            fill_rect $x + 2, $x + 7, $y - $height, $y, 1;
            fill_rect $x + 19, $x + $width - 2, $y - $height + 1, $y, 1;

            fill_rect $x + 7, $x + 19, $y - $height, $y - 3, 1;
            tri_fill $x + 7, $y, $x + 10, $y - 3, $x + 7, $y - 3, 0.5;
            tri_fill $x + 19, $y, $x + 19, $y - 3, $x + 16, $y - 3, 0.5;
            set_pen_size 3;
            goto $x + 5, $y - 2;
            pen_down;
            pen_up;
        } elif $start_style == "hat" {
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
        } elif $start_style == "proc" {
            goto $x + 8, $y - 4;
            set_pen_size 0;
            pen_down;
            set_pen_size 16;
            set_pen_color $border_color;
            set_x $x + $width - 7;
            pen_up;

            goto $x + 8, $y - 4;
            set_pen_size 0;
            pen_down;
            set_pen_size 14;
            set_pen_color $color;
            set_x $x + $width - 7;
            pen_up;

            goto $x + 2, $y - 2;
            set_pen_size 2;
            pen_down;
            change_y -8;
            pen_up;

            goto $x + $width - 1, $y - 2;
            set_pen_size 2;
            pen_down;
            change_y -8;
            pen_up;

            fill_rect $x + 2, $x + $width - 2, $y - $height, $y - 3, 1;
        }
        if $end_style != "cap" {
            tri_fill $x + 8, $y - $height, $x + 11, $y - $height - 2, $x + 19, $y - $height, 0.5;
            tri_fill $x + 19, $y - $height, $x + 16, $y - $height - 2, $x + 10, $y - $height - 2, 0.5; # change numbers to make tri more accurate
        }
        set_pen_size 1;
        set_pen_color $border_color;
        if $start_style == "proc" {
            goto $x + $width, $y - 5;
            pen_down;
        } else {
            if $start_style == "hat" {
                goto $x, $y;
                pen_down;
                change_y 3;
                point_in_direction 58;
                repeat 9 {
                    move 7;
                    turn_right 8.5;
                }
                goto x_position() + 1, $y;
            } else {
                goto $x + 3, $y;
                pen_down;
                goto $x + 7, $y;
                goto $x + 10, $y - 3;
                goto $x + 16, $y - 3;
                goto $x + 19, $y;
            }

            # turn corner
            goto $x + $width - 2, $y;
            point_in_direction 90;
            local move_amount = 2 / 1.366;
            repeat 2 {
                turn_right 30;
                move move_amount;
            }
        }

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
        if $start_style == "normal" or $start_style == "" {
            goto $x, $y - 2;
            point_in_direction 0;
            repeat 2 {
                turn_right 30;
                move move_amount;
            }
            goto $x + 3, $y;
        } else {
            goto $x, $y - (5 * ($start_style == "proc"));
        }
        pen_up;
    }
    elif $shape == "reporter" {
        if $is_highlighted {
            set_pen_color ui_c(InputHighlight);
            pen_size = $height + 6;
            set_pen_size 0; # this has to be done to avoid a second pen stroke adding a few extra pixels
            goto $x + pen_size / 2 - 3, $y - pen_size / 2 + 3;
            pen_down;
            set_pen_size pen_size;
            set_x $x + pen_size / 2 - 3 + $width - pen_size + 6;
            pen_up;
        }

        pen_size = $height + 2;
        set_pen_color $border_color;
        set_pen_size 0;
        goto $x + pen_size / 2 - 1, $y - pen_size / 2 + 1;
        pen_down;
        set_pen_size pen_size;
        set_x $x + pen_size / 2 - 1 + $width - pen_size + 2;
        pen_up;

        pen_size = $height;
        set_pen_color $color;
        set_pen_size 0;
        goto $x + pen_size / 2, $y - pen_size / 2;
        pen_down;
        set_pen_size pen_size;
        set_x $x + pen_size / 2 + $width - pen_size;
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
            set_pen_color ui_c(InputHighlight);
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
    tri_fill $x + 4, $y, $x + 10, $y - 3, $x + 7, $y - 3, 0.5; # x + 4 instead of 7 is because of rendering imperfections
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
    set_pen_color ui_c(BlockText);
    print $x, ($y) - 7, 1, $text, case_sensitive: true;
}

proc render_input block_shape, type, x, y, width, height, text, shape, color, is_highlighted, dropdown_shape, dropdown_color, dropdown_highlight_color {
    if $shape == "reporter" {
        if $is_highlighted {
            # if dropdown shape is nothing or round, then we want to highlight if NOT editing an input (highlight_lightly)
            # since when editing an input, for dropdowns it's rendered differently
            # we also highlight it if dropdown shape is nothing and it's highlighted lightly,
            # since that's just editing a regular text input
            if ($dropdown_shape != "square" and not "editor"."highlight_lightly") or ($dropdown_shape == "" and "editor"."highlight_lightly") {
                set_pen_color ui_c(InputHighlight);
                if "editor"."highlight_lightly" {
                    set_pen_transparency 50;
                }
                pen_size = $height + 6;
                set_pen_size 0;
                goto $x + pen_size / 2 - 3, $y - pen_size / 2 + 3;
                pen_down;
                set_pen_size pen_size;
                set_x ($x + pen_size / 2 - 3) + ($width - pen_size + 6);
                pen_up;

                set_pen_transparency 0;
            } elif $dropdown_shape == "square" {
                set_pen_color $dropdown_highlight_color;
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
            set_x ($x + pen_size / 2 - 1) + ($width - pen_size + 2);
            pen_up;

            if $dropdown_shape > "" {
                if $is_highlighted {
                    set_pen_color $dropdown_highlight_color;
                } else {
                    set_pen_color $dropdown_color;
                }
            } else {
                if $type == b_input_type_color {
                    set_pen_color $text;
                } else {
                    set_pen_color ui_c(InputBackground);
                }
            }
            # if (not $is_highlighted and $dropdown_shape == "round") or $dropdown_shape == "" {
                pen_size = $height;
                set_pen_size 0;
                goto $x + pen_size / 2, $y - pen_size / 2;
                pen_down;
                set_pen_size pen_size;
                set_x ($x + pen_size / 2) + ($width - pen_size);
                pen_up;
            # }
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
            set_pen_color ui_c(BlockText);

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
            set_pen_color ui_c(InputText);
        }
        if $type != b_input_type_color { # don't display text for color inputs
            local text_x = $x + ($width) / 2;
            if $dropdown_shape > "" {
                text_x -= 4;
            }
            local text_y = ($y + ($y - $height)) / 2 - 4 + 1 * ($dropdown_shape == "square");
            print text_x, text_y, 1, $text, "c", true;
        }
    }
    elif $shape == "boolean" {
        set_pen_color $color;
        local seg_amount = $height / 2;
        tri_fill $x + seg_amount, $y - $height, $x, $y - seg_amount, $x + seg_amount, $y, 0.5;
        fill_rect_hq $x + seg_amount, $x + $width - seg_amount, $y - $height, $y, 2;
        tri_fill $x + $width - seg_amount, $y - $height, $x + $width, $y - seg_amount, $x + $width - seg_amount, $y, 0.5;
        if $is_highlighted {
            set_pen_color ui_c(InputHighlight);
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
    # stop_this_script;
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
    # stop_this_script;
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

proc fill_rect x1, x2, y1, y2, blah=0 {
    # stop_this_script;
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


proc print x, y, size, text, align="", case_sensitive=false, convert=true {
    plain_text round($x), round($y), $size, $text, $align, $case_sensitive, $convert;
}

proc render_other_ui {
    if not SPRITES_SHOWN {
        # render reset zoom button

        # outer border
        set_pen_color ui_c(CodeButtonBorder);
        set_pen_size 20;
        goto 220 + stage_w_change, -160;
        pen_down;
        pen_up;

        # fill
        set_pen_color ui_c(CodeButtonFill);
        set_pen_size 17;
        pen_down;
        pen_up;

        # lines of equals sign
        set_pen_color ui_c(CodeButtonText);
        set_pen_size 0;
        goto 217 + stage_w_change, -159;
        pen_down;
        set_pen_size 1;
        change_x 5;
        pen_up;

        set_pen_size 0;
        goto 217 + stage_w_change, -163;
        pen_down;
        set_pen_size 1;
        change_x 5;
        pen_up;
    }
}

proc measure_resolution {
    old_stage_width = stage_w;
    old_stage_height = stage_h;

    switch_costume "small-dot";
    set_size 100;
    show;
    stage_width = 0;
    goto -9999, 0;
    until not touching_edge() {
        change_x 1;
        stage_width++;
    }
    until touching_edge() {
        change_x 1;
        stage_width++;
    }

    stage_height = 0;
    goto 0, -9999;
    until not touching_edge() {
        change_y 1;
        stage_height++;
    }
    until touching_edge() {
        change_y 1;
        stage_height++;
    }

    half_stage_width = stage_width / 2;
    half_stage_height = stage_height / 2;
    hide;

    stage_w_change = stage_h_w - 240;
    stage_w_multiplier = stage_width / 480;

    PALETTE_MIN_X = -205 - stage_w_change;
    # PALETTE_MAX_X = 0 - stage_w_change;
    PALETTE_HIDE_X = -100 - stage_w_change;
    SPRITES_MAX_X = 240 + stage_w_change;
    SPRITES_MIN_X = 165 + stage_w_change;

    resolution_changed = not (stage_w == old_stage_width and stage_h == old_stage_height);
}