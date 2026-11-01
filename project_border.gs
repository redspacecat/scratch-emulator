costumes "assets/images/black-bars.svg";
hide;

onflag {
    hide;
}

on "init_runtime" {
    if stage_width > 480 {
        show;
    }
}

on "run" {
    forever {
        goto_front;
    }
}

on "terminate_program" {
    stop_other_scripts;
    hide;
}