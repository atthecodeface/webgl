#a Imports
import glm
from typing import *
if not TYPE_CHECKING:
    glm.Vec3 = Tuple[float,float,float]
    glm.Vec4 = Tuple[float,float,float,float]
    glm.Mat4 = Tuple[glm.Vec4,glm.Vec4,glm.Vec4,glm.Vec4]
    glm.Quat = object
    pass

#c Transformation
class Transformation:
    translation      : glm.Vec3
    scale            : glm.Vec3
    quaternion       : glm.Quat
    #f __init__
    def __init__(self,
                 translation:Optional[Tuple[float,float,float]]=None,
                 quaternion : Optional[glm.Quat] = None,
                 scale : Optional[Tuple[float,float,float]]=None ) -> None:
        if translation is None:
            self.translation = glm.vec3()
            pass
        else:
            self.translation = glm.vec3(translation)
            pass
        if quaternion is None:
            self.quaternion  = glm.quat()
            pass
        else:
            self.quaternion  = glm.quat(quaternion)
            pass
        if scale is None:
            self.scale       = glm.vec3([1.,1.,1.])
            pass
        else:
            self.scale       = glm.vec3(scale)
            pass
        pass
    #f copy
    def copy(self, other:"Transformation") -> None:
        self.quaternion  = glm.quat(other.quaternion)
        self.translation = glm.vec3(other.translation)
        self.scale       = glm.vec3(other.scale)
        pass
    #f set
    def set(self, base:"Transformation", other:"Transformation") -> None:
        self.quaternion  = base.quaternion * other.quaternion
        self.translation = base.translation + other.translation
        for i in range(3):
            self.scale[i] = base.scale[i] * other.scale[i]
            pass
        pass
    #f mat4
    def mat4(self) -> glm.Mat4:
        m = glm.mat4_cast(self.quaternion)
        for i in range(3):
            m[i][0] *= self.scale[i]
            m[i][1] *= self.scale[i]
            m[i][2] *= self.scale[i]
            pass
        m[3][0] += self.translation[0]
        m[3][1] += self.translation[1]
        m[3][2] += self.translation[2]
        return m
    #f All done
    pass

