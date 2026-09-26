"""Original Money Tour model library. Run with Blender --background --python scripts/models.py.
Blender coordinates Z up; glTF exports Y up. Model roots intentionally overlap for instancing.
"""
import bpy, math, os
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'apps/web/public/models')
os.makedirs(OUT, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def mat(name, color):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*(c ** 2.2 for c in color), 1)
    p.inputs['Roughness'].default_value = .76
    return m

cream=mat('warm stucco',(.94,.84,.62)); white=mat('ivory',(.99,.97,.86))
ink=mat('navy',(.025,.105,.16)); teal=mat('teal',(.035,.49,.49))
red=mat('terracotta',(.94,.24,.085)); blue=mat('slate',(.065,.22,.39))
gold=mat('gold',(.98,.65,.12)); green=mat('leaves',(.27,.58,.18))
skin=mat('skin',(.93,.55,.30)); hair=mat('auburn',(.40,.105,.045))
brown=mat('curls',(.11,.055,.035)); glass=mat('windows',(.07,.30,.40))
pink=mat('hotel coral',(.91,.39,.25))
player_mats=[mat('player_'+str(i),c) for i,c in enumerate([(.025,.61,.73),(.94,.25,.20),(.94,.65,.10),(.30,.62,.36)])]
root=None
def group(name):
    global root
    root=bpy.data.objects.new(name,None); bpy.context.collection.objects.link(root)
    return root
def finish(o,name,material):
    o.name=name; o.data.materials.append(material); o.parent=root
    return o
def cube(name,loc,scale,material,bevel=.035):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object
    o.scale=scale; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        b=o.modifiers.new('soft toy edges','BEVEL');b.width=bevel;b.segments=2
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=b.name)
        o.modifiers.new('weighted normals','WEIGHTED_NORMAL')
    return finish(o,name,material)
def ball(name,loc,scale,material,sub=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub,radius=1,location=loc)
    o=bpy.context.object;o.scale=scale
    return finish(o,name,material)
def cylinder(name,loc,radius,depth,material,vertices=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc)
    return finish(bpy.context.object,name,material)
def cone(name,loc,r1,r2,depth,material,vertices=4):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r1,radius2=r2,depth=depth,location=loc,rotation=(0,0,math.pi/4))
    return finish(bpy.context.object,name,material)
def roof(x,y,z,w,d,h,material):
    o=cone('roof',(x,y,z),1,0,h,material);o.scale=(w/math.sqrt(2),d/math.sqrt(2),1)
def tree(x,y,s=1):
    cylinder('trunk',(x,y,.2*s),.045*s,.4*s,brown,6)
    ball('tree crown',(x,y,.52*s),(.23*s,.23*s,.38*s),green)

group('board')
cube('board plinth',(0,0,-.22),(9.5,9.5,.48),teal,.18)
cube('ocean inset',(0,0,.005),(7.05,7.05,.09),teal,.10)
group('tile')
cube('tile',(0,0,.09),(.94,.94,.18),cream,.045)
group('house')
cube('foundation',(0,0,.025),(.59,.53,.05),cream)
cube('walls',(0,0,.31),(.50,.44,.56),white)
roof(0,0,.69,.67,.60,.30,red)
cube('chimney',(.14,.05,.78),(.10,.10,.26),cream,.012)
cube('door',(0,-.227,.18),(.12,.025,.29),brown,.02)
for x in [-.15,.15]:
    cube('window',(x,-.229,.43),(.10,.025,.13),glass,.008)
    cube('shutters',(x,-.24,.43),(.15,.016,.12),teal,.004)
    cube('glass',(x,-.252,.43),(.075,.012,.10),glass,.004)
group('hotel')
cube('base',(0,0,.04),(.74,.65,.08),cream)
cube('hotel walls',(0,0,.48),(.65,.55,.88),pink)
roof(0,0,1.05,.81,.71,.37,blue)
for z in [.35,.69]:
    cube('cornice',(0,0,z+.12),(.69,.59,.04),cream,.009)
    for x in [-.20,0,.20]:cube('hotel window',(x,-.285,z),(.105,.022,.15),glass,.018)
cube('entrance',(0,-.29,.15),(.16,.035,.24),ink)
o=cylinder('awning',(0,-.34,.32),.15,.35,gold);o.rotation_euler[1]=math.pi/2
cube('chimney',(.21,.09,1.15),(.13,.12,.27),red)

