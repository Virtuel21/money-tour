"""Character construction, executed in art_models' shared Blender namespace."""
def characters():
    for i in range(4):
        group('pawn_'+str(i))
        female=i%2==0
        jacket=['teal','coralDark','gold','leafDark'][i]
        pants='pants' if female else 'navy'
        # Bases carry ownership, clothes retain the reference art palette.
        cylinder('Player enamel pedestal',(0,0,.055),.36,.11,'player'+str(i),vertices=32)
        cylinder('Ivory pedestal rim',(0,0,.111),.325,.016,'ivory',vertices=32)
        for s in [-1,1]:
            x=s*(.145 if female else .17)
            cube('Rubber sneaker sole',(x,-.055,.165),(.25,.39,.095),'ivory',.035)
            cube('Sneaker upper',(x,-.045,.217),(.215,.31,.13),'white',.045)
            cube('Shoe color panel',(x,-.020,.245),(.22,.11,.055),jacket,.015)
            for dy in [-.095,-.135]:cube('Shoe lace',(x,dy,.271),(.13,.018,.012),'ivory',.003)
            leg=beam('Tailored trouser',(x,0,.27),(x*.78,0,.69),.21,pants,.25)
            cube('Rolled trouser cuff',(x,0,.31),(.237,.27,.09),'pants' if female else 'slateLight',.015)
        ball('Torso',(0,0,.83),(.31 if female else .38,.23,.32),jacket,False,2)
        cube('Ivory blouse',(0,-.203,.845),(.27,.055,.42),'ivory',.025)
        # Open jacket has two tailored halves and triangular lapels.
        for s in [-1,1]:
            cube('Jacket front',(s*.21,-.163,.835),(.15,.09,.47),jacket,.025)
            mesh('Folded jacket lapel',[(s*.07,-.259,1.025),(s*.20,-.242,1.12),(s*.225,-.251,.88)],[(0,1,2)],jacket)
            shoulder=(s*(.29 if female else .36),0,1.01)
            elbow=(s*(.40 if female else .46),-.035,.83)
            wrist=(s*(.43 if female else .50),-.10,.68)
            tube('Continuous tailored sleeve',[shoulder,elbow,wrist],.12,jacket,8)
            cube('Sleeve cuff',(wrist[0],wrist[1],wrist[2]+.035),(.18,.21,.08),'shutter' if female else 'coral',.017)
            ball('Hand',(wrist[0],-.11,.60),(.095,.088,.13),'skin',True)
            ball('Thumb',(wrist[0]-s*.074,-.16,.62),(.045,.052,.066),'skin',True)
        cube('Leather belt',(0,-.14,.645),(.48,.17,.065),'wood',.01)
        cube('Belt buckle',(0,-.232,.647),(.075,.028,.065),'gold',.004)
        cylinder('Neck',(0,0,1.135),.12,.18,'skin')
        # Large expressive face, proportioned to the artwork (not a sphere on a peg).
        if female:
            # A faceted bob with a chin-length, flared silhouette.
            ball('Bob back mass',(0,.085,1.58),(.50,.34,.44),'hair',False,2)
            for s in [-1,1]:
                ball('Flared bob sides',(s*.37,.015,1.38),(.22,.30,.29),'hairDark',False,1)
                ball('Copper side facets',(s*.37,-.075,1.48),(.19,.23,.31),'hair',False,1)
        else:
            ball('Curly hair silhouette',(0,.085,1.61),(.47,.33,.43),'curl',False,2)
        ball('Rounded face',(0,-.065,1.51),(.365 if female else .385,.295,.37),'skin',True)
        for s in [-1,1]:
            ball('Ear',(s*.365,-.025,1.48),(.075,.09,.125),'skin',True)
            ball('Inner ear',(s*.397,-.088,1.48),(.033,.024,.063),'blush',True)
        if not female:
            # Beard is a sculpted lower jaw, with a smaller skin mouth inset.
            ball('Faceted beard',(0,-.155,1.305),(.33,.235,.19),'beard',False,2)
            ball('Mouth cheek inset',(0,-.318,1.375),(.215,.057,.10),'skin',True)
        for s in [-1,1]:
            x=s*.152
            ball('Eye white',(x,-.321,1.575),(.130,.066,.15),'white',True)
            ball('Warm brown iris',(x+s*.010,-.379,1.578),(.069,.025,.090),'wood',True)
            ball('Pupil',(x+s*.013,-.402,1.578),(.046,.015,.065),'black',True)
            ball('Eye catchlight',(x-.017,-.417,1.618),(.024,.009,.029),'white',True)
            tube('Expressive eyebrow',[(x+s*.105,-.302,1.763),(x,-.347,1.789),(x-s*.080,-.322,1.773)],.027,'hairDark' if female else 'curl')
            ball('Cheek warmth',(s*.244,-.289,1.435),(.062,.016,.037),'blush',True)
        ball('Button nose',(0,-.359,1.465),(.09 if female else .115,.082,.075),'blush',True)
        if female:
            for s in [-1,1]:
                ring('Copper round glasses',(s*.158,-.407,1.568),.153,.17,.022,'hairDark')
                beam('Glasses temple',(s*.307,-.381,1.58),(s*.373,-.07,1.62),.022,'hairDark')
                ring('Gold hoop earrings',(s*.39,-.11,1.29),.05,.075,.019,'gold',steps=16)
            beam('Glasses bridge',(-.028,-.425,1.58),(.028,-.425,1.58),.024,'hairDark')
            # Swept angular fringe lies above the eyes and widens left.
            mesh('Side swept copper fringe',[
                (-.46,-.09,1.67),(-.43,-.34,1.72),(-.23,-.32,1.99),(.12,-.23,2.025),
                (.35,-.19,1.88),(.08,-.34,1.80),(-.12,-.34,1.73),(-.27,-.32,1.69),
                (0,.12,2.01)],[(0,1,2),(2,3,5),(3,4,5),(1,5,6),(1,2,5),(1,6,7),(2,8,3),(3,8,4)],'hairLight')
            tube('Gentle smile',[(-.12,-.339,1.365),(-.065,-.369,1.34),(0,-.379,1.333),(.065,-.369,1.34),(.12,-.339,1.365)],.012,'hairDark')
        else:
            rng=random.Random(i+18)
            for layer,z in enumerate([1.77,1.90]):
                for j in range(11 if layer==0 else 8):
                    a=j*TAU/(11 if layer==0 else 8)
                    rad=.35 if layer==0 else .25
                    ball('Individual sculpted curl',(math.cos(a)*rad,math.sin(a)*rad*.75+.02,z+rng.uniform(-.035,.035)),(.13,.12,.12),'curl',False,1)
            ball('Top curls',(0,.04,1.96),(.17,.15,.12),'curl',False,1)
            tube('Smile outline',[(-.16,-.337,1.37),(-.10,-.385,1.33),(0,-.403,1.313),(.10,-.385,1.33),(.16,-.337,1.37)],.024,'ink')
            tube('Visible smiling teeth',[(-.105,-.385,1.345),(0,-.41,1.33),(.105,-.385,1.345)],.014,'ivory')
            cube('Olive backpack',(0,.285,.90),(.51,.23,.51),'olive',.09)
            cube('Backpack pocket',(0,.426,.80),(.36,.10,.25),'olive',.045)
            for s in [-1,1]:
                tube('Backpack shoulder straps',[(s*.25,.30,.98),(s*.23,.06,1.13),(s*.22,-.22,1.04),(s*.23,-.25,.74)],.042,'olive')
        if i>=2:
            # Lou and Noa are palette companions of the two provided silhouettes.
            cube('Traveler badge',(.22,-.225,.95),(.05,.022,.055),'gold',.005)
    print('Four expressive travelers built: Léa, Max, Lou and Noa.')
