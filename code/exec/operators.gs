proc exec_operators cmd {
    if $cmd < Opcode.operator_and { # add - equals
        if $cmd < Opcode.operator_random { # add - divide
            if $cmd < Opcode.operator_multiply {
                if $cmd < Opcode.operator_subtract { # add
                    pop 2;
                    push args[1] + args[2];
                } else { # subtract
                    pop 2;
                    push args[1] - args[2];
                }
            } else {
                if $cmd < Opcode.operator_divide { # multiply
                    pop 2;
                    push args[1] * args[2];
                } else { # divide
                    pop 2;
                    push args[1] / args[2];
                }
            }
        } else { # random to equals
            if $cmd < Opcode.operator_lt {
                if $cmd < Opcode.operator_gt { # pick random
                    pop 2;
                    push random(args[1], args[2]);
                } else { # gt
                    pop 2;
                    push args[1] > args[2];
                }
            } else {
                if $cmd < Opcode.operator_equals { # lt
                    pop 2;
                    push args[1] < args[2];
                } else { # equals
                    pop 2;
                    push args[1] == args[2];
                }
            }
        }
    } else {
        if $cmd < Opcode.operator_contains {
            if $cmd < Opcode.operator_join {
                if $cmd < Opcode.operator_or { # and
                    pop 2;
                    push args[1] == "true" and args[2] == "true";
                } elif $cmd < Opcode.operator_not { # or
                    pop 2;
                    push args[1] == "true" or args[2] == "true";
                } else { # not
                    pop 1;
                    push not (args[1] == "true");
                }
            } else {
                if $cmd < Opcode.operator_letter_of { # join
                    pop 2;
                    push args[1] & args[2];
                } elif $cmd < Opcode.operator_length { # letter of
                    pop 2;
                    push args[2][args[1]];
                } else { # length
                    pop 1;
                    push length args[1];
                }
            }
        } else {
            if $cmd < Opcode.operator_round {
                if $cmd < Opcode.operator_mod { # contains
                    pop 2;
                    push args[2] in args[1];
                } else { # mod
                    pop 2;
                    push args[1] % args[2];
                }
            } else {
                if $cmd < Opcode.operator_mathop { # round
                    pop 1;
                    push round args[1];
                } else { # mathop
                    pop 2;
                    if args[1] == "abs" {
                        push abs args[2];
                    } elif args[1] == "floor" {
                        push floor args[2];
                    } elif args[1] == "ceiling" {
                        push ceil args[2];
                    } elif args[1] == "sqrt" {
                        push sqrt args[2];
                    } elif args[1] == "sin" {
                        push sin args[2];
                    } elif args[1] == "cos" {
                        push cos args[2];
                    } elif args[1] == "tan" {
                        push tan args[2];
                    } elif args[1] == "asin" {
                        push asin args[2];
                    } elif args[1] == "acos" {
                        push acos args[2];
                    } elif args[1] == "atan" {
                        push atan args[2];
                    } elif args[1] == "ln" {
                        push ln args[2];
                    } elif args[1] == "log" {
                        push log args[2];
                    } elif args[1] == "e ^" {
                        push antiln args[2];
                    } elif args[1] == "10 ^" {
                        push antilog args[2];
                    }
                }
            }
        }
    }
}