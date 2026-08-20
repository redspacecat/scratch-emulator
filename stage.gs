costumes "assets/images/blank.svg" as "backdrop1";

list blocks;
list roots; # holds block ids of script roots

struct InputRank {
    dist="",
    block="",
    input="" # input id in block
}

var InputRank highlighted_input;


# keeps a list of ids of dragged blocks so they can be avoided
# for placement into and so they can be layered on top
list dragged_blocks;