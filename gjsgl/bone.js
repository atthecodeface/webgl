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
        this.btp = mat4.create(); // derived from translation and quaternion
        this.ptb = mat4.create();
        this.mtb = mat4.create();
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
        mat4.copy(this.btp, this.transformation.mat4());
        mat4.invert(this.ptb, this.btp);
        if (this.parent == null) {
            mat4.copy(this.mtb, this.ptb);
        } else {
            mat4.multiply(this.mtb, this.ptb, this.parent.mtb);
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

        this.btp = mat4.create(); // derived from translation and quaternion
        this.ptb = mat4.create();
        this.animated_btm = mat4.create();
        this.animated_mtm = mat4.create();
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
        mat4.copy(this.btp, this.transformation.mat4());
        if (this.parent == null) {
            mat4.copy(this.animated_btm, this.btp);
        } else {
            mat4.multiply(this.animated_btm, this.parent.animated_btm, this.btp);
        }
        mat4.multiply(this.animated_mtm, this.animated_btm, this.bone.mtb);
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
        for ([bone,pose] of this.iter_bones_and_poses()) {
            if (bone.matrix_index<0) {continue;}
            base = bone.matrix_index*16;
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

