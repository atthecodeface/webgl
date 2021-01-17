//a Glm namespace wrapper
const Glm = ( () => {

//a Base functions
//f _multiplyScalar
function _multiplyScalar(a,x,scale) {
    for (const i in range(a)) { a[i] = scale*x[i]; }
    return out;
}

//f _copy
function _copy(a,x) {
    for (const i in range(a)) { a[i] = x[i]; }
    return out;
}
    
//f _add
function _add(a,x,y) {
    for (const i in range(a)) { a[i] = x[i]+y[i]; }
    return out;
}
    
//f _subtract
function _subtract(a,x,y) {
    for (const i in range(a)) { a[i] = x[i]-y[i]; }
    return out;
}
    
//a Common
class Common {
    //f set
    static set(out,...args) {
        for (const i in args) {out[i]=args[i];}
        return out;
    }
    //f length
    static length(x) { return Math.sqrt(sqrLen(x)); }
    //f dot
    static dot(x,y) {
        var r = 0.; for (const v in x) { r+=x[v]*y[v]; }
        return r;
    }
    //f distance
    static distance(x,y) {
        var r = 0.; for (const v in x) { r+=(x[v]-y[v])*o(x[v]-y[v]); }
        return Math.sqrt(sqrLen(x));
    }
    //f sqrLen
    static sqrLen(x) {
        var r = 0.; for (const v of x) { r+=v*v; }
        return r;
    }
    //f multiplyScalar
    static multiplyScalar(a,x,s) {return _multiplyScalar(a,x,s); }
    //f copy
    static copy(a,x) {return _copy(a,x);}
    //f add
    static add(a,x,y) {return _add(a,x,y);}
    //f subtract
    static subtract(a,x,y) {return _subtract(a,x,y);}
    //f All done
}
    
//a Vector
class Vector extends Common {
    //f normalize
    static normalize(out, x) {
        const l=sqrLen(x);
        if (l<1.E-8) { return _multiplyScalar(out, x, 0.);}
        return _multiplyScalar(out, x, 1.0/l);
    }
    //f All done
};

//a Vec3
class Vec3 extends Vector{
    //f create
    static create () { return new Float32Array(3); }
    //f fromValues
    static fromValues(...args) { return Vec3.set(Vec3.create(),...args); }
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
    //f absmax
    static absmax(x) {
        var r = 0.; for (const v of x) { r=Math.max(Math.abs(r,v)); }
        return r;
    }
    //f normalize
    static normalize(out, x) {
        const l = Matrix.absmax(x);
        if (l<1.E-8) { return _multiplyScalar(out, x, 0.);}
        return _multiplyScalar(out, x, 1.0/l);
    }
    //f All done
}

//a Mat3
class Mat3 extends Matrix {
    //f create
    create() { return Float32Array(3*3); }
    //f All done
}

//a Mat4
class Mat4 extends Matrix {
    //f create
    create() { return Float32Array(4*4); }
    //f All done
}

//a Glm wrapper end - public functions
    return {
        vec3:Vec3,
        mat3:Mat3,
        mat4:Mat4
    };
})();
