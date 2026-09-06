list block_palette "assets/data/block-palette.txt";
list toks_1;
list toks_2;
list category_y;
list palette_lookup;

list category_map = [
    "motion", Category.Motion,
    "looks", Category.Looks,
    "sound", Category.Sound,
    "event", Category.Events,
    "control", Category.Control,
    "sensing", Category.Sensing,
    "operator", Category.Operators,
    "data", Category.Variables,
    "datalist", Category.Lists,
    "pen", Category.Extensions
];

proc parse_block_palette {
    delete category_y;
    delete block_palette_text;

    local i = 1; # skip the first informational line of the list
    by = 165;
    bx = -205;
    block_stack_height = 21;
    block_stack_extension_height = 25;
    block_hat_height = 12;
    block_c_1_height = 48;
    block_c_2_height = 75;
    block_reporter_height = 16;

    current_category = "";

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

        parse_palette_block;
    }

    PALETTE_END = length blocks + 1;
    palette_y_max = by + 165;
}

list parsed_inputs;
list parsed_labels;

proc parse_palette_block x_offset=0 {
    delete parsed_inputs;
    delete parsed_labels;

    if length toks_1 == 0 {
        by -= 10;
        stop_this_script;
    }

    if toks_1[1] == "text" {
        add bx to block_palette_text;
        add by to block_palette_text;
        add toks_1[2] to block_palette_text;

        j = 1;
        parse_token " ", toks_1[2];
        if token != "For" { # don't include "for this sprite only/for all sprites" text
            add by - 165 to category_y;
        }
        by -= 10;
        stop_this_script;
    } else {
        j = 1;
        parse_token "_", toks_1[1];
        category = category_map[(token in category_map) + 1];
        local opcode = toks_1[1];
        local shape = toks_1[2];
        local slot_count = toks_1[3];
        if opcode == "control_forever" or opcode == "control_stop" or opcode == "control_delete_this_clone" {
            local end_style = "cap";
        } else {
            local end_style = "normal";
        }
        if "when" in opcode or opcode == "control_start_as_clone" {
            local start_style = "hat";
            if start_style == "hat" {
                by -= block_hat_height;
            }
        } else {
            local start_style = "normal";
        }

        local i = 1;
        repeat length toks_2 {
            local t = toks_2[i];
            if t[1] == "(" or t[1] == "$" or t[1] == "#" {
                # reporter input
                local type = if (t[1] == "(") b_input_type_number else (if (t[1] == "#") b_input_type_color else b_input_type_text);
                j = 2;
                parse_token ",", t; # input default
                add "reporter" to parsed_inputs;
                add type to parsed_inputs;
                add "" to parsed_inputs;
                add "" to parsed_inputs;
                add $x_offset + i * 20 to parsed_inputs;
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
                add "" to parsed_inputs;
                add $x_offset + i * 20 to parsed_inputs;
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
                add "reporter" to parsed_inputs;
                add b_input_type_text to parsed_inputs;
                add "round" to parsed_inputs;
                add dropdown_list to parsed_inputs;
                add $x_offset + i * 20 to parsed_inputs;
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
                add "reporter" to parsed_inputs;
                add b_input_type_text to parsed_inputs;
                add "square" to parsed_inputs;
                add dropdown_list to parsed_inputs;
                add $x_offset + i * 20 to parsed_inputs;
                add "" to parsed_inputs;
                add 12 to parsed_inputs;
                add token to parsed_inputs;
                add "" to parsed_inputs;
            } else {
                # text label
                clean t;
                add token to parsed_labels;
                add $x_offset + i * 20 to parsed_labels;
                if opcode == "control_if_else" and t == "else" {
                    parsed_labels[length parsed_labels] = bx + Padding.start;
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
        add start_style to blocks;
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
            if category == Category.Extensions {
                by -= block_stack_extension_height + 7;
            } else {
                by -= block_stack_height + 7;
            }
        } elif shape == "reporter" or shape == "boolean" {
            by -= block_reporter_height + 5;
        } elif shape == "c" {
            if slot_count == 1 {
                by -= block_c_1_height + 7;
            } else {
                by -= block_c_2_height + 7;
            }
        }
    }
}

proc parse_token delimiter, string {
    token = "";
    until ($string[j] == $delimiter and $string[j - 1] != "\\") or j > length $string {
        if not ($string[j] == "\\" and $string[j+1] == $delimiter) { # don't include escape character
            token &= $string[j];
        }
        j++;
    }
    j++;
}

proc clean string {
    local j = 1;
    token = "";
    until j > length $string {
        if not (($string[j] == " " and (j == 1 or j == length $string)) or $string[j] == "\\") {
            token &= $string[j];
        }
        j++;
    }
}

# creating a block palette lookup for the purpose of deserializing blocks faster
proc create_palette_lookup {
    delete palette_lookup;
    local i = "motion_movesteps" in opcode_lookup; # skip jump and non-existent blocks
    repeat length opcode_lookup {
        local line_n = 1;
        local found = false;
        until found or line_n > length block_palette {
            if opcode_lookup[i] in block_palette[line_n] {
                found = true;
            } else {
                line_n++;
            }
        }
        if found {
            add opcode_lookup[i] to palette_lookup;
            add line_n to palette_lookup;
        }
        i++;
    }
}