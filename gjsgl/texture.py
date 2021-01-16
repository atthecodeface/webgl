#a Imports
from OpenGL import GL
import ctypes
import numpy as np
from PIL import Image

from typing import *

if not TYPE_CHECKING:
    GL.Program      = object
    GL.Shader       = object
    GL.ShaderType   = object
    GL.Texture      = object
    GL.Uniform      = object
    GL.Attribute    = object
    pass

#a Useful functions
#c Texture
class Texture:
    data : Tuple[int,int,Any]
    texture: Optional[GL.Texture]
    def __init__(self, data:Tuple[int,int,Any]) -> None:
        self.data = data
        self.texture = None
        pass
    def gl_create(self) -> None:
        if self.texture is not None: return
        self.texture = GL.glGenTextures(1)
        GL.glBindTexture(GL.GL_TEXTURE_2D, self.texture)
        GL.glTexParameterf(GL.GL_TEXTURE_2D, GL.GL_TEXTURE_WRAP_S, GL.GL_CLAMP_TO_EDGE)
        GL.glTexParameterf(GL.GL_TEXTURE_2D, GL.GL_TEXTURE_WRAP_T, GL.GL_CLAMP_TO_EDGE)
        GL.glTexParameterf(GL.GL_TEXTURE_2D, GL.GL_TEXTURE_MAG_FILTER, GL.GL_LINEAR)
        GL.glTexParameterf(GL.GL_TEXTURE_2D, GL.GL_TEXTURE_MIN_FILTER, GL.GL_LINEAR)
        GL.glTexImage2D(GL.GL_TEXTURE_2D, 0, GL.GL_RGBA, self.data[0], self.data[1], 
                        0, GL.GL_RGB, GL.GL_UNSIGNED_BYTE, self.data[2])

        pass
    pass
#c TextureImage
class TextureImage(Texture):
    def __init__(self, url:str) -> None:
        image = Image.open(url)
        image_data = np.array(image) #.getdata(), np.int8)
        super().__init__(data=(image.size[0], image.size[1], image_data))
        pass
    pass
