import os
import tempfile
import shutil
import post_processing
import renamer

fd, temp_path = tempfile.mkstemp(suffix=".sb3")
os.close(fd)

PROJECT_NAME = "Scratch Emulator.sb3"
renamer.process_renaming(PROJECT_NAME)

ROOT_DIR = ''
PATH_SOURCE_PROJECT = os.path.join(ROOT_DIR, PROJECT_NAME)
PATH_TARGET_PROJECT = temp_path

with post_processing.ScratchProject(PATH_SOURCE_PROJECT, PATH_TARGET_PROJECT) as project:
    project.order_sprites(['blank', 'editor', 'renderer', 'compiler', 'runner', 'save & load'])
    project.remove_field_text()
    project.move_turbowarp_comment()

    # Add the monitors

    def add_list_monitor(name: str):
        monitor_data = {
            "id": name,
            "mode": "list",
            "opcode": "data_listcontents",
            "params": {"LIST": name},
            "spriteName": None,
            "value": [],
            "width": 460,
            "height": 117,
            "x": 10,
            "y": 122,
            "visible": False
        }
        project.project_data['monitors'].append(monitor_data)
        
    add_list_monitor('save_code_output')

    project.project_data['monitors'].append({
        "id": "Editor_Theme_Switcher",
        "mode": "slider",
        "opcode": "data_variable",
        "params": {
            "VARIABLE": "Editor Theme Switcher"
        },
        "spriteName": None,
        "value": 0,
        "width": 0,
        "height": 0,
        "x": 150,
        "y": 70,
        "visible": False,
        "sliderMin": 1,
        "sliderMax": 2,
        "isDiscrete": True
    })

    project.project_data['monitors'].append({
        "id": "Editor_Block_Colors_Switcher",
        "mode": "slider",
        "opcode": "data_variable",
        "params": {
            "VARIABLE": "Editor Block Colors Switcher"
        },
        "spriteName": None,
        "value": 0,
        "width": 0,
        "height": 0,
        "x": 150,
        "y": 117,
        "visible": False,
        "sliderMin": 1,
        "sliderMax": 3,
        "isDiscrete": True
    })

    project.project_data['monitors'].append({
        "id": "Current_Editor_Theme",
        "mode": "default",
        "opcode": "data_variable",
        "params": {
            "VARIABLE": "Current Editor Theme"
        },
        "spriteName": None,
        "value": 0,
        "width": 0,
        "height": 0,
        "x": 150,
        "y": 164,
        "visible": False,
        "sliderMin": 0,
        "sliderMax": 100,
        "isDiscrete": True
    })

    project.project_data['monitors'].append({
        "id": "Current_Editor_Block_Colors",
        "mode": "default",
        "opcode": "data_variable",
        "params": {
            "VARIABLE": "Current Editor Block Colors"
        },
        "spriteName": None,
        "value": 0,
        "width": 0,
        "height": 0,
        "x": 150,
        "y": 191,
        "visible": False,
        "sliderMin": 0,
        "sliderMax": 100,
        "isDiscrete": True
    })

    # project.add_build_comment('Scratch Emulator\nCreated by redspacecat', "blank")

shutil.move(temp_path, PATH_SOURCE_PROJECT)