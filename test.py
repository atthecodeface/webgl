from glm import mat4, quat, vec3, value_ptr, perspective
from gjsgl.object import Mesh, MeshObject, Cube, DoubleCube, DoubleCube2, loadTexture
from gjsgl.bone import Bone
from gjsgl.shader import BoneShader, FlatShader
from gjsgl.frontend import Frontend

from OpenGL.GL import *
import OpenGL
# OpenGL.USE_ACCELERATE = False
# OpenGL.ERROR_CHECKING = False
import time

import traceback

class F(Frontend):
    frame_delay = 0.02
    stop_at = 1000
    time = 0.
    def opengl_ready(self):
        self.shader = BoneShader()
        # self.shader = FlatShader()
        self.mesh_objects = []
        c = DoubleCube2()
        #c = Cube()
        texture = loadTexture("wood.jpg")
        m = MeshObject(c, self.shader, texture, vec3())
        self.mesh_objects.append(m)
        pass
    def idle(self):
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
    def draw(self):
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)
        glClearColor(0.1, 0.1, 0.1, 1.0)
        glClearDepth(1.0)
        glEnable(GL_DEPTH_TEST)
        glDepthFunc(GL_LEQUAL)
        glEnable(GL_CULL_FACE)
        glCullFace(GL_BACK)
        self.draw_objects()
        self.swap_buffers()
        pass
    def draw_objects(self):
        glUseProgram(self.shader.program)
        matrices = []
        projection_matrix = perspective(45.*3.1415/180., 1.0, 0.1, 100.0)
        camera_matrix     = mat4()
        camera_matrix[3][2] -= 20.0
        matrices.append(projection_matrix)
        matrices.append(camera_matrix)
        glUniformMatrix4fv(self.shader.uniforms["uProjectionMatrix"], 1, False, value_ptr(matrices[0]))
        glUniformMatrix4fv(self.shader.uniforms["uCameraMatrix"],     1, False, value_ptr(matrices[1]))
        glUniform1i(self.shader.uniforms["uTexture"], 1, 0)
        for m in self.mesh_objects:
            m.draw(self.shader)
            pass
        pass
    pass
    
a = Bone()
a.derive_at_rest()
a.quaternion_from_rest(quat())
print(a.quaternion)
print(a.quaternion_rest)
p = F()
p.run()



