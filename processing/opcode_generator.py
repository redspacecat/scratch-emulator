with open("code/opcodes.gs", "wt") as f:
    f.write("enum Opcode {\n")
    counter = 1
    with open("assets/data/opcodes.txt", "rt") as f2:
        txt = ""
        for l in f2:
            txt += f"    {l.strip()}={counter},\n"
            counter += 1
        f.write(txt[:-2])
    f.write("\n}")