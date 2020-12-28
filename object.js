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
    constructor(gl, positions, weights, indices, submeshes) {
        this.positions = gl.createBuffer();
        this.weights   = gl.createBuffer();
        this.indices   = gl.createBuffer();
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positions);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.weights);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(weights), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

        this.submeshes = submeshes;
    }
    draw(gl, shader, bones) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);

        gl.bindBuffer(gl.ARRAY_BUFFER,         this.positions);
        gl.enableVertexAttribArray(shader.attribLocations.vertexPosition);
        gl.vertexAttribPointer(shader.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);

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
    // cube front face   back face (as seen from front)
    //        1    0        5   4
    //        3    2        7   6
    // triangles (anticlockwise for first)
    //  3.2.1 2.1.0 1.0.4 0.4.2 4.2.6 2.6.7 6.7.4 7.4.5 4.5.1 5.1.7 1.7.3 7.3.2
    // Cube strip
    // 3, 2, 1, 0, 4, 2, 6, 7, 4, 5, 1, 7, 3, 2
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

function draw_objects(gl, shader, meshes, bones, matrices) {
    gl.useProgram(shader.program);
    gl.uniformMatrix4fv(shader.uniformLocations.projectionMatrix,false, matrices[0]);
    gl.uniformMatrix4fv(shader.uniformLocations.cameraMatrix, false, matrices[1]);
    gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, matrices[2]);

    for (const m of meshes) {
        m.draw(gl, shader, bones);
    }
}
