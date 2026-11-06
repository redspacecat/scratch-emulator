%include code/PTE_font
%include code/PTE_costumes_safe
%include code/helpful_utils
costumes "assets/images/costumes/main/*";
costumes "assets/images/costumes/other/*";
costumes "assets/images/costumes/other2/*";
costumes "assets/images/large.svg";
sounds "assets/sounds/*";

%define special_targets(num) if (args[num] in target_arg_lookup) target_arg_lookup[(args[num] in target_arg_lookup) + 1] else args[num]
%define special_targets_tmp(num) if (tmp_args[num] in target_arg_lookup) target_arg_lookup[(tmp_args[num] in target_arg_lookup) + 1] else tmp_args[num]

%include std/math

%define s_info_x 1
%define s_info_y 2
%define s_info_dir 3
%define s_info(id, offset) sprite_info[(id - 1) * 3 + offset]

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
%include code/exec/music

set_x 0;
set_y 0;
hide;

list stack;
list args;
list tmp_args; # for storing args for longer running blocks
list Var runtime_local_vars;
list r_local_lists;
list threads;
list received_messages;
list call_stack; # for custom blocks, holds args and return positions
list call_stack_data; # holds call stacks for different threads

list target_arg_lookup = [
    "random position", "_random_",
    "random direction", "_random_",
    "mouse-pointer", "_mouse_",
    "edge", "_edge_",
    "myself", "_myself_"
];

proc init {
    switch_costume "Cat-a";
    switch_backdrop "blank";
    base_costume = costume_number() - 1;
    CURRENT_CLONE_ID = 0;
    CURRENT_BROADCAST_ID = 0;
    hide;

    # copy global variables over so we know which variables are global and local
    delete runtime_global_vars;
    i = 1;
    repeat length global_vars {
        add Var {name: global_vars[i], val: 0} to runtime_global_vars;
        i++;
    }

    list_identifier = ""; # to make sure indentifying list names is unique, as items and names are all stored in the same list
    repeat 10 {
        list_identifier &= "abcdefghijklmnopqrstuvwxyz0123456789`-=[]\\;',./~!@#$%^&*()_+{}|:\"<>? "[random(1, 69)];
    }

    delete r_global_lists;
    i = 1;
    repeat length global_lists {
        add list_identifier & global_lists[i] to r_global_lists;
        add 0 to r_global_lists;
        i++;
    }

    delete sprite_info;
    repeat length sprites * 3 {
        add "" to sprite_info;
    }
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

proc pop_call arg_count {
    delete args;
    repeat $arg_count {
        pop_one_call;
        insert popped_val at args[1];
    }
}

proc pop_one_call {
    popped_val = call_stack[1];
    delete call_stack[1];
}

proc push_call item {
    insert $item at call_stack[1];
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
    set_tempo 60;
    set_instrument 1;

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
        switch_costume "blank";
        show;
        forever {
            LAST_SCREEN_REFRESH = days_since_2000();
            move 0;
        }
    }
}

on "stop_program" {
    delete threads;
    delete_this_clone;
}

on "terminate_program" {
    stop_other_scripts;
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
        update_shared_info;
    }
}

