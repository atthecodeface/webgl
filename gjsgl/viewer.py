from pathlib import Path
from OpenGL import GL
import glm
import math
from .object import Object, Mesh, MeshObject
from .sample_objects import Cube, DoubleCube, DoubleCube2, Snake
from .bone import Bone, BonePose
from .shader import BoneShader, FlatShader, UnbonedShader
from .frontend import Frontend
from .texture import Texture, TextureImage
from .transformation import Transformation
from .gltf import Gltf
from .sample_models import ObjectModel
from .model import ModelClass, ModelInstance
from .animate import Linear, Bezier2
#a Frontend
def axis(mat:glm.Mat4, n:int) -> glm.Vec3:
    return glm.vec3((mat[n][0],mat[n][1],mat[n][2]))
class AnimatedBonePose:
    def __init__(self, pose:BonePose) -> None:
        self.pose = pose
        self.animatable = Linear(Transformation())
        self.animatable.set_target( t1=1.,
                                    tgt=Transformation(quaternion=glm.angleAxis(0.3,glm.vec3((1.,0.,0.)))),
                                    callback=self.animation_callback )
        pass
    def interpolate_to_time(self, t:float) -> None:
        z = self.animatable.interpolate_to_time(t)
        # print(t, z)
        self.pose.transformation_reset()
        self.pose.transform(z)
        pass
    def animation_callback(self, t:float) -> None:
        t_sec = math.floor(t)
        t_int = int(t_sec)
        tgt = 1.0
        if (t_int&1): tgt=-1.
        self.animatable.set_target( t1=t_sec+1.,
                                    tgt=Transformation(quaternion=glm.angleAxis(tgt*0.3,glm.vec3((1.,0.,0.)))),
                                    callback=self.animation_callback )
        pass
    pass

#c ViewerFrontend
class ViewerFrontend(Frontend):
    time = 0.
    tick = 0
    motions = 0
    motion_of_keys = { 87:1, 83:2,
                       65:4, 68:8,
                       90:16, 88:32,
                       59:256, 46:512,
                       78:1024, 77:2048,
                       76:4096, 44:8192,
    }
    #f opengl_ready
    def opengl_ready(self) -> None:
        self.mesh_objects = []
        self.model_objects = []
        self.shader = BoneShader()
        self.tick = 0
        self.camera = Transformation(translation=(-0.2,-1.2,-5.))
        self.motions = 0

        self.textures = {}
        self.textures["wood_png"] = TextureImage("wood_square.png")
        self.textures["wood"] = TextureImage("wood.jpg")
        self.textures["moon"] = TextureImage("moon.png")
        # texture = TextureImage("wood.jpg")
        # texture = TextureImage("moon.png")

        self.gltf_data = (Path("./milo.gltf"), "Body.001")
        # self.gltf_data = (Path("./cubeplus.gltf"), "Cube")
        # self.gltf_data = (Path("./simple_escape.gltf"), "RoomExport")
        # self.gltf_data = (Path("./milo2.gltf"), "Head.001")
        # self.gltf_data = [Path("./WaterBottle.gltf"), "WaterBottle"];

        self.gltf_file = Gltf(Path("."), self.gltf_data[0])
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
            self.animatables.append(AnimatedBonePose(self.pose.poses[1]))
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
        axes = self.camera.mat4()
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
    #f idle_fn
    def idle_fn(self) -> None:
        self.move_camera()
        for m in self.mesh_objects:
            m.animate(self.time)
            pass
        self.time += 0.01
        for a in self.animatables:
            a.interpolate_to_time(self.time)
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
    def draw_objects(self) -> None:
        GL.glUseProgram(self.shader.program)
        matrices = []
        projection_matrix = glm.perspective(45.*3.1415/180., 1.0, 0.1, 100.0)
        camera_matrix     = self.camera.mat4()
        matrices.append(projection_matrix)
        matrices.append(camera_matrix)
        GL.glUniformMatrix4fv(self.shader.uniforms["uProjectionMatrix"], 1, False, glm.value_ptr(matrices[0]))
        GL.glUniformMatrix4fv(self.shader.uniforms["uCameraMatrix"],     1, False, glm.value_ptr(matrices[1]))
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

