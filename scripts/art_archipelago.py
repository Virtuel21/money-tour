"""Sculpted island dioramas and board pieces, authored in Blender via MCP."""
def tree(x,y,z,s=1,pink=False):
    cylinder('Tree trunk',(x,y,z+.22*s),.05*s,.44*s,'bark',vertices=7)
    ball('Faceted canopy',(x,y,z+.55*s),(.26*s,.23*s,.35*s),'pink' if pink else 'leaf',False,1)
    ball('Sunward canopy',(x-.05*s,y-.07*s,z+.69*s),(.20*s,.18*s,.22*s),'pink' if pink else 'leafLight',False,1)

def island(x,y):
    # Three nested polygonal shore layers give the raised miniature-island silhouette.
    n=12
    for z,h,s,mat in [(.17,.15,1.06,'foam'),(.27,.23,1,'cream'),(.41,.13,.94,'stone'),(.49,.10,.90,'grass')]:
        verts=[(x+math.cos(a*TAU/n)*1.96*s,y+math.sin(a*TAU/n)*1.67*s,z+b*h/2) for b in [-1,1] for a in range(n)]
        mesh('Twelve-sided raised island',verts,[tuple(range(n,2*n)),tuple(reversed(range(n)))]+[(a,(a+1)%n,(a+1)%n+n,a+n) for a in range(n)],mat)

def bridge(x,y,w=2.3):
    z=.51; length=w/3
    # Actual open arches: each voussoir is a solid wedge, not a painted hole.
    for k in range(3):
        cx=x+(k-1)*length
        for j in range(8):
            a=j*math.pi/8;b=(j+1)*math.pi/8
            verts=[]
            for yy in [y-.19,y+.19]:
                for radius,angle in [(.29,a),(.40,a),(.40,b),(.29,b)]:
                    verts.append((cx+math.cos(angle)*radius,yy,z+math.sin(angle)*radius))
            mesh('Bridge arch voussoir',verts,[(0,1,2,3),(7,6,5,4),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],'silver')
        cube('Bridge pier',(cx+length/2,y,.59),(.13,.40,.25),'silver',.008)
    cube('Bridge roadway',(x,y,.95),(w+.10,.49,.14),'stone',.01)
    for yy in [y-.25,y+.25]:cube('Stone parapet',(x,yy,1.07),(w+.18,.085,.17),'silver',.009)

def city_house(x,y,z=.54,s=1,wall='cream',roofmat='slate'):
    cube('City stucco facade',(x,y,z+.48*s),(.62*s,.58*s,.96*s),wall,.018)
    cube('City cornice',(x,y,z+.95*s),(.69*s,.64*s,.075*s),'ivory',.009)
    hip('City pitched roof',x,y,z+.99*s,.74*s,.67*s,.35*s,roofmat,.12)
    cube('Chimney',(x+.18*s,y+.08*s,z+1.26*s),(.12*s,.12*s,.30*s),roofmat,.008)
    for a in [-.17,.17]:
        for b in [.28,.65]:
            cube('City window frame',(x+a*s,y-.302*s,z+b*s),(.13*s,.035*s,.23*s),'ivory',.005)
            cube('City window glass',(x+a*s,y-.327*s,z+b*s),(.085*s,.018*s,.17*s),'glass',.002)
    for b in [.28,.65]:cube('Side window',(x+.317*s,y,z+b*s),(.023*s,.12*s,.19*s),'glass',.002)

def eiffel(x,y,z):
    # Four open, splayed legs with two observation decks and crossing braces.
    for sx in [-1,1]:
        for sy in [-1,1]:
            a=(x+sx*.53,y+sy*.43,z);b=(x+sx*.25,y+sy*.22,z+.89);c=(x+sx*.11,y+sy*.095,z+1.66)
            beam('Eiffel splayed leg',a,b,.18,'wood')
            beam('Eiffel upper lattice',b,c,.12,'wood')
    for zz,w,d in [(z+.81,.77,.68),(z+1.58,.40,.36)]:cube('Observation deck',(x,y,zz),(w,d,.12),'gold',.014)
    for sy in [-1,1]:
        beam('Tower diagonal brace',(x-.25,y+sy*.22,z+.9),(x+.11,y+sy*.095,z+1.56),.058,'gold')
        beam('Tower diagonal brace',(x+.25,y+sy*.22,z+.9),(x-.11,y+sy*.095,z+1.56),.058,'gold')
    hip('Eiffel tapering crown',x,y,z+1.64,.27,.24,.64,'roof',.20)
    cylinder('Eiffel antenna',(x,y,z+2.47),.027,.43,'gold',.01,8)

