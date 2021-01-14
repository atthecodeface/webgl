//c Submesh
class Submesh {
    constructor(bone_indices, gl_type, offset, count) {
        this.bone_indices = bone_indices;
        this.gl_type = gl_type;
        this.vindex_offset = offset
        this.vindex_count = count;
    }
}

//c Mesh
class Mesh {
    //f constructor
    constructor(shader, obj) {

        const num_pts = obj.weights.length/4;
        obj.joints = []
        for (var i=0; i<num_pts; i++) {
            obj.joints.push(0);
            obj.joints.push(1);
            obj.joints.push(2);
            obj.joints.push(3);
        }

        this.obj        = obj;
        
        this.glid = GL.createVertexArray(1);
        GL.bindVertexArray(this.glid);

        var a;
        a = shader.get_attr("vPosition");
        if (a !== undefined) {
            this.positions  = GL.createBuffer();
            GL.bindBuffer(GL.ARRAY_BUFFER, this.positions);
            GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(obj.positions), GL.STATIC_DRAW);
            GL.enableVertexAttribArray(a);
            GL.vertexAttribPointer(a, 3, GL.FLOAT, false, 0, 0);
        }
        
        a = shader.get_attr("vNormal");
        if (a !== undefined) {
            this.normals  = GL.createBuffer();
            GL.bindBuffer(GL.ARRAY_BUFFER, this.normals);
            GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(obj.normals), GL.STATIC_DRAW);
            GL.enableVertexAttribArray(a);
            GL.vertexAttribPointer(a, 3, GL.FLOAT, false, 0, 0);
        }
        
        a = shader.get_attr("vTexture");
        if (a !== undefined) {
            this.texcoords  = GL.createBuffer();
            GL.bindBuffer(GL.ARRAY_BUFFER, this.texcoords);
            GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(obj.texcoords), GL.STATIC_DRAW);
            GL.enableVertexAttribArray(a);
            GL.vertexAttribPointer(a, 2, GL.FLOAT, false, 0, 0);
        }
        
        a = shader.get_attr("vWeights");
        if (a !== undefined) {
            this.weights  = GL.createBuffer();
            GL.bindBuffer(GL.ARRAY_BUFFER, this.weights);
            GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(obj.weights), GL.STATIC_DRAW);
            GL.enableVertexAttribArray(a);
            GL.vertexAttribPointer(a, 4, GL.FLOAT, false, 0, 0);
        }
        
        a = shader.get_attr("vJoints");
        if (a !== undefined) {
            this.joints  = GL.createBuffer();
            GL.bindBuffer(GL.ARRAY_BUFFER, this.joints);
            GL.bufferData(GL.ARRAY_BUFFER, new Uint8Array(obj.joints), GL.STATIC_DRAW);
            GL.enableVertexAttribArray(a);
            GL.vertexAttribPointer(a, 4, GL.UNSIGNED_BYTE, false, 0, 0);
        }
        
        this.indices    = GL.createBuffer();
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indices);
        GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint8Array(obj.indices), GL.STATIC_DRAW);
    }
    //f bind
    bind(shader) {
        GL.bindVertexArray(this.glid);
    }
    //f draw
    draw(shader, poses, texture) {
        this.bind(shader);

        GL.activeTexture(GL.TEXTURE0);
        GL.bindTexture(GL.TEXTURE_2D, texture.texture);
        shader.set_uniform_if("uTexture",
                              (u) => GL.uniform1i(u, 0) );
        shader.set_uniform_if("uBonesScale",
                              (u) => GL.uniform1f(u, 1.) );
        shader.set_uniform_if("uBonesMatrices",
                              (u) => GL.uniformMatrix4fv(u, false, poses.data) );


        const mymatrix = Array(64);
        const gl_types = {"TS":GL.TRIANGLE_STRIP};
        for (const sm of this.obj.submeshes) {
            GL.drawElements(gl_types[sm.gl_type], sm.vindex_count, GL.UNSIGNED_BYTE, sm.vindex_offset);
        }
    }
    //f All done
}

//c MeshObject
class MeshObject {
    //f constructor
    constructor(shader, obj, texture, world_vec) {
        this.texture = texture;
        this.world_matrix = mat4.create();
        this.place(world_vec);
        this.mesh = new Mesh(shader, obj);

        this.bones = new BoneSet();
        this.bones.add_bone(new Bone(undefined,           new Transformation(vec3.set(vec3.create(),0.,0., 1.))));
        this.bones.add_bone(new Bone(this.bones.bones[0], new Transformation(vec3.set(vec3.create(),0.,0.,-2.))));
        this.bones.add_bone(new Bone(this.bones.bones[1], new Transformation(vec3.set(vec3.create(),0.,0.,-2.))));
        this.bones.rewrite_indices();
        this.bones.derive_matrices();
        this.pose = new BonePoseSet(this.bones);
        this.poses = this.pose.poses;

    }
    //f place
    place(world_vec) {
        mat4.identity(this.world_matrix);
        this.world_matrix[12] = world_vec[0];
        this.world_matrix[13] = world_vec[1];
        this.world_matrix[14] = world_vec[2];
    }
    //f animate
    animate(time) {
        this.poses[0].transformation_reset();
        this.poses[1].transformation_reset();
        this.poses[2].transformation_reset();

        const q = quat.create();
        const angle=Math.sin(time*0.2)*0.3;
        quat.identity(q);
        quat.rotateX(q,q,1.85);
        //quat.rotateX(q,q,+angle*2);
        quat.rotateZ(q,q,time*0.3);
        this.poses[0].transform(new Transformation([0.,0.,0.],q));
        quat.identity(q);
        quat.rotateZ(q,q,4*angle);
        this.poses[1].transform(new Transformation([0.,0.,1.0-Math.cos(4*angle)],q));
        quat.identity(q);
        quat.rotateZ(q,q,-4*angle);
        this.poses[2].transform(new Transformation([0.,0.,1.0+Math.cos(4*angle)],q));
        this.pose.update(Math.floor(time*1E5));
    }
    //f draw
    draw(shader) {
        shader.set_uniform_if("uModelMatrix",
                                      (u) => GL.uniformMatrix4fv(u, false, this.world_matrix) );
        this.mesh.draw(shader, this.pose, this.texture);
    }
    //f All done
}
