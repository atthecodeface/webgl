//a Bone class
//c Bone
class Bone {
    //f constructor
    constructor(parent, transformation, matrix_index) {
        this.parent = parent;
        if (parent !== undefined) { parent.children.push(this); }
        this.children = new Array();
        if (transformation===undefined) {transformation = new Transformation();}
        if (matrix_index===undefined) { matrix_index=-1;}
        this.matrix_index   = matrix_index;
        this.transformation = new Transformation();
        this.btp = Glm.mat4.create(); // derived from translation and quaternion
        this.ptb = Glm.mat4.create();
        this.mtb = Glm.mat4.create();
        this.set_transformation(transformation);
    }
    //f iter_hierarchy
    *iter_hierarchy() {
        yield(this);
        for (const c of this.children) {
            for (const cc of c.iter_hierarchy()) {
                yield(cc);
            }
        }
    }
    //f enumerate_hierarchy
    enumerate_hierarchy() {
        var max_index = 0;
        var bone_count = 0;
        for (const b of this.iter_hierarchy()) {
            if (b.matrix_index>=max_index) {
                max_index = b.matrix_index + 1;
            }
            bone_count += 1;
        }
        return [bone_count, max_index];
    }
    //f set_transformation
    set_transformation(transformation) {
        this.transformation.set(this.transformation, transformation);
    }
    //f derive_matrices
    derive_matrices() {
        Glm.mat4.copy(this.btp, this.transformation.mat4());
        Glm.mat4.invert(this.ptb, this.btp);
        if (this.parent == null) {
            Glm.mat4.copy(this.mtb, this.ptb);
        } else {
            Glm.mat4.multiply(this.mtb, this.ptb, this.parent.mtb);
        }
        for (const c of this.children) {
            c.derive_matrices();
        }
    }
    //f hier_debug
    hier_debug(hier) {
        hier.add("Bone "+this.matrix_index);
        hier.push();
        hier.add(this.transformation.str());
        if (this.ptb !== undefined) {hier.add("parent-to-bone: "+this.ptb);}
        if (this.mtb !== undefined) {hier.add("mesh-to-bone: "+this.mtb);}
        for (const c of this.children) {
            c.hier_debug(hier);
        }
        hier.pop();
        return hier;
    }
    //f str
    str() {return this.hier_debug(new Hierarchy()).str();}
    //f All done
}

//c BoneSet
class BoneSet {
    //f constructor
    constructor() {
        this.bones = [];
        this.roots = [];
    }
    //f add_bone
    add_bone(bone) {
        if (bone.parent === undefined) {this.roots.push(this.bones.length);}
        this.bones.push(bone);
        return bone;
    }
    //f derive_matrices
    derive_matrices() {
        for (const r of this.roots) {
            this.bones[r].derive_matrices();
        }
    }
    //f add_bone_hierarchy
    add_bone_hierarchy(root) {
        for (const b of root.iter_hierarchy()) {
            this.add_bone(b);
        }
    }
    //f iter_roots
    *iter_roots() {
        for (const r of this.roots) {
            yield(this.bones[r]);
        }
    }
    //f rewrite_indices
    rewrite_indices() {
        for (const i in this.bones) {
            this.bones[i].matrix_index = i;
        }
    }
    //f hier_debug
    hier_debug(hier) {
        hier.add("BoneSet "+this.roots);
        hier.push();
        for (const b of this.iter_roots()) {
            b.hier_debug(hier);
        }
        hier.pop();
        return hier;
    }
    //f str
    str() {return this.hier_debug(new Hierarchy()).str();}
    //f All done
}

//c BonePose
class BonePose {
    //f pose_bones
    static pose_bones(bone, parent) {
        pose = new BonePose(bone, parent);
        for (b of bone.children) {
            x = BonePose.pose_bones(b, pose);
        }
        return pose;
    }
    //f constructor
    constructor(bone, parent) {
        this.parent = parent;
        if (parent !== undefined) { parent.children.push(this); }
        this.children = [];
        this.bone = bone;
        this.transformation = new Transformation();
        this.transformation_reset();

        this.btp = Glm.mat4.create(); // derived from translation and quaternion
        this.ptb = Glm.mat4.create();
        this.animated_btm = Glm.mat4.create();
        this.animated_mtm = Glm.mat4.create();
    }
    //f set_parent
    set_parent(parent) {
        this.parent = parent;
        parent.children.push(this);
    }
    //f iter_hierarchy
    *iter_hierarchy() {
        yield(this);
        for (const c of this.children) {
            for (const cc of c.iter_hierarchy()) {
                yield(cc);
            }
        }
    }
    //f transformation_reset
    transformation_reset() {
        this.transformation.copy(this.bone.transformation);
    }
    //f transform
    transform(transform) {
        this.transformation.set(this.transformation, transform);
    }
    //f derive_animation
    derive_animation() {
        Glm.mat4.copy(this.btp, this.transformation.mat4());
        if (this.parent == null) {
            Glm.mat4.copy(this.animated_btm, this.btp);
        } else {
            Glm.mat4.multiply(this.animated_btm, this.parent.animated_btm, this.btp);
        }
        Glm.mat4.multiply(this.animated_mtm, this.animated_btm, this.bone.mtb);
        for (const c of this.children) {
            c.derive_animation();
        }
    }
    //f hier_debug
    hier_debug(hier) {
        hier.add("Pose "+this.bone.matrix_index);
        hier.push();
        hier.add(this.transformation.str());
        hier.add("parent-to-bone: "+this.ptb);
        hier.add("bone-to-parent: "+this.btp);
        hier.add("bone-to-mesh  : "+this.animated_btm);
        hier.add("mesh-to-mesh  : "+this.animated_mtm);
        for (const c of this.children) {
            c.hier_debug(hier);
        }
        hier.pop();
        return hier;
    }
    //f str
    str() {return this.hier_debug(new Hierarchy()).str();}
    //f All done
}

