#a Imports
from typing import *

#a Hierarchy debug
class Hierarchy:
    depth: int
    data : List[Tuple[int,Any]]
    def __init__(self) -> None:
        self.data = []
        self.depth = 0
        pass
    def push(self) -> None:
        self.depth += 1
        pass
    def pop(self) -> None:
        self.depth -= 1
        pass
    def add(self, d:Any) -> None:
        self.data.append( (self.depth, d) )
        pass
    def iter_items(self) -> Iterable[Tuple[int,Any]]:
        for (depth,data) in self.data:
            yield (depth,data)
            pass
        pass
    def __str__(self) -> str:
        r = ""
        for (depth,data) in self.iter_items():
            r += " "*(depth*2) + str(data)+"\n"
            pass
        return r
    pass
