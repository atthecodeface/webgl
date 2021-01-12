#a Imports
from OpenGL import GL
import json
import base64
import glm
import ctypes
import numpy as np
from pathlib import Path
from dataclasses import dataclass
from .transformation import Transformation
from .object import MeshBase
from .bone import Bone, BoneSet
from .texture import Texture as OTexture
from .shader import ShaderProgram
from .model import ModelObject, ModelMesh, ModelPrimitive, ModelPrimitiveView, ModelBufferView, ModelBufferData, ModelMaterial, ModelBufferIndices

from typing import *
Json = Dict[str,Any]

if not TYPE_CHECKING:
    GL.VAO          = object
    GL.Program      = object
    GL.Shader       = object
    GL.ShaderType   = object
    GL.Texture      = object
    GL.Buffer       = object
    GL.Uniform      = object
    GL.Attribute    = object
    GL.ValueTypeEnum = int
    GL.ElementType = int
    pass

#a GLTF enumerations
class Enum:
    name: ClassVar[str]
    enum: ClassVar[int]
    enum_to_cls : ClassVar[Dict[int,Type["Enum"]]]
    name_to_cls : ClassVar[Dict[str,Type["Enum"]]]
    @classmethod
    def of_enum(cls:Type["Enum"], enum:int) -> Type["Enum"]: return cls.enum_to_cls[enum]
    @classmethod
    def of_name(cls:Type["Enum"], name:str) -> Type["Enum"]: return cls.name_to_cls[name]
    pass

class ValueType(Enum): size: int; gl_type:GL.ValueTypeEnum; pass
class VTByte(ValueType):   enum=5120; size=1; gl_type=GL.GL_BYTE;           name="BYTE"
class VTUByte(ValueType):  enum=5121; size=1; gl_type=GL.GL_UNSIGNED_BYTE;  name="UNSIGNED_BYTE"
class VTShort(ValueType):  enum=5122; size=2; gl_type=GL.GL_SHORT;          name="SHORT"
class VTUShort(ValueType): enum=5123; size=2; gl_type=GL.GL_UNSIGNED_SHORT; name="UNSIGNED_SHORT"
class VTUInt(ValueType):   enum=5125; size=4; gl_type=GL.GL_UNSIGNED_INT;   name="UNSIGNED_INT"
class VTFloat(ValueType):  enum=5126; size=4; gl_type=GL.GL_FLOAT;          name="FLOAT"
ValueType.enum_to_cls = {
    VTByte.enum   : VTByte,
    VTUByte.enum  : VTUByte,
    VTShort.enum  : VTShort,
    VTUShort.enum : VTUShort,
    VTUInt.enum   : VTUInt,
    VTFloat.enum  : VTFloat,
}

class CompType(Enum): size: int; pass
class CTScalar(CompType):     enum=1; size=1;  name="SCALAR"
class CTVec2Scalar(CompType): enum=1; size=2;  name="VEC2"
class CTVec3Scalar(CompType): enum=1; size=3;  name="VEC3"
class CTVec4Scalar(CompType): enum=1; size=4;  name="VEC4"
class CTMat2Scalar(CompType): enum=1; size=4;  name="MAT2"
class CTMat3Scalar(CompType): enum=1; size=9;  name="MAT3"
class CTMat4Scalar(CompType): enum=1; size=16; name="MAT4"
CompType.name_to_cls = {
    CTScalar.name                    :CTScalar,
    CTVec2Scalar.name                    :CTVec2Scalar,
    CTVec3Scalar.name                    :CTVec3Scalar,
    CTVec4Scalar.name                    :CTVec4Scalar,
    CTMat2Scalar.name                    :CTMat2Scalar,
    CTMat3Scalar.name                    :CTMat3Scalar,
    CTMat4Scalar.name                    :CTMat4Scalar,
}


class BViewTgt(Enum): pass
class BVTArray(BViewTgt): enum=34962; name="ARRAY_BUFFER"
class BVTIndex(BViewTgt): enum=34963; name="ELEMENT_ARRAY_BUFFER"

