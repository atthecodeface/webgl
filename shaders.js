 const vertex_bone4 = `
    attribute vec3 aVertexPosition;
    attribute vec4 aVertexWeights;
    uniform mat4 uModelMatrix;
    uniform mat4 uCameraMatrix;
    uniform mat4 uProjectionMatrix;

    uniform mat4 uBonesMatrices[4];
    varying vec3 color_pos;
    void main() {
      color_pos = vec3(aVertexPosition.x,aVertexPosition.y,aVertexPosition.z);
      mat4 weightedMatrix = (uBonesMatrices[0] * aVertexWeights.x) + (uBonesMatrices[1] * aVertexWeights.y)+ (uBonesMatrices[2] * aVertexWeights.z);
      vec4 model_pos = vec4(aVertexPosition.x, aVertexPosition.y, aVertexPosition.z, 1.0);
      model_pos = weightedMatrix * model_pos;
      model_pos.w = 1.0;
      vec4 world_pos;
      world_pos = uModelMatrix * model_pos;
      gl_Position = uProjectionMatrix * uCameraMatrix * world_pos;
    }
  `;

  const frag = `
    precision mediump float;
    varying vec3 color_pos;
    void main() {
      gl_FragColor = vec4(color_pos.x/4.0+0.5, color_pos.y/4.0+0.5, color_pos.z/4.0+0.5, 1.0);
    }
  `;

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

function shader_compile(gl) {
    const shaderProgram = initShaderProgram(gl, vertex_bone4, frag);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexWeights:  gl.getAttribLocation(shaderProgram, 'aVertexWeights'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            cameraMatrix:     gl.getUniformLocation(shaderProgram, 'uCameraMatrix'),
            modelMatrix:      gl.getUniformLocation(shaderProgram, 'uModelMatrix'),
            boneMatrices:     gl.getUniformLocation(shaderProgram, 'uBonesMatrices'),
        },
    };
    return [programInfo];
}
