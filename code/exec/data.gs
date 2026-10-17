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

# list format is:
# name
# length
# ...items
# repeat

%define l_local_len r_local_lists[l_idx + 1]
%define l_global_len r_global_lists[l_idx + 1]
%define l_local_idx(offset) r_local_lists[l_idx + 1 + offset]
%define l_global_idx(offset) r_global_lists[l_idx + 1 + offset]
%define l_handle_idx(index) list_handle_idx index; if idx == "" { stop_this_script; }
%define l_handle_idx_push(index) list_handle_idx index; if idx == "" { push ""; stop_this_script; }

proc exec_lists cmd {
    if $cmd < Opcode.datalist_itemoflist {
        if $cmd < Opcode.datalist_deletealloflist {
            if $cmd < Opcode.datalist_addtolist {
                # get list listcontents
                pop 1;
                list_listcontents args[1];
            } elif $cmd < Opcode.datalist_deleteoflist {
                # add to list
                pop 2;
                list_add args[2], args[1];
            } else {
                # delete x of list
                pop 2;
                list_delete args[2], args[1];
            }
        } else {
            if $cmd < Opcode.datalist_insertatlist {
                # delete all
                pop 1;
                list_delete_all args[1];
            } elif $cmd < Opcode.datalist_replaceitemoflist {
                # insert
                pop 3;
                list_insert args[3], args[1], args[2];
            } else {
                # replace
                pop 3;
                list_replace args[2], args[1], args[3];
            }
        }
    } else {
        if $cmd < Opcode.datalist_lengthoflist {
            if $cmd < Opcode.datalist_itemnumoflist {
                # item of list
                pop 2;
                list_get args[2], args[1];
            } else {
                # item num of list
                pop 2;
                list_itemnum args[2], args[1];
            }
        } else {
            if $cmd < Opcode.datalist_listcontainsitem {
                # length
                pop 1;
                list_length args[1];
            } elif $cmd < Opcode.datalist_showlist {
                # contains
                pop 2;
                list_contains args[1], args[2];
            } elif $cmd < Opcode.datalist_hidelist {
                # show list
            } else {
                # hide list
            }
        }
    }
}

proc list_listcontents name {
    list_idx $name;
    str = "";
    idx = 1;
    if list_scope == "local" {
        repeat l_local_len {
            if idx > 1 {
                str &= " ";
            }
            str &= l_local_idx(idx);
            idx++;
        }
    } else {
        repeat l_global_len {
            if idx > 1 {
                str &= " ";
            }
            str &= l_global_idx(idx);
            idx++;
        }
    }
    push str;
}

proc list_add name, value {
    list_idx $name;
    if list_scope == "local" {
        l_local_len += 1;
        insert $value at l_local_idx(l_local_len);
    } else {
        l_global_len += 1;
        insert $value at l_global_idx(l_global_len);
    }
}

proc list_get name, index {
    list_idx $name;
    l_handle_idx_push($index);
    if list_scope == "local" {
        push l_local_idx(idx);
    } else {
        push l_global_idx(idx);
    }
}

proc list_itemnum name, value {
    list_idx $name;
    idx = 1;
    if list_scope == "local" {
        repeat l_local_len {
            if l_local_idx(idx) == $value {
                push idx;
                stop_this_script;
            }
            idx++;
        }
    } else {
        repeat l_global_len {
            if l_global_idx(idx) == $value {
                push idx;
                stop_this_script;
            }
            idx++;
        }
    }
    push 0;
}

proc list_length name {
    list_idx $name;
    if list_scope == "local" {
        push l_local_len;
    } else {
        push l_global_len;
    }
}

proc list_contains name, value {
    list_idx $name;
    idx = 1;
    if list_scope == "local" {
        repeat l_local_len {
            if l_local_idx(idx) == $value {
                push "true";
                stop_this_script;
            }
            idx++;
        }
    } else {
        repeat l_global_len {
            if l_global_idx(idx) == $value {
                push "true";
                stop_this_script;
            }
            idx++;
        }
    }
    push "false";
}

proc list_delete name, index {
    list_idx $name;
    l_handle_idx($index);
    if list_scope == "local" {
        delete l_local_idx(idx);
        l_local_len--;
    } else {
        delete l_global_idx(idx);
        l_global_len--;
    }
}

proc list_delete_all name {
    list_idx $name;
    if list_scope == "local" {
        repeat l_local_len {
            delete r_local_lists[l_idx + 2];
        }
        l_local_len = 0;
    } else {
        repeat l_global_len {
            delete r_global_lists[l_idx + 2];
        }
        l_global_len = 0;
    }
}

proc list_insert name, value, index {
    list_idx $name;
    l_handle_idx($index);
    if list_scope == "local" {
        insert $value at l_local_idx(idx);
        l_local_len++;
    } else {
        insert $value at l_global_idx(idx);
        l_global_len++;
    }
}

proc list_replace name, index, value {
    list_idx $name;
    l_handle_idx($index);
    if list_scope == "local" {
        l_local_idx(idx) = $value;
    } else {
        l_global_idx(idx) = $value;
    }
}

proc list_handle_idx index {
    if list_scope == "local" {
        if $index == "last" {
            idx = l_local_len;
        } elif $index == "random" {
            idx = random(1, l_local_len);
        } elif $index < 1 or $index > l_local_len {
            idx = "";
        } else {
            idx = $index;
        }
    } else {
        if $index == "last" {
            idx = l_global_len;
        } elif $index == "random" {
            idx = random(1, l_global_len);
        } elif $index < 1 or $index > l_global_len {
            idx = "";
        } else {
            idx = $index;
        }
    }
}

proc list_idx name {
    n = list_identifier & $name;
    list_scope = if (n in r_global_lists) "global" else "local";
    if list_scope == "local" {
        if n not in r_local_lists {
            add n to r_local_lists;
            add 0 to r_local_lists;
        }
        l_idx = n in r_local_lists;
    } else {
        l_idx = n in r_global_lists;
    }
}