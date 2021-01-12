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
    constructor(obj) {

        const num_pts = obj.weights.length/4;
        obj.joints = []
        for (var i=0; i<num_pts; i++) {
            obj.joints.push(0);
            obj.joints.push(1);
            obj.joints.push(2);
            obj.joints.push(3);
        }

        this.obj        = obj;
        
        this.positions  = GL.createBuffer();
        this.normals    = GL.createBuffer();
        this.texcoords  = GL.createBuffer();
        this.weights    = GL.createBuffer();
        this.joints     = GL.createBuffer();
        this.indices    = GL.createBuffer();
        
        GL.bindBuffer(GL.ARRAY_BUFFER, this.positions);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(obj.positions), GL.STATIC_DRAW);
        
        GL.bindBuffer(GL.ARRAY_BUFFER, this.normals);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(obj.normals), GL.STATIC_DRAW);
        
        GL.bindBuffer(GL.ARRAY_BUFFER, this.texcoords);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(obj.texcoords), GL.STATIC_DRAW);
        
        GL.bindBuffer(GL.ARRAY_BUFFER, this.weights);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(obj.weights), GL.STATIC_DRAW);

        GL.bindBuffer(GL.ARRAY_BUFFER, this.joints);
        GL.bufferData(GL.ARRAY_BUFFER, new Int32Array(obj.joints), GL.STATIC_DRAW);

        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indices);
        GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint8Array(obj.indices), GL.STATIC_DRAW);
    }
    //f bind
    bind(shader) {
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indices);

        GL.bindBuffer(GL.ARRAY_BUFFER,         this.positions);
        GL.enableVertexAttribArray(shader.attributes["vPosition"]);
        GL.vertexAttribPointer(shader.attributes["vPosition"], 3, GL.FLOAT, false, 0, 0);

        GL.bindBuffer(GL.ARRAY_BUFFER,         this.normals);
        GL.enableVertexAttribArray(shader.attributes["vNormal"]);
        GL.vertexAttribPointer(shader.attributes["vNormal"], 3, GL.FLOAT, false, 0, 0);

        GL.bindBuffer(GL.ARRAY_BUFFER,         this.texcoords);
        GL.enableVertexAttribArray(shader.attributes["vTexture"]);
        GL.vertexAttribPointer(shader.attributes["vTexture"], 2, GL.FLOAT, false, 0, 0);

        GL.bindBuffer(GL.ARRAY_BUFFER,         this.weights);
        GL.enableVertexAttribArray(shader.attributes["vWeights"]);
        GL.vertexAttribPointer(shader.attributes["vWeights"], 4, GL.FLOAT, false, 0, 0);

        GL.bindBuffer(GL.ARRAY_BUFFER,         this.joints);
        GL.enableVertexAttribArray(shader.attributes["vJoints"]);
        GL.vertexAttribPointer(shader.attributes["vJoints"], 4, GL.INT, false, 0, 0);

    }
    //f draw
    draw(shader, bones, texture) {
        this.bind(shader);

        GL.activeTexture(GL.TEXTURE0);
        GL.bindTexture(GL.TEXTURE_2D, texture);
        GL.uniform1i(shader.uniforms["uTexture"], 0);
        GL.uniform1f(shader.uniforms["uBonesScale"], 1.);

        const mymatrix = Array(64);
        const gl_types = {"TS":GL.TRIANGLE_STRIP};
        for (const sm of this.obj.submeshes) {
            for (var i=0; i<16; i++) {
                mymatrix[ 0+i] = bones[sm.bone_indices[0]].animated_mtm[i];
                mymatrix[16+i] = bones[sm.bone_indices[1]].animated_mtm[i];
                mymatrix[32+i] = bones[sm.bone_indices[2]].animated_mtm[i];
                mymatrix[48+i] = bones[sm.bone_indices[3]].animated_mtm[i];
            }
            GL.uniformMatrix4fv(shader.uniforms["uBonesMatrices"], false, mymatrix);    
            GL.drawElements(gl_types[sm.gl_type], sm.vindex_count, GL.UNSIGNED_BYTE, sm.vindex_offset);
        }
    }
    //f All done
}

//c MeshObject
class MeshObject {
    //f constructor
    constructor(obj, texture, world_vec) {
        this.texture = texture;
        this.world_matrix = mat4.create();
        this.place(world_vec);
        this.mesh = new Mesh(obj);
        this.bones = []
        this.bones.push(new Bone());
        this.bones.push(new Bone(this.bones[0]));
        this.bones.push(new Bone(this.bones[1]));
        this.bones[0].transform(new Transformation([0.,0.,1.]));
        this.bones[1].transform(new Transformation([0.,0.,-2.]));
        this.bones[2].transform(new Transformation([0.,0.,-2.]));
        this.bones[0].derive_at_rest();
        this.bones[0].derive_animation();
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
        const q = quat.create();
        const angle=Math.sin(time*0.2)*0.3;
        quat.identity(q);
        quat.rotateX(q,q,1.85);
        //quat.rotateX(q,q,+angle*2);
        quat.rotateZ(q,q,time*0.3);
        this.bones[0].transform_from_rest(new Transformation([0.,0.,0.],q));
        quat.identity(q);
        quat.rotateZ(q,q,4*angle);
        this.bones[1].transform_from_rest(new Transformation([0.,0.,1.0-Math.cos(4*angle)],q));
        quat.identity(q);
        quat.rotateZ(q,q,-4*angle);
        this.bones[2].transform_from_rest(new Transformation([0.,0.,1.0+Math.cos(4*angle)],q));
        this.bones[0].derive_animation();
    }
    //f draw
    draw(shader) {
        GL.uniformMatrix4fv(shader.uniforms["uModelMatrix"], false, this.world_matrix);
        this.mesh.draw(shader, this.bones, this.texture);
    }
    //f All done
}
