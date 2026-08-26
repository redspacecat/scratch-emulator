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
            stop_level = "sprite";
        } elif args[1] == "all" {
            stop = true;
            stop_level = "global";
        }
    } elif $cmd == Opcode.control_create_clone_of { # create clone

    } elif $cmd == Opcode.control_delete_this_clone { # delete this clone

    }
}