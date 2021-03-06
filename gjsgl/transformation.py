#a Imports
import glm
import math

from typing import *
if not TYPE_CHECKING:
    glm.Vec3 = Tuple[float,float,float]
    glm.Vec4 = Tuple[float,float,float,float]
    glm.Mat4 = Tuple[glm.Vec4,glm.Vec4,glm.Vec4,glm.Vec4]
    glm.Mat3 = Tuple[glm.Vec3,glm.Vec3,glm.Vec3]
    glm.Quat = object
    pass

#a Useful functions
#f mat4_str
def mat4_str(mat:glm.Mat4) -> str:
    return "[" + ("   ".join([" ".join([str(v) for v in col]) for col in mat])) + "]" # type: ignore

#f vec3_str
def vec3_str(vec:glm.Vec3) -> str:
    return "["+" ".join([str(v) for v in vec])+"]" # type: ignore

#f quat_str
def quat_str(quat:glm.Quat) -> str:
    return "q("+" ".join([str(v) for v in quat])+")" # type: ignore

#f quaternion_of_rotation
def quaternion_of_rotation(rotation:glm.Mat3) -> glm.Quat:
    """
    Note that R . axis = axis
    RI = (R - I*999/1000)
    Then RI . axis = axis/1000
    Then det(RI) is going to be 1/1000 * at most 2 * at most 2
    And if na is perp to axis, then RI.na = R.na - 999/1000.na, which is perp to axis
    Then |R.na| < 2|na|
    If RI' . RI = I, then consider v' = RI' . v for some v=(a*axis + b*na0 + c*na1)
    (a'*axis + b'*na0 + c'*na1) = RI' . (a*axis + b*na0 + c*na1)
    Then RI . (a'*axis + b'*na0 + c'*na1) = (a*axis + b*na0 + c*na1)
    Then a'*RI.axis + b'*RI.na0 + c'*RI.na1 = a*axis + b*na0 + c*na1
    Then a'/1000*axis + b'*(R.na0-0.999.na0) + c'*(R.na1-0.999.na1) = a*axis + b*na0 + c*na1
    Then a = a'/1000, and
    -0.999b' + b'cos(angle) + c'sin(angle) = b, etc
    If we set |v| to be 1, then |v'| must be det(RI') = 1/det(RI) > 100
    If angle is not close to zero, then a' / b' >> 1
    This can be repeated:
    v' = normalize(RI' . v)
    v'' = normalize(RI' . v')
    v''' = normalize(RI' . v'') etc
    This gets closer and closer to the axis
    """
    rot_min_id   : glm.Mat3 = rotation - (0.99999 * glm.mat3()) # type: ignore
    rot_min_id_i : glm.Mat3 = glm.inverse(rot_min_id) # type: ignore
    for j in range(3):
        v = glm.vec3()
        v[j] = 1.
        for i in range(10):
            last_v = v
            rid_i_v : glm.Vec3 = rot_min_id_i * v # type: ignore
            v = glm.normalize(rid_i_v)
            pass
        axis = v
        dist2 = glm.length2(v - last_v) # type: ignore
        if dist2<0.00001: break
        pass

    w = glm.vec3([1.0,0,0])
    if axis[0]>0.9 or axis[0]<-0.9: w = glm.vec3([0,1.0,0])
    na0 : glm.Vec3 = glm.normalize(glm.cross(w, axis))
    na1 : glm.Vec3 = glm.cross(axis, na0)

    # Rotate w_perp_n around the axis of rotation by angle A
    na0_r : glm.Vec3 = rotation * na0 # type: ignore
    na1_r : glm.Vec3 = rotation * na1 # type: ignore

    # Get angle of rotation
    cos_angle =  glm.dot(na0, na0_r)
    sin_angle = -glm.dot(na0, na1_r)
    angle = math.atan2(sin_angle, cos_angle)

    # Set quaternion
    return glm.angleAxis(angle, axis)

