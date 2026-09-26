"""Money Tour artwork study. Executed in the live Blender MCP, in a NEW scene.

No existing user scene is deleted. Z-up source; front is -Y. Runtime roots are
exported at the origin, while the saved .blend also contains an assembled board.
Build in stages: setup(), buildings(), characters(), archipelago(), board_assets(),
export_library(), presentation(). See docs/MODELS.md for reproducible commands.
"""
import bpy, math, os, random
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAU = math.tau
root = None
roots = {}
materials = {}

def enum(owner, prop, value):
    choices = [i.identifier for i in owner.bl_rna.properties[prop].enum_items]
    if value not in choices:
        raise ValueError((prop, value, choices))
    setattr(owner, prop, value)

def material(name, hexcolor, roughness=.72, metal=0):
    m = bpy.data.materials.new('MT / ' + name)
    c = tuple(int(hexcolor[i:i+2], 16)/255 for i in (0,2,4))
    linear = tuple(v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in c)
    m.diffuse_color = (*linear, 1)
    m.use_nodes = True
    p = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value = (*linear, 1)
    p.inputs['Roughness'].default_value = roughness
    p.inputs['Metallic'].default_value = metal
    materials[name] = m
    return m

def setup():
    global scene, library
    scene = bpy.data.scenes.new('Money Tour · Artwork edition')
    bpy.context.window.scene = scene
    library = bpy.data.collections.new('01 · Model library')
    scene.collection.children.link(library)
    colors = dict(cream='F3DFB4', ivory='FFF4D8', stone='D8BB8D', white='FFF9EB',
        ink='12384A', ocean='30C8D0', foam='8CE6DD', teal='087F89', rim='08616C',
        roof='F06431', roofLight='FF8041', roofDark='C94B28', slate='315C86',
        slateLight='49749B', coral='F38367', coralDark='DC634D', shutter='369C8B',
        glass='214C67', glassLight='5E95AD', wood='985D2C', gold='FFC346',
        grass='9CBF59', leaf='5D9C32', leafLight='8BC345', leafDark='3C792F',
        bark='775639', skin='F5AF78', blush='EA8558', hair='A34125', hairLight='C5502C',
        hairDark='743326', curl='49322D', beard='74503B', pants='DF9D32', navy='345375',
        olive='6C713A', violet='956CC9', pink='F58FA1', silver='BBC4BE', black='201F27',
        player0='1DB7C5', player1='F16B52', player2='F6BD3F', player3='60AF83')
    for n,c in colors.items(): material(n,c,.48 if n in ('gold','glass') else .75)
    print('New scene ready. Original scene preserved:', [s.name for s in bpy.data.scenes])

def group(name):
    global root
    root = bpy.data.objects.new(name, None)
    library.objects.link(root)
    roots[name] = root
    return root

def finish(o, name, mat):
    o.name = name
    for c in list(o.users_collection): c.objects.unlink(o)
    library.objects.link(o)
    o.parent = root
    if mat: o.data.materials.append(materials[mat] if isinstance(mat,str) else mat)
    return o

def mesh(name, vertices, faces, mat):
    m = bpy.data.meshes.new(name)
    m.from_pydata(vertices, [], faces); m.update()
    o = bpy.data.objects.new(name, m); library.objects.link(o)
    return finish(o,name,mat)

def cube(name, loc, size, mat, bevel=.015):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object; o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        b=o.modifiers.new('Hand softened edges','BEVEL'); b.width=bevel; b.segments=2
        bpy.ops.object.modifier_apply(modifier=b.name)
    return finish(o,name,mat)

def ball(name, loc, size, mat, smooth=False, sub=2):
    if smooth:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=1, location=loc)
    else:
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=1, location=loc)
    o=bpy.context.object; o.scale=size
    if smooth:
        for p in o.data.polygons: p.use_smooth=True
    return finish(o,name,mat)

def cylinder(name, loc, r, h, mat, r2=None, vertices=16):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r,radius2=r if r2 is None else r2,depth=h,location=loc)
    return finish(bpy.context.object,name,mat)

def beam(name, a, b, width, mat, depth=None):
    a,b=Vector(a),Vector(b)
    o=cube(name,(a+b)/2,(width,depth or width,(b-a).length),mat,min(.015,width*.12))
    o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
    return o

def tube(name, points, radius, mat, sides=6, closed=False):
    verts=[]; faces=[]; pts=[Vector(p) for p in points]
    for i,p in enumerate(pts):
        tangent=(pts[(i+1)%len(pts)]-pts[i-1 if i else (-1 if closed else 0)]).normalized()
        if tangent.length < .01: tangent=Vector((1,0,0))
        u=tangent.cross(Vector((0,1,0)))
        if u.length<.01: u=tangent.cross(Vector((1,0,0)))
        u.normalize();v=tangent.cross(u)
        verts.extend([tuple(p+radius*(u*math.cos(j*TAU/sides)+v*math.sin(j*TAU/sides))) for j in range(sides)])
    for i in range(len(pts) if closed else len(pts)-1):
        for j in range(sides):faces.append((i*sides+j,i*sides+(j+1)%sides,((i+1)%len(pts))*sides+(j+1)%sides,((i+1)%len(pts))*sides+j))
    return mesh(name,verts,faces,mat)

