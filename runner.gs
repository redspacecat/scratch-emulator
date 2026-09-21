# %include code/PTE_font
costumes "assets/images/costumes/main/*";
costumes "assets/images/costumes/other/*";
# costumes "assets/images/costumes/main/dango-cat.svg";

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
%include code/exec/pen

set_x 0;
set_y 0;
hide;

struct Var {
    name,
    val
}

list stack;
list args;
list tmp_args; # for storing args for longer running blocks
list Var vars;
list threads;
list received_messages;

list target_arg_lookup = [
    "random position", "_random_",
    "mouse-pointer", "_mouse_",
    "edge", "_edge_",
    "myself", "_myself_"
];

proc init {
    switch_costume "Cat-a";
    base_costume = costume_number() - 1;
    CURRENT_CLONE_ID = 0;
    CURRENT_BROADCAST_ID = 0;
}

on "create_sprites" {
    init;

    create_sprites;
}

proc create_sprites {
    sprite_id = 1;
    clone_id = "";
    repeat length sprites {
        clone;
        sprite_id++;
    }
    sprite_id = "";
}

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

proc add_async_action action {
    add AsyncAction {sprite_id: sprite_id, clone_id: clone_id, action: $action} to async_actions;
}

proc check_async_action action {
    action_status = false;
    local i = 1;
    repeat length async_actions {
        if async_actions[i].sprite_id == sprite_id and async_actions[i].clone_id == clone_id and async_actions[i].action == $action {
            action_status = true;
            delete async_actions[i]; # remove actions from list to prevent old data in list
        } else {
            i++;
        }
    }
}

proc init_sprite {
    switch_costume base_costume + sprites[sprite_id].costume;
    clear_graphic_effects;
    hide;
    set_size 100;
    say "";
    think "";
    clear_sound_effects;
    set_drag_mode_not_draggable;
    set_rotation_style_left_right;
    point_in_direction 90;
    goto 0, 0;
    pen_up;
    set_pen_color "#0000ff";
    set_pen_size 1;

    var_pen_size = 1;
    var_pen_down = false;
    var_draggable = true;
}

on "init_runtime" {
    init_sprite;
    init_runtime;
}

on "run" {
    if sprite_id > "" {
        run;
    } else {
        forever {
            LAST_SCREEN_REFRESH = days_since_2000();
        }
    }
}

on "stop_program" {
    delete threads;
    delete_this_clone;
}

onclone {
    if clone_id > "" {
        update_message_counts 1;
        run;
    }
}

nowarp proc run {
    delete threads;
    action_sprite_id = sprite_id; # for use in async blocks to make sure only the right sprite runs it
    action_clone_id = clone_id;

    show;
    if clone_id > "" {
        start_hats "control_start_as_clone";
    } else {
        start_hats "event_whenflagclicked";
    }

    forever {
        check_messages;
        exec_threads;
    }
}

proc update_message_counts change {
    # update receiver counts for messages to keep broadcast and wait working
    local i = 1;
    repeat length hats {
        if hats[i] == sprite_id and hats[i + 1] == "event_whenbroadcastreceived" {
            message_receiver_count[hats[i + 2] in message_names] += $change;
        }
        i += 4;
    }
}

proc check_messages { # check for received broadcasts
    if sprite_id == 1 and clone_id == "" { # only one sprite needs to handle cleanup of used broadcasts
        local i = 1;
        until i > length messages {
            if timer() - 0.5 > messages[i + 1] {
                # delete old, received messages
                repeat 3 {
                    delete messages[i];
                }
            } else {
                i += 3;
            }
        }
    }

    local i = 1;
    repeat length messages / 3 {
        if messages[i] not in received_messages {
            if messages[i + 1] != timer() {
                # stop old messages
                local j = 1;
                until j > length threads {
                    if threads[j + 3] == messages[i + 2] { # if thread started from that message name
                        log "stopping existing thread... " + messages[i + 2];
                        stop_thread j;
                    } else {
                        j += 5;
                    }
                }
                # start new messages
                start_hats "event_whenbroadcastreceived", messages[i + 2], messages[i];
                log "starting broadcast receiver... " & messages[i + 2];
                add messages[i] to received_messages;
            }
        }
        i += 3;
    }
}

