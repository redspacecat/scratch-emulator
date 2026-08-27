proc exec_looks cmd {
    if $cmd < Opcode.looks_changeeffectby { # say for secs - set size
        if $cmd < Opcode.looks_switchcostumeto { # say - think
            if $cmd < Opcode.looks_thinkforsecs { # say
                if $cmd < Opcode.looks_say { # say for secs
                    pop 2;
                    tmp_args[6] = args[1];
                    tmp_args[7] = args[2];
                    broadcast "exec_say";
                    pause_current_thread args[2]; # pause for length of block execution
                } else { # say
                    pop 1;
                    say args[1];
                }
            } else { # think
                if $cmd < Opcode.looks_think { # think for secs
                    pop 2;
                    tmp_args[8] = args[1];
                    tmp_args[9] = args[2];
                    broadcast "exec_think";
                    pause_current_thread args[2];
                } else { # think
                    pop 1;
                    think args[1];
                }
            }
        } else { # switch costume - set size
            if $cmd < Opcode.looks_nextbackdrop {
                if $cmd < Opcode.looks_nextcostume { # switch costume to
                    pop 1;
                    switch_costume args[1];
                } elif $cmd < Opcode.looks_switchbackdropto { # next costume
                    next_costume;
                } else { # switch backdrop to
                    pop 1;
                    switch_backdrop args[1];
                }
            } else {
                if $cmd < Opcode.looks_changesizeby { # next backdrop
                    next_backdrop;
                } elif $cmd < Opcode.looks_setsizeto { # change size by
                    pop 1;
                    change_size args[1];
                } else { # set size to
                    pop 1;
                    set_size args[1];
                }
            }
        }
    } else { # change effect - size
        if $cmd < Opcode.looks_gotofrontback {
            if $cmd < Opcode.looks_show {
                if $cmd < Opcode.looks_seteffectto { # change effect
                    pop 2;
                    if args[1] == "color" {
                        change_color_effect args[2];
                    } elif args[1] == "fisheye" {
                        change_fisheye_effect args[2];
                    } elif args[1] == "whirl" {
                        change_whirl_effect args[2];
                    } elif args[1] == "pixelate" {
                        change_pixelate_effect args[2];
                    } elif args[1] == "mosaic" {
                        change_mosaic_effect args[2];
                    } elif args[1] == "brightness" {
                        change_brightness_effect args[2];
                    } elif args[1] == "ghost" {
                        change_ghost_effect args[2];
                    }
                } elif $cmd < Opcode.looks_cleargraphiceffects { # set effect
                    pop 2;
                    if args[1] == "color" {
                        set_color_effect args[2];
                    } elif args[1] == "fisheye" {
                        set_fisheye_effect args[2];
                    } elif args[1] == "whirl" {
                        set_whirl_effect args[2];
                    } elif args[1] == "pixelate" {
                        set_pixelate_effect args[2];
                    } elif args[1] == "mosaic" {
                        set_mosaic_effect args[2];
                    } elif args[1] == "brightness" {
                        set_brightness_effect args[2];
                    } elif args[1] == "ghost" {
                        set_ghost_effect args[2];
                    }
                } else { # clear graphic effects
                    clear_graphic_effects;
                }
            } else {
                if $cmd < Opcode.looks_hide { # show
                    show;
                } else { # hide
                    hide;
                }
            }
        } else { # front back layer - size
            if $cmd < Opcode.looks_costumenumbername {
                if $cmd < Opcode.looks_goforwardbackwardlayers { # front back layer
                    pop 1;
                    if args[1] == "front" {
                        goto_front;
                    } else {
                        goto_back;
                    }
                } else { # forward backward layers
                    pop 2;
                    if args[1] == "foward" {
                        go_forward args[2];
                    } else {
                        go_backward args[2];
                    }
                }
            } else {
                if $cmd < Opcode.looks_backdropnumbername { # costume number name
                    pop 1;
                    if args[1] == "name" {
                        push costume_name();
                    } else {
                        push costume_number();
                    }
                } elif $cmd < Opcode.looks_size { # backdrop number name
                    pop 1;
                    if args[1] == "name" {
                        push backdrop_name();
                    } else {
                        push backdrop_number();
                    }
                } else { # size
                    push size();
                }
            }
        }
    }
}

on "exec_say" {
    say tmp_args[6], tmp_args[7];
    log "finished say";
}

on "exec_think" {
    think tmp_args[8], tmp_args[9];
    log "finished think";
}