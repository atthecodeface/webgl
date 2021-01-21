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
    animating   : bool
    main_window : int
    frame_delay : float = 0.02
    keys_down   : Set[int]
    key_mods    : int # bitmask of shift, ctrl, alt, meta keys down (bits 0 to 3)
    time        : float
    time_last   : float
    mouse_pos   : Tuple[float,float]
    mouse_pos_drag_start   : Tuple[float,float]
    # touches : Dict[TouchId, Any] - in JS, for touch Web interface
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

        self.animating = False
        self.time_last = glfw.get_time()
        self.keys_down = set()
        self.key_mods = 0
        self.buttons_down = 0
        self.mouse_pos_drag_start = (0.,0.)
        self.mouse_pos = (0.,0.)
        pass
    #f swap_buffers
    def swap_buffers(self) -> None:
        """
        swap_buffers must be called on completion of a framebuffer update
        It is not required in the Web library as its framebuffer is managed by the canvas
        """
        glfw.swap_buffers(self.main_window)
        pass
    #f set_animating
    def set_animating(self, animating:bool) -> None:
        """
        Set animating - in JS it kicks of the animating cycle; in Python it is not yet clear
        """
        self.animating = animating
        pass
    #f run
    def run(self) -> None:
        """
        Invoked  to run the application, after it has been constructed.
        """
        self.gl_ready()
        self.set_animating(True)
        try:
            while self.animating and not glfw.window_should_close(self.main_window):
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
                    self.handle_tick(time_now, self.time_last)
                    pass
                pass
            pass
        except Exception as e:
            print(f"Failed: {e}")
            print(f"Failed: {traceback.format_exc()}")
            pass
        glfw.terminate()
        pass
    #f key
    def key(self, window:Any, key:int, scancode:int, action:int, mods:int) -> None:
        """
        Callback invoked on a key press/release/repeat
        Invoke the subclass action 'key_fn' that can be common between JS and Python
        """
        press = (action==glfw.PRESS) or (action==glfw.REPEAT)
        if ((key==81) and (mods&2) and press): self.set_animating(not self.animating)
        if press:
            self.keys_down.add(key)
            pass
        else:
            self.keys_down.discard(key)
            pass
        self.key_fn(key, scancode, press, mods)
        pass
    #f cursor_pos
    def cursor_pos(self, window:Any, xpos:float, ypos:float) -> None:
        """
        Callback invoked on a mouse position event
        Invoke the subclass 'cursor_fn'
        """
        self.mouse_pos = (xpos,ypos)
        self.cursor_fn(xpos, ypos)
        pass
    #f mouse_button
    def mouse_button(self, window:Any, button:int, action:int, mods:int) -> None:
        """
        Callback invoked on a mouse button event
        Invoke the subclass 'mouse_fn'
        """
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
    #f key_fn
    def key_fn(self, key:int, scancode:int, press:bool, mods:int) -> None:
        """
        Method to be subclassed - same in JS and Python
        """
        print(f"{key} {scancode} {press} {mods}")
        pass
    #f cursor_fn
    def cursor_fn(self, xpos:float, ypos:float) -> None:
        """
        Method to be subclassed - same in JS and Python
        """
        print(f"{self.mouse_pos}, {self.mouse_pos_drag_start} {self.buttons_down} {self.key_mods}")
        pass
    #f mouse_button_fn
    def mouse_button_fn(self, xpos:float, ypos:float, button:int, action:int, mods:int) -> None:
        """
        Method to be subclassed - same in JS and Python
        """
        print(f"{self.mouse_pos}, {self.mouse_pos_drag_start} {self.buttons_down} {self.key_mods} {button} {action} {mods}")
        pass
    #f All done
    pass


