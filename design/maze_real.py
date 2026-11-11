import random, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
plt.rcParams['font.family']='WenQuanYi Zen Hei'
N=4; C=25
def gen(seed):                       # 무작위 신장 트리(크루스칼): DFS보다 갈래가 많이 생김
    r=random.Random(seed); par={(x,y):(x,y) for x in range(N) for y in range(N)}
    def f(a):
        while par[a]!=a: par[a]=par[par[a]]; a=par[a]
        return a
    E=[((x,y),(x+1,y)) for x in range(N-1) for y in range(N)]+[((x,y),(x,y+1)) for x in range(N) for y in range(N-1)]
    r.shuffle(E); op=set()
    for a,b in E:
        if f(a)!=f(b): par[f(a)]=f(b); op.add(frozenset([a,b]))
    return op
def solve(op):
    from collections import deque
    p={(0,0):None}; q=deque([(0,0)])
    while q:
        c=q.popleft()
        for e in op:
            if c in e:
                n=[v for v in e if v!=c][0]
                if n not in p: p[n]=c; q.append(n)
    s=[]; c=(N-1,N-1)
    while c: s.append(c); c=p[c]
    return s[::-1]
best=None
for seed in range(20000):
    op=gen(seed); s=solve(op)
    deg={}
    for e in op:
        for c in e: deg[c]=deg.get(c,0)+1
    dead=sum(1 for c in deg if deg[c]==1 and c not in((0,0),(N-1,N-1)))
    junc=sum(1 for c in deg if deg[c]+(1 if c in((0,0),(N-1,N-1)) else 0)>=3)
    if 8<=len(s)<=11 and (best is None or (junc,dead)>best[5]): best=(len(s),seed,op,s,dead,(junc,dead))
L,seed,op,sol,dead,jd=best
import json
json.dump([[list(a) for a in sorted(e)] for e in op],open('experiments/maze_real_edges.json','w'))
print('갈림칸',jd[0])
print('seed',seed,'해답칸',L,'막다른길',dead)
fig,ax=plt.subplots(figsize=(8,8.4))
ax.add_patch(plt.Rectangle((0,0),N*C,N*C,fc='#f4f1e6',ec='none'))
xs=[(c[0]*C+12.5,c[1]*C+12.5) for c in sol]
ax.plot([a for a,b in xs],[b for a,b in xs],color='#e7a',lw=3,ls='--',alpha=.8)
wl=0
def wall(a,b):
    global wl; wl+=abs(a[0]-b[0])+abs(a[1]-b[1])
    ax.plot([a[0]*C,b[0]*C],[a[1]*C,b[1]*C],color='#222',lw=6,solid_capstyle='projecting')
for x in range(N):
    for y in range(N):
        if x<N-1 and frozenset([(x,y),(x+1,y)]) not in op: wall((x+1,y),(x+1,y+1))
        if y<N-1 and frozenset([(x,y),(x,y+1)]) not in op: wall((x,y+1),(x+1,y+1))
for i in range(N):
    if i!=0: wall((0,i),(0,i+1))              # 왼쪽 (0행은 입구)
    if i!=N-1: wall((N,i),(N,i+1))            # 오른쪽 (맨 위 행은 출구)
    wall((i,0),(i+1,0)); wall((i,N),(i+1,N))
ax.add_patch(plt.Circle((12.5,12.5),5.5,fc='#9cf',ec='#036')); ax.text(12.5,12.5,'로봇',ha='center',va='center',fontsize=9)
ax.annotate('',xy=(3,12.5),xytext=(-22,12.5),arrowprops=dict(arrowstyle='->',color='#c00',lw=2))
ax.text(-16,22,'입구(시작)',ha='center',color='#c00',fontsize=13)
ax.annotate('',xy=(122,87.5),xytext=(100,87.5),arrowprops=dict(arrowstyle='->',color='#080',lw=2))
ax.text(116,104,'출구(도착)',ha='center',color='#080',fontsize=13)
ax.annotate('',xy=(0,-8),xytext=(25,-8),arrowprops=dict(arrowstyle='<->')); ax.text(12.5,-15,'길 폭 25cm',ha='center',fontsize=11)
ax.text(50,-27,f'전체 100×100cm  /  벽 높이 10cm 이상  /  분홍 점선 = 정답 길',ha='center',fontsize=11)
ax.set_xlim(-40,135); ax.set_ylim(-32,110); ax.set_aspect('equal'); ax.axis('off')
ax.set_title('4×4 미로 (갈림길 %d곳, 막다른 길 %d개)'%(jd[0],dead),fontsize=15)
print('벽 총길이 cm',wl*C,'개수',wl)
fig.savefig('maze_real.png',dpi=130,bbox_inches='tight')
