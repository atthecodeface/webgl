from pathlib import Path
from OpenGL import GL
import glm
import math
from .object import Object, Mesh, MeshObject
from .sample_objects import Cube, DoubleCube, DoubleCube2, Snake
from .bone import Bone, BonePose, AnimatedBonePose
from .shader import BoneShader, ShaderProgram
from .frontend import Frontend
from .texture import Texture, TextureImage
from .transformation import Transformation, quaternion_of_rotation, quaternion_to_euler
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
        q =     glm.angleAxis(self.eulers[1], glm.vec3([0,1,0]))
        q = q * glm.angleAxis(self.eulers[2], glm.vec3([0,0,1]))
        q = q * glm.angleAxis(self.eulers[0], glm.vec3([1,0,0]))
        camera = glm.mat4_cast(q)
        for i in range(3):
            for j in range(3):
                camera[3][0] += camera[i][0]*self.translation[i]
                camera[3][1] += camera[i][1]*self.translation[i]
                camera[3][2] += camera[i][2]*self.translation[i]
        camera *= self.zoom
        self.matrix = camera
        pass
    def translate(self, n:int, x:float) -> None:
        self.translation[0] += x*self.matrix[0][n]
        self.translation[1] += x*self.matrix[1][n]
        self.translation[2] += x*self.matrix[2][n]
        self.recalculate()
        pass
    def rotate(self, n:int, x:float) -> None:
        if n==0: q = glm.angleAxis(x, glm.vec3([1,0,0]))
        if n==1: q = glm.angleAxis(x, glm.vec3([0,1,0]))
        if n==2: q = glm.angleAxis(x, glm.vec3([0,0,1]))
        self.matrix = glm.mat4_cast(q) * self.matrix
        m = glm.mat3()
        for x in range(3):
            for y in range(3):
                m[x][y]= self.matrix[x][y]
                pass
            pass
        q = quaternion_of_rotation(m)
        e = quaternion_to_euler(q)
        self.eulers[0] = e[0]
        self.eulers[1] = e[1]
        self.eulers[2] = e[2]
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
                       76:256, 44:512,
                       74:1024, 75:2048,
                       78:4096, 77:8192,
    }
    #f __init__
    def __init__(self, url, node) -> None:
        super().__init__()
        self.camera = Camera()
        self.projection = Projection()
        self.gltf_data = (url, node)
        self.model_objects = []
        self.tick = 0
        self.motions = 0

        self.textures = {}
        self.textures["wood_png"] = TextureImage("wood_square.png")
        self.textures["wood"] = TextureImage("wood.jpg")
        self.textures["moon"] = TextureImage("moon.png")
        self.shader = ShaderProgram(BoneShader)
        self.gltf_file = Gltf(Path("."), Path(self.gltf_data[0]))
        pass
    #f gl_ready
    def gl_ready(self) -> None:
        self.shader.gl_ready()
        self.gltf_node = self.gltf_file.get_node_by_name(self.gltf_data[1]) [1]
        self.gltf_root = self.gltf_node.to_model_object(self.gltf_file)

        gltf_model = ModelClass("gltf", self.gltf_root)
        gltf_inst = ModelInstance(gltf_model)
        self.pose = None
        self.animatables = []
        if len(gltf_inst.bone_set_poses)>0:
            self.pose = gltf_inst.bone_set_poses[0]
            self.animatables.append(AnimatedBonePose(self.pose.poses))
            pass
        self.model_objects.append( gltf_inst )

        for (_,t) in self.textures.items():
            t.gl_create()
            pass
        model = ObjectModel("cube", Snake(16,8.))
        self.model_objects.append( ModelInstance(model) )
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
        delta_angle = 0.03
        if   self.motions &   1: self.camera.translate(2,  0.1)
        if   self.motions &   2: self.camera.translate(2, -0.1)
        if   self.motions &   4: self.camera.translate(0,  0.1)
        if   self.motions &   8: self.camera.translate(0, -0.1)
        if   self.motions &  16: self.camera.translate(1,  0.1)
        if   self.motions &  32: self.camera.translate(1, -0.1)
        if   self.motions & 256: self.camera.rotate(0, -delta_angle)
        if   self.motions & 512: self.camera.rotate(0,  delta_angle)
        if   self.motions &1024: self.camera.rotate(1, -delta_angle)
        if   self.motions &2048: self.camera.rotate(1,  delta_angle)
        if   self.motions &4096: self.camera.rotate(2, -delta_angle)
        if   self.motions &8192: self.camera.rotate(2,  delta_angle)
        pass
    #f handle_tick
    def handle_tick(self, time, time_last) -> None:
        self.move_camera()
        #for m in self.mesh_objects:
        #    m.animate(time)
        #    pass
        for a in self.animatables:
            a.interpolate_to_time(time)
            pass
        self.draw(time)
        self.swap_buffers()
        pass
    #f draw
    def draw(self, time:float) -> None:
        self.tick = self.tick + 1
        GL.glClear(GL.GL_COLOR_BUFFER_BIT | GL.GL_DEPTH_BUFFER_BIT)
        GL.glClearColor(0.7, 0.1, 0.1, 1.0)
        GL.glClearDepth(1.0)
        GL.glEnable(GL.GL_DEPTH_TEST)
        GL.glDepthFunc(GL.GL_LEQUAL)
        # GL.glEnable(GL.GL_CULL_FACE)
        GL.glCullFace(GL.GL_BACK)
        self.draw_objects(time)
        pass
    #f draw_objects
    def draw_objects(self, time:float) -> None:
        projection_matrix  = self.projection.matrix
        camera_matrix      = self.camera.matrix

        GL.glUseProgram(self.shader.program)
        GL.glUniformMatrix4fv(self.shader.uniforms["uProjectionMatrix"], 1, False, glm.value_ptr(projection_matrix))
        GL.glUniformMatrix4fv(self.shader.uniforms["uCameraMatrix"],     1, False, glm.value_ptr(camera_matrix))
        for o in self.model_objects:
            if o.bone_set_poses!=[]:
                pose1 = o.bone_set_poses[0].poses[0]
                pose2 = o.bone_set_poses[0].poses[1]
                pose1.transformation_reset()
                pose2.transformation_reset()
                pose1.transform(Transformation([math.sin(time), 0., 0.5*math.cos(time*0.4)],glm.quat()))
                pose2.transform(Transformation([-math.sin(time),0.,-0.5*math.cos(time*0.4)],glm.quat()))
                pass
            o.gl_draw(self.shader, self.tick)
            pass
        pass
    pass

