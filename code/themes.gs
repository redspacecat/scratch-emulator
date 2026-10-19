%define ui_c(color) ui_colors[UIColors.color]

enum UIColors {
    Main=1,
    MainTransparent=2,
    PaletteScrollbar=3,
    DropdownScrollbar=4,
    BlockText=5,
    Background=6,
    Dot=7,
    MainText=8,
    AltText=9,
    ButtonBorder=10,
    ButtonColor=11,
    ButtonColorHovered=12,
    CostumeLight=13,
    CostumeDark=14,
    NewSpriteButton=15,
    NavButtonHovered=16,
    NavButtonSelected=17,
    InputHighlight=18,
    InputBackground=19,
    InputText=20,
    SpriteBackground=21,
    DropdownCheckMark=22,
    CodeButtonBorder=23,
    CodeButtonFill=24,
    CodeButtonText=25,
}

# main, secondary, dropdown, dropdown selected
list colors_light_normal = [
    "#4c97ff", "#3373cc", "#4280d7", "#3373cc",
    "#9966ff", "#774dcb", "#855cd6", "#774dcb",
    "#cf63cf", "#bd42bd", "#c94fc9", "#bd42bd",
    "#ffbf00", "#cc9900", "#e6ac00", "#cc9900",
    "#ffab19", "#cf8b17", "#ec9c13", "#cf8b17",
    "#5cb1d6", "#2e8eb8", "#3c9ec7", "#2e8eb8",
    "#59c059", "#389438", "#389438", "#389438",
    "#ff8c1a", "#db6e00", "#db6e00", "#db6e00",
    "#ff661a", "#e64d00", "#e64d00", "#e64d00",
    "#ff6680", "#ff3355", "#ff3355", "#ff3355",
    "#0fbd8c", "#0b8e69", "#0da57a", "#0b8e69",
    "#d6d6d6", "#d6d6d6", "#d6d6d6", "#d6d6d6",
];

list colors_light_high_contrast = [
    "#80b5ff", "#3373cc", "#b3d2ff", "#cce1ff",
    "#ccb3ff", "#774dcb", "#ddccff", "#eee5ff",
    "#e19de1", "#bd42bd", "#ffb3ff", "#ffccff",
    "#ffd966", "#cc9900", "#ffecb3", "#fff2cc",
    "#ffbe4c", "#cf8b17", "#ffda99", "#ffe3b3",
    "#85c4e0", "#2e8eb8", "#aed8ea", "#c2e2f0",
    "#7ece7e", "#389438", "#daf1da", "#daf1da",
    "#ffa54c", "#db6e00", "#ffe5cc", "#ffe5cc",
    "#ff9966", "#e64d00", "#ffddcc", "#ffddcc",
    "#ff6680", "#ff3355", "#ff3355", "#ff3355",
    "#13ecaf", "#0b8e69", "#78f0ce", "#a3f0da",
    "#d6d6d6", "#d6d6d6", "#d6d6d6", "#d6d6d6",
];

list colors_dark_normal = [
    "#4c97ff", "#3373cc", "#4280d7", "#3373cc",
    "#9966ff", "#774dcb", "#855cd6", "#774dcb",
    "#cf63cf", "#bd42bd", "#c94fc9", "#bd42bd",
    "#ffbf00", "#cc9900", "#e6ac00", "#cc9900",
    "#ffab19", "#cf8b17", "#ec9c13", "#cf8b17",
    "#5cb1d6", "#2e8eb8", "#3c9ec7", "#2e8eb8",
    "#59c059", "#389438", "#389438", "#389438",
    "#ff8c1a", "#db6e00", "#db6e00", "#db6e00",
    "#ff661a", "#e64d00", "#e64d00", "#e64d00",
    "#ff6680", "#ff3355", "#ff3355", "#ff3355",
    "#0fbd8c", "#0b8e69", "#0da57a", "#0b8e69",
    "#404040", "#404040", "#404040", "#404040",
];

list colors_dark_high_contrast = [
    "#80b5ff", "#3373cc", "#b3d2ff", "#cce1ff",
    "#ccb3ff", "#774dcb", "#ddccff", "#eee5ff",
    "#e19de1", "#bd42bd", "#ffb3ff", "#ffccff",
    "#ffd966", "#cc9900", "#ffecb3", "#fff2cc",
    "#ffbe4c", "#cf8b17", "#ffda99", "#ffe3b3",
    "#85c4e0", "#2e8eb8", "#aed8ea", "#c2e2f0",
    "#7ece7e", "#389438", "#daf1da", "#daf1da",
    "#ffa54c", "#db6e00", "#ffe5cc", "#ffe5cc",
    "#ff9966", "#e64d00", "#ffddcc", "#ffddcc",
    "#ff6680", "#ff3355", "#ff3355", "#ff3355",
    "#13ecaf", "#0b8e69", "#78f0ce", "#a3f0da",
    "#404040", "#404040", "#404040", "#404040",
];

list colors_dark_dark = [
    "#0f1e33", "#4c97ff", "#4c4c4c", "#254e89",
    "#1e1433", "#9966ff", "#4c4c4c", "#4e3384",
    "#291329", "#cf63cf", "#4c4c4c", "#602e60",
    "#332600", "#ffbf00", "#4c4c4c", "#664d03",
    "#332600", "#ffab19", "#4c4c4c", "#5c3e09",
    "#12232a", "#5cb1d6", "#4c4c4c", "#294f5f",
    "#112611", "#59c059", "#4c4c4c", "#255725",
    "#331c05", "#ff8c1a", "#4c4c4c", "#723f0b",
    "#331405", "#ff661a", "#4c4c4c", "#6d3315",
    "#331419", "#ff6680", "#4c4c4c", "#60252f",
    "#03251c", "#0fbd8c", "#4c4c4c", "#085b44",
    "#404040", "#404040", "#4c4c4c", "#404040",
];

