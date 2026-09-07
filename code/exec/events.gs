proc exec_events cmd {
    if $cmd == Opcode.event_broadcast { # broadcast
        pop 1;
        # queue broadcast
        CURRENT_BROADCAST_ID++;
        add CURRENT_BROADCAST_ID to messages; # id
        add timer() to messages; # current time
        add args[1] to messages; # message name
    } elif $cmd == Opcode.event_broadcastandwait { # broadcast and wait

    }
}