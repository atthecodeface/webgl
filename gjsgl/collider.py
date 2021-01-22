#a Imports
import glm
import math
import numpy as np
Vec2 = object
from typing import *
RelativeFn = Callable[[int],None]

#a Collider
#c Collider
class Collider:
    #f circle_to_circle
    @staticmethod
    def circle_to_circle(c0:Vec2, r0:float, c1:Vec2, r1:float, make_relative:Optional[RelativeFn]=None) -> bool:
        tv = c1 - c0
        if make_relative is not None: make_relative(tv)
        d = glm.length(tv)
        return d<=r0+r1
    pass
    #f circle_to_line
    @staticmethod
    def circle_to_line(c0:Vec2, r0:float, p0:Vec2, dp:Vec2, make_relative:Optional[RelativeFn]=None) -> Optional[float]:
        # Get tv0 = vector of line dp, tv2=p0 rel to c0, tv3=p1 r3 to c0
        tv2 = p0 - c0
        if make_relative is not None:
            make_relative(tv2)
            pass
        # Get tv1 = unit normal to line dp, n
        tv1 = glm.vec2([-dp[1], dp[0]])
        tv1 = glm.normalize(tv1)
        # print(f"tv1,tv2:{tv1},{tv2}")
        # Get distance between line and origin
        d = glm.dot(tv2, tv1)
        if (abs(d)>r0): return None
        # Two ends of line are
        dp_len = glm.length(dp)
        pd0 = glm.dot(tv2,    dp)
        pd1 = pd0 + dp_len*dp_len # glm.dot(tv2+dp, dp)
        # print(f"pd0,pd1: {pd0},{pd1}")
        if ((pd0<0) and (pd1>0)):
            return abs(d)
        # either end is inside the circle
        # pd0 /= dp_len
        # pd1 /= dp_len
        # print(pd0*pd0,pd1*pd1, r0*r0-d*d, tv2, p0, c0, dp)
        # if (pd0*pd0 + d*d) < r0*r0: return abs(d)
        # if (pd1*pd1 + d*d) < r0*r0: return abs(d)
        x = (r0*r0-d*d)*dp_len*dp_len
        if pd0*pd0<x: return abs(d)
        if pd1*pd1<x: return abs(d)
        return None
    #f All done
    pass