for i in range(4):
    group('pawn_'+str(i))
    cylinder('player base',(0,0,.04),.29,.08,player_mats[i],24)
    for x in [-.085,.085]:
        cube('shoe',(x,-.045,.13),(.15,.25,.13),white)
        cube('trouser',(x,0,.29),(.14,.16,.26),gold if i%2==0 else blue)
    cube('jacket',(0,0,.51),(.34,.24,.32),player_mats[i],.07)
    cube('shirt',(0,-.128,.53),(.13,.022,.26),white,.005)
    for x in [-.23,.23]:
        arm=cube('sleeve',(x,0,.48),(.13,.17,.29),player_mats[i],.035)
        arm.rotation_euler[1]=-.25 if x<0 else .25
        ball('hand',(x*1.10,-.01,.34),(.075,.07,.09),skin,2)
    ball('head',(0,0,.86),(.26,.22,.28),skin,2)
    ball('hair back',(0,.08,.93),(.285,.23,.27),hair if i%2==0 else brown,2)
    for x in [-.18,-.06,.06,.18]:
        ball('hair fringe',(x,-.09,1.04),(.11,.14,.12),hair if i%2==0 else brown,1)
    for x in [-.105,.105]:
        ball('eye white',(x,-.204,.89),(.080,.030,.10),white,2)
        ball('pupil',(x,-.235,.89),(.036,.016,.057),ink,2)
        ball('eye shine',(x-.010,-.251,.915),(.011,.006,.018),white,1)
        if i%2==0:
            bpy.ops.mesh.primitive_torus_add(major_segments=12,minor_segments=5,location=(x,-.247,.89),major_radius=.089,minor_radius=.010,rotation=(math.pi/2,0,0))
            finish(bpy.context.object,'glasses',brown)
    ball('nose',(0,-.235,.82),(.055,.055,.055),skin,2)
    cube('smile',(0,-.216,.75),(.105,.021,.025),brown,.01)
    if i%2: cube('backpack',(0,.17,.53),(.28,.14,.31),green,.055)

group('die')
cube('rounded ivory dice',(0,0,0),(.64,.64,.64),white,.065)
# Opposite faces sum to seven. Runtime quaternion chooses the correct upward face.
dots={1:[(0,0)],2:[(-1,-1),(1,1)],3:[(-1,-1),(0,0),(1,1)],4:[(-1,-1),(-1,1),(1,-1),(1,1)],5:[(-1,-1),(-1,1),(0,0),(1,-1),(1,1)],6:[(-1,-1),(-1,0),(-1,1),(1,-1),(1,0),(1,1)]}
for n,(normal,u,v) in enumerate([((0,0,1),(1,0,0),(0,1,0)),((1,0,0),(0,1,0),(0,0,1)),((0,-1,0),(1,0,0),(0,0,1)),((0,1,0),(1,0,0),(0,0,1)),((-1,0,0),(0,1,0),(0,0,1)),((0,0,-1),(1,0,0),(0,1,0))],1):
    for a,b in dots[n]:
        p=Vector(normal)*.318+Vector(u)*a*.14+Vector(v)*b*.14
        o=cylinder('pip',p,.042,.012,ink,12)
        o.rotation_euler=Vector(normal).to_track_quat('Z','Y').to_euler()

group('islands')
for k,(x,y) in enumerate([(-1.65,-1.65),(1.65,-1.65),(-1.65,1.55),(1.65,1.55)]):
    o=cylinder('island',(x,y,.02),.97,.19,cream,9);o.scale.y=.78
    for dx,dy in [(-.57,.15),(.57,.22),(.42,-.38)]: tree(x+dx,y+dy,.85)
    for j in range(3):
        xx=x-.30+j*.29;yy=y+.28
        h=.35+j*.13
        cube('city house',(xx,yy,.1+h/2),(.25,.30,h),[white,pink,cream][j])
        roof(xx,yy,.1+h+.10,.31,.36,.21,blue)
        cube('city window',(xx,yy-.155,.20+h/2),(.09,.012,.11),glass,.002)
    if k==0:
        cone('tower',(x,y-.25,.66),.31,.09,1.05,gold)
        cube('tower deck',(x,y-.25,.67),(.38,.30,.05),cream)
        cone('spire',(x,y-.25,1.38),.08,0,.50,gold)
    elif k==1:
        cube('clock tower',(x,y-.23,.65),(.35,.35,1.1),cream)
        roof(x,y-.23,1.32,.44,.44,.35,blue)
        o=cylinder('clock',(x,y-.415,1.03),.115,.012,white,16);o.rotation_euler[0]=math.pi/2
        cube('clock hand',(x,y-.427,1.045),(.02,.01,.10),ink,.002)
    elif k==2:
        for j in range(3):cube('skyscraper',(x-.3+j*.28,y-.22,.45+j*.16),(.22,.27,.70+j*.32),[blue,teal,pink][j])
    else:
        cone('pagoda tower',(x,y-.25,.70),.16,.075,1.2,red,8)
        for z in [.40,.73,1.05]:roof(x,y-.25,z,.53-z*.18,.53-z*.18,.16,red)

group('palm')
cylinder('palm trunk',(0,0,.25),.06,.5,brown,7)
for a in range(6):
    angle=a*math.tau/6
    o=ball('palm leaf',(.17*math.cos(angle),.17*math.sin(angle),.57),(.29,.08,.065),green)
    o.rotation_euler[2]=angle

bpy.ops.object.select_all(action='SELECT')
blend_path = os.environ.get('MONEY_TOUR_BLEND_OUT', os.path.join(ROOT, 'artifacts/money-tour-models.blend'))
os.makedirs(os.path.dirname(blend_path), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'money-tour.glb'),export_format='GLB',use_selection=True,export_apply=True)
print('MONEY TOUR MODELS EXPORTED')