class PrimitiveType(Enum): gl_type:GL.ElementType; pass
class PTPoints(PrimitiveType):        enum=0; gl_type=GL.GL_POINTS; name="POINTS"
class PTLines(PrimitiveType):         enum=1; gl_type=GL.GL_LINES; name="LINES"
class PTLineLoop(PrimitiveType):      enum=2; gl_type=GL.GL_LINE_LOOP; name="LINE_LOOP"
class PTLineStrip(PrimitiveType):     enum=3; gl_type=GL.GL_LINE_STRIP; name="LINE_STRIP"
class PTTriangles(PrimitiveType):     enum=4; gl_type=GL.GL_TRIANGLES; name="TRIANGLES"
class PTTriangleStrip(PrimitiveType): enum=5; gl_type=GL.GL_TRIANGLE_STRIP; name="TRIANGLE_STRIP"
class PTTriangleFan(PrimitiveType)  : enum=6; gl_type=GL.GL_TRIANGLE_FAN; name="TRIANGLE_FAN"
PrimitiveType.enum_to_cls = {
    PTPoints.enum          : PTPoints,
    PTLines.enum           : PTLines,
    PTLineLoop.enum        : PTLineLoop,
    PTLineStrip.enum       : PTLineStrip,
    PTTriangles.enum       : PTTriangles,
    PTTriangleStrip.enum   : PTTriangleStrip,
    PTTriangleFan.enum     : PTTriangleFan,
    }

#a Data classes
#c Buffer
NPArray = Any
class Buffer:
    #v Properties
    name: str
    length: int
    data : NPArray
    #f __init__
    def __init__(self, json:Json) -> None:
        self.name   = json.get("name","")
        self.uri    = json["uri"]
        self.length = json["byteLength"]
        if self.uri[:17] == "data:application/":
            data = self.uri.split(";base64,")[1]
            self.data = np.frombuffer(base64.b64decode(data),dtype=np.uint8)
            pass
        else:
            path = Path(self.uri)
            with path.open("rb") as f:
                data = f.read()
                self.data = np.frombuffer(data, dtype=np.uint8)
                pass
            pass
        pass
    pass

#c BufferView
class BufferView:
    name: str
    buffer: Buffer
    offset: int
    length: int
    stride: int
    target: int
    #f __init__
    def __init__(self, gltf:"Gltf", json:Json) -> None:
        self.buffer = gltf.get_buffer(json["buffer"])
        self.name   = json.get("name","")
        self.stride = json.get("byteStride",0)
        self.offset = json.get("byteOffset",0)
        self.length = json.get("byteLength",0)
        self.target = json.get("target",0)
        pass
    #f All donen
    pass

