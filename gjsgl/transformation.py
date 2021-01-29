#a Imports
import math

from typing import *
from . import glm as Glm

#a Useful functions
#f mat4_str
def mat4_str(mat:Glm.mat4) -> str: return str(mat)

#f vec3_str
def vec3_str(vec:Glm.vec3) -> str: return str(vec)

#f quat_str
def quat_str(quat:Glm.quat) -> str: return str(quat)

#f quaternion_to_euler
def quaternion_to_euler(q:Glm.Quat) -> Tuple[float,float,float]:
    x=q[0]; y=q[1]; z=q[2]; w=q[3];
    test = x*y + z*w
    heading = None
    if (test > 0.499999):
        heading  = 2*math.atan2(x,w)
        attitude = math.pi/2
        bank = 0.
        pass
    elif (test < -0.499999):
        heading  = -2*math.atan2(x,w)
        attitude = -math.pi/2
        bank = 0.
        pass
    if heading is None:
        x2 = x*x
        y2 = y*y
        z2 = z*z
        heading  = math.atan2(2*y*w - 2*x*z , 1 - 2*y2 - 2*z2)
        attitude = math.asin(2*test)
        bank     = math.atan2(2*x*w - 2*y*z , 1 - 2*x2 - 2*z2)
        pass
    return (bank, heading, attitude)

#f quaternion_of_rotation
def quaternion_of_rotation(rotation:Glm.Mat3) -> Glm.quat:
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
    rot_min_id   = rotation - (Glm.mat3.create() * 0.99999)
    rot_min_id_i = Glm.mat3.inverse(rot_min_id) # type: ignore
    for j in range(3):
        v = Glm.vec3()
        v[j] = 1.
        for i in range(10):
            last_v = v
            rid_i_v : Glm.Vec3 = rot_min_id_i * v # type: ignore
            Glm.vec3.normalize(v, rid_i_v)
            pass
        axis = v
        dist2 = Glm.length2(v - last_v) # type: ignore
        if dist2<0.00001: break
        pass

    w = Glm.vec3.fromValues(1.0,0,0);
    if axis[0]>0.9 or axis[0]<-0.9: w = Glm.vec3.fromValues(0,1.0,0)
    na0 : Glm.vec3 = Glm.vec3.normalize(Glm.vec3.create(), Glm.vec3.cross(Glm.vec3.create(), w, axis))
    na1 : Glm.vec3 = Glm.vec3.cross(Glm.vec3.create(), axis, na0)

    # Rotate w_perp_n around the axis of rotation by angle A
    na0_r : Glm.vec3 = Glm.vec3.transformMat3(Glm.vec3.create(), na0, rotation)
    na1_r : Glm.vec3 = Glm.vec3.transformMat3(Glm.vec3.create(), na1, rotation)

    # Get angle of rotation
    cos_angle =  Glm.vec3.dot(na0, na0_r)
    sin_angle = -Glm.vec3.dot(na0, na1_r)
    angle = math.atan2(sin_angle, cos_angle)

    # Set quaternion
    return Glm.quat.setAxisAngle(Glm.quat.create(), axis, angle)

#c TransMat
class TransMat:
    #v properties
    mat : Glm.mat4
    #f __init__
    def __init__(self, mat:Optional[Glm.mat4]=None) -> None:
        if mat is None:
            self.mat = Glm.mat4.create()
            pass
        else:
            self.mat = mat
            pass
        pass
    #f mat4
    def mat4(self) -> Glm.mat4:
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
    translation      : Glm.vec3
    scale            : Glm.vec3
    quaternion       : Glm.quat
    #f __init__
    def __init__(self,
                 translation: Optional[Glm.vec3]=None,
                 quaternion : Optional[Glm.quat] = None,
                 scale      : Optional[Glm.vec3]=None ) -> None:
        self.translation = Glm.vec3.create();
        self.quaternion  = Glm.quat.create();
        self.scale       = Glm.vec3.fromValues(1.,1.,1.);
        if translation is not None:
            Glm.vec3.copy(self.translation, translation);
            pass
        if quaternion is not None:
            Glm.quat.copy(self.quaternion, quaternion);
            pass
        if scale is not None:
            Glm.vec3.copy(self.scale,scale);
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
        Glm.quat.copy(self.quaternion,  other.quaternion)
        Glm.vec3.copy(self.translation, other.translation)
        Glm.vec3.copy(self.scale,       other.scale)
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
    def translate(self, t:Glm.vec3, scale:float) -> None:
        self.translation = self.translation + (t * scale)
        pass
    #f rotate
    def rotate(self, axis:Glm.vec3, angle:float) -> None:
        q = Glm.quat.setAxisAngle(Glm.quat.create(), axis, angle)
        Glm.quat.multiply(self.quaternion, q, self.quaternion)
        Glm.quat.multiply(self.translation, q, self.translation)
        # self.translation = q * self.translation # type: ignore
        pass
    #f mat4
    def mat4(self) -> Glm.mat4:
        m = Glm.mat4.fromQuat(Glm.mat4.create(), self.quaternion)
        for i in range(3):
            m[4*i+0] *= self.scale[i]
            m[4*i+1] *= self.scale[i]
            m[4*i+2] *= self.scale[i]
            pass
        m[12] += self.translation[0]
        m[13] += self.translation[1]
        m[14] += self.translation[2]
        return m
    #f from_mat4
    def from_mat4(self, m:Glm.mat4) -> None:
        self.translation = Glm.vec3.fromValues(m[12], m[13], m[14])
        rotation = Glm.mat3.create()
        for i in range(3):
            v = Glm.vec3.fromValues(m[4*i+0],m[4*i+1],m[4*i+2]);
            l = Glm.vec3.length(v);
            self.scale[i] = l
            rotation[3*i+0] = v[0] / l
            rotation[3*i+1] = v[1] / l
            rotation[3*i+2] = v[2] / l
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
        td = Glm.vec3.distance(self.translation, other.translation)
        sd = Glm.vec3.distance(self.scale, other.scale)
        qn = Glm.quat.multiply(Glm.quat.create(), Glm.quat.invert(Glm.quat.create(),self.quaternion), other.quaternion)
        if qn[3]<0: qn = -qn
        qd = Glm.quat.length(qn - Glm.quat())
        return td+sd+qd
    #f lerp
    def lerp(self, t:float, in0:"Transformation", in1:"Transformation") -> None:
        tn = 1.0-t
        for i in range(3):
            self.translation[i] = t*in0.translation[i] + tn*in1.translation[i]
            self.scale[i]       = t*in0.scale[i]       + tn*in1.scale[i]
            pass
        self.quaternion = Glm.slerp(in0.quaternion, in1.quaternion, t)
        pass
    #f All done
    pass

