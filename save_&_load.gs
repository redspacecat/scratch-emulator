costumes "assets/images/blank.svg";

%include code/helpful_utils

hide;

var delimiter = "‖";
var start_char = "§";
var new_project_data = "§my variable,‖‖message1,‖Sprite1‖1‖;‖‖‖‖§";

onflag {
    hide save_code_output;
}

on "save" {
    broadcast_and_wait "save_current_sprite";
    save;
    delete save_code_output;
    add "Here is the save code for your project. Triple click three times fast and copy." to save_code_output;
    add "Store this code in a safe place. When done, click outside this list to continue." to save_code_output;
    add save_code to save_code_output;
    show save_code_output;
    wait_until(mouse_down());
    hide save_code_output;
}

on "load" {
    ask "Loading a project will OVERWRITE the current project. Enter a save code to continue. (enter nothing to cancel)";
    if answer() > "" and start_char in answer() {
        broadcast_and_wait "stop_workspace";
        load answer();
        broadcast "load_finished";
    }
}

on "load_demo_project" {
    broadcast_and_wait "stop_workspace";
    broadcast_and_wait "do_load_demo_project";
    broadcast "load_finished";
}

on "do_load_demo_project" {
    load demo_projects["editor"."clicked_demo_project"];
}

on "init_new_project" {
    load new_project_data;
}

on "new_project" {
    broadcast_and_wait "stop_workspace";
    load new_project_data;
    broadcast "load_finished";
}

proc save {
    save_code = "[code]" & start_char;

    i = 1;
    repeat length global_vars {
        save_code &= escape(global_vars[i], ",") & ",";
        i++;
    }
    save_code &= delimiter;

    i = 1;
    repeat length global_lists {
        save_code &= escape(global_lists[i], ",") & ",";
        i++;
    }
    save_code &= delimiter;

    i = 1;
    repeat length broadcasts {
        save_code &= escape(broadcasts[i], ",") & ",";
        i++;
    }
    save_code &= delimiter;

    spriteNum = 1;
    repeat length sprites {
        append sprites[spriteNum].name;
        append sprites[spriteNum].costume;
        append sprites[spriteNum].blocks;
        append sprites[spriteNum].vars;
        append sprites[spriteNum].lists;
        append sprites[spriteNum].custom_blocks;
        spriteNum++;
    }

    save_code &= start_char & "[/code]";
}

proc append str {
    i = 1;
    repeat length $str {
        if $str[i] == delimiter {
            save_code &= "\\" & delimiter;
        } else {
            save_code &= $str[i];
        }
        i++;
    }
    save_code &= delimiter;
}

func escape(text, char) {
    local i = 1;
    local output = "";
    repeat length $text {
        if $text[i] == $char {
            output &= "\\";
        }
        output &= $text[i];
        i++;
    }
    return output;
}

proc parse_token delimiter, string {
    token = "";
    until ($string[j] == $delimiter and $string[j - 1] != "\\") or j > length $string {
        if not ($string[j] == "\\" and $string[j+1] == $delimiter) { # don't include escape character
            token &= $string[j];
        }
        j++;
    }
    j++;
}

proc load str {
    delete global_vars;
    delete global_lists;
    delete broadcasts;
    delete sprites;

    j = 1;
    until $str[j] == start_char {
        j++;
    }
    j++;

    # global variables
    until $str[j] == delimiter {
        parse_token ",", $str;
        add token to global_vars;
    }
    j++;

    # global lists
    until $str[j] == delimiter {
        parse_token ",", $str;
        add token to global_lists;
    }
    j++;

    # broadcasts
    until $str[j] == delimiter {
        parse_token ",", $str;
        add token to broadcasts;
    }
    j++;

    until $str[j] == start_char {
        local Sprite new_sprite = Sprite {};
        parse_token delimiter, $str;
        new_sprite.name = token;
        parse_token delimiter, $str;
        new_sprite.costume = token;
        parse_token delimiter, $str;
        new_sprite.blocks = token;
        parse_token delimiter, $str;
        new_sprite.vars = token;
        parse_token delimiter, $str;
        new_sprite.lists = token;
        parse_token delimiter, $str;
        new_sprite.custom_blocks = token;
        add new_sprite to sprites;
    }

    SCROLL_X = 0;
    SCROLL_Y = 0;
}