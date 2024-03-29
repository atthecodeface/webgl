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
