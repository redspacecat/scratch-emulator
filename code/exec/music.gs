proc exec_music cmd {
    if $cmd < Opcode.music_setInstrument {
        if $cmd < Opcode.music_restForBeats {
            # play drum
            pop 2;
            if drumI == 0 {
                drumI = current_thread;
                tmp_args[12] = args[1];
                tmp_args[13] = args[2];
                add_async_action "play_drum";
                broadcast "exec_play_drum";
                pause_current_thread;
            }
        } elif $cmd < Opcode.music_playNoteForBeats {
            # rest for beats
            pop 1;
            if restI == 0 {
                restI = current_thread;
                tmp_args[14] = args[1];
                add_async_action "rest_for_beats";
                broadcast "exec_rest_for_beats";
                pause_current_thread;
            }
        } else {
            # play note
            pop 2;
            if noteI == 0 {
                noteI = current_thread;
                tmp_args[15] = args[1];
                tmp_args[16] = args[2];
                add_async_action "play_note";
                broadcast "exec_play_note";
                pause_current_thread;
            }
        }
    } else {
        if $cmd < Opcode.music_changeTempo {
            if $cmd < Opcode.music_setTempo {
                # set instrument
                pop 1;
                if round(args[1]) == 0 {
                    set_instrument (args[1] in instruments);
                } else {
                    set_instrument args[1];
                }
            } else {
                # set tempo
                pop 1;
                set_tempo args[1];
                var_tempo = args[1];
            }
        } else {
            if $cmd < Opcode.music_getTempo {
                # change tempo
                pop 1;
                change_tempo args[1];
                var_tempo += args[1];
            } else {
                # get tempo
                push var_tempo;
            }
        }
    }
}

on "exec_play_drum" {
    check_async_action "play_drum";
    if action_status {
        if round(tmp_args[12]) == 0 {
            play_drum (tmp_args[12] in drums), tmp_args[13];
        } else {
            play_drum tmp_args[12], tmp_args[13];
        }
        unpause_thread drumI;
        drumI = 0;
    }
}

on "exec_rest_for_beats" {
    check_async_action "rest_for_beats";
    if action_status {
        rest tmp_args[14];
        unpause_thread restI;
        restI = 0;
    }
}

on "exec_play_note" {
    check_async_action "play_note";
    if action_status {
        play_note tmp_args[15], tmp_args[16];
        unpause_thread noteI;
        noteI = 0;
    }
}