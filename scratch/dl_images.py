import urllib.request
from PIL import Image

def download(url, out_name):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp, open(out_name, 'wb') as f:
        f.write(resp.read())
    im = Image.open(out_name)
    print(f"Downloaded {out_name}: size={im.size}")
    thumb = im.copy()
    thumb.thumbnail((400, 300))
    thumb.save(out_name.replace('.jpeg', '_thumb.jpg').replace('.jpg', '_thumb.jpg'))

download('https://images.pexels.com/photos/28903082/pexels-photo-28903082.jpeg?auto=compress&cs=tinysrgb&w=1600', 'scratch/pexels_28903082.jpg')
download('https://images.pexels.com/photos/30443905/pexels-photo-30443905.jpeg?auto=compress&cs=tinysrgb&w=1600', 'scratch/pexels_30443905.jpg')
