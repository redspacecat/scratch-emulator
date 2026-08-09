costumes "assets/blank.svg" as "backdrop1";

%include code/helpful_utils.gs

onflag {
    delete blocks;
    add_block "stack", Category.Control, -56, -42, 93, 21, label1: TextLabel {x: -51, text: "wait"}, label2: TextLabel {x: -8, text: "seconds"}, input1: Input {shape: "reporter", x: -28, width: 16, height: 12, text: "1"};
    add_block "stack", Category.Control, -56, -63, 93, 21, label1: TextLabel {x: -51, text: "wait"}, label2: TextLabel {x: -8, text: "seconds"}, input1: Input {shape: "reporter", x: -28, width: 16, height: 12, text: "1"};
    add_block "stack", Category.Motion, -56, 0, 189, 21, label1: TextLabel {x: -51, text: "move"}, label2: TextLabel {x: 102, text: "steps"}, input1: Input {shape: "reporter", x: -23, width: 16, height: 12, text: 10, nested_block: 3};
    add_block "reporter", Category.Operators, -23, -2, 119, 16, label1: TextLabel {x: -17, text: "pick random"}, label2: TextLabel {x: 64, text: "to"}, input1: Input {shape: "reporter", x: 44, width: 16, height: 12, text: "1"}, input2: Input {shape: "reporter", x: 77, width: 16, height: 12, text: "10"};

    forever {
        broadcast "render_blocks";
    }
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