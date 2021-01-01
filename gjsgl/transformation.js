class Transformation {
    constructor(translation, quaternion, scale) {
        if (translation === undefined) {
            this.translation = vec3.create();
        } else {
            this.translation = vec3.create();
            vec3.copy(this.translation, translation);
        }
        if (quaternion === undefined) {
            this.quaternion  = quat.create();
        } else {
            this.quaternion  = quat.create();
            quat.copy(this.quaternion, quaternion);
        }
        if (scale === undefined) {
            this.scale       = vec3.set(vec3.create(),1.,1.,1.);
        } else {
            this.scale = vec3.create();
            vec3.copy(this.scale,scale);
        }
    }
    copy(other) {
        quat.copy(this.quaternion,  other.quaternion);
        vec3.copy(this.translation, other.translation);
        vec3.copy(this.scale,       other.scale);
    }
    set(base, other) {
        quat.multiply(this.quaternion, base.quaternion, other.quaternion);
        vec3.add(this.translation, base.translation, other.translation);
        for (var i=0; i<3; i++) {
            this.scale[i] = base.scale[i] * other.scale[i];
        }
    }
    mat4() {
        var m = mat4.create();
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
}

