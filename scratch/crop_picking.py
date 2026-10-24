from PIL import Image

im = Image.open('scratch_picking.jpg')
w, h = im.size
# Crop to 16:10 centered on the action
target_w = 1200
target_h = 750

# Aspect ratio 16:10 = 1.6
target_ratio = 16.0 / 10.0
cur_ratio = w / h

if cur_ratio > target_ratio:
    new_w = int(h * target_ratio)
    left = (w - new_w) // 2
    im_cropped = im.crop((left, 0, left + new_w, h))
else:
    new_h = int(w / target_ratio)
    top = (h - new_h) // 2
    im_cropped = im.crop((0, top, w, top + new_h))

im_resized = im_cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)
im_resized.save('scratch_picking_crop.webp', 'WEBP', quality=88)
print("Saved scratch_picking_crop.webp")
