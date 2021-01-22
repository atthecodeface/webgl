#!/usr/bin/env python3

#a Imports
from pathlib import Path
from OpenGL import GL
import glm
import math
import numpy as np
from random import random
from gjsgl.shader import BoneShader, GlowShader, ShaderProgram
from gjsgl.frontend import Frontend
from gjsgl.transformation import Transformation, quaternion_of_rotation, quaternion_to_euler
from gjsgl.gltf import Gltf
from gjsgl.model import ModelObject, ModelClass, ModelInstance, ModelBufferData, ModelBufferView, ModelMaterial, ModelBufferIndices, ModelPrimitive, ModelPrimitiveView
from gjsgl.collider import Collider, RelativeFn

from typing import *
Vec2 = object

#a Globals
AXIS_X = glm.vec3([1,0,0])
AXIS_Y = glm.vec3([0,1,0])
AXIS_Z = glm.vec3([0,0,1])
#//v Global variables including temps
#//vt Temporary variables
#const tv_b = Glm.vec2.create() // vec3 so it has room for stuff
#const tv  = Glm.vec3.create() // vec3 so it has room for stuff
#const tv2 = Glm.vec3.create() // vec3 so it has room for stuff
#const tv3 = Glm.vec3.create() // vec3 so it has room for stuff
#const tq  = Glm.quat.create()

#//vc Constants
r_sqrt2 = math.sqrt(0.5)

#a Camera and projection
#c Projection
class Projection:
    def __init__(self) -> None:
        self.fov = 45 * math.pi / 180  # in radians
        self.aspect = 1.0 # GL.canvas.clientWidth / GL.canvas.clientHeight
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

#c Camera
class Camera:
    #f __init__
    def __init__(self) -> None:
        self.translation = [0.,0.,-45.]
        self.quaternion = glm.quat()
        self.matrix = glm.mat4()
        self.recalculate()
        pass
    #f recalculate
    def recalculate(self) -> None:
        camera = glm.mat4_cast(self.quaternion)
        for i in range(3):
            for j in range(3):
                camera[3][j] += self.translation[i]*camera[i][j]
                pass
            pass
        self.matrix = camera
        pass
    #f All done
    pass

#a Collider and Polar
#c Polar
class Polar:
    #f as_xy
    @staticmethod
    def as_xy(a:Vec2) -> Vec2:
        x = math.cos(a.x)*a.y
        y = math.sin(a.x)*a.y
        return glm.vec2(x,y)
    #f All done
    pass

#a Particle
#c Particle
#cc ParticlePrimitive - Creates a single ModelPrimitive that describes the particle
class ParticlePrimitive:
    @staticmethod
    def gl_create(shader_class):
        vertices = [0.]*12
        size=0.05
        vertices[0]=-size
        vertices[1]=-size
        vertices[2]=-size
        vertices[3]=size
        vertices[4]=-size
        vertices[5]=-size
        vertices[6]=-size
        vertices[7]=size
        vertices[8]=size
        vertices[9]=size
        vertices[10]=size
        indices = [0,1,2,3,0,1]
        ppmbd = ModelBufferData(np.array(vertices, np.float32),0)
        ppv = ModelPrimitiveView()
        ppv.position = ModelBufferView(ppmbd,3,GL.GL_FLOAT,0,0)
        ppv.indices  = ModelBufferIndices(np.array(indices,dtype=np.uint8))
        pp = ModelPrimitive()
        pp.view = ppv
        pp.material = ModelMaterial()
        pp.indices_count = 5
        pp.indices_offset = 0
        pp.indices_gl_type = GL.GL_UNSIGNED_BYTE
        pp.gl_type         = GL.GL_TRIANGLES
        pp.gl_create()
        pp.gl_bind_program(shader_class)
        return pp
    pass

