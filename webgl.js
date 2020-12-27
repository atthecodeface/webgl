function main() {
  const canvas = document.querySelector("#glcanvas");
  const gl     = canvas.getContext("webgl");
  if (!gl) {
    alert("Unable to start webgl");
    return;
  }

 const vsSource = `
    attribute vec4 aVertexPosition;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uCameraMatrix;
    uniform mat4 uProjectionMatrix;
    varying vec4 color_pos;
    void main() {
      color_pos = aVertexPosition;
      vec4 world_pos;
      world_pos = uModelViewMatrix * aVertexPosition;
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
      modelViewMatrix:  gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
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
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

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

  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(positions),
                gl.STATIC_DRAW);

  return {
    position: positionBuffer,
  };
}

//
// Draw the scene.
//
function drawScene(gl, programInfo, buffers, time) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  const cameraMatrix = mat4.create();
  mat4.translate(cameraMatrix,     // destination matrix
                 cameraMatrix,     // matrix to translate
                 [-0.0, 0.0, -6.0]);  // amount to translate

  const modelViewMatrix = mat4.create();
  const axis1 = vec3.create();
  const axis2 = vec3.create();
  vec3.set(axis1,0.,1.,0.);
  vec3.set(axis2,1.,0.,0.);
  mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, 1.0]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, time*0.13, axis2 );
  mat4.rotate(modelViewMatrix, modelViewMatrix, time*0.1, axis1 );

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  gl.useProgram(programInfo.program);

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix,false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.cameraMatrix, false, cameraMatrix);
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
  {
    const offset = 0;
    const vertexCount = 8;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
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