def clock_tower(x,y,z):
    cube('Elizabeth tower shaft',(x,y,z+.87),(.46,.46,1.74),'wood',.012)
    for sx in [-1,1]:
        for sy in [-1,1]:cube('Tower corner trim',(x+sx*.23,y+sy*.23,z+.93),(.06,.06,1.88),'gold',.004)
    cube('Clock chamber',(x,y,z+1.77),(.59,.59,.46),'gold',.014)
    for side in range(4):
        angle=side*math.pi/2
        face=cylinder('Ivory clock dial',(x+math.sin(angle)*.308,y-math.cos(angle)*.308,z+1.80),.17,.018,'ivory',vertices=24)
        face.rotation_euler=(math.pi/2,0,angle)
        # Clock hands on front and back remain legible at board scale.
        if side in [0,2]:
            yy=y+(-1 if side==0 else 1)*.324
            beam('Clock minute hand',(x,yy,z+1.8),(x,yy,z+1.92),.018,'ink')
            beam('Clock hour hand',(x,yy,z+1.8),(x+.075,yy,z+1.76),.021,'ink')
    cube('Clock roof eave',(x,y,z+2.035),(.67,.67,.09),'slate',.012)
    hip('Clock tower spire',x,y,z+2.08,.58,.58,.58,'slate',.08)
    cylinder('Golden finial',(x,y,z+2.75),.02,.28,'gold',vertices=8)

def skyscraper(x,y,z,w,d,h,mat):
    cube('Manhattan stepped tower',(x,y,z+h/2),(w,d,h),mat,.008)
    for zz in range(1,int(h/.21)):
        for sx in [-.25,.25]:cube('Lit office window',(x+sx*w,y-d/2-.009,z+zz*.21),(w*.18,.014,.09),'cream',.001)
        for sy in [-.25,.25]:cube('Side office window',(x+w/2+.009,y+sy*d,z+zz*.21),(.014,d*.18,.09),'gold',.001)
    cube('Tower setback',(x,y,z+h+.10),(w*.70,d*.70,.20),mat,.01)

def tokyo_tower(x,y,z):
    for sx in [-1,1]:
        for sy in [-1,1]:
            beam('Tokyo tower open leg',(x+sx*.42,y+sy*.36,z),(x+sx*.10,y+sy*.09,z+1.38),.13,'coralDark')
    for zz,w in [(.65,.64),(1.13,.40),(1.48,.23)]:cube('Tokyo tower deck',(x,y,z+zz),(w,w,.10),'white' if zz>1 else 'coralDark',.009)
    for sy in [-1,1]:
        beam('Tokyo cross brace',(x-.26,y+sy*.23,z+.55),(x+.10,y+sy*.09,z+1.32),.047,'coralDark')
        beam('Tokyo cross brace',(x+.26,y+sy*.23,z+.55),(x-.10,y+sy*.09,z+1.32),.047,'coralDark')
    for j in range(5):cylinder('Striped broadcast spire',(x,y,z+1.56+j*.15),.105-j*.016,.15,'white' if j%2==0 else 'coralDark',vertices=8)
    cylinder('Aerial',(x,y,z+2.36),.016,.35,'coralDark',vertices=8)