proc update_shared_info { # updates properties that should be accessible to other sprites
    if clone_id == "" {
        s_info(sprite_id, s_info_x) = x_position();
        s_info(sprite_id, s_info_y) = y_position();
        s_info(sprite_id, s_info_dir) = direction();
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
        if messages[i + 1] != timer() {
            if messages[i] not in received_messages {
                # stop old messages
                local j = 1;
                until j > length threads {
                    if threads[j + 3] == messages[i + 2] { # if thread started from that message name
                        # log "stopping existing thread... " & messages[i + 2];
                        stop_thread j;
                    } else {
                        j += 6;
                    }
                }
                # start new messages
                start_hats "event_whenbroadcastreceived", messages[i + 2], messages[i];
                # log "starting broadcast receiver... " & messages[i + 2];
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
    delete runtime_local_vars;
    delete r_local_lists;
    delete threads; # thread has: pos, status, start time, message id
    delete messages;

    soundI = 0;
    askI = 0;
    drumI = 0;
    restI = 0;
    noteI = 0;
    exportI = 0;
    delete tmp_args;
    repeat 17 { # fill up with blank space so it can be replaced by arguments when needed
        add "" to tmp_args;
    }
    reset_timer;
    TIMER_BASE = timer();
    LAST_SCREEN_REFRESH = days_since_2000();

    delete received_messages;

    if $tw_is_turbowarp {
        max_threads = 50;
        total_call_stack_length = 500000;
    } else {
        max_threads = 32;
        total_call_stack_length = 200000;
    }
    
    delete call_stack;
    delete call_stack_data;
    repeat total_call_stack_length {
        add "" to call_stack_data;
    }
    call_stack_length = length call_stack_data // max_threads;
}

proc start_thread pos, message_name="", message_id="" {
    add $pos to threads;
    add "" to threads;
    add "" to threads;
    add $message_name to threads;
    add $message_id to threads;
    add 0 to threads; # saved call stack length
}

proc stop_thread pos {
    if threads[$pos + 4] > "" {
        received_messages_exec_count[threads[$pos + 4]] += 1;
    }
    repeat 6 {
        delete threads[$pos];
    }
    # shift down later indexes appropriately to ensure thread unpausing still works
    if $pos < askI {askI -= 6;}
    if $pos < soundI {soundI -= 6;}
    if $pos < drumI {drumI -= 6;}
    if $pos < restI {restI -= 6;}
    if $pos < noteI {noteI -= 6;}
    if $pos < exportI {exportI -= 6;}
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
    repeat length threads / 6 {
        exec_one_thread threadI;
        if threadI == 0 {
            stop_this_script;
        }
    }
}

proc exec_one_thread threadPos {
    delete stack;
    delete call_stack;
    current_thread = $threadPos;

    if threads[current_thread + 1] == "wait" { # yield if waiting on a command to complete
        if threads[current_thread + 2] > "" and timer() > threads[current_thread + 2] { # handle threads delayed for a time
            # log "ending thread wait " & current_thread & " " & threads[current_thread + 2];
            threads[current_thread + 1] = "";
            threads[current_thread + 2] = "";
        } else {
            threadI += 6; # make sure to run other threads too
            stop_this_script;
        }
    }

    if threads[current_thread + 5] > 0 { # custom block call stack length
        # if there is a call stack, copy it over
        i = (current_thread - 1) * call_stack_length + 1;
        repeat threads[current_thread + 5] {
            add call_stack_data[i] to call_stack;
            i++;
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
        threads[current_thread] = yield; # update the stored position of the thread to come back to next frame

        if length call_stack > 0 {
            # if there is a call stack, store it for next frame
            threads[current_thread + 5] = length call_stack;
            i = (current_thread - 1) * call_stack_length + 1;
            repeat threads[current_thread + 5] {
                call_stack_data[i] = call_stack[1];
                delete call_stack[1];
                i++;
            }
        }
    }
    if stop {
        if stop_level == "script" {
            stop_thread current_thread;
        } elif stop_level == "sprite" {
            stop_other_threads;
        } else {
            stop_all_threads;
            broadcast "stop_program";
        }
    } else {
        threadI += 6;
    }
}

proc stop_all_threads {
    until length threads == 0 {
        stop_thread 1;
    }
}

proc stop_other_threads {
    # to stop all other threads, we need to delete all threads before this thread and all threads after
    repeat (threadI - 1) / 6 { # stops all threads before our current thread
        stop_thread 1;
    }

    until length threads / 6 == 1 { # stops all threads after our current thread
        stop_thread 2;
    }
    threadI = 0; # stop running threads and yield to next frame
}

proc exec_cmd cmd {
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
                if $cmd < Opcode.music_playDrumForBeats {
                    exec_pen $cmd;
                } else {
                    exec_music $cmd;
                }
            }
        }
    }
}