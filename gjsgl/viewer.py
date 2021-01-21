from pathlib import Path
from OpenGL import GL
import glm
import math
from .object import Object, Mesh, MeshObject
from .sample_objects import Cube, DoubleCube, DoubleCube2, Snake
from .bone import Bone, BonePose, AnimatedBonePose
from .shader import BoneShader, FlatShader, UnbonedShader
from .frontend import Frontend
from .texture import Texture, TextureImage
from .transformation import Transformation
from .gltf import Gltf
from .sample_models import ObjectModel
from .model import ModelClass, ModelInstance

#a Camera and projection
class Projection:
    def __init__(self) -> None:
        self.fov = 45 * math.pi / 180  # in radians
        self.aspect = 1.0 # GL.canvas.clientWidth / GL.canvas.clientHeight;
        self.near = 0.1
        self.far = 100.0
        self.recalculate()
        pass
    def recalculate(self) -> None:
        self.matrix = glm.perspective(self.fov, self.aspect, self.near, self.far)
        pass
    def set_fov(self, x:float) -> None:
        self.fov = x * math.pi / 180   # in radians
        self.recalculate()
        pass
    pass

class Camera:
    def __init__(self) -> None:
        self.translation = [0.,-4.,-20.]
        self.eulers = [0.3,0.,1.57]
        self.zoom = 1.
        self.transformation = Transformation()
        self.recalculate()
        pass
    def recalculate(self) -> None:
        camera = glm.mat4()
        q = glm.angleAxis(self.eulers[1], glm.vec3([0,1,0]))
        q = glm.angleAxis(self.eulers[2], glm.vec3([0,0,1])) * q
        q = glm.angleAxis(self.eulers[0], glm.vec3([1,0,0])) * q
        camera = glm.mat4_cast(q)
        camera[3][0] += self.translation[0]
        camera[3][1] += self.translation[1]
        camera[3][2] += self.translation[2]
        camera *= self.zoom
        self.matrix = camera
        pass
    def translate(self, n:int, x:float) -> None:
        self.translation[0] += x*self.matrix[0+n]
        self.translation[1] += x*self.matrix[4+n]
        self.translation[2] += x*self.matrix[8+n]
        self.recalculate()
        pass
    def rotate(self, n:int, x:float) -> None:
        q = glm.rotate(Glm.quat.create(),x,n)
        m = Glm.mat4.clone(self.matrix);
        Glm.mat4.multiply(self.matrix, Glm.mat4.fromQuat(Glm.mat4.create(),q), self.matrix);
        Glm.mat4.getRotation(q, self.matrix);
        self.eulers = quaternion_to_euler(q);
        self.recalculate();
        pass
    def set_euler(self, n:int, x:float) -> None:
        self.eulers[n] = x * Math.PI / 180;
        self.recalculate();
        pass
    def set_xyz(self, n:int, x:float) -> None:
        self.translation[n] = x;
        self.recalculate();
        pass
    def set_zoom(self, x:float) -> None:
        self.zoom = x;
        self.recalculate();
        pass
    pass

#a Frontend
def axis(mat:glm.Mat4, n:int) -> glm.Vec3:
    return glm.vec3((mat[n][0],mat[n][1],mat[n][2]))
