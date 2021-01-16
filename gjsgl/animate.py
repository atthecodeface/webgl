#a Imports
import math
import glm

from typing import *

AnimationComplete = Callable[[float],None]
#c Animatable
class Animatable:
    #v Properties
    t0 : float
    t1 : float
    time : float
    value : Any
    p0    : Any
    completion_callback : Optional[AnimationComplete]
    #f __init__
    def __init__(self, p:Any) -> None:
        self.time = 0.
        self.t0 = 0.
        self.t1 = 0.
        self.value = p
        self.p0 = p.clone()
        self.completion_callback = None
        pass
    #f set
    def set(self, t:float, value:Any) -> None:
        self.t0 = t
        self.time = t
        self.p0.set(value)
        self.value.set(value)
        pass
    #f get_time
    def get_time(self) -> float:
        return self.t0
    #f get
    def get(self) -> Any:
        return self.value
    #f _set_target
    def _set_target(self, t1:float, callback:Optional[AnimationComplete]) -> None:
        self.t0 = self.time
        self.p0.set(self.value)
        self.t1 = t1
        self.completion_callback = callback
        pass
    #f interpolate_to_time
    def interpolate_to_time(self, t:float) -> Any:
        if t<=self.t1:
            self.perform_interpolation(t)
            self.time = t
            if self.time==self.t1:
                if self.completion_callback is not None: self.completion_callback(t)
                pass
            return self.value
        if self.t1<=self.time:
            self.time = t
            return self.value
        self.interpolate_to_time(self.t1) # And then kick in update of animation...
        return self.interpolate_to_time(t)
    #f perform_interpolation
    def perform_interpolation(self, t:float) -> None:
        pass
    #f All done
    pass

#c Linear - animate anything with a linear fashion p0 to p1 providing it has add and scalar mult
class Linear(Animatable):
    #v Properties
    value : Any
    p0   : Any
    p1   : Any
    #f __init__
    def __init__(self, p:Any) -> None:
        super().__init__(p=p)
        self.p1 = p.clone()
        pass
    #f set_target
    def set_target(self, t1:float, tgt:Any, callback:Optional[AnimationComplete]) -> "Animatable":
        super()._set_target(t1, callback)
        self.t1 = t1
        self.p1.set(tgt)
        return self
    #f perform_interpolation - linear interpolation of p(t) between p0(t0) and p1(t1)
    def perform_interpolation(self, time:float) -> None:
        dt  = self.t1 - self.t0
        dt0 = (time - self.t0) / dt
        if dt0 > 0.9999:
            self.value.set(self.p1)
            pass
        else:
            self.value.lerp(dt0, self.p0, self.p1)
            pass
        pass
    #f All done
    pass

#c Bezier2 - animate anything with a bezier with 2 control points from p0 to p1 providing it has add and scalar mult
class Bezier2(Animatable):
    value : Any
    p0   : Any
    c0   : Any
    p1   : Any
    c1   : Any
    #f __init__
    def __init__(self, p:Any) -> None:
        super().__init__(p=p)
        self.c0 = p.clone()
        self.c1 = p.clone()
        self.p1 = p.clone()
        self.v0 = p.clone() # temp values
        self.v1 = p.clone()
        pass
    #f set_target
    def set_target(self, t1:float, c0:Any, c1:Any, tgt:Any, callback:Optional[AnimationComplete]) -> "Bezier2":
        super()._set_target(t1, callback)
        self.c0.set(c0)
        self.c1.set(c1)
        self.p1.set(tgt)
        return self
    #f perform_interpolation - bezier of (p,v)(t) between (p0,c0)(t0) to (p1,c1)(t1)
    def perform_interpolation(self, time:float) -> None:
        dt  = self.t1 - self.t0
        dt0 = (time - self.t0) / dt
        if dt0 > 0.9999:
            self.value.set(self.p1)
            pass
        else:
            self.v0.lerp(dt0, self.p0, self.c0)
            self.v1.lerp(dt0, self.c1, self.p1)
            self.value.lerp(dt0, self.v0, self.v1)
            pass
        pass
    #f All done
    pass

