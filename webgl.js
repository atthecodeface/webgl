// a skinned mesh vertex is a vec3 and an array of N influences for N bones
// Each bone derives a mat4.
// PosedVertex = Sum(Influence[n] * BoneMat4[n]) * RestVertex
function main() {
  const canvas = document.querySelector("#glcanvas");
  const gl     = canvas.getContext("webgl");
  if (!gl) {
    alert("Unable to start webgl");
    return;
  }

 const vsSource = `
    attribute vec4 aVertexPosition;
    uniform mat4 uModelMatrix;
    uniform mat4 uCameraMatrix;
    uniform mat4 uProjectionMatrix;

    uniform mat4 uBonesMatrices[4];
    varying vec3 color_pos;
    void main() {
      color_pos = vec3(aVertexPosition.x,aVertexPosition.y,aVertexPosition.z);
      mat4 weightedMatrix = (uBonesMatrices[0] * aVertexPosition.w) + (uBonesMatrices[1] * (1.0-aVertexPosition.w));
      vec4 model_pos = aVertexPosition;
      model_pos.w = 1.0;
      model_pos = weightedMatrix * model_pos;
      model_pos.w = 1.0;
      vec4 world_pos;
      world_pos = uModelMatrix * model_pos;
      gl_Position = uProjectionMatrix * uCameraMatrix * world_pos;
    }
  `;

  const fsSource = `
    precision mediump float;
    varying vec3 color_pos;
    void main() {
      gl_FragColor = vec4(color_pos.x/2.0+0.5, color_pos.y/2.0+0.5, color_pos.z/2.0+0.5, 1.0);
    }
  `;

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      cameraMatrix:     gl.getUniformLocation(shaderProgram, 'uCameraMatrix'),
      modelMatrix:      gl.getUniformLocation(shaderProgram, 'uModelMatrix'),
      bonelMatrices:    gl.getUniformLocation(shaderProgram, 'uBonesMatrices'),
    },
  };

  const buffers = initBuffers(gl);
  run_animation(gl, programInfo, buffers);
}
class Bone {
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
    constructor(parent) {
        this.parent = parent;
        if (parent != null) {
            parent.children.push(this);
        }
        this.children = new Array();
        this.translation = vec3.create();
        this.quaternion = quat.create();
        quat.identity(this.quaternion);
        this.btp = mat4.create(); // derived from translation and quaternion
        this.ptb = mat4.create();
        this.translation_rest = vec3.create();
        this.quaternion_rest = quat.create();
        this.ptb_rest = mat4.create();
        this.mtb_rest = mat4.create(); // mesh to bone
        this.animated_btm = mat4.create(); // bone to mesh
        this.animated_mtm = mat4.create(); // mesh to animated mesh
    }
    quaternion_from_rest(quaternion) {
        quat.multiply(this.quaternion, quaternion, this.quaternion_rest);
    }
    translate_from_rest(trans) {
        vec3.add(this.translation, trans, this.translation_rest);
    }
    derive_matrices() {
        mat4.fromQuat(this.btp, this.quaternion);
        mat4.add(this.btp, this.btp, mat4.fromTranslation(mat4.create(),this.translation));
        mat4.invert(this.ptb, this.btp);
    }
    derive_at_rest() {
        this.derive_matrices();
        vec3.copy(this.translation_rest, this.translation);
        quat.copy(this.quaternion_rest, this.quaternion);
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
    derive_animation() {
        mat4.fromQuat(this.btp, this.quaternion);
        mat4.add(this.btp, this.btp, mat4.fromTranslation(mat4.create(),this.translation));
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
}
var time=0.0;
function run_animation(gl, programInfo, buffers) {
a = new Bone(null);
b = new Bone(a);
a.derive_at_rest();
    a.derive_animation();
    bones = [a,b];
    step_animation = function() {drawScene(gl, programInfo, buffers, time, bones); time+=0.1; requestAnimationFrame(step_animation);}
    requestAnimationFrame(step_animation);
}

function initBuffers(gl) {

    // cube front face   back face (as seen from front)
    //        1    0        5   4
    //        3    2        7   6
    // triangles (anticlockwise for first)
    //  3.2.1 2.1.0 1.0.4 0.4.2 4.2.6 2.6.7 6.7.4 7.4.5 4.5.1 5.1.7 1.7.3 7.3.2
    // strip
    // 3, 2, 1, 0, 4, 2, 6, 7, 4, 5, 1, 7, 3, 2
  const positions = [
      1.0,  1.0, 1.0,     1.0,
      -1.0,  1.0, 1.0,    1.0,
      1.0, -1.0, 1.0,     1.0,
      -1.0, -1.0, 1.0,    1.0,
      1.0,  1.0, -1.0,    0.0,
      -1.0,  1.0, -1.0,   0.0,
      1.0, -1.0, -1.0,    0.0,
      -1.0, -1.0, -1.0,   0.0,
  ];
  const indices = [3, 2, 1, 0, 4, 2, 6, 7, 4, 5, 1, 7, 3, 2];
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
  return {
    position: positionBuffer,
    index:    indexBuffer,
  };
}

function drawScene(gl, programInfo, buffers, time, bones) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
//    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  const cameraMatrix = mat4.create();
  mat4.translate(cameraMatrix,     // destination matrix
                 cameraMatrix,     // matrix to translate
                 [-0.0, 0.0, -10.0]);  // amount to translate

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  gl.useProgram(programInfo.program);

  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix,false, projectionMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.cameraMatrix, false, cameraMatrix);