#c ViewerFrontend
class ViewerFrontend(Frontend):
    tick = 0
    motions = 0
    motion_of_keys = { 87:1, 83:2,
                       65:4, 68:8,
                       90:16, 88:32,
                       59:256, 46:512,
                       78:1024, 77:2048,
                       76:4096, 44:8192,
    }
    #f __init__
    def __init__(self, url, node) -> None:
        super().__init__()
        self.gltf_data = (url, node)
        pass
    #f gl_ready
    def gl_ready(self) -> None:
        self.camera = Camera()
        self.projection = Projection()
        projection_matrix = glm.perspective(45.*3.1415/180., 1.0, 0.1, 100.0)
        # Transformation(translation=(-0.2,-1.2,-5.))
        self.mesh_objects = []
        self.model_objects = []
        self.shader = BoneShader()
        self.tick = 0
        self.motions = 0

        self.textures = {}
        self.textures["wood_png"] = TextureImage("wood_square.png")
        self.textures["wood"] = TextureImage("wood.jpg")
        self.textures["moon"] = TextureImage("moon.png")
        # texture = TextureImage("wood.jpg")
        # texture = TextureImage("moon.png")

        self.gltf_file = Gltf(Path("."), Path(self.gltf_data[0]))
        self.gltf_node = self.gltf_file.get_node_by_name(self.gltf_data[1]) [1]
        self.gltf_root = self.gltf_node.to_model_object(self.gltf_file)

        c : Object = DoubleCube2()
        c = Cube()
        # c = Snake(16,8.)

        mesh = Mesh(self.shader, c)
        self.mesh_objects.append(MeshObject(mesh, self.textures["wood"], glm.vec3((3.,0.,0.))))

        gltf_model = ModelClass("gltf", self.gltf_root)
        gltf_inst = ModelInstance(gltf_model)
        self.pose = None
        self.animatables = []
        if len(gltf_inst.bone_set_poses)>0:
            self.pose = gltf_inst.bone_set_poses[0]
            self.animatables.append(AnimatedBonePose(self.pose.poses))
            pass
        self.model_objects.append( gltf_inst )
        # self.mesh_objects = []

        for (_,t) in self.textures.items():
            t.gl_create()
            pass
        model = ObjectModel("cube", Snake(16,8.))
        # self.model_objects.append( ModelInstance(model) )
        for o in self.model_objects:
            o.gl_create()
            o.gl_bind_program(self.shader.shader_class)
            pass
        pass
    #f mouse_button_fn
    def xmouse_button_fn(self, xpos:float, ypos:float, button:int, action:int, mods:int) -> None:
        pass
    #f key_fn
    def key_fn(self, key:int, scancode:int, press:bool, mods:int) -> None:
        motion = self.motion_of_keys.get(key,0)
        if press: self.motions = self.motions | motion
        else: self.motions = self.motions & ~motion
        if press and key==80: print(self.camera)
        pass
    #f move_camera
    def move_camera(self) -> None:
        mat = glm.mat4()
        axes = self.camera.matrix
        axes = mat
        if   self.motions &   1: self.camera.translate(axis(axes,2),  0.1)
        if   self.motions &   2: self.camera.translate(axis(axes,2), -0.1)
        if   self.motions &   4: self.camera.translate(axis(axes,0),  0.1)
        if   self.motions &   8: self.camera.translate(axis(axes,0), -0.1)
        if   self.motions &  16: self.camera.translate(axis(axes,1),  0.1)
        if   self.motions &  32: self.camera.translate(axis(axes,1), -0.1)
        if   self.motions & 256: self.camera.rotate(axis(mat,0), -0.1)
        if   self.motions & 512: self.camera.rotate(axis(mat,0),  0.1)
        if   self.motions &1024: self.camera.rotate(axis(mat,1), -0.1)
        if   self.motions &2048: self.camera.rotate(axis(mat,1),  0.1)
        if   self.motions &4096: self.camera.rotate(axis(mat,2), -0.1)
        if   self.motions &8192: self.camera.rotate(axis(mat,2),  0.1)
        pass
    #f handle_tick
    def handle_tick(self, time, time_last) -> None:
        self.move_camera()
        for m in self.mesh_objects:
            m.animate(time)
            pass
        for a in self.animatables:
            a.interpolate_to_time(time)
            pass
        self.draw()
        pass
    #f draw
    def draw(self) -> None:
        self.tick = self.tick + 1
        GL.glClear(GL.GL_COLOR_BUFFER_BIT | GL.GL_DEPTH_BUFFER_BIT)
        GL.glClearColor(0.7, 0.1, 0.1, 1.0)
        GL.glClearDepth(1.0)
        GL.glEnable(GL.GL_DEPTH_TEST)
        GL.glDepthFunc(GL.GL_LEQUAL)
        # GL.glEnable(GL.GL_CULL_FACE)
        GL.glCullFace(GL.GL_BACK)
        self.draw_objects()
        self.swap_buffers()
        pass
    #f draw_objects
    def draw_objects(self) -> None:
        projection_matrix  = self.projection.matrix
        camera_matrix      = self.camera.matrix

        GL.glUseProgram(self.shader.program)
        GL.glUniformMatrix4fv(self.shader.uniforms["uProjectionMatrix"], 1, False, glm.value_ptr(projection_matrix))
        GL.glUniformMatrix4fv(self.shader.uniforms["uCameraMatrix"],     1, False, glm.value_ptr(camera_matrix))
        mat = glm.mat4()
        GL.glUniformMatrix4fv(self.shader.uniforms["uMeshMatrix"], 1, False, glm.value_ptr(mat))
        for m in self.mesh_objects:
            m.draw(self.shader)
            pass
        for o in self.model_objects:
            o.gl_draw(self.shader, self.tick)
            pass
        pass
    pass