//c BonePoseSet
class BonePoseSet {
    //f constructor
    constructor(bones) {
        this.bones = bones;
        this.poses = [];
        const bone_to_pose_dict = new Map();
        for (const b of this.bones.bones) {
            const pose = new BonePose(b);
            bone_to_pose_dict.set(b, pose);
            this.poses.push(pose);
        }
        for ( const [bone, pose] of this.iter_bones_and_poses() ) {
            if (bone.parent !== undefined) {
                const parent_pose = bone_to_pose_dict.get(bone.parent);
                pose.set_parent(parent_pose);
            }
        }
        var max_index = -1;
        for (const bone of this.bones.iter_roots()) {
            const [_,max] = bone.enumerate_hierarchy();
            if (max>max_index) {max_index=max;}
        }
        if (max_index<1) {max_index=1;}
        this.data = new Float32Array(max_index*16);
        this.max_index = max_index;
        this.last_updated = -1;
    }
    //f iter_bones_and_poses
    *iter_bones_and_poses() {
        for (const i in this.poses) {
            yield( [this.bones.bones[i], this.poses[i]] );
        }
    }        
    //f derive_animation
    derive_animation() {
        for (const i of this.bones.roots) {
            this.poses[i].derive_animation();
        }
    }
    //f update
    update(tick) {
        if (tick==this.last_updated) {return;}
        this.last_updated = tick;
        this.derive_animation();
        for (const [bone,pose] of this.iter_bones_and_poses()) {
            if (bone.matrix_index<0) {continue;}
            const base = bone.matrix_index*16;
            this.data.subarray(base, base+16).set(pose.animated_mtm);
        }
    }
    //f hier_debug
    hier_debug(hier) {
        hier.add("BonePoseSet "+this.bones.roots+" "+this.max_index+" "+this.last_updated+" "+this.data);
        hier.push();
        this.bones.hier_debug(hier);
        for (const i of this.bones.roots) {
            this.poses[i].hier_debug(hier);
        }
        hier.pop();
        return hier;
    }
    //f str
    str() {return this.hier_debug(new Hierarchy()).str();}
    //f All done
}
//c Frontend
var GL;
class Frontend {
    constructor() {
        const canvas = document.querySelector("#glcanvas");
        const gl     = canvas.getContext("webgl2");
        if (!gl) { alert("Unable to start webgl"); }
        GL = gl;
        document.addEventListener("keydown",     (k) => this.key(k) );
        document.addEventListener("keyup",       (k) => this.key(k) );
        canvas.addEventListener("mousedown", (m) => this.mouse(m) );
        canvas.addEventListener("mouseup",   (m) => this.mouse(m) );
        canvas.addEventListener("mousemove", (m) => this.mouse(m) );
        canvas.addEventListener("touchstart",  (t) => this.touch(t), false);
        canvas.addEventListener("touchend",    (t) => this.touch(t), false);
        canvas.addEventListener("touchcancel", (t) => this.touch(t), false);
        canvas.addEventListener("touchmove",   (t) => this.touch(t), false);

        this.animating = false;
        this.run_step_pending = false;
        this.time_last = 0.;
        this.time = 0.;
        this.keys_down = new Set();
        this.key_mods = 0;
        this.buttons_down = 0;
        this.mouse_pos_drag_start = [0.,0.];
        this.mouse_pos = [0.,0.];
        this.touches = new Map();
    }
    //f run
    run() {
        const promise = this.init();
        promise.then( (x) => {
            console.log("Frontend initialized");
            this.gl_ready();
            console.log("Frontend GL ready");
            this.set_animating(true);
        } );
    }
    //f gl_ready
    gl_ready() {
        console.log("Do GL ready stuff");
    }
    //f set_animating
    set_animating(a) {
        console.log("Set animating",a);
        if (a) {
            if (this.run_step_pending) {return;}
            this.animating = true;
            this.init_time = Date.now();
            this.run_step();
        } else {
            this.animating = false;
        }
    }
    //f run_step
    run_step() {
        this.run_step_pending = false;
        if (this.animating) {
            this.time_last = this.time;
            this.time = (Date.now() - this.init_time) * 0.001;
            this.handle_tick(this.time, this.time_last);
            requestAnimationFrame(()=>this.run_step());
            this.run_step_pending = true;
        }
    }
    //f key
    key(event) {
        const key = event.keyCode;
        const press = (event.type!="keyup");
        const scancode = 0;
        const mods = (event.shiftKey?1:0)  | (event.ctrlKey?2:0) | (event.altKey?4:0);
        this.key_mods = mods;
        if ((key==81) && (mods&2) && press) {this.set_animating(!this.animating);}
        if (press) {
            this.keys_down.add(key);
        } else {
            this.keys_down.delete(key);
        }
        this.key_fn(key, scancode, press, mods);
    }
    //f key_fn
    key_fn(key, scancode, press, mods) {
        console.log(""+key+" "+scancode+" "+press+" "+mods);
    }
    //f mouse
    mouse(event) {
        const xpos = event.offsetX;
        const ypos = event.offsetY;
        const mods = (event.shiftKey?1:0)  | (event.ctrlKey?2:0) | (event.altKey?4:0);
        this.key_mods = mods;
        if (event.type=="mousemove") {
            this.cursor_fn(xpos, ypos);
        } else {
            if (event.type=="mousedown") {
                this.buttons_down |= 1<<event.button;
            } else if (event.type=="mouseup") {
                this.buttons_down &= ~1<<event.button;
            }
            this.mouse_button_fn(xpos, ypos, event.button, event.type, mods);
        }
        this.mouse_pos = [xpos, ypos];
    }
    //f touch
    touch(event) {
        const mods = (event.shiftKey?1:0)  | (event.ctrlKey?2:0) | (event.altKey?4:0);
        if (event.type=="touchstart") {
            event.preventDefault();
            for (const t of event.changedTouches) {
                this.touches.set(t.identifier,this.touch_start(t.identifier, t.pageX, t.pageY, mods));
            }
        } else if (event.type=="touchmove") {
            for (const t of event.changedTouches) {
                const handle = this.touches.get(t.identifier);
                this.touch_fn(handle, t.identifier, t.pageX, t.pageY, 1, mods);
            }
        } else if (event.type=="touchend") {
            for (const t of event.changedTouches) {
                const handle = this.touches.get(t.identifier);
                this.touch_fn(handle, t.identifier, t.pageX, t.pageY, 2, mods);
                this.touches.delete(t.identifier);
            }
        } else if (event.type=="touchcancel") {
            for (const t of event.changedTouches) {
                const handle = this.touches.get(t.identifier);
                this.touch_fn(handle, t.identifier, t.pageX, t.pageY, 3, mods);
                this.touches.delete(t.identifier);
            }
        }
    }
    //f cursor_fn
    cursor_fn(xpos, ypos) {
        console.log(this.mouse_pos+" "+this.mouse_pos_drag_start+" "+this.buttons_down+" "+this.key_mods);
    }
    //f mouse_button_fn
    mouse_button_fn(xpos, ypos, button, action, mods) {
        console.log(this.mouse_pos+" "+this.mouse_pos_drag_start+" "+button+" "+mods);
    }
    //f touch_start
    touch_start(touch_id, xpos, ypos, mods) {
        return touch_id;
    }
    //f touch_fn
    touch_fn(touch_handle, touch_id, xpos, ypos, action, mods) {
    }
    //f All done
}

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
        const x = a[0] * c + a[3] * s;
        const y = a[1] * c + a[2] * s;
        const z = a[2] * c - a[1] * s;
        const w = a[3] * c - a[0] * s;
        q[0]=x; q[1]=y; q[2]=z; q[3]=w;
        return q;
    }
    //f rotateY
    static rotateY(q, a, angle) {
        const s = Math.sin(angle*0.5), c=Math.cos(angle*0.5);
        const x = a[0] * c - a[2] * s;
        const y = a[1] * c + a[3] * s;
        const z = a[2] * c + a[0] * s;
        const w = a[3] * c - a[1] * s;
        q[0]=x; q[1]=y; q[2]=z; q[3]=w;
        return q;
    }
    //f rotateZ
    static rotateZ(q, a, angle) {
        const s = Math.sin(angle*0.5), c=Math.cos(angle*0.5);
        const x = a[0] * c + a[1] * s;
        const y = a[1] * c - a[0] * s;
        const z = a[2] * c + a[3] * s;
        const w = a[3] * c - a[2] * s;
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
    //f getAxisAngle
    static getAxisAngle(axis, q) {
        const angle = Math.acos(q[3]);
        axis[0] = q[0];
        axis[1] = q[1];
        axis[2] = q[2];
        Vec3.normalize(axis,axis);
        return angle;
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
//a GLTF namespace wrapper
const GLTF = ( () => {
    
//a GLTF enumerations
class Enum {
    of_enum(num)  {return this.enum_to_cls[num];}
    of_name(name) {return this.name_to_cls[name];}
    constructor(enums) {
        this.enum_to_cls = {};
        this.name_to_cls = {};
        for (const e of enums) {
            this.enum_to_cls[e.num]  = e;
            this.name_to_cls[e.name] = e;
        }
    }
}

VTByte   = {num:5120, size:1, gl_type:(GL)=>GL.BYTE, name:"BYTE"};
VTUByte  = {num:5121, size:1, gl_type:(GL)=>GL.UNSIGNED_BYTE, name:"UNSIGNED_BYTE"};
VTShort  = {num:5122, size:2, gl_type:(GL)=>GL.SHORT, name:"SHORT"};
VTUShort = {num:5123, size:2, gl_type:(GL)=>GL.UNSIGNED_SHORT, name:"UNSIGNED_SHORT"};
VTUInt   = {num:5125, size:4, gl_type:(GL)=>GL.UNSIGNED_INT, name:"UNSIGNED_INT"};
VTFloat  = {num:5126, size:4, gl_type:(GL)=>GL.FLOAT, name:"FLOAT"};
class ValueType extends Enum{
    constructor() {
        const enums = [
            VTByte,
            VTUByte,
            VTShort,
            VTUShort,
            VTUInt,
            VTFloat,
        ];
        super(enums);
    }
}

const ValueTypes = new ValueType();

CTScalar     = { num:1, size:1,  name:"SCALAR"};
CTVec2Scalar = { num:2, size:2,  name:"VEC2"};
CTVec3Scalar = { num:3, size:3,  name:"VEC3"};
CTVec4Scalar = { num:4, size:4,  name:"VEC4"};
CTMat2Scalar = { num:5, size:4,  name:"MAT2"};
CTMat3Scalar = { num:6, size:9,  name:"MAT3"};
CTMat4Scalar = { num:7, size:16, name:"MAT4"};

class CompType extends Enum{
    constructor() {
        const enums = [
        CTScalar,
        CTVec2Scalar,
        CTVec3Scalar,
        CTVec4Scalar,
        CTMat2Scalar,
        CTMat3Scalar,
        CTMat4Scalar,
        ];
        super(enums);
    }
}
const CompTypes = new CompType();

    /*
class BViewTgt(Enum): pass
class BVTArray(BViewTgt): enum=34962; name="ARRAY_BUFFER"
class BVTIndex(BViewTgt): enum=34963; name="ELEMENT_ARRAY_BUFFER"
*/

PTPoints        = { num:0, gl_type:(GL)=>GL.POINTS,         name:"POINTS"};
PTLines         = { num:1, gl_type:(GL)=>GL.LINES,          name:"LINES"};
PTLineLoop      = { num:2, gl_type:(GL)=>GL.LINE_LOOP,      name:"LINE_LOOP"};
PTLineStrip     = { num:3, gl_type:(GL)=>GL.LINE_STRIP,     name:"LINE_STRIP"};
PTTriangles     = { num:4, gl_type:(GL)=>GL.TRIANGLES,      name:"TRIANGLES"};
PTTriangleStrip = { num:5, gl_type:(GL)=>GL.TRIANGLE_STRIP, name:"TRIANGLE_STRIP"};
PTTriangleFan   = { num:6, gl_type:(GL)=>GL.TRIANGLE_FAN,   name:"TRIANGLE_FAN"};

class PrimitiveType extends Enum{
    constructor() {
        const enums = [
            PTPoints,
            PTLines,
            PTLineLoop,
            PTLineStrip,
            PTTriangles,
            PTTriangleStrip,
            PTTriangleFan,
        ];
        super(enums);
    }
}
const PrimitiveTypes = new PrimitiveType();

//a Useful functions
function def (a,b) {
    if (a!==undefined) {return a;} else {return b;}
}
function do_if (a,f) {
    if (a!==undefined) {f(a);}
}

//a Data classes
//c Buffer
class Buffer {
    //f constructor
    constructor(json) {
        this.name   = json.name;
        this.uri    = json.uri;
        this.load_promise = fetch(this.uri).then(
            (response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch "+this.uri);
                } else {
                    return response.arrayBuffer();
                }
            }).then( (data) => {this.data=data;} );
    }
    //f init
    init() {
        return this.load_promise;
    }
    //f All done
}

//c BufferView
class BufferView {
    //f constructor
    constructor(gltf, json) {
        this.buffer = gltf.get_buffer(json.buffer);
        this.name   = def(json.name, "");
        this.stride = def(json.byteStride,0);
        this.offset = def(json.byteOffset,0);
        this.length = def(json.byteLength,0);
        this.target = def(json.target,0);
    }
    //f All done
}

//c Accessor
class Accessor {
    //f constructor
    constructor(gltf, json) {
        this.view       = gltf.get_buffer_view(json["bufferView"]);
        this.name      = def(json.name,"");
        this.offset    = def(json.byteOffset,0);
        this.acc_type  = CompTypes.of_name(def(json.type,"SCALAR"));
        this.comp_type = ValueTypes.of_enum(def(json.componentType,5120));
        this.count     = def(json.count,0);
    }
    //f to_model_buffer_view
    to_model_buffer_view() {
        const data        = this.view.buffer.data;
        const byte_offset = this.view.offset;
        const byte_length = this.view.length;
        const stride      = this.view.stride;
        const offset      = this.offset;
        const count       = this.acc_type.size; //# e.g. 3 for VEC3
        const gl_type     = this.comp_type.gl_type(GL); // e.g. of GL_FLOAT
        // console.log("Creating attributes of "+gl_type+" "+byte_offset+", "+byte_length+", "+data[byte_offset:byte_offset+byte_length]);
        const model_data  = new ModelBufferData(data, byte_offset, byte_length);
        return new ModelBufferView(model_data, count, gl_type, offset, stride);
    }
    //f to_model_buffer_indices
    to_model_buffer_indices() {
        const data        = this.view.buffer.data;
        const byte_offset = this.view.offset;
        const byte_length = this.view.length;
        // console.log("Creating indices of "+this.comp_type.gl_type+" "+byte_offset+", "+byte_length+", ",data);
        return new ModelBufferIndices(data, byte_offset, byte_length);
    }
    //f All done
}

//c GltfImage
class GltfImage {
    //f constructor
    constructor(json) {
        this.name        = def(json.name,"");
        this.uri         = json.uri;
        this.buffer_view = json.bufferView;
        this.mime_type   = json.mimeType;
        this.image_data  = undefined;
        this.image       = undefined;
        if (this.uri!==undefined) {
            this.load_promise = fetch(this.uri).then(
                (response) => {
                    if (!response.ok) {
                        throw new Error("Failed to fetch image "+this.uri);
                    } else {
                        this.mime_type = "image/jpeg";
                        return response.arrayBuffer();
                    }
                }).then( (data) => {this.image_data=data;} );
        } else {
            this.load_promise = new Promise.resolve();
        }
    }
    //f init
    init() {
        return this.load_promise;
    }
    //f make_image
    make_image() {
        if (this.image_data===undefined) {
            return Promise.resolve();
        }
        const blob = new Blob( [ this.image_data ], { type: this.mime_type } );
        this.image_url = URL.createObjectURL( blob );
        this.image = new Image();
        const promise = new Promise(
            (resolve) => {
                this.image.onload = () => {
                    URL.revokeObjectURL(this.image_url);
                    this.image_url  = undefined;
                    this.image_data = undefined;
                    resolve();
                }
            });
        this.image.src = this.image_url;
        return promise;
    }
    //f All done
}

//c GltfSampler
class GltfSampler {
    //f constructor
    constructor(json) {
        this.name        = def(json.name,"");
        this.mag_filter  = def(json.magFilter,"");
        this.min_filter  = def(json.minFilter,"");
        this.wrap_s      = def(json.wrapS,"");
        this.wrap_t      = def(json.wrapT,"");
    }
}

//c GltfTexture
class GltfTexture {
    //f constructor
    constructor(gltf, json) {
        this.name        = def(json.name,"");
        this.sampler     = gltf.get_sampler(json["sampler"]);
        this.image       = gltf.get_image(json["source"]);
        this.texture = undefined;
    }
    //f to_texture
    to_texture() {
        if (this.texture!==undefined) {return this.texture;}
        if (this.image.image===undefined) { throw new Error("Image not loaded for texture");}
        const data = this.image.image;
        this.texture = new Texture(data);
        return this.texture;
    }
}

//c GltfMaterial
// GltfTextureInfo = Tuple[GltfTexture,int] # Texture and which texcoord to use to index
class GltfMaterial {
    //f constructor
    constructor(gltf, json) {
        this.name    = def(json.name,"");
        const pbr    = def(json.pbrMetallicRoughness,{});
        this.color   = [1.,1.,1.,1.];
        this.metallic  = 1.;
        this.roughness = 1.;
        this.base_texture   = undefined;
        this.mr_texture     = undefined;
        this.normal_texture = undefined;
        this.occlusion_texture = undefined;
        this.emission_texture = undefined;
        this.color     = def(pbr.baseColorFactor,this.color);
        this.roughness = def(pbr.roughnessFactor,this.roughness);
        this.metallic  = def(pbr.metallicFactor, this.metallic);
        do_if(pbr.baseColorTexture,  (n)=>{this.base_texture     = gltf.get_texture(n.index);} );
        do_if(pbr.metallicRoughnessTexture,  (n)=>{this.mr_texture     = gltf.get_texture(n.index);} );
        do_if(json.normalTexture,    (n)=>{this.normal_texture   = gltf.get_texture(n.index);} );
        do_if(json.emissionTexture,  (n)=>{this.emission_texture = gltf.get_texture(n.index);} );
        do_if(json.occlusionTexture, (n)=>{this.occlusion_texture= gltf.get_texture(n.index);} );
    }
    //f to_model_material
    to_model_material() {
        const m = new ModelMaterial()
        m.color = this.color;
        m.metallic = this.metallic;
        m.roughness = this.roughness;
        do_if(this.base_texture,      (t) => {m.base_texture = t.to_texture();});
        do_if(this.mr_texture,        (t) => {m.mr_texture = t.to_texture();});
        do_if(this.normal_texture,    (t) => {m.normal_texture = t.to_texture();});
        do_if(this.occlusion_texture, (t) => {m.occlusion_texture = t.to_texture();});
        do_if(this.emission_texture,  (t) => {m.emission_texture = t.to_texture();});
        return m;
    }
    //f All done
}

//c Primitive - Add non-standard maps
class Primitive {
    //f constructor
    constructor(gltf, mesh, json) {
        const attributes    = def(json.attributes,{"POSITION":0});
        this.mode     = PrimitiveTypes.of_enum(def(json.mode,4));
        this.position = gltf.get_accessor(def(attributes.POSITION,0));
        this.indices  = gltf.get_accessor(def(json.indices,0));
        this.material = gltf.get_material(def(json.material,0));
        this.normal  = [];
        this.tangent  = []
        this.color   = [];
        this.tex_coords = [];
        this.joints  = [];
        this.weights  = [];
        do_if(attributes.NORMAL, (a)=>this.normal.push(gltf.get_accessor(a)) );
        do_if(attributes.TANGENT, (a)=>this.tangent.push(gltf.get_accessor(a)) );
        do_if(attributes.TEXCOORD_0, (a)=>this.tex_coords.push(gltf.get_accessor(a)) );
        do_if(attributes.TEXCOORD_1, (a)=>this.tex_coords.push(gltf.get_accessor(a)) );
        do_if(attributes.JOINTS_0, (a)=>this.joints.push(gltf.get_accessor(a)) );
        do_if(attributes.WEIGHTS_0, (a)=>this.weights.push(gltf.get_accessor(a)) );
    }
    //f to_model_primitive
    to_model_primitive() {
        const material = this.material.to_model_material();

        const view      = new ModelPrimitiveView();
        view.indices  = this.indices.to_model_buffer_indices();
        view.position = this.position.to_model_buffer_view();
        if (this.normal.length!=0)     {view.normal     = this.normal[0].to_model_buffer_view();}
        if (this.tangent.length!=0)    {view.tangent    = this.tangent[0].to_model_buffer_view();}
        if (this.color.length!=0)      {view.color      = this.color[0].to_model_buffer_view();}
        if (this.tex_coords.length!=0) {view.tex_coords = this.tex_coords[0].to_model_buffer_view();}
        if (this.joints.length!=0)     {view.joints     = this.joints[0].to_model_buffer_view();}
        if (this.weights.length!=0)    {view.weights    = this.weights[0].to_model_buffer_view();}
        const primitive = new ModelPrimitive();
        primitive.material        = material;
        primitive.view            = view;
        primitive.gl_type         = this.mode.gl_type(GL);
        primitive.indices_offset  = this.indices.offset;
        primitive.indices_count   = this.indices.count;
        primitive.indices_gl_type = this.indices.comp_type.gl_type(GL);
        // console.log(primitive);
        return primitive;
    }
    //f All done
}

//c Mesh
class Mesh {
    //f constructor
    constructor(gltf, json) {
        this.name       = def(json.name,"");
        this.primitives = [];
        for (const p of def(json.primitives,[])) {
            this.primitives.push(new Primitive(gltf, this, p));
        }
    }
    //f to_model_mesh
    to_model_mesh(gltf) {
        const model_mesh = new ModelMesh();
        for (const p of this.primitives) {
            model_mesh.primitives.push(p.to_model_primitive());
        }
        return model_mesh;
    }
    //f All done
}

//c Skin
class Skin {
    //f constructor
    constructor(gltf, json) {
        this.name   = def(json.name,"");
        this.joints = def(json.joints,[]);
        this.root   = def(json.skeleton,0);
        this.ibms   = def(json.inverseBindMatrices,undefined);
    }
    //f to_bones
    to_bones(gltf) {
        const bone_set = new BoneSet();
        const nodes = [];
        for (const j of this.joints) {
            const node = gltf.get_node(j);
            nodes.push(node);
        }
        nodes.sort((a,b)=>(a.depth-b.depth));
        const bones = new Map();
        for (const j of this.joints) {
            const n = gltf.get_node(j);
            if (bones.has(n)) {continue;}
            const add_bone = function(n,b) {bones.set(n,b);}
            const bone = n.to_bone(gltf, add_bone, undefined);
            bone_set.add_bone_hierarchy(bone);
        }
        for (const i in this.joints) {
            const j = this.joints[i];
            const n = gltf.get_node(j);
            const b = bones.get(n);
            b.matrix_index = i;
        }
        bone_set.derive_matrices();
        return bone_set;
    }
}

//c Node
class Node {
    //f constructor
    constructor(gltf, json) {
        this.name           = def(json.name,"");
        this.mesh           = undefined;
        this.skin           = undefined;
        this.children       = def(json.children,[]);
        this.transformation = new Transformation();
        this.depth = -1;
        do_if(json.mesh,   (m)=>{this.mesh = gltf.get_mesh(m);} );
        do_if(json.skin,   (m)=>{this.skin = gltf.get_skin(m);} );
        do_if(json.matrix, (m)=>{this.transformation.from_mat4(m);} );
        if (json.rotation!==undefined) {
            const q = json.rotation;
            this.transformation.quaternion = [q[1],q[2],q[3],q[0]];
        }
        do_if(json.scale,       (m)=>{this.transformation.scale=m;} );
        do_if(json.translation, (m)=>{this.transformation.translation=m;} );
    }
    //f calculate_depth
    calculate_depth(gltf, depth) {
        if (depth<=this.depth) {return;}
        this.depth = depth;
        for (const ci of this.children) {
            const cn = gltf.get_node(ci)
            cn.calculate_depth(gltf, depth+1);
        }
    }
    //f to_bone
    to_bone(gltf, add_callback, parent) {
        const bone = new Bone(parent, this.transformation, -1);
        add_callback(this, bone);
        for (const ci of this.children) {
            const cn = gltf.get_node(ci);
            cn.to_bone(gltf, add_callback, bone);
        }
        return bone;
    }
    //f to_model_object
    to_model_object(gltf, parent) {
        const model_object = new ModelObject(parent, this.transformation);
        for (const ci of this.children) {
            const cn = gltf.get_node(ci);
            cn.to_model_object(gltf, model_object);
        }
        if (this.mesh!==undefined) {
            model_object.mesh = this.mesh.to_model_mesh(gltf);
        }
        if (this.skin!==undefined) {
            model_object.bones = gltf.bones_of_skin(this.skin);
        }
        return model_object;
    }
    //f All done
}

    
//c Gltf
class Gltf {
    //f constructor
    constructor(uri) {
        this.uri    = uri;
        this.buffers = [];
        this.images = [];
        this.buffer_views = [];
        this.accessors = [];
        this.samplers = [];
        this.textures = [];
        this.materials = [];
        this.skins = [];
        this.meshes = [];
        this.nodes = [];
        this.init_promise = new Promise(
            (resolve) => {
                this.load_promise = fetch(this.uri).then(
                    (response) => {
                        if (!response.ok) {
                            throw new Error("Failed to fetch gltf "+this.uri);
                        } else {
                            return response.json();
                        }
                    }).then(
                        (json) => {
                            this.json = json;                            
                            return this.fetch_buffers();
                        }).then(
                                () => {
                                    this.resolve_json();
                                    resolve();
                                });
            });
    }
    fetch_buffers() {
        const promises = [];
        for (const b of def(this.json.buffers,[])) {
            const buffer = new Buffer(b);
            this.buffers.push(buffer);
            promises.push(buffer.init());
        }
        for (const i of def(this.json.images,[])) {
            const image = new GltfImage(i);
            this.images.push(image);
            promises.push(image.init());
        }
        return Promise.all(promises).then( () => {return this.make_images();} );
    }
    make_images() {
        const promises = [];
        for (const image of this.images) {
            promises.push(image.make_image());
        }
        return Promise.all(promises);
    }
    init() {
        return this.init_promise;
    }
    resolve_json() {
        for (const b of def(this.json.bufferViews,[])) {
            this.buffer_views.push(new BufferView(this, b));
        }
        for (const b of def(this.json.accessors,[])) {
            this.accessors.push(new Accessor(this, b));
        }
        for (const b of def(this.json.samplers,[])) {
            this.samplers.push(new GltfSampler(this, b));
        }
        for (const b of def(this.json.textures,[])) {
            this.textures.push(new GltfTexture(this, b));
        }
        for (const b of def(this.json.materials,[])) {
            this.materials.push(new GltfMaterial(this, b));
        }
        for (const b of def(this.json.skins,[])) {
            this.skins.push(new Skin(this, b));
        }
        for (const b of def(this.json.meshes,[])) {
            this.meshes.push(new Mesh(this, b));
        }
        for (const b of def(this.json.nodes,[])) {
            this.nodes.push(new Node(this, b));
        }
        for (const n of this.nodes) {
            n.calculate_depth(this, 0);
        }
        this.bone_sets = new Map();
        for (const s of this.skins) {
            this.bone_sets[s] = s.to_bones(this);
        }
    }
    //f get_buffer
    get_buffer(index) {
        if ((index<0) || (index>=this.buffers.length)) {throw new Error("Bad buffer number");}
        return this.buffers[index];
    }
    //f get_buffer_view
    get_buffer_view(index) {
        if ((index<0) || (index>=this.buffer_views.length)) {throw new Error("Bad buffer_view number");}
        return this.buffer_views[index];
    }
    //f get_accessor
    get_accessor(index) {
        if ((index<0) || (index>=this.accessors.length)) {throw new Error("Bad accessor number");}
        return this.accessors[index];
    }
    //f get_image
    get_image(index) {
        if ((index<0) || (index>=this.images.length)) {throw new Error("Bad image number");}
        return this.images[index];
    }
    //f get_sampler
    get_sampler(index) {
        if ((index<0) || (index>=this.samplers.length)) {throw new Error("Bad sampler number");}
        return this.samplers[index];
    }
    //f get_texture
    get_texture(index) {
        if ((index<0) || (index>=this.textures.length)) {throw new Error("Bad texture number");}
        return this.textures[index];
    }
    //f get_material
    get_material(index) {
        if ((index<0) || (index>=this.materials.length)) {throw new Error("Bad material number");}
        return this.materials[index];
    }
    //f get_skin
    get_skin(index) {
        if ((index<0) || (index>=this.skins.length)) {throw new Error("Bad skin number");}
        return this.skins[index];
    }
    //f get_mesh
    get_mesh(index) {
        if ((index<0) || (index>=this.meshes.length)) {throw new Error("Bad mesh number");}
        return this.meshes[index];
    }
    //f get_node
    get_node(index) {
        if ((index<0) || (index>=this.nodes.length)) {throw new Error("Bad node number");}
        return this.nodes[index];
    }
    //f get_node_by_name
    get_node_by_name(name) {
        for (const i in this.nodes) {
            if (name == this.nodes[i].name) {
                return (i, this.nodes[i]);
            }
        }
        return undefined;
    }
    //f bones_of_skin
    bones_of_skin(skin) {
        return this.bone_sets[skin];
    }
    //f All done
}

//a GLTF wrapper end
    return {Gltf:Gltf};
})();
class Hierarchy {
    constructor() {
        this.data = [];
        this.depth = 0;
    }
    push() {
        this.depth += 1;
    }
    pop() {
        this.depth -= 1;
    }
    add(d){
        this.data.push( [this.depth, d] );
    }
    *iter_items() {
        for (var x of this.data) {
            yield x;
        }
    }
    str() {
        var r = ""
        for (var d of this.iter_items()) {
            r += (" ".repeat(d[0]*2)) + d[1]+"\n";
        }
        return r;
    }
}
//a Classes
//c ModelMaterial
class ModelMaterial {
    constructor() {
        this.color      = [1.,1.,1.,1.];
        this.metallic  = 1.;
        this.roughness = 1.;
        this.base_texture      = undefined;
        this.mr_texture        = undefined;
        this.normal_texture    = undefined;
        this.occlusion_texture = undefined;
        this.emission_texture  = undefined;
    }
    //f gl_create
    gl_create() {
        if (this.base_texture!==undefined)      {this.base_texture.gl_create();}
        if (this.mr_texture!==undefined)        {this.mr_texture.gl_create();}
        if (this.normal_texture!==undefined)    {this.normal_texture.gl_create();}
        if (this.occlusion_texture!==undefined) {this.occlusion_texture.gl_create();}
        if (this.emission_texture!==undefined)  {this.emission_texture.gl_create();}
        if (this.base_texture!==undefined) {
            this.color[3] = 0.;
        }
    }
    //f gl_program_configure
    gl_program_configure(program) {
        if (this.base_texture!==undefined) {
            GL.activeTexture(GL.TEXTURE0);
            GL.bindTexture(GL.TEXTURE_2D, this.base_texture.texture);
            program.set_uniform_if("uMaterial.base_texture", (u) => GL.uniform1i(u, 0) );
        }
        program.set_uniform_if("uMaterial.base_color",   (u) => GL.uniform4fv(u, this.color) );
    }
    //f str
    str() {
           return "Material";
          }
    //f All done
}

//c ModelBufferData
class ModelBufferData {
    //f constructor
    constructor(data, byte_offset, byte_length) {
        if (byte_length===undefined) {byte_length=data.byteLength;}
        this.data = data;
        this.byte_length = byte_length;
        this.byte_offset = byte_offset;
        this.gl_buffer = undefined;
    }
    //f gl_create
    gl_create() {
        if (this.gl_buffer===undefined) {
            this.gl_buffer = GL.createBuffer();
            GL.bindBuffer(GL.ARRAY_BUFFER, this.gl_buffer);
            GL.bufferData(GL.ARRAY_BUFFER, this.data.slice(this.byte_offset,this.byte_offset+this.byte_length), GL.STATIC_DRAW);
        }
    }
    //f str
    str() {
        return "ModelBufferData "+this.byte_offset+" "+this.byte_length;
    }
    //f All done
}
    
//c ModelBufferIndices
class ModelBufferIndices {
    //f constructor
    constructor(data, byte_offset, byte_length) {
        if (byte_length===undefined) {byte_length=data.byteLength;}
        this.data = data;
        this.byte_length = byte_length;
        this.byte_offset = byte_offset;
        this.gl_buffer = undefined;
    }
    //f gl_create
    gl_create() {
        if (this.gl_buffer===undefined) {
            this.gl_buffer = GL.createBuffer();
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.gl_buffer)
            GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, this.data.slice(this.byte_offset, this.byte_offset+this.byte_length), GL.STATIC_DRAW)
        }
    }
    //f gl_buffer
    gl_bind_program(shader) {
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.gl_buffer);
    }
    //f hier_debug
    hier_debug(hier) {
        hier.add("Indices "+this.byte_offset+" "+this.byte_length);
        return hier;
    }
    //f str
    str() {return this.hier_debug(new Hierarchy()).str();}
    //f All done
}
    
