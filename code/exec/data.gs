proc exec_variables cmd {
    if $cmd < Opcode.data_setvariableto {
        # get variable
        pop 1;
        if args[1] not in vars.name {
            add Var {name: args[1], val: 0} to vars;
        }
        push vars[args[1] in vars.name].val;
    } else {
        if $cmd < Opcode.data_showvariable {
            if $cmd < Opcode.data_changevariableby {
                # set variable
                pop 2;
                if args[1] not in vars.name {
                    add Var {name: args[1], val: 0} to vars;
                }
                vars[args[1] in vars.name].val = args[2];
            } else {
                # change variable
                pop 2;
                if args[1] not in vars.name {
                    add Var {name: args[1], val: 0} to vars;
                }
                vars[args[1] in vars.name].val += args[2];
            }
        } else {
            if $cmd < Opcode.data_hidevariable {
                # show variable
            } else {
                # hide variable
            }
        }
    }
}

proc exec_lists cmd {

}