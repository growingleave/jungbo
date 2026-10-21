"""유전 알고리즘으로 신경망의 가중치를 진화시켜 2D 미로를 푸는 실험.

- 유전자(genome) = 신경망의 모든 가중치/편향을 한 줄로 이은 실수 배열
- 신경망      = 입력층 -> 은닉층(tanh) -> 출력층(상/하/좌/우, argmax)
- 개체군 전체를 numpy 로 한꺼번에 시뮬레이션해서 빠르게 돌린다.

STAGES 에 정의된 단계는 "문제를 겪고 -> 고치는" 순서대로 정렬되어 있다.
"""
from collections import deque
from dataclasses import dataclass

import numpy as np

DIRS = np.array([(-1, 0), (1, 0), (0, -1), (0, 1)])  # 상, 하, 좌, 우


# ----------------------------------------------------------------- 미로 ----
class Maze:
    def __init__(self, cells, rng):
        """cells x cells 칸짜리 완전 미로(DFS). 격자 크기는 2*cells+1."""
        n = 2 * cells + 1
        g = np.ones((n, n), dtype=np.int8)  # 1 = 벽
        stack, seen = [(0, 0)], {(0, 0)}
        g[1, 1] = 0
        while stack:
            r, c = stack[-1]
            nxt = [(r + dr, c + dc) for dr, dc in DIRS
                   if 0 <= r + dr < cells and 0 <= c + dc < cells
                   and (r + dr, c + dc) not in seen]
            if not nxt:
                stack.pop()
                continue
            nr, nc = nxt[rng.integers(len(nxt))]
            g[r + nr + 1, c + nc + 1] = 0  # 두 칸 사이 벽 허물기
            g[2 * nr + 1, 2 * nc + 1] = 0
            seen.add((nr, nc))
            stack.append((nr, nc))
        self.grid, self.n = g, n
        self.start, self.goal = (1, 1), (n - 2, n - 2)
        self.dist = self._bfs()  # 목표까지의 실제 최단거리 (벽 -1)

    def _bfs(self):
        d = np.full((self.n, self.n), -1, dtype=np.int32)
        d[self.goal] = 0
        q = deque([self.goal])
        while q:
            r, c = q.popleft()
            for dr, dc in DIRS:
                nr, nc = r + dr, c + dc
                if self.grid[nr, nc] == 0 and d[nr, nc] < 0:
                    d[nr, nc] = d[r, c] + 1
                    q.append((nr, nc))
        return d

    def render(self, path=()):
        ch = np.where(self.grid == 1, "#", " ")
        for r, c in path:
            ch[r, c] = "."
        ch[self.start], ch[self.goal] = "S", "G"
        return "\n".join("".join(row) for row in ch)


# ----------------------------------------------------------- 단계 설정 ----
@dataclass(frozen=True)
class Stage:
    name: str
    problem: str            # 이전 단계에서 발견한 문제 (보고서용)
    fix: str                # 이 단계에서 한 개선
    fitness: str            # 'euclid' | 'bfs' | 'bfs_explore'
    memory: bool            # 방문 횟수 센서 사용 여부
    n_train_mazes: int      # 훈련에 쓰는 미로 수 (1이면 고정 미로)


STAGES = [
    Stage("S1 기본형",
          "(시작점) 벽 4방향 + 목표 방향만 보고 움직이는 신경망",
          "적합도 = 최종 위치와 목표의 직선거리",
          "euclid", False, 1),
    Stage("S2 실제거리",
          "직선거리는 벽 때문에 속임수: 목표와 가깝지만 막다른 길에 갇힘",
          "적합도 = 미로 최단경로 거리(BFS)로 교체",
          "bfs", False, 1),
    Stage("S3 기억+탐험",
          "기억이 없어 같은 자리를 맴돌거나 막다른 길에서 못 돌아 나옴",
          "방문 횟수 센서 추가 + 새 칸 탐험 보상 + 빨리 도착할수록 보너스",
          "bfs_explore", True, 1),
    Stage("S4 다중미로",
          "한 미로만 훈련 -> 처음 보는 미로에서는 실패 (과적합/암기)",
          "매 세대 여러 미로로 훈련해 일반화",
          "bfs_explore", True, 8),
]


# --------------------------------------------------------------- 신경망 ----
def n_inputs(memory):
    return 4 + 2 + (4 if memory else 0)


def genome_size(memory, hidden):
    i = n_inputs(memory)
    return i * hidden + hidden + hidden * 4 + 4


def unpack(pop, memory, hidden):
    p, i = len(pop), n_inputs(memory)
    k = 0
    w1 = pop[:, k:k + i * hidden].reshape(p, i, hidden); k += i * hidden
    b1 = pop[:, k:k + hidden].reshape(p, 1, hidden); k += hidden
    w2 = pop[:, k:k + hidden * 4].reshape(p, hidden, 4); k += hidden * 4
    b2 = pop[:, k:k + 4].reshape(p, 1, 4)
    return w1, b1, w2, b2


