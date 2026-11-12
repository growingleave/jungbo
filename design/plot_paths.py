import json, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
plt.rcParams['font.family']='WenQuanYi Zen Hei'; plt.rcParams['axes.unicode_minus']=False
d=json.load(open('experiments/real_paths.json'))
T=lambda p:(p[1],p[0])      # 시뮬레이터(열=가로, 행=세로) -> 도면(그림을 시계방향 90도 돌린 것을 원래대로)
def walls(ax):
    for s in d['segs']:
        if s['open']: continue
        (ax1,ay1),(bx,by)=T(s['a']),T(s['b'])
        if min(ax1,bx)>=99 and min(ay1,by)>=74.9 and max(ay1,by)<=100.1 and ax1==bx==100: continue   # 출구
        ax.plot([ax1,bx],[ay1,by],color='#222',lw=5,solid_capstyle='projecting')
    ax.add_patch(plt.Rectangle((75,75),25,25,fc='#fbd',ec='none',alpha=.6,zorder=0))
    ax.text(87.5,87.5,'도착',ha='center',va='center',fontsize=12,color='#a03')
    ax.text(12.5,3,'출발',ha='center',fontsize=11,color='#080')
    ax.set_xlim(-8,108); ax.set_ylim(-8,108); ax.set_aspect('equal'); ax.axis('off')
fig,axs=plt.subplots(1,2,figsize=(13,6.8))
ax=axs[0]; walls(ax)
p=[T(q) for q in d['nominal']['path']]
ax.plot([a for a,b in p],[b for a,b in p],color='#d33',lw=2.5)
ax.plot(*p[0],'o',color='#080',ms=9); ax.plot(*p[-1],'*',color='#d33',ms=16)
ax.set_title('오차 없이 달린 경로 (10.1초, 이동 %dcm, 벽 충돌 0번)'%round(d['nominal']['len']),fontsize=12)
ax=axs[1]; walls(ax)
for r in d['sev2']:
    p=[T(q) for q in r['path']]; ax.plot([a for a,b in p],[b for a,b in p],color='#e80',lw=1.1,alpha=.55)
for r in d['sev1']:
    p=[T(q) for q in r['path']]; ax.plot([a for a,b in p],[b for a,b in p],color='#26c',lw=1.1,alpha=.6)
ax.set_title('실제 오차를 넣고 달린 20번 (파랑=보통 오차 12번, 주황=2배 오차 8번)',fontsize=12)
fig.suptitle('실제 실험에 쓸 유전자(우승 개체)의 경로 — 4×4 미로, 길 폭 25cm, 20번 모두 도착',fontsize=14)
fig.text(.5,.01,'도면과 같은 방향(입구 왼쪽 아래, 출구 오른쪽 위). 로봇은 모두 왼쪽 아래 입구에서 오른쪽으로 출발합니다.',ha='center',fontsize=10)
fig.savefig('robot_paths.png',dpi=130,bbox_inches='tight')
