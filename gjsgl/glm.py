#a Imports
import numpy as np
import math

from typing import *

#a FakeNpArray
TF = TypeVar('TF', bound="FakeNpArray")
class FakeNpArray(object):
    def item(self, *args: int) -> float: ...
    # def __copy__(self:Any) -> Any: ...
    def __getitem__(self, key:Any) -> float: ...
    def __setitem__(self, key:Any, value:float) -> None: ...
    def __iter__(self) -> Iterator[float]: ...
    def __lt__(self, other:object) -> bool: ...
    def __le__(self, other:object) -> bool: ...
    def __eq__(self, other:object) -> bool: ...
    def __ne__(self, other:object) -> bool: ...
    def __gt__(self, other:object) -> bool: ...
    def __ge__(self, other:object) -> bool: ...
    def __add__(self:TF, other:TF) -> TF: ...
    def __radd__(self:TF, other:TF) -> TF: ...
    def __iadd__(self:TF, other:TF) -> TF: ...
    def __sub__(self:TF, other:TF) -> TF: ...
    def __rsub__(self:TF, other:TF) -> TF: ...
    def __isub__(self:TF, other:TF) -> TF: ...
    def __mul__(self:TF, other:Union[TF,float]) -> TF: ...
    def __rmul__(self:TF, other:TF) -> TF: ...
    def __imul__(self:TF, other:Union[TF,float]) -> TF: ...
    def __div__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __rdiv__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __idiv__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __truediv__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __rtruediv__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __itruediv__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __floordiv__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __rfloordiv__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __ifloordiv__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __mod__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __rmod__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __imod__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __divmod__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __rdivmod__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __pow__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __rpow__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __ipow__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __lshift__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __rlshift__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __ilshift__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __rshift__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __rrshift__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __irshift__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __and__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __rand__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __iand__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __xor__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __rxor__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __ixor__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __or__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __ror__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __ior__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __matmul__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __rmatmul__(self, other:"FakeNpArray") -> "FakeNpArray": ...
    def __neg__(self: "FakeNpArray") -> "FakeNpArray": ...
    def __pos__(self: "FakeNpArray") -> "FakeNpArray": ...
    def __abs__(self: "FakeNpArray") -> "FakeNpArray": ...
    def __invert__(self: "FakeNpArray") -> "FakeNpArray": ...
    def __copy__(self: "FakeNpArray") -> "FakeNpArray": ...
    def dot(self, other:"FakeNpArray") -> float: ...
    def fill(self, value:float) -> None: ...
    def flatten(self) -> "FakeNpArray": ...
    pass

#a Type variables
TM = TypeVar('TM', bound="Matrix")
TV = TypeVar('TV', bound="Vector")
Vec2 = TypeVar("Vec2", bound="vec2")
Vec3 = TypeVar("Vec3", bound="vec3")
Vec4 = TypeVar("Vec4", bound="vec4")
Quat = TypeVar("Quat", bound="quat")
Mat2 = TypeVar("Mat2", bound="mat2")
Mat3 = TypeVar("Mat3", bound="mat3")
Mat4 = TypeVar("Mat4", bound="mat4")

#a Common
#v _temp
_temp = np.array([0]*16)
T = TypeVar('T', bound="Common")
class Common(FakeNpArray):
    #f clone
    @staticmethod
    def clone(x:T) -> T:
        return cast(T,x.__copy__())
    #f set
    @staticmethod
    def set(out:T,*args:Any) -> T:
        for i in range(len(args)): out[i]=args[i]
        return out
    #f distance
    @staticmethod
    def distance(x:T,y:T) -> float:
        d = x.flatten()-y.flatten()
        return math.sqrt(d.dot(d))
    #f copy
    @staticmethod
    def copy(a:T, x:T) -> T:
        a[:] = x[:]
        return a
    #f add
    @staticmethod
    def add(a:T, x:T, y:T) -> T:
        a[:] = (x+y)[:]
        return a
    #f scaleAndAdd
    @staticmethod
    def scaleAndAdd(a:T, x:T, y:T, s:float) -> T:
        a[:] = (x+(y*s))[:]
        return a
    #f subtract
    def subtract(a:T,x:T,y:T) -> T:
        return Common.scaleAndAdd(a,x,y,-1.0)
    #f dot
    def dot(x:T, y:T) -> float:
        return x.dot(y)
    # All done
    pass
    
