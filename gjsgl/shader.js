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
    init() {
        this.init_promises = [];
        this.init_promises.push(new Promise(
            (resolve) => {
                fetch(this.vertex_uri).then(
                    (response) => {
                        if (!response.ok) {
                            throw new Error("Failed to fetch vertex shader "+this.vertex_uri);
                        } else {
                            return response.text();
                        }
                    }).then(
                        (text) => {
                            this.vertex_source = "#version 300 es\n"+text;
                            resolve();
                        });
            }) );
        this.init_promises.push(new Promise(
            (resolve) => {
                fetch(this.fragment_uri).then(
                    (response) => {
                        if (!response.ok) {
                            throw new Error("Failed to fetch fragment shader "+this.fragment_uri);
                        } else {
                            return response.text();
                        }
                    }).then(
                        (text) => {
                            this.fragment_source = "#version 300 es\nprecision mediump float;\n"+text;
                            resolve();
                        });
            }) );
        return Promise.all(this.init_promises);
    }
    //f gl_ready - invoke post-constructor to get class properties defined
    gl_ready() {
        this.vertex_shader   = this.compile(GL.VERTEX_SHADER,   this.vertex_source);
        this.fragment_shader = this.compile(GL.FRAGMENT_SHADER, this.fragment_source);
        this.program = GL.createProgram();
        GL.attachShader(this.program, this.vertex_shader)
        GL.attachShader(this.program, this.fragment_shader)
        GL.linkProgram(this.program)
        if (!GL.getProgramParameter(this.program, GL.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + GL.getProgramInfoLog(this.program));
            return null;
        }
        this.attributes = {};
        this.uniforms   = {};
        for (const k of this.attrib_keys) {
            this.attributes[k] = GL.getAttribLocation(this.program, k);
        }
        for (const k of this.uniform_keys) {
            this.uniforms[k]   = GL.getUniformLocation(this.program, k);
        }
        this.shader_class.validate(this);
        return this;
    }
    //f compile
    compile(shader_type, source) {
        const shader = GL.createShader(shader_type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
            alert('An error occurred compiling the shaders: ' + GL.getShaderInfoLog(shader));
            GL.deleteShader(shader);
            return null;
        }
        return shader;
    }
    //f get_attr
    get_attr(name) {
        return this.attributes[name];
    }
    //f set_uniform_if
    set_uniform_if(name, fn) {
        if (name in this.uniforms) {
            fn(this.uniforms[name]);
        }
    }
    //f All done
}

//c BoneShader
class BoneShader extends ShaderProgram {
    shader_class = bone_shader_class;
    vertex_uri   = "./shader/bone_shader_v.glsl";
    fragment_uri = "./shader/bone_shader_f.glsl";
    attrib_keys = ["vPosition", "vNormal", "vJoints", "vWeights", "vTexture", "vColor",];
    uniform_keys = ["uProjectionMatrix", "uCameraMatrix", "uModelMatrix", "uMeshMatrix", "uBonesMatrices", "uBonesScale", "uMaterial.base_color", "uMaterial.base_texture" ];
}

//c GlowShader
class GlowShader extends ShaderProgram {
    shader_class = bone_shader_class;
    vertex_uri   = "./shader/unboned_shader_v.glsl";
    fragment_uri = "./shader/glow_shader_f.glsl";
    attrib_keys = ["vPosition", "vNormal", "vJoints", "vWeights", "vTexture", "vColor",];
    uniform_keys = ["uProjectionMatrix", "uCameraMatrix", "uModelMatrix", "uMeshMatrix", "uMaterial.color", ];
}

