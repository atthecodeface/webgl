class Projection {
    constructor() {
        this.fov = 45 * Math.PI / 180;   // in radians
        this.aspect = GL.canvas.clientWidth / GL.canvas.clientHeight;
        this.near = 0.1;
        this.far = 100.0;
        this.recalculate();
    }
    recalculate() {
        this.matrix = mat4.perspective(mat4.create(), this.fov, this.aspect, this.near, this.far);
    }
    set_fov(x) {
        this.fov = x * Math.PI / 180;   // in radians
        this.recalculate();
    }
}

class Camera {
    constructor() {
        this.translation = [0.,-4.,-20.];
        this.eulers = [0.3,0.,0.];
        this.eulers = [0.3,0.,1.57];
        this.zoom = 1.;
        this.transformation = new Transformation();
        this.recalculate();
    }
    recalculate() {
        var d;
        if ((d=document.getElementById("cameraX"))!==undefined) {d.value=this.translation[0]*10.;}
        if ((d=document.getElementById("cameraY"))!==undefined) {d.value=this.translation[1]*10.;}
        if ((d=document.getElementById("cameraZ"))!==undefined) {d.value=this.translation[2]*10.;}
        if ((d=document.getElementById("cameraEX"))!==undefined) {d.value=this.eulers[0]*180/Math.PI;}
        if ((d=document.getElementById("cameraEY"))!==undefined) {d.value=this.eulers[1]*180/Math.PI;}
        if ((d=document.getElementById("cameraEZ"))!==undefined) {d.value=this.eulers[2]*180/Math.PI;}
        if ((d=document.getElementById("cameraZoom"))!==undefined) {d.value=Math.log2(this.zoom)*10.+50;}
        const camera = mat4.create();
        mat4.rotateY(camera, camera, this.eulers[1]);
        mat4.rotateZ(camera, camera, this.eulers[2]);
        mat4.rotateX(camera, camera, this.eulers[0]);
        mat4.translate(camera, camera, this.translation);
        mat4.scale(camera, camera, [this.zoom,this.zoom,this.zoom]);
        this.matrix = camera;
    }
    translate(n,x) {
        if (1) {
        this.translation[0] += x*this.matrix[0+n];
        this.translation[1] += x*this.matrix[4+n];
            this.translation[2] += x*this.matrix[8+n]; }
        else {
            this.translation[n] += x;
        }
        this.recalculate();
    }
    rotate(n,x) {
        const q = quat.create();
        if (n==0) { quat.rotateX(q,q,x);}
        if (n==1) { quat.rotateY(q,q,x);}
        if (n==2) { quat.rotateZ(q,q,x);}
        const m = mat4.clone(this.matrix);
        mat4.multiply(this.matrix, mat4.fromQuat(mat4.create(),q), this.matrix);
        mat4.getRotation(q, this.matrix);
        this.eulers = quaternion_to_euler(q);
        this.recalculate();
    }
    set_euler(n, x) {
        this.eulers[n] = x * Math.PI / 180;
        this.recalculate();
    }
    set_xyz(n, x) {
        this.translation[n] = x;
        this.recalculate();
    }
    set_zoom(x) {
        this.zoom = x;
        this.recalculate();
    }
}