#a Vector
class Vector(Common):
    #f sqrLen
    @staticmethod
    def sqrLen(x:"Vector") -> float:
        return x.dot(x)
    #f length
    @staticmethod
    def length(x:"Vector") -> float: return math.sqrt(x.dot(x))
    #f scale
    @staticmethod
    def scale(a:"Vector",x:"Vector",s:float) -> "Vector":
        a[:] = x[:]
        a *= s
        return a
    #f dot - standard Numpy array
    #f normalize
    @staticmethod
    def normalize(a:TV, x:TV) -> TV:
        l = Vector.length(x)
        if (l<1.E-8): return a
        a[:] = x[:]
        a *= 1.0/l
        return a
    #f All done
    pass

#a Vec2/vec2
class vec2(Vector):
    # create
    @staticmethod
    def create() -> "vec2":
        return cast("vec2",np.array([0.,0.]))
    #f fromValues
    @staticmethod
    def fromValues(a:float, b:float) -> "vec2":
        return cast("vec2",np.array([a,b]))
    #f length - implied
    #f transformMat2
    def transformMat2(a:Vec2, x:Vec2, M:Mat2) -> Vec2:
        c0=M[0]*x[0] + M[2]*x[1]
        c1=M[1]*x[0] + M[3]*x[1]
        a[0]=c0
        a[1]=c1
        return a
    #f All done
    pass

#a Vec3/vec3
class vec3(Vector):
    # create
    @staticmethod
    def create() -> "vec3":
        return cast("vec3",np.array([0.,0.,0.]))
    #f fromValues
    @staticmethod
    def fromValues(a:float, b:float, c:float) -> "vec3":
        return cast("vec3",np.array([a,b,c]))
    #f length - implied
    #f cross
    @staticmethod
    def cross(a:Vec3,x:Vec3,y:Vec3) -> Vec3:
        c0=x[1]*y[2]-x[2]*y[1]
        c1=x[2]*y[0]-x[0]*y[2]
        c2=x[0]*y[1]-x[1]*y[0]
        a[0]=c0; a[1]=c1; a[2]=c2;
        return a
    #f transformMat3
    @staticmethod
    def transformMat3(a:Vec3,x:Vec3,M:Mat3) -> Vec3:
        c0=M[0]*x[0] + M[3]*x[1] + M[6]*x[2];
        c1=M[1]*x[0] + M[4]*x[1] + M[7]*x[2];
        c2=M[2]*x[0] + M[5]*x[1] + M[8]*x[2];
        a[0]=c0; a[1]=c1; a[2]=c2;
        return a
    pass
    #f All done
    pass

#a Vec4/vec4
class vec4(Vector):
    # create
    @staticmethod
    def create() -> "vec4":
        return cast("vec4",np.array([0.,0.,0.,0.]))
    #f fromValues
    @staticmethod
    def fromValues(a:float, b:float, c:float, d:float) -> Vec4:
        return cast(Vec4,np.array([a,b,c,d]))
    #f length - implied
    #f transformMat3
    @staticmethod
    def transformMat4(a:Vec4,x:Vec4,M:Mat4) -> Vec4:
        c0=M[0]*x[0] + M[4]*x[1] + M[8]*x[2]  + M[12]*x[3];
        c1=M[1]*x[0] + M[5]*x[1] + M[9]*x[2]  + M[13]*x[3];
        c2=M[2]*x[0] + M[6]*x[1] + M[10]*x[2] + M[14]*x[3];
        c3=M[3]*x[0] + M[7]*x[1] + M[11]*x[2] + M[15]*x[3];
        a[0]=c0; a[1]=c1; a[2]=c2; a[3]=c3;
        return a
    #f All done
    pass