//c ModelBufferView - for use in a vertex attribute pointer
class ModelBufferView {
    //f constructor
    constructor(data, count, gl_type, offset, stride) {
        if (stride===undefined) {stride=0;}
        this.data = data;
        this.count = count;
        this.gl_type = gl_type;
        this.offset = offset;
        this.stride = stride;
    }
    //f gl_create
    gl_create() {
        this.data.gl_create();
    }
    //f gl_bind_program
    gl_bind_program(shader, attr) {
        const a = shader.get_attr(attr)
        if (a !== undefined) {
            GL.bindBuffer(GL.ARRAY_BUFFER, this.data.gl_buffer);
            GL.enableVertexAttribArray(a);
            GL.vertexAttribPointer(a, this.count, this.gl_type, false, this.stride, this.offset);
        }
    }
    //f hier_debug
    hier_debug(hier, use) {
        hier.add("BufferView "+use+" "+this.gl_type+" "+this.count+" "+this.offset+" "+this.stride)
        return hier;
    }
    //f str
    str() {return this.hier_debug(new Hierarchy()).str();}
    //f All done
}

//c ModelPrimitiveView
class ModelPrimitiveView {
    //f constructor
    constructor() {
        this.position   = undefined;
        this.normal     = undefined;
        this.tex_coords = undefined;
        this.joints     = undefined;
        this.weights    = undefined;
        this.tangent    = undefined;
        this.color      = undefined;
        this.attribute_mapping = { "vPosition":"position",
                          "vNormal":"normal",
                          "vTexture":"tex_coords",
                          "vJoints":"joints",
                          "vWeights":"weights",
                          "vTangent":"tangent",
                          "vColor":"color",
                                 };
    }
    //f gl_create
    gl_create() {
        this.gl_vao = GL.createVertexArray();
        GL.bindVertexArray(this.gl_vao);
        this.indices.gl_create()
        for (const san in this.attribute_mapping) {
            const an = this.attribute_mapping[san];
            const mbv = this[an];
            if (mbv!==undefined) { mbv.gl_create(); }
        }
    }
    //f gl_bind_program
    gl_bind_program(shader_class) {
        GL.bindVertexArray(this.gl_vao);
        this.indices.gl_bind_program(shader_class);
        for (const san in this.attribute_mapping) {
            const an = this.attribute_mapping[san];
            const mbv = this[an];
            if (mbv!==undefined) {
                mbv.gl_bind_program(shader_class, san);
            } else {
                const sa = shader_class.get_attr(san);
                if ((sa !== undefined) && (sa>=0)) {
                    GL.disableVertexAttribArray(sa);
                }
            }
        }
    }
    //f hier_debug
    hier_debug(hier) {
        this.indices.hier_debug(hier);
        for (const san in this.attribute_mapping) {
            const an = this.attribute_mapping[san];
            const mbv = this[an];
            if (mbv !== undefined) { mbv.hier_debug(hier, an); }
        }
        return hier;
    }
    //f str
    str() {return this.hier_debug(new Hierarchy()).str();}
    //f All done
}

