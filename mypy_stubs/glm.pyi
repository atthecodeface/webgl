from typing import *
ValuePtr = Any

def value_ptr(a:Any) -> ValuePtr: pass

class Quat:
    w:float ; x:float ; y:float; z:float;
    def __mul__(self, other:"Quat") -> "Quat": pass
    def __add__(self, other:"Quat") -> "Quat": pass
    def __sub__(self, other:"Quat") -> "Quat": pass
    def __neg__(self) -> "Quat": pass

class Vec3:
    def __getitem__(self,n:int) -> float : pass
    def __setitem__(self,n:int,f:float) -> None : pass
    def __add__(self, other:"Vec3") -> "Vec3": pass
class Vec4:
    def __getitem__(self,n:int) -> float : pass
    def __setitem__(self,n:int,f:float) -> None : pass
    def __add__(self, other:"Vec4") -> "Vec4": pass
    
class Mat4:
    def __getitem__(self,x:int) -> Vec4: pass
    def __setitem__(self,x:int,v:Vec4) -> None: pass
    def __mul__(self, other:"Mat4") -> "Mat4": pass
    pass
class Mat3:
    def __getitem__(self,x:int) -> Vec3: pass
    def __setitem__(self,x:int,v:Vec3) -> None: pass
    def __mul__(self, other:"Mat3") -> "Mat3": pass
    pass

def mat4_cast(q:Quat) -> Mat4: pass
def quat(x:Optional[Quat]=None) -> Quat: pass
def mat4(x:Optional[Mat4]=None) -> Mat4: pass
def mat3(x:Optional[Mat3]=None) -> Mat3: pass
def vec3(x:Union[Vec3,List[float],List[int],Tuple[float,float,float],None]=None) -> Vec3: pass

def inverse(m:Union[Mat4,Mat3,Quat]) -> Union[Mat3,Mat4,Quat]: pass
def perspective(fov:float, aspect:float, near:float, far:float) -> Mat4: pass
def angleAxis(angle:float, axis:Vec3) -> Quat: pass
def normalize(v:Vec3) -> Vec3: pass
def length(v:Union[Vec3,Vec4,Quat]) -> float: pass
def length2(v:Union[Vec3,Vec4,Quat]) -> float: pass
def distance(v0:Vec3, v1:Vec3) -> float: pass
def cross(v0:Vec3, v1:Vec3) -> Vec3: pass
def dot(v0:Vec3, v1:Vec3) -> float: pass