def ring(name, center, rx, rz, thick, mat, start=0, end=TAU, steps=24):
    x,y,z=center
    return tube(name,[(x+rx*math.cos(start+(end-start)*i/steps),y,z+rz*math.sin(start+(end-start)*i/steps)) for i in range(steps+1)],thick,mat)

def hip(name,x,y,z,w,d,h,mat='roof',top=.02):
    verts=[(x+a*w/2,y+b*d/2,z) for a,b in [(-1,-1),(1,-1),(1,1),(-1,1)]]
    verts += [(x+a*w*top/2,y+b*d*top/2,z+h) for a,b in [(-1,-1),(1,-1),(1,1),(-1,1)]]
    o=mesh(name,verts,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],mat)
    o.data.materials.append(materials['roofLight' if mat=='roof' else 'slateLight'])
    o.data.polygons[2].material_index=1
    return o

def arch_panel(name,x,y,z,w,h,depth,mat):
    r=w/2; spring=z+h-r
    outline=[(x-r,z),(x+r,z)]+[(x+r*math.cos(t*math.pi/12),spring+r*math.sin(t*math.pi/12)) for t in range(13)]
    verts=[(a,y+b,c) for b in [-depth/2,depth/2] for a,c in outline];n=len(outline)
    faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    return mesh(name,verts,faces,mat)

def window(x,y,z,w=.2,h=.28,shutters=False,arched=False,flowers=False):
    if arched:
        arch_panel('Cut stone arched surround',x,y,z,w+.07,h+.055,.045,'ivory')
        arch_panel('Recessed blue glazing',x,y-.028,z+.025,w,h,.016,'glass')
    else:
        cube('Window limestone surround',(x,y,z+h/2),(w+.065,.04,h+.055),'stone',.007)
        cube('Recessed blue glazing',(x,y-.028,z+h/2),(w,.016,h),'glass',.002)
    cube('Window mullion',(x,y-.047,z+h*.48),(.018,.016,h*.87),'cream',.002)
    cube('Window transom',(x,y-.047,z+h*.5),(w,.016,.018),'cream',.002)
    if shutters:
        for s in [-1,1]:
            cube('Painted timber shutter',(x+s*(w*.72),y-.023,z+h/2),(w*.40,.045,h),'shutter',.007)
            for dz in [-.065,.055]:cube('Shutter rail',(x+s*w*.72,y-.05,z+h/2+dz),(w*.38,.012,.014),'teal',.002)
    cube('Stone window sill',(x,y-.04,z),(w+.08,.095,.035),'cream',.005)
    if flowers:
        cube('Terracotta window box',(x,y-.11,z-.022),(w+.09,.12,.10),'wood',.009)
        cube('Planter leaves',(x,y-.12,z+.034),(w+.075,.13,.08),'leaf',.02)
        for dx in [-.065,0,.065]:ball('Ivory flowers',(x+dx,y-.14,z+.081),(.035,.026,.025),'white',False,1)

def planter(x,y,z=0,s=1):
    cylinder('Terracotta pot',(x,y,z+.09*s),.09*s,.18*s,'roof',.13*s,8)
    ball('Clipped shrub',(x,y,z+.29*s),(.15*s,.13*s,.22*s),'leaf',False,1)
    ball('Sunlit foliage',(x-.03*s,y-.035*s,z+.38*s),(.10*s,.10*s,.13*s),'leafLight',False,1)

