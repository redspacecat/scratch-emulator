costumes "assets/images/dango-cat.svg";

%include code/opcodes

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

    show;
    goto 0, 0;
    clear_graphic_effects;
    point_in_direction 90;
    p = 1;
    until p > length code {
        if code[p].type == "text" {
            push code[p].val;
        } elif code[p].type == "command" {
            execute code[p].val;
            # exec_cmd code[p].val;
        }
        p++;
    }
}

proc exec_cmd cmd {
    if $cmd > Opcode.sensing_username { # operators - end
        if $cmd > Opcode.datalist_hidelist {
            # extensions & custom blocks
        } else { # operators - lists
            if $cmd > Opcode.operator_mathop { # variables - lists
                if $cmd > Opcode.data_hidevariable {
                    exec_lists $cmd; # lists
                } else {
                    exec_variables $cmd; # variables
                }
            } else {
                exec_operators $cmd; # operators
            }
        }
    } else { # motion - sensing
        if $cmd > Opcode.sound_volume { # events - sensing
            if $cmd > Opcode.control_delete_this_clone {
                exec_sensing $cmd; # sensing
            } else {  # events - control
                if $cmd > Opcode.event_broadcastandwait {
                    exec_control $cmd; # control
                } else {
                    exec_events $cmd; # events
                }
            }
        } else { # motion - sound
            if $cmd > Opcode.motion_direction { # looks - sound
                if $cmd > Opcode.looks_size {
                    exec_count $cmd; # sound
                } else {
                    exec_looks $cmd; # looks
                }
            } else {
                exec_motion $cmd; # motion
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