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
        this.obj        = obj;
        
        this.positions  = GL.createBuffer();
        this.normals    = GL.createBuffer();
        this.texcoords  = GL.createBuffer();
        this.weights    = GL.createBuffer();
        this.indices    = GL.createBuffer();
        
        GL.bindBuffer(GL.ARRAY_BUFFER, this.positions);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(obj.positions), GL.STATIC_DRAW);
        
        GL.bindBuffer(GL.ARRAY_BUFFER, this.normals);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(obj.normals), GL.STATIC_DRAW);
        
        GL.bindBuffer(GL.ARRAY_BUFFER, this.texcoords);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(obj.texcoords), GL.STATIC_DRAW);
        
        GL.bindBuffer(GL.ARRAY_BUFFER, this.weights);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(obj.weights), GL.STATIC_DRAW);

        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indices);
        GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint8Array(obj.indices), GL.STATIC_DRAW);
    }
    //f bind
    bind(shader) {
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indices);

        GL.bindBuffer(GL.ARRAY_BUFFER,         this.positions);
        GL.enableVertexAttribArray(shader.attribLocations.vertexPosition);
        GL.vertexAttribPointer(shader.attribLocations.vertexPosition, 3, GL.FLOAT, false, 0, 0);

        GL.bindBuffer(GL.ARRAY_BUFFER,         this.normals);
        GL.enableVertexAttribArray(shader.attribLocations.vertexNormal);
        GL.vertexAttribPointer(shader.attribLocations.vertexNormal, 3, GL.FLOAT, false, 0, 0);

        GL.bindBuffer(GL.ARRAY_BUFFER,         this.texcoords);
        GL.enableVertexAttribArray(shader.attribLocations.vertexTexture);
        GL.vertexAttribPointer(shader.attribLocations.vertexTexture, 2, GL.FLOAT, false, 0, 0);

        GL.bindBuffer(GL.ARRAY_BUFFER,         this.weights);
        GL.enableVertexAttribArray(shader.attribLocations.vertexWeights);
        GL.vertexAttribPointer(shader.attribLocations.vertexWeights, 4, GL.FLOAT, false, 0, 0);

    }
    //f draw
    draw(shader, bones, texture) {
        this.bind(shader);

        GL.activeTexture(GL.TEXTURE0);
        GL.bindTexture(GL.TEXTURE_2D, texture);
        GL.uniform1i(shader.uniforms.Texture, 0);

        const mymatrix = Array(64);
        const gl_types = {"TS":GL.TRIANGLE_STRIP};
        for (const sm of this.obj.submeshes) {
            for (var i=0; i<16; i++) {
                mymatrix[ 0+i] = bones[sm.bone_indices[0]].animated_mtm[i];
                mymatrix[16+i] = bones[sm.bone_indices[1]].animated_mtm[i];
                mymatrix[32+i] = bones[sm.bone_indices[2]].animated_mtm[i];
                mymatrix[48+i] = bones[sm.bone_indices[3]].animated_mtm[i];
            }
            GL.uniformMatrix4fv(shader.uniformLocations.boneMatrices, false, mymatrix);    
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
        this.bones.push(new Bone(null));
        this.bones.push(new Bone(this.bones[0]));
        this.bones.push(new Bone(this.bones[1]));
        this.bones[0].translate_from_rest(vec3.set(vec3.create(),0.,0.,1.));
        this.bones[1].translate_from_rest(vec3.set(vec3.create(),0.,0.,-2.));
        this.bones[2].translate_from_rest(vec3.set(vec3.create(),0.,0.,-2.));
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
        this.bones[0].translate_from_rest(vec3.set(vec3.create(),0.,0.,0.));
        this.bones[0].quaternion_from_rest(q);
        quat.identity(q);
        quat.rotateZ(q,q,4*angle);
        this.bones[1].translate_from_rest(vec3.set(vec3.create(),0.,0.,1.0-Math.cos(4*angle)));
        this.bones[1].quaternion_from_rest(q);
        quat.identity(q);
        quat.rotateZ(q,q,-4*angle);
        this.bones[2].translate_from_rest(vec3.set(vec3.create(),0.,0.,1.0-Math.cos(4*angle)));
        this.bones[2].quaternion_from_rest(q);
        this.bones[0].derive_animation();
    }
    //f draw
    draw(shader) {
        GL.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, this.world_matrix);
        this.mesh.draw(shader, this.bones, this.texture);
    }
    //f All done
}