//c ModelPrimitive
class ModelPrimitive {
    constructor() {
    }
    gl_create() {
        this.view.gl_create();
        this.material.gl_create();
    }
    gl_bind_program(shader_class) {
        this.view.gl_bind_program(shader_class);
    }
    gl_draw(shader_program) {
        GL.bindVertexArray(this.view.gl_vao);
        this.material.gl_program_configure(shader_program);
        GL.drawElements(this.gl_type, this.indices_count, this.indices_gl_type, this.indices_offset);
    }
    //f hier_debug
    hier_debug(hier) {
        hier.add("Primitive '"+this.name+"' "+this.gl_type+" "+this.indices_gl_type+" "+this.indices_count+" "+this.indices_offset);
        hier.push();
        this.view.hier_debug(hier);
        hier.pop();
        return hier;
    }
    //f str
    str() {return this.hier_debug(new Hierarchy()).str();}
    //f All done
}

//c ModelMesh
class ModelMesh {
    //f constructor
    constructor() {
        this.primitives = [];
    }
    //f gl_create
    gl_create() {
        for (var p of this.primitives) {
            p.gl_create();
        }
    }
    //f gl_bind_program
    gl_bind_program(shader_class) {
        for (const p of this.primitives) {
            p.gl_bind_program(shader_class);
        }
    }
    //f gl_draw
    gl_draw(shader_program) {
        for (const p of this.primitives) {
            p.gl_draw(shader_program);
        }
    }
    //f hier_debug
    hier_debug(hier) {
        hier.add("ModelMesh");
        hier.push();
        for (const p of this.primitives) {
            p.hier_debug(hier);
        }
        hier.pop();
        return hier;
    }
    //f str
    str() {return this.hier_debug(new Hierarchy()).str();}
    //f All done
}

