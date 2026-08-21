list block_palette "assets/data/block-palette.txt";
list block_palette_text;
list toks_1;
list toks_2;
list toks_3;

list category_map = [
    "motion", Category.Motion,
    "looks", Category.Looks,
    "sound", Category.Sound,
    "events", Category.Events,
    "control", Category.Control,
    "sensing", Category.Sensing,
    "operators", Category.Operators,
    "data", Category.Variables
];

proc parse_block_palette {
    local i = 1; # skip the first informational line of the list
    by = 170;
    bx = -205;
    block_stack_height = 21;
    block_reporter_height = 16;

    repeat length block_palette / 2 {
        local l = block_palette[i];
        delete toks_1;
        j = 1;
        until j > length l {
            parse_token ",", l;
            add token to toks_1;
        }
        i++;

        local l = block_palette[i];
        delete toks_2;
        j = 1;
        until j > length l {
            parse_token ",", l;
            add token to toks_2;
        }
        i++;

        # local l = block_palette[i];
        # delete toks_3;
        # j = 1;
        # until j > length l {
        #     parse_token ",", l;
        #     add token to toks_3;
        # }
        # i++;

        parse_palette_block;
    }

    PALETTE_END = length blocks + 1;
}

list parsed_inputs;
list parsed_labels;

proc parse_palette_block {
    delete parsed_inputs;
    delete parsed_labels;

    if length toks_1 == 0 {
        by -= 10;
        stop_this_script;
    }

    if toks_1[1] == "text" {
        add bx to block_palette_text;
        add by to block_palette_text;
        add toks_1[1] to block_palette_text;
        stop_this_script;
    } else {
        j = 1;
        parse_token "_", toks_1[1];
        local category = category_map[(token in category_map) + 1];
        local opcode = toks_1[1];
        local shape = toks_1[2];
        local slot_count = toks_1[3];
        if opcode == "control_forever" {
            local end_style = "cap";
        } else {
            local end_style = "normal";
        }

        local i = 1;
        repeat length toks_2 {
            local t = toks_2[i];
            if t[1] == "(" {
                # reporter input
                j = 2;
                parse_token ",", t; # input default
                add "reporter" to parsed_inputs;
                add "" to parsed_inputs;
                add "" to parsed_inputs;
                add i * 20 to parsed_inputs;
                add "" to parsed_inputs;
                add 12 to parsed_inputs;
                add token to parsed_inputs;
                add "" to parsed_inputs;
            } elif t[1] == "<" {
                # boolean input
                j = 2;
                parse_token ",", t; # input default
                add "boolean" to parsed_inputs;
                add "" to parsed_inputs;
                add "" to parsed_inputs;
                add i * 20 to parsed_inputs;
                add "" to parsed_inputs;
                add 12 to parsed_inputs;
                add token to parsed_inputs;
                add "" to parsed_inputs;
            } elif t[1] == "{" {
                # round dropdown
                j = 2;
                parse_token "|", t; # dropdown list
                local dropdown_list = token;
                parse_token ",", t;
                log "list " & dropdown_list;
                add "reporter" to parsed_inputs;
                add "round" to parsed_inputs;
                add dropdown_list to parsed_inputs;
                add i * 20 to parsed_inputs;
                add "" to parsed_inputs;
                add 12 to parsed_inputs;
                add token to parsed_inputs;
                add "" to parsed_inputs;
            } elif t[1] == "[" {
                # square dropdown
                j = 2;
                parse_token "|", t; # dropdown list
                local dropdown_list = token;
                parse_token ",", t;
                log "list " & dropdown_list;
                add "reporter" to parsed_inputs;
                add "square" to parsed_inputs;
                add dropdown_list to parsed_inputs;
                add i * 20 to parsed_inputs;
                add "" to parsed_inputs;
                add 12 to parsed_inputs;
                add token to parsed_inputs;
                add "" to parsed_inputs;
            } else {
                # text label
                add t to parsed_labels;
                add i * 20 to parsed_labels;
                if opcode == "control_if_else" and t == "else" {
                    parsed_labels[length parsed_labels] = bx + start_padding;
                }
            }
            i++;
        }

        until length parsed_labels == TEXT_LABEL_LENGTH * 3 {
            add "" to parsed_labels;
        }
        until length parsed_inputs == INPUT_LENGTH * 3 {
            add "" to parsed_inputs;
        }

        add opcode to blocks;
        add shape to blocks;
        add category to blocks;
        add bx to blocks;
        add by to blocks;
        add 100 to blocks;
        add 20 to blocks;
        add "" to blocks;
        add "" to blocks;
        add "" to blocks;
        add 0 to blocks;
        add slot_count to blocks;
        add c_block_prong_height to blocks;
        add "normal" to blocks;
        add "normal" to blocks;
        add end_style to blocks;
        add c_block_min_slot_height to blocks;
        add c_block_min_slot_height to blocks;
        add "" to blocks;
        add "" to blocks;
        local i = 1;
        repeat length parsed_labels {
            add parsed_labels[i] to blocks;
            i++;
        }
        local i = 1;
        repeat length parsed_inputs {
            add parsed_inputs[i] to blocks;
            i++;
        }

        # add length blocks / BLOCK_LENGTH to roots;

        if shape == "stack" {
            by -= 28;
        } elif shape == "reporter" or shape == "boolean" {
            by -= 21;
        }
    }
}

proc parse_token delimiter, string {
    token = "";
    until ($string[j] == $delimiter and $string[j - 1] != "\\") or j > length $string {
        if $string[j] != "\\" { # don't include escape character
            token &= $string[j];
        }
        j++;
    }
    j++;
}