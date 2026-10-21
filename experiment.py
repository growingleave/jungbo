"""모든 단계를 여러 시드로 돌려 표/그래프/CSV 로 저장한다.

    python3 experiment.py            # 시드 5개
    python3 experiment.py --seeds 10
"""
import argparse
import csv
import os

import numpy as np

from maze_ga import STAGES, evolve, show_run

ap = argparse.ArgumentParser()
ap.add_argument("--seeds", type=int, default=5)
ap.add_argument("--generations", type=int, default=150)
args = ap.parse_args()

os.makedirs("results", exist_ok=True)
rows, curves = [], {}

for st in STAGES:
    print(f"\n=== {st.name} ===\n문제: {st.problem}\n개선: {st.fix}")
    tr, te, hist = [], [], []
    for s in range(args.seeds):
        r = evolve(st, seed=s, generations=args.generations,
                   log=print if s == 0 else None)
        tr.append(r["train_rate"]); te.append(r["test_rate"])
        hist.append([h[1] for h in r["history"]])
        if s == 0:
            print(show_run(r, st, r["fixed"][0]))
    print(f"  -> 훈련 미로 성공률 {np.mean(tr):.2f} | 새 미로 성공률 {np.mean(te):.2f}")
    rows.append([st.name, st.fitness, st.memory, st.n_train_mazes,
                 round(float(np.mean(tr)), 3), round(float(np.mean(te)), 3)])
    curves[st.name] = np.mean(hist, axis=0)

with open("results/summary.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["stage", "fitness", "memory", "train_mazes", "train_success", "unseen_success"])
    w.writerows(rows)

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(1, 2, figsize=(11, 4))
    for name, c in curves.items():
        ax[0].plot(c, label=name.split()[0])
    ax[0].set(xlabel="generation", ylabel="best fitness", title="Best fitness")
    ax[0].legend()
    x = np.arange(len(rows))
    ax[1].bar(x - 0.2, [r[4] for r in rows], 0.4, label="train maze")
    ax[1].bar(x + 0.2, [r[5] for r in rows], 0.4, label="unseen mazes")
    ax[1].set_xticks(x, [r[0].split()[0] for r in rows])
    ax[1].set(ylim=(0, 1.05), ylabel="success rate", title="Success rate")
    ax[1].legend()
    plt.tight_layout()
    plt.savefig("results/summary.png", dpi=130)
except ImportError:
    print("matplotlib 없음: 그래프는 건너뜀")
print("\n저장: results/summary.csv, results/summary.png")
