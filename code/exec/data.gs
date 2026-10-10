proc exec_variables cmd {
    if $cmd < Opcode.data_setvariableto {
        # get variable
        pop 1;
        add_var_if_not_exists args[1];
        if var_scope == "local" {
            push runtime_local_vars[args[1] in runtime_local_vars.name].val;
        } else {
            push runtime_global_vars[args[1] in runtime_global_vars.name].val;
        }
    } else {
        if $cmd < Opcode.data_showvariable {
            if $cmd < Opcode.data_changevariableby {
                # set variable
                pop 2;
                add_var_if_not_exists args[1];
                if var_scope == "local" {
                    runtime_local_vars[args[1] in runtime_local_vars.name].val = args[2];
                } else {
                    runtime_global_vars[args[1] in runtime_global_vars.name].val = args[2];
                }
            } else {
                # change variable
                pop 2;
                add_var_if_not_exists args[1];
                if var_scope == "local" {
                    runtime_local_vars[args[1] in runtime_local_vars.name].val += args[2];
                } else {
                    runtime_global_vars[args[1] in runtime_global_vars.name].val += args[2];
                }
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

proc add_var_if_not_exists name {
    var_scope = if ($name in runtime_global_vars.name) "global" else "local";
    if var_scope == "local" { # global vars are pre-created so we don't need to worry about that
        if $name not in runtime_local_vars.name {
            add Var {name: $name, val: 0} to runtime_local_vars;
        }
    }
}

proc exec_lists cmd {

}