def archipelago():
    group('islands')
    for x,y in [(-3,3),(3,3),(-3,-3),(3,-3)]:island(x,y)
    # Paris, upper-left in the web camera.
    x,y=-3,3
    city_house(x-1.0,y+.3,s=.76);city_house(x+.89,y+.45,s=.82)
    eiffel(x,y,.54);bridge(x,y-1.45)
    for dx,dy in [(-1.3,-.35),(-.95,.9),(1.22,-.35),(.65,1.02)]:tree(x+dx,y+dy,.54,.75)
    # London, including a double-decker beside the clock tower.
    x,y=3,3
    clock_tower(x+.38,y+.27,.54);city_house(x-.85,y+.37,s=.85);city_house(x+1.15,y-.25,s=.55,wall='coral')
    bridge(x-.16,y-1.4)
    cube('London red bus',(x-.60,y-.65,.87),(.65,.29,.47),'coralDark',.04)
    for dx in [-.21,0,.21]:
        for dz in [.82,1.0]:cube('Bus window',(x-.6+dx,y-.803,dz),(.12,.02,.10),'ivory',.004)
    for dx in [-.21,.21]:
        o=cylinder('Bus wheel',(x-.6+dx,y-.81,.66),.07,.035,'ink',vertices=12);o.rotation_euler.x=math.pi/2
    for dx,dy in [(-1.3,.9),(1.21,.72),(.95,-.81)]:tree(x+dx,y+dy,.54,.76)
    # Manhattan art-deco skyline.
    x,y=-3,-3
    skyscraper(x-.75,y+.35,.54,.52,.51,1.70,'slate')
    skyscraper(x+.60,y+.15,.54,.56,.52,1.45,'coral')
    skyscraper(x+.1,y+.48,.54,.55,.49,2.1,'stone')
    cube('Empire State upper crown',(x+.1,y+.48,2.88),(.29,.28,.50),'cream',.009)
    cylinder('Empire State mast',(x+.1,y+.48,3.40),.025,.57,'silver',vertices=8)
    skyscraper(x-.7,y-.5,.54,.42,.40,.7,'gold');bridge(x+.13,y-1.46)
    for dx,dy in [(-1.35,.20),(-1.17,-.72),(1.21,.61),(1.11,-.63)]:tree(x+dx,y+dy,.54,.72)
    # Tokyo, Mount Fuji, sakura and brightly painted narrow buildings.
    x,y=3,-3
    hip('Mount Fuji',x+.61,y+.67,.54,1.30,1.05,1.21,'slate',0)
    hip('Fuji snow cap',x+.61,y+.67,1.34,.44,.355,.41,'ivory',0)
    tokyo_tower(x+.12,y-.23,.54)
    skyscraper(x-.92,y+.2,.54,.43,.43,1.12,'coral');skyscraper(x-1.0,y-.52,.54,.42,.43,.83,'teal')
    for dx,dy in [(-1.15,.88),(-.68,-1.0),(1.05,-.78),(1.35,.07)]:tree(x+dx,y+dy,.54,.73,True)
    # Cream plaques modeled into the islands as in the artwork.
    for name,x,y in [('PARIS',-3,3),('LONDRES',3,3),('NEW YORK',-3,-3),('TOKYO',3,-3)]:
        cube('City plaque '+name,(x,y-1.92,.56),(1.36,.39,.10),'ivory',.055)
        text_mesh(name,(x,y-1.98,.619),.20,'ink')
    # Sailing boats sit between the islands, outside the dice lane.
    for x,y,s in [(-5.45,.1,.8),(5.20,.2,.72)]:
        ball('Toy boat hull',(x,y,.20),(.38*s,.17*s,.09*s),'slate',False,1)
        cube('White deck',(x,y,.25),(.51*s,.19*s,.035),'white',.02)
        beam('Sailboat mast',(x,y,.25),(x,y,.98*s),.022,'wood')
        mesh('Ivory sail',[(x,y,.97*s),(x-.31*s,y,.35),(x,y,.35)],[(0,1,2)],'white')
        mesh('Coral jib',[(x+.035,y,.85*s),(x+.29*s,y,.35),(x+.035,y,.35)],[(0,1,2)],'coral')
    print('Four landmark islands, open bridges, trees and sailboats built.')

