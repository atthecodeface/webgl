#a Imports
import glfw
import traceback
from OpenGL import GL
from typing import *

#a Classes
#c Frontend
class Frontend:
    #v Properties
    window_title : ClassVar[str] = "blah"
    animating : bool
    main_window : int
    frame_delay = 0.02
    keys_down : Set[int]
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
        self.animating = False
        self.time_last = glfw.get_time()
        self.keys_down = set()
        self.key_mods = 0
        self.buttons_down = 0
        self.mouse_pos_drag_start = (0.,0.)
        self.mouse_pos = (0.,0.)
        while not self.animating and not glfw.window_should_close(self.main_window):
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
    def key(self, window:Any, key:int, scancode:int, action:int, mods:int) -> None:
        if key==81: self.animating=True
        press = (action==glfw.PRESS) or (action==glfw.REPEAT)
        if press: self.keys_down.add(key)
        else: self.keys_down.discard(key)
        self.key_fn(key, scancode, press, mods)
        pass
    #f key_fn
    def key_fn(self, key:int, scancode:int, press:bool, mods:int) -> None:
        print(f"{key} {scancode} {press} {mods}")
        pass
    #f cursor_pos
    def cursor_pos(self, window:Any, xpos:float, ypos:float) -> None:
        self.mouse_pos = (xpos,ypos)
        self.cursor_fn(xpos, ypos)
        pass
    #f cursor_fn
    def cursor_fn(self, xpos:float, ypos:float) -> None:
        print(f"{self.mouse_pos}, {self.mouse_pos_drag_start} {self.buttons_down} {self.key_mods}")
        pass
    #f mouse_button
    def mouse_button(self, window:Any, button:int, action:int, mods:int) -> None:
        (xpos, ypos) = glfw.get_cursor_pos(window)
        if action==glfw.PRESS:
            self.buttons_down |= 1<<button
            self.mouse_pos_drag_start = (xpos, ypos)
            pass
        elif action==glfw.RELEASE:
            self.buttons_down &= ~(1<<button)
            pass
        self.key_mods = mods
        self.mouse_button_fn(xpos, ypos, button, action, mods)
        pass
    #f mouse_button_fn
    def mouse_button_fn(self, xpos:float, ypos:float, button:int, action:int, mods:int) -> None:
        print(f"{self.mouse_pos}, {self.mouse_pos_drag_start} {self.buttons_down} {self.key_mods} {button} {action} {mods}")
        pass
    #f idle
    def idle(self) -> None:
        try:
            self.idle_fn()
            pass
        except Exception as e:
            print(f"Failed: {e}")
            print(f"Failed: {traceback.format_exc()}")
            self.animating = True
            pass
        pass
    #f opengl_ready - override
    def opengl_ready(self) -> None:
        pass
    #f All done
    pass


