proc exec_control cmd {
    if $cmd == Opcode.control_stop {
        pop 1;
        if args[1] == "this script" {
            stop = true;
        }
    }
}