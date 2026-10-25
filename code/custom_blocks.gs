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
}

nowarp proc create_new_custom_block {
    ask "Enter new block definition. Use () for reporter inputs and <> for boolean inputs. Text inside becomes input name, and surrounding text becomes text labels. Max 3 inputs.";
    new_custom_block_from_def answer();
    update_custom_blocks;
    update_palette_max_width;
}

proc new_custom_block_from_def def {
    add $def to custom_blocks;
    add false to custom_blocks;
    parse_from_definition $def;
    EXTEND(parsed_tokens, custom_blocks);
    until length(custom_blocks) % CUSTOM_BLOCK_LENGTH == 0 {
        add "" to custom_blocks;
    }
    create_define_block length custom_blocks / CUSTOM_BLOCK_LENGTH; # latest custom block id
}

proc create_define_block id {
    add_block
        opcode: "procedures_definition",
        shape: "stack",
        category: Category.CustomBlocks,
        x: SCROLL_X - 100,
        y: SCROLL_Y + 100,
        width: 100,
        height: 21,
        cblock: $id,
        start_style: "proc",
        label1: TextLabel {x: 0, text: "define"},
        input1: Input {x: 10, shape: "reporter", text: "", height: 12};
    def_id = last_block_idx;
    update_block_dimensions def_id;

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
            add i * 21 to parsed_inputs;
            add "" to parsed_inputs;
            add 12 to parsed_inputs;
            add parsed_tokens[i + 2] to parsed_inputs; # text
            add "" to parsed_inputs;
        } else {
            # text label
            add parsed_tokens[i + 2] to parsed_labels;
            add i * 21 to parsed_labels;
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
        opcode: "procedures_prototype",
        shape: "stack",
        category: Category.CustomBlocks,
        x: 0,
        y: 0,
        width: 100,
        height: 21,
        cblock: $id, # can't use "custom_block" because of id overlap with scratch
        use_parsed: true;
    proto_idx = last_block_idx;
    update_block_dimensions proto_idx;
    put_block_in_block proto_idx, def_id, 1; # connect prototype block to define block

    # add prototype argument blocks
    local i = 1;
    local inputNum = 1;
    repeat length parsed_inputs / INPUT_LENGTH {
        if parsed_inputs[i] > "" {
            add_block
                opcode: "procedures_arg_" & parsed_inputs[i + b_input_shape], # shape
                shape: parsed_inputs[i + b_input_shape],
                category: Category.CustomBlocks,
                x: 0,
                y: 0,
                width: 100,
                height: 16,
                label1: TextLabel {x: 0, text: parsed_inputs[i + b_input_text]},
                cblock: $id; # can't use "custom_block" because of id overlap with scratch
            update_block_dimensions last_block_idx;
            put_block_in_block last_block_idx, proto_idx, inputNum; # connect prototype block to define block
        }
        i += INPUT_LENGTH;
        inputNum++;
    }
}

proc update_custom_blocks {
    local start_idx = ("datalist_listcontainsitem" in blocks) + BLOCK_LENGTH;
    local start_idx_compare = ("pen_clear" in blocks);

    # remove all custom blocks in palette
    until blocks[start_idx] == "pen_clear" {
        delete blocks[start_idx];
    }
    local y = b_y(("datalist_listcontainsitem" in blocks)) - 75;
    local compare_y = b_y(("pen_clear" in blocks)) + 45;
    local start_y = y;

    local blockI = 1;
    local blockID = 1;
    local pos = start_idx;
    repeat length custom_blocks / CUSTOM_BLOCK_LENGTH {
        # parse_from_definition custom_blocks[blockI];
        local i = blockI + 2; # block data offset
        delete parsed_tokens;
        until custom_blocks[i] == "" or length parsed_tokens >= 18 {
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

        log blockID;

        add_block
            opcode: "procedures_call",
            shape: "stack",
            category: Category.CustomBlocks,
            x: -205,
            y: y,
            width: 100,
            height: 21,
            insert_position: pos,
            cblock: blockID, # can't use "custom_block" because of id overlap with scratch
            use_parsed: true;
        update_block_dimensions pos;

        pos += BLOCK_LENGTH;
        y -= 28;
        blockI += CUSTOM_BLOCK_LENGTH;
        blockID++;
    }

    idx_change = ("pen_clear" in blocks) - start_idx_compare;
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

func palette_format_from_custom_block_def(num) {
    local i = ($num - 1) * CUSTOM_BLOCK_LENGTH + 1 + 2; # block data offset
    local output_str = "";
    start = true;
    until custom_blocks[i] == "" {
        if start == false { # don't add comma to beginning of string
            output_str &= ",";
        }
        if custom_blocks[i] == "input" { # first element is format
            if custom_blocks[i + 1] == "reporter" { # reporter or boolean
                output_str &= "$" & custom_blocks[i + 2];
            } else {
                output_str &= "<"; # no text in boolean inputs
            }
        } else {
            output_str &= custom_blocks[i + 2];
        }
        start = false;
        i += 3;
    }
    return output_str;
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

func can_delete_custom_block(id) {
    local i = PALETTE_END;
    until i > length blocks {
        if b_opcode(i) == "procedures_call" and b_custom_block(i) == $id { # custom block is in use, can't delete it
            return false;
        }
        i += BLOCK_LENGTH;
    }
    return true;
}

proc delete_custom_block custom_block_id {
    # remove custom block data
    repeat CUSTOM_BLOCK_LENGTH {
        delete custom_blocks[($custom_block_id - 1) * CUSTOM_BLOCK_LENGTH + 1]; # index of custom block data
    }

    # shift down custom block id references in blocks
    local i = PALETTE_END;
    until i > length blocks {
        if b_custom_block(i) > $custom_block_id { # custom block needs to be shifted down
            b_custom_block(i)--;
        }
        i += BLOCK_LENGTH;
    }

    # update palette
    update_custom_blocks;
}