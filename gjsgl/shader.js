class ShaderClass {
    attributes = {};
    validate(program) {
        console.log(program.attributes);
        for (const sm in program.attributes) {
            this.attributes[sm] = program.attributes[sm];
        }
        //program.attributes;
    }
    get_attr(name) {
        return this.attributes[name];
    }
}

class BoneShaderClass extends ShaderClass {
    name = "Simple shader class";
    attrib_keys = ["vPosition", "vNormal", "vJoints", "vWeights", "vTexture", "vColor",];
}
bone_shader_class = new BoneShaderClass();

class ShaderProgram {
    //f init - invoke post-constructor to get class properties defined
    init(gl) {
        this.vertex_shader   = this.compile(gl, gl.VERTEX_SHADER, this.vertex_source);
        this.fragment_shader = this.compile(gl, gl.FRAGMENT_SHADER, this.fragment_source);
        this.program = gl.createProgram();
        gl.attachShader(this.program, this.vertex_shader)
        gl.attachShader(this.program, this.fragment_shader)
        gl.linkProgram(this.program)
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(this.program));
            return null;
        }
        this.attributes = {};
        this.uniforms   = {};
        for (const k of this.attrib_keys) {
            this.attributes[k] = gl.getAttribLocation(this.program, k);
        }
        for (const k of this.uniform_keys) {
            this.uniforms[k]   = gl.getUniformLocation(this.program, k);
        }
        this.shader_class.validate(this);
        return this;
    }
    //f compile
    compile(gl, shader_type, source) {
        const shader = gl.createShader(shader_type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
    //f get_attr
    get_attr(name) {
        return this.attributes.get(name,None);
    }
    //f set_uniform_if
    set_uniform_if(name, fn) {
        if (name in this.uniforms) {
            fn(this.uniforms[name]);
        }
    }
    //f All done
}

const vertex_bone4 = `
    attribute vec3 vPosition;
    attribute vec3 vNormal;
    attribute vec4 vWeights;
    attribute vec2 vTexture;

    uniform mat4 uProjectionMatrix;
    uniform mat4 uCameraMatrix;
    uniform mat4 uModelMatrix;
    uniform mat4 uBonesMatrices[4];

    varying vec3 color_pos;
    varying vec3 normal;
    varying vec2 tex_uv;

    void main() {
      mat4 weightedMatrix = ( (uBonesMatrices[0] * vWeights.x) +
                              (uBonesMatrices[1] * vWeights.y) +
                              (uBonesMatrices[2] * vWeights.z) +
                              (uBonesMatrices[3] * vWeights.w) );
      color_pos      = (normalize(vPosition) + 1.) / 2.0;
      vec4 model_pos = weightedMatrix * vec4(vPosition.xyz, 1.0);
      vec3 world_pos = (uModelMatrix * vec4(model_pos.xyz, 1.)).xyz;
      normal         = (uModelMatrix * weightedMatrix * vec4(vNormal,0.)).xyz;
      gl_Position    = uProjectionMatrix * uCameraMatrix * vec4(world_pos.xyz, 1.);
      tex_uv         = vTexture.xy;
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

//c BoneShader
class BoneShader extends ShaderProgram {
    shader_class = bone_shader_class;
    vertex_source = vertex_bone4;
    fragment_source = frag;
    attrib_keys = ["vPosition", "vNormal", "vJoints", "vWeights", "vTexture", "vColor",];
    uniform_keys = ["uProjectionMatrix", "uCameraMatrix", "uModelMatrix", "uMeshMatrix", "uBonesMatrices", "uBonesScale", "uTexture" ];
}

