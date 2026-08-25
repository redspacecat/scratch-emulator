costumes "assets/images/dango-cat.svg";

%define special_targets(num) if (args[num] in target_arg_lookup) target_arg_lookup[(args[num] in target_arg_lookup) + 1] else args[num]

%include code/opcodes
%include code/exec/extras
%include code/exec/motion
%include code/exec/looks
%include code/exec/sound
%include code/exec/events
%include code/exec/control
%include code/exec/sensing
%include code/exec/operators
%include code/exec/data

set_x 0;
set_y 0;
hide;

onkey "r" {
    run;
}

struct Var {
    name,
    val
}

list stack;
list args;
list Var vars;
list threads;

list target_arg_lookup = [
    "random position", "_random_",
    "mouse-pointer", "_mouse_",
    "edge", "_edge_",
    "myself", "_myself_"
];

proc pop arg_count {
    delete args;
    repeat $arg_count {
        pop_one;
        insert popped_val at args[1];
    }
}

proc pop_one {
    popped_val = stack[1];
    delete stack[1];
}

proc push item {
    insert $item at stack[1];
}

nowarp proc run {
    delete vars;
    delete threads; # thread has: pos, status, start time
    glideI = 0; # reset gliding status

    show;
    goto 0, 0;
    clear_graphic_effects;
    point_in_direction 90;

    threadI = 1;
    repeat length events {
        if events[threadI] == "event_whenflagclicked" {
            start_thread events[threadI+2];
        }
        threadI++;
    }

    until length threads == 0 {
        exec_threads;
    }
}

proc start_thread pos {
    add $pos to threads;
    add "" to threads;
    add 0 to threads;
}

proc stop_thread pos {
    repeat 3 {
        delete threads[$pos];
    }
}

proc pause_current_thread {
    # pauses the current thread to let a longer running action take place
    # yield is set so that when the action finishes, the thread automatically
    # picks up where it left off
    threads[current_thread + 1] = "wait";
    yield = p + 1;
}

proc unpause_thread idx {
    threads[$idx + 1] = "";
}

proc exec_threads {
    local threadI = 1;
    repeat length threads / 3 {
        exec_one_thread threadI;
        threadI += 3;
    }
}

proc exec_one_thread threadPos {
    delete stack;
    current_thread = $threadPos;

    if threads[current_thread + 1] == "wait" { # yield if waiting on a command to complete
        stop_this_script;
    }

    stop = false;
    yield = "";
    p = threads[current_thread];
    until stop or yield > "" {
        if code[p].type == "text" {
            push code[p].val;
        } elif code[p].type == "command" {
            exec_cmd code[p].val;
        }
        p++;
    }
    if yield > "" {
        log "storing yield position " & yield;
        threads[current_thread] = yield; # update the stored position of the thread to come back to next frame
    }
    if stop {
        stop_thread current_thread;
    }
}

proc exec_cmd cmd {
    log "running cmd: " & opcode_lookup[$cmd];

    if $cmd < Opcode.operator_add { # motion - sensing
        if $cmd < Opcode.event_whenflagclicked { # motion - sound
            if $cmd < Opcode.looks_sayforsecs { # extras - motion
                if $cmd < Opcode.motion_movesteps {
                    exec_extras $cmd;
                } else {
                    exec_motion $cmd;
                }
            } else { # looks - sound
                if $cmd < Opcode.sound_playuntildone {
                    exec_looks $cmd;
                } else {
                    exec_sound $cmd;
                }
            }
        } else { # events - sensing
            if $cmd < Opcode.control_wait {
                exec_events $cmd;
            } elif $cmd < Opcode.sensing_touchingobject {
                exec_control $cmd;
            } else {
                exec_sensing $cmd;
            }
        }
    } else { # operators - end
        if $cmd < Opcode.datalist_listcontents { # operators - variables
            if $cmd < Opcode.data_variable {
                exec_operators $cmd;
            } else {
                exec_variables $cmd;
            }
        } else { # lists - end
            if $cmd <= Opcode.datalist_hidelist {
                exec_lists $cmd;
            } else {
                # extensions and custom blcoks
            }
        }
    }
}

proc execute cmd {
    if $cmd == "sensing_askandwait" {
        pop 1;
        ask args[1];
    } elif $cmd == "sensing_answer" {
        push answer();
    } elif $cmd == "operator_contains" {
        pop 2;
        push args[2] in args[1];
    } elif $cmd == "operator_not" {
        pop 1;
        push not args[1] == "true";
    } elif $cmd == "operator_equals" {
        pop 2;
        push args[1] == args[2];
    } elif $cmd == "operator_join" {
        pop 2;
        push args[1] & args[2];
    } elif $cmd == "jump_if" {
        pop 2;
        if args[1] == "true" {
            p = args[2] - 1;
        }
    } elif $cmd == "jump" or $cmd == "jump_yield" {
        pop 1;
        p = args[1] - 1;
    } elif $cmd == "looks_sayforsecs" {
        pop 2;
        say args[1], args[2];
    } elif $cmd == "looks_say" {
        pop 1;
        say args[1];
    } elif $cmd == "sensing_keypressed" {
        pop 1;
        push key_pressed(args[1]);
    } elif $cmd == "sensing_mousedown" {
        push mouse_down();
    } elif $cmd == "looks_changeeffectby" {
        pop 2;
        if args[1] == "color" {
            change_color_effect args[2];
        }
    } elif $cmd == "motion_turnright" {
        pop 1;
        turn_right args[1];
    } elif $cmd == "control_wait" {
        pop 1;
        wait args[1];
    } elif $cmd == "looks_hide" {
        hide;
    } elif $cmd == "motion_movesteps" {
        pop 1;
        move args[1];
    } elif $cmd == "data_setvariableto" {
        pop 2;
        if args[1] not in vars.name {
            add Var {name: args[1], val: 0} to vars;
        }
        vars[args[1] in vars.name].val = args[2];
    } elif $cmd == "data_changevariableby" {
        pop 2;
        if args[1] not in vars.name {
            add Var {name: args[1], val: 0} to vars;
        }
        vars[args[1] in vars.name].val += args[2];
    } elif $cmd == "data_variable" {
        pop 1;
        if args[1] not in vars.name {
            add Var {name: args[1], val: 0} to vars;
        }
        push vars[args[1] in vars.name].val;
    } elif $cmd == "motion_goto" {
        pop 1;
        if args[1] == "random position" {
            goto "_random_";
        }
    }
}