class ViewerFrontend extends Frontend {
    async init() {
        this.projection = new Projection();
        this.camera     = new Camera();
        this.motions    = 0;
        this.textures = {};
        this.motion_of_keys = { 87:1,    83:2,
                                65:4,    68:8,
                                90:16,   88:32,
                                76:256,  188:512,
                                74:1024, 75:2048,
                                78:4096, 77:8192
                              };

        this.textures.moon = new TextureImage("./moon.png");
        this.textures.wood = new TextureImage("./wood.jpg");

        this.shader = new BoneShader();
        this.shader.init(GL);
        console.log(this.shader);

        this.model_objects = [];

        const model = new ObjectModel("cube", make_snake(16,8.));
        //const model = new ObjectModel("cube", cube);
        //this.model_objects.push( new ModelInstance(model) );

        this.gltf_data = ["./milo.gltf", "Body.001"];
        this.gltf_data = ["./milo2.gltf", "Head.001"];
        this.gltf_data = ["./WaterBottle.gltf", "WaterBottle"];
        this.gltf_file = new GLTF.Gltf(this.gltf_data[0]);

        return Promise.all([this.textures.moon.init(), this.textures.wood.init(), this.gltf_file.init()])
    }
    //f gl_ready
    gl_ready() {
        this.gltf_node = this.gltf_file.get_node_by_name(this.gltf_data[1]);
        this.gltf_root = this.gltf_node.to_model_object(this.gltf_file);
        const gltf_model = new ModelClass("gltf", this.gltf_root);
        const gltf_inst  = new ModelInstance(gltf_model);
        this.model_objects.push(gltf_inst);

        for (const t in this.textures) {
            this.textures[t].gl_create();
        }

        for (const o of this.model_objects) {
            o.gl_create();
            o.gl_bind_program(this.shader.shader_class);
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
        if (press && (key==80)) {console.log(this.camera);}
    }
    //f cursor_fn
    cursor_fn(xpos, ypos) {
    }
    //f mouse_button_fn
    mouse_button_fn(xpos, ypos, button, action, mods) {
    }
    //f move_camera
    move_camera() {
        const delta_angle=0.03;
        if (this.motions &   1) {this.camera.translate(2,  0.1); }
        if (this.motions &   2) {this.camera.translate(2, -0.1); }
        if (this.motions &   4) {this.camera.translate(0,  0.1); }
        if (this.motions &   8) {this.camera.translate(0, -0.1); }
        if (this.motions &  16) {this.camera.translate(1,  0.1); }
        if (this.motions &  32) {this.camera.translate(1, -0.1); }
        if (this.motions & 256) {this.camera.rotate(0, -delta_angle); }
        if (this.motions & 512) {this.camera.rotate(0,  delta_angle); }
        if (this.motions &1024) {this.camera.rotate(1, -delta_angle); }
        if (this.motions &2048) {this.camera.rotate(1,  delta_angle); }
        if (this.motions &4096) {this.camera.rotate(2, -delta_angle); }
        if (this.motions &8192) {this.camera.rotate(2,  delta_angle); }
    }
    //f draw_scene
    draw_scene() {
        this.move_camera();
        GL.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        GL.clearDepth(1.0);                 // Clear everything
        GL.enable(GL.DEPTH_TEST);           // Enable depth testing
        GL.depthFunc(GL.LEQUAL);            // Near things obscure far things
        // GL.enable(GL.CULL_FACE);
        // GL.cullFace(GL.BACK);
        // GL.cullFace(GL.FRONT);

        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

        GL.useProgram(this.shader.program);
        GL.uniformMatrix4fv(this.shader.uniforms["uProjectionMatrix"],false, this.projection.matrix);
        GL.uniformMatrix4fv(this.shader.uniforms["uCameraMatrix"],    false, this.camera.matrix);
        GL.uniformMatrix4fv(this.shader.uniforms["uMeshMatrix"],      false, mat4.create());

        const time = this.time;
        for (const o of this.model_objects) {
            if (o.bone_set_poses.length>0) {
                const pose1 = o.bone_set_poses[0].poses[1];
                const pose2 = o.bone_set_poses[0].poses[2];
                pose1.transformation_reset();
                pose2.transformation_reset();
                pose1.transform(new Transformation([Math.sin(time),0.,0.5*Math.cos(time*0.4)],quat.create()));
                pose2.transform(new Transformation([-Math.sin(time),0.,-0.5*Math.cos(time*0.4)],quat.create()));
            }
            o.gl_draw(this.shader, time);
        }
    }
}

