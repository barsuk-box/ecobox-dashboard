"""Original stylized sheet-metal assembly, 1 unit = 1 metre. Blender 5.x.
Run: blender --background --factory-startup --python scripts/build_blender.py
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector

root=Path(__file__).resolve().parents[1]
out=root/'public'/'models'; out.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
collection=bpy.data.collections.new('COL_EcoBox_Assembly'); scene.collection.children.link(collection)
def material(name,color,metallic,roughness):
    m=bpy.data.materials.new(name); m.use_nodes=True
    bs=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    bs.inputs['Base Color'].default_value=(*color,1); bs.inputs['Metallic'].default_value=metallic; bs.inputs['Roughness'].default_value=roughness
    m.diffuse_color=(*color,1); return m
silver=material('MAT_Brushed_aluminium',(.45,.57,.7),.78,.28)
blue=material('MAT_Cobalt_powder_coat',(.025,.15,.75),.45,.27)
teal=material('MAT_Teal_edge',(.02,.8,.64),.4,.23)
dark=material('MAT_Graphite',(.022,.035,.07),.6,.3)
def box(name,loc,size,mat,bevel=.04):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.name=name
    for c in list(o.users_collection): c.objects.unlink(o)
    collection.objects.link(o)
    o.dimensions=size; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(mat)
    mod=o.modifiers.new('Rounded manufactured edges','BEVEL'); mod.width=bevel; mod.segments=3
    o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
    return o
# Three exploded metal cassettes with open frame fronts, keeping a legible silhouette.
for layer,y in enumerate([.58,-.04,-.70]):
    mat=[dark,blue,silver][layer]
    parts=[]
    parts.append(box(f'SM_Cassette_{layer}_top',(0,y,.85),(1.8,.16,.14),mat))
    parts.append(box(f'SM_Cassette_{layer}_base',(0,y,-.85),(1.8,.16,.14),mat))
    for x in [-.83,.83]: parts.append(box(f'SM_Cassette_{layer}_side_{x}',(x,y,0),(.14,.16,1.62),mat))
    if layer==0:
        parts.append(box('SM_Rear_panel',(0,y+.05,0),(1.56,.06,1.56),dark))
    elif layer==1:
        for z in [-.55,-.27,0,.27,.55]: parts.append(box(f'SM_Cooling_fin_{z}',(0,y,z),(1.48,.23,.11),blue,.025))
    else:
        for x in [-.56,-.28,0,.28,.56]: parts.append(box(f'SM_Front_rib_{x}',(x,y,0),(.07,.11,1.5),silver,.02))
    for o in parts:
        base=o.location.copy()
        for frame,shift in [(1,0),(60,(layer-1)*-.16),(120,0)]:
            o.location=base+Vector((0,shift,math.sin(layer)*shift*.35)); o.keyframe_insert(data_path='location',frame=frame)
box('SM_Identity_tab',(.56,-.83,-.65),(.28,.08,.16),teal,.025)
for x in [-.75,.75]:
    for z in [-.75,.75]:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=6,radius=.052,location=(x,-.80,z)); o=bpy.context.object; o.name='SM_Fastener'; o.scale=(1,.4,1); o.data.materials.append(dark)
        for c in list(o.users_collection): c.objects.unlink(o)
        collection.objects.link(o)
scene.frame_end=120; scene.render.fps=30; scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT')
for o in collection.objects: o.select_set(True)
bpy.context.view_layer.objects.active=collection.objects[0]
bpy.ops.export_scene.gltf(filepath=str(out/'ecobox-assembly.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='SCENE',export_apply=True)
# Poster is a genuine Blender render and also the non-WebGL fallback.
bpy.ops.object.camera_add(location=(3.8,-5.8,3.5)); cam=bpy.context.object; cam.name='CAM_Poster'; cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler(); cam.data.type='ORTHO'; cam.data.ortho_scale=3.6; scene.camera=cam
for name,loc,power,color,size in [('Key',(1,-4,5),1000,(.8,.9,1),4),('Rim',(-3,1,2),1400,(.12,.4,1),3),('Fill',(4,2,1),1200,(.1,1,.85),3)]:
    bpy.ops.object.light_add(type='AREA',location=loc); l=bpy.context.object; l.name='LGT_'+name; l.data.energy=power; l.data.color=color; l.data.shape='DISK'; l.data.size=size; l.rotation_euler=(-l.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='CYCLES'; scene.cycles.samples=32
scene.render.resolution_x=720; scene.render.resolution_y=720; scene.render.resolution_percentage=100
scene.render.film_transparent=True; scene.render.image_settings.file_format='PNG'; scene.render.filepath=str(out/'assembly-poster.png')
scene.world.color=(.22,.22,.22)
(root/'assets').mkdir(exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(root/'assets'/'ecobox-assembly.blend'))
dg=bpy.context.evaluated_depsgraph_get(); tris=sum(len(o.evaluated_get(dg).to_mesh().polygons)*2 for o in collection.objects if o.type=='MESH')
print(json.dumps({'objects':len(collection.objects),'approxTriangles':tris,'glbBytes':(out/'ecobox-assembly.glb').stat().st_size}))
bpy.ops.render.render(write_still=True)
