# custom block definition format: coolblock (x) y: (y) <z>

list parsed_tokens;

proc parse_from_definition def {
    delete parsed_tokens;

    local i = 1;
    local token = "";
    local paren_nesting = 0;
    until i > length $def {
        if $def[i] == "(" or $def[i] == "<" {
            if paren_nesting == 0 {
                s = strip(token);
                if s > "" {
                    add "label" to parsed_tokens;
                    add "" to parsed_tokens;
                    add s to parsed_tokens;
                }
                token = "";
                input_type = if ($def[i] == "(") "reporter" else "boolean";
            }
            paren_nesting += 1;
        } elif $def[i] == ")" or $def[i] == ">" {
            paren_nesting -= 1;
            if paren_nesting == 0 {
                s = strip(token);
                if s > "" {
                    add "input" to parsed_tokens;
                    add input_type to parsed_tokens;
                    add s to parsed_tokens;
                }
                token = "";
            }
        } else {
            token &= $def[i];
        }
        i++;
    }
    # add trailing text label
    s = strip(token);
    if s > "" {
        add "label" to parsed_tokens;
        add "" to parsed_tokens;
        add s to parsed_tokens;
    }

    show parsed_tokens;
}

onkey "t" {
    ask "custom block definition?";
    new_custom_block_from_def answer();
    update_custom_blocks;
}

proc new_custom_block_from_def def {
    add $def to custom_blocks;
    add false to custom_blocks;
    parse_from_definition $def;
    EXTEND(parsed_tokens, custom_blocks);
    until length(custom_blocks) % 20 == 0 {
        add "" to custom_blocks;
    }
}

proc update_custom_blocks {
    local start_idx = ("datalist_listcontainsitem" in blocks) + BLOCK_LENGTH;

    # remove all custom blocks in palette
    until blocks[start_idx] == "pen_clear" {
        delete blocks[start_idx];
    }
    local y = b_y(("datalist_listcontainsitem" in blocks)) - 50;
    local compare_y = b_y(("pen_clear" in blocks)) + 45;
    local start_y = y;

    local blockI = 1;
    local pos = start_idx;
    repeat length custom_blocks / 20 {
        # parse_from_definition custom_blocks[blockI];
        local i = blockI + 2; # block data offset
        delete parsed_tokens;
        until custom_blocks[i] == "" {
            add custom_blocks[i] to parsed_tokens;
            add custom_blocks[i + 1] to parsed_tokens;
            add custom_blocks[i + 2] to parsed_tokens;
            i += 3;
        }
        delete parsed_inputs;
        delete parsed_labels;

        local i = 1;
        repeat length parsed_tokens / 3 {
            local t = parsed_tokens[i];
            if t == "input" {
                # input
                add parsed_tokens[i + 1] to parsed_inputs; # block shape
                add if (parsed_tokens[i + 1] == "reporter") b_input_type_text else "" to parsed_inputs;
                add "" to parsed_inputs;
                add "" to parsed_inputs;
                add i * 20 to parsed_inputs;
                add "" to parsed_inputs;
                add 12 to parsed_inputs;
                add "" to parsed_inputs;
                add "" to parsed_inputs;
            } else {
                # text label
                add parsed_tokens[i + 2] to parsed_labels;
                add i * 20 to parsed_labels;
            }
            i += 3;
        }

        until length parsed_labels == TEXT_LABEL_LENGTH * 3 {
            add "" to parsed_labels;
        }
        until length parsed_inputs == INPUT_LENGTH * 3 {
            add "" to parsed_inputs;
        }

        add_block
            opcode: "procedures_call",
            shape: "stack",
            category: Category.CustomBlocks,
            x: -205,
            y: y,
            width: 100,
            height: 21,
            insert_position: pos,
            use_parsed: true;
        update_block_dimensions pos;

        pos += BLOCK_LENGTH;
        y -= 28;
        blockI += 20;
    }

    idx_change = ("pen_clear" in blocks) - start_idx;
    PALETTE_END += idx_change;
    local y_change = y - compare_y;

    palette_y_max += y_change;
    category_y[11] += y_change;
    # shift palette text labels down
    local i = 44; # start at the y position of the next text label
    until i > length block_palette_text {
        block_palette_text[i] += y_change;
        i += 3;
    }
    # shift palette blocks down
    move_blocks_in_palette_down ("pen_clear" in blocks), y_change;
    # shift block indexes down
    shift_block_indexes_down PALETTE_END, PALETTE_END - idx_change - 1, idx_change;
}

# Remove leading and trailing whitespace (from std library)
list strbuf;
func strip(text) {
    local i = 1;
    until $text[i] != " " or i > length($text) {
        i++;
    }
    delete strbuf;
    until i > length($text) {
        add $text[i] to strbuf;
        i++;
    }
    until strbuf["last"] != " " {
        delete strbuf["last"];
    }
    return strbuf;
}