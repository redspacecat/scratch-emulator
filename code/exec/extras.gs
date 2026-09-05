proc exec_extras cmd {
    if $cmd == Opcode.jump {
        # jump
        pop 1;
        p = args[1] - 1;
    } elif $cmd == Opcode.jump_if {
        # jump if
        pop 2;
        if args[1] == "true" {
            p = args[2] - 1;
        }
    } elif $cmd == Opcode.jump_yield {
        # jump yield - jump to a target and yield until the next frame
        pop 1;
        yield = args[1]; # we don't need to do arg - 1 since it's not p, which is being incremented
    } elif $cmd == Opcode.end { # end execution of current script, same as stop this script
        stop = true;
        stop_level = "script";
    }
}