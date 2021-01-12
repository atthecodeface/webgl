#a Imports
import math
import glm

from typing import *

AnimationComplete = Callable[[float],None]
class Animatable:
    t0 : float
    t1 : float
    time : float
    value : Any
    p0 : Any
    p1 : Any
    completion_callback : Optional[AnimationComplete]
    def __init__(self, p:Any) -> None:
        self.value = p
        self.time = 0.
        self.t0 = 0.
        self.t1 = 0.
        self.p0 = p
        self.p1 = p
        self.completion_callback = None
        pass
    def set(self, t:float, value:Any) -> None:
        self.t0 = t
        self.p0 = value
        self.time = t
        self.value = value
        pass
    def get_time(self) -> float:
        return self.t0
    def get(self) -> Any:
        return self.value
    def set_target(self, t1:float, tgt:Any, callback:Optional[AnimationComplete]) -> "Animatable":
        self.t0 = self.time
        self.p0 = self.value
        self.t1 = t1
        self.p1 = tgt
        self.completion_callback = callback
        return self
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
    def perform_interpolation(self, t:float) -> None:
        pass
    pass

class Linear(Animatable):
    value : Any
    p0   : Any
    p1   : Any
    def __init__(self, p:Any) -> None:
        super().__init__(p=p)
        pass
    def perform_interpolation(self, t:float) -> None:
        dt  = self.t1 - self.t0
        dt0 = t - self.t0
        dt1 = self.t1 - t
        if dt < 1E-4:
            self.value = self.p1
            pass
        else:
            self.value = (dt1 * self.value + dt0 * self.p1) / dt
            pass
        pass
    pass

class Cubic(Animatable):
    value : Tuple[Any,Any]
    p0   : Tuple[Any,Any]
    p1   : Tuple[Any,Any]
    def __init__(self, p:Any, v:Any) -> None:
        super().__init__(p=(p,v))
        pass
    def perform_interpolation(self, time:float) -> None:
        dt  = self.t1 - self.t0
        t = (time - self.t0) / dt
        if t>0.9999:
            self.value = self.p1
            return
        d = self.p0[0] # position
        c = self.p0[1] # velocity
        dp = self.p1[0] - d
        b = 3 * dp - 2*c - self.p1[1]
        a = dp - b - c
        print(t, a+b+c+d, 3*a+2*b+c, self.value, self.p1)
        v1 = (3*t*t) * a + (2*t) * b + c
        p1 = (t*t*t) * a + (t*t) * b + t*c + d
        self.value = (p1, v1)
        pass
    pass

Quat=object
class LinearQuat(Animatable):
    value : Quat
    p0    : Quat
    p1    : Quat
    def __init__(self, p:Any) -> None:
        super().__init__(p=p)
        pass
    def perform_interpolation(self, time:float) -> None:
        dt  = self.t1 - self.t0
        dt0 = time - self.t0
        t = dt0 / dt
        self.value = glm.slerp(self.p0, self.p1, t)
        pass
    pass