//c ModelObject
class ModelObject {
    //f constructo\r
    constructor(parent, transformation) {
        this.transformation = transformation;
        this.parent = parent;
        this.children = [];
        if (this.parent !== undefined) {
            this.parent.children.push(this);
        }
        this.mesh  = undefined;
        this.bones = undefined;
    }
    //f iter_objects
    *iter_objects(trans_mat) {
        if (this.transformation !== undefined) {
            trans_mat = this.transformation.trans_mat_after(trans_mat);
        }
        yield([trans_mat, this]);
        for (const c of this.children) {
            for (const x of c.iter_objects(trans_mat)) {
                yield(x);
            }
        }
    }
    //f has_mesh
    has_mesh() { return this.mesh!==undefined; }
    //f get_mesh
    get_mesh() { return this.mesh; }
    //f has_bones
    has_bones() { return this.bones!==undefined; }
    //f get_bones
    get_bones() { return this.bones; }
    //f gl_create
    gl_create() {
        if (this.mesh!==undefined) { this.mesh.gl_create(); }
    }
    //f gl_bind_program
    gl_bind_program(shader_class) {
        if (this.mesh!==undefined) { this.mesh.gl_bind_program(shader_class); }
    }
    //f gl_draw
    gl_draw(shader_program) {
        if (this.mesh!==undefined) { this.mesh.gl_draw(shader_program); }
    }
    //f hier_debug
    hier_debug(hier) {
        hier.add("ModelObject");
        hier.push();
        hier.add("Transformation "+this.transformation);
        if (this.mesh!==undefined)  { this.mesh.hier_debug(hier); }
        if (this.bones!==undefined) { this.bones.hier_debug(hier); }
        for (c of this.children) {
            c.hier_debug(hier);
        }
        hier.pop();
        return hier;
    }
    //f str
    str() {return this.hier_debug(new Hierarchy()).str();}
    //f All done
}

