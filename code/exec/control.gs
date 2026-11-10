proc exec_control cmd {
    if $cmd == Opcode.control_wait { # wait
        pop 1;
        pause_current_thread args[1];
    } elif $cmd == Opcode.control_stop { # stop
        pop 1;
        if args[1] == "this script" {
            stop = true;
            stop_level = "script";
        } elif args[1] == "other scripts in sprite" {
            stop = true;
            yield = p + 1; # after stopping threads, resume the next frame
            stop_level = "sprite";
        } elif args[1] == "all" {
            stop = true;
            stop_level = "global";
        }
    } elif $cmd == Opcode.control_create_clone_of { # create clone
        tmp_clone_id = clone_id;
        set_clone_id;
        clone;
        clone_id = tmp_clone_id;
    } elif $cmd == Opcode.control_delete_this_clone { # delete this clone
        if clone_id > "" {
            stop_all_threads; # stop threads first to make sure receiver counts are counted correctly
            update_message_counts -1; # decrement message receiver counts
            delete_this_clone;
        }
    }
}

proc set_clone_id {
    clone_id = CURRENT_CLONE_ID;
    CURRENT_CLONE_ID++;
}