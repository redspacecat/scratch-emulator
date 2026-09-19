proc exec_extras cmd {
    if $cmd == Opcode.jump_allow_yield {
        # we must force a screen refresh while in run without screen refresh,
        # or else scratch will do it and break the program sometimes
        if (days_since_2000() - LAST_SCREEN_REFRESH) * 86400000 > 400 {
            log "yielding for a forced screen refresh...";
            # jump yield - jump to a target and yield until the next frame
            pop 1;
            yield = args[1]; # make target jump position yield position so it resumes there
        } else {
            # jump
            pop 1;
            p = args[1] - 1;
        }
    } elif $cmd == Opcode.jump {
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
        yield = args[1]; # make target jump position yield position so it resumes there
    } elif $cmd == Opcode.end { # end execution of current script, same as stop this script
        stop = true;
        stop_level = "script";
    } elif $cmd == Opcode.is_broadcast_receive_done {
        pop 2;
        push received_messages_exec_count[args[1]] >= args[2];
    } elif $cmd == Opcode.get_broadcast_receiver_count {
        pop 1; # broadcast name
        push message_receiver_count[args[1] in message_names];
    } elif $cmd == Opcode.get_broadcast_id {
        push CURRENT_BROADCAST_ID;
    }
}