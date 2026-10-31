import os, sys
from PIL import Image
import numpy as np

roads = [
    (r"d:\aadhrai\test_dataset\road\pothole_small.jpg", "Pothole Small"),
    (r"d:\aadhrai\test_dataset\road\pothole_asphalt.jpg", "Pothole Asphalt"),
    (r"d:\aadhrai\test_dataset\road\clean_road.jpg", "Clean Road"),
]

for p, name in roads:
    img = Image.open(p).convert("L")
    arr = np.array(img, dtype=np.float32)
    h, w = arr.shape
    # Divide into 4x4 blocks to check local variance / depression
    bh, bw = h // 4, w // 4
    block_means = []
    block_stds = []
    for r in range(4):
        for c in range(4):
            blk = arr[r*bh:(r+1)*bh, c*bw:(c+1)*bw]
            block_means.append(np.mean(blk))
            block_stds.append(np.std(blk))
    
    # Crater depression detection: variance of block means vs global mean
    variance_of_blocks = np.std(block_means)
    max_block_contrast = np.max(block_means) - np.min(block_means)
    mean_block_texture = np.mean(block_stds)
    print(f"{name:16s} | Block Var: {variance_of_blocks:5.1f} | Max Contrast: {max_block_contrast:5.1f} | Mean Texture: {mean_block_texture:5.1f}")
