costumes "assets/images/blank.svg";

%include code/helpful_utils

onkey "c" {
    compile;
}

proc compile {
    delete code;
    show code;

    local i = 1;
    repeat length roots {
        if b_start_style(b_idx(roots[i])) == "hat" { # only compile roots that can start code
            compile_root roots[i];
        }
        i++;
    }
}

proc compile_root root {
    compile_script b_idx($root);
}

proc compile_script idx {
    compile_block $idx;
    if b_next($idx) > "" {
        compile_script b_idx(b_next($idx));
    }
}

proc compile_block idx {
    log "compiling block: " & b_opcode($idx) & " with id: " & b_id($idx);
    if b_slot_1_nested_block($idx) > "" {
        # compile if condition
        if b_input1_nested_block($idx) > "" {
            log "compiling input 1";
            compile_block b_idx(b_input1_nested_block($idx));
        } else {
            add Token {type: "text", val: b_input1_text($idx)} to code;
        }
        add Token {type: "command", val: "operator_not"} to code;
        add_placeholder "IF-ELSE", $idx;
        add Token {type: "command", val: "jump_if"} to code;
        # compile if true statement
        compile_script b_idx(b_slot_1_nested_block($idx));
        if b_slot_2_nested_block($idx) > "" {
            # compile if false statement
            add_placeholder "IF-END", $idx;
            add Token {type: "command", val: "jump"} to code;

            replace_placeholder "IF-ELSE", $idx;

            compile_script b_idx(b_slot_2_nested_block($idx));
            replace_placeholder "IF-END", $idx;
        } else {
            replace_placeholder "IF-ELSE", $idx;
        }
    } else {
        if b_input1_shape($idx) > "" {
            if b_input1_nested_block($idx) > "" {
                log "compiling input 1";
                compile_block b_idx(b_input1_nested_block($idx));
            } else {
                add Token {type: "text", val: b_input1_text($idx)} to code;
            }
        }
        if b_input2_shape($idx) > "" {
            if b_input2_nested_block($idx) > "" {
                log "compiling input 2";
                compile_block b_idx(b_input2_nested_block($idx));
            } else {
                add Token {type: "text", val: b_input2_text($idx)} to code;
            }
        }
        if b_input3_shape($idx) > "" {
            if b_input3_nested_block($idx) > "" {
                log "compiling input 3";
                compile_block b_idx(b_input3_nested_block($idx));
            } else {
                add Token {type: "text", val: b_input3_text($idx)} to code;
            }
        }
        add Token {type: "command", val: b_opcode($idx)} to code;
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