from PIL import Image
import numpy as np

img = Image.open(r"d:\aadhrai\test_dataset\road\clean_road.jpg").convert("RGB")
arr = np.array(img, dtype=np.float32)
r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
# Vegetation (green trees/bushes along road)
veg_ratio = np.mean((g > r + 15) & (g > b) & (g > 60))
# Sky
sky_ratio = np.mean((b > r + 15) & (b > g) & (b > 120))
print(f"Clean road: veg={veg_ratio:.2f}, sky={sky_ratio:.2f}")

poth = Image.open(r"d:\aadhrai\test_dataset\road\pothole_asphalt.jpg").convert("RGB")
arr_p = np.array(poth, dtype=np.float32)
rp, gp, bp = arr_p[:,:,0], arr_p[:,:,1], arr_p[:,:,2]
veg_p = np.mean((gp > rp + 15) & (gp > bp) & (gp > 60))
sky_p = np.mean((bp > rp + 15) & (bp > gp) & (bp > 120))
print(f"Pothole asphalt: veg={veg_p:.2f}, sky={sky_p:.2f}")
