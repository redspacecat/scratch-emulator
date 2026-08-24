costumes "assets/images/blank.svg";

%include code/helpful_utils

struct Token {
    type,
    val
}

list Token code;

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
    local blockIdx = b_idx($root);
    compile_block blockIdx;
    until b_next(blockIdx) == "" {
        compile_block b_idx(b_next(blockIdx));
        blockIdx = b_idx(b_next(blockIdx));
    }
}

proc compile_block idx {
    log "compiling block: " & b_opcode($idx) & " with id: " & b_id($idx);
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