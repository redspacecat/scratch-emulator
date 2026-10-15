# quick little script for renaming variables and stuff

import json
import zipfile
import os
import tempfile
import shutil
import re
from pathlib import Path

class ScratchProjectEditor:
    def __init__(self, source_path: str, destination_path: str):
        self.source_path = source_path
        self.destination_path = destination_path
        self.project_archive = zipfile.ZipFile(self.source_path, 'r')
        self.project_data: dict = json.loads(self.project_archive.read('project.json'))

    def __enter__(self):
        return self

    def _format_identifier(self, name: str, is_var_or_list: bool = False, preserve_colon: bool = False) -> str:
        if (not isinstance(name, str)) or (name == "is TurboWarp?"):
            return name
        
        def _decamelize(match):
            char1 = match.group(1)
            char2 = match.group(2)
            if match.end(2) < len(name):
                if name[match.end(2)].islower():
                    return char1 + " " + char2.lower()
                else:
                    return char1 + " " + char2
            else:
                return char1 + " " + char2.lower()

        name = re.sub(r'([a-z])([A-Z])', _decamelize, name)
        
        if is_var_or_list:
            if re.match(r'^@\d+$', name):
                return f"return val {name[1:]}"
            if not preserve_colon:
                name = name.replace(":", " - ")
            name = name.replace(".", " - ")
        return name.replace("_", " ")

    def process_project(self):
        if "targets" not in self.project_data:
            return

        # build a map of custom block proccodes
        proccode_map = {}
        for target in self.project_data["targets"]:
            if "blocks" in target and isinstance(target["blocks"], dict):
                for block in target["blocks"].values():
                    if not isinstance(block, dict):
                        continue
                    if "mutation" in block and isinstance(block["mutation"], dict):
                        mutation = block["mutation"]
                        if "proccode" in mutation and "argumentnames" in mutation:
                            original_proccode = mutation["proccode"]
                            
                            arg_names = []
                            if isinstance(mutation["argumentnames"], str):
                                try:
                                    parsed_args = json.loads(mutation["argumentnames"])
                                    if isinstance(parsed_args, list):
                                        arg_names = [self._format_identifier(name, is_var_or_list=True) for name in parsed_args]
                                except json.JSONDecodeError:
                                    pass

                            proccode = self._format_identifier(original_proccode, is_var_or_list=True, preserve_colon=True)
                            
                            inserted_bar = False
                            if len(arg_names) > 0:
                                first_arg = arg_names[0]
                                first_pct = proccode.find('%')
                                if first_pct == -1:
                                    first_pct = len(proccode)
                                
                                idx = proccode.rfind(first_arg, 0, first_pct)
                                if idx != -1:
                                    prefix = proccode[:idx].rstrip()
                                    suffix = proccode[idx:]
                                    if prefix:
                                        proccode = prefix + " | " + suffix
                                    else:
                                        proccode = "| " + suffix
                                    inserted_bar = True
                            
                            if not inserted_bar:
                                proccode = re.sub(r'\s*(%[snb])', r' | \1', proccode, count=1)
                                
                            proccode_map[original_proccode] = proccode

        # apply formatting rules to everything else
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
                                        elif sub_item[0] == 11 and len(sub_item) >= 3 and isinstance(sub_item[1], str):
                                            sub_item[1] = self._format_identifier(sub_item[1])

                    # custom blocks
                    if "mutation" in block and isinstance(block["mutation"], dict):
                        mutation = block["mutation"]
                        
                        if "proccode" in mutation and isinstance(mutation["proccode"], str):
                            original_proccode = mutation["proccode"]
                            if original_proccode in proccode_map:
                                mutation["proccode"] = proccode_map[original_proccode]
                            else:
                                mutation["proccode"] = self._format_identifier(original_proccode, is_var_or_list=True, preserve_colon=True)
                        
                        if "argumentnames" in mutation and isinstance(mutation["argumentnames"], str):
                            try:
                                parsed_args = json.loads(mutation["argumentnames"])
                                if isinstance(parsed_args, list):
                                    arg_names = [self._format_identifier(name, is_var_or_list=True) for name in parsed_args]
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


def process_renaming(file_name):
    input_sb3 = file_name
    output_sb3 = file_name

    print("Post-processing project...")

    with ScratchProjectEditor(input_sb3, output_sb3) as editor:
        pass

    print("Done renaming...")