def buildings():
    group('house')
    cube('Limestone plinth',(0,0,.055),(.90,.76,.11),'stone')
    cube('Warm plaster walls',(0,0,.56),(.78,.64,1.02),'cream',.022)
    for x in [-.35,.35]:cube('Corner stonework',(x,-.327,.16),(.085,.05,.20),'stone',.006)
    cube('Front step',(0,-.43,.04),(.34,.23,.08),'stone')
    arch_panel('Arched door surround',0,-.338,.1,.30,.49,.055,'stone')
    arch_panel('Oak front door',0,-.373,.1,.235,.44,.025,'wood')
    for x in [-.06,0,.06]:cube('Door planks',(x,-.39,.27),(.009,.012,.32),'brown' if 'brown' in materials else 'bark',.001)
    ball('Brass knob',(.075,-.413,.29),(.023,.020,.023),'gold',True)
    window(0,-.34,.70,.22,.24,True,False,True)
    # Side and rear windows are fully modeled, not textures.
    before=set(library.objects);window(0,-.34,.37,.18,.25,True)
    for o in set(library.objects)-before:
        o.location=Vector((.07,.0,0))+Vector((-o.location.y,o.location.x,o.location.z))
        o.rotation_euler.z=math.pi/2
    cube('Eaves',(0,0,1.07),(.96,.84,.085),'roofDark')
    hip('Four sloping terracotta roof planes',0,0,1.1,.98,.88,.39)
    cube('Chimney shaft',(.25,.14,1.47),(.14,.14,.40),'cream',.01)
    cube('Chimney cap',(.25,.14,1.68),(.20,.20,.085),'roofDark',.009)
    cube('Chimney flue',(.25,.14,1.725),(.105,.105,.009),'ink',.001)
    planter(-.46,-.25,0,.7);planter(.46,-.24,0,.7)
    cube('Lantern bracket',(-.25,-.38,.56),(.08,.10,.04),'ink',.008)
    cube('Lantern glowing panes',(-.25,-.43,.45),(.075,.075,.12),'gold',.006)
    hip('Lantern cap',-.25,-.43,.51,.11,.11,.055,'slate')
    group('hotel')
    cube('Hotel limestone plinth',(0,0,.06),(1.13,.87,.12),'stone')
    cube('Coral hotel facade',(0,0,.73),(1.02,.76,1.36),'coral',.022)
    for x in [-.46,.46]:cube('Cream corner pilaster',(x,-.39,.76),(.105,.05,1.4),'cream',.005)
    cube('Cornice',(0,0,1.43),(1.16,.88,.10),'ivory')
    hip('Mansard slate roof',0,0,1.48,1.17,.89,.48,'slate',.68)
    hip('Mansard crown',0,0,1.96,.80,.61,.13,'slate',.05)
    for x in [-.26,.26]:
        window(x,-.398,.88,.20,.35,False,True,True)
        cube('Dormer cheek',(x,-.32,1.69),(.30,.30,.25),'slate',.012)
        arch_panel('Dormer stone front',x,-.483,1.53,.28,.39,.075,'ivory')
        window(x,-.53,1.56,.16,.28,False,True)
    for s in [-1,1]:
        before=set(library.objects);window(0,-.395,.55,.2,.4,False,True,True)
        for o in set(library.objects)-before:
            o.location=Vector((-s*o.location.y,s*o.location.x,o.location.z));o.location.x+=s*.14;o.rotation_euler.z=s*math.pi/2
    cube('Entrance surround',(0,-.40,.35),(.45,.06,.56),'cream',.018)
    cube('Double entrance doors',(0,-.442,.34),(.35,.035,.51),'ink',.008)
    for x in [-.065,.065]:
        cube('Door glass',(x,-.465,.40),(.11,.018,.24),'glassLight',.003)
        ball('Brass handle',(x,-.49,.25),(.018,.024,.045),'gold',True)
    cube('Hotel step',(0,-.50,.045),(.57,.24,.09),'stone')
    # Faceted half dome canopy.
    verts=[(0,-.42,.66)]
    for a in range(9):
        angle=math.pi*a/8
        verts.append((.31*math.cos(angle),-.42-.29*math.sin(angle),.66))
    verts.append((0,-.42,.89))
    mesh('Golden entrance canopy',verts,[(i,i+1,10) for i in range(1,9)],'gold')
    cube('Hotel sign',(0,-.462,.99),(.60,.06,.18),'cream',.022)
    text_mesh('HÔTEL',(0,-.497,.955),.108,'wood',front=True)
    cube('Hotel chimney',(.33,.10,2.0),(.17,.16,.34),'coralDark')
    cube('Hotel chimney coping',(.33,.1,2.18),(.23,.22,.075),'roofDark')
    cube('Hotel chimney opening',(.33,.1,2.221),(.12,.115,.01),'ink',.002)
    planter(-.51,-.37,0,.85);planter(.51,-.37,0,.85)
    print('House and hotel built with shutters, dormers, window boxes and entrances.')

def text_mesh(text,loc,size,mat,front=False):
    c=bpy.data.curves.new(text,'FONT');c.body=text;c.size=size;c.extrude=.001
    # Query supported alignment identifier before assigning.
    enum(c,'align_x','CENTER')
    o=bpy.data.objects.new(text,c);library.objects.link(o);o.location=loc
    if front:o.rotation_euler.x=math.pi/2
    finish(o,text,mat)
    bpy.context.view_layer.objects.active=o;o.select_set(True)
    deps=bpy.context.evaluated_depsgraph_get();m=bpy.data.meshes.new_from_object(o.evaluated_get(deps))
    result=bpy.data.objects.new(text,m);library.objects.link(result)
    result.matrix_world=o.matrix_world.copy();result.parent=root
    bpy.data.objects.remove(o,do_unlink=True)
    return result
