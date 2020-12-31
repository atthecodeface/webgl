from OpenGL.GL import *
class Shader:
    #f loadShader
    @staticmethod
    def loadShader(t, source):
        shader = glCreateShader(t)
        glShaderSource(shader, source);
        glCompileShader(shader);
        if glGetShaderiv(shader, GL_COMPILE_STATUS) !=1:
            raise Exception(f"Failed to compile shader {glGetShaderInfoLog(shader).decode()}")
        return shader
    #f __init__
    def __init__(self):
        self.vertex_shader   = self.loadShader(GL_VERTEX_SHADER, self.vertex_source)
        self.fragment_shader = self.loadShader(GL_FRAGMENT_SHADER, self.frag_source)
        self.program = glCreateProgram()
        glAttachShader(self.program, self.vertex_shader)
        glAttachShader(self.program, self.fragment_shader)
        glLinkProgram(self.program)
        if (glGetProgramiv(self.program, GL_LINK_STATUS)) != 1:
            raise Exception(f"Unable to initialize the shader program: {glGetShaderInfoLog(self.program).decode()}")
        self.attributes = {}
        self.uniforms   = {}
        for k in self.attrib_keys:
            self.attributes[k] = glGetAttribLocation(self.program, k)
            pass
        for k in self.uniform_keys:
            self.uniforms[k]   = glGetUniformLocation(self.program, k)
            pass
        pass
    #f use
    def use(self, uniforms):
        for (k,v) in uniforms:
            pass
        pass
    pass

class BoneShader(Shader):
    vertex_source = """
    #version 330 core
    layout(location = 0) in vec3 aVertexPosition;
    layout(location = 1) in vec3 aVertexNormal;
    layout(location = 2) in vec4 aVertexWeights;
    layout(location = 3) in vec2 aVertexTexture;

    uniform mat4 uProjectionMatrix;
    uniform mat4 uCameraMatrix;
    uniform mat4 uModelMatrix;
    uniform mat4 uBonesMatrices[4];

    out vec3 color_pos;
    out vec3 normal;
    out vec2 tex_uv;

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
    """
    frag_source = """
    #version 330 core
    uniform sampler2D uTexture;

    in vec3 color_pos;
    in vec3 normal;
    in vec2 tex_uv;
    out vec4 outColor;
    void main() {
      vec4 t;
      t = texture(uTexture, tex_uv);
      // vec4
      t=vec4(color_pos,1.);
      vec3 light_direction = -normalize(vec3(-0.2, -1., -1.));
      float n = clamp( dot(light_direction, normalize(normal)), 0., 1. );
      vec4 c = vec4((n*0.8 + vec3(0.2)).xyz,1.) * t;//vec4(1.);
      outColor = vec4(c.xyz, 1.0);
    }
    """
    attrib_keys = ["aVertexPosition", "aVertexNormal", "aVertexWeights", "aVertexTexture", ]
    uniform_keys = ["uProjectionMatrix", "uCameraMatrix", "uModelMatrix", "uBonesMatrices", "uTexture", ]
    
class FlatShader(Shader):
    vertex_source = """
    #version 330 core
    layout(location = 0) in vec3 position;
    void main() {
        gl_Position = vec4(position, 1);
    }
    """
    frag_source = """
    #version 330 core
    out vec4 outColor;
    void main() {
    outColor = vec4(1, 0, 0, 1);
    }
    """
    attrib_keys  = []
    uniform_keys = []
    