//c ModelClass
class ModelClass {
    //f constructor
    constructor(name, root_object) {
        this.name = name;
        if (root_object!==undefined) {this.root_object = root_object;}
        this.bones = [];
    }
    //f iter_objects
    *iter_objects() {
        for (const o of this.root_object.iter_objects(new TransMat())) {
            yield(o);
        }
    }
    //f hier_debug
    hier_debug(hier) {
        hier.add("ModelClass '"+this.name+"'");
        hier.push();
        this.root_object.hier_debug(hier);
        for (bone of this.bones) {
            bone.hier_debug(hier);
        }
        hier.pop();
        return hier;
    }
    //f str
    str() {return this.hier_debug(new Hierarchy()).str();}
    //f All done
}

//c ModelInstance
class ModelInstance {
    //f constructor
    constructor(model_class) {
        this.bone_set_poses = [];
        this.meshes = [];
        this.transformation = new Transformation();
        const bone_set_dict = new Map();
        for (const [trans_mat,model] of model_class.iter_objects()) {
            if (!model.has_mesh()) {continue;}
            const mesh_instance = model.get_mesh();
            var bone_set_index = -1;
            if (model.has_bones()) {
                const bone_set = model.get_bones(); // get bone set
                if (bone_set_dict.get(bone_set)===undefined) {
                    bone_set_dict.set(bone_set,this.bone_set_poses.length);
                    const pose = new BonePoseSet(bone_set);
                    this.bone_set_poses.push(pose);
                }
                bone_set_index = bone_set_dict.get(bone_set);
            }
            this.meshes.push( [trans_mat, mesh_instance, bone_set_index] );
        }
    }
    //f gl_create
    gl_create() {
        for (const [t,m,b] of this.meshes) {
            m.gl_create();
        }
    }
    //f gl_bind_program
    gl_bind_program(shader_class) {
        for (const [t,m,b] of this.meshes) {
            m.gl_bind_program(shader_class);
        }
    }
    //f gl_draw
    gl_draw(shader_program, tick) {
        GL.uniformMatrix4fv(shader_program.uniforms["uModelMatrix"], false, this.transformation.mat4());
        for (const bone_set_pose of this.bone_set_poses) {
            bone_set_pose.update(tick);
        }
        for (const [t,m,b] of this.meshes) {
            if (b>=0) {
                const bma = this.bone_set_poses[b];
                shader_program.set_uniform_if("uBonesMatrices",
                                              (u) => GL.uniformMatrix4fv(u, false, bma.data.subarray(0,bma.max_index*16)));
                shader_program.set_uniform_if("uBonesScale", (u) => GL.uniform1f(u, 1.0) )
            } else {
                shader_program.set_uniform_if("uBonesScale", (u) => GL.uniform1f(u, 0.0) )
            }
            // Provide mesh matrix and material uniforms
            shader_program.set_uniform_if("uMeshMatrix",
                                          (u) => GL.uniformMatrix4fv(u, false, t.mat4()) )
            m.gl_draw(shader_program);
        }
    }
    //f hier_debug
    hier_debug(hier) {
        hier.add("ModelInstance with "+this.bone_set_poses.length+" poses");
        hier.push();
        for (const i in this.bone_set_poses) {
            hier.add("Pose/Matrix "+i);
            this.bone_set_poses[i].hier_debug(hier);
        }
        for (const [t,m,b] of this.meshes) {
            hier.add("Mesh transform "+t+" pose/matrix "+b);
            m.hier_debug(hier);
        }
        hier.pop();
        return hier;
    }
    //f str
    str() {return this.hier_debug(new Hierarchy()).str();}
    //f All done
}
class ObjectModel extends ModelClass {
    constructor(name, obj) {
        const bones = new BoneSet();
        var b = new Bone(undefined, new Transformation(Glm.vec3.set(Glm.vec3.create(),0.,0.,-1.)));
        bones.add_bone(b);
        b = new Bone(bones.bones[0], new Transformation(Glm.vec3.set(Glm.vec3.create(),0.,0.,2.)));
        bones.add_bone(b);
        b = new Bone(bones.bones[1], new Transformation(Glm.vec3.set(Glm.vec3.create(),0.,0.,2.)));
        bones.add_bone(b);
        bones.rewrite_indices();
        bones.derive_matrices();
        
        const num_pts = obj.positions.length/3;
        const buffer_data = [];
        for (const x of obj.positions) {buffer_data.push(x);}
        for (const x of obj.normals)   {buffer_data.push(x);}
        for (const x of obj.texcoords) {buffer_data.push(x);}
        for (const x of obj.weights)   {buffer_data.push(x);}
        const buffer_int_data = [];
        for (var i=0; i<num_pts; i++) {
            buffer_int_data.push(0,1,2,3);
        }
        const buffer_size = buffer_data.length * 4;
        const model_data      = new ModelBufferData(new Float32Array(buffer_data), 0);
        const model_int_data  = new ModelBufferData(new Uint8Array(buffer_int_data), 0);
        var o = 0;
        const view = new ModelPrimitiveView();
        view.position    = new ModelBufferView(model_data, 3, GL.FLOAT, o);
        o += num_pts * 12;
        view.normal      = new ModelBufferView(model_data, 3, GL.FLOAT, o);
        o += num_pts * 12;
        view.tex_coords  = new ModelBufferView(model_data, 2, GL.FLOAT, o)
        o += num_pts * 8;
        view.weights     = new ModelBufferView(model_data, 4, GL.FLOAT, o)
        o += num_pts * 16;
        o = 0;
        view.joints      = new ModelBufferView(model_int_data, 4, GL.UNSIGNED_BYTE, o);
        o += num_pts * 4;
        
        const material = new ModelMaterial();
        material.color = [1.,5.,3.,1.];
        
        const primitive = new ModelPrimitive();
        primitive.view = view;
        primitive.material = material;
        primitive.gl_type = GL.TRIANGLE_STRIP;
        primitive.indices_offset  = 0;
        primitive.indices_count   = obj.indices.length;
        if (num_pts<255) {
            const model_indices   = new ModelBufferIndices(new Uint8Array(obj.indices), 0);
            view.indices = model_indices;
            primitive.indices_gl_type = GL.UNSIGNED_BYTE;
        } else {
            const model_indices   = new ModelBufferIndices(new Uint16Array(obj.indices), 0);
            view.indices = model_indices;
            primitive.indices_gl_type = GL.UNSIGNED_SHORT;
        }

        const root_object = new ModelObject(undefined);
        root_object.bones = bones;
        root_object.mesh = new ModelMesh();
        root_object.mesh.primitives.push(primitive);
        super(name, root_object);
    }
}