list ui_colors_light_normal = [
    "#edf8fb", # main
    "#e5f4f8", # main transparent
    "#bebebe", # palette scrollbar
    "#bebebe", # dropdown scrollbar
    "#ffffff", # block text
    "#ffffff", # background color
    "#dddddd", # dot color
    "#000000", # main ui text color
    "#ffffff", # alternate ui text color
    "#606060", # button border
    "#ffffff", # button color
    "#ececec", # button color hovered
    "#c6bdef", # costume light border
    "#855cd6", # costume dark border
    "#cbd7db", # new sprite button
    "#dee9ec", # nav button hovered
    "#cbd7db", # nav button selected
    "#ffffff", # input highlight border
    "#ffffff", # input background
    "#000000", # input text
    "#c6cdd6", # sprite box background
    "#000000", # dropdown check mark
    "#d9d9d9", # code button border
    "#ffffff", # code button fill
    "#0c1628", # code button text
];

list ui_colors_light_high_contrast = [
    "#edf8fb", # main
    "#e5f4f8", # main transparent
    "#bebebe", # palette scrollbar
    "#636363", # dropdown scrollbar
    "#000000", # block text
    "#ffffff", # background color
    "#dddddd", # dot color
    "#000000", # main ui text color
    "#ffffff", # alternate ui text color
    "#606060", # button border
    "#ffffff", # button color
    "#ececec", # button color hovered
    "#c6bdef", # costume light border
    "#855cd6", # costume dark border
    "#cbd7db", # new sprite button
    "#dee9ec", # nav button hovered
    "#cbd7db", # nav button selected
    "#ffffff", # input highlight border
    "#ffffff", # input background
    "#000000", # input text
    "#c6cdd6", # sprite box background
    "#000000", # dropdown check mark
    "#d9d9d9", # code button border
    "#ffffff", # code button fill
    "#0c1628", # code button text
];

list ui_colors_dark_normal = [
    "#171717", # main
    "#141414", # main transparent
    "#666666", # palette scrollbar
    "#666666", # dropdown scrollbar
    "#ffffff", # block text
    "#202020", # background color
    "#484848", # dot color
    "#ffffff", # main ui text color
    "#ffffff", # alternate ui text color
    "#606060", # button border
    "#272727", # button color
    "#353535", # button color hovered
    "#42345f", # costume light border
    "#855cd6", # costume dark border
    "#272727", # new sprite button
    "#242424", # nav button hovered
    "#3d3d3d", # nav button selected
    "#ffffff", # input highlight border
    "#ffffff", # input background
    "#000000", # input text
    "#404040", # sprite box background
    "#000000", # dropdown check mark
    "#3b3b3b", # code button border
    "#000000", # code button fill
    "#7e7967", # code button text
];

list ui_colors_dark_high_contrast = [
    "#171717", # main
    "#141414", # main transparent
    "#666666", # palette scrollbar
    "#666666", # dropdown scrollbar
    "#000000", # block text
    "#202020", # background color
    "#484848", # dot color
    "#ffffff", # main ui text color
    "#ffffff", # alternate ui text color
    "#606060", # button border
    "#272727", # button color
    "#353535", # button color hovered
    "#42345f", # costume light border
    "#855cd6", # costume dark border
    "#272727", # new sprite button
    "#242424", # nav button hovered
    "#3d3d3d", # nav button selected
    "#ffffff", # input highlight border
    "#ffffff", # input background
    "#000000", # input text
    "#404040", # sprite box background
    "#000000", # dropdown check mark
    "#3b3b3b", # code button border
    "#000000", # code button fill
    "#7e7967", # code button text
];

list ui_colors_dark_dark = [
    "#171717", # main
    "#141414", # main transparent
    "#666666", # palette scrollbar
    "#666666", # dropdown scrollbar
    "#b7bcc2", # block text
    "#202020", # background color
    "#484848", # dot color
    "#ffffff", # main ui text color
    "#ffffff", # alternate ui text color
    "#606060", # button border
    "#272727", # button color
    "#353535", # button color hovered
    "#42345f", # costume light border
    "#855cd6", # costume dark border
    "#272727", # new sprite button
    "#242424", # nav button hovered
    "#3d3d3d", # nav button selected
    "#ffffff", # input highlight border
    "#4c4c4c", # input background
    "#e5e5e5", # input text
    "#404040", # sprite box background
    "#ffffff", # dropdown check mark
    "#3b3b3b", # code button border
    "#000000", # code button fill
    "#7e7967", # code button text
];

proc load_theme editor_theme, block_colors {
    # editor theme: light, dark
    # block colors: normal, high contrast, dark (in dark theme)
    current_editor_theme = $editor_theme;
    current_editor_colors = $block_colors;

    if $editor_theme == "light" {
        if $block_colors == "normal" {
            COPY(colors_light_normal, colors);
            COPY(ui_colors_light_normal, ui_colors);
        }
        if $block_colors == "high contrast" {
            COPY(colors_light_high_contrast, colors);
            COPY(ui_colors_light_high_contrast, ui_colors);
        }
    } else {
        if $block_colors == "normal" {
            COPY(colors_dark_normal, colors);
            COPY(ui_colors_dark_normal, ui_colors);
        }
        if $block_colors == "high contrast" {
            COPY(colors_dark_high_contrast, colors);
            COPY(ui_colors_dark_high_contrast, ui_colors);
        }
        if $block_colors == "dark" {
            COPY(colors_dark_dark, colors);
            COPY(ui_colors_dark_dark, ui_colors);
        }
    }

    redraw; # update the project with the new theme
}