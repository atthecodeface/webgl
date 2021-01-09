#a Imports
from typing import *

#a Hierarchy debug
class Hierarchy:
    depth: int
    data : List[Tuple[int,Any]]
    def __init__(self):
        self.data = []
        self.depth = 0
        pass
    def push(self):
        self.depth += 1
        pass
    def pop(self):
        self.depth -= 1
        pass
    def add(self, d:Any):
        self.data.append( (self.depth, d) )
        pass
    def iter_items(self):
        for (depth,data) in self.data:
            yield (depth,data)
            pass
        pass
    def __str__(self):
        r = ""
        for (depth,data) in self.iter_items():
            r += " "*(depth*2) + str(data)+"\n"
            pass
        return r
