#a Imports
from dataclasses import dataclass
from pathlib import Path
from OpenGL import GL
from typing import *

if not TYPE_CHECKING:
    GL.Texture = object
    pass

#a Classes
#c ShaderClassDesc
@dataclass
class ShaderClassDesc:
    name : str
    attrib_keys: List[str]
    pass

#c ShaderProgramDesc
@dataclass
class ShaderProgramDesc:
    shader_class   : "ShaderClass"
    vertex_uri     : str
    fragment_uri   : str
    attrib_keys    : List[str]
    uniform_keys   : List[str]
    pass

#c ShaderClass
class ShaderClass:
    """
    The ShaderClass is a prototype that a shader conforms to.

    It has a set of attributes which all conforming shaders must support, and which
    must have a fixed attribute location
    """
    #v Properties
    name            : str
    attrib_keys     : List[str]
    attributes      : Dict[str, "GL.Attribute"]
    #f __init__
    def __init__(self, desc:ShaderClassDesc) -> None:
        self.name = desc.name
        self.attrib_keys = desc.attrib_keys
        pass
    #f validate
    def validate(self, program:"ShaderProgram") -> None:
        if not hasattr(self, "attributes"):
            self.attributes = {}
            for k in self.attrib_keys:
                if k in program.attributes:
                    self.attributes[k] = program.attributes[k]
                    pass
                pass
            pass
        for k in self.attrib_keys:
            if k not in program.attributes: continue
            if self.attributes[k] == program.attributes[k]: continue
            raise Exception("Shader program does not conform to shader class {self.name}")
        pass
    #f get_attr
    def get_attr(self, name:str) -> Optional["GL.Attribute"]:
        return self.attributes.get(name,None)
    #f All done
    pass

#c ShaderProgram
class ShaderProgram:
    #v Properties
    shader_class    : ShaderClass
    vertex_source   : str
    fragment_source : str
    attrib_keys     : List[str]
    uniform_keys    : List[str]
    uniforms        : Dict[str, "GL.Uniform"]
    attributes      : Dict[str, "GL.Attribute"]
    vertex_shader   : "GL.Shader"
    fragment_shader : "GL.Shader"
    program         : "GL.Program"
    #f __init__
    def __init__(self, program_desc:Type[ShaderProgramDesc]) -> None:
        with Path(program_desc.vertex_uri).open() as f:
            self.vertex_source = "#version 410 core\n"+f.read()
            pass
        with Path(program_desc.fragment_uri).open() as f:
            self.fragment_source = "#version 410 core\n"+f.read()
            pass
        self.shader_class = program_desc.shader_class
        self.attrib_keys  = program_desc.attrib_keys
        self.uniform_keys = program_desc.uniform_keys
        pass
    #f gl_ready
    def gl_ready(self):
        """
        Continue compilation etc; this can only happen when we have the source
        """
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
            a = GL.glGetAttribLocation(self.program, k)
            if a>=0: self.attributes[k] = a
            pass
        for k in self.uniform_keys:
            self.uniforms[k]   = GL.glGetUniformLocation(self.program, k)
            pass
        self.shader_class.validate(self)
        pass
    #f compile
    def compile(self, shader_type:"GL.ShaderType", source:str) -> "GL.Shader":
        shader = GL.glCreateShader(shader_type)
        GL.glShaderSource(shader, source);
        GL.glCompileShader(shader);
        if GL.glGetShaderiv(shader, GL.GL_COMPILE_STATUS) !=1:
            raise Exception(f"Failed to compile shader {GL.glGetShaderInfoLog(shader).decode()}")
        return shader
    #f get_attr
    def get_attr(self, name:str) -> Optional["GL.Attribute"]:
        return self.attributes.get(name,None)
    #f set_uniform_if
    def set_uniform_if(self, name:str, fn:Callable[["GL.Uniform"],None]) -> None:
        # print("set_uniform_if",name,self.uniforms,self.uniforms.get(name,""))
        if name in self.uniforms:
            fn(self.uniforms[name])
            pass
        pass
    #f All done
    pass

#c BoneShaderClass
class BoneShaderClass(ShaderClassDesc):
    name = "Simple shader class"
    attrib_keys = ["vPosition", "vNormal", "vJoints", "vWeights", "vTexture", "vColor",]
    pass
bone_shader_class = ShaderClass(BoneShaderClass)

#c BoneShader
class BoneShader(ShaderProgramDesc):
    shader_class = bone_shader_class
    vertex_uri   = "./shader/bone_shader_v.glsl"
    fragment_uri = "./shader/bone_shader_f.glsl"
    attrib_keys  = ["vPosition", "vNormal", "vJoints", "vWeights", "vTexture", "vColor",]
    uniform_keys = ["uProjectionMatrix", "uCameraMatrix", "uModelMatrix", "uMeshMatrix", "uBonesMatrices", "uBonesScale", "uMaterial.base_color", "uMaterial.base_texture" ]
    pass
    

#c GlowShader
class GlowShader(ShaderProgramDesc):
    shader_class = bone_shader_class
    vertex_uri   = "./shader/unboned_shader_v.glsl"
    fragment_uri = "./shader/glow_shader_f.glsl"
    attrib_keys  = ["vPosition", "vNormal", "vJoints", "vWeights", "vTexture", "vColor",]
    uniform_keys = ["uProjectionMatrix", "uCameraMatrix", "uModelMatrix", "uMeshMatrix", "uMaterial.base_color", ]
    pass

#c FlatShaderClass
class FlatShaderClass(ShaderClassDesc):
    name = "Simple shader class"
    attrib_keys = ["vPosition"]
    pass
flat_shader_class = ShaderClass(FlatShaderClass)

#c FlatShader
class FlatShader(ShaderProgramDesc):
    shader_class = flat_shader_class
    vertex_uri   = "./shader/flat_v.glsl"
    fragment_uri = "./shader/flat_f.glsl"
    attrib_keys  = ["vPosition"]
    uniform_keys = []
    pass

