"""Detailed, editable special pieces; run after art_archipelago.py in the same namespace."""
def special_assets():
    # Replacing generated roots leaves the earlier artwork studies available in the .blend.
    for name in ['travel','championship','palm']:
        if name in roots: roots[name].name='Archive / '+name
    material('trophyMetal','FFD66B',.24,.65)
    material('goldShadow','C88B24',.32,.45)
    group('travel')
    ball('Sculpted ivory fuselage',(0,0,.30),(.16,.68,.16),'white',True)
    ball('Teal belly fairing',(0,.025,.235),(.145,.56,.105),'teal',True)
    ball('Panoramic cockpit glazing',(0,-.49,.365),(.135,.14,.075),'glass',True)
    for side in [-1,1]:
        for j in range(7):
            ball('Cabin window',(side*.151,-.29+j*.082,.35),(.009,.024,.025),'glass',True)
        cube('Boarding door',(side*.158,-.355,.30),(.012,.045,.085),'stone',.008)
        tube('Golden livery stripe',[(side*.143,-.35,.285),(side*.16,0,.285),(side*.12,.4,.285)],.014,'gold',8)
        # Swept wings with thickness, raised tips and flaps.
        verts=[(side*.10,-.10,.28),(side*.73,.20,.27),(side*.72,.36,.27),(side*.10,.13,.28)]
        verts += [(x,y,z-.045) for x,y,z in verts]
        mesh('Swept wing',verts,[(0,1,2,3),(7,6,5,4),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],'white')
        beam('Trailing edge flap',(side*.25,.18,.283),(side*.65,.32,.283),.014,'slate')
        mesh('Teal upturned winglet',[(side*.70,.20,.27),(side*.78,.23,.43),(side*.76,.36,.43),(side*.71,.36,.27)],[(0,1,2,3)],'teal')
        nacelle=ball('Rounded engine nacelle',(side*.36,.03,.16),(.085,.20,.085),'white',True)
        intake=cylinder('Dark engine intake',(side*.36,-.163,.16),.064,.018,'ink',vertices=24)
        intake.rotation_euler.x=math.pi/2
        hub=ball('Turbine spinner',(side*.36,-.18,.16),(.022,.026,.022),'silver',True)
        for j in range(8):
            a=j*TAU/8
            beam('Turbine blade',(side*.36+math.cos(a)*.028,-.177,.16+math.sin(a)*.028),(side*.36+math.cos(a+.25)*.055,-.177,.16+math.sin(a+.25)*.055),.008,'silver')
        mesh('Tail stabilizer',[(0,.42,.33),(side*.31,.54,.32),(side*.29,.64,.32),(0,.58,.33)],[(0,1,2,3)],'teal')
        ball('Navigation light',(side*.748,.28,.42),(.02,.025,.018),'coral' if side<0 else 'leafLight',True)
    mesh('Coral vertical tail fin',[(-.018,.29,.40),(-.018,.54,.70),(-.018,.66,.68),(-.018,.61,.32),(.018,.29,.40),(.018,.54,.70),(.018,.66,.68),(.018,.61,.32)],[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3)],'roof')
    cube('Tail gold insignia',(0,.53,.54),(.042,.08,.055),'gold',.012)

    group('championship')
    cube('Beveled dark marble plinth',(0,0,.075),(.57,.43,.15),'ink',.035)
    cube('Gold plinth molding',(0,0,.16),(.51,.38,.045),'trophyMetal',.016)
    cube('Engraved ivory award plaque',(0,-.222,.084),(.26,.015,.065),'ivory',.007)
    for x in [-.10,.10]:ball('Plaque rivet',(x,-.235,.084),(.009,.006,.009),'gold',True)
    cylinder('Fluted foot',(0,0,.22),.17,.085,'trophyMetal',.095,32)
    cylinder('Stem',(0,0,.33),.055,.19,'trophyMetal',vertices=32)
    ball('Stem collar',(0,0,.4),(.09,.09,.06),'goldShadow',True)
    # Revolved outer and inner profile creates a real hollow bowl and rolled rim.
    profile=[(.065,.39),(.12,.43),(.20,.51),(.255,.62),(.29,.77),(.292,.81),(.275,.824),(.26,.80),(.25,.68),(.18,.53),(.09,.46)]
    verts=[(r*math.cos(j*TAU/48),r*math.sin(j*TAU/48),z) for r,z in profile for j in range(48)]
    faces=[(i*48+j,i*48+(j+1)%48,(i+1)*48+(j+1)%48,(i+1)*48+j) for i in range(len(profile)-1) for j in range(48)]
    bowl=mesh('Hollow polished bowl',verts,faces,'trophyMetal')
    for poly in bowl.data.polygons:poly.use_smooth=True
    for side in [-1,1]:
        tube('Swept trophy handle',[(side*.24,0,.75),(side*.40,0,.80),(side*.45,0,.67),(side*.40,0,.51),(side*.25,0,.49)],.032,'trophyMetal',12)
        for j in range(6):
            a=.25+j*.20;x=side*(.12+math.sin(a)*.08);z=.50+j*.036
            leaf=ball('Laurel engraving',(x,-.235,z),(.022,.012,.044),'goldShadow',True)
            leaf.rotation_euler.y=side*.5
    mesh('Embossed award star',[(math.cos(math.pi/2+j*math.pi/5)*(.085 if j%2==0 else .037),-.267,.66+math.sin(math.pi/2+j*math.pi/5)*(.085 if j%2==0 else .037)) for j in range(10)],[tuple(range(10))],'ivory')

    group('palm')
    cylinder('Turquoise lagoon',(0,0,.025),.57,.05,'ocean',vertices=40)
    cylinder('Ivory shoreline',(0,0,.065),.49,.055,'ivory',.46,32)
    ball('Warm sand dune',(0,0,.09),(.43,.37,.09),'stone',True)
    points=[(-.15,0,.12),(-.11,.01,.32),(-.06,.02,.53),(.02,.015,.74),(.09,0,.96),(.13,0,1.12)]
    tube('Curving palm trunk',points,.055,'wood',10)
    for j in range(13):
        z=.16+j*.071;x=-.15+(z-.12)*.29
        cylinder('Trunk growth ring',(x,0,z),.062-j*.001,.022,'bark',vertices=12)
    crown=Vector((.13,0,1.13))
    for j in range(9):
        a=j*TAU/9;direction=Vector((math.cos(a),math.sin(a),0));across=Vector((-math.sin(a),math.cos(a),0))
        spine=[]
        for k in range(9):
            u=k/8;p=crown+direction*(u*.64)+Vector((0,0,math.sin(u*math.pi)*.20-u*.19));spine.append(tuple(p))
        tube('Arched frond rib',spine,.012,'leafDark',6)
        for side in [-1,1]:
            leafverts=[]
            for k in range(9):
                u=k/8;base=Vector(spine[k]);w=.145*math.sin(u*math.pi)**.6
                leafverts.extend([tuple(base+Vector((0,0,.008))),tuple(base+across*(side*w)+Vector((0,0,-.035)))])
            mesh('Broad sculpted frond',leafverts,[(k*2,k*2+1,k*2+3,k*2+2) for k in range(8)],'leafLight' if side>0 else 'leaf')
        for k in range(1,8):
            u=k/8;base=Vector(spine[k]);w=.13*math.sin(u*math.pi)+.02
            for side in [-1,1]:
                end=base+across*(side*w)-direction*.09+Vector((0,0,-.06))
                mesh('Tapered palm leaflet',[tuple(base-direction*.033),tuple(base+direction*.028),tuple(end)],[(0,1,2)],'leafLight' if (j+k)%3==0 else 'leaf')
    for dx,dy in [(-.07,-.05),(.055,-.05),(0,.07)]:ball('Coconut',(crown.x+dx,dy,1.06),(.058,.053,.068),'bark',True)
    for x,y,r in [(-.3,-.17,.085),(.28,.12,.07),(.30,-.19,.045)]:ball('Shore rock',(x,y,.14),(r,r*.7,r*.6),'cream',False,2)
    tube('Lagoon foam crescent',[(math.cos(a)*.48,math.sin(a)*.48,.097) for a in [3.5+j*.12 for j in range(12)]],.009,'foam',6)
    print('Detailed jet, hollow trophy and segmented tropical palm are ready.')

def special_gallery():
    gallery=bpy.data.scenes.new('04 · Detailed travel pieces')
    collection=bpy.data.collections.new('Jet, gold cup and tropical island')
    gallery.collection.children.link(collection)
    for i,n in enumerate(['travel','championship','palm']):duplicate_model(n,collection,((i-1)*2.2,0,0))
    studio(gallery,(0,0,.45),(3,-7,5),7,(1500,850))
    bpy.context.window.scene=gallery
    for area in bpy.context.screen.areas:
        if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA'
    bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