#cc Particle - Particle instances may share a ModelInstance
class Particle:
    #fp __init__
    def __init__(self, model):
        self.model = model
        self.show = False
        self.pos      = glm.vec2()
        self.velocity = glm.vec2()
        self.matrix   = glm.mat4()
        self.identity = glm.mat4()
        self.color = [1.,1.,1.,1.]
        pass
    #mp tick - subclass may override
    def tick(self, time): pass
    #mp gl_draw - draw using shader program
    def gl_draw(self, shader_program):
        if (not self.show): return
        self.matrix[3][0] = self.pos[0]
        self.matrix[3][1] = self.pos[1]
        self.matrix[3][2] = 0.
        shader_program.set_uniform_if("uModelMatrix", lambda u: GL.glUniformMatrix4fv(u, 1, False, glm.value_ptr(self.matrix)))
        shader_program.set_uniform_if("uMeshMatrix",  lambda u: GL.glUniformMatrix4fv(u, 1, False, glm.value_ptr(self.identity)))
        shader_program.set_uniform_if("uBonesScale",  lambda u: GL.glUniform1f(u, 0.0) )
        self.model.material.color = self.color
        self.model.gl_draw(shader_program)
        pass
    #zz All done
    pass


#c Flame - a kind of Particle
class Flame(Particle):
    def __init__(self, model):
        super().__init__(model)
        self.show = False
        self.start_time = -1000
        self.life_time = 1.0
        pass
    def start(self, time, pos, velocity):
        self.pos[0]=pos[0]
        self.pos[1]=pos[1]
        self.velocity[0]=velocity[0]
        self.velocity[1]=velocity[1]
        self.start_time = time
        pass
    def tick(self, time):
        dt = (time - self.start_time) / self.life_time
        if (dt>1):
            self.show = False
            return
        self.pos += self.velocity
        self.show = True
        self.color[0] = 1.
        self.color[1] = 1.
        self.color[2] = 1.
        if (dt>0.25): self.color[1] = 0.9 ; self.color[2]=0.7
        if (dt>0.50): self.color[1] = 0.7 ; self.color[2]=0.5
        if (dt>0.75): self.color[1] = 0.5 ; self.color[2]=0.1
        pass
    def gl_draw(self, shader_program, time):
        tv = glm.vec3()
        tv[0] = random()*2-1
        tv[1] = random()*2-1
        tv[2] = random()*2-1
        tq = glm.angleAxis(1,tv)
        self.matrix = glm.mat4_cast(tq)
        super().gl_draw(shader_program)
        pass
    pass

