#a Imports
import glfw
from OpenGL import GL
from typing import *

#a Classes
#c Frontend
class Frontend:
    #v Properties
    window_title : ClassVar[str] = "blah"
    finished : bool
    main_window : int
    #f __init__
    def __init__(self) -> None:
        glfw.init()
        glfw.window_hint(glfw.CONTEXT_VERSION_MAJOR, 4)
        glfw.window_hint(glfw.CONTEXT_VERSION_MINOR, 1)
        glfw.window_hint(glfw.OPENGL_FORWARD_COMPAT, GL.GL_TRUE)
        glfw.window_hint(glfw.OPENGL_PROFILE, glfw.OPENGL_CORE_PROFILE)
        self.main_window = glfw.create_window(720, 600, "Opengl GLFW Window", None, None)
        glfw.make_context_current(self.main_window)
        for x in [GL.GL_VENDOR , GL.GL_RENDERER , GL.GL_VERSION , GL.GL_SHADING_LANGUAGE_VERSION]:
            print(GL.glGetString(x))
            pass
        self.opengl_ready()
        pass
    #f swap_buffers
    def swap_buffers(self) -> None:
        glfw.swap_buffers(self.main_window)
        pass
    #f run
    def run(self) -> None:
        self.finished = False
        while not self.finished and not glfw.window_should_close(self.main_window):
            glfw.poll_events()
            glfw.make_context_current(self.main_window)
            self.idle()
            pass
        glfw.terminate()
        pass
    #f idle
    def idle(self) -> None:
        pass
    #f opengl_ready - override
    def opengl_ready(self) -> None:
        pass
    #f All done
    pass


