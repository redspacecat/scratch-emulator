# %include code/PTE_font
# costumes "assets/images/costumes/main/*";
# costumes "assets/images/costumes/other/*";
costumes "assets/images/costumes/main/dango-cat.svg";

%define special_targets(num) if (args[num] in target_arg_lookup) target_arg_lookup[(args[num] in target_arg_lookup) + 1] else args[num]
%define special_targets_tmp(num) if (tmp_args[num] in target_arg_lookup) target_arg_lookup[(tmp_args[num] in target_arg_lookup) + 1] else tmp_args[num]

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
list tmp_args; # for storing args for longer running blocks
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

proc pop_tmp_args arg_count {
    repeat $arg_count {
        delete tmp_args[1];
    }
}

proc init_sprite {
    switch_costume base_costume;
    clear_graphic_effects;
    show;
    set_size 100;
    say "";
    think "";
    clear_sound_effects;
    set_drag_mode_not_draggable;
    set_rotation_style_left_right;
    point_in_direction 90;
    goto 0, 0;
    pen_up;
}

nowarp proc run {
    init_runtime;

    until length threads == 0 {
        exec_threads;
    }
}

proc init_runtime {
    delete vars;
    delete threads; # thread has: pos, status, start time

    base_costume = "dango-cat";
    init_sprite;

    soundI = 0;
    askI = 0;
    delete tmp_args;
    repeat 11 { # fill up with blank space so it can be replaced by arguments when needed
        add "" to tmp_args;
    }
    timer_base = timer();

    threadI = 1;
    repeat length events {
        if events[threadI] == "event_whenflagclicked" {
            start_thread events[threadI + 2];
        }
        threadI++;
    }
}

proc start_thread pos {
    add $pos to threads;
    add "" to threads;
    add "" to threads;
}

proc stop_thread pos {
    repeat 3 {
        delete threads[$pos];
    }
    # shift down later indexes appropriately to ensure thread unpausing still works
    if $pos < askI {askI -= 3;}
    if $pos < soundI {soundI -= 3;}
}

proc pause_current_thread secs="" {
    # pauses the current thread to let a longer running action take place
    # yield is set so that when the action finishes, the thread automatically
    # picks up where it left off
    threads[current_thread + 1] = "wait";
    if $secs > "" {
        threads[current_thread + 2] = timer() + $secs;
        log "delayed thread " & current_thread & " for " & $secs;
    }
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
        if threads[current_thread + 2] > "" and timer() > threads[current_thread + 2] { # handle threads delayed for a time
            log "ending thread wait " & current_thread & " " & threads[current_thread + 2];
            threads[current_thread + 1] = "";
            threads[current_thread + 2] = "";
        } else {
            stop_this_script;
        }
    }

    stop = false;
    stop_level = "";
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
        if stop_level == "script" {
            stop_thread current_thread;
        } elif stop_level == "sprite" {
            stop_all_threads;
        } else {
            stop_all_execution;
        }
    }
}

proc stop_all_threads {
    until length threads == 0 {
        stop_thread 1;
    }
}

proc stop_all_execution {
    stop_all_threads;
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