#c Asteroid
class Asteroid:
    def __init__(self, model_class):
        pos_angle = random()*math.pi*2
        dist      = 7+2*random()
        self.pos      = glm.vec2()
        self.pos[0]   = math.cos(pos_angle)*dist
        self.pos[1]   = math.sin(pos_angle)*dist
        self.velocity = glm.vec2()
        self.velocity[0]=(random()-0.5)*0.1
        self.velocity[1]=(random()-0.5)*0.1
        self.size = 0
        self.min_size = 0.3
        self.angular_velocity = glm.quat()
        tv = glm.vec3()
        tv[0] = random()*2-1
        tv[1] = random()*2-1
        tv[2] = random()*2-1
        aspeed = random()
        self.angular_velocity = glm.angleAxis(aspeed/15, tv)
        self.model = ModelInstance(model_class)
        pass
    def gl_ready(self, shader_class):
        self.model.gl_create()
        self.model.gl_bind_program(shader_class)
        pass
    def tick(self, game, time):
        if (self.size==0): return
        q = self.model.transformation.quaternion
        q = q * self.angular_velocity
        q = glm.normalize(q)
        self.model.transformation.quaternion = q
        self.pos += self.velocity
        game.bound_to_field(self.pos)
        pass
    def hit(self, game, time, pos, velocity, d):
        print("Hit!")
        if (self.size==0): return
        tv = glm.vec2()
        tv[0] = -velocity[1]
        tv[1] =  velocity[0]
        tv = glm.normalize(tv) # normal to velocity
        tv3 = pos - self.pos
        game.bound_to_field(tv3)
        side_guess = glm.dot(tv3,tv)
        sign_side = -1
        if (side_guess>0): sign_side = 1
        tv2 = self.pos + tv*(sign_side*d) # point of separation
        mass = self.size * self.size # fake it as a circle
        d_frac = 1
        if (d<self.size): d_frac = abs(d)/self.size
        larger_size  = self.size * (1+d_frac)/2
        smaller_size = self.size-larger_size
        larger_mass = larger_size*larger_size
        smaller_mass = smaller_size*smaller_size
        impulse = 0.003 * (smaller_mass+larger_mass)
        # print(tv, larger_size, smaller_size)
        if (larger_size < self.min_size):
            self.size = 0
            game.mass_destroyed(mass)
            # console.log("Got one")
            return
        game.mass_destroyed(mass - smaller_mass - larger_mass)
        if (smaller_size > self.min_size):
            a = game.get_asteroid()
            if a is None:
                print("Should spawn asteroid subfragment but could not")
                game.mass_destroyed(smaller_mass)
                return
            rel_mass = game.rocket_mass / smaller_mass
            a.velocity = self.velocity + (velocity*rel_mass)
            a.velocity = a.velocity    + (tv * (sign_side/smaller_mass*impulse))
            a.pos      = tv2           + (tv * (sign_side*smaller_size))
            a.size = smaller_size
            pass
        else:
            game.mass_destroyed(smaller_mass)
            pass
        # current momentum = self.velocity * mass add other.velocity*its mass,
        rel_mass = game.rocket_mass / larger_mass
        self.velocity = self.velocity + (velocity*rel_mass)
        self.velocity = self.velocity + (tv * (-sign_side/larger_mass*impulse))
        self.pos      = tv2           + (tv * (-sign_side*larger_size))
        # should add an impulse perpendicular to velocity in to both smaller and larger
        self.size = larger_size
        pass
    def gl_draw(self, shader_program, time):
        if (self.size==0): return
        self.model.transformation.scale[0] = self.size
        self.model.transformation.scale[1] = self.size
        self.model.transformation.scale[2] = self.size
        self.model.transformation.translation[0] = self.pos[0]
        self.model.transformation.translation[1] = self.pos[1]
        self.model.transformation.translation[2] = 0
        self.model.gl_draw(shader_program, time)
        pass
    pass

#c Rocket - fired by the spaceship
class Rocket:
    #f __init__
    def __init__(self, model_class):
        self.fired = False
        self.speed = 0.4
        self.size = 1.0
        self.launch_time = 0.
        self.life_time = 1.
        self.pos      = glm.vec2()
        self.velocity = glm.vec2()
        self.angular_velocity = glm.quat()
        self.angular_velocity = glm.angleAxis(0.1, AXIS_Z)*self.angular_velocity
        self.model = ModelInstance(model_class)
        self.base_quaternion = glm.angleAxis(math.pi*0.5, AXIS_Y)
        self.base_quaternion = glm.angleAxis(math.pi*0.5, AXIS_X)*self.base_quaternion
        pass
    #f gl_ready - invoked when WebGL is set up
    def gl_ready(self, shader_class):
        self.model.gl_create()
        self.model.gl_bind_program(shader_class)
        pass
    #f launch - launch a rocket from the spaceship position in its direction with velocity of spaceship + direction
    def launch(self, game, time):
        dist      = 0.7
        spos = game.spaceship.pos
        sang = game.spaceship.angle
        svel = game.spaceship.velocity
        self.pos[0]      = spos[0] + math.cos(sang)*dist
        self.pos[1]      = spos[1] + math.sin(sang)*dist
        self.velocity[0] = self.speed*math.cos(sang) + svel[0]
        self.velocity[1] = self.speed*math.sin(sang) + svel[1]
        vel_angle = math.atan2(svel[1],svel[0])
        self.model.transformation.quaternion = self.base_quaternion * glm.angleAxis(sang, AXIS_Y)
        self.fired = True
        self.launch_time = time
        pass
    #f tick - move if alive
    def tick(self, game, time):
        if not self.fired: return
        if (time-self.launch_time) > self.life_time:
            self.fired = False
            return
        q = self.model.transformation.quaternion
        q = q * self.angular_velocity
        q = glm.normalize(q)
        self.model.transformation.quaternion = q
        for a in game.asteroids:
            if (a.size==0): continue
            d = Collider.circle_to_line(a.pos, a.size, self.pos, self.velocity, game.bound_vector)
            if d is not None:
                print(d)
                a.hit(game, time, self.pos, self.velocity, d)
                self.fired = False
                return
            pass
        self.pos = self.pos + self.velocity
        game.bound_to_field(self.pos)
        pass
    #mp gl_draw - draw the rocket at the correct position
    def gl_draw(self, shader_program, time):
        if not self.fired: return
        self.model.transformation.translation[0] = self.pos[0]
        self.model.transformation.translation[1] = self.pos[1]
        self.model.transformation.translation[2] = -0.3
        self.model.gl_draw(shader_program, time)
        pass
    #zz All done
    pass