#c Accessor
class Accessor:
    #v Properties
    name: str
    view: BufferView
    offset: int # n'th item at byte view_offset+this.offset+view_stride*m
    acc_type: CompType
    comp_type: ValueType
    count: int # number of VEC3 of FLOAT (e.g.)
    #f __init__
    def __init__(self, gltf:"Gltf", json:Json) -> None:
        self.view = gltf.get_buffer_view(json["bufferView"])
        self.name   = json.get("name","")
        self.offset = json.get("byteOffset",0)
        self.acc_type  = cast(CompType, CompType.of_name(json.get("type","SCALAR")))
        self.comp_type = cast(ValueType, ValueType.of_enum(json.get("componentType",5120)))
        self.count = json.get("count",0)
        pass
    #f as_np_data
    def as_np_data(self) -> Any:
        item_size = self.comp_type.size * self.acc_type.size
        stride = self.view.stride
        if stride==0: stride=item_size
        b = np.ndarray((self.count * item_size,), dtype=np.uint8)
        for i in range(self.count):
            dest_offset = item_size*i
            src_offset = self.view.offset + self.offset + stride*i
            b[dest_offset:dest_offset+item_size] = self.view.buffer.data[src_offset:src_offset+item_size]
            pass
        return b
    #f to_model_buffer_view
    def to_model_buffer_view(self) -> ModelBufferView:
        data        = self.view.buffer.data
        byte_offset = self.view.offset
        byte_length = self.view.length
        stride      = self.view.stride
        offset      = self.offset
        count       = self.acc_type.size # e.g. 3 for VEC3
        gl_type     = self.comp_type.gl_type # e.g. of GL_FLOAT
        print(f"Creating attributes of {gl_type} {byte_offset}, {byte_length}, {data[byte_offset:byte_offset+byte_length]}")
        model_data  = ModelBufferData(data=data, byte_offset=byte_offset, byte_length=byte_length)
        return ModelBufferView(data=model_data, count=count, gl_type=gl_type, offset=offset, stride=stride)
    #f to_model_buffer_indices
    def to_model_buffer_indices(self) -> ModelBufferIndices:
        data        = self.view.buffer.data
        byte_offset = self.view.offset
        byte_length = self.view.length
        print(f"Creating indices of {self.comp_type.gl_type} {byte_offset}, {byte_length}, {data[byte_offset:byte_offset+byte_length]}")
        return ModelBufferIndices(data=data, byte_offset=byte_offset, byte_length=byte_length)
    #f All done
    pass

#c Image
            # images have a URI
@dataclass
class Image:
    pass

#c Sampler
            # sampler has magFilter, minFilter, wrapS, wrapT
@dataclass
class Sampler:
    pass

#c Texture
            # texture which refers to an image and a sampler
@dataclass
class Texture:
    pass

#c Material
# Texture use is Texture and aan int is an index to the tex_coords list to use to index the texture
TextureUse = Tuple[Texture,int]
class Material:
    #v Properties
    color    : Tuple[float,float,float,float] # Base color
    metallic : float # 0 is fully dielectric, 1.0 is fully metallic
    roughness: float # 0.5 is specular, no specular down to 0 full reflection, up to 1 fully matt
    base_texture: Optional[TextureUse]
    normal_texture: Optional[TextureUse]
    # emissive_texture: Optional[Texture] # 0 for no-emission, 1 for full emissive_color
    # emissive_color: Tuple[float,float,float]
    # alpha_mode:
    # occlusion_texture: Optional[Texture] # 0 for no occlusion, 1 to reduce final color value to 0
    # metallic_roughness_texture: Optional[Texture] # get metallic for G and roughness from B
    #f __init__
    def __init__(self, gltf:"Gltf", json:Json) -> None:
        self.name   = json.get("name","")
        pbr : Json = json.get("pbrMetallicRoughness",[])
        self.color = (1.,1.,1.,1.)
        self.metallic = 1.
        self.roughness = 0.
        self.base_texture = None
        self.normal_texture = None
        if len(pbr)>0:
            self.color     = tuple(json.get("baseColorFactor",self.color)) # type: ignore
            self.roughness = json.get("roughnessFactor",self.roughness)
            self.metallic  = json.get("metallicFactor",self.metallic)
            pass
        pass
    #f to_model_material
    def to_model_material(self) -> ModelMaterial:
        m = ModelMaterial()
        m.color = self.color
        return m
    #f All done
    pass

