%include code/opcodes

%define c_func_sprite 0
%define c_func_func_num 1
%define c_func_proccode 2
%define c_func_warp 3
%define c_func_arg_count 4
%define c_func_code 5
%define c_func_args 6

list tmp_vars;
list functions;

proc compile {
    delete code;
    delete tmp_vars;
    delete hats;
    delete message_receiver_count;
    delete received_messages_exec_count;
    delete message_names; # stores all unique messages
    delete functions; # stores custom block data for runtime

    save_current_sprite;

    spriteNum = 1;
    repeat length sprites {
        # load code into editor
        load_sprite spriteNum, false, false;

        # add this sprite's functions
        compile_add_functions;

        # compile code
        i = 1;
        repeat length roots {
            local root_idx = roots[i];
            # only compile roots that can start code and have something attached
            if (b_start_style(root_idx) == "hat" and b_next(root_idx) > "") or b_start_style(root_idx) == "proc" {
                if b_start_style(root_idx) == "hat" {
                    add spriteNum to hats;
                    add b_opcode(root_idx) to hats;
                    add b_input1_text(root_idx) to hats;
                    add length code + 1 to hats;
                    compile_root b_next(root_idx);
                } else {
                    log "compiling custom block " & b_custom_block(root_idx);
                    set_func_val spriteNum, b_custom_block(root_idx), c_func_code, length code + 1;
                    compile_root b_next(root_idx), b_custom_block(root_idx);
                }
            }
            i++;
        }

        # update the jump targets to the definition position
        compile_replace_proc_placeholders;

        spriteNum++;
    }

    # optimize opcodes
    i = 1;
    repeat length code {
        if code[i].type == "command" {
            code[i].val = code[i].val in opcode_lookup;
        }
        i++;
    }

    # count messages
    i = 1;
    repeat length hats / 4 {
        if hats[i + 1] == "event_whenbroadcastreceived" {
            local name = hats[i + 2];
            if name not in message_names {
                add name to message_names;
                add 0 to message_receiver_count;
            }
            message_receiver_count[name in message_names] += 1;
        }
        i += 4;
    }
}

proc compile_root root, c_block="" {
    current_func = $c_block; # the function currently being compiled
    if $root > "" {
        if current_func > "" and get_func_val(spriteNum, current_func, c_func_warp) == "true" {
            compile_script $root, warp: true;
        } else {
            compile_script $root;
        }
    }
    if current_func > "" {
        # add code to pop args and return
        handle_func_end;
    }
    add_cmd "end"; # stop the current thread so it doesn't go on and execute other scripts
}

proc compile_script idx, warp=false {
    compile_block $idx, $warp;
    if b_next($idx) > "" {
        compile_script b_next($idx), $warp;
    }
}

proc compile_inner_script idx, warp=false {
    if $idx > "" {
        compile_script $idx, $warp;
    }
}

