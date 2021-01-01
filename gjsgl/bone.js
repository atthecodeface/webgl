//a Bone class
//c Bone
class Bone {
    //d Documentation
    // The bone has an origin relative to its parent
    // and it has a quaternion that represents the scale and change in orientation of its contents/children
    // A point in this bone's space is then translate(rotate(scale(pt))) in its parent's space
    // From this the bone has a local bone-to-parent transform matrix
    // and it has a local parent-to-bone transform matrix
    // At rest (where a mesh is skinned) there are two rest matrix variants
    // Hence bone_relative = ptb * parent_relative
    // The skinned mesh has points that are parent relative, so
    // animated_parent_relative(t) = btp(t) * ptb * parent_relative(skinned)
    // For a chain of bones Root -> A -> B -> C
    // bone_relative = C.ptb * B.ptb * A.ptb * mesh
    // root = A.btp * B.btp * C.btp * C_bone_relative
    // animated(t) = A.btp(t) * B.btp(t) * C.btp(t) * C.ptb * B.ptb * A.ptb * mesh
    //f constructor
    constructor(parent) {
        this.parent = null;
        if (parent !== undefined) {
            this.parent = parent;
            parent.children.push(this);
        }
        this.children = new Array();
        this.transformation      = new Transformation();
        this.transformation_rest = new Transformation();

        this.btp = mat4.create(); // derived from translation and quaternion
        this.ptb = mat4.create();
        this.ptb_rest = mat4.create();
        this.mtb_rest = mat4.create(); // mesh to bone
        this.animated_btm = mat4.create(); // bone to mesh
        this.animated_mtm = mat4.create(); // mesh to animated mesh
    }
    //f transform_from_rest
    transform_from_rest(transform) {
        this.transformation.set(this.transformation_rest, transform);
    }
    //f transform
    transform(transform) {
        this.transformation.set(this.transformation, transform);
    }
    //f derive_matrices
    derive_matrices() {
        mat4.copy(this.btp, this.transformation.mat4());
        mat4.invert(this.ptb, this.btp);
    }
    //f derive_at_rest
    derive_at_rest() {
        this.derive_matrices();
        this.transformation_rest.copy(this.transformation);
        mat4.copy(this.ptb_rest, this.ptb);
        if (this.parent == null) {
            mat4.copy(this.mtb_rest, this.ptb);
        } else {
            mat4.multiply(this.mtb_rest, this.ptb, this.parent.mtb_rest);
        }
        for (const c of this.children) {
            c.derive_at_rest();
        }
    }
    //f derive_animation
    derive_animation() {
        mat4.copy(this.btp, this.transformation.mat4());
        if (this.parent == null) {
            mat4.copy(this.animated_btm, this.btp);
        } else {
            mat4.multiply(this.animated_btm, this.parent.animated_btm, this.btp);
        }
        mat4.multiply(this.animated_mtm, this.animated_btm, this.mtb_rest);
        for (const c of this.children) {
            c.derive_animation();
        }
    }
    //f All done
}
