proc exec_operators cmd {
    if $cmd == Opcode.operator_equals {
        pop 2;
        push args[1] == args[2];
    }
}