#c Spaceship
class Spaceship:
    def __init__(self, model_class:ModelObject) -> None:
        self.pos      = glm.vec2()
        self.velocity = glm.vec2()
        self.angle = 0.
        self.angular_velocity = 0.01
        self.model = ModelInstance(model_class)
        self.model.transformation.quaternion.w = r_sqrt2
        self.model.transformation.quaternion.z = r_sqrt2
        self.rocket_ofs = 0.9
        self.max_speed = 0.3
        self.acceleration = 0.02
        self.reverse_acceleration = -0.003
        self.braking = (self.max_speed - self.acceleration) / self.max_speed
        self.next_allowed_launch_time = -999
        self.reload_time = 0.2
        pass
    #mp gl_ready - invoked when WebGL is ready
    def gl_ready(self, shader_class):
        self.model.gl_create()
        self.model.gl_bind_program(shader_class)
        pass
    #mp tick - move spaceship as required
    def tick(self, game, time):
        self.angular_velocity = self.angular_velocity*0.9
        self.velocity[0] = self.velocity[0] * self.braking
        self.velocity[1] = self.velocity[1] * self.braking
        if (game.motions&8): self.angular_velocity-=0.01
        if (game.motions&4): self.angular_velocity+=0.01
        self.angle += self.angular_velocity
        tv = glm.vec2()
        if (game.motions&2):
            tv[0] = self.angle
            tv[1] = 1
            tv = Polar.as_xy(tv)
            self.velocity = self.velocity + tv*self.reverse_acceleration
            pass
        if (game.motions&1):
            tv[0] = self.angle
            tv[1] = 1
            tv = Polar.as_xy(tv)
            self.velocity = self.velocity + tv*self.acceleration
            if random()<0.3:
                p = game.get_flame()
                if p is not None:
                    tv2 = glm.vec2()
                    tv2[0] = self.angle+(random()+random()-1)*0.3
                    tv2[1] = -0.2
                    tv2 = Polar.as_xy(tv2)
                    p.start(time,
                            [self.pos[0]-0.6*tv[0]-self.rocket_ofs*tv[1],self.pos[1]-0.6*tv[1]+self.rocket_ofs*tv[0]],
                            [self.velocity[0]+tv2[0],self.velocity[1]+tv2[1]]
                           )
                    self.rocket_ofs=-self.rocket_ofs
                pass
            pass
        if (game.motions&16):
            if (time>self.next_allowed_launch_time):
                r = game.get_rocket()
                if r is not None:
                    r.launch(game,time)
                    self.next_allowed_launch_time = time + self.reload_time
                    pass
                pass
            pass
        self.pos = self.pos + self.velocity
        for a in game.asteroids:
            if a.size==0: continue
            if (Collider.circle_to_circle(self.pos, 1.0, a.pos, a.size, game.bound_vector)):
                print(self.pos,a)
                pass
            pass
        pass
    #mp gl_draw - draw on canvas
    def gl_draw(self, shader_program:ShaderProgram, time:float) -> None:
        q = glm.angleAxis(math.pi/2, AXIS_X)
        q = q * glm.angleAxis(self.angle, AXIS_Y)
        self.model.transformation.quaternion = q
        self.model.transformation.translation[0] = self.pos[0]
        self.model.transformation.translation[1] = self.pos[1]
        self.model.transformation.translation[2] = 0
        self.model.gl_draw(shader_program, time)
        pass
    #zz All done
    pass

