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

const tv  = Glm.vec3.create(); // vec3 so it has room for stuff
const tv2 = Glm.vec3.create(); // vec3 so it has room for stuff
const tq  = Glm.quat.create();
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

var pp;
function gl_create_particle(shader_class) {
    // ppmbd = new ModelBufferData(new Float32Array(3),0);
    const ppmbd = new ModelBufferData(new Float32Array(12),0);
    const size=0.05;
    ppmbd.data[0]=-size;
    ppmbd.data[1]=-size;
    ppmbd.data[2]=-size;
    ppmbd.data[3]=size;
    ppmbd.data[4]=-size;
    ppmbd.data[5]=-size;
    ppmbd.data[6]=-size;
    ppmbd.data[7]=size;
    ppmbd.data[8]=size;
    ppmbd.data[9]=size;
    ppmbd.data[10]=size;
    const ppv = new ModelPrimitiveView();
    ppv.position = new ModelBufferView(ppmbd,3,GL.FLOAT,0,0);
    ppv.indices  = new ModelBufferIndices(new Int32Array(5),0);
    ppv.indices.data[0]=0;
    ppv.indices.data[1]=1;
    ppv.indices.data[2]=2;
    ppv.indices.data[3]=3;
    ppv.indices.data[4]=0;
    ppv.indices.data[5]=1;
    pp = new ModelPrimitive();
    pp.view = ppv;
    pp.material = new ModelMaterial();
    pp.indices_count = 5;
    pp.indices_offset = 0;
    pp.indices_gl_type = GL.UNSIGNED_INT;
    pp.gl_type         = GL.TRIANGLES;
    pp.gl_create();
    pp.gl_bind_program(shader_class);
}
class Particle {
    constructor() {
        this.show = true;
        this.pos      = Glm.vec2.create();
        this.velocity = Glm.vec2.create();
        this.matrix   = Glm.mat4.create();
        this.identity   = Glm.mat4.create();
        this.color = [1.,1.,1.,1.];
    }
    tick(time) {
    }
    gl_draw(shader_program) {
        if (!this.show) {return;}
        this.matrix[12] = this.pos[0];
        this.matrix[13] = this.pos[1];
        this.matrix[14] = 0.;
        shader_program.set_uniform_if("uModelMatrix", (u) => GL.uniformMatrix4fv(u, false, this.matrix));
        shader_program.set_uniform_if("uMeshMatrix", (u) => GL.uniformMatrix4fv(u, false, this.identity));
        shader_program.set_uniform_if("uBonesScale", (u) => GL.uniform1f(u, 0.0) )
        pp.material.color = this.color;
        pp.gl_draw(shader_program);
    }
}
class Flame extends Particle {
    constructor() {
        super();
        this.show = false;
        this.start_time = -1000;
    }
    start(time, pos, vel) {
        Glm.vec2.copy(this.pos,pos);
        Glm.vec2.copy(this.velocity,vel);
        this.start_time = time;
    }
    tick(time) {
        if (time>this.start_time+2.) {
            this.show = false;
            return;
        }
        Glm.vec2.add(this.pos,this.pos,this.velocity);
        this.show = true;
        this.color[0] = 1.;
        this.color[1] = 1.;
        this.color[2] = 1.;
        if (time>this.start_time+0.5) {this.color[1] = 0.9; this.color[2]=0.7;}
        if (time>this.start_time+1.0) {this.color[1] = 0.7; this.color[2]=0.5;}
        if (time>this.start_time+1.5) {this.color[1] = 0.5; this.color[2]=0.1;}
    }
    gl_draw(shader_program) {
        tv[0] = Math.random()*2-1;
        tv[1] = Math.random()*2-1;
        tv[2] = Math.random()*2-1;
        Glm.quat.setAxisAngle(tq,tv,1);
        Glm.mat4.fromQuat(this.matrix, tq);
        super.gl_draw(shader_program);
    }
}
class Asteroid {
    constructor(model_class) {
        const pos_angle = Math.random()*Math.PI*2;
        const dist      = 7+2*Math.random();
        this.pos      = Glm.vec2.create();
        this.pos[0]   = Math.cos(pos_angle)*dist;
        this.pos[1]   = Math.sin(pos_angle)*dist;
        this.velocity = Glm.vec2.create();
        this.velocity[0]=Math.random()*0.2-0.1;
        this.velocity[1]=Math.random()*0.2-0.1;
        this.size = 1;
        this.angular_velocity = Glm.quat.create();
        tv[0] = Math.random()*2-1;
        tv[1] = Math.random()*2-1;
        tv[2] = Math.random()*2-1;
        const aspeed = Math.random();
        Glm.quat.setAxisAngle(this.angular_velocity,tv,aspeed/15);
        this.model = new ModelInstance(model_class);
    }
    gl_ready(shader_class) {
        this.model.gl_create();
        this.model.gl_bind_program(shader_class);
    }
    tick(game, time) {
        const q = this.model.transformation.quaternion;
        Glm.quat.multiply(q, q, this.angular_velocity);
        Glm.quat.normalize(q, q);
        Glm.vec2.add(this.pos, this.pos, this.velocity);
        game.bound_to_field(this.pos);
    }
    gl_draw(shader_program, time) {
        Glm.vec3.set(this.model.transformation.translation, this.pos[0],this.pos[1],0.);
        this.model.gl_draw(shader_program, time);
    }
}
class Rocket {
    constructor(model_class) {
        const pos_angle = Math.random()*Math.PI*2;
        const dist      = 7+2*Math.random();
        const vel_angle = Math.random(1)*Math.PI*2;
        this.pos      = Glm.vec2.create();
        this.pos[0]   = Math.cos(pos_angle)*dist;
        this.pos[1]   = Math.sin(pos_angle)*dist;
        this.velocity = Glm.vec2.create();
        this.velocity[0]=0.4*Math.cos(vel_angle);
        this.velocity[1]=0.4*Math.sin(vel_angle);
        this.size = 1;
        this.angular_velocity = Glm.quat.create();
        Glm.quat.rotateZ(this.angular_velocity,this.angular_velocity,0.1);
        this.model = new ModelInstance(model_class);
        Glm.quat.rotateX(this.model.transformation.quaternion,this.model.transformation.quaternion,Math.PI*0.5);
        Glm.quat.rotateY(this.model.transformation.quaternion,this.model.transformation.quaternion,Math.PI*0.5);
        Glm.quat.rotateY(this.model.transformation.quaternion,this.model.transformation.quaternion,vel_angle);
    }
    gl_ready(shader_class) {
        this.model.gl_create();
        this.model.gl_bind_program(shader_class);
    }
    tick(game, time) {
        const q = this.model.transformation.quaternion;
        Glm.quat.multiply(q, q, this.angular_velocity);
        Glm.quat.normalize(q, q);
        Glm.vec2.add(this.pos, this.pos, this.velocity);
        game.bound_to_field(this.pos);
    }
    gl_draw(shader_program, time) {
        Glm.vec3.set(this.model.transformation.translation, this.pos[0],this.pos[1],0.);
        this.model.gl_draw(shader_program, time);
    }
}
class Spaceship {
    constructor(model_class) {
        this.pos      = Glm.vec2.create();
        this.velocity = Glm.vec2.create();
        this.angle = 0.;
        this.angular_velocity = 0.01;
        this.model = new ModelInstance(model_class);
        Glm.quat.set(this.model.transformation.quaternion, r_sqrt2,0,0,r_sqrt2);
        this.rocket = 0.9;
    }
    gl_ready(shader_class) {
        this.model.gl_create();
        this.model.gl_bind_program(shader_class);
    }
    gl_draw(shader_program, time) {
        Glm.quat.set(this.model.transformation.quaternion, r_sqrt2,0,0,r_sqrt2);
        Glm.quat.rotateY(this.model.transformation.quaternion,this.model.transformation.quaternion,this.angle);
        Glm.vec3.set(this.model.transformation.translation, this.pos[0],this.pos[1],0.);
        this.model.gl_draw(shader_program, time);
    }
    tick(game, time) {
        this.angular_velocity = this.angular_velocity*0.95;
        this.velocity[0] = this.velocity[0] * 0.95;
        this.velocity[1] = this.velocity[1] * 0.95;
        if (game.motions&8) {this.angular_velocity-=0.01;}
        if (game.motions&4) {this.angular_velocity+=0.01;}
        this.angle += this.angular_velocity;
        if (game.motions&1) {
            tv[0] = this.angle;
            tv[1] = (game.motions&1) ? 1:0;
            Polar.as_xy(tv,tv);
            Glm.vec2.scaleAndAdd(this.velocity, this.velocity, tv, 0.03);
            const p = game.get_flame();
            if (p!=null) {
                tv2[0] = this.angle+(Math.random()+Math.random()-1)*0.3;
                tv2[1] = -0.2;
                Polar.as_xy(tv2,tv2);
                p.start(time,
                        [this.pos[0]-0.6*tv[0]-this.rocket*tv[1],this.pos[1]-0.6*tv[1]+this.rocket*tv[0]],
                        [this.velocity[0]+tv2[0],this.velocity[1]+tv2[1]]
                       );
                this.rocket=-this.rocket;
            }
        }
        Glm.vec2.add(this.pos, this.pos, this.velocity);
    }
}
class Asteroids extends Frontend {
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
        this.field_xy  = [16.,16.]; // actually should be based on field of view and distance from camera to plane, plus camera_xy
        this.camera_xy = [1.,1.];
        this.shaders = {}
        this.shaders.bone = new BoneShader();
        this.shaders.glow = new GlowShader();

