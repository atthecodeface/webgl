//c Frontend
var GL;
class Frontend {
    constructor() {
        const canvas = document.querySelector("#glcanvas");
        const gl     = canvas.getContext("webgl2");
        if (!gl) { alert("Unable to start webgl"); }
        GL = gl;
        document.addEventListener("keydown",     (k) => this.key(k) );
        document.addEventListener("keyup",       (k) => this.key(k) );
        canvas.addEventListener("mousedown", (m) => this.mouse(m) );
        canvas.addEventListener("mouseup",   (m) => this.mouse(m) );
        canvas.addEventListener("mousemove", (m) => this.mouse(m) );

        this.animating = false;
        this.run_step_pending = false;
        this.time_last = 0.;
        this.time = 0.;
        this.keys_down = new Set();
        this.key_mods = 0;
        this.buttons_down = 0;
        this.mouse_pos_drag_start = [0.,0.];
        this.mouse_pos = [0.,0.];
    }
    //f run
    run() {
        const promise = this.init();
        promise.then( (x) => {
            console.log("Frontend initialized");
            this.gl_ready();
            console.log("Frontend GL ready");
            this.set_animating(true);
        } );
    }
    //f gl_ready
    gl_ready() {
        console.log("Do GL ready stuff");
    }
    //f set_animating
    set_animating(a) {
        if (a) {
            if (this.run_step_pending) {return;}
            this.animating = true;
            this.init_time = Date.now();
            this.run_step();
        } else {
            this.animating = false;
        }
    }
    //f run_step
    run_step() {
        this.run_step_pending = false;
        if (this.animating) {
            this.draw_scene(this.time);
            this.time = (Date.now() - this.init_time) * 0.001;
            requestAnimationFrame(()=>this.run_step());
            this.run_step_pending = true;
        }
    }
    //f key
    key(event) {
        const key = event.keyCode;
        const press = (event.type!="keyup");
        const scancode = 0;
        const mods = (event.shiftKey?1:0)  | (event.ctrlKey?2:0) | (event.altKey?4:0);
        this.key_mods = mods;
        if (key==81) {this.animating=false;}
        if (press) {
            this.keys_down.add(key);
        } else {
            this.keys_down.delete(key);
        }
        this.key_fn(key, scancode, press, mods);
    }
    //f key_fn
    key_fn(key, scancode, press, mods) {
        console.log(""+key+" "+scancode+" "+press+" "+mods);
    }
    //f mouse
    mouse(event) {
        const xpos = event.offsetX;
        const ypos = event.offsetY;
        const mods = (event.shiftKey?1:0)  | (event.ctrlKey?2:0) | (event.altKey?4:0);
        this.key_mods = mods;
        if (event.type=="mousemove") {
            this.cursor_fn(xpos, ypos);
        } else {
            if (event.type=="mousedown") {
                this.buttons_down |= 1<<event.button;
            } else if (event.type=="mouseup") {
                this.buttons_down &= ~1<<event.button;
            }
            this.mouse_button_fn(xpos, ypos, event.button, event.type, mods);
        }
        this.mouse_pos = [xpos, ypos];
    }
    //f cursor_fn
    cursor_fn(xpos, ypos) {
        console.log(this.mouse_pos+" "+this.mouse_pos_drag_start+" "+this.buttons_down+" "+this.key_mods);
    }
    //f mouse_button_fn
    mouse_button_fn(xpos, ypos, button, action, mods) {
        console.log(this.mouse_pos+" "+this.mouse_pos_drag_start+" "+button+" "+mods);
    }
/*
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
    */
    //f All done
}

