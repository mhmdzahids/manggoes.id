import urllib.request, re

for pid in ['28903082', '28903083', '30443905']:
    page_url = f'https://www.pexels.com/photo/{pid}/'
    req = urllib.request.Request(page_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode('utf-8')
            og = re.findall(r'<meta property="og:image" content="([^"]+)"', html)
            title = re.findall(r'<title>([^<]+)</title>', html)
            print(pid)
            print(' title:', title)
            print(' og:', og)
    except Exception as e:
        print(pid, e)
