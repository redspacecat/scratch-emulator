proc exec_motion cmd {
    if $cmd < Opcode.motion_changexby { # move_steps - point_towards
        if $cmd < Opcode.motion_glideto { # move_steps - gotoxy
            if $cmd < Opcode.motion_goto { # move steps - turn left
                if $cmd < Opcode.motion_turnright { # move steps
                    pop 1;
                    move args[1];
                } elif $cmd < Opcode.motion_turnleft { # turn right
                    pop 1;
                    turn_right args[1];
                } else { # turn left
                    pop 1;
                    turn_left args[1];
                }
            } else { # go to - go to xy
                if $cmd < Opcode.motion_gotoxy { # go to
                    pop 1;
                    goto special_targets(1);
                } else { # go to xy
                    pop 2;
                    goto args[1], args[2];
                }
            }
        } else { # glide_to - point_towards
            if $cmd < Opcode.motion_pointindirection { # glide to - glidetoxy
                if $cmd < Opcode.motion_glidesecstoxy {
                    # glide to
                    pop 2;
                    tmp_args[1] = args[1];
                    tmp_args[2] = args[2];
                    broadcast "exec_glide_to";
                    pause_current_thread args[1];
                } else {
                    # glide secs to xy
                    pop 3;
                    tmp_args[3] = args[1];
                    tmp_args[4] = args[2];
                    tmp_args[5] = args[2];
                    broadcast "exec_glide_to_xy";
                    pause_current_thread args[1];
                }
            } else { # point in direction - point towards
                if $cmd < Opcode.motion_pointtowards { # point in direction
                    pop 1;
                    point_in_direction args[1];
                } else { # point towards
                    pop 1;
                    point_towards special_targets(1);
                }
            }
        }
    } else { # change_x_by - direction
        if $cmd < Opcode.motion_ifonedgebounce { # change x by - set y
            if $cmd < Opcode.motion_changeyby { # change x by - set x
                if $cmd < Opcode.motion_setx { # change x by
                    pop 1;
                    change_x args[1];
                } else { # set x
                    pop 1;
                    set_x args[1];
                }
            } else { # change y by - set y
                if $cmd < Opcode.motion_sety { # change y by
                    pop 1;
                    change_y args[1];
                } else { # set y
                    pop 1;
                    set_y args[1];
                }
            }
        } else { # if on edge bounce - direction
            if $cmd < Opcode.motion_xposition { # if on edge bounce - set rotation style
                if $cmd < Opcode.motion_setrotationstyle { # if on edge bounce
                    if_on_edge_bounce;
                } else { # set rotation style
                    pop 1;
                    if args[1] == "left-right" {
                        set_rotation_style_left_right;
                    } elif args[1] == "don't rotate" {
                        set_rotation_style_do_not_rotate;
                    } else {
                        set_rotation_style_all_around;
                    }
                }
            } else { # x position - direction
                if $cmd < Opcode.motion_yposition { # x position
                    push x_position();
                } elif $cmd < Opcode.motion_direction { # y position
                    push y_position();
                } else { # direction
                    push direction();
                }
            }
        }
    }
}

on "exec_glide_to" {
    glide special_targets_tmp(2), tmp_args[1];
    log "finished glide";
}

on "exec_glide_to_xy" {
    glide tmp_args[4], tmp_args[5], tmp_args[3];
    log "finished glide to xy";
}