//a Cube mesh with single bone
// cube front face   back face (as seen from front)
//        1    0        5   4
//        3    2        7   6
// triangles (anticlockwise for first)
//  3.2.1 2.1.0 1.0.4 0.4.2 4.2.6 2.6.7 6.7.4 7.4.5 4.5.1 5.1.7 1.7.3 7.3.2
// Cube strip
// 3, 2, 1, 0, 4, 2, 6, 7, 4, 5, 1, 7, 3, 2
const cube =  {
    positions : [
      1.0,  1.0, 1.0, 
      -1.0,  1.0, 1.0,
      1.0, -1.0, 1.0, 
      -1.0, -1.0, 1.0,

      1.0,  1.0, -1.0,
      -1.0,  1.0, -1.0,
      1.0, -1.0, -1.0,
      -1.0, -1.0, -1.0,
    ],
    normals : [
      1.0,  1.0, 1.0, 
      -1.0,  1.0, 1.0,
      1.0, -1.0, 1.0, 
      -1.0, -1.0, 1.0,

      1.0,  1.0, -1.0,
      -1.0,  1.0, -1.0,
      1.0, -1.0, -1.0,
      -1.0, -1.0, -1.0,
    ],
    texcoords : [ 1,0, 0,0, 1,1, 0,1,
            1,1, 0,1, 1,0, 0,0 ],
    weights : [
      1., 0., 0., 0.,
      1., 0., 0., 0.,
      1., 0., 0., 0.,
      1., 0., 0., 0.,
      0., 1., 0., 0.,
      0., 1., 0., 0.,
      0., 1., 0., 0.,
      0., 1., 0., 0.,
    ],
    indices :  [3, 2, 1, 0, 4, 2, 6, 7,  4, 5, 1, 7, 3, 2],
    //submeshes : [ new Submesh([0,1,0,0], "TS", 0, 14),]
}

//a Double cube object
    // cube front face   mid   back face (as seen from front)
    //        1  0      5  4     9  8
    //        3  2      7  6    11 10
    // Double cube strip
    // 3, 2, 1, 0, 4, 2, 6, 7,   11, 5, 9, 8, 11, 10, 6, 8,   4, 5, 1, 7, 3, 2
const dbl_cube =  {
    positions : [
      1.0,  1.0, 1.0, 
      -1.0,  1.0, 1.0,
      1.0, -1.0, 1.0, 
      -1.0, -1.0, 1.0,

      1.0,  1.0, -1.0,
      -1.0,  1.0, -1.0,
      1.0, -1.0, -1.0,
      -1.0, -1.0, -1.0,

      1.0,  1.0, -3.0,
      -1.0,  1.0, -3.0,
      1.0, -1.0, -3.0,
      -1.0, -1.0, -3.0,
    ],
    texcoords : [ 1,0, 0,0, 1,1, 0,1,
                  1,0, 0,0, 1,1, 0,1,
                  1,1, 0,1, 1,0, 0,0 ],
    normals : [
      1.0,  1.0, 1.0, 
      -1.0,  1.0, 1.0,
      1.0, -1.0, 1.0, 
      -1.0, -1.0, 1.0,

      1.0,  1.0,  0.,
      -1.0,  1.0, 0.,
      1.0, -1.0,  0.,
      -1.0, -1.0, 0.,

      1.0,  1.0, -1.0,
      -1.0,  1.0, -1.0,
      1.0, -1.0, -1.0,
      -1.0, -1.0, -1.0,
    ],
    weights : [
      1., 0., 0., 0.,
      1., 0., 0., 0.,
      1., 0., 0., 0.,
      1., 0., 0., 0.,
      0., 1., 0., 0.,
      0., 1., 0., 0.,
      0., 1., 0., 0.,
      0., 1., 0., 0.,
      0., 0., 1., 0.,
      0., 0., 1., 0.,
      0., 0., 1., 0.,
      0., 0., 1., 0.,
    ],
    indices :  [3, 2, 1, 0, 4, 2, 6, 7,   11, 5, 9, 8, 11, 10, 6, 8,   4, 5, 1, 7, 3, 2],
    // submeshes : [ new Submesh([0,1,2,0], "TS", 0, 22),]
}

const dbl_cube2 =  {
    positions : [
      1.0,  1.0, 1.0, 
      -1.0,  1.0, 1.0,
      1.0, -1.0, 1.0, 
      -1.0, -1.0, 1.0,

      1.0,  1.0, -1.0,
      -1.0,  1.0, -1.0,
      1.0, -1.0, -1.0,
      -1.0, -1.0, -1.0,

      1.0,  1.0, -3.0,
      -1.0,  1.0, -3.0,
      1.0, -1.0, -3.0,
      -1.0, -1.0, -3.0,
    ],
    normals : [
      1.0,  1.0, 1.0, 
      -1.0,  1.0, 1.0,
      1.0, -1.0, 1.0, 
      -1.0, -1.0, 1.0,

      1.0,  1.0,  0.,
      -1.0,  1.0, 0.,
      1.0, -1.0,  0.,
      -1.0, -1.0, 0.,

      1.0,  1.0, -1.0,
      -1.0,  1.0, -1.0,
      1.0, -1.0, -1.0,
      -1.0, -1.0, -1.0,
    ],
    texcoords : [ 1,0, 0,0, 1,1, 0,1,
                  1,0, 0,0, 1,1, 0,1,
                  1,1, 0,1, 1,0, 0,0 ],
    weights : [
        1., 0., 0., 0.,
        1., 0., 0., 0.,
        1., 0., 0., 0.,
        1., 0., 0., 0.,
        0.4, 0.6, 0., 0.,
        0.4, 0.6, 0., 0.,
        0.4, 0.6, 0., 0.,
        0.4, 0.6, 0., 0.,
      0., 1., 0., 0.,
      0., 1., 0., 0.,
      0., 1., 0., 0.,
      0., 1., 0., 0.,
    ],
    indices :  [3, 2, 1, 0, 4, 2, 6, 7,   11, 5, 9, 8, 11, 10, 6, 8,   4, 5, 1, 7, 3, 2],
    //submeshes : [ new Submesh([0,1,2,0], "TS", 0, 22),],
}
function make_snake(snake_slices, snake_height) {
    const snake_slice_height=snake_height/snake_slices;
    const snake_positions = [];
    const snake_normals = [];
    const snake_texcoords = [];
    const snake_weights = [];
    const snake_indices = [];
    for (i=0; i<=snake_slices; i++) {
        var z = 1.0 - i*snake_slice_height
        snake_positions.push(1, 1, z, -1, 1, z, 1, -1, z, -1, -1, z);
        snake_normals.push(1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0);
        if (i>=snake_slices/2) {
            z = 2-(i/snake_slices)*2;
            snake_texcoords.push( 1,1-z, 0,1-z, 0,1-z, 1,1-z);
            snake_weights.push(0., z, 1.-z, 0.);
            snake_weights.push(0., z, 1.-z, 0.);
            snake_weights.push(0., z, 1.-z, 0.);
            snake_weights.push(0., z, 1.-z, 0.);
        } else {
            z = 1-i/snake_slices * 2;
            snake_weights.push(z, 1.-z, 0., 0.);
            snake_texcoords.push( 1,z, 0,z, 0,z, 1,z);
            snake_weights.push(z, 1.-z, 0., 0.);
            snake_weights.push(z, 1.-z, 0., 0.);
            snake_weights.push(z, 1.-z, 0., 0.);
        }
    }
    for (i=0; i<snake_slices; i++) {
        const base=i*4;
        snake_indices.push(base, base, base, base+4, base+1, base+5, base+3, base+7, base+2, base+6);
        snake_indices.push(base, base+4, base+4, base+4);
    }
    {
        var z = 1.0;
        snake_positions.push(1, 1, z, -1, 1, z, 1, -1, z, -1, -1, z);
        snake_normals.push(0,0,1, 0,0,1, 0,0,1, 0,0,1);
        snake_texcoords.push( 1,0, 0,0, 1,1, 0,1);
        snake_weights.push(1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0 );
        z = 1 - snake_height;
        snake_positions.push(1, 1, z, -1, 1, z, 1, -1, z, -1, -1, z);
        snake_normals.push(0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1);
        snake_texcoords.push( 1,0, 0,0, 1,1, 0,1);
        snake_weights.push(0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0);
    }
    endcap = 4*(snake_slices+1);
    snake_indices.push(endcap, endcap, endcap+1,endcap+2,endcap+3,endcap+3);// now ccw winding
    snake_indices.push(endcap+4,endcap+4,endcap+5,endcap+6,endcap+7); // now ccw winding
    
    const snake =  {
        positions : snake_positions,
        normals   : snake_normals,
        texcoords : snake_texcoords,
        weights   : snake_weights,
        indices   : snake_indices,
        //submeshes : [ new Submesh([0,1,2,0], "TS", 0, snake_indices.length),],
    }
    return snake;
}

