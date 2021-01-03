#a Imports
import json
import base64
import glm
from pathlib import Path
from dataclasses import dataclass
from .transformation import Transformation

from typing import *
Json = Dict[str,Any]

#a GLTF enumerations
class Enum:
    name: ClassVar[str]
    enum: ClassVar[int]
    enum_to_cls : ClassVar[Dict[int,Type["Enum"]]]
    @classmethod
    def of_enum(cls:Type["Enum"], enum:int) -> Type["Enum"]: return cls.enum_to_cls[enum]
    pass

class ValueType(Enum): pass
class VTByte(ValueType):   enum=5120; name="BYTE"
class VTUByte(ValueType):  enum=5121; name="UNSIGNED_BYTE"
class VTShort(ValueType):  enum=5122; name="SHORT"
class VTUShort(ValueType): enum=5123; name="UNSIGNED_SHORT"
class VTUInt(ValueType):   enum=5125; name="UNSIGNED_INT"
class VTFloat(ValueType):  enum=5126; name="FLOAT"

class CompType(Enum): pass
class CTScalar(CompType):     enum=1; name="SCALAR"
class CTVec2Scalar(CompType): enum=1; name="VEC2"
class CTVec3Scalar(CompType): enum=1; name="VEC3"
class CTVec4Scalar(CompType): enum=1; name="VEC4"
class CTMat2Scalar(CompType): enum=1; name="MAT2"
class CTMat3Scalar(CompType): enum=1; name="MAT3"
class CTMat4Scalar(CompType): enum=1; name="MAT4"

class BViewTgt(Enum): pass
class BVTArray(BViewTgt): enum=34962; name="ARRAY_BUFFER"
class BVTIndex(BViewTgt): enum=34963; name="ELEMENT_ARRAY_BUFFER"

class PrimitiveType(Enum): pass
class PTPoints(PrimitiveType): enum=0; name="POINTS"
class PTLines(PrimitiveType): enum=1; name="LINES"
class PTLineLoop(PrimitiveType): enum=2; name="LINE_LOOP"
class PTLineStrip(PrimitiveType): enum=3; name="LINE_STRIP"
class PTTriangles(PrimitiveType): enum=4; name="TRIANGLES"
class PTTriangleStrip(PrimitiveType): enum=5; name="TRIANGLE_STRIP"
class PTTriangleFan(PrimitiveType): enum=6; name="TRIANGLE_FAN"
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
class Buffer:
    #v Properties
    name: str
    length: int
    data : bytes
    #f __init__
    def __init__(self, json:Json) -> None:
        self.name   = json.get("name","")
        self.uri    = json["uri"]
        self.length = json["byteLength"]
        if self.uri[:17] == "data:application/":
            data = self.uri.split(";base64,")[1]
            self.data = base64.b64decode(data)
            pass
        else:
            path = Path(self.uri)
            with path.open("rb") as f:
                self.data = f.read()
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
    name: str
    view: BufferView
    offset: int # n'th item at byte view_offset+this.offset+view_stride*m
    acc_type: str # SCALAR, VEC3, etc
    comp_type: int # GL_FLOAT, etc
    count: int # number of VEC3 of FLOAT (e.g.)
    #f __init__
    def __init__(self, gltf:"Gltf", json:Json) -> None:
        self.view = gltf.get_buffer_view(json["bufferView"])
        self.name   = json.get("name","")
        self.offset = json.get("byteOffset",0)
        self.acc_type = json.get("type","")
        self.comp_type = json.get("componentType","")
        self.count = json.get("count",0)
        pass
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
    pass

#c Primitive - Add non-standard maps
class Primitive: # Defines a drawElements call
    mode : PrimitiveType
    position   : Accessor
    indices    : Accessor
    material   : Material
    normal     : List[Accessor]
    tangent    : List[Accessor]
    color      : List[Accessor]
    tex_coords : List[Accessor] # max of 2 needs to be supported
    joints     : List[Accessor] # 4 joints in each
    weights    : List[Accessor] # 4 weights in each, same length as joints
    def __init__(self, gltf:"Gltf", mesh:"Mesh", json:Json) -> None:
        attributes = json.get("attributes",{"POSITION":0})
        self.mode     = cast(PrimitiveType, PrimitiveType.of_enum(json.get("mode",4)))
        self.position = gltf.get_accessor(attributes.get("POSITION",0))
        self.indices  = gltf.get_accessor(json.get("indices",0))
        self.material = gltf.get_material(json.get("material",0))
        self.normal  = []
        self.tangent = []
        self.color   = []
        self.tex_coords = []
        self.joints  = []
        self.weights = []
        # if attributes has "self.material = gltf.get_accessor(json.get("material",0))
        pass
    pass

#c Mesh
class Mesh:
    # No support for morph targets, hence no weights
    name      : str # "" if none
    primitives: List[Primitive]
    def __init__(self, gltf:"Gltf", json:Json) -> None:
        self.name   = json.get("name","")
        self.primitives = []
        if "primitives" in json:
            for p in json["primitives"]:
                self.primitives.append(Primitive(gltf, self, p))
                pass
            pass
        pass
    pass

#c Skin
@dataclass
class Skin:
    name  : str # "" if none
    ibms  : Optional[Accessor] # if None, then these are identity matrices
    root  : int # Index of root node
    joints: List[int] # same length as ibms (if that is defined)
    pass

#c Node
class Node:
    name: str
    transformation: Transformation
    skin: Optional[Skin] #
    mesh: Optional[Mesh] # If skinned, all mesh.primitives must have joints and weights
    children: List[int]
    def __init__(self, gltf:"Gltf", json:Json) -> None:
        self.name   = json.get("name","")
        self.mesh = None
        self.skin = None
        self.children = json.get("children",[])
        self.transformation = Transformation()
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
    #f __init__
    def __init__(self, root:Path, path:Path) -> None:
        with path.open() as f:
            self.json_data = json.load(f)
            # Ignore 'asset','scene', 'scenes'
            self.buffers = []
            self.buffer_views = []
            self.accessors = []
            self.materials = []
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
            print(self.buffers)
            print(self.buffer_views)
            print(self.accessors)
            print(self.materials)
            print(self.meshes)
            print(self.nodes)
            pass
        pass
    pass
