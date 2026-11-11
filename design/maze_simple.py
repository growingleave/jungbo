import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
import glob
names=[f.name for f in fm.fontManager.ttflist]
plt.rcParams['font.family']='WenQuanYi Zen Hei'
plt.rcParams['axes.unicode_minus']=False

C=25  # cm
path=[(0,0),(1,0),(2,0),(2,1),(2,2),(3,2),(3,3)]
S=set(path)
open_e=set()
for a,b in zip(path,path[1:]):
    open_e.add(frozenset([a,b]))
segs=[]
for (x,y) in path:
    for dx,dy,seg in [(1,0,((x+1,y),(x+1,y+1))),(-1,0,((x,y),(x,y+1))),(0,1,((x,y+1),(x+1,y+1))),(0,-1,((x,y),(x+1,y)))]:
        n=(x+dx,y+dy)
        if n in S and frozenset([(x,y),n]) in open_e: continue
        segs.append(seg)
# 입구/출구 열기
segs=[s for s in segs if s not in [((0,0),(0,1)),((4,3),(4,4))] ]
# 출구: 맨 위 칸 위쪽 벽 대신 오른쪽 열기 (위 코드로 이미 처리)
fig,ax=plt.subplots(figsize=(8,8.6))
for (x,y) in path:
    ax.add_patch(plt.Rectangle((x*C,y*C),C,C,fc='#f4f1e6',ec='none'))
for (a,b) in segs:
    ax.plot([a[0]*C,b[0]*C],[a[1]*C,b[1]*C],color='#222',lw=5,solid_capstyle='butt')
ax.text(-16,22,'입구(시작)',ha='center',va='center',fontsize=13,color='#c00',fontweight='bold')
ax.annotate('',xy=(3,12.5),xytext=(-22,12.5),arrowprops=dict(arrowstyle='->',color='#c00',lw=2))
ax.text(112,98,'출구(도착)',ha='center',va='center',fontsize=13,color='#080',fontweight='bold')
ax.annotate('',xy=(122,87.5),xytext=(100,87.5),arrowprops=dict(arrowstyle='->',color='#080',lw=2))
# 로봇 위치
ax.add_patch(plt.Circle((12.5,12.5),5.5,fc='#9cf',ec='#036'))
ax.text(12.5,12.5,'로봇',ha='center',va='center',fontsize=9)
# 치수
ax.annotate('',xy=(0,-8),xytext=(25,-8),arrowprops=dict(arrowstyle='<->'))
ax.text(12.5,-14,'길 폭 25cm',ha='center',fontsize=11)
ax.text(50,-26,'칸 하나 25cm / 전체 100×100cm 안에 들어감',ha='center',fontsize=11)
ax.set_xlim(-40,135); ax.set_ylim(-32,110); ax.set_aspect('equal'); ax.axis('off')
ax.set_title('아주 간단한 미로 (벽 높이 10cm 이상)',fontsize=15)
tot=sum(((a[0]-b[0])**2+(a[1]-b[1])**2)**.5 for a,b in segs)*C/ C
print('벽 개수',len(segs),'총길이 cm',sum(abs(a[0]-b[0])+abs(a[1]-b[1]) for a,b in segs)*C)
fig.savefig('/home/user/jungbo/maze_simple.png',dpi=130,bbox_inches='tight')
