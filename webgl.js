// a skinned mesh vertex is a vec3 and an array of N influences for N bones
// Each bone derives a mat4.
// PosedVertex = Sum(Influence[n] * BoneMat4[n]) * RestVertex
var GL;
function main() {
    const canvas = document.querySelector("#glcanvas");
    const gl     = canvas.getContext("webgl");
    if (!gl) {
        alert("Unable to start webgl");
        return;
    }
    GL = gl;

    moon = loadTexture("./moon.png");
    wood = loadTexture("./wood.jpg");
    shaders = shader_compile(gl);
    const mesh_objects = []
    mesh_objects.push(new MeshObject(dbl_cube,          moon, [3,0,0]));
    mesh_objects.push(new MeshObject(cube,              wood, [-3,0,0]));
    mesh_objects.push(new MeshObject(dbl_cube2,         wood, [0,0,0]));
    mesh_objects.push(new MeshObject(make_snake(16, 6), moon, [-6,0,0]));
    run_animation(shaders, mesh_objects);
}

function run_animation(shaders, mesh_objects) {
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
        drawScene(shaders, mesh_objects, time, matrices);
        time+=0.1;
        requestAnimationFrame(step_animation);
    }
    requestAnimationFrame(step_animation);
}

function drawScene(shaders, mesh_objects, time, matrices) {
    GL.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    GL.clearDepth(1.0);                 // Clear everything
    GL.enable(GL.DEPTH_TEST);           // Enable depth testing
    GL.depthFunc(GL.LEQUAL);            // Near things obscure far things
    GL.enable(GL.CULL_FACE);
    GL.cullFace(GL.BACK);
    //GL.cullFace(GL.FRONT);

    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    for (const m of mesh_objects) {
        m.animate(time);
    }    
    draw_objects(shaders[0], mesh_objects, matrices);
}

function draw_objects(shader, meshes, matrices) {
    GL.useProgram(shader.program);
    GL.uniformMatrix4fv(shader.uniforms.projectionMatrix,false, matrices[0]);
    GL.uniformMatrix4fv(shader.uniforms.cameraMatrix, false, matrices[1]);

    for (const m of meshes) {
        m.draw(shader);
    }
}

main();
