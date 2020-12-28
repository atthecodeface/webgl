class Submesh {
    constructor(bone_indices, gl_type, offset, count) {
        this.bone_indices = bone_indices;
        this.gl_type = gl_type;
        this.vindex_offset = offset
        this.vindex_count = count;
    }
}
class Mesh {
    //f constructor
    constructor(gl, obj) {
        this.positions = gl.createBuffer();
        this.normals   = gl.createBuffer();
        this.weights   = gl.createBuffer();
        this.indices   = gl.createBuffer();
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positions);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.positions), gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normals);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.normals), gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.weights);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.weights), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(obj.indices), gl.STATIC_DRAW);

        this.submeshes = obj.submeshes;
    }
    draw(gl, shader, bones) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);

        gl.bindBuffer(gl.ARRAY_BUFFER,         this.positions);
        gl.enableVertexAttribArray(shader.attribLocations.vertexPosition);
        gl.vertexAttribPointer(shader.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER,         this.normals);
        gl.enableVertexAttribArray(shader.attribLocations.vertexNormal);
        gl.vertexAttribPointer(shader.attribLocations.vertexNormal, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER,         this.weights);
        gl.enableVertexAttribArray(shader.attribLocations.vertexWeights);
        gl.vertexAttribPointer(shader.attribLocations.vertexWeights, 4, gl.FLOAT, false, 0, 0);

        const mymatrix = Array(64);
        const gl_types = {"TS":gl.TRIANGLE_STRIP};
        for (const sm of this.submeshes) {
            for (var i=0; i<16; i++) {
                mymatrix[ 0+i] = bones[sm.bone_indices[0]].animated_mtm[i];
                mymatrix[16+i] = bones[sm.bone_indices[1]].animated_mtm[i];
                mymatrix[32+i] = bones[sm.bone_indices[2]].animated_mtm[i];
                mymatrix[48+i] = bones[sm.bone_indices[3]].animated_mtm[i];
            }
            gl.uniformMatrix4fv(shader.uniformLocations.boneMatrices, false, mymatrix);    
            gl.drawElements(gl_types[sm.gl_type], sm.vindex_count, gl.UNSIGNED_BYTE, sm.vindex_offset);
        }
    }
}

class MeshObject {
    constructor(gl, obj, world_vec) {
        this.world_matrix = mat4.create();
        this.place(world_vec);
        this.mesh = new Mesh(gl, obj);
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
    place(world_vec) {
        mat4.identity(this.world_matrix);
        this.world_matrix[12] = world_vec[0];
        this.world_matrix[13] = world_vec[1];
        this.world_matrix[14] = world_vec[2];
    }
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
    draw(gl, shader) {
        gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, this.world_matrix);
        this.mesh.draw(gl, shader, this.bones);
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
    submeshes : [ new Submesh([0,1,0,0], "TS", 0, 14),
                ],
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
    submeshes : [ new Submesh([0,1,2,0], "TS", 0, 22),
                ],
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
    submeshes : [ new Submesh([0,1,2,0], "TS", 0, 22),
                ],
}

function draw_objects(gl, shader, meshes, matrices) {
    gl.useProgram(shader.program);
    gl.uniformMatrix4fv(shader.uniformLocations.projectionMatrix,false, matrices[0]);
    gl.uniformMatrix4fv(shader.uniformLocations.cameraMatrix, false, matrices[1]);

    for (const m of meshes) {
        m.draw(gl, shader);
    }
}
