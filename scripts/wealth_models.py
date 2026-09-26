"""Money Tour cash units. Run in Blender; creates its own scene, preserving others."""
import bpy, math
from mathutils import Vector

scene=bpy.data.scenes.new('05 · Money Tour wealth')
bpy.context.window.scene=scene
def mat(name,color,metal=0):
    m=bpy.data.materials.new(name); m.use_nodes=True
    p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=.32 if metal else .65
    m.diffuse_color=(*color,1)
    return m
green=mat('Wealth · fresh banknotes',(.22,.56,.27))
edge=mat('Wealth · paper edges',(.67,.83,.43))
ink=mat('Wealth · note engraving',(.08,.30,.17))
band=mat('Wealth · paper strap',(.99,.85,.40))
gold=mat('Wealth · gold',(.96,.62,.09),.72)
mark=mat('Wealth · gold stamp',(.52,.26,.025),.65)
def root(name):
    o=bpy.data.objects.new(name,None);scene.collection.objects.link(o);return o
def box(name,loc,scale,material,parent=None,bevel=.02):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object;o.name=name;o.dimensions=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(material)
    if bevel:
        m=o.modifiers.new('Rounded edges','BEVEL');m.width=bevel;m.segments=2
    o.parent=parent;return o
note=root('banknote_bundle')
for i in range(8):
    box('Layered note', (0,0,.012+i*.026),(.70,.37,.025),edge if i%2 else green,note,.008)
box('Printed top note',(0,0,.212),(.67,.34,.006),green,note,.008)
for x in [-.285,.285]:box('Fine print',(x,0,.218),(.014,.27,.004),ink,note,.001)
for y in [-.14,.14]:box('Fine print',(0,y,.218),(.58,.01,.004),ink,note,.001)
box('Cream strap',(0,0,.117),(.115,.388,.24),band,note,.012)
bar=root('gold_bar')
v=[(-.34,-.18,0),(.34,-.18,0),(.34,.18,0),(-.34,.18,0),(-.27,-.125,.19),(.27,-.125,.19),(.27,.125,.19),(-.27,.125,.19)]
mesh=bpy.data.meshes.new('Beveled ingot');mesh.from_pydata(v,[],[(0,3,2,1),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(4,5,6,7)]);mesh.update()
o=bpy.data.objects.new('Gold ingot',mesh);scene.collection.objects.link(o);o.parent=bar;o.data.materials.append(gold)
m=o.modifiers.new('Soft milled edges','BEVEL');m.width=.025;m.segments=3
for y in [-.045,.035]:box('Hallmark',(0,y,.192),(.19,.012,.006),mark,bar,.002)
bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=.038,location=(.18,0,.191))
o=bpy.context.object;o.name='Mint seal';o.scale.z=.1;o.parent=bar;o.data.materials.append(mark)
bar.location.x=1.05
floor=mat('Wealth studio',(.12,.26,.31))
box('Studio floor',(.45,0,-.13),(4,3,.16),floor)
bpy.ops.object.camera_add(location=(2,-3,2.4));cam=bpy.context.object
cam.rotation_euler=(Vector((.45,0,.10))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.5;scene.camera=cam
for name,loc,power,size in [('Softbox',(-2,-2,4),450,4),('Rim',(2,1,3),350,3)]:
    bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.name=name;light.data.energy=power;light.data.shape='DISK';light.data.size=size
    light.rotation_euler=(Vector((.4,0,0))-light.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1000;scene.render.resolution_y=650;scene.render.resolution_percentage=100
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        area.spaces.active.region_3d.view_perspective='CAMERA'
        area.spaces.active.shading.type='MATERIAL'
print('Created banknote_bundle and gold_bar in isolated scene')
