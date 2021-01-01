#a Imports
from OpenGL import GL
from typing import *

if not TYPE_CHECKING:
    GL.Texture = object
    pass

#a Classes
#c Shader
class Shader:
    #v Properties
    vertex_source   : ClassVar[str]
    fragment_source : ClassVar[str]
    attrib_keys     : ClassVar[List[str]]
    uniform_keys    : ClassVar[List[str]]
    uniforms        : Dict[str, GL.Uniform]
    attributes      : Dict[str, GL.Attribute]
    vertex_shader   : GL.Shader
    fragment_shader : GL.Shader
    program         : GL.Program
    #f compile
    def compile(self, shader_type:GL.ShaderType, source:str) -> GL.Shader:
        shader = GL.glCreateShader(shader_type)
        GL.glShaderSource(shader, source);
        GL.glCompileShader(shader);
        if GL.glGetShaderiv(shader, GL.GL_COMPILE_STATUS) !=1:
            raise Exception(f"Failed to compile shader {GL.glGetShaderInfoLog(shader).decode()}")
        return shader
    #f __init__
    def __init__(self) -> None:
        self.vertex_shader   = self.compile(GL.GL_VERTEX_SHADER, self.vertex_source)
        self.fragment_shader = self.compile(GL.GL_FRAGMENT_SHADER, self.fragment_source)
        self.program = GL.glCreateProgram()
        GL.glAttachShader(self.program, self.vertex_shader)
        GL.glAttachShader(self.program, self.fragment_shader)
        GL.glLinkProgram(self.program)
        if (GL.glGetProgramiv(self.program, GL.GL_LINK_STATUS)) != 1:
            raise Exception(f"Unable to initialize the shader program: {GL.glGetProgramInfoLog(self.program).decode()}")
        self.attributes = {}
        self.uniforms   = {}
        for k in self.attrib_keys:
            self.attributes[k] = GL.glGetAttribLocation(self.program, k)
            pass
        for k in self.uniform_keys:
            self.uniforms[k]   = GL.glGetUniformLocation(self.program, k)
            print(k,self.uniforms[k])
            pass
        pass
    #f All done
    pass

#c BoneShader
class BoneShader(Shader):
    vertex_source = """
    #version 410 core
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
    fragment_source = """
    #version 410 core
    uniform sampler2D uTexture;

    in vec3 color_pos;
    in vec3 normal;
    in vec2 tex_uv;
    out vec4 outColor;
    void main() {
      vec4 t = texture( uTexture, tex_uv );
      vec3 light_direction = -normalize(vec3(-0.2, -1., -1.));
      float n = clamp( dot(light_direction, normalize(normal)), 0., 1. );
      vec4 c = vec4((n*0.8 + vec3(0.2)).xyz,1.) * t;
      outColor = vec4(c.xyz, 1.0);
    }
    """
    attrib_keys = ["aVertexPosition", "aVertexNormal", "aVertexWeights", "aVertexTexture", ]
    uniform_keys = ["uProjectionMatrix", "uCameraMatrix", "uModelMatrix", "uBonesMatrices", "uTexture" ]
    
#c FlatShader
class FlatShader(Shader):
    vertex_source = """
    #version 330 core
    layout(location = 0) in vec3 position;
    void main() {
        gl_Position = vec4(position, 1);
    }
    """
    fragment_source = """
    #version 330 core
    out vec4 outColor;
    void main() {
    outColor = vec4(1, 0, 0, 1);
    }
    """
    attrib_keys  : ClassVar[List[str]] = []
    uniform_keys : ClassVar[List[str]] = []
    
