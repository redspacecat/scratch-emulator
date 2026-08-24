with open("code/opcodes.gs", "wt") as f:
    f.write("enum Opcode {\n")
    counter = 1
    with open("assets/data/opcodes.txt", "rt") as f2:
        for l in f2:
            f.write(f"    {l.strip()}={counter},\n")
            counter += 1
    f.write("\n}")