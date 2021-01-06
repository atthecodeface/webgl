#a Imports
from OpenGL import GL
from typing import *

if not TYPE_CHECKING:
    GL.Texture = object
    pass

#a Classes
#c ShaderClass
class ShaderClass:
    """
    The ShaderClass is a prototype that a shader conforms to.

    It has a set of attributes which all conforming shaders must support, and which
    must have a fixed attribute location
    """
    #v Properties
    name            : ClassVar[str]
    attrib_keys     : ClassVar[List[str]]
    attributes      : ClassVar[Dict[str, GL.Attribute]]
    @classmethod
    def validate(cls, program:"ShaderProgram") -> None:
        if not hasattr(cls, "attributes"):
            cls.attributes = {}
            for k in cls.attrib_keys:
                if k in program.attributes:
                    cls.attributes[k] = program.attributes[k]
                    pass
                pass
            pass
        for k in cls.attrib_keys:
            if k in program.attributes and (cls.attributes[k] == program.attributes[k]):
                continue
            raise Exception("Shader program does not conform to shader class {cls.name}")
        pass

#c ShaderProgram
class ShaderProgram:
    #v Properties
    shader_class    : ClassVar[Type[ShaderClass]]
    vertex_source   : ClassVar[str]
    fragment_source : ClassVar[str]
    attrib_keys     : ClassVar[List[str]]
    uniform_keys    : ClassVar[List[str]]
    uniforms        : Dict[str, GL.Uniform]
    attributes      : Dict[str, GL.Attribute]
    vertex_shader   : GL.Shader
    fragment_shader : GL.Shader
    program         : GL.Program
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
            pass
        self.shader_class.validate(self)
        pass
    #f compile
    def compile(self, shader_type:GL.ShaderType, source:str) -> GL.Shader:
        shader = GL.glCreateShader(shader_type)
        GL.glShaderSource(shader, source);
        GL.glCompileShader(shader);
        if GL.glGetShaderiv(shader, GL.GL_COMPILE_STATUS) !=1:
            raise Exception(f"Failed to compile shader {GL.glGetShaderInfoLog(shader).decode()}")
        return shader
    #f get_attr
    def get_attr(self, name:str) -> Optional[GL.Attribute]:
        return self.attributes.get(name,None)
    #f set_uniform_if
    def set_uniform_if(self, name:str, fn:Callable[[GL.Uniform],None]) -> None:
        # print("set_uniform_if",name,self.uniforms,self.uniforms.get(name,""))
        if name in self.uniforms:
            fn(self.uniforms[name])
            pass
        pass
    #f All done
    pass

#c BoneshaderClass
class BoneShaderClass(ShaderClass):
    name = "Simple shader class"
    attrib_keys = ["vPosition", "vNormal", "vWeights", "vTexture", ]
    pass

#c BoneShader
class BoneShader(ShaderProgram):
    shader_class = BoneShaderClass
    vertex_source = """
    #version 410 core
    layout(location = 0) in vec3 vPosition;
    layout(location = 1) in vec3 vNormal;
    layout(location = 2) in vec4 vWeights;
    layout(location = 3) in vec2 vTexture;

    uniform mat4 uProjectionMatrix;
    uniform mat4 uCameraMatrix;
    uniform mat4 uModelMatrix;
    uniform mat4 uBonesMatrices[4];
    uniform float uBonesScale;

    out vec3 color_pos;
    out vec3 normal;
    out vec2 tex_uv;

    void main() {
      mat4 weightedMatrix = ( (uBonesMatrices[0] * vWeights.x) +
                              (uBonesMatrices[1] * vWeights.y) +
                              (uBonesMatrices[2] * vWeights.z) +
                              (uBonesMatrices[3] * vWeights.w) );
      weightedMatrix = weightedMatrix * uBonesScale + (mat4(1.) * (1.-uBonesScale));
      color_pos      = (normalize(vPosition) + 1.) / 2.0;
      vec4 model_pos = weightedMatrix * vec4(vPosition.xyz, 1.0);
      vec3 world_pos = (uModelMatrix * vec4(model_pos.xyz, 1.)).xyz;
      normal         = (uModelMatrix * weightedMatrix * vec4(vNormal,0.)).xyz;
      gl_Position    = uProjectionMatrix * uCameraMatrix * vec4(world_pos.xyz, 1.);
      tex_uv         = vTexture.xy;
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
    attrib_keys = ["vPosition", "vNormal", "vWeights", "vTexture", ]
    uniform_keys = ["uProjectionMatrix", "uCameraMatrix", "uModelMatrix", "uBonesMatrices", "uBonesScale", "uTexture" ]
    pass
    
#c UnbonedShader
class UnbonedShader(ShaderProgram):
    shader_class = BoneShaderClass
    vertex_source = """
    #version 410 core
    layout(location = 0) in vec3 vPosition;

    uniform mat4 uProjectionMatrix;
    uniform mat4 uCameraMatrix;
    uniform mat4 uModelMatrix;

    out vec3 color_pos;

    void main() {
      color_pos      = (normalize(vPosition) + 1.) / 2.0;
// color_pos = vec3(1.);
      gl_Position    = uProjectionMatrix * uCameraMatrix * uModelMatrix * vec4(vPosition.xyz, 1.);
    }
    """
    fragment_source = """
    #version 410 core
    in vec3 color_pos;
    out vec4 outColor;
    void main() {
      outColor = vec4(color_pos,1.);
    }
    """
    attrib_keys = ["vPosition"]
    uniform_keys = ["uProjectionMatrix", "uCameraMatrix", "uModelMatrix"]
    
#c FlatShader
class FlatShader(ShaderProgram):
    shader_class = BoneShaderClass
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
    attrib_keys  : ClassVar[List[str]] = ["vPosition"]
    uniform_keys : ClassVar[List[str]] = []
    
