proc exec_pen cmd {
    if $cmd < Opcode.pen_changePenColorParamBy {
        if $cmd < Opcode.pen_penDown {
            if $cmd < Opcode.pen_stamp {
                erase_all;
            } else {
                stamp;
            }
        } else {
            if $cmd < Opcode.pen_penUp {
                pen_down;
                var_pen_down = true;
            } elif $cmd < Opcode.pen_setPenColorToColor {
                pen_up;
                var_pen_down = false;
            } else {
                pop 1;
                set_pen_color args[1];
            }
        }
    } else {
        if $cmd < Opcode.pen_changePenSizeBy {
            if $cmd < Opcode.pen_setPenColorParamTo {
                pop 2;
                if args[1] == "color" {
                    change_pen_hue args[2];
                } elif args[1] == "saturation" {
                    change_pen_saturation args[2];
                } elif args[1] == "brightness" {
                    change_pen_brightness args[2];
                } elif args[1] == "transparency" {
                    change_pen_transparency args[2];
                }
            } else {
                pop 2;
                if args[1] == "color" {
                    set_pen_hue args[2];
                } elif args[1] == "saturation" {
                    set_pen_saturation args[2];
                } elif args[1] == "brightness" {
                    set_pen_brightness args[2];
                } elif args[1] == "transparency" {
                    set_pen_transparency args[2];
                }
            }
        } else {
            if $cmd < Opcode.pen_setPenSizeTo {
                pop 1;
                change_pen_size args[1];
                var_pen_size += args[1];
            } else {
                if $cmd < Opcode.pen_isPenDown {
                    pop 1;
                    set_pen_size args[1];
                    var_pen_size = args[1];
                } elif $cmd < Opcode.pen_penSize {
                    push var_pen_down == true;
                } elif $cmd < Opcode.pen_printText {
                    push var_pen_size;
                } elif $cmd < Opcode.pen_textWidth {
                    # print text
                    pop 3;
                    safe_plain_text round(args[2]), round(args[3]), 1, args[1];
                } else {
                    # text width
                    pop 1;
                    push safe_width_of_text(args[1], 1);
                }
            }
        }
    }
}