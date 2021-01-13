class ObjectModel extends ModelClass {
    constructor(name, obj) {
        const bones = BoneSet();
        var b = new Bone(parent=None, transformation=Transformation(translation=(0.,0.,-1.)));
        bones.add_bone(b);
        b = Bone(parent=bones.bones[0], transformation=Transformation(translation=(0.,0.,2.)));
        bones.add_bone(b);
        bones.rewrite_indices();
        
        num_pts = obj.weights.length/4;
        buffer_data = [];
        buffer_data.extend(obj.positions);
        buffer_data.extend(obj.normals);
        buffer_data.extend(obj.texcoords);
        for (var i=0; i<num_pts; i++) {
            buffer_data.extend([0.5,0.5,0.,0.]) // obj.weights
        }
        buffer_int_data = [];
        for (var i=0; i<num_pts; i++) {
            buffer_int_data.push(0,1,2,3);
        }
        const buffer_size = buffer_data.length * 4;
        const model_data      = ModelBufferData(data=np.array(buffer_data,np.float32), byte_offset=0);
        const model_int_data  = ModelBufferData(data=np.array(buffer_int_data,np.uint8), byte_offset=0);
        const model_indices   = ModelBufferIndices(data=np.array(obj.indices,np.uint8), byte_offset=0);
        var o = 0;
        view = ModelPrimitiveView();
        view.position    = ModelBufferView(data=model_data, count=3, gl_type=GL.GL_FLOAT, offset=o);
        o += num_pts * 12;
        view.normal      = ModelBufferView(data=model_data, count=3, gl_type=GL.GL_FLOAT, offset=o);
        o += num_pts * 12;
        view.tex_coords  = ModelBufferView(data=model_data, count=2, gl_type=GL.GL_FLOAT, offset=o)
        o += num_pts * 8;
        view.weights     = ModelBufferView(data=model_data, count=4, gl_type=GL.GL_FLOAT, offset=o)
        o += num_pts * 16;
        o = 0;
        view.joints      = ModelBufferView(data=model_int_data, count=4, gl_type=GL.GL_UNSIGNED_BYTE, offset=o);
        o += num_pts * 4;
        
        view.indices = model_indices;

        material = ModelMaterial();
        material.color = (1.,5.,3.,1.);
        
        primitive = ModelPrimitive();
        primitive.view = view;
        primitive.material = material;
        primitive.gl_type = GL.GL_TRIANGLE_STRIP;
        primitive.indices_offset  = 0;
        primitive.indices_count   = obj.indices.length;
        primitive.indices_gl_type = GL.GL_UNSIGNED_BYTE;

        root_object = ModelObject(parent=None);
        root_object.bones = bones;
        root_object.mesh = ModelMesh();
        root_object.mesh.primitives.append(primitive);
        super(name, root_object);
    }
}
