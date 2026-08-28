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
    project.order_sprites(['blank', 'editor', 'renderer', 'compiler', 'runner'])
    project.remove_field_text()
    project.move_turbowarp_comment()

    # Add the monitors

    # def add_list_monitor(name: str):
    #     monitor_data = {
    #         "id": name,
    #         "mode": "list",
    #         "opcode": "data_listcontents",
    #         "params": {"LIST": name},
    #         "spriteName": None,
    #         "value": [],
    #         "width": 400,
    #         "height": 230,
    #         "x": 40,
    #         "y": 60,
    #         "visible": False
    #     }
    #     project.project_data['monitors'].append(monitor_data)

    # add_list_monitor('copy_this')
    # add_list_monitor('output')


    # project.add_build_comment('Scratch Emulator\nCreated by redspacecat', "blank")

shutil.move(temp_path, PATH_SOURCE_PROJECT)