proc compile_block idx, warp=false {
    log "compiling block: " & b_opcode($idx) & " with idx: " & $idx & " and warp: " & $warp;
    if b_shape($idx) == "c" or b_opcode($idx) == "control_wait_until" {
        if b_opcode($idx) == "control_if" or b_opcode($idx) == "control_if_else" {
            # compile block condition
            compile_input 1, $idx;
            add_cmd "operator_not";

            add_placeholder "IF-ELSE", $idx;
            add_cmd "jump_if";
            # compile if true statement
            compile_inner_script b_slot_1_nested_block($idx), $warp;
            if b_slot_2_nested_block($idx) > "" {
                # compile if false statement
                add_placeholder "IF-END", $idx;
                add_cmd "jump";

                replace_placeholder "IF-ELSE", $idx;

                compile_inner_script b_slot_2_nested_block($idx), $warp;
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
            compile_inner_script b_slot_1_nested_block($idx), $warp;
            # go back to top of loop
            get_tmp "LOOP-START-" & $idx;
            add_text tmp_val;
            add_cmd if ($warp) "jump_allow_yield" else "jump_yield";
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
            compile_inner_script b_slot_1_nested_block($idx), $warp;

            # increment iterator
            add_text "__REPEAT-LOOP-I-" & $idx;
            add_text 1;
            add_cmd "data_changevariableby";

            # jump back to top
            get_tmp "LOOP-START-" & $idx;
            add_text tmp_val;
            add_cmd if ($warp) "jump_allow_yield" else "jump_yield";

            replace_placeholder "LOOP-END", $idx;
        } elif b_opcode($idx) == "control_warp" {
            compile_inner_script b_slot_1_nested_block($idx), true; # make the code inside run without screen refresh
        }
    } elif b_opcode($idx) == "control_stop" and b_input1_text($idx) == "this script" and current_func > "" {
        # when stop this script is used in a custom block, we need to end the function
        # instead of stopping the entire thread, to make execution only break out of the custom block
        handle_func_end;
    } else {
        compile_input 1, $idx;
        compile_input 2, $idx;
        compile_input 3, $idx;

        if b_opcode($idx) == "procedures_call" {
            # calling a procedure
            # move args from regular stack to call stack and add return pos
            log "arg count " & get_func_val(spriteNum, b_custom_block($idx), c_func_arg_count);
            add_text get_func_val(spriteNum, b_custom_block($idx), c_func_arg_count); # arg count to move
            add_text length code + 5; # return position, after call
            add_cmd "proc_init_call";
            # jump to proc definition
            add_placeholder "PROC-CALL-JUMP-", spriteNum & "-" & b_custom_block($idx);
            add_cmd "jump";
        } else {
            if b_opcode($idx) == "data_variable" or b_opcode($idx) == "datalist_listcontents" {
                # for variables or lists, we're compiling them from a data_variable or datalist_listcontents block with a text label
                # to a data_variable or datalist_listcontents block with an input, where the input is the variable name, the text label
                add_text b_label1_text($idx);
            }
            
            if b_opcode($idx) == "procedures_arg_reporter" or b_opcode($idx) == "procedures_arg_boolean" {
                log "compiling proc arg";
                # add_text b_label1_text($idx);
                if current_func > "" {
                    local i = get_func_idx(spriteNum, current_func, c_func_args);
                    local arg_num = 1;
                    until functions[i] == "" or functions[i] == b_label1_text($idx) {
                        i++;
                        arg_num++;
                    }
                    if functions[i] == "" {
                        add_text 0; # called in wrong function, arg doesn't exist
                    } else {
                        # valid function argument
                        log "arg name " & b_label1_text($idx) & " arg # " & arg_num;
                        add_text arg_num;
                        add_cmd "proc_arg";
                    }
                } else {
                    log "arg not called in function";
                    add_text 0; # not called in function
                }
            } else {
                add_cmd b_opcode($idx);
            }
        }

        if b_opcode($idx) == "event_broadcastandwait" {
            # for broadcast and wait, add special logic for waiting, wait until loop
            add_text "__BROADCAST-ID-" & $idx;
            add_cmd "get_broadcast_id";
            add_cmd "data_setvariableto";

            add_text "__BROADCAST-GOAL-" & $idx;
            add_text b_input1_text($idx); # broadcast name
            add_cmd "get_broadcast_receiver_count";
            add_cmd "data_setvariableto";

            set_tmp "LOOP-START-" & $idx, length code + 1;

            # compile block condition
            add_text "__BROADCAST-ID-" & $idx;
            add_cmd "data_variable";
            add_text "__BROADCAST-GOAL-" & $idx;
            add_cmd "data_variable";
            add_cmd "is_broadcast_receive_done";

            add_placeholder "LOOP-END", $idx;
            add_cmd "jump_if";

            # go back to top of loop
            get_tmp "LOOP-START-" & $idx;
            add_text tmp_val;
            add_cmd "jump_yield";
            replace_placeholder "LOOP-END", $idx;
        }
    }
}

proc compile_input inputNum, idx {
    local idx = $idx + b_inputs + ($inputNum - 1) * INPUT_LENGTH;
    if blocks[idx + b_input_shape] > "" {
        if blocks[idx + b_input_nested_block] > "" {
            compile_block blocks[idx + b_input_nested_block];
        } else {
            add_text blocks[idx + b_input_text];
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


proc replace_proc_placeholder prefix, key, value {
    # for replacing proc call jump positions
    local i = 1;
    repeat length code {
        if code[i].val == $prefix & $key and code[i].type == "placeholder" {
            code[i].val = $value;
            code[i].type = "text";
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

proc compile_add_functions {
    # loop over this sprite's custom blocks and add them to the
    # functions list to be used during compilation
    i = 1;
    func_num = 1;
    repeat length custom_blocks / CUSTOM_BLOCK_LENGTH {
        tmp_pos = length functions + 1; # for replacing values
        add spriteNum to functions; # sprite number
        add func_num to functions; # function number
        add custom_blocks[i] to functions; # proccode
        add custom_blocks[i + 1] to functions; # warp
        add 0 to functions; # argument count
        add 0 to functions; # code
        # argument list (3)
        j = i + 2; # argument start
        arg_count = 0;
        until custom_blocks[j] == "" {
            if custom_blocks[j] == "input" {
                add custom_blocks[j + 2] to functions;
                arg_count++;
            }
            j += 3;
        }
        until length functions % 10 == 0 {
            add "" to functions;
        }
        functions[tmp_pos + c_func_arg_count] = arg_count;
        i += CUSTOM_BLOCK_LENGTH; # custom block length
        func_num++;
    }
}

proc compile_replace_proc_placeholders {
    # once we've compiled all functions, replace calls to them with jumps to the right spot
    local i = 1;
    repeat length functions / 10 {
        if functions[i] == spriteNum {
            log "replacing function " & functions[i + c_func_func_num];
            replace_proc_placeholder "PROC-CALL-JUMP-", spriteNum & "-" & functions[i + c_func_func_num], functions[i + c_func_code];
        }
        i += 10;
    }
}

proc func_get_idx sprite_num, func_id {
    log "function - get idx";
    log $sprite_num;
    log $func_id;
    log "";
    local i = 1;
    repeat length functions / 10 {
        if functions[i] == $sprite_num and functions[i + c_func_func_num] == $func_id {
            func_idx = i;
            stop_this_script;
        }
        i += 10;
    }
}

proc set_func_val sprite_num, func_id, key, val {
    func_get_idx $sprite_num, $func_id;
    functions[func_idx + $key] = $val;
}

func get_func_val(sprite_num, func_id, key) {
    func_get_idx $sprite_num, $func_id;
    log "func idx: " & func_idx;
    log "key: " & $key;
    return functions[func_idx + $key];
}

func get_func_idx(sprite_num, func_id, key) {
    func_get_idx $sprite_num, $func_id;
    return func_idx + $key;
}

proc handle_func_end {
    # pop off args and jump back to call position
    add_text get_func_val(spriteNum, current_func, c_func_arg_count);
    add_cmd "proc_return_jump_pop";
}