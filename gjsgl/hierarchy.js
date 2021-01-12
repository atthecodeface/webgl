class Hierarchy {
    constructor() {
        this.data = [];
        this.depth = 0;
    }
    push() {
        this.depth += 1;
    }
    pop() {
        this.depth -= 1;
    }
    add(d){
        this.data.push( [this.depth, d] );
    }
    iter_items = function*() {
        for (var x of this.data) {
            yield x;
        }
    }
    str() {
        var r = ""
        for (var d of this.iter_items()) {
            r += (" ".repeat(d[0]*2)) + d[1]+"\n";
        }
        return r;
    }
}
