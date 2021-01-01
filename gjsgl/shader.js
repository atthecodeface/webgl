 const vertex_bone4 = `
    attribute vec3 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec4 aVertexWeights;
    attribute vec2 aVertexTexture;

    uniform mat4 uProjectionMatrix;
    uniform mat4 uCameraMatrix;
    uniform mat4 uModelMatrix;
    uniform mat4 uBonesMatrices[4];

    varying vec3 color_pos;
    varying vec3 normal;
    varying vec2 tex_uv;

    void main() {
      mat4 weightedMatrix = ( (uBonesMatrices[0] * aVertexWeights.x) +
                              (uBonesMatrices[1] * aVertexWeights.y) +
                              (uBonesMatrices[2] * aVertexWeights.z) +
                              (uBonesMatrices[3] * aVertexWeights.w) );
      color_pos      = (normalize(aVertexPosition) + 1.) / 2.0;
      vec4 model_pos = weightedMatrix * vec4(aVertexPosition.xyz, 1.0);
      vec3 world_pos = (uModelMatrix * vec4(model_pos.xyz, 1.)).xyz;
      normal         = (uModelMatrix * weightedMatrix * vec4(aVertexNormal,0.)).xyz;
      gl_Position    = uProjectionMatrix * uCameraMatrix * vec4(world_pos.xyz, 1.);
      tex_uv         = aVertexTexture.xy;
    }
  `;

  const frag = `
    precision mediump float;
    uniform sampler2D uTexture;

    varying vec3 color_pos;
    varying vec3 normal;
    varying vec2 tex_uv;
    void main() {
      vec4 t = texture2D(uTexture, tex_uv);
      vec3 light_direction = -normalize(vec3(-0.2, -1., -1.));
      float n = clamp( dot(light_direction, normalize(normal)), 0., 1. );
      vec4 c = vec4((n*0.8 + vec3(0.2)).xyz,1.) * t;
      gl_FragColor = vec4(c.xyz, 1.0);
    //gl_FragColor = t;
      // gl_FragColor = vec4((normalize(normal.xyz)+1.)/2., 1.0);
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
            vertexNormal:   gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
            vertexWeights:  gl.getAttribLocation(shaderProgram, 'aVertexWeights'),
            vertexTexture:   gl.getAttribLocation(shaderProgram, 'aVertexTexture'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            cameraMatrix:     gl.getUniformLocation(shaderProgram, 'uCameraMatrix'),
            modelMatrix:      gl.getUniformLocation(shaderProgram, 'uModelMatrix'),
            boneMatrices:     gl.getUniformLocation(shaderProgram, 'uBonesMatrices'),
        },
        uniforms: {
            Texture:          gl.getUniformLocation(shaderProgram, 'uTexture'),
        },
    };
    return [programInfo];
}
