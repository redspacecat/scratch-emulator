proc exec_sensing cmd {
    if $cmd < Opcode.sensing_setdragmode {
        if $cmd < Opcode.sensing_askandwait { # touching - distance
            if $cmd < Opcode.sensing_coloristouchingcolor {
                if $cmd < Opcode.sensing_touchingcolor { # touching object
                    pop 1;
                    push touching(special_targets(1));
                } else { # touching color
                    pop 1;
                    push touching_color(args[1]);
                }
            } else {
                if $cmd < Opcode.sensing_distanceto { # color is touching color
                    pop 2;
                    push color_is_touching_color(args[1], args[2]);
                } else { # distance to
                    pop 1;
                    push distance_to(special_targets(1));
                }
            }
        } else { # ask - mouse y
            if $cmd < Opcode.sensing_mousedown {
                if $cmd < Opcode.sensing_answer { # ask
                    pop 1;
                    if askI == 0 {
                        askI = current_thread;
                        tmp_args[11] = args[1];
                        add_async_action "ask";
                        broadcast "exec_ask";
                        pause_current_thread;
                    }
                } elif $cmd < Opcode.sensing_keypressed { # answer
                    push answer();
                } else { # key pressed
                    pop 1;
                    push key_pressed(args[1]);
                }
            } else {
                if $cmd < Opcode.sensing_mousex { # mouse down
                    push mouse_down();
                } elif $cmd < Opcode.sensing_mousey { # mouse x
                    push mouse_x();
                } else { # mouse y
                    push mouse_y();
                }
            }
        }
    } else { # set drag mode - username
        if $cmd < Opcode.sensing_of {
            if $cmd < Opcode.sensing_timer {
                if $cmd < Opcode.sensing_loudness { # set drag mode
                    pop 1;
                    if args[1] == "draggable" {
                        set_drag_mode_draggable;
                    } else {
                        set_drag_mode_not_draggable;
                    }
                } else { # loudness
                    push loudness();
                }
            } else {
                if $cmd < Opcode.sensing_resettimer { # timer
                    push timer() - timer_base;
                } else { # reset timer
                    timer_base = timer();
                }
            }
        } else {
            if $cmd < Opcode.sensing_online {
                if $cmd < Opcode.sensing_current { # () of ()

                } elif $cmd < Opcode.sensing_dayssince2000 { # current
                    pop 1;
                    if args[1] == "year" {
                        push current_year();
                    } elif args[1] == "month" {
                        push current_month();
                    } elif args[1] == "date" {
                        push current_date();
                    } elif args[1] == "day of week" {
                        push current_day_of_week();
                    } elif args[1] == "hour" {
                        push current_hour();
                    } elif args[1] == "minute" {
                        push current_minute();
                    } else {
                        push current_second();
                    }
                } else { # days since 2000
                    push days_since_2000();
                }
            } else {
                if $cmd < Opcode.sensing_username { # online
                    push online();
                } else { # username
                    push username();
                }
            }
        }
    }
}

on "exec_ask" {
    check_async_action "ask";
    if action_status {
        ask tmp_args[11];
        unpause_thread askI;
        askI = 0;
    }
}