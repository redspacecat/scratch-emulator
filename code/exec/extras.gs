proc exec_extras cmd {
    if $cmd == Opcode.jump {
        # we must force a screen refresh while in run without screen refresh,
        # or else scratch will do it and break the program sometimes
        if (days_since_2000() - time_since_last_jump_yield) * 86400000 > 400 {
            log "yielding for a forced screen refresh...";
            jump_yield;
        } else {
            # jump
            pop 1;
            p = args[1] - 1;
        }
    } elif $cmd == Opcode.jump_if {
        # jump if
        pop 2;
        if args[1] == "true" {
            if (days_since_2000() - time_since_last_jump_yield) * 86400000 > 400 {
                log "yielding for a forced screen refresh...";
                jump_yield;
            } else {
                p = args[2] - 1;
            }
        }
    } elif $cmd == Opcode.jump_yield {
        jump_yield;
    } elif $cmd == Opcode.end { # end execution of current script, same as stop this script
        stop = true;
        stop_level = "script";
    }
}

proc jump_yield {
    # jump yield - jump to a target and yield until the next frame
    pop 1;
    yield = args[1]; # we don't need to do arg - 1 since it's not p, which is being incremented
    time_since_last_jump_yield = days_since_2000();
}