def board_assets():
    group('board')
    cube('Deep teal game board',(0,0,-.22),(16.65,16.65,.52),'rim',.15)
    cube('Raised turquoise rim',(0,0,.015),(16.50,16.50,.12),'teal',.13)
    cube('Inset cartoon sea',(0,0,.08),(12.52,12.52,.14),'ocean',.15)
    rng=random.Random(81)
    for i in range(64):
        x=rng.uniform(-6.1,6.1);y=rng.uniform(-6.1,6.1)
        if abs(x)<2 and abs(y)<1.6:continue
        mesh('Graphic sea ripple',[(x-.19,y,.156),(x,y+.075,.156),(x+.22,y-.02,.156),(x,y+.014,.156)],[(0,1,2,3)],'foam')
    group('tile')
    cube('Tile shadow seam',(0,0,.10),(1.75,1.75,.12),'rim',.075)
    cube('Generous ivory tile',(0,0,.18),(1.68,1.68,.14),'ivory',.055)
    group('die')
    cube('Ivory rolled die',(0,0,0),(.78,.78,.78),'white',.09)
    patterns={1:[(0,0)],2:[(-1,-1),(1,1)],3:[(-1,-1),(0,0),(1,1)],4:[(-1,-1),(-1,1),(1,-1),(1,1)],5:[(-1,-1),(-1,1),(0,0),(1,-1),(1,1)],6:[(-1,-1),(-1,0),(-1,1),(1,-1),(1,0),(1,1)]}
    normals={1:Vector((0,0,1)),2:Vector((1,0,0)),3:Vector((0,-1,0)),4:Vector((0,1,0)),5:Vector((-1,0,0)),6:Vector((0,0,-1))}
    for number,n in normals.items():
        u=n.cross(Vector((0,1,0)))
        if u.length<.01:u=n.cross(Vector((1,0,0)))
        u.normalize();v=n.cross(u)
        for a,b in patterns[number]:
            o=cylinder('Inset navy pip '+str(number),n*.389+u*a*.19+v*b*.19,.062,.013,'ink',vertices=16)
            o.rotation_euler=n.to_track_quat('Z','Y').to_euler()
    group('palm')
    cylinder('Sand island',(0,0,.045),.44,.09,'gold',vertices=12)
    beam('Palm leaning trunk',(-.11,0,.09),(.03,0,.75),.12,'wood')
    for a in range(7):
        t=a*TAU/7
        points=[(.03,0,.79),(.03+math.cos(t)*.25,math.sin(t)*.25,.95),(.03+math.cos(t)*.56,math.sin(t)*.56,.68)]
        verts=[points[0],(points[1][0]-math.sin(t)*.11,points[1][1]+math.cos(t)*.11,points[1][2]),points[2],(points[1][0]+math.sin(t)*.11,points[1][1]-math.cos(t)*.11,points[1][2]-.035)]
        mesh('Faceted palm frond',verts,[(0,1,2),(0,2,3)],'leaf' if a%2 else 'leafLight')
    group('chance')
    cube('Purple envelope',(0,0,.10),(.68,.44,.18),'violet',.035)
    mesh('Folded envelope flap',[(-.31,-.20,.20),(.31,-.20,.20),(0,.09,.225)],[(0,1,2)],'slateLight')
    star('Chance gold star',.22,.08,.29,.16)
    group('championship')
    cylinder('Trophy plinth',(0,0,.06),.24,.12,'wood',vertices=8)
    cylinder('Trophy stem',(0,0,.23),.065,.30,'gold',vertices=12)
    cylinder('Trophy cup',(0,0,.45),.12,.30,'gold',.27,16)
    for s in [-1,1]:ring('Trophy handle',(s*.24,0,.43),.15,.17,.04,'gold',steps=16)
    group('tax')
    cube('Bank podium',(0,0,.06),(.72,.55,.12),'stone')
    for x in [-.25,0,.25]:cylinder('Bank column',(x,-.15,.30),.052,.38,'ivory',vertices=12)
    hip('Bank pediment',0,0,.51,.82,.62,.22,'slate',0)
    group('travel')
    cube('Airplane fuselage',(0,0,.20),(.16,.85,.13),'slate',.06)
    mesh('Aircraft wings',[(-.53,-.08,.22),(-.1,.16,.22),(.1,.16,.22),(.53,-.08,.22),(.10,-.04,.22),(-.10,-.04,.22)],[(0,1,2,3,4,5)],'slate')
    cube('Aircraft tailplane',(0,.3,.21),(.42,.16,.05),'gold',.01)
    group('start')
    cylinder('Departure compass base',(0,0,.05),.40,.10,'gold',vertices=24)
    mesh('Nautical compass',[(-.12,-.12,.13),(0,-.43,.13),(.12,-.12,.13),(.43,0,.13),(.12,.12,.13),(0,.43,.13),(-.12,.12,.13),(-.43,0,.13)],[(0,1,2,3,4,5,6,7)],'slate')
    print('Board is 16.65 units across; 1.68-unit tiles and all special icons modeled.')

def garden_plot():
    group('plot')
    cube('Garden limestone border',(0,0,.022),(.95,.59,.044),'stone',.04)
    cube('Empty garden parcel',(0,0,.047),(.87,.51,.036),'grass',.035)
    for y in [-.18,-.05,.08]:cube('Garden stepping stone',(0,y,.075),(.14,.085,.02),'ivory',.013)
    for x in [-.35,.35]:
        for y in [-.15,.15]:ball('Parcel corner shrub',(x,y,.11),(.075,.070,.10),'leafLight',False,1)

def star(name,x,y,z,r):
    verts=[(x+math.cos(math.pi/2+j*math.pi/5)*(r if j%2==0 else r*.45),y+math.sin(math.pi/2+j*math.pi/5)*(r if j%2==0 else r*.45),z) for j in range(10)]
    return mesh(name,verts,[tuple(range(10))],'gold')