#c Primitive - Add non-standard maps
class Primitive: # Defines a drawElements call
    #v Properties
    mode       : PrimitiveType
    material   : Material
    indices    : Accessor
    position   : Accessor
    normal     : List[Accessor]
    tangent    : List[Accessor]
    color      : List[Accessor]
    tex_coords : List[Accessor] # max of 2 needs to be supported
    joints     : List[Accessor] # <=4 joints in each
    weights    : List[Accessor] # <=4 weights in each, weight[n] is of bone[joint[n]]
    #f __init__
    def __init__(self, gltf:"Gltf", mesh:"Mesh", json:Json) -> None:
        attributes = json.get("attributes",{"POSITION":0})
        self.mode     = cast(PrimitiveType, PrimitiveType.of_enum(json.get("mode",4)))
        self.position = gltf.get_accessor(attributes.get("POSITION",0))
        self.indices  = gltf.get_accessor(json.get("indices",0))
        self.material = gltf.get_material(json.get("material",0))
        self.normal  = []
        if "NORMAL" in attributes:
            self.normal.append( gltf.get_accessor(attributes["NORMAL"]) )
            pass
        self.tangent = []
        if "TANGENT" in attributes:
            self.tangent.append( gltf.get_accessor(attributes["TANGENT"]) )
            pass
        self.color   = []
        self.tex_coords = []
        if "TEXCOORD_0" in attributes:
            self.tex_coords.append( gltf.get_accessor(attributes["TEXCOORD_0"]) )
            pass
        if "TEXCOORD_1" in attributes:
            self.tex_coords.append( gltf.get_accessor(attributes["TEXCOORD_1"]) )
            pass
        if "TEXCOORD_1" in attributes:
            self.tex_coords.append( gltf.get_accessor(attributes["TEXCOORD_1"]) )
            pass
        self.joints  = []
        if "JOINTS_0" in attributes:
            self.joints.append( gltf.get_accessor(attributes["JOINTS_0"]) )
            pass
        self.weights = []
        if "WEIGHTS_0" in attributes:
            self.weights.append( gltf.get_accessor(attributes["WEIGHTS_0"]) )
            pass
        # if attributes has "self.material = gltf.get_accessor(json.get("material",0))
        pass
    #f to_model_primitive
    def to_model_primitive(self) -> ModelPrimitive:
        material = self.material.to_model_material()

        view      = ModelPrimitiveView()
        view.indices  = self.indices.to_model_buffer_indices()
        view.position = self.position.to_model_buffer_view()
        if self.normal!=[]:     view.normal     = self.normal[0].to_model_buffer_view()
        if self.tangent!=[]:    view.tangent    = self.tangent[0].to_model_buffer_view()
        if self.color!=[]:      view.color      = self.color[0].to_model_buffer_view()
        if self.tex_coords!=[]: view.tex_coords = self.tex_coords[0].to_model_buffer_view()
        if self.joints!=[]:     view.joints     = self.joints[0].to_model_buffer_view()
        if self.weights!=[]:    view.weights    = self.weights[0].to_model_buffer_view()
        primitive = ModelPrimitive()
        primitive.material        = material
        primitive.view            = view
        primitive.gl_type         = self.mode.gl_type
        primitive.indices_offset  = self.indices.offset
        primitive.indices_count   = self.indices.count
        primitive.indices_gl_type = self.indices.comp_type.gl_type
        print(f"Created model primitive {primitive}")
        return primitive
    #f All done
    pass

#c Mesh
class Mesh:
    # No support for morph targets, hence no weights
    #v Properties
    name      : str # "" if none
    primitives: List[Primitive]
    #f __init__
    def __init__(self, gltf:"Gltf", json:Json) -> None:
        self.name   = json.get("name","")
        self.primitives = []
        if "primitives" in json:
            for p in json["primitives"]:
                self.primitives.append(Primitive(gltf, self, p))
                pass
            pass
        pass
    #f to_model_mesh
    def to_model_mesh(self, gltf:"Gltf") -> ModelMesh:
        model_mesh = ModelMesh()
        for p in self.primitives:
            model_mesh.primitives.append(p.to_model_primitive())
            pass
        print(f"Created model mesh {model_mesh}")
        return model_mesh
    #f All done
    pass