proc start_hats hat, arg="", msg_id="" {
    if not RUNNING or sprite_id == "" {
        stop_this_script;
    }
    local threadI = 1;
    repeat length hats {
        if hats[threadI] == sprite_id and hats[threadI + 1] == $hat {
            if hats[threadI + 2] == $arg or $arg == "" {
                if hats[threadI + 1] == "event_whenbroadcastreceived" {
                    # if starting a message receiver, add that to threads list so that thread knows
                    start_thread hats[threadI + 3], $arg, $msg_id;
                } else {
                    start_thread hats[threadI + 3];
                }
            }
        }
        threadI += 4;
    }
}

proc init_runtime {
    # vars and lists will be created as needed
    # if it's global, it uses that, otherwise a local var/list is created
    delete vars;
    delete threads; # thread has: pos, status, start time, message id
    delete messages;

    init_sprite;

    soundI = 0;
    askI = 0;
    delete tmp_args;
    repeat 11 { # fill up with blank space so it can be replaced by arguments when needed
        add "" to tmp_args;
    }
    reset_timer;
    TIMER_BASE = timer();
    LAST_SCREEN_REFRESH = days_since_2000();

    delete received_messages;
}

proc start_thread pos, message_name="", message_id="" {
    add $pos to threads;
    add "" to threads;
    add "" to threads;
    add $message_name to threads;
    add $message_id to threads;
}

proc stop_thread pos {
    if threads[$pos + 4] > "" {
        received_messages_exec_count[threads[$pos + 4]] += 1;
    }
    repeat 5 {
        delete threads[$pos];
    }
    # shift down later indexes appropriately to ensure thread unpausing still works
    if $pos < askI {askI -= 5;}
    if $pos < soundI {soundI -= 5;}
}

proc pause_current_thread secs="" {
    # pauses the current thread to let a longer running action take place
    # yield is set so that when the action finishes, the thread automatically
    # picks up where it left off
    threads[current_thread + 1] = "wait";
    if $secs > "" {
        threads[current_thread + 2] = timer() + $secs;
        # log "delayed thread " & current_thread & " for " & $secs;
    }
    yield = p + 1;
}

proc unpause_thread idx {
    threads[$idx + 1] = "";
}

proc exec_threads {
    threadI = 1;
    repeat length threads / 5 {
        exec_one_thread threadI;
    }
}

proc exec_one_thread threadPos {
    delete stack;
    current_thread = $threadPos;

    if threads[current_thread + 1] == "wait" { # yield if waiting on a command to complete
        if threads[current_thread + 2] > "" and timer() > threads[current_thread + 2] { # handle threads delayed for a time
            # log "ending thread wait " & current_thread & " " & threads[current_thread + 2];
            threads[current_thread + 1] = "";
            threads[current_thread + 2] = "";
        } else {
            threadI += 5; # make sure to run other threads too
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
        # log "storing yield position " & yield;
        threads[current_thread] = yield; # update the stored position of the thread to come back to next frame
    }
    if stop {
        if stop_level == "script" {
            stop_thread current_thread;
        } elif stop_level == "sprite" {
            stop_all_threads;
        } else {
            stop_all_threads;
            broadcast "stop_program";
        }
    } else {
        threadI += 5;
    }
}

proc stop_all_threads {
    until length threads == 0 {
        stop_thread 1;
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
            if $cmd < Opcode.pen_clear {
                exec_lists $cmd;
            } else {
                # extensions and custom blocks
                if $cmd <= Opcode.pen_penSize {
                    exec_pen $cmd;
                }
            }
        }
    }
}