#a Quat/quat
class quat(Vector):
    # create
    @staticmethod
    def create() -> "quat":
        return cast("quat",np.array([0.,0.,0.,1.]))
    #f fromValues
    @staticmethod
    def fromValues(a:float, b:float, c:float, d:float) -> "quat":
        return cast("quat",np.array([a,b,c,d]))
    #f length - implied
    #f identity
    @staticmethod
    def identity(q:Quat) -> Quat:
        q[0]=0;q[1]=0;q[2]=0;q[3]=1;
        return q
    #f invert
    @staticmethod
    def invert(q:Quat, a:Quat) -> Quat:
        l = a.dot(a)
        if (abs(l)<1E-8):
            l=0
            pass
        else:
            l=1/l
            pass
        q[0] = -a[0]*l;
        q[1] = -a[1]*l;
        q[2] = -a[2]*l;
        q[3] =  a[3]*l;
        return q;
    pass
    #f conjugate
    @staticmethod
    def conjugate(q:Quat, a:Quat) -> Quat:
        q[0] = -a[0];
        q[1] = -a[1];
        q[2] = -a[2];
        q[3] =  a[3];
        return q;
    #f rotateX
    @staticmethod
    def rotateX(q:Quat, a:Quat, angle:float) -> Quat:
        s = math.sin(angle*0.5)
        c = math.cos(angle*0.5);
        x = a[0] * c + a[3] * s;
        y = a[1] * c + a[2] * s;
        z = a[2] * c - a[1] * s;
        w = a[3] * c - a[0] * s;
        q[0]=x; q[1]=y; q[2]=z; q[3]=w;
        return q;
    #f rotateY
    @staticmethod
    def rotateY(q:Quat, a:Quat, angle:float) -> Quat:
        s = math.sin(angle*0.5)
        c = math.cos(angle*0.5);
        x = a[0] * c - a[2] * s;
        y = a[1] * c + a[3] * s;
        z = a[2] * c + a[0] * s;
        w = a[3] * c - a[1] * s;
        q[0]=x; q[1]=y; q[2]=z; q[3]=w;
        return q;
    #f rotateZ
    @staticmethod
    def rotateZ(q:Quat, a:Quat, angle:float) -> Quat:
        s = math.sin(angle*0.5)
        c = math.cos(angle*0.5);
        x = a[0] * c + a[1] * s;
        y = a[1] * c - a[0] * s;
        z = a[2] * c + a[3] * s;
        w = a[3] * c - a[2] * s;
        q[0]=x; q[1]=y; q[2]=z; q[3]=w;
        return q;
    #f multiply
    @staticmethod
    def multiply(q:Quat, a:Quat, b:Quat) -> Quat:
        x = a[0]*b[3] + a[3]*b[0] + a[1]*b[2] - a[2]*b[1];
        y = a[1]*b[3] + a[3]*b[1] + a[2]*b[0] - a[0]*b[2];
        z = a[2]*b[3] + a[3]*b[2] + a[0]*b[1] - a[1]*b[0];
        w = a[3]*b[3] - a[0]*b[0] - a[1]*b[1] - a[2]*b[2];
        q[0]=x; q[1]=y; q[2]=z; q[3]=w;
        return q;
    #f setAxisAngle
    @staticmethod
    def setAxisAngle(q:Quat, axis:Vec3, angle:float) -> Quat:
        c = math.cos(angle*0.5);
        s = math.sin(angle*0.5);
        q[0] = s * axis[0];
        q[1] = s * axis[1];
        q[2] = s * axis[2];
        q[3] = c
        return q;
    #f getAxisAngle
    @staticmethod
    def getAxisAngle(axis:Vec3, q:"quat") -> float:
        angle = math.acos(q[3]);
        axis[0] = q[0];
        axis[1] = q[1];
        axis[2] = q[2];
        vec3.normalize(axis,axis);
        return angle;
    #f All done
    pass

