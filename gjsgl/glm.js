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

//a Common
class Common {
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
    //f multiplyScalar
    static multiplyScalar(a,x,s) {return _multiplyScalar(a,x,s); }
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
};

//a Matrix
class Matrix extends Common {
    //f create
    static create(n) {
        const a=new Float32Array(n*n);
        for (var i=0; i<n; i++) {a[i+i*n]=1.;}
        return a;
    }
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
    //f All done
}

//a Mat3
class Mat3 extends Matrix {
    //f create
    static create() { return Matrix.create(3); }
    //f All done
}

//a Mat4
class Mat4 extends Matrix {
    //f create
    static create() { return Matrix.create(4); }
    //f All done
}

//a Glm wrapper end - public functions
    return {
        vec3:Vec3,
        mat3:Mat3,
        mat4:Mat4
    };
})();