class ShaderClass {
    constructor(shader_desc) {
        this.name = shader_desc.name;
        this.attrib_keys = shader_desc.attrib_keys;
        this.attributes = {};
    }
    validate(program) {
        for (const sm in program.attributes) {
            this.attributes[sm] = program.attributes[sm];
        }
        //program.attributes;
    }
    get_attr(name) {
        return this.attributes[name];
    }
}

BoneShaderClass = {
    name : "Simple shader class",
    attrib_keys : ["vPosition", "vNormal", "vJoints", "vWeights", "vTexture", "vColor",]
}
bone_shader_class = new ShaderClass(BoneShaderClass);

class ShaderProgram {
    constructor(program_desc) {
        this.shader_class = program_desc.shader_class;
        this.vertex_uri   = program_desc.vertex_uri  ;
        this.fragment_uri = program_desc.fragment_uri;
        this.attrib_keys  = program_desc.attrib_keys ;
        this.uniform_keys = program_desc.uniform_keys;
    }
    init() {
        this.init_promises = [];
        this.init_promises.push(new Promise(
            (resolve) => {
                fetch(this.vertex_uri).then(
                    (response) => {
                        if (!response.ok) {
                            throw new Error("Failed to fetch vertex shader "+this.vertex_uri);
                        } else {
                            return response.text();
                        }
                    }).then(
                        (text) => {
                            this.vertex_source = "#version 300 es\n"+text;
                            resolve();
                        });
            }) );
        this.init_promises.push(new Promise(
            (resolve) => {
                fetch(this.fragment_uri).then(
                    (response) => {
                        if (!response.ok) {
                            throw new Error("Failed to fetch fragment shader "+this.fragment_uri);
                        } else {
                            return response.text();
                        }
                    }).then(
                        (text) => {
                            this.fragment_source = "#version 300 es\nprecision mediump float;\n"+text;
                            resolve();
                        });
            }) );
        return Promise.all(this.init_promises);
    }
    //f gl_ready - invoke post-constructor to get class properties defined
    gl_ready() {
        this.vertex_shader   = this.compile(GL.VERTEX_SHADER,   this.vertex_source);
        this.fragment_shader = this.compile(GL.FRAGMENT_SHADER, this.fragment_source);
        this.program = GL.createProgram();
        GL.attachShader(this.program, this.vertex_shader)
        GL.attachShader(this.program, this.fragment_shader)
        GL.linkProgram(this.program)
        if (!GL.getProgramParameter(this.program, GL.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + GL.getProgramInfoLog(this.program));
            return null;
        }
        this.attributes = {};
        this.uniforms   = {};
        for (const k of this.attrib_keys) {
            const a=GL.getAttribLocation(this.program, k);
            if (a>=0) {this.attributes[k] = a;}
        }
        for (const k of this.uniform_keys) {
            const u = GL.getUniformLocation(this.program, k);
            this.uniforms[k] = u;
        }
        this.shader_class.validate(this);
        return this;
    }
    //f compile
    compile(shader_type, source) {
        const shader = GL.createShader(shader_type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
            alert('An error occurred compiling the shaders: ' + GL.getShaderInfoLog(shader));
            GL.deleteShader(shader);
            return null;
        }
        return shader;
    }
    //f get_attr
    get_attr(name) {
        return this.attributes[name];
    }
    //f set_uniform_if
    set_uniform_if(name, fn) {
        if (name in this.uniforms) {
            fn(this.uniforms[name]);
        }
    }
    //f All done
}

//c BoneShader
BoneShader = {
    shader_class : bone_shader_class,
    vertex_uri   : "./shader/bone_shader_v.glsl",
    fragment_uri : "./shader/bone_shader_f.glsl",
    attrib_keys  : ["vPosition", "vNormal", "vJoints", "vWeights", "vTexture", "vColor",],
    uniform_keys : ["uProjectionMatrix", "uCameraMatrix", "uModelMatrix", "uMeshMatrix", "uBonesMatrices", "uBonesScale", "uMaterial.base_color", "uMaterial.base_texture" ]
}

//c GlowShader
GlowShader = {
    shader_class : bone_shader_class,
    vertex_uri   : "./shader/unboned_shader_v.glsl",
    fragment_uri : "./shader/glow_shader_f.glsl",
    attrib_keys  : ["vPosition", "vNormal", "vJoints", "vWeights", "vTexture", "vColor",],
    uniform_keys : ["uProjectionMatrix", "uCameraMatrix", "uModelMatrix", "uMeshMatrix", "uMaterial.base_color", ]
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}
class Texture {
    constructor(data) {
        this.data = data;
        this.texture = undefined;
    }
    gl_create() {
        if (this.texture!==undefined) {return;}
        this.texture = GL.createTexture();
        GL.bindTexture(GL.TEXTURE_2D, this.texture);
        GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, this.data);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S,     GL.CLAMP_TO_EDGE);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T,     GL.CLAMP_TO_EDGE);
    }
}
class TextureImage extends Texture {
    constructor(url) {
        super();
        this.image = new Image();
        this.url = url;
    }
    init() {
        const promise = new Promise(
            (resolve,reject) => {
                this.image.crossOrigin = "anonymous";
                this.image.src = this.url;
                this.image.onload = (
                    (progress_event) => {
                        this.data = this.image;
                        resolve(this.image);
                    });
                this.image.onerror = () => reject();
            }
        );
        return promise;
    }
}

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
    const rot_min_id   = Glm.mat3.subtract(Glm.mat3.create(), rotation, Glm.mat3.multiplyScalar(Glm.mat3.create(),Glm.mat3.create(),0.99999));
    const rot_min_id_i = Glm.mat3.invert(Glm.mat3.create(), rot_min_id);
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
    return Glm.quat.setAxisAngle(Glm.quat.create(), axis, angle);
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
        return new TransMat(Glm.mat4.multiply(Glm.mat4.create(),pre_mat.mat,this.mat));
    }
    //f All done
}

//a Transformation
class Transformation {
    constructor(translation, quaternion, scale) {
        this.translation = Glm.vec3.create();
        this.quaternion  = Glm.quat.create();
        this.scale       = Glm.vec3.set(Glm.vec3.create(),1.,1.,1.);
        if (translation !== undefined) {
            Glm.vec3.copy(this.translation, translation);
        }
        if (quaternion !== undefined) {
            Glm.quat.copy(this.quaternion, quaternion);
        }
        if (scale !== undefined) {
            Glm.vec3.copy(this.scale,scale);
        }
    }
    //f copy
    copy(other) {
        Glm.quat.copy(this.quaternion,  other.quaternion);
        Glm.vec3.copy(this.translation, other.translation);
        Glm.vec3.copy(this.scale,       other.scale);
    }
    //f set
    set(base, other) {
        Glm.quat.multiply(this.quaternion, base.quaternion, other.quaternion);
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
        const q = Glm.quat.setAxisAngle(Glm.quat.create(), axis, angle);
        Glm.quat.multiply(this.quaternion , this.quaternion);
        Glm.quat.multiply(this.translation, this.translation);
    }
    //f mat4
    mat4() {
        var m = Glm.mat4.create();
        Glm.mat4.fromQuat(m, this.quaternion);
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
        var rotation = Glm.mat3.create();
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
        return new TransMat(Glm.mat4.multiply(Glm.mat4.create(),pre_mat.mat,this.mat4()));
    }
    //f distance
    distance(other) {
        const td = Glm.vec3.distance(this.translation, other.translation);
        const sd = Glm.vec3.distance(this.scale, other.scale);
        const qn = Glm.quat.multiply(Glm.quat.create(),Glm.quat.invert(Glm.quat.create(),this.quaternion),other.quaternion);
        if (qn[3]>0) {Glm.quat.scale(qn,qn,-1);}
        const qd = Glm.quat.length(Glm.quat.add(Glm.quat.create(),qn,Glm.quat.create()));
        return td+sd+qd;
    }
    //f str
    str() {
        return "trans "+this.translation+":"+this.scale+":"+this.quaternion;
    }
    //f All done
}

