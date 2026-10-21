"""1단계: 센서 4개(상하좌우 벽)만 가진 신경망 + 유전 알고리즘.

입력 4개 -> 은닉층 6개(tanh) -> 출력 4개(상/하/좌/우 중 최댓값으로 이동)
유전자 = 모든 가중치와 편향을 한 줄로 이은 난수 배열
적합도 = 마지막 위치와 목표 사이의 직선거리가 가까울수록 높음
"""
import numpy as np

from maze_ga import Maze, DIRS

HIDDEN = 6
STEPS = 100
POP = 100
GENS = 100
GENE_LEN = 4 * HIDDEN + HIDDEN + HIDDEN * 4 + 4  # w1 + b1 + w2 + b2


def decode(gene):
    k = 0
    w1 = gene[k:k + 4 * HIDDEN].reshape(4, HIDDEN); k += 4 * HIDDEN
    b1 = gene[k:k + HIDDEN]; k += HIDDEN
    w2 = gene[k:k + HIDDEN * 4].reshape(HIDDEN, 4); k += HIDDEN * 4
    b2 = gene[k:k + 4]
    return w1, b1, w2, b2


def run(gene, maze):
    """한 개체를 미로에서 STEPS 번 움직이고 지나간 칸 목록을 돌려준다."""
    w1, b1, w2, b2 = decode(gene)
    pos = np.array(maze.start)
    path = [tuple(pos)]
    for _ in range(STEPS):
        sensors = np.array([maze.grid[tuple(pos + d)] for d in DIRS], dtype=float)
        out = np.tanh(sensors @ w1 + b1) @ w2 + b2
        nxt = pos + DIRS[out.argmax()]
        if maze.grid[tuple(nxt)] == 0:  # 벽이면 제자리
            pos = nxt
        path.append(tuple(pos))
    return path


def fitness(gene, maze):
    end = np.array(run(gene, maze)[-1])
    return -np.linalg.norm(end - np.array(maze.goal))


def evolve(maze, seed=0):
    rng = np.random.default_rng(seed)
    pop = rng.normal(0, 1, (POP, GENE_LEN))  # 처음엔 완전 난수
    for g in range(GENS):
        fit = np.array([fitness(x, maze) for x in pop])
        order = np.argsort(-fit)
        print(f"세대 {g:3d}  최고 적합도 {fit[order[0]]:.2f}  평균 {fit.mean():.2f}")
        parents = pop[order[:POP // 5]]          # 상위 20%만 부모
        children = []
        while len(children) < POP - len(parents):
            a, b = parents[rng.integers(len(parents), size=2)]
            cut = rng.integers(1, GENE_LEN)      # 한 점 교차
            child = np.concatenate([a[:cut], b[cut:]])
            m = rng.random(GENE_LEN) < 0.05      # 돌연변이
            child[m] += rng.normal(0, 0.5, m.sum())
            children.append(child)
        pop = np.vstack([parents, children])
    return pop[0]


if __name__ == "__main__":
    maze = Maze(7, np.random.default_rng(1))
    best = evolve(maze)
    print(maze.render(run(best, maze)))