#c Asteroids - extends Frontend
class Asteroids(Frontend):
    window = (1000,1000)
    def __init__(self):
        super().__init__()

        self.textures = {}
        self.motion_of_keys = { 87:1,    83:2,
                                65:4,    68:8,
                                32:16,   88:32,
                                76:256,  188:512,
                                74:1024, 75:2048,
                                78:4096, 77:8192
                              }
        self.field_xy  = (20.,20.) # // actually should be based on field of view and distance from camera to plane, plus camera_xy
        self.camera_xy = [1.,1.]
        self.shaders = {}
        self.shaders["bone"] = ShaderProgram(BoneShader)
        self.shaders["glow"] = ShaderProgram(GlowShader)

        self.gltfs = {}
        self.gltfs["spaceship"] = Gltf(Path("."),Path("gltf/spaceship.gltf"))
        self.gltfs["asteroid"]  = Gltf(Path("."),Path("gltf/asteroid.gltf"))
        self.gltfs["rocket"]    = Gltf(Path("."),Path("gltf/rocket.gltf"))

        self.motions = 0
        pass
    #f gl_ready
    def gl_ready(self):
        for (_,s) in self.shaders.items():
            s.gl_ready()
            pass
        self.particle_model = ParticlePrimitive.gl_create(self.shaders["glow"].shader_class)
        self.gltf_models = {}
        for (gn,gm) in [("spaceship", "Body.001"), ("asteroid", "Asteroid"), ("rocket","Rocket")]:
            g = self.gltfs[gn]
            self.gltf_models[gn] = ModelClass(gn, g.get_node_by_name(gm)[1].to_model_object(g))
            pass

        self.projection = Projection()
        self.camera     = Camera()
        self.spaceship  = Spaceship(self.gltf_models["spaceship"])

        if True:
            self.rocket_mass = 0.04
            self.rocket_speed = 0.2
            self.rocket_size = 1.0
            self.asteroid_size = 3.0
            self.num_asteroids = 4
        
            self.spaceship.reload_time = 0.02
            self.spaceship.rocket_ofs = 0.9
            self.spaceship.max_speed = 0.25
            self.spaceship.acceleration = 0.01
            self.spaceship.reverse_acceleration = -0.003
            pass
        else:
            self.rocket_mass = 0.02
            self.rocket_speed = 0.7
            self.rocket_size = 1.0
            self.asteroid_size = 2.0
            self.num_asteroids = 6

            self.spaceship.reload_time = 0.4
            self.spaceship.rocket_ofs = 0.9
            self.spaceship.max_speed = 0.4
            self.spaceship.acceleration = 0.02
            self.spaceship.reverse_acceleration = -0.010
            pass
        
        self.spaceship.braking = (self.spaceship.max_speed - self.spaceship.acceleration) / self.spaceship.max_speed
        
        self.asteroids = []
        for i in range(100):
            self.asteroids.append(Asteroid(self.gltf_models["asteroid"]))
            pass

        self.total_size = 0.
        for i in range(self.num_asteroids):
            self.asteroids[i].size = self.asteroid_size
            self.total_size += self.asteroids[i].size*self.asteroids[i].size
            pass

        self.destroyed = 0
        self.mass_destroyed(0)

        self.rockets = []
        for i in range(20):
            r = Rocket(self.gltf_models["rocket"])
            r.speed = self.rocket_speed
            r.size  = self.rocket_size
            self.rockets.append(r)
            pass
            
        self.spaceship.gl_ready(self.shaders["bone"].shader_class)
        for a in self.asteroids:
            a.gl_ready(self.shaders["bone"].shader_class)
            pass
        for r in self.rockets:
            r.gl_ready(self.shaders["bone"].shader_class)
            pass
        self.particles = []
        for i in range(50):
            self.particles.append(Flame(self.particle_model) )
            pass
        pass
    #f key_fn
    def key_fn(self, key:int, scancode:int, press:bool, mods:int) -> None:
        motion = self.motion_of_keys.get(key,0)
        if (press):
            self.motions = self.motions | motion
            pass
        else:
            self.motions = self.motions & ~motion
            pass
        if (press and (key==80)):print(self)
        pass
    #f bound_to_field
    def bound_to_field(self, pos:Vec2) -> None:
        tv = pos - self.spaceship.pos
        (w,h) = self.field_xy
        if (tv.x<-w): pos[0] += 2*w
        if (tv.x> w): pos[0] -= 2*w
        if (tv.y<-h): pos[1] += 2*h
        if (tv.y> h): pos[1] -= 2*h
        pass
    #f bound_vector
    def bound_vector(self, vec:Vec2) -> None:
        (w,h) = self.field_xy
        if (vec.x<-w): vec[0] += 2*w
        if (vec.x> w): vec[0] -= 2*w
        if (vec.y<-h): vec[1] += 2*h
        if (vec.y> h): vec[1] -= 2*h
        pass
    #f get_flame
    def get_flame(self) -> Optional["Flame"]:
        for p in self.particles:
            if not p.show:
                return p
            pass
        return None
    #f get_asteroid
    def get_asteroid(self) -> Optional["Asteroid"]:
        for p in self.asteroids:
            if p.size==0:
                return p
            pass
        return None
    #f get_rocket
    def get_rocket(self) -> Optional["Rocket"]:
        for p in self.rockets:
            if not p.fired:
                return p
            pass
        return None
    #f mass_destroyed
    def mass_destroyed(self, m:float) -> None:
        self.destroyed += m
        pass
    #f handle_tick
    def handle_tick(self, time:float, time_last:float) -> None:
        GL.glClearColor(0.3, 0.3, 0.1, 1.0)  # Clear to black, fully opaque
        GL.glClearDepth(1.0)                 # Clear everything
        GL.glEnable(GL.GL_DEPTH_TEST)           # Enable depth testing
        GL.glDepthFunc(GL.GL_LEQUAL)            # Near things obscure far things
        # GL.glEnable(GL.GL_CULL_FACE)
        GL.glCullFace(GL.GL_BACK)

        GL.glClear(GL.GL_COLOR_BUFFER_BIT | GL.GL_DEPTH_BUFFER_BIT)

        self.spaceship.tick(self, time)
        for a in self.asteroids:
            a.tick(self, time)
            pass

        for r in self.rockets:
            r.tick(self, time)
            pass

        for f in self.particles:
            f.tick(time)
            pass

        tv = self.spaceship.pos + glm.vec2([self.camera.translation[0],self.camera.translation[1]])
        w = self.camera_xy[0]
        h = self.camera_xy[1]
        if (tv[0]<-w): self.camera.translation[0] = -self.spaceship.pos[0]-w
        if (tv[0]> w): self.camera.translation[0] = -self.spaceship.pos[0]+w
        if (tv[1]<-h): self.camera.translation[1] = -self.spaceship.pos[1]-h
        if (tv[1]> h): self.camera.translation[1] = -self.spaceship.pos[1]+h
        self.camera.recalculate()
        
        GL.glUseProgram(self.shaders["bone"].program)
        GL.glUniformMatrix4fv(self.shaders["bone"].uniforms["uProjectionMatrix"],1, False, glm.value_ptr(self.projection.matrix))
        GL.glUniformMatrix4fv(self.shaders["bone"].uniforms["uCameraMatrix"],    1, False, glm.value_ptr(self.camera.matrix))

        self.spaceship.gl_draw(self.shaders["bone"], time)
        for a in self.asteroids:
            a.gl_draw(self.shaders["bone"], time)
            pass
        
        for r in self.rockets:
            r.gl_draw(self.shaders["bone"], time)
            pass

        GL.glUseProgram(self.shaders["glow"].program)
        GL.glUniformMatrix4fv(self.shaders["glow"].uniforms["uProjectionMatrix"],1, False, glm.value_ptr(self.projection.matrix))
        GL.glUniformMatrix4fv(self.shaders["glow"].uniforms["uCameraMatrix"],    1, False, glm.value_ptr(self.camera.matrix))
        for p in self.particles:
            p.gl_draw(self.shaders["glow"], time)
            pass

        self.swap_buffers()
        pass    
    #f All done
    pass

#a Main
p = Asteroids()
p.run()
