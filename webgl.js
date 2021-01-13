// a skinned mesh vertex is a vec3 and an array of N influences for N bones
// Each bone derives a mat4.
// PosedVertex = Sum(Influence[n] * BoneMat4[n]) * RestVertex
var GL;
function main() {
    const canvas = document.querySelector("#glcanvas");
    const gl     = canvas.getContext("webgl2");
    if (!gl) {
        alert("Unable to start webgl");
        return;
    }
    GL = gl;

    moon = loadTexture("./moon.png");
    wood = loadTexture("./wood.jpg");
    shader = (new BoneShader()).init(gl);
    console.log(shader);
    const mesh_objects = [];
    //mesh_objects.push(new MeshObject(shader, dbl_cube,          moon, [3,0,0]));
    mesh_objects.push(new MeshObject(shader, cube,              wood, [-3,0,0]));
    //mesh_objects.push(new MeshObject(shader, dbl_cube2,         wood, [0,0,0]));
    //mesh_objects.push(new MeshObject(shader, make_snake(16, 6), moon, [-6,0,0]));

    const model_objects = [];
    // model = new ObjectModel("cube", make_snake(16,8.));
    const model = new ObjectModel("cube", cube);
    model_objects.push( new ModelInstance(model) );
    for (const o of model_objects) {
        o.gl_create();
        o.gl_bind_program(shader.shader_class);
    }
    console.log(model_objects[0].str());
    run_animation(shader, mesh_objects, model_objects);
}

function run_animation(shader, mesh_objects, model_objects) {
    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = GL.canvas.clientWidth / GL.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
    
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    var time=0.0;
    const cameraMatrix = mat4.create();
    mat4.translate(cameraMatrix,     // destination matrix
                   cameraMatrix,     // matrix to translate
                   [-0.0, -4.0, -20.0]);  // amount to translate
    mat4.rotateX(cameraMatrix, cameraMatrix, 0.3);
    matrices = [projectionMatrix, cameraMatrix];
    step_animation = function() {
        drawScene(shader, mesh_objects, model_objects, time, matrices);
        time+=0.1;
        requestAnimationFrame(step_animation);
    }
    requestAnimationFrame(step_animation);
}

function drawScene(shader, mesh_objects, model_objects, time, matrices) {
    GL.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    GL.clearDepth(1.0);                 // Clear everything
    GL.enable(GL.DEPTH_TEST);           // Enable depth testing
    GL.depthFunc(GL.LEQUAL);            // Near things obscure far things
    // GL.enable(GL.CULL_FACE);
    // GL.cullFace(GL.BACK);
    // GL.cullFace(GL.FRONT);

    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    for (const m of mesh_objects) {
        m.animate(time);
    }    

    GL.useProgram(shader.program);
    GL.uniformMatrix4fv(shader.uniforms["uProjectionMatrix"],false, matrices[0]);
    GL.uniformMatrix4fv(shader.uniforms["uCameraMatrix"], false, matrices[1]);
    GL.uniformMatrix4fv(shader.uniforms["uMeshMatrix"], false, mat4.create());

    for (const m of mesh_objects) {
        m.draw(shader);
    }
    for (const o of model_objects) {
        o.gl_draw(shader, time);
    }
}

main();
