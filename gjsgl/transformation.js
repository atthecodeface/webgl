function quaternion_to_euler(q) {
    const x=q[0], y=q[1], z=q[2], w=q[3];
    const test = x*y + z*w;

    var heading, attitude, bank;
    heading = NaN;
    if (test > 0.499999) {
        heading  = 2*Math.atan2(x,w);
        attitude = Math.PI/2;
        bank = 0;
    }
    else if (test < -0.499999) {
        heading  = -2*Math.atan2(x,w);
        attitude = -Math.PI/2;
        bank = 0;
    }
    if(isNaN(heading)){
        const x2 = x*x;
        const y2 = y*y;
        const z2 = z*z;
        heading  = Math.atan2(2*y*w - 2*x*z , 1 - 2*y2 - 2*z2);
        attitude = Math.asin(2*test);
        bank     = Math.atan2(2*x*w - 2*y*z , 1 - 2*x2 - 2*z2);
    }
    return [bank, heading, attitude];
}
// quaternion_of_rotation
function quaternion_of_rotation(rotation) {
    const rot_min_id   = mat3.subtract(mat3.create(), rotation, mat3.multiplyScalar(mat3.create(),mat3.create(),0.99999));
    const rot_min_id_i = mat3.invert(mat3.create(), rot_min_id);
    var axis = Glm.vec3.create();
    for (var j=0; j<3; j++) {
        var v = Glm.vec3.create();
        var last_v = Glm.vec3.copy(Glm.vec3.create(),v);
        v[j] = 1.;
        for (i=0; i<10; i++) {
            Glm.vec3.copy(last_v,v);
            Glm.vec3.normalize(v,Glm.vec3.transformMat3(v,v,rot_min_id_i));
        }
        Glm.vec3.copy(axis,v);
        const dist2 = Glm.vec3.sqrLen(Glm.vec3.subtract(v,v,last_v));
        if (dist2<0.00001) {break;}
    }

    var w = Glm.vec3.fromValues(1.0,0,0);
    if ((axis[0]>0.9) || (axis[0]<-0.9)) {w = Glm.vec3.fromValues(0,1.0,0);}
    const na0 = Glm.vec3.normalize(Glm.vec3.create(), Glm.vec3.cross(Glm.vec3.create(), w, axis));
    const na1 = Glm.vec3.cross(Glm.vec3.create(), axis, na0);

    // Rotate w_perp_n around the axis of rotation by angle A
    const na0_r = Glm.vec3.transformMat3(Glm.vec3.create(), na0, rotation);
    const na1_r = Glm.vec3.transformMat3(Glm.vec3.create(), na1, rotation);

    // Get angle of rotation
    const cos_angle =  Glm.vec3.dot(na0, na0_r);
    const sin_angle = -Glm.vec3.dot(na0, na1_r);
    const angle = Math.atan2(sin_angle, cos_angle);

    // Set quaternion
    return quat.setAxisAngle(quat.create(), axis, angle);
}

//a TransMat
class TransMat {
    //f constructor
    constructor(mat) {
        if (mat === undefined) {
            this.mat = Glm.mat4.create();
        } else {
            this.mat = mat;
        }
    }
    //f mat4
    mat4() {
        return this.mat;
    }
    //f mat_after
    mat_after(pre_mat) {
        return new TransMat(mat4.multiply(Glm.mat4.create(),pre_mat.mat,this.mat));
    }
    //f All done
}

//a Transformation
class Transformation {
    constructor(translation, quaternion, scale) {
        this.translation = Glm.vec3.create();
        this.quaternion  = quat.create();
        this.scale       = Glm.vec3.set(Glm.vec3.create(),1.,1.,1.);
        if (translation !== undefined) {
            Glm.vec3.copy(this.translation, translation);
        }
        if (quaternion !== undefined) {
            quat.copy(this.quaternion, quaternion);
        }
        if (scale !== undefined) {
            Glm.vec3.copy(this.scale,scale);
        }
    }
    //f copy
    copy(other) {
        quat.copy(this.quaternion,  other.quaternion);
        Glm.vec3.copy(this.translation, other.translation);
        Glm.vec3.copy(this.scale,       other.scale);
    }
    //f set
    set(base, other) {
        quat.multiply(this.quaternion, base.quaternion, other.quaternion);
        Glm.vec3.add(this.translation, base.translation, other.translation);
        for (var i=0; i<3; i++) {
            this.scale[i] = base.scale[i] * other.scale[i];
        }
    }
    //f translate
    translate(t, scale) {
        vec3.scaleAndAdd(this.translation, this.translation, t, scale);
    }
    //f rotate
    rotate(self, axis, angle) {
        const q = quat.setAxisAngle(quat.create(), axis, angle);
        quat.multiply(this.quaternion , this.quaternion);
        quat.multiply(this.translation, this.translation);
    }
    //f mat4
    mat4() {
        var m = Glm.mat4.create();
        mat4.fromQuat(m, this.quaternion);
        m[12] += this.translation[0];
        m[13] += this.translation[1];
        m[14] += this.translation[2];
        for (var i=0; i<3; i++) {
            m[4*i+0] *= this.scale[i];
            m[4*i+1] *= this.scale[i];
            m[4*i+2] *= this.scale[i];
        }
        return m;
    }
    //f from_mat4
    from_mat4(m) {
        this.translation = Glm.vec3.fromValues(m[3*4+0], m[3*4+1], m[3*4+2]);
        var rotation = mat3.create();
        for (var i=0; i<3; i++) {
            const v = Glm.vec3.fromValues(m[4*i+0],m[4*i+1],m[4*i+2]);
            const l = Glm.vec3.length(v);
            this.scale[i] = l;
            rotation[3*i+0] = v[0]/l;
            rotation[3*i+1] = v[1]/l;
            rotation[3*i+2] = v[2]/l;
        }
        this.quaternion = quaternion_of_rotation(rotation);
    }
    //f trans_mat
    trans_mat() {
        return new TransMat(this.mat4());
    }
    //f trans_mat_after
    trans_mat_after(pre_mat) {
        return new TransMat(mat4.multiply(Glm.mat4.create(),pre_mat.mat,this.mat4()));
    }
    //f distance
    distance(other) {
        const td = Glm.vec3.distance(this.translation, other.translation);
        const sd = Glm.vec3.distance(this.scale, other.scale);
        const qn = quat.multiply(quat.create(),quat.invert(quat.create(),this.quaternion),other.quaternion);
        if (qn[3]>0) {quat.scale(qn,qn,-1);}
        const qd = quat.length(quat.add(quat.create(),qn,quat.create()));
        return td+sd+qd;
    }
    //f str
    str() {
        return "trans "+this.translation+":"+this.scale+":"+this.quaternion;
    }
    //f All done
}

