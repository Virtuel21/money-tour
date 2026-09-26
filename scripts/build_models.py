"""Rebuild the artwork edition in Blender. The live MCP can execute each stage.
Creates new scenes and preserves the current user's scene.
"""
import os

directory = os.path.dirname(os.path.abspath(__file__))
namespace = {'__file__': os.path.join(directory, 'art_models.py'), '__name__': 'moneytour_models'}

def load(filename):
    path = os.path.join(directory, filename)
    with open(path, encoding='utf-8') as f:
        exec(compile(f.read(), path, 'exec'), namespace)

load('art_models.py')
namespace['setup']()
namespace['buildings']()
load('art_characters.py')
namespace['characters']()
load('art_archipelago.py')
namespace['archipelago']()
namespace['board_assets']()
namespace['garden_plot']()
load('art_specials.py')
namespace['special_assets']()
load('art_export.py')
namespace['export_library']()
namespace['presentation']()
namespace['special_gallery']()