#a Matrix
class Matrix(Common):
    #f create
    @staticmethod
    def create(n:int) -> TM:
        a = np.array([0.]*(n*n))
        for i in range(n): a[i+i*n]=1.
        return cast(TM,a)
    #f multiplyScalar
    @staticmethod
    def multiplyScalar(a:TM,x:TM,s:float) -> TM:
        a[:] = x[:]
        a *= s
        return a
    #f absmax
    @staticmethod
    def absmax(x:TM) -> float:
        r = 0.
        for v in x: r=max(r,abs(r))
        return r;
    #f normalize
    @staticmethod
    def normalize(a:TM, x:TM) -> TM:
        l = Matrix.absmax(x)
        if (l<1.0E-8):
            a.fill(0)
            pass
        else:
            a[:] = x[:]
            a *= 1.0/l
            pass
        return a
    #f multiply
    @staticmethod
    def multiply(a:TM, x:TM, y:TM, n:int) -> TM:
        np.matmul(x,y,out=a)
        return a
    #f All done
    pass

#a Mat2/mat2
class mat2(Matrix):
    #f create
    @staticmethod
    def create() -> Mat2: # type:ignore
        return cast(Mat2,Matrix.create(2))
    #f multiply
    @staticmethod
    def multiply(a:Mat2, x:Mat2, y:Mat2) -> Mat2: # type:ignore
        return Matrix.multiply(a,x,y,2)
    #f determinant
    @staticmethod
    def determinant(x:Mat2) -> float:
        return x[0]*x[3]-x[1]*x[2]
    #f invert
    @staticmethod
    def invert(a:Mat2,x:Mat2) -> Mat2:
        d = mat2.determinant(x)
        if (abs(d)>1.E-8): d=1/d
        _temp[0] = x[3]*d;
        _temp[1] = -x[1]*d;
        _temp[2] = -x[2]*d;
        _temp[3] = x[0]*d;
        a[:4] = _temp[:4]
        return a
    #f All done
    pass

#a Mat3/mat3
class mat3(Matrix):
    #f create
    @staticmethod
    def create() -> "mat3": # type:ignore
        return cast("mat3",Matrix.create(3))
    #f multiply
    @staticmethod
    def multiply(a:Mat3, x:Mat3, y:Mat3) -> Mat3: # type:ignore
        return Matrix.multiply(a,x,y,3)
    #f determinant
    @staticmethod
    def determinant(x:Mat3) -> float:
        return (x[0]*(x[4]*x[8] - x[5]*x[7]) +
                x[1]*(x[5]*x[6] - x[3]*x[8]) +
                x[2]*(x[3]*x[7] - x[4]*x[6]) );
    #f invert
    @staticmethod
    def invert(a:Mat3,x:Mat3) -> Mat3:
        d = mat3.determinant(x)
        if (abs(d)>1.E-8): d=1/d
        _temp[0] = (x[3+1]*x[6+2] - x[3+2]*x[6+1])*d;
        _temp[1] = (x[3+2]*x[6+0] - x[3+0]*x[6+2])*d;
        _temp[2] = (x[3+0]*x[6+1] - x[3+1]*x[6+0])*d;

        _temp[3] = (x[6+1]*x[0+2] - x[6+2]*x[0+1])*d;
        _temp[4] = (x[6+2]*x[0+0] - x[6+0]*x[0+2])*d;
        _temp[5] = (x[6+0]*x[0+1] - x[6+1]*x[0+0])*d;

        _temp[6] = (x[0+1]*x[3+2] - x[0+2]*x[3+1])*d;
        _temp[7] = (x[0+2]*x[3+0] - x[0+0]*x[3+2])*d;
        _temp[8] = (x[0+0]*x[3+1] - x[0+1]*x[3+0])*d;

        a[:9] = _temp[:9]
        return a
    #f All done
    pass

