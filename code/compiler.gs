%include code/opcodes

proc compile {
    delete code;
    delete tmp_vars;
    delete events;

    save_current_sprite;

    local spriteNum = 1;
    repeat length sprites {
        # load code into editor
        load_sprite spriteNum, false;

        # compile code
        local i = 1;
        repeat length roots {
            local root_idx = roots[i];
            # only compile roots that can start code and have something attached
            if b_start_style(root_idx) == "hat" and b_next(root_idx) > "" {
                add spriteNum to events;
                add b_opcode(root_idx) to events;
                add b_input1_text(root_idx) to events;
                add length code + 1 to events;
                compile_root b_next(root_idx);
            }
            i++;
        }

        spriteNum++;
    }

    # optimize opcodes
    local i = 1;
    repeat length code {
        if code[i].type == "command" {
            code[i].val = code[i].val in opcode_lookup;
        }
        i++;
    }
}

proc compile_root root {
    compile_script $root;
    add_cmd "end"; # stop the current thread so it doesn't go on and execute other scripts
}

proc compile_script idx {
    compile_block $idx;
    if b_next($idx) > "" {
        compile_script b_next($idx);
    }
}

proc compile_inner_script idx {
    if $idx > "" {
        compile_script $idx;
    }
}

proc compile_block idx {
    log "compiling block: " & b_opcode($idx) & " with idx: " & $idx;
    if b_shape($idx) == "c" or b_opcode($idx) == "control_wait_until" {   
        if b_opcode($idx) == "control_if" or b_opcode($idx) == "control_if_else" {
            # compile block condition
            compile_input 1, $idx;
            add_cmd "operator_not";

            add_placeholder "IF-ELSE", $idx;
            add_cmd "jump_if";
            # compile if true statement
            compile_inner_script b_slot_1_nested_block($idx);
            if b_slot_2_nested_block($idx) > "" {
                # compile if false statement
                add_placeholder "IF-END", $idx;
                add_cmd "jump";

                replace_placeholder "IF-ELSE", $idx;

                compile_inner_script b_slot_2_nested_block($idx);
                replace_placeholder "IF-END", $idx;
            } else {
                replace_placeholder "IF-ELSE", $idx;
            }
        } elif b_opcode($idx) == "control_repeat_until" or b_opcode($idx) == "control_wait_until" or b_opcode($idx) == "control_while" or b_opcode($idx) == "control_forever" {
            set_tmp "LOOP-START-" & $idx, length code + 1;
            if b_opcode($idx) != "control_forever" {
                # compile block condition
                compile_input 1, $idx;
                if b_opcode($idx) == "control_while" { # while is opposite of repeat until, it needs a not
                    add_cmd "operator_not";
                }
                add_placeholder "LOOP-END", $idx;
                add_cmd "jump_if";
            }
            # compile the loop inner stack of blocks
            compile_inner_script b_slot_1_nested_block($idx);
            # go back to top of loop
            get_tmp "LOOP-START-" & $idx;
            add_text tmp_val;
            add_cmd "jump_yield";
            replace_placeholder "LOOP-END", $idx;
        } elif b_opcode($idx) == "control_repeat" {
            # reset loop iterator
            add_text "__REPEAT-LOOP-I-" & $idx;
            add_text 1;
            add_cmd "data_setvariableto";
            # store repeat count
            add_text "__REPEAT-LOOP-COUNT-" & $idx;
            compile_input 1, $idx;
            add_cmd "data_setvariableto";

            set_tmp "LOOP-START-" & $idx, length code + 1;

            # add jump to end if done
            add_text "__REPEAT-LOOP-I-" & $idx;
            add_cmd "data_variable";
            add_text "__REPEAT-LOOP-COUNT-" & $idx;
            add_cmd "data_variable";
            add_cmd "operator_gt";
            add_placeholder "LOOP-END", $idx;
            add_cmd "jump_if";

            # compile inner stack of blocks
            compile_script b_slot_1_nested_block($idx);

            # increment iterator
            add_text "__REPEAT-LOOP-I-" & $idx;
            add_text 1;
            add_cmd "data_changevariableby";

            # jump back to top
            get_tmp "LOOP-START-" & $idx;
            add_text tmp_val;
            add_cmd "jump_yield";

            replace_placeholder "LOOP-END", $idx;
        }
    } else {
        compile_input 1, $idx;
        compile_input 2, $idx;
        compile_input 3, $idx;
        if b_opcode($idx) == "data_variable" {
            # for variables, we're compiling them from a data_variable block with a text label
            # to a data_variable block with an input, where the input is the variable name, the text label
            add_text b_label1_text($idx);
        }
        add_cmd b_opcode($idx);
    }
}

proc compile_input inputNum, idx {
    if $inputNum == 1 and b_input1_shape($idx) > "" {
        if b_input1_nested_block($idx) > "" {
            log "compiling input 1";
            compile_block b_input1_nested_block($idx);
        } else {
            add_text b_input1_text($idx);
        }
    } elif $inputNum == 2 and b_input2_shape($idx) > "" {
        if b_input2_nested_block($idx) > "" {
            log "compiling input 2";
            compile_block b_input2_nested_block($idx);
        } else {
            add_text b_input2_text($idx);
        }
    } elif $inputNum == 3 and b_input3_shape($idx) > "" {
        if b_input3_nested_block($idx) > "" {
            log "compiling input 3";
            compile_block b_input3_nested_block($idx);
        } else {
            add_text b_input3_text($idx);
        }
    }
}

proc add_placeholder prefix, key {
    add Token {type: "placeholder", val: $prefix & $key} to code;
}

proc replace_placeholder prefix, key {
    # intended for replacing things like ifs and loops, where the jump target is edited to the now-known value
    local i = 1;
    repeat length code {
        if code[i].val == $prefix & $key and code[i].type == "placeholder" {
            code[i].val = length code + 1;
            code[i].type = "text";
            stop_this_script;
        }
        i++;
    }
}

proc add_cmd cmd {
    add Token {type: "command", val: $cmd} to code;
}

proc add_text text {
    add Token {type: "text", val: $text} to code;
}

list tmp_vars;

proc set_tmp key, val {
    add $key to tmp_vars;
    add $val to tmp_vars;
}

proc get_tmp key, shouldDelete=true {
    tmp_val = tmp_vars[($key in tmp_vars) + 1];
    if $shouldDelete {
        delete tmp_vars[($key in tmp_vars) + 1];
        delete tmp_vars[$key in tmp_vars];
    }
}