# ----------------------------------------------------------- 시뮬레이션 ----
def simulate(pop, maze, stage, hidden, steps, record_best=False):
    """개체군 전체를 한 미로에서 돌려 (적합도, 도착여부, 경로)를 반환."""
    p = len(pop)
    w1, b1, w2, b2 = unpack(pop, stage.memory, hidden)
    grid, dist = maze.grid, maze.dist
    pos = np.tile(np.array(maze.start), (p, 1))
    goal = np.array(maze.goal)
    visits = np.zeros((p, maze.n, maze.n), dtype=np.int16)
    idx = np.arange(p)
    visits[idx, pos[:, 0], pos[:, 1]] = 1
    reached = np.zeros(p, dtype=bool)
    best_d = dist[maze.start] * np.ones(p)       # 지금까지 가장 가까웠던 BFS 거리
    new_cells = np.zeros(p)
    arrive_t = np.full(p, steps)
    path = [pos.copy()] if record_best else None

    for t in range(steps):
        nb = pos[:, None, :] + DIRS[None, :, :]                   # (p,4,2)
        wall = grid[nb[..., 0], nb[..., 1]].astype(float)        # (p,4)
        rel = np.sign(goal - pos).astype(float)                  # (p,2)
        feats = [wall, rel]
        if stage.memory:
            v = visits[idx[:, None], nb[..., 0], nb[..., 1]]
            feats.append(np.minimum(v, 3) / 3.0)
        x = np.concatenate(feats, axis=1)[:, None, :]            # (p,1,I)
        h = np.tanh(x @ w1 + b1)
        out = (h @ w2 + b2)[:, 0, :]
        move = out.argmax(axis=1)
        new = pos + DIRS[move]
        ok = grid[new[:, 0], new[:, 1]] == 0
        new = np.where(ok[:, None], new, pos)                    # 벽이면 제자리
        new = np.where(reached[:, None], pos, new)               # 도착하면 멈춤
        first = visits[idx, new[:, 0], new[:, 1]] == 0
        new_cells += first & ~reached
        visits[idx, new[:, 0], new[:, 1]] += 1
        pos = new
        d = dist[pos[:, 0], pos[:, 1]]
        best_d = np.minimum(best_d, d)
        just = (d == 0) & ~reached
        arrive_t[just] = t
        reached |= d == 0
        if record_best:
            path.append(pos.copy())

    d0 = dist[maze.start]
    if stage.fitness == "euclid":
        e = np.linalg.norm(pos - goal, axis=1)
        fit = 1.0 - e / np.linalg.norm(np.array(maze.start) - goal)
    elif stage.fitness == "bfs":
        fit = 1.0 - dist[pos[:, 0], pos[:, 1]] / d0
    else:  # bfs_explore
        progress = 1.0 - best_d / d0
        explore = new_cells / (maze.n * maze.n / 2)
        speed = np.where(reached, 1.0 - arrive_t / steps, 0.0)
        fit = progress + 0.3 * explore + reached * (1.0 + speed)
    return fit, reached, path


def evaluate(pop, mazes, stage, hidden, steps):
    fits = np.zeros(len(pop))
    solved = np.zeros(len(pop))
    for m in mazes:
        f, r, _ = simulate(pop, m, stage, hidden, steps)
        fits += f
        solved += r
    return fits / len(mazes), solved / len(mazes)


# --------------------------------------------------------- 유전 알고리즘 ----
def evolve(stage, seed=0, cells=7, hidden=8, pop_size=150, generations=150,
           steps=None, elite=3, mut_rate=0.1, mut_sigma=0.4, tour=4,
           test_mazes=30, log=None):
    rng = np.random.default_rng(seed)
    steps = steps or 4 * cells * cells
    size = genome_size(stage.memory, hidden)
    pop = rng.normal(0, 1, (pop_size, size))                     # 난수 가중치 = 초기 유전자
    fixed = [Maze(cells, rng) for _ in range(stage.n_train_mazes)]
    test = [Maze(cells, np.random.default_rng(10_000 + i)) for i in range(test_mazes)]
    history = []

    for g in range(generations):
        # 다중 미로 단계는 세대마다 새 미로를 뽑는다 (암기 방지)
        mazes = fixed if stage.n_train_mazes == 1 else \
            [Maze(cells, rng) for _ in range(stage.n_train_mazes)]
        fit, solved = evaluate(pop, mazes, stage, hidden, steps)
        order = np.argsort(-fit)
        history.append((g, fit.max(), fit.mean(), solved.max()))
        if log and g % 25 == 0:
            log(f"    gen {g:3d}  best={fit.max():.3f} mean={fit.mean():.3f} "
                f"solved(best)={solved[order[0]]:.2f}")

        nxt = [pop[i] for i in order[:elite]]                    # 엘리트 보존
        while len(nxt) < pop_size:
            a, b = (pop[max(rng.integers(pop_size, size=tour), key=lambda i: fit[i])]
                    for _ in range(2))                           # 토너먼트 선택
            mask = rng.random(size) < 0.5                        # 균등 교차
            child = np.where(mask, a, b)
            mut = rng.random(size) < mut_rate                    # 돌연변이
            child = child + mut * rng.normal(0, mut_sigma, size)
            nxt.append(child)
        pop = np.array(nxt)

    fit, _ = evaluate(pop, fixed if stage.n_train_mazes == 1 else mazes,
                      stage, hidden, steps)
    best = pop[np.argmax(fit)][None, :]
    train_set = fixed if stage.n_train_mazes == 1 else mazes
    train_rate = np.mean([simulate(best, m, stage, hidden, steps)[1][0] for m in train_set])
    test_rate = np.mean([simulate(best, m, stage, hidden, steps)[1][0] for m in test])
    return dict(best=best, history=history, train_rate=train_rate,
                test_rate=test_rate, fixed=fixed, test=test, steps=steps, hidden=hidden)


def show_run(result, stage, maze):
    _, _, path = simulate(result["best"], maze, stage, result["hidden"],
                          result["steps"], record_best=True)
    cells = [tuple(p[0]) for p in path]
    return maze.render(cells)
