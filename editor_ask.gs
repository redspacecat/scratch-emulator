costumes "assets/images/blank.svg";
hide;

on "editor_ask_prompt" {
    ask_answer = "";
    ask "editor"."ask_prompt";
    ask_stopped = false;
    ask_answer = answer();
}

on "stop_ask" {
    stop_other_scripts;
    ask_stopped = true;
    ask_answer = "";
}