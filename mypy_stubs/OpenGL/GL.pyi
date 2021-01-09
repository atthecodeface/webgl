from typing import *

GL_TRUE  : bool
GL_FALSE : bool
ValuePtr = Any

class  getStringEnum: pass
GL_VENDOR     : getStringEnum
GL_RENDERER   : getStringEnum
GL_VERSION    : getStringEnum
GL_SHADING_LANGUAGE_VERSION : getStringEnum

class enableEnum: pass
GL_DEPTH_TEST : enableEnum
GL_CULL_FACE  : enableEnum

class faceEnum: pass
GL_FRONT : faceEnum
GL_BACK  : faceEnum

class ValueTypeEnum: pass
GL_FLOAT           : ValueTypeEnum
GL_BYTE            : ValueTypeEnum
GL_UNSIGNED_BYTE   : ValueTypeEnum
GL_SHORT           : ValueTypeEnum
GL_UNSIGNED_SHORT  : ValueTypeEnum
GL_INT             : ValueTypeEnum
GL_UNSIGNED_INT    : ValueTypeEnum

GL_COLOR_BUFFER_BIT : int
GL_DEPTH_BUFFER_BIT : int

class depthFn: pass
GL_LEQUAL : depthFn

def glClear(a:int) -> None: pass
def glClearColor(r:float, g:float, b:float, alpha:Optional[float]=0.) -> None: pass
def glGetString(e:getStringEnum) -> str: pass
def glEnable(e:enableEnum) -> str: pass


def glClearDepth(d:float) -> None: pass
def glDepthFunc(f:depthFn) -> None:pass
def glCullFace(f:faceEnum) -> None:pass

#a Texture
class TextureUnitEnum: pass
GL_TEXTURE0 : TextureUnitEnum

class TextureEnum: pass
GL_TEXTURE_2D : TextureEnum

class TextureParamEnum: pass
GL_TEXTURE_WRAP_S : TextureParamEnum
GL_TEXTURE_WRAP_T : TextureParamEnum
GL_TEXTURE_MAG_FILTER : TextureParamEnum
GL_TEXTURE_MIN_FILTER : TextureParamEnum

GL_CLAMP_TO_EDGE : TextureParamEnum
GL_LINEAR        : TextureParamEnum
GL_RGBA          : TextureParamEnum
GL_RGB           : TextureParamEnum
GL_ARGB          : TextureParamEnum

class Texture:pass
def glGenTextures(n:int) -> Texture: pass
def glBindTexture(e:TextureEnum, t:Texture) -> None: pass
def glActiveTexture(u:TextureUnitEnum)      -> None: pass

def glTexParameterf(e:TextureEnum, p:TextureParamEnum, v:TextureParamEnum) -> None: pass
def glTexImage2D(e:TextureEnum, n:int, v:TextureParamEnum, w:int, h:int, border:int, color:TextureParamEnum, ds:ValueTypeEnum, data:Any) -> None: pass

#a Program
class CompilerInfo: pass
GL_COMPILE_STATUS : CompilerInfo
GL_LINK_STATUS    : CompilerInfo

class Program: pass
def glCreateProgram()                     -> Program: pass
def glLinkProgram(p:Program)              -> None: pass
def glGetProgramiv(p:Program, i:CompilerInfo) -> int: pass
def glGetProgramInfoLog(p:Program)             -> bytes: pass
def glUseProgram(p:Program)                    -> None: pass

class Attribute: pass
def glGetAttribLocation(p:Program, k:str) -> Attribute: pass

class Uniform: pass
def glGetUniformLocation(p:Program, k:str) -> Uniform: pass
def glUniform1i(u:Uniform, v0:int)   -> None: pass
def glUniform2i(u:Uniform, v0:int, v1:int)   -> None: pass
def glUniform3i(u:Uniform, v0:int, v1:int, v2:int)   -> None: pass
def glUniform4i(u:Uniform, v0:int, v1:int, v2:int, v3:int)   -> None: pass
def glUniform1f(u:Uniform, v0:float) -> None: pass
def glUniform2f(u:Uniform, v0:float, v1:float) -> None: pass
def glUniform3f(u:Uniform, v0:float, v1:float, v2:float) -> None: pass
def glUniform4f(u:Uniform, v0:float, v1:float, v2:float, v3:float) -> None: pass
def glUniformMatrix4f(u:Uniform, transpose:bool, ptr:ValuePtr) -> None: pass
def glUniformMatrix4fv(u:Uniform, num:int, transpose:bool, ptr:ValuePtr) -> None: pass

#a Shader
class ShaderType: pass
GL_VERTEX_SHADER   : ShaderType
GL_FRAGMENT_SHADER : ShaderType

class Shader: pass
def glCreateShader(t:ShaderType)          -> Shader: pass
def glShaderSource(s:Shader, src:str)     -> None: pass
def glCompileShader(s:Shader)             -> None: pass
def glAttachShader(p:Program, s:Shader)   -> None: pass
def glGetShaderiv(s:Shader, i:CompilerInfo) -> int: pass
def glGetShaderInfoLog(s:Shader)            -> bytes: pass

#a Buffers and VAO
class BufferType: pass
GL_ARRAY_BUFFER          : BufferType
GL_ELEMENT_ARRAY_BUFFER  : BufferType

class BufferCopy: pass
GL_STATIC_DRAW: BufferCopy

class Buffer:pass
def glGenBuffers(n:int) -> Buffer: pass
def glBindBuffer(t:BufferType, b:Buffer) -> None: pass
def glBufferData(t:BufferType, a:Any, c:BufferCopy) -> None: pass

class VAO:pass
def glGenVertexArrays(n:int) -> VAO: pass
def glBindVertexArray(vao:VAO) -> None: pass
def glVertexAttribPointer(a:Attribute, n:int, vt:ValueTypeEnum, b:bool, z:int, p:Optional[Any]) -> None: pass
def glEnableVertexAttribArray(a:Attribute) -> None: pass
def glDisableVertexAttribArray(a:Attribute) -> None: pass

#a Drawing
class ElementType: pass
GL_POINTS           : ElementType
GL_LINES            : ElementType
GL_LINE_LOOP        : ElementType
GL_LINE_STRIP       : ElementType
GL_TRIANGLES        : ElementType
GL_TRIANGLE_STRIP   : ElementType
GL_TRIANGLE_FAN     : ElementType
def glDrawElements(ele:ElementType, count:int, vt:ValueTypeEnum, p:ValuePtr) -> None: pass