        for (const s in this.shaders) {
            promises.push(this.shaders[s].init());
        }

        this.gltfs = {};
        this.gltfs.spaceship = new GLTF.Gltf("gltf/spaceship.gltf");
        this.gltfs.asteroid  = new GLTF.Gltf("gltf/asteroid.gltf");
        this.gltfs.rocket    = new GLTF.Gltf("gltf/rocket.gltf");

        for (const g in this.gltfs) {
            promises.push(this.gltfs[g].init());
        }

        return Promise.all(promises);
    }
    //f gl_ready
    gl_ready() {
        for (const s in this.shaders) {
            this.shaders[s].gl_ready();
        }
        gl_create_particle(this.shaders.bone.shader_class);
        this.gltf_models = {}
        var g = this.gltfs.spaceship;
        this.gltf_models.spaceship = new ModelClass("spaceship", g.get_node_by_name("Body.001").to_model_object(g))
        g = this.gltfs.asteroid;
        this.gltf_models.asteroid = new ModelClass("asteroid", g.get_node_by_name("Asteroid").to_model_object(g))
        g = this.gltfs.rocket;
        this.gltf_models.rocket = new ModelClass("rocket", g.get_node_by_name("Rocket").to_model_object(g))

        this.projection = new Projection();
        this.camera     = new Camera();
        this.spaceship  = new Spaceship(this.gltf_models.spaceship);
        this.asteroids = [];
        for (var i=0; i<8; i++) {
            this.asteroids.push(new Asteroid(this.gltf_models.asteroid));
        }
        this.rockets = [];
        for (var i=0; i<2; i++) {
            this.rockets.push(new Rocket(this.gltf_models.rocket));
        }
            
        this.spaceship.gl_ready(this.shaders.bone.shader_class);
        for (const a of this.asteroids) {
            a.gl_ready(this.shaders.bone.shader_class);
        }
        for (const a of this.rockets) {
            a.gl_ready(this.shaders.bone.shader_class);
        }
        this.particles = [];
        for (var i=0; i<20; i++) {
            this.particles.push( new Flame() );
        }
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
        if (press && (key==80)) {console.log(this.camera, this.spaceship);}
    }
    //f cursor_fn
    cursor_fn(xpos, ypos) {
    }
    //f mouse_button_fn
    mouse_button_fn(xpos, ypos, button, action, mods) {
    }
    //f bound_to_field
    bound_to_field(pos) {
        Glm.vec2.subtract(tv, pos, this.spaceship.pos);
        const w=this.field_xy[0], h=this.field_xy[1];
        if (tv[0]<-w) {pos[0] += 2*w;}
        if (tv[0]> w) {pos[0] -= 2*w;}
        if (tv[1]<-h) {pos[1] += 2*h;}
        if (tv[1]> h) {pos[1] -= 2*h;}
    }
    //f get_flame
    get_flame() {
        if (Math.random()>0.4) {return null;}
        for (const p of this.particles) {
            if (!p.show) {
                return p;
            }
        }
        return null;
    }
    //f draw_scene
    draw_scene() {
        GL.clearColor(0.0, 0.0, 0.1, 1.0);  // Clear to black, fully opaque
        GL.clearDepth(1.0);                 // Clear everything
        GL.enable(GL.DEPTH_TEST);           // Enable depth testing
        GL.depthFunc(GL.LEQUAL);            // Near things obscure far things
        GL.enable(GL.CULL_FACE);
        GL.cullFace(GL.BACK);

        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);


        const time = this.time;
        this.spaceship.tick(this, time);
        for (const a of this.asteroids) {
            a.tick(this, time);
        }
        for (const a of this.rockets) {
            a.tick(this, time);
        }
        for (const p of this.particles) {
            p.tick(time);
        }

        Glm.vec2.add(tv, this.spaceship.pos, this.camera.translation);
        const w=this.camera_xy[0], h=this.camera_xy[1];
        if (tv[0]<-w) {this.camera.translation[0] = -this.spaceship.pos[0]-w;}
        if (tv[0]> w) {this.camera.translation[0] = -this.spaceship.pos[0]+w;}
        if (tv[1]<-h) {this.camera.translation[1] = -this.spaceship.pos[1]-h;}
        if (tv[1]> h) {this.camera.translation[1] = -this.spaceship.pos[1]+h;}
        this.camera.recalculate();
        
        GL.useProgram(this.shaders.bone.program);
        GL.uniformMatrix4fv(this.shaders.bone.uniforms["uProjectionMatrix"],false, this.projection.matrix);
        GL.uniformMatrix4fv(this.shaders.bone.uniforms["uCameraMatrix"],    false, this.camera.matrix);

        this.spaceship.gl_draw(this.shaders.bone, time);
        for (const a of this.asteroids) {
            a.gl_draw(this.shaders.bone, time);
        }
        for (const a of this.rockets) {
            a.gl_draw(this.shaders.bone, time);
        }

        GL.useProgram(this.shaders.glow.program);
        GL.uniformMatrix4fv(this.shaders.glow.uniforms["uProjectionMatrix"],false, this.projection.matrix);
        GL.uniformMatrix4fv(this.shaders.glow.uniforms["uCameraMatrix"],    false, this.camera.matrix);
        for (const p of this.particles) {
            p.gl_draw(this.shaders.glow, time);
        }

    }
}

