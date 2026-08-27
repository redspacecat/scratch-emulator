proc exec_sound cmd {
    if $cmd < Opcode.sound_cleareffects {
        if $cmd < Opcode.sound_changeeffectby {
            if $cmd < Opcode.sound_stopallsounds {
                if $cmd < Opcode.sound_play { # play until done
                    pop 1;
                    if soundI == 0 { # avoid calling if a sound is already active to prevent overwriting soundI
                        soundI = current_thread;
                        copy_args_to_tmp;
                        broadcast "exec_play_sound";
                        pause_current_thread;
                    }
                } else { # start
                    pop 1;
                    start_sound args[1];
                }
            } else { # stop all sounds
                stop_all_sounds;
            }
        } else {
            if $cmd < Opcode.sound_seteffectto { # change effect
                pop 2;
                if args[1] == "pitch" {
                    change_pitch_effect args[2];
                } else {
                    change_pan_effect args[2];
                }
            } else { # set effect
                pop 2;
                if args[1] == "pitch" {
                    set_pitch_effect args[2];
                } else {
                    set_pan_effect args[2];
                }
            }
        }
    } else {
        if $cmd < Opcode.sound_setvolumeto {
            if $cmd < Opcode.sound_changevolumeby { # clear effects
                clear_sound_effects;
            } else { # change volume
                pop 1;
                change_volume args[1];
            }
        } else {
            if $cmd < Opcode.sound_volume { # set volume
                pop 1;
                set_volume args[1];
            } else { # volume
                push volume();
            }
        }
    }
}

on "exec_play_sound" {
    exec_play_sound tmp_args[1];
    unpause_thread soundI;
    soundI = 0;
}

proc exec_play_sound arg1 {
    pop_tmp_args 1;
    play_sound_until_done $arg1;
}