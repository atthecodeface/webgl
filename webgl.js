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
    varying vec4 color_pos;
    void main() {
      color_pos = aVertexPosition;
      vec4 world_pos;
      world_pos = uModelMatrix * aVertexPosition;
      gl_Position = uProjectionMatrix * uCameraMatrix * world_pos;
    }
  `;

  const fsSource = `
    precision mediump float;
    varying vec4 color_pos;
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
      modelMatrix:  gl.getUniformLocation(shaderProgram, 'uModelMatrix'),
    },
  };

  const buffers = initBuffers(gl);
    run_animation(gl, programInfo, buffers);
}
var time=0.0;
function run_animation(gl, programInfo, buffers) {
    step_animation = function() {drawScene(gl, programInfo, buffers, time); time+=0.1; requestAnimationFrame(step_animation);}
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
      1.0,  1.0, 1.0,
      -1.0,  1.0, 1.0,
      1.0, -1.0, 1.0,
      -1.0, -1.0, 1.0,
      1.0,  1.0, -1.0,
      -1.0,  1.0, -1.0,
      1.0, -1.0, -1.0,
      -1.0, -1.0, -1.0,
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

function drawScene(gl, programInfo, buffers, time) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

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

  gl.bindBuffer(gl.ARRAY_BUFFER,         buffers.position);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);

  const axis1 = vec3.create();
  const axis2 = vec3.create();
  vec3.set(axis1,0.,1.,0.);
  vec3.set(axis2,1.,0.,0.);
  var modelMatrix = mat4.create();
  mat4.translate(modelMatrix, modelMatrix, [3.0, 0.0, 0.0]);
  mat4.rotate(modelMatrix, modelMatrix, time*0.13, axis2 );
  mat4.rotate(modelMatrix, modelMatrix, time*0.1, axis1 );
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
