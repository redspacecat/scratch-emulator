LABEL_COUNT = 3
INPUT_COUNT = 3

with open("code/block_data.gs", "wt") as f:
    txt = ""
    counter = 0
    with open("assets/data/block-data.txt", "rt") as f2:
        for l in f2:
            txt += f"%define b_{l.strip()}(i) blocks[i{"" if counter == 0 else "+" + str(counter)}]\n"
            counter += 1

    txt += "\n"
    labels = counter
    with open("assets/data/label-vals.txt", "rt") as f2:
        label_vals = f2.readlines()
        for i in range(1, LABEL_COUNT + 1):
            for l in label_vals:
                txt += f"%define b_label{i}_{l.strip()}(i) blocks[i{"" if counter == 0 else "+" + str(counter)}]\n"
                counter += 1
            
    txt += "\n"
    inputs = counter
    with open("assets/data/inputs-vals.txt", "rt") as f2:
        input_vals = f2.readlines()
        for i in range(1, INPUT_COUNT + 1):
            for l in input_vals:
                txt += f"%define b_input{i}_{l.strip()}(i) blocks[i{"" if counter == 0 else "+" + str(counter)}]\n"
                counter += 1

    txt += "\n"

    counter = 0
    with open("assets/data/block-data.txt", "rt") as f2:
        for l in f2:
            txt += f"%define b_idx_{l.strip()} {counter}\n"
            counter += 1

    txt += "\n"
    labels = counter
    with open("assets/data/label-vals.txt", "rt") as f2:
        label_vals = f2.readlines()
        for i in range(1, LABEL_COUNT + 1):
            for l in label_vals:
                txt += f"%define b_idx_label{i}_{l.strip()} {counter}\n"
                counter += 1
            
    txt += "\n"
    inputs = counter
    with open("assets/data/inputs-vals.txt", "rt") as f2:
        input_vals = f2.readlines()
        for i in range(1, INPUT_COUNT + 1):
            for l in input_vals:
                txt += f"%define b_idx_input{i}_{l.strip()} {counter}\n"
                counter += 1

    txt += "\n"
    txt += f"%define b_labels {labels}\n"
    txt += f"%define b_inputs {inputs}\n"
    txt += "\n"

    counter = 0
    for l in label_vals:
        txt += f"%define b_label_{l.strip()} {counter}\n"
        counter += 1
    txt += "\n"
    counter = 0
    for l in input_vals:
        txt += f"%define b_input_{l.strip()} {counter}\n"
        counter += 1
    f.write(txt[:-1])