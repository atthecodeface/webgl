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
    frame_delay = 0.02
    #f __init__
    def __init__(self) -> None:
        glfw.init()
        glfw.window_hint(glfw.CONTEXT_VERSION_MAJOR, 4)
        glfw.window_hint(glfw.CONTEXT_VERSION_MINOR, 1)
        glfw.window_hint(glfw.OPENGL_FORWARD_COMPAT, GL.GL_TRUE)
        glfw.window_hint(glfw.OPENGL_PROFILE, glfw.OPENGL_CORE_PROFILE)
        self.main_window = glfw.create_window(720, 600, "Opengl GLFW Window", None, None)
        glfw.set_key_callback(self.main_window, self.key)
        glfw.set_cursor_pos_callback(self.main_window, self.cursor_pos)
        glfw.set_mouse_button_callback(self.main_window, self.mouse_button)
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
        self.time_last = glfw.get_time()
        while not self.finished and not glfw.window_should_close(self.main_window):
            time_now = glfw.get_time()
            timeout = self.time_last + self.frame_delay - time_now
            if timeout > 0:
                glfw.wait_events_timeout(timeout)
                pass
            else:
                glfw.poll_events()
                pass
            time_now = glfw.get_time()
            if time_now > self.time_last + self.frame_delay:
                self.time_last = time_now
                glfw.make_context_current(self.main_window)
                self.idle()
                pass
            pass
        glfw.terminate()
        pass
    #f key
    def key(self, window, key:int, scancode:int, action:int, mods:int) -> None:
        print(f"{window} {key} {scancode} {action} {mods}")
        if key==81: self.finished=True
        pass
    #f cursor_pos
    def cursor_pos(self, window, xpos:float, ypos:float) -> None:
        print(f"{window} {xpos} {ypos}")
        pass
    #f mouse_button
    def mouse_button(self, window, button:int, action:int, mods:int) -> None:
        print(f"{window} {button} {action} {mods}")
        pass
    #f idle
    def idle(self) -> None:
        pass
    #f opengl_ready - override
    def opengl_ready(self) -> None:
        pass
    #f All done
    pass


