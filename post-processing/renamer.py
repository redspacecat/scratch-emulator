# quick little script for renaming variables and stuff

import json
import zipfile
import os
import tempfile
import shutil
from pathlib import Path

class ScratchProjectEditor:
    def __init__(self, source_path: str, destination_path: str):
        self.source_path = source_path
        self.destination_path = destination_path
        self.project_archive = zipfile.ZipFile(self.source_path, 'r')
        self.project_data: dict = json.loads(self.project_archive.read('project.json'))

    def __enter__(self):
        return self

    def _format_identifier(self, name: str, is_var_or_list: bool = False) -> str:
        if not isinstance(name, str):
            return name
        if is_var_or_list:
            name = name.replace(":", " - ").replace(".", " - ")
        return name.replace("_", " ")

    def process_project(self):
        if "targets" not in self.project_data:
            return

        for target in self.project_data["targets"]:
            # sprite names
            if "name" in target:
                target["name"] = self._format_identifier(target["name"])

            # broadcasts
            if "broadcasts" in target and isinstance(target["broadcasts"], dict):
                target["broadcasts"] = {
                    b_id: self._format_identifier(b_name)
                    for b_id, b_name in target["broadcasts"].items()
                }

            # variables
            if "variables" in target and isinstance(target["variables"], dict):
                for v_id, v_val in target["variables"].items():
                    if isinstance(v_val, list) and len(v_val) > 0:
                        v_val[0] = self._format_identifier(v_val[0], is_var_or_list=True)

            # lists
            if "lists" in target and isinstance(target["lists"], dict):
                for l_id, l_val in target["lists"].items():
                    if isinstance(l_val, list) and len(l_val) > 0:
                        l_val[0] = self._format_identifier(l_val[0], is_var_or_list=True)

            # references and custom blocks
            if "blocks" in target and isinstance(target["blocks"], dict):
                for block in target["blocks"].values():
                    if not isinstance(block, dict):
                        continue

                    # fields
                    if "fields" in block and isinstance(block["fields"], dict):
                        for field_key, field_val in block["fields"].items():
                            if isinstance(field_val, list) and len(field_val) > 0 and isinstance(field_val[0], str):
                                if field_key in ("VARIABLE", "LIST"):
                                    field_val[0] = self._format_identifier(field_val[0], is_var_or_list=True)
                                elif field_key == "BROADCAST_OPTION":
                                    field_val[0] = self._format_identifier(field_val[0])
                                elif field_key == "VALUE" and block.get("opcode") in ("argument_reporter_string_number", "argument_reporter_boolean"):
                                    field_val[0] = self._format_identifier(field_val[0], is_var_or_list=True)
                                elif field_key == "PROPERTY" and block.get("opcode") == "sensing_of":
                                    field_val[0] = self._format_identifier(field_val[0], is_var_or_list=True)
                                elif field_key == "OBJECT" and block.get("opcode") == "sensing_of_object_menu":
                                    if field_val[0] != "_stage_":
                                        field_val[0] = self._format_identifier(field_val[0])

                    # inputs
                    if "inputs" in block and isinstance(block["inputs"], dict):
                        for input_val in block["inputs"].values():
                            if isinstance(input_val, list):
                                for sub_item in input_val:
                                    if isinstance(sub_item, list) and len(sub_item) >= 2:
                                        if sub_item[0] in (12, 13) and isinstance(sub_item[1], str):
                                            sub_item[1] = self._format_identifier(sub_item[1], is_var_or_list=True)

                    # custom blocks
                    if "mutation" in block and isinstance(block["mutation"], dict):
                        mutation = block["mutation"]
                        
                        if "proccode" in mutation and isinstance(mutation["proccode"], str):
                            mutation["proccode"] = self._format_identifier(mutation["proccode"])
                        
                        if "argumentnames" in mutation and isinstance(mutation["argumentnames"], str):
                            try:
                                arg_names = json.loads(mutation["argumentnames"])
                                if isinstance(arg_names, list):
                                    arg_names = [self._format_identifier(name, is_var_or_list=True) for name in arg_names]
                                    mutation["argumentnames"] = json.dumps(arg_names)
                            except json.JSONDecodeError:
                                pass

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            self.process_project()

            fd, temp_path = tempfile.mkstemp(suffix=".sb3")
            os.close(fd)

            try:
                with zipfile.ZipFile(temp_path, 'w', compression=zipfile.ZIP_DEFLATED) as new_archive:
                    for item in self.project_archive.infolist():
                        if item.filename == 'project.json':
                            json_bytes = json.dumps(self.project_data, indent=2).encode('utf-8')
                            new_archive.writestr('project.json', json_bytes)
                        else:
                            buffer = self.project_archive.read(item.filename)
                            new_archive.writestr(item, buffer)
                
                self.project_archive.close()
                
                # replace the destination file
                shutil.move(temp_path, self.destination_path)
            
            except Exception as e:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                raise e
        else:
            self.project_archive.close()


if __name__ == "__main__":
    input_sb3 = "Scratch Emulator.sb3"
    output_sb3 = "Scratch Emulator.sb3"

    print("Post-processing project...")

    with ScratchProjectEditor(input_sb3, output_sb3) as editor:
        pass

    print("Done!")