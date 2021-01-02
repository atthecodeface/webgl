#a Imports
import json
from pathlib import Path
from dataclasses import dataclass
from typing import *
from .transformation import Transformation

#a GLTF enumerations
class Enum:
    name: ClassVar[str]
    enum : ClassVar[int]
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

#a Data classes
#c Buffer
@dataclass
class Buffer:
    name: str
    # coulde be     "uri" : "data:application/gltf-buffer;base64,AAABAAIAAQADAAIAAAAAAAAAAAAAAAAAAACAPwAAAAAAAAAAAAAAAAAAgD8AAAAAAACAPwAAgD8AAAAAAAAAAAAAgD8AAAAAAACAPwAAgD8AAAAAAAAAAAAAAAAAAAAAAACAPwAAAAAAAAAA",
    path: Path
    length: int
    pass

#c BufferView
@dataclass
class BufferView:
    name: str
    buffer: Buffer
    offset: int
    length: int
    stride: int
    target: int
    pass

#c Accessor
@dataclass
class Accessor:
    name: str
    view: BufferView
    offset: int # n'th item at byte view_offset+this.offset+view_stride*m
    acc_type: str # SCALAR, VEC3, etc
    comp_type: int # GL_FLOAT, etc
    count: int # number of VEC3 of FLOAT (e.g.)
    pass

#c Image
@dataclass
class Image:
    pass

#c Sampler
@dataclass
class Sampler:
    pass

#c Texture
@dataclass
class Texture:
    pass

#c Material
@dataclass
class Material:
    color    : Tuple[float,float,float,float]
    metallic : float # 0 is full color of its own, 1.0 is fully reflective
    roughness: float # 0.5 is specular, no specular down to 0 full reflection, up to 1 fully matt
    base_texture: Tuple[Texture, int] # int is an index to the tex_coords list
    normal_texture: Optional[Texture]
    # emissive_texture: Optional[Texture]
    # emissive_color: Tuple[float,float,float]
    # alpha_mode:
    pass

#c Primitive
@dataclass
class Primitive: # Defines a drawElements call
    name: str
    mode : PrimitiveType
    position   : Accessor
    normal     : List[Accessor]
    tangent    : List[Accessor]
    color      : List[Accessor]
    tex_coords : List[Accessor] # max of 2 needs to be supported
    indices    : Accessor
    material   : Material
    joints     : List[Accessor] # 4 joints in each
    weights    : List[Accessor] # 4 weights in each, same length as joints
    pass

#c Mesh
@dataclass
class Mesh:
    name      : str # "" if none
    primitives: List[Primitive]
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
@dataclass
class Node:
    name: str
    transform: Optional[Transformation]
    skin: Optional[Skin] #
    mesh: Mesh # If skinned, all mesh.primitives must have joints and weights
    pass

#c Gltf
class Gltf:
    buffers:       List[Buffer]
    buffer_views:  List[BufferView]
    accessors:     List[Accessor]
    materials:     List[Material]
    meshes:        List[Mesh]
    def __init__(self, root:Path, path:Path) -> None:
        with path.open() as f:
            self.json_data = json.load(f)
            # Ignore 'asset','scene', 'scenes'
            # Nodes are name to Optional mesh number+Children+skin mappings
            # texture which refers to an image and a sampler
            # sampler has magFilter, minFilter, wrapS, wrapT
            # images have a URI
            self.buffers = []
            self.buffer_views = []
            self.accessors = []
            self.materials = []
            self.meshes = []
            if "buffers" in self.json_data:
                for b in self.json_data["buffers"]:
                    self.buffers.append(Buffer(path=root.joinpath(b['uri']), length=b['byteLength']))
                    pass
                pass
            if "bufferViews" in self.json_data:
                for b in self.json_data["bufferViews"]:
                    index=b['buffer']
                    stride = 0
                    if "byteStride" in b: stride=b["byteStride"]
                    if index>=0 and index<len(self.buffers):
                        self.buffer_views.append(BufferView(buffer=self.buffers[index], offset=b['byteOffset'], length=b['byteLength'], stride=stride))
                        pass
                    pass
                pass
            if "accessors" in self.json_data:
                for b in self.json_data["accessors"]:
                    index = b['bufferView']
                    offset = 0
                    if "byteOffset" in b: offset=b["byteOffset"]
                    if index>=0 and index<len(self.buffer_views):
                        self.accessors.append(Accessor(view=self.buffer_views[index],
                                                       offset=offset,
                                                       acc_type=b['type'],
                                                       comp_type=b['componentType'],
                                                       count=b['count'],
                                                       ))
                        pass
                    pass
                pass
            if "materials" in self.json_data:
                for m in self.json_data['materials']:
                    pass
                pass
            if "meshes" in self.json_data:
                for m in self.json_data['meshes']:
                    pass
                pass
            print(self.buffers)
            print(self.buffer_views)
            print(self.accessors)
            print(self.materials)
            print(self.meshes)
            pass
        pass
    pass
