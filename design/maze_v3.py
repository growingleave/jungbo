import json, matplotlib
from collections import deque
matplotlib.use("Agg")
import matplotlib.pyplot as plt
plt.rcParams['font.family']='WenQuanYi Zen Hei'
N=4; C=25
E=json.load(open('experiments/maze_real_edges_v3.json'))
op=set(frozenset([(3-a[0],a[1]),(3-b[0],b[1])]) for a,b in E)      # 좌우반전: x -> 3-x
start=(3,0); goal=(0,3)
par={start:None}; q=deque([start])
while q:
    c=q.popleft()
    for e in op:
        if c in e:
            n=[v for v in e if v!=c][0]
            if n not in par: par[n]=c; q.append(n)
sol=[]; c=goal
while c: sol.append(c); c=par[c]
sol=sol[::-1]
fig,ax=plt.subplots(figsize=(8,8.4))
ax.add_patch(plt.Rectangle((0,0),N*C,N*C,fc='#f4f1e6',ec='none'))
ax.plot([c[0]*C+12.5 for c in sol],[c[1]*C+12.5 for c in sol],color='#e7a',lw=3,ls='--',alpha=.8)
def wall(a,b): ax.plot([a[0]*C,b[0]*C],[a[1]*C,b[1]*C],color='#222',lw=6,solid_capstyle='projecting')
for x in range(N):
    for y in range(N):
        if x<N-1 and frozenset([(x,y),(x+1,y)]) not in op: wall((x+1,y),(x+1,y+1))
        if y<N-1 and frozenset([(x,y),(x,y+1)]) not in op: wall((x,y+1),(x+1,y+1))
for i in range(N):
    if i!=0: wall((N,i),(N,i+1))      # 오른쪽: 맨 아래 칸은 입구
    if i!=N-1: wall((0,i),(0,i+1))    # 왼쪽: 맨 위 칸은 출구
    wall((i,0),(i+1,0)); wall((i,N),(i+1,N))
ax.add_patch(plt.Circle((87.5,12.5),5.5,fc='#9cf',ec='#036')); ax.text(87.5,12.5,'로봇',ha='center',va='center',fontsize=9)
ax.annotate('',xy=(97,12.5),xytext=(122,12.5),arrowprops=dict(arrowstyle='->',color='#c00',lw=2))
ax.text(116,22,'입구(시작)',ha='center',color='#c00',fontsize=13)
ax.annotate('',xy=(-22,87.5),xytext=(0,87.5),arrowprops=dict(arrowstyle='->',color='#080',lw=2))
ax.text(-16,98,'출구(도착)',ha='center',color='#080',fontsize=13)
ax.plot([50,50],[25,50],color='#e22',lw=5,ls=(0,(1.2,1.2)),solid_capstyle='butt'); ax.text(50,56,'없앤 벽',color='#e22',fontsize=11,ha='center')
ax.set_xlim(-40,135); ax.set_ylim(-20,110); ax.set_aspect('equal'); ax.axis('off')
ax.set_title('테스트에 쓴 미로 (좌우반전 + 벽 하나 없앰, 출발 오른쪽 아래 → 도착 왼쪽 위, 폭 25cm)',fontsize=13)
ax.text(50,-12,'분홍 점선 = 최단 길 (8칸). 빨간 점선 = 없앤 벽(이 자리가 뚫려 돌아가는 길이 생김)',ha='center',fontsize=11)
fig.savefig('maze_real_v3.png',dpi=130,bbox_inches='tight')
print(len(sol)-1)
