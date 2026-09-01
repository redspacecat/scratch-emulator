%define if_tok(offset) if (tokens[offset] > "") tokens[offset] + PALETTE_END else ""

proc switch_selected_sprite sprite {
    save_current_sprite;
    load_sprite $sprite;
    selected_sprite = $sprite;
    redraw;
}

proc save_current_sprite {
    start = days_since_2000();
    # code

    # consolidation
    local i = 1;
    until i > length blocks {
        if blocks[i] == "" { # consolidate empty block slots
            repeat BLOCK_LENGTH {
                delete blocks[i];
            }
            shift_block_indexes_down 1, i - 1, -BLOCK_LENGTH; # move all next blocks indexes
            log "empty space, shifted starting from " & i & " against " & i - 1;
        } else {
            i += BLOCK_LENGTH;
        }
    }

    # saving blocks
    save_code = "";

    # save roots
    local i = 1;
    repeat length roots {
        save_code &= roots[i] - PALETTE_END & ",";
        i++;
    }
    save_code &= ";";

    # save code, not including palette
    local i = PALETTE_END;
    until i > length blocks {
        save_block i;
        i += BLOCK_LENGTH;
    }
    sprites[selected_sprite].blocks = save_code;

    # variables
    save_code = "";
    local i = 1;
    until i > length local_vars {
        save_code &= escape(local_vars[i], ",") & ",";
        i++;
    }
    sprites[selected_sprite].vars = save_code;

    # lists
    save_code = "";
    local i = 1;
    until i > length local_lists {
        save_code &= escape(local_lists[i], ",") & ",";
        i++;
    }
    sprites[selected_sprite].lists = save_code;

    log "saving took " & (days_since_2000() - start) * 86400000 & " ms";
}

proc save_block idx {
    save_code &= b_opcode($idx) & ",";
    save_code &= b_x($idx) & ",";
    save_code &= b_y($idx) & ",";
    # arguments
    if b_opcode($idx) == "data_variable" or b_opcode($idx) == "datalist_listcontents" {
        # for a variable or list, we put in the text label as input text to store it,
        # since the block doesn't have inputs
        save_code &= escape(b_label1_text($idx), ",") & ",";
    } else {
        save_code &= escape(b_input1_text($idx), ",") & ",";
        if b_input1_nested_block($idx) > "" {save_code &= b_input1_nested_block($idx) - PALETTE_END;}
    }
    save_code &= ",";

    save_code &= escape(b_input2_text($idx), ",") & ",";
    if b_input2_nested_block($idx) > "" {save_code &= b_input2_nested_block($idx) - PALETTE_END;}
    save_code &= ",";

    save_code &= escape(b_input3_text($idx), ",") & ",";
    if b_input3_nested_block($idx) > "" {save_code &= b_input3_nested_block($idx) - PALETTE_END;}
    save_code &= ",";

    # c block inputs
    if b_slot_1_nested_block($idx) > "" {save_code &= b_slot_1_nested_block($idx) - PALETTE_END;}
    save_code &= ",";

    if b_slot_2_nested_block($idx) > "" {save_code &= b_slot_2_nested_block($idx) - PALETTE_END;}
    save_code &= ",";

    if b_previous($idx) > "" {save_code &= b_previous($idx) - PALETTE_END;} save_code &= ",";
    if b_parent($idx) > "" {save_code &= b_parent($idx) - PALETTE_END;} save_code &= ",";
    if b_next($idx) > "" {save_code &= b_next($idx) - PALETTE_END;} save_code &= ",";
    save_code &= b_nesting_level($idx) & ",";
}

func escape(text, char) {
    local i = 1;
    local output = "";
    repeat length $text {
        if $text[i] == $char {
            output &= "\\";
        }
        output &= $text[i];
        i++;
    }
    return output;
}

list tokens;
list sort_order;

proc load_sprite sprite, do_size_updates=true {
    start = days_since_2000();

    # delete blocks;
    delete roots;
    delete dragged_blocks;
    delete local_vars;
    delete local_lists;

    # remove old blocks
    until length blocks == PALETTE_END - 1 {
        delete blocks[length blocks];
    }

    # load variables and lists
    # parse_block_palette;
    j = 1;
    until j > length sprites[$sprite].vars {
        parse_token ",", sprites[$sprite].vars;
        add token to local_vars;
    }
    j = 1;
    until j > length sprites[$sprite].lists {
        parse_token ",", sprites[$sprite].lists;
        add token to local_lists;
    }
    handle_palette_vars;
    handle_palette_lists;
    
    # load code
    local bl = sprites[$sprite].blocks;
    j = 1;
    parse_token ";", bl;
    local root_str = token;
    j = 1;
    until j > length root_str {
        parse_token ",", root_str;
        add token + PALETTE_END to roots;
    }
    j++;

    delete tokens;
    until j > length bl {
        parse_token ",", bl;
        add token to tokens;
    }

    local i = 1;
    until i > length tokens {
        # find the palette data for the opcode of the block we're loading
        # look up index in palette_lookup list
        local line_n = palette_lookup[(tokens[i] in palette_lookup) + 1];
        # get palette data
        local l = block_palette[line_n];
        local l2 = block_palette[line_n + 1];

        delete toks_1;
        j = 1;
        until j > length l {
            parse_token ",", l;
            add token to toks_1;
        }

        delete toks_2;
        j = 1;
        until j > length l2 {
            parse_token ",", l2;
            add token to toks_2;
        }

        # offset inputs by block x to make them appear farther to the right than the block
        # this allows the block dimensions update to work properly
        parse_palette_block tokens[i + 1] + 10;
        local idx = last_block_idx;
        b_x(idx) = tokens[i + 1];
        b_y(idx) = tokens[i + 2];

        if tokens[i] == "data_variable" or tokens[i] == "datalist_listcontents" {
            b_label1_text(idx) = tokens[i + 3];
        } else {
            b_input1_text(idx) = tokens[i + 3];
            b_input1_nested_block(idx) = if_tok(i + 4);
        }
        b_input2_text(idx) = tokens[i + 5];
        b_input2_nested_block(idx) = if_tok(i + 6);
        b_input3_text(idx) = tokens[i + 7];
        b_input3_nested_block(idx) = if_tok(i + 8);

        b_slot_1_nested_block(idx) = if_tok(i + 9);
        b_slot_2_nested_block(idx) = if_tok(i + 10);

        b_previous(idx) = if_tok(i + 11);
        b_parent(idx) = if_tok(i + 12);
        b_next(idx) = if_tok(i + 13);
        b_nesting_level(idx) = tokens[i + 14];

        i += 15;
    }

    log "loading took " & (days_since_2000() - start) * 86400000 & " ms";

    if $do_size_updates {
        start = days_since_2000();
        update_all_blocks_sizes;
        log "resizing took " & (days_since_2000() - start) * 86400000 & " ms";

        start = days_since_2000();
        update_all_blocks_c_styles;
        log "updating c end styles took " & (days_since_2000() - start) * 86400000 & " ms";
    }
}