"""
from OpenGL.GLUT import *
class Frontend:
    window_title = "blah"
    def __init__(self):
        glutInit()
        glutInitDisplayMode(GLUT_RGBA)
        glutInitWindowSize(500, 500)
        glutInitWindowPosition(0, 0)
        self.main_window = glutCreateWindow(self.window_title)
        self.opengl_ready()
        glutDisplayFunc(self.draw)
        glutIdleFunc(self.idle)
        pass
    def swap_buffers(self):
        glutSwapBuffers()
        pass
    def run(self):
        self.finished = False
        glutMainLoop()
        pass
    pass
"""

import glfw
class Frontend:
    window_title = "blah"
    def __init__(self):
        from OpenGL import GL
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
    def swap_buffers(self):
        glfw.swap_buffers(self.main_window)
        pass
    def run(self):
        self.finished = False
        while not self.finished and not glfw.window_should_close(self.main_window):
            glfw.poll_events()
            glfw.make_context_current(self.main_window)
            self.idle()
            pass
        glfw.terminate()
        pass
    pass


