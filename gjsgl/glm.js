//a Glm namespace wrapper
const Glm = ( () => {

//a Base functions
//f _multiplyScalar
function _multiplyScalar(a,x,scale) {
    for (const i in a) { a[i] = scale*x[i]; }
    return a;
}

//f _copy
function _copy(a,x) {
    for (const i in a) { a[i] = x[i]; }
    return a;
}
    
//f _add
function _add(a,x,y) {
    for (const i in a) { a[i] = x[i]+y[i]; }
    return a;
}
    
//f _addScaled
function _addScaled(a,x,y,s) {
    for (const i in a) { a[i] = x[i]+s*y[i]; }
    return a;
}
    
//f _sqrLen
function _sqrLen(x) {
    var r = 0.; for (const v of x) { r+=v*v; }
    return r;
}

//v _temp
_temp = new Float32Array(16);    

//a Common
class Common {
    //f clone
    static clone(x) {
        const a = new Float32Array(x.length);
        return _copy(a,x);
    }
    //f set
    static set(out,...args) {
        for (const i in args) {out[i]=args[i];}
        return out;
    }
    //f distance
    static distance(x,y) {
        var r = 0.;
        for (const v in x) { r+=(x[v]-y[v])*(x[v]-y[v]); }
        return Math.sqrt(r);
    }
    //f copy
    static copy(a,x) {return _copy(a,x);}
    //f add
    static add(a,x,y) {return _add(a,x,y);}
    //f subtract
    static subtract(a,x,y) {return _addScaled(a,x,y,-1.0);}
    //f scaleAndAdd
    static scaleAndAdd(a,x,y,s)
    { return _addScaled(a,x,y,s); }
    //f All done
}
    
//a Vector
class Vector extends Common {
    //f sqrLen
    static sqrLen(x) { return _sqrLen(x); }
    //f length
    static length(x) { return Math.sqrt(_sqrLen(x)); }
    //f scale
    static scale(a,x,s) {return _multiplyScalar(a,x,s); }
    //f dot
    static dot(x,y) {
        var r = 0.; for (const v in x) { r+=x[v]*y[v]; }
        return r;
    }
    //f normalize
    static normalize(a, x) {
        const l = Vector.length(x);
        if (l<1.E-8) { return a; }
        return _multiplyScalar(a, x, 1.0/l);
    }
    //f All done
};

//a Vec2
class Vec2 extends Vector{
    //f create
    static create () { return new Float32Array(2); }
    //f fromValues
    static fromValues(...args) { return Vec2.set(Vec2.create(),...args); }
    //f length
    static length(x) { return Vector.length(x); }
    //f transformMat2
    static transformMat2(a,x,M) {
        const c0=M[0]*x[0] + M[2]*x[1];
        const c1=M[1]*x[0] + M[3]*x[1];
        a[0]=c0; a[1]=c1;
        return a;
    }
};

//a Vec3
class Vec3 extends Vector{
    //f create
    static create () { return new Float32Array(3); }
    //f fromValues
    static fromValues(...args) { return Vec3.set(Vec3.create(),...args); }
    //f length
    static length(x) { return Vector.length(x); }
    //f cross
    static cross(a,x,y) {
        const c0=x[1]*y[2]-x[2]*y[1];
        const c1=x[2]*y[0]-x[0]*y[2];
        const c2=x[0]*y[1]-x[1]*y[0];
        a[0]=c0; a[1]=c1; a[2]=c2;
        return a;
    }
    //f transformMat3
    static transformMat3(a,x,M) {
        // const c0=M[0]*x[0] + M[1]*x[1] + M[2]*x[2];
        // const c1=M[3]*x[0] + M[4]*x[1] + M[5]*x[2];
        // const c2=M[6]*x[0] + M[7]*x[1] + M[8]*x[2];
        const c0=M[0]*x[0] + M[3]*x[1] + M[6]*x[2];
        const c1=M[1]*x[0] + M[4]*x[1] + M[7]*x[2];
        const c2=M[2]*x[0] + M[5]*x[1] + M[8]*x[2];
        a[0]=c0; a[1]=c1; a[2]=c2;
        return a;
    }
};

//a Vec4
class Vec4 extends Vector{
    //f create
    static create () { return new Float32Array(4); }
    //f fromValues
    static fromValues(...args) { return Vec4.set(Vec4.create(),...args); }
    //f transformMat4
    static transformMat4(a,x,M) {
        // const c0=M[0]*x[0]  + M[1]*x[1]  + M[2]*x[2]  + M[3]*x[3];
        // const c1=M[4]*x[0]  + M[5]*x[1]  + M[6]*x[2]  + M[7]*x[3];
        // const c2=M[8]*x[0]  + M[8]*x[1]  + M[10]*x[2] + M[11]*x[3];
        // const c3=M[12]*x[0] + M[13]*x[1] + M[14]*x[2] + M[15]*x[3];
        const c0=M[0]*x[0] + M[4]*x[1] + M[8]*x[2]  + M[12]*x[3];
        const c1=M[1]*x[0] + M[5]*x[1] + M[9]*x[2]  + M[13]*x[3];
        const c2=M[2]*x[0] + M[6]*x[1] + M[10]*x[2] + M[14]*x[3];
        const c3=M[3]*x[0] + M[7]*x[1] + M[11]*x[2] + M[15]*x[3];
        a[0]=c0; a[1]=c1; a[2]=c2; a[3]=c3;
        return a;
    }
};

//a Quat
class Quat extends Vector {
    //f create
    static create () { const q=new Float32Array(4); q[3]=1.; return q;}
    //f fromValues
    static fromValues(...args) { return Quat.set(Quat.create(),...args); }
    //f length
    static length(x) { return Math.sqrt(_sqrLen(x)); }
    //f identity
    static identity(q) { q[0]=0;q[1]=0;q[2]=0;q[3]=1;return q; }
    //f invert
    static invert(q, a) {
        var l = _sqrLen(a);
        if (Math.abs(l)<1E-8) {l=0;} else {l=1/l;}
        q[0] = -a[0]*l;
        q[1] = -a[1]*l;
        q[2] = -a[2]*l;
        q[3] =  a[3]*l;
        return q;
    }
    //f conjugate
    static conjugate(q, a) {
        q[0] = -a[0];
        q[1] = -a[1];
        q[2] = -a[2];
        q[3] =  a[3];
        return q;
    }
    //f rotateX
    static rotateX(q, a, angle) {
        const s = Math.sin(angle*0.5), c=Math.cos(angle*0.5);
        const x = q[0] * c + q[3] * s;
        const y = q[1] * c + q[2] * s;
        const z = q[2] * c - q[1] * s;
        const w = q[3] * c - q[0] * s;
        q[0]=x; q[1]=y; q[2]=z; q[3]=w;
        return q;
    }
    //f rotateY
    static rotateY(q, a, angle) {
        const s = Math.sin(angle*0.5), c=Math.cos(angle*0.5);
        const x = q[0] * c - q[2] * s;
        const y = q[1] * c + q[3] * s;
        const z = q[2] * c + q[0] * s;
        const w = q[3] * c - q[1] * s;
        q[0]=x; q[1]=y; q[2]=z; q[3]=w;
        return q;
    }
    //f rotateZ
    static rotateZ(q, a, angle) {
        const s = Math.sin(angle*0.5), c=Math.cos(angle*0.5);
        const x = q[0] * c + q[1] * s;
        const y = q[1] * c - q[0] * s;
        const z = q[2] * c + q[3] * s;
        const w = q[3] * c - q[2] * s;
        q[0]=x; q[1]=y; q[2]=z; q[3]=w;
        return q;
    }
    //f multiply
    static multiply(q, a, b) {
        const x = a[0]*b[3] + a[3]*b[0] + a[1]*b[2] - a[2]*b[1];
        const y = a[1]*b[3] + a[3]*b[1] + a[2]*b[0] - a[0]*b[2];
        const z = a[2]*b[3] + a[3]*b[2] + a[0]*b[1] - a[1]*b[0];
        const w = a[3]*b[3] - a[0]*b[0] - a[1]*b[1] - a[2]*b[2];
        q[0]=x; q[1]=y; q[2]=z; q[3]=w;
        return q;
    }
    //f setAxisAngle
    static setAxisAngle(q, axis, angle) {
        const c = Math.cos(angle*0.5);
        const s = Math.sin(angle*0.5);
        q[0] = s * axis[0];
        q[1] = s * axis[1];
        q[2] = s * axis[2];
        q[3] = c
        return q;
    }
    //f All done
}

//a Matrix
class Matrix extends Common {
    //f create
    static create(n) {
        const a=new Float32Array(n*n);
        for (var i=0; i<n; i++) {a[i+i*n]=1.;}
        return a;
    }
    //f multiplyScalar
    static multiplyScalar(a,x,s) {return _multiplyScalar(a,x,s); }
    //f absmax
    static absmax(x) {
        var r = 0.; for (const v of x) { r=Math.max(Math.abs(r,v)); }
        return r;
    }
    //f normalize
    static normalize(a, x) {
        const l = Matrix.absmax(x);
        if (l<1.E-8) { return _multiplyScalar(a, x, 0.);}
        return _multiplyScalar(a, x, 1.0/l);
    }
    //f multiply
    static multiply(a, x, y, n) {
        for (var ai=0; ai<n; ai++) {
            for (var aj=0; aj<n; aj++) {
                var s=0.;
                for (var i=0; i<n; i++) {
                    // s += x[aj*n+i]*y[ai+i*n];
                    s += y[aj*n+i]*x[ai+i*n];
                }
                _temp[ai+aj*n] = s;
            }
        }
        for (const i in a) {
            a[i]=_temp[i];
        }
    }
    //f All done
}

//a Mat2
class Mat2 extends Matrix {
    //f create
    static create() { return Matrix.create(2); }
    //f multiply
    static multiply(a, x, y) { return Matrix.multiply(a,x,y,2); }
    //f determinant
    static determinant(x) { return x[0]*x[3]-x[1]*x[2]; }
    //f invert
    static invert(a,x) {
        var d = Mat2.determinant(x);
        if (Math.abs(d)>1.E-8) {d=1/d;}
        _temp[0] = x[3]*d;
        _temp[1] = -x[1]*d;
        _temp[2] = -x[2]*d;
        _temp[3] = x[0]*d;
        return _copy(a,_temp);
    }
    //f All done
}

//a Mat3
class Mat3 extends Matrix {
    //f create
    static create() { return Matrix.create(3); }
    //f multiply
    static multiply(a, x, y) { return Matrix.multiply(a,x,y,3); }
    //f determinant
    static determinant(x) {
        return (x[0]*(x[4]*x[8] - x[5]*x[7]) +
                x[1]*(x[5]*x[6] - x[3]*x[8]) +
                x[2]*(x[3]*x[7] - x[4]*x[6]) );
    }
    //f invert
    static invert(a,x) {
        var d = Mat3.determinant(x);
        if (Math.abs(d)>1.E-8) {d=1/d;}
        _temp[0] = (x[3+1]*x[6+2] - x[3+2]*x[6+1])*d;
        _temp[1] = (x[3+2]*x[6+0] - x[3+0]*x[6+2])*d;
        _temp[2] = (x[3+0]*x[6+1] - x[3+1]*x[6+0])*d;

        _temp[3] = (x[6+1]*x[0+2] - x[6+2]*x[0+1])*d;
        _temp[4] = (x[6+2]*x[0+0] - x[6+0]*x[0+2])*d;
        _temp[5] = (x[6+0]*x[0+1] - x[6+1]*x[0+0])*d;

        _temp[6] = (x[0+1]*x[3+2] - x[0+2]*x[3+1])*d;
        _temp[7] = (x[0+2]*x[3+0] - x[0+0]*x[3+2])*d;
        _temp[8] = (x[0+0]*x[3+1] - x[0+1]*x[3+0])*d;

        return _copy(a,_temp);
    }
    //f All done
}

//a Mat4
class Mat4 extends Matrix {
    //f create
    static create() { return Matrix.create(4); }
    //f multiply
    static multiply(a, x, y) { return Matrix.multiply(a,x,y,4); }
    //f determinant
    static determinant(x) {
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
    }
    //f invert
    static invert(a,x) {
        const x00 = x[ 0], x01 = x[ 1], x02 = x[ 2], x03 = x[ 3];
        const x10 = x[ 4], x11 = x[ 5], x12 = x[ 6], x13 = x[ 7];
        const x20 = x[ 8], x21 = x[ 9], x22 = x[10], x23 = x[11];
        const x30 = x[12], x31 = x[13], x32 = x[14], x33 = x[15];
        const b00 = x00 * x11 - x01 * x10;
        const b01 = x00 * x12 - x02 * x10;
        const b02 = x00 * x13 - x03 * x10;
        const b03 = x01 * x12 - x02 * x11;
        const b04 = x01 * x13 - x03 * x11;
        const b05 = x02 * x13 - x03 * x12;
        const b06 = x20 * x31 - x21 * x30;
        const b07 = x20 * x32 - x22 * x30;
        const b08 = x20 * x33 - x23 * x30;
        const b09 = x21 * x32 - x22 * x31;
        const b10 = x21 * x33 - x23 * x31;
        const b11 = x22 * x33 - x23 * x32;
        var d = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
        if (!Math.abs(d)>1E-8) {d=1/d;}
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
    }
    //f fromQuat
    static fromQuat(a, q) {
        const x=q[0], y=q[1], z=q[2], w=q[3];
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
    }
    //f getRotation
    // from www.euclideanspace
    static getRotation(q, m) {
        const lr0 = 1.0/Math.hypot(m[0+0], m[4+0], m[8+0]);
        const lr1 = 1.0/Math.hypot(m[0+1], m[4+1], m[8+1]);
        const lr2 = 1.0/Math.hypot(m[0+2], m[4+2], m[8+2]);
        const m00 = m[0]*lr0, m10=m[1]*lr1, m20=m[ 2]*lr2;
        const m01 = m[4]*lr0, m11=m[5]*lr1, m21=m[ 6]*lr2;
        const m02 = m[8]*lr0, m12=m[9]*lr1, m22=m[10]*lr2;
        const tr = m00 + m11 + m22;
        var w,x,y,z;
        if (tr > 0) { 
            const S = Math.sqrt(tr+1.0) * 2; // S=4*qw 
            w = 0.25 * S;
            x = (m21 - m12) / S;
            y = (m02 - m20) / S; 
            z = (m10 - m01) / S; 
        } else if ((m00 > m11)&(m00 > m22)) { 
            const S = Math.sqrt(1.0 + m00 - m11 - m22) * 2; // S=4*qx 
            w = (m21 - m12) / S;
            x = 0.25 * S;
            y = (m01 + m10) / S; 
            z = (m02 + m20) / S; 
        } else if (m11 > m22) { 
            const S = Math.sqrt(1.0 + m11 - m00 - m22) * 2; // S=4*qy
            w = (m02 - m20) / S;
            x = (m01 + m10) / S; 
            y = 0.25 * S;
            z = (m12 + m21) / S; 
        } else { 
            const S = Math.sqrt(1.0 + m22 - m00 - m11) * 2; // S=4*qz
            w = (m10 - m01) / S;
            x = (m02 + m20) / S;
            y = (m12 + m21) / S;
            z = 0.25 * S;
        }
        q[0]=x; q[1]=y; q[2]=z; q[3]=w;
        return q;
    }
    //f scale
    static scale(a, x, s) {
        for (var i=0; i<4; i++) {
            const cs=(i>=s.length)?1:s[i];
            for (var j=0; j<4; j++) {
                a[4*i+j] = x[4*i+j]*cs;
            }
        }
        return a;
    }
    //f translate - translate by v *in matrix axes*
    // Same as postmultiply by [1 0 0 v0], [0 1 0 v1], [0 0 1 v2], [0 0 0 1]
    static translate(a, x, v) {
        for (var i=0; i<12; i++) {
            a[i]=x[i];
        }
        a[12+0] = x[ 0]*v[0] + x[4+0]*v[1] + x[8+0]*v[2] + x[12+0];
        a[12+1] = x[ 1]*v[0] + x[4+1]*v[1] + x[8+1]*v[2] + x[12+1];
        a[12+2] = x[ 2]*v[0] + x[4+2]*v[1] + x[8+2]*v[2] + x[12+2];
        a[12+3] = x[ 3]*v[0] + x[4+3]*v[1] + x[8+3]*v[2] + x[12+3];
        return a;
    }
    //f perspective
    static perspective(a, fov, aspect, near, far) {
        const f = 1.0 / Math.tan(fov*0.5);
        for (const i in a) {a[i]=0;}
        a[0] = f / aspect;
        a[5] = f;
        a[11] = -1;
        if (far===undefined) {
            a[10] = -1;
            a[14] = -2 * near;
        } else {
            const nf = 1 / (near - far);
            a[10] = (far + near) * nf;
            a[14] = 2 * far * near * nf;
        }
        return a;
    }
    //f All done
}

//a Glm wrapper end - public functions
    return {
        quat:Quat,
        vec2:Vec2,
        vec3:Vec3,
        mat2:Mat2,
        mat3:Mat3,
        mat4:Mat4
    };
})();

// a0.(b1. (c2.d3 - c3.d2) + b2.(c3.d1 - c1.d3) + b3.(c1.d2 - c2.d1) )
// a0 . . .
// . b1 . .
// . . c2 c3
// . . d2 d3