#c TransMat
class TransMat:
    #v properties
    mat : glm.Mat4
    #f __init__
    def __init__(self, mat:Optional[glm.Mat4]=None) -> None:
        if mat is None:
            self.mat = glm.mat4()
            pass
        else:
            self.mat = mat
            pass
        pass
    #f mat4
    def mat4(self) -> glm.Mat4:
        return self.mat
    #f mat_after
    def mat_after(self, pre_mat:"TransMat") -> "TransMat":
        return TransMat(mat=pre_mat.mat * self.mat)
    #f __str__
    def __str__(self) -> str:
        return "[" + ("   ".join([" ".join([str(v) for v in col]) for col in self.mat])) + "]" # type: ignore
    #f All done
    pass
    
#c Transformation
class Transformation:
    translation      : glm.Vec3
    scale            : glm.Vec3
    quaternion       : glm.Quat
    #f __init__
    def __init__(self,
                 translation: Optional[Tuple[float,float,float]]=None,
                 quaternion : Optional[glm.Quat] = None,
                 scale      : Optional[Tuple[float,float,float]]=None ) -> None:
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
    #f __str__
    def __str__(self) -> str:
        r = f"{vec3_str(self.translation)}:{quat_str(self.quaternion)}:{vec3_str(self.scale)}"
        return r
    #f clone
    def clone(self) -> "Transformation":
        t = Transformation( translation = self.translation,
                            quaternion  = self.quaternion,
                            scale       = self.scale)
        return t
    #f copy
    def copy(self, other:"Transformation") -> None:
        self.quaternion  = glm.quat(other.quaternion)
        self.translation = glm.vec3(other.translation)
        self.scale       = glm.vec3(other.scale)
        pass
    #f combine
    def combine(self, base:"Transformation", other:"Transformation") -> None:
        self.quaternion  = base.quaternion * other.quaternion
        self.translation = base.translation + other.translation
        for i in range(3):
            self.scale[i] = base.scale[i] * other.scale[i]
            pass
        pass
    #f set
    def set(self, other:"Transformation") -> None:
        self.copy(other)
        pass
    #f translate
    def translate(self, t:glm.Vec3, scale:float) -> None:
        self.translation = self.translation + (t * scale) # type: ignore
        pass
    #f rotate
    def rotate(self, axis:glm.Vec3, angle:float) -> None:
        q = glm.angleAxis(angle, axis)
        self.quaternion  = q * self.quaternion
        self.translation = q * self.translation # type: ignore
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
    #f from_mat4
    def from_mat4(self, m:glm.Mat4) -> None:
        self.translation = glm.vec3([m[3][0], m[3][1], m[3][2]])
        rotation = glm.mat3()
        for i in range(3):
            v = glm.vec3([m[i][0], m[i][1], m[i][2]])
            l = glm.length(v)
            self.scale[i] = l
            rotation[i] = v / l # type: ignore
            pass
        self.quaternion = quaternion_of_rotation(rotation)
        pass
    #f trans_mat
    def trans_mat(self) -> TransMat:
        return TransMat(mat=self.mat4())
    #f trans_mat_after
    def trans_mat_after(self, pre_mat:TransMat) -> TransMat:
        return TransMat(mat=pre_mat.mat * self.mat4())
    #f distance
    def distance(self, other:"Transformation") -> float:
        td = glm.distance(self.translation, other.translation)
        sd = glm.distance(self.scale, other.scale)
        qn : glm.Quat = glm.inverse(self.quaternion)  # type: ignore
        qn = qn * other.quaternion
        if qn.w<0: qn = -qn
        qd = glm.length(qn - glm.quat())
        return td+sd+qd
    #f lerp
    def lerp(self, t:float, in0:"Transformation", in1:"Transformation") -> None:
        tn = 1.0-t
        for i in range(3):
            self.translation[i] = t*in0.translation[i] + tn*in1.translation[i]
            self.scale[i]       = t*in0.scale[i]       + tn*in1.scale[i]
            pass
        self.quaternion = glm.slerp(in0.quaternion, in1.quaternion, t)
        pass
    #f All done
    pass