#c Skin
class Skin:
    #v Properties
    name  : str # "" if none
    ibms  : Optional[Accessor] # if None, then these are identity matrices
    root  : int # Index of root node
    joints: List[int] # same length as ibms (if that is defined)
    #f __init__
    def __init__(self, gltf:"Gltf", json:Json) -> None:
        self.name   = json.get("name","")
        self.joints = json.get("joints",[])
        self.root   = json.get("skeleton",0)
        self.ibms   = json.get("inverseBindMatrices",None)
        pass
    #f to_bones
    def to_bones(self, gltf:"Gltf") -> BoneSet:
        bone_set = BoneSet()
        nodes = []
        for j in self.joints:
            n = gltf.get_node(j)
            nodes.append(n)
            pass
        nodes.sort(key=lambda x:x.depth)
        bones = {}
        for j in self.joints:
            n = gltf.get_node(j)
            if n in bones: continue
            def add_bone(n:"Node",b:Bone)->None: bones[n]=b
            bone = n.to_bone(gltf, add_callback=add_bone)
            bone_set.add_bone_hierarchy(bone)
            pass
        for i in range(len(self.joints)):
            j = self.joints[i]
            n = gltf.get_node(j)
            b = bones[n]
            b.matrix_index = i
            pass
        bone_set.derive_matrices()
        return bone_set
    #f All done
    pass

#c Node
class Node:
    #v Properties
    name: str
    transformation: Transformation
    skin: Optional[Skin] #
    mesh: Optional[Mesh] # If skinned, all mesh.primitives must have joints and weights
    children: List[int]
    depth: int # Depth below top of tree - from 0 (root) to N-1 (N = number of nodes in gltf)
    #f __init__
    def __init__(self, gltf:"Gltf", json:Json) -> None:
        self.name   = json.get("name","")
        self.mesh = None
        self.skin = None
        self.children = json.get("children",[])
        self.transformation = Transformation()
        self.depth = -1
        if "mesh" in json:
            self.mesh = gltf.get_mesh(json["mesh"])
            pass
        if "skin" in json:
            self.skin = gltf.get_skin(json["skin"])
            pass
        if "matrix" in json:
            self.transformation.from_mat4(json["matrix"])
            pass
        if "rotation" in json:
            q = json["rotation"]
            self.transformation.quaternion.w = q[0]
            self.transformation.quaternion.x = q[1]
            self.transformation.quaternion.y = q[2]
            self.transformation.quaternion.z = q[3]
            pass
        if "scale" in json:
            self.transformation.scale = glm.vec3(json["scale"])
            pass
        if "translation" in json:
            self.transformation.translation = glm.vec3(json["translation"])
            pass
        pass
    #f calculate_depth
    def calculate_depth(self, gltf:"Gltf", depth:int) -> None:
        if depth<=self.depth: return
        self.depth = depth
        for ci in self.children:
            cn = gltf.get_node(ci)
            cn.calculate_depth(gltf, depth+1)
            pass
        pass
    #f to_bone
    def to_bone(self, gltf:"Gltf", add_callback:Callable[["Node",Bone],None], parent:Optional[Bone]=None) -> Bone:
        bone = Bone(parent=parent, transformation=self.transformation)
        add_callback(self, bone)
        for ci in self.children:
            cn = gltf.get_node(ci)
            cn.to_bone(gltf, add_callback=add_callback, parent=bone)
            pass
        return bone
    #f to_model_object
    def to_model_object(self, gltf:"Gltf", parent:Optional[ModelObject]=None) -> ModelObject:
        model_object = ModelObject(parent=parent, transformation=self.transformation)
        for ci in self.children:
            cn = gltf.get_node(ci)
            cn.to_model_object(gltf, parent=model_object)
            pass
        if self.mesh is not None:
            model_object.mesh = self.mesh.to_model_mesh(gltf)
            pass
        if self.skin is not None:
            model_object.bones = gltf.bones_of_skin(self.skin)
            pass
        print(f"Created model object {model_object}")
        return model_object
    #f All done
    pass