    const mymatrix = Array(64);
    const q = quat.create();
    const angle=Math.sin(time)*0.3;
    quat.identity(q);
    // bones[0].translate_from_rest(vec3.set(vec3.create(),0.,angle*5,0.));
    bones[0].translate_from_rest(vec3.set(vec3.create(),0.,0.,0.));
    bones[0].quaternion_from_rest(q);
    quat.identity(q);
    quat.rotateZ(q,q,angle);
    bones[1].translate_from_rest(vec3.set(vec3.create(),0.,0.,-angle*5));
    bones[1].quaternion_from_rest(q);
    bones[0].derive_animation();
    mat4.copy(mymatrix, bones[0].animated_mtm);
    for (var i=0; i<16; i++) {mymatrix[16+i] = bones[1].animated_mtm[i];}
  gl.uniformMatrix4fv(programInfo.uniformLocations.bonelMatrices, false, mymatrix);    

  gl.bindBuffer(gl.ARRAY_BUFFER,         buffers.position);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 4, gl.FLOAT, false, 0, 0);

  const axis1 = vec3.create();
  const axis2 = vec3.create();
  vec3.set(axis1,0.,1.,0.);
  vec3.set(axis2,1.,0.,0.);
  var modelMatrix = mat4.create();
  const scale = vec4.create();
  vec3.set(scale,0.5,0.5,0.5,1.0);
  mat4.translate(modelMatrix, modelMatrix, [3.0, 0.0, 0.0]);
  mat4.rotate(modelMatrix, modelMatrix, time*0.13, axis2 );
  mat4.rotate(modelMatrix, modelMatrix, time*0.1, axis1 );
    mat4.scale(modelMatrix, modelMatrix, scale);
  gl.uniformMatrix4fv(programInfo.uniformLocations.modelMatrix, false, modelMatrix);
  gl.drawElements(gl.TRIANGLE_STRIP, 14, gl.UNSIGNED_BYTE, 0);
  modelMatrix = mat4.create();
  mat4.translate(modelMatrix, modelMatrix, [3.0, 3.0, 0.0]);
  mat4.rotate(modelMatrix, modelMatrix, time*0.13, axis2 );
  mat4.rotate(modelMatrix, modelMatrix, time*0.1, axis1 );
  gl.uniformMatrix4fv(programInfo.uniformLocations.modelMatrix, false, modelMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 8);
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}
main();
