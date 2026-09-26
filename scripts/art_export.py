"""Export and arrange the live MCP-authored models into editable Blender scenes."""
def export_library():
    import io_scene_gltf2, json
    library=roots['board'].users_collection[0]
    library.hide_viewport=False;library.hide_render=False
    bpy.context.window.scene=next(s for s in bpy.data.scenes if library.name in s.collection.children)
    for o in bpy.context.scene.objects:o.select_set(False)
    runtime_names=['board','tile','die','palm','chance','championship','tax','travel','start','plot']
    for r in [roots[n] for n in runtime_names]:
        r.location=(0,0,0);r.select_set(True)
        for child in r.children:child.select_set(True)
    bpy.context.view_layer.update()
    formats=io_scene_gltf2.get_format_items(bpy.context.scene,bpy.context)
    fmt=next(item[0] for item in formats if item[0]=='GLB')
    path=os.path.join(ROOT,'apps/web/public/models/money-tour.glb')
    renamed=[]
    try:
        for name,r in roots.items():
            collision=bpy.data.objects.get(name)
            if collision and collision!=r:
                old=r.name;collision.name='Temporary export name / '+name;r.name=name
                renamed.append((r,old,collision,name))
        bpy.ops.export_scene.gltf(filepath=path,export_format=fmt,use_selection=True,use_active_scene=True,export_apply=True,export_yup=True)
    finally:
        for r,old,collision,name in renamed:r.name=old;collision.name=name
    stats={n:dict(objects=len(r.children),triangles=sum(len(p.vertices)-2 for o in r.children if o.type=='MESH' for p in o.data.polygons)) for n,r in roots.items()}
    os.makedirs(os.path.join(ROOT,'artifacts'),exist_ok=True)
    with open(os.path.join(ROOT,'artifacts/models-stats.json'),'w') as f:json.dump(stats,f,indent=2)
    print('Exported',path,os.path.getsize(path),'bytes; triangles',sum(s['triangles'] for s in stats.values()))

def duplicate_model(name,collection,loc=(0,0,0),scale=1):
    original=roots[name]
    copy=original.copy();copy.name='Display / '+name;collection.objects.link(copy)
    copy.location=loc;copy.scale=(scale,)*3
    for child in original.children:
        c=child.copy();c.data=child.data;collection.objects.link(c);c.parent=copy
    return copy

def studio(scene,focus,position,ortho,res=(1600,1200)):
    camera=bpy.data.cameras.new('Presentation camera');enum(camera,'type','ORTHO');camera.ortho_scale=ortho
    o=bpy.data.objects.new('Presentation camera',camera);scene.collection.objects.link(o)
    o.location=position;o.rotation_euler=(Vector(focus)-o.location).to_track_quat('-Z','Y').to_euler();scene.camera=o
    world=bpy.data.worlds.new(scene.name+' world');world.use_nodes=True;scene.world=world
    bg=next(n for n in world.node_tree.nodes if n.type=='BACKGROUND');bg.inputs['Color'].default_value=(.75,.80,.84,1);bg.inputs['Strength'].default_value=.65
    for name,loc,power,size in [('Warm key',(-8,-10,18),1800,9),('Soft fill',(9,-2,10),1000,8),('Rim glow',(0,10,13),1600,7)]:
        light=bpy.data.lights.new(name,'AREA');light.energy=power;light.shape='DISK' if 'DISK' in [i.identifier for i in light.bl_rna.properties['shape'].enum_items] else light.shape;light.size=size
        obj=bpy.data.objects.new(name,light);scene.collection.objects.link(obj);obj.location=loc;obj.rotation_euler=(Vector(focus)-obj.location).to_track_quat('-Z','Y').to_euler()
    scene.render.resolution_x,scene.render.resolution_y=res;scene.render.resolution_percentage=100
    enum(scene.render.image_settings,'file_format','PNG')
    # Preserve the live Blender engine; EEVEE is used on the supplied workstation.
    scene.render.film_transparent=False
    floor=bpy.data.meshes.new('Cream studio floor')
    floor_z=-.01 if scene.name.startswith('03') else -.49
    floor.from_pydata([(-100,-100,floor_z),(100,-100,floor_z),(100,100,floor_z),(-100,100,floor_z)],[],[(0,1,2,3)])
    floor_obj=bpy.data.objects.new('Cream studio floor',floor);scene.collection.objects.link(floor_obj)
    floor_obj.data.materials.append(materials['ivory'])
    if scene.name.startswith('03'):
        for obj in scene.objects:
            if obj.type=='LIGHT':obj.data.energy*=3
    names=[i.identifier for i in scene.view_settings.bl_rna.properties['view_transform'].enum_items]
    if 'Standard' in names:scene.view_settings.view_transform='Standard'
    scene.view_settings.exposure=0;scene.view_settings.gamma=1
    return o

def presentation():
    import json
    library=roots['board'].users_collection[0]
    scene=bpy.data.scenes.new('02 · Assembled board')
    bpy.context.window.scene=scene
    display=bpy.data.collections.new('Full board · editable linked models');scene.collection.children.link(display)
    duplicate_model('board',display);duplicate_model('islands',display)
    config=json.load(open(os.path.join(ROOT,'packages/engine/src/game.config.json'),encoding='utf-8'))
    def point(i):
        if i<=8:return ((4-i)*1.8,-7.2)
        if i<=16:return (-7.2,(i-12)*1.8)
        if i<=24:return ((i-20)*1.8,7.2)
        return (7.2,(28-i)*1.8)
    # Geometry labels are stored in a separate presentation collection.
    for t in config['board']:
        x,y=point(t['id']);duplicate_model('tile',display,(x,y,0))
        kind=t['type']
        if kind=='city':duplicate_model('hotel' if t['id']%5==0 else 'house',display,(x,y+.30,.26),.52 if t['id']%5==0 else .57)
        else:duplicate_model('palm' if kind in ('resort','island') else kind,display,(x,y+.3,.26),.9)
    for i,t in enumerate([2,11,20,28]):
        x,y=point(t);duplicate_model('pawn_'+str(i),display,(x,y-.35,.27),.70)
    for x in [-.64,.64]:duplicate_model('die',display,(x,-.85,.60),1.15)
    studio(scene,(0,0,0),(7,-18,23),21,(1800,1600))
    # A second scene lets the user inspect full-size pieces without dismantling the board.
    gallery=bpy.data.scenes.new('03 · Characters and architecture')
    collection=bpy.data.collections.new('Six full-size artwork studies');gallery.collection.children.link(collection)
    for i,n in enumerate(['house','hotel','pawn_0','pawn_1','pawn_2','pawn_3']):duplicate_model(n,collection,((i-2.5)*1.6,0,0))
    studio(gallery,(0,0,1),(4,-13,6),11,(1800,900))
    # Keep the source library available in its own scene, arranged as a shelf.
    for i,n in enumerate(['house','hotel','pawn_0','pawn_1','pawn_2','pawn_3']):roots[n].location=(i*1.6,11,0)
    bpy.context.window.scene=scene
    for area in bpy.context.screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_perspective='CAMERA'
            area.spaces.active.region_3d.view_camera_zoom=0
            area.spaces.active.shading.type='MATERIAL'
            area.spaces.active.overlay.show_overlays=False
    output=os.environ.get('MONEY_TOUR_BLEND_OUT',os.path.join(ROOT,'artifacts/money-tour-artwork.blend'))
    os.makedirs(os.path.dirname(output),exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=output)
    print('Saved editable board and character gallery:',output)