#c Gltf
class Gltf:
    #v Properties
    buffers:       List[Buffer]
    buffer_views:  List[BufferView]
    accessors:     List[Accessor]
    images:        List[Image]
    samplers:      List[Sampler]
    textures:      List[Texture]
    materials:     List[Material]
    skins:         List[Skin]
    meshes:        List[Mesh]
    nodes:         List[Node]

    bone_sets   : Dict[Skin,BoneSet]
    #f get_buffer
    def get_buffer(self, index:int) -> Buffer:
        if index<0 or index>=len(self.buffers): raise Exception("Bad buffer number")
        return self.buffers[index]
    #f get_buffer_view
    def get_buffer_view(self, index:int) -> BufferView:
        if index<0 or index>=len(self.buffer_views): raise Exception("Bad bufferView number")
        return self.buffer_views[index]
    #f get_accessor
    def get_accessor(self, index:int) -> Accessor:
        if index<0 or index>=len(self.accessors): raise Exception("Bad accessor number")
        return self.accessors[index]
    #f get_image
    def get_image(self, index:int) -> Image:
        if index<0 or index>=len(self.images): raise Exception("Bad image number")
        return self.images[index]
    #f get_sampler
    def get_sampler(self, index:int) -> Sampler:
        if index<0 or index>=len(self.samplers): raise Exception("Bad sampler number")
        return self.samplers[index]
    #f get_texture
    def get_texture(self, index:int) -> Texture:
        if index<0 or index>=len(self.textures): raise Exception("Bad texture number")
        return self.textures[index]
    #f get_material
    def get_material(self, index:int) -> Material:
        if index<0 or index>=len(self.materials): raise Exception("Bad material number")
        return self.materials[index]
    #f get_skin
    def get_skin(self, index:int) -> Skin:
        if index<0 or index>=len(self.skins): raise Exception("Bad skin number")
        return self.skins[index]
    #f get_mesh
    def get_mesh(self, index:int) -> Mesh:
        if index<0 or index>=len(self.meshes): raise Exception("Bad mesh number")
        return self.meshes[index]
    #f get_node
    def get_node(self, index:int) -> Node:
        if index<0 or index>=len(self.nodes): raise Exception("Bad node number")
        return self.nodes[index]
    #f get_node_by_name
    def get_node_by_name(self, name:str) -> Optional[Tuple[int,Node]]:
        for i in range(len(self.nodes)):
            if name == self.nodes[i].name:
                return (i, self.nodes[i])
            pass
        return None
    #f __init__
    def __init__(self, root:Path, path:Path) -> None:
        with path.open() as f:
            self.json_data = json.load(f)
            # Ignore 'asset','scene', 'scenes'
            self.buffers = []
            self.buffer_views = []
            self.accessors = []
            self.materials = []
            self.skins = []
            self.meshes = []
            self.nodes = []
            if "buffers" in self.json_data:
                for b in self.json_data["buffers"]:
                    self.buffers.append(Buffer(b))
                    pass
                pass
            if "bufferViews" in self.json_data:
                for b in self.json_data["bufferViews"]:
                    self.buffer_views.append(BufferView(self, b))
                    pass
                pass
            if "accessors" in self.json_data:
                for b in self.json_data["accessors"]:
                    self.accessors.append(Accessor(self, b))
                pass
            if "materials" in self.json_data:
                for m in self.json_data['materials']:
                    self.materials.append(Material(self,m))
                    pass
                pass
            if "skins" in self.json_data:
                for s in self.json_data['skins']:
                    self.skins.append(Skin(self,s))
                    pass
                pass
            if "meshes" in self.json_data:
                for m in self.json_data['meshes']:
                    self.meshes.append(Mesh(self,m))
                    pass
                pass
            if "nodes" in self.json_data:
                for n in self.json_data['nodes']:
                    self.nodes.append(Node(self,n))
                    pass
                pass
            for n in self.nodes:
                n.calculate_depth(self, 0)
                pass
            self.bone_sets = {}
            for s in self.skins:
                self.bone_sets[s] = s.to_bones(self)
                pass
            pass
        pass
    #f bones_of_skin
    def bones_of_skin(self, skin:Skin) -> BoneSet:
        return self.bone_sets[skin]
    #f All done
    pass

