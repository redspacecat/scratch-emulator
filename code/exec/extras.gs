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
    } elif $cmd == Opcode.proc_return_jump_pop { # return jump pop
        pop_call 1; # get return position
        tmp_return_pos = args[1];

        pop 1; # get number of args to remove
        pop_call args[1]; # remove args from stack

        # jump to return position
        p = tmp_return_pos - 1;
    } elif $cmd == Opcode.proc_init_call { # proc init call
        pop 2;
        tmp_return_pos = args[2];
        pop args[1]; # pop off custom block args from arg count amount
        until length args == 0 { # push args in reverse order so stack top - 1 = arg 1
            push_call args[length args];
            delete args[length args];
        }
        push_call tmp_return_pos;
    } elif $cmd == Opcode.proc_arg { # proc arg
        pop 1;
        push call_stack[1 + args[1]]; # args are from the top of the stack
    }
}