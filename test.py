from pathlib import Path
import glm
from gjsgl.object import Object, Mesh, MeshObject
from gjsgl.sample_objects import Cube, DoubleCube, DoubleCube2, Snake
from gjsgl.bone import Bone
from gjsgl.shader import BoneShader, FlatShader, UnbonedShader
from gjsgl.frontend import Frontend
from gjsgl.texture import Texture
from gjsgl.transformation import Transformation
from gjsgl.gltf import Gltf, Mesh2Mesh

from OpenGL import GL
# import OpenGL
# OpenGL.USE_ACCELERATE = False
# OpenGL.ERROR_CHECKING = False
import time

import traceback

class F(Frontend):
    frame_delay = 0.02
    stop_at = 1000
    time = 0.
    #f opengl_ready
    def opengl_ready(self) -> None:
        self.mesh_objects = []
        self.shader = BoneShader()
        # self.shader = UnbonedShader()

        texture = Texture("wood_square.png")
        # texture = Texture("wood.jpg")
        # texture = Texture("moon.png")

        # g = Gltf(Path("."),Path("./test.gltf"))
        # g = Gltf(Path("."),Path("./cubeplus.gltf"))
        # g = Gltf(Path("."),Path("./house.gltf"))
        # g = Gltf(Path("."),Path("./simple_escape.gltf"))
        g = Gltf(Path("."),Path("./milo.gltf"))
        gltf_mesh = Mesh2Mesh(self.shader, g, 0)
        self.mesh_objects.append(MeshObject(gltf_mesh, texture, glm.vec3(-4.,0.,0.)))

        c : Object = DoubleCube2()
        #c = Cube()
        c = Snake(16,8.)

        mesh = Mesh(self.shader, c)
        self.mesh_objects.append(MeshObject(mesh, texture, glm.vec3()))
        pass
    #f idle
    def idle(self) -> None:
        time.sleep(self.frame_delay)
        if self.finished:
            return
        try:
            for m in self.mesh_objects:
                m.animate(self.time)
                pass
            self.time += 0.08
            self.draw()
            pass
        except Exception as e:
            print(f"Failed: {e}")
            print(f"Failed: {traceback.format_exc()}")
            self.finished = True
            pass
        self.stop_at = self.stop_at-1
        if self.stop_at<0: self.finished=True
        pass
    #f draw
    def draw(self) -> None:
        GL.glClear(GL.GL_COLOR_BUFFER_BIT | GL.GL_DEPTH_BUFFER_BIT)
        GL.glClearColor(0.7, 0.1, 0.1, 1.0)
        GL.glClearDepth(1.0)
        GL.glEnable(GL.GL_DEPTH_TEST)
        GL.glDepthFunc(GL.GL_LEQUAL)
        GL.glEnable(GL.GL_CULL_FACE)
        GL.glCullFace(GL.GL_BACK)
        self.draw_objects()
        self.swap_buffers()
        pass
    def draw_objects(self) -> None:
        GL.glUseProgram(self.shader.program)
        matrices = []
        projection_matrix = glm.perspective(45.*3.1415/180., 1.0, 0.1, 100.0)
        camera_matrix     = glm.mat4()
        camera_matrix[3][1] -= 6.0
        camera_matrix[3][2] -= 20.0
        matrices.append(projection_matrix)
        q = glm.angleAxis(-self.time*0.2, [0., 1.0, 0.0])
        camera_matrix     = Transformation(translation=[0.,-6.,-20.],quaternion=q).mat4()
        matrices.append(camera_matrix)
        GL.glUniformMatrix4fv(self.shader.uniforms["uProjectionMatrix"], 1, False, glm.value_ptr(matrices[0]))
        GL.glUniformMatrix4fv(self.shader.uniforms["uCameraMatrix"],     1, False, glm.value_ptr(matrices[1]))
        self.shader.set_uniform_if("uTexture",    lambda u:GL.glUniform1i(u, 0))
        for m in self.mesh_objects:
            m.draw(self.shader)
            pass
        pass
    pass

a = Bone()
a.derive_at_rest()
p = F()
p.run()