#a Mat4/mat4
class mat4(Matrix):
    #f create
    @staticmethod
    def create() -> "mat4": # type:ignore
        return cast("mat4",Matrix.create(4))
    #f multiply
    @staticmethod
    def multiply(a:Mat4, x:Mat4, y:Mat4) -> Mat4: # type:ignore
        return Matrix.multiply(a,x,y,4)
    #f determinant
    @staticmethod
    def determinant(x:Mat4) -> float:
        return (x[0] * (  x[4+1] * (x[8+2]*x[12+3]-x[8+3]*x[12+2]) +
                        ( x[4+2] * (x[8+3]*x[12+1]-x[8+1]*x[12+3])) +
                         (x[4+3] * (x[8+1]*x[12+2]-x[8+2]*x[12+1])) ) +
                x[1] * (  x[4+2] * (x[8+3]*x[12+0]-x[8+0]*x[12+3]) +
                        ( x[4+3] * (x[8+0]*x[12+2]-x[8+2]*x[12+0])) +
                         (x[4+0] * (x[8+2]*x[12+3]-x[8+3]*x[12+2])) ) +
                x[2] * (  x[4+3] * (x[8+0]*x[12+1]-x[8+1]*x[12+0]) +
                        ( x[4+0] * (x[8+1]*x[12+3]-x[8+3]*x[12+1])) +
                         (x[4+1] * (x[8+3]*x[12+0]-x[8+0]*x[12+3])) ) +
                x[3] * (  x[4+0] * (x[8+1]*x[12+2]-x[8+2]*x[12+1]) +
                        ( x[4+1] * (x[8+2]*x[12+0]-x[8+0]*x[12+2])) +
                         (x[4+2] * (x[8+0]*x[12+1]-x[8+1]*x[12+0])) ) +
                0 );
    #f invert
    @staticmethod
    def invert(a:Mat3,x:Mat3) -> Mat3:
        x00 = x[ 0]; x01 = x[ 1]; x02 = x[ 2]; x03 = x[ 3];
        x10 = x[ 4]; x11 = x[ 5]; x12 = x[ 6]; x13 = x[ 7];
        x20 = x[ 8]; x21 = x[ 9]; x22 = x[10]; x23 = x[11];
        x30 = x[12]; x31 = x[13]; x32 = x[14]; x33 = x[15];
        b00 = x00 * x11 - x01 * x10;
        b01 = x00 * x12 - x02 * x10;
        b02 = x00 * x13 - x03 * x10;
        b03 = x01 * x12 - x02 * x11;
        b04 = x01 * x13 - x03 * x11;
        b05 = x02 * x13 - x03 * x12;
        b06 = x20 * x31 - x21 * x30;
        b07 = x20 * x32 - x22 * x30;
        b08 = x20 * x33 - x23 * x30;
        b09 = x21 * x32 - x22 * x31;
        b10 = x21 * x33 - x23 * x31;
        b11 = x22 * x33 - x23 * x32;
        d = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
        if (abs(d)>1E-8): d=1/d;
        a[0]  = (x11 * b11 - x12 * b10 + x13 * b09) * d;
        a[1]  = (x02 * b10 - x01 * b11 - x03 * b09) * d;
        a[2]  = (x31 * b05 - x32 * b04 + x33 * b03) * d;
        a[3]  = (x22 * b04 - x21 * b05 - x23 * b03) * d;
        a[4]  = (x12 * b08 - x10 * b11 - x13 * b07) * d;
        a[5]  = (x00 * b11 - x02 * b08 + x03 * b07) * d;
        a[6]  = (x32 * b02 - x30 * b05 - x33 * b01) * d;
        a[7]  = (x20 * b05 - x22 * b02 + x23 * b01) * d;
        a[8]  = (x10 * b10 - x11 * b08 + x13 * b06) * d;
        a[9]  = (x01 * b08 - x00 * b10 - x03 * b06) * d;
        a[10] = (x30 * b04 - x31 * b02 + x33 * b00) * d;
        a[11] = (x21 * b02 - x20 * b04 - x23 * b00) * d;
        a[12] = (x11 * b07 - x10 * b09 - x12 * b06) * d;
        a[13] = (x00 * b09 - x01 * b07 + x02 * b06) * d;
        a[14] = (x31 * b01 - x30 * b03 - x32 * b00) * d;
        a[15] = (x20 * b03 - x21 * b01 + x22 * b00) * d;
        return a;
    #f fromQuat
    def fromQuat(a:Mat4, q:Quat) -> "mat4":
        x=q[0]; y=q[1]; z=q[2]; w=q[3];
        a[0+0]= 1 - 2*y*y - 2*z*z;
        a[0+1]=     2*x*y + 2*z*w;
        a[0+2]=     2*x*z - 2*y*w;
        a[0+3]= 0;
        a[4+1]= 1 - 2*z*z - 2*x*x;
        a[4+2]=     2*y*z + 2*x*w;
        a[4+0]=     2*x*y - 2*z*w;
        a[4+3]= 0;
        a[8+2]= 1 - 2*x*x - 2*y*y;
        a[8+0]=     2*z*x + 2*y*w;
        a[8+1]=     2*y*z - 2*x*w;
        a[8+3]= 0;
        a[12]=0;a[13]=0;a[14]=0;a[15]=1;
        return a;
    #f getRotation
    # from www.euclideanspace
    @staticmethod
    def getRotation(q:Quat, m:Mat4) -> quat:
        lr0 = 1.0/math.hypot(m[0+0], m[4+0], m[8+0]);
        lr1 = 1.0/math.hypot(m[0+1], m[4+1], m[8+1]);
        lr2 = 1.0/math.hypot(m[0+2], m[4+2], m[8+2]);
        m00 = m[0]*lr0; m10=m[1]*lr1; m20=m[ 2]*lr2;
        m01 = m[4]*lr0; m11=m[5]*lr1; m21=m[ 6]*lr2;
        m02 = m[8]*lr0; m12=m[9]*lr1; m22=m[10]*lr2;
        tr = m00 + m11 + m22;
        if (tr > 0) :
            S = math.sqrt(tr+1.0) * 2; # S=4*qw 
            w = 0.25 * S;
            x = (m21 - m12) / S;
            y = (m02 - m20) / S; 
            z = (m10 - m01) / S; 
            pass
        elif ((m00 > m11) and (m00 > m22)):
            S = math.sqrt(1.0 + m00 - m11 - m22) * 2; # S=4*qx 
            w = (m21 - m12) / S;
            x = 0.25 * S;
            y = (m01 + m10) / S; 
            z = (m02 + m20) / S; 
            pass
        elif (m11 > m22):
            S = math.sqrt(1.0 + m11 - m00 - m22) * 2; # S=4*qy
            w = (m02 - m20) / S;
            x = (m01 + m10) / S; 
            y = 0.25 * S;
            z = (m12 + m21) / S;
            pass
        else:
            S = math.sqrt(1.0 + m22 - m00 - m11) * 2; # S=4*qz
            w = (m10 - m01) / S;
            x = (m02 + m20) / S;
            y = (m12 + m21) / S;
            z = 0.25 * S;
            pass
        q[0]=x; q[1]=y; q[2]=z; q[3]=w;
        return q;
    #f scale
    def scale(a:Mat4, x:Mat4, s:Sequence[float]) -> Mat4:
        for i in range(4):
            cs=1.
            if i<len(s): cs=s[i]
            for j in range(4):
                a[4*i+j] = x[4*i+j]*cs;
                pass
            pass
        return a;
    #f translate - translate by v *in matrix axes*
    # Same as postmultiply by [1 0 0 v0], [0 1 0 v1], [0 0 1 v2], [0 0 0 1]
    def translate(a:Mat4, x:Mat4, v:Vec3) -> Mat4:
        a[:12] = x[:12]
        a12 = x[ 0]*v[0] + x[4+0]*v[1] + x[8+0]*v[2] + x[12+0];
        a13 = x[ 1]*v[0] + x[4+1]*v[1] + x[8+1]*v[2] + x[12+1];
        a14 = x[ 2]*v[0] + x[4+2]*v[1] + x[8+2]*v[2] + x[12+2];
        a15 = x[ 3]*v[0] + x[4+3]*v[1] + x[8+3]*v[2] + x[12+3];
        a[12+0] = a12;
        a[12+1] = a13;
        a[12+2] = a14;
        a[12+3] = a15;
        return a;
    #f perspective
    def perspective(a:Mat4, fov:float, aspect:float, near:float, far:float) -> Mat4:
        f = 1.0 / math.tan(fov*0.5);
        a.fill(0)
        a[0] = f / aspect;
        a[5] = f;
        a[11] = -1;
        nf = 1 / (near - far);
        a[10] = (far + near) * nf;
        a[14] = 2 * far * near * nf;
        return a;
    #f All done
    pass

