# 몸체 3D 프린트 파일 (ver.0 — 부품 실측 전)

| 파일 | 개수 | 설명 |
|---|---|---|
| `stl/upper_plate.stl` | 1 | 위판 Ø110, 두께 2 |
| `stl/lower_plate.stl` | 1 | 아래판 (옆면 평평, 바퀴 자리) |
| `stl/sensor_holder.stl` | 5 | 센서를 세워서 고정하는 받침 |
| `stl/standoff.stl` | 4 | 위·아래판을 잇는 기둥 (높이 30) |

프린트: PLA, 층 높이 0.2, 벽 3겹, 채움 20%, 지지대 없음. 모두 바닥이 평평하게 눕혀서(기둥만 세워서) 출력.
처음에는 `sensor_holder` 1개만 먼저 뽑아서 센서 보드가 맞는지 확인하세요.

치수는 `params.json`에 있고, `node make_parts.cjs`로 STL을 다시 만듭니다.
