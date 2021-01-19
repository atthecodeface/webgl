class Projection {
    constructor() {
        this.fov = 45 * Math.PI / 180;   // in radians
        this.aspect = GL.canvas.clientWidth / GL.canvas.clientHeight;
        this.near = 0.1;
        this.far = 100.0;
        this.recalculate();
    }
    recalculate() {
        this.matrix = Glm.mat4.perspective(Glm.mat4.create(), this.fov, this.aspect, this.near, this.far);
    }
    set_fov(x) {
        this.fov = x * Math.PI / 180;   // in radians
        this.recalculate();
    }
}

class Camera {
    constructor() {
        this.translation = [0.,0.,-30.];
        this.quaternion = Glm.quat.create();
        this.zoom = 1.;
        this.matrix = Glm.mat4.create();
        this.tm     = Glm.mat4.create();
        this.recalculate();
    }
    recalculate() {
        const tm = this.tm;
        Glm.mat4.fromQuat(tm ,this.quaternion);
        Glm.mat4.translate(tm, tm, this.translation);
        Glm.mat4.scale(this.matrix, tm, [this.zoom,this.zoom,this.zoom]);
    }
    set_zoom(x) {
        this.zoom = x;
        this.recalculate();
    }
}

const tv = Glm.vec2.create();
const r_sqrt2 = Math.sqrt(0.5);
class Polar {
    static create() {
        return Glm.vec2.create();
    }
    static as_xy(p,a) {
        const x = Math.cos(a[0])*a[1];
        const y = Math.sin(a[0])*a[1];
        p[0]=x; p[1]=y;
        return p;
    }
    static add_p(p,a,b) {
        const x = Math.cos(a[0])*a[1] + Math.cos(b[0])*b[1];
        const y = Math.sin(a[0])*a[1] + Math.sin(b[0])*b[1];
        p[0]=Math.atan2(y,x); p[1]=Math.hypot(x,y);
        return p;
    }
}
class Spaceship {
    constructor(model_class) {
        this.pos = Glm.vec2.create();
        this.velocity = Polar.create();
        this.angle = 0.;
        this.angular_velocity = 0.01;
        this.model = new ModelInstance(model_class);
        Glm.quat.set(this.model.transformation.quaternion, r_sqrt2,0,0,r_sqrt2);
    }
    gl_ready(shader_program) {
        this.model.gl_create();
        this.model.gl_bind_program(shader_program.shader_class);
    }
    gl_draw(shader_program, time) {
        this.model.gl_draw(shader_program, time);
    }
    tick(motions) {
        this.angular_velocity = this.angular_velocity*0.95;
        this.velocity[1] = this.velocity[1] * 0.95;
        if (motions&8) {this.angular_velocity-=0.01;}
        if (motions&4) {this.angular_velocity+=0.01;}
        this.angle += this.angular_velocity;
        tv[0] = this.angle;
        tv[1] = 0;
        if (motions&1) {tv[1]=0.03;}
        Polar.add_p(this.velocity, this.velocity, tv);
        Glm.vec2.add(this.pos, this.pos, Polar.as_xy(tv, this.velocity));
        Glm.quat.set(this.model.transformation.quaternion, r_sqrt2,0,0,r_sqrt2);
        Glm.quat.rotateY(this.model.transformation.quaternion,this.model.transformation.quaternion,this.angle);
        Glm.vec3.set(this.model.transformation.translation, this.pos[0],this.pos[1],0.);
    }
}
class SpaceshipMaze extends Frontend {
    constructor(url, node) {
        super();
    }
    async init() {
        const promises = [];
        this.textures = {};
        this.motion_of_keys = { 87:1,    83:2,
                                65:4,    68:8,
                                90:16,   88:32,
                                76:256,  188:512,
                                74:1024, 75:2048,
                                78:4096, 77:8192
                              };
        this.shaders = {}
        this.shaders.bone = new BoneShader();
        this.shaders.glow = new GlowShader();

        for (const s in this.shaders) {
            promises.push(this.shaders[s].init());
        }

        this.gltfs = [];
        this.gltfs.push(new GLTF.Gltf("gltf/spaceship.gltf"));

        for (const g of this.gltfs) {
            promises.push(g.init());
        }

        return Promise.all(promises);
    }
    //f gl_ready
    gl_ready() {
        for (const s in this.shaders) {
            this.shaders[s].gl_ready();
        }
        this.gltf_models = []
        for (const g of this.gltfs) {
            const gltf_node = g.get_node_by_name("Body.001");
            const gltf_root = gltf_node.to_model_object(g);
            this.gltf_models.push(new ModelClass("spaceship", gltf_root));
        }

        this.projection = new Projection();
        this.camera     = new Camera();
        this.spaceship  = new Spaceship(this.gltf_models[0]);

        this.spaceship.gl_ready(this.shaders.bone);
    }
    //f key_fn
    key_fn(key, scancode, press, mods) {
        var motion = this.motion_of_keys[key];
        if (motion===undefined) {motion=0;}
        if (press) {
            this.motions = this.motions | motion;
        } else {
            this.motions = this.motions &= ~motion;
        }
        if (press && (key==80)) {console.log(this.camera);}
    }
    //f cursor_fn
    cursor_fn(xpos, ypos) {
    }
    //f mouse_button_fn
    mouse_button_fn(xpos, ypos, button, action, mods) {
    }
    //f draw_scene
    draw_scene() {
        GL.clearColor(0.0, 0.4, 0.0, 1.0);  // Clear to black, fully opaque
        GL.clearDepth(1.0);                 // Clear everything
        GL.enable(GL.DEPTH_TEST);           // Enable depth testing
        GL.depthFunc(GL.LEQUAL);            // Near things obscure far things
        GL.enable(GL.CULL_FACE);
        GL.cullFace(GL.BACK);

        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

        GL.useProgram(this.shaders.bone.program);

        // Glm.quat.rotateX(this.camera.quaternion,this.camera.quaternion,0.01);
        this.camera.recalculate();
        
        GL.uniformMatrix4fv(this.shaders.bone.uniforms["uProjectionMatrix"],false, this.projection.matrix);
        GL.uniformMatrix4fv(this.shaders.bone.uniforms["uCameraMatrix"],    false, this.camera.matrix);

        const time = this.time;
        this.spaceship.tick(this.motions);
        this.spaceship.gl_draw(this.shaders.bone, time);
    }
}

