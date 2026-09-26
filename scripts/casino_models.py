"""Original Money Tour casino, insurance and Karma pieces. Run in Blender."""
import bpy, math
from mathutils import Vector
scene=bpy.data.scenes.new('06 · Casino and good fortune');bpy.context.window.scene=scene
def material(name,color,metal=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=.35
    m.diffuse_color=(*color,1);return m
gold=material('Fortune · brushed gold',(.94,.60,.12),.25)
ivory=material('Fortune · ivory',(.99,.91,.70))
red=material('Fortune · burgundy enamel',(.48,.022,.08))
black=material('Fortune · obsidian',(.018,.027,.035))
teal=material('Fortune · teal',(.025,.39,.38))
walnut=material('Fortune · walnut',(.19,.07,.025))
glass=material('Fortune · glass',(.14,.38,.48),.12)
def root(name):
    o=bpy.data.objects.new(name,None);scene.collection.objects.link(o);return o
def finish(o,name,mat,parent):
    o.name=name;o.data.materials.append(mat);o.parent=parent;return o
def box(name,xyz,size,mat,parent,bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1,location=xyz);o=bpy.context.object;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    m=o.modifiers.new('Soft machined edge','BEVEL');m.width=bevel;m.segments=3
    return finish(o,name,mat,parent)
def sphere(name,xyz,r,mat,parent):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,radius=r,location=xyz)
    return finish(bpy.context.object,name,mat,parent)
def cylinder(name,xyz,r,d,mat,parent):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=r,depth=d,location=xyz)
    o=bpy.context.object;m=o.modifiers.new('Rounded lip','BEVEL');m.width=.015;m.segments=3
    return finish(o,name,mat,parent)
def bar(name,a,b,r,mat,parent):
    a,b=Vector(a),Vector(b);o=cylinder(name,(a+b)/2,r,(b-a).length,mat,parent)
    o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
roulette=root('casino_roulette')
cylinder('Pedestal',(0,0,.07),.58,.14,walnut,roulette)
cylinder('Golden rim',(0,0,.17),.64,.08,gold,roulette)
cylinder('Felt bed',(0,0,.22),.59,.045,teal,roulette)
cylinder('Wheel bowl',(0,0,.25),.51,.06,walnut,roulette)
for i in range(24):
    a=i*math.tau/24
    o=box('Alternating pocket',(.43*math.cos(a),.43*math.sin(a),.30),(.11,.09,.035),red if i%2 else black,roulette,.01);o.rotation_euler.z=a
    sphere('Rim rivet',(.60*math.cos(a),.60*math.sin(a),.23),.016,gold,roulette)
cylinder('Central boss',(0,0,.33),.09,.18,gold,roulette)
for i in range(4):
    a=i*math.pi/2;bar('Wheel handle',(0,0,.39),(.21*math.cos(a),.21*math.sin(a),.39),.018,gold,roulette)
sphere('Ivory ball',(.40,.22,.345),.046,ivory,roulette)
slots=root('casino_slots')
box('Foot',(0,0,.06),(.94,.62,.12),gold,slots)
box('Enamel body',(0,0,.56),(.81,.5,.96),red,slots,.07)
box('Chrome bezel',(0,-.26,.68),(.74,.065,.58),gold,slots)
box('Glass front',(0,-.305,.71),(.65,.028,.40),black,slots)
for i in range(3):
    x=(i-1)*.21
    box('Ivory reel',(x,-.33,.71),(.184,.027,.32),ivory,slots,.02)
    if i==0:
        sphere('Cherry',(x-.038,-.358,.68),.045,red,slots);sphere('Cherry',(x+.038,-.358,.68),.045,red,slots)
        bar('Cherry stalk',(x,-.36,.81),(x+.038,-.36,.72),.009,teal,slots)
    elif i==1:
        sphere('Bell',(x,-.36,.72),.065,gold,slots)
        bar('Bell foot',(x-.07,-.36,.67),(x+.07,-.36,.67),.016,gold,slots)
    else:
        bar('Seven top',(x-.05,-.36,.79),(x+.055,-.36,.79),.022,red,slots)
        bar('Seven leg',(x+.055,-.36,.79),(x-.04,-.36,.64),.022,red,slots)
box('Coin tray',(0,-.37,.22),(.56,.22,.06),gold,slots)
box('Coin slot',(0,-.273,.35),(.11,.02,.02),black,slots,.004)
for x in [-.27,0,.27]:sphere('Button',(x,-.28,.38),.036,teal,slots)
for i in range(9):sphere('Marquee bulb',((i-4)*.08,-.277,1.01+(.035 if i%2 else 0)),.027,ivory,slots)
bar('Lever',( .45,0,.47),(.48,0,.95),.028,gold,slots);sphere('Lever knob',(.48,0,.97),.071,red,slots)
shield=root('insurance_shield')
cylinder('Token base',(0,0,.055),.42,.11,gold,shield)
vertices=[(-.38,-.09,.92),(.38,-.09,.92),(.32,-.09,.43),(0,-.09,.18),(-.32,-.09,.43)]
vertices += [(x,.09,z) for x,y,z in vertices]
mesh=bpy.data.meshes.new('Shield mesh');mesh.from_pydata(vertices,[],[(0,1,2,3,4),(9,8,7,6,5)]+[(i,(i+1)%5,(i+1)%5+5,i+5) for i in range(5)]);mesh.update()
o=bpy.data.objects.new('Protective shield',mesh);scene.collection.objects.link(o);finish(o,'Protective shield',teal,shield)
for i in range(5):bar('Gold shield edge',vertices[i],vertices[(i+1)%5],.032,gold,shield)
box('House',(0,-.15,.55),(.27,.13,.25),ivory,shield)
o=box('Roof',(0,-.15,.70),(.29,.16,.07),red,shield);o.rotation_euler.y=math.pi/4
box('Door',(0,-.224,.52),(.075,.02,.14),teal,shield,.005)
karma=root('karma_scale')
cylinder('Balance foot',(0,0,.05),.38,.1,gold,karma)
bar('Pillar',(0,0,.1),(0,0,1.08),.045,gold,karma)
sphere('Finial',(0,0,1.12),.09,teal,karma)
bar('Balance arm',(-.50,0,.98),(.50,0,.98),.035,gold,karma)
for side in [-1,1]:
    for dx in [-.15,.15]:bar('Hanging chain',(side*.45,0,.96),(side*.45+dx,0,.51),.008,gold,karma)
    cylinder('Balance pan',(side*.45,0,.49),.20,.045,gold,karma)
    sphere('Sun' if side<0 else 'Moon',(side*.45,0,.62),.105,gold if side<0 else ivory,karma)
for r,x in [(roulette,-2.2),(slots,-.7),(shield,.7),(karma,2.1)]:r.location.x=x
bpy.ops.object.camera_add(location=(3.5,-7,5));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=6
cam.rotation_euler=(Vector((0,0,.4))-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam
for xyz,energy in [((-3,-4,6),650),((4,1,4),450)]:
    bpy.ops.object.light_add(type='AREA',location=xyz);o=bpy.context.object;o.data.energy=energy;o.data.size=5
    o.rotation_euler=(Vector((0,0,.4))-o.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1600;scene.render.resolution_y=900;scene.render.resolution_percentage=100
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA'
print('Four isolated detailed Fortune roots created.')
