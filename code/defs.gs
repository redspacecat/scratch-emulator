struct TextLabel {
    text="",
    x=""
}

struct Input {
    shape="",
    type="",
    dropdown_shape="",
    dropdown_list="",
    x="",
    width="",
    height="",
    text="",
    nested_block="",
}

enum Category {
    Motion=1,
    Looks=5,
    Sound=9,
    Events=13,
    Control=17,
    Sensing=21,
    Operators=25,
    Variables=29,
    Lists=33,
    CustomBlocks=37,
    Extensions=41,
    Preview=45
}

enum Workspace {
    Code=1,
    Costumes=4,
    Sounds=7
}