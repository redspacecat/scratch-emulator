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

onclick {
    start_hats "event_whenthisspriteclicked";
}

%define key(k) onkey k { start_hats "event_whenkeypressed", k; }

key("space")
key("up arrow")
key("down arrow")
key("right arrow")
key("left arrow")
key("any")
key("a")
key("b")
key("c")
key("d")
key("e")
key("f")
key("g")
key("h")
key("i")
key("j")
key("k")
key("l")
key("m")
key("n")
key("o")
key("p")
key("q")
key("r")
key("s")
key("t")
key("u")
key("v")
key("w")
key("x")
key("y")
key("z")
key("0")
key("1")
key("2")
key("3")
key("4")
key("5")
key("6")
key("7")
key("8")
key("9")