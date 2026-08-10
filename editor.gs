costumes "assets/blank.svg" as "backdrop1";

%include code/helpful_utils.gs

onflag {
    delete blocks;
    add_block "stack", Category.Control, -56, -42, 93, 21, label1: TextLabel {x: -51, text: "wait"}, label2: TextLabel {x: -8, text: "seconds"}, input1: Input {shape: "reporter", x: -28, width: 16, height: 12, text: "1"};
    add_block "stack", Category.Control, -56, -63, 93, 21, label1: TextLabel {x: -51, text: "wait"}, label2: TextLabel {x: -8, text: "seconds"}, input1: Input {shape: "reporter", x: -28, width: 16, height: 12, text: "1"};
    add_block "stack", Category.Motion, -56, 0, 189, 21, label1: TextLabel {x: -51, text: "move"}, label2: TextLabel {x: 102, text: "steps"}, input1: Input {shape: "reporter", x: -23, width: 16, height: 12, text: 10};
    add_block "reporter", Category.Operators, -23, 81, 119, 16, label1: TextLabel {x: -17, text: "pick random"}, label2: TextLabel {x: 64, text: "to"}, input1: Input {shape: "reporter", x: 44, width: 16, height: 12, text: "1"}, input2: Input {shape: "reporter", x: 77, width: 16, height: 12, text: "10"};
    add_block "reporter", Category.Motion, 95, -57, 59, 16, label1: TextLabel {x: 100, text: "x position"};

    forever {
        erase_all;
        broadcast "render_blocks";
    }
}

onkey "space" {
    put_block_in_block childID: 4, parentID: 3, inputNumber: 1;
}

onkey "enter" {
    put_block_in_block childID: 5, parentID: 1, inputNumber: 1;
}

proc add_block shape, category, x, y, width, height, parent="", next="", TextLabel label1=TextLabel {}, TextLabel label2=TextLabel {}, TextLabel label3=TextLabel {}, Input input1=Input {}, Input input2=Input {}, Input input3=Input {} {
    add $shape to blocks;
    add $category to blocks;
    add $x to blocks;
    add $y to blocks;
    add $width to blocks;
    add $height to blocks;
    add $parent to blocks;
    add $next to blocks;

    add $label1.text to blocks; add $label1.x to blocks;
    add $label2.text to blocks; add $label2.x to blocks;
    add $label3.text to blocks; add $label3.x to blocks;

    add $input1.shape to blocks;
    add $input1.x to blocks;
    add $input1.width to blocks;
    add $input1.height to blocks;
    add $input1.text to blocks;
    add $input1.nested_block to blocks;

    add $input2.shape to blocks;
    add $input2.x to blocks;
    add $input2.width to blocks;
    add $input2.height to blocks;
    add $input2.text to blocks;
    add $input2.nested_block to blocks;

    add $input3.shape to blocks;
    add $input3.x to blocks;
    add $input3.width to blocks;
    add $input3.height to blocks;
    add $input3.text to blocks;
    add $input3.nested_block to blocks;
}

proc put_block_in_block childID, parentID, inputNumber {
    local parentIdx = ($parentID - 1) * BLOCK_LENGTH + 1;
    local childIdx = ($childID - 1) * BLOCK_LENGTH + 1;
    local i = parentIdx;
    local x_change = blocks[parentIdx + b_inputs + (($inputNumber - 1) * 6) + b_input_x] - bl_x(childIdx);
    local y_change = (((b_y + (b_y - b_height)) / 2) + (bl_height(childIdx) / 2)) - bl_y(childIdx) + 0.5;
    blocks[i + b_inputs + (($inputNumber - 1) * 6) + b_input_nested_block] = $childID;
    move_block_position childIdx, x_change, y_change;
}

func calc_block_width(blockID) {
    
}

proc move_block_position blockIdx, x_change, y_change {
    bl_x($blockIdx) += $x_change;
    bl_y($blockIdx) += $y_change;
    local i = $blockIdx;
    local counter = 0;
    repeat 3 {
        local offset = i + b_labels + counter;
        if (blocks[offset + 1] > "") { # checking + 1 to check x instead of text, which could be blank
            blocks[offset + 1] += $x_change;
        }
        counter += 2; # 2 = number of properties in TextLabel
    }

    local counter = 0;
    repeat 3 {
        local offset = i + b_inputs + counter;
        if (blocks[offset] > "") { # checks if inputs[shape] > "", if so valid input
            blocks[offset + b_input_x] += $x_change;
        }
        counter += 6; # 6 = number of properties in Input
    }

}