// 미로 길 외워서 가기 (신경망 안 씀). 좌우반전 4x4 미로, 출발 오른쪽 아래 -> 도착 왼쪽 위, 칸 25cm.
// 외운 길:  직진2칸 → 우회전 → 직진2칸(벽까지) → 우회전 → 직진1칸 → 좌회전 → 직진1칸(벽까지) → 좌회전 → 직진2칸(벽까지) → 끝
// 처음엔 CAL_MODE를 1로 두고 시험해서 CELL_MS, TURN90_MS를 맞춘 뒤, CAL_MODE를 0으로 바꿔 다시 올린다.
#include <Wire.h>
#include <VL53L0X.h>
#include <math.h>

#define CAL_MODE 1                // 1: 보정 시험(2초 직진 + 1초 우회전), 0: 외운 길 달리기

// ===================== 여기만 바꾸면 되는 설정 =====================
const int xshut[5] = {4, 6, 5, 3, 2};   // 왼90, 왼45, 앞, 오45, 오90 (센서 순서)
const bool LEFT_IS_A    = true;         // 모터 A가 왼쪽이면 true
const bool INVERT_LEFT  = false;        // 왼쪽 바퀴가 뒤로 돌면 true
const bool INVERT_RIGHT = false;        // 오른쪽 바퀴가 뒤로 돌면 true

const int FWD_PWM  = 160;               // 직진할 때 힘(0~255)
const int TURN_PWM = 150;               // 제자리 회전할 때 힘
int CELL_MS   = 1250;                   // 한 칸(25cm) 가는 시간(ms)  <- 보정 시험으로 맞춘다
int TURN90_MS = 350;                    // 90도 도는 시간(ms)         <- 보정 시험으로 맞춘다

const int STOP_MM = 90;                 // 앞 센서가 이 값 이하면 벽에 다 왔다고 보고 멈춘다 (고장난 센서는 60mm 아래로 못 내려감)
const float KP = 0.20;                  // 양옆 벽 사이 가운데를 유지하는 세기 (너무 흔들리면 줄인다)
// ===================================================================

const int AIN1 = 7,  AIN2 = 8,  PWMA = 9;
const int BIN1 = 12, BIN2 = 13, PWMB = 10;
VL53L0X sensor[5];

void motor(int in1, int in2, int pwm, int speed) {     // speed: -255 ~ 255
  digitalWrite(in1, speed > 0 ? HIGH : LOW);
  digitalWrite(in2, speed < 0 ? HIGH : LOW);
  analogWrite(pwm, abs(speed));
}
void drivePWM(int left, int right) {
  if (INVERT_LEFT) left = -left;
  if (INVERT_RIGHT) right = -right;
  if (LEFT_IS_A) { motor(AIN1, AIN2, PWMA, left);  motor(BIN1, BIN2, PWMB, right); }
  else           { motor(AIN1, AIN2, PWMA, right); motor(BIN1, BIN2, PWMB, left); }
}
void stopAll() { drivePWM(0, 0); }

int readMM(int i) {
  int d = sensor[i].readRangeContinuousMillimeters();
  if (sensor[i].timeoutOccurred() || d > 1200) d = 1200;
  return d;
}

// 직진: ms 시간 동안 간다. 양옆 벽이 둘 다 보이면 가운데로 맞춘다.
// untilWall이 true면 앞 벽(STOP_MM)에 닿으면 일찍 멈춘다. false여도 앞이 너무 가까우면 멈춘다(충돌 방지).
void forward(unsigned long ms, bool untilWall) {
  unsigned long t0 = millis();
  while (millis() - t0 < ms) {
    int L = readMM(0), F = readMM(2), R = readMM(4);
    if (F <= STOP_MM && (untilWall || F <= 70)) break;
    int l = FWD_PWM, r = FWD_PWM;
    if (L < 250 && R < 250) {                       // 양옆에 벽이 있을 때만
      int corr = (int)(KP * (L - R));               // L이 크면 오른쪽 벽에 가까움 -> 왼쪽으로
      corr = constrain(corr, -50, 50);
      l -= corr; r += corr;
    }
    drivePWM(l, r);
    Serial.print("L "); Serial.print(L); Serial.print(" F "); Serial.print(F); Serial.print(" R "); Serial.println(R);
  }
  stopAll(); delay(200);
}

void turnRight() { drivePWM(TURN_PWM, -TURN_PWM); delay(TURN90_MS); stopAll(); delay(250); }
void turnLeft()  { drivePWM(-TURN_PWM, TURN_PWM); delay(TURN90_MS); stopAll(); delay(250); }

void setup() {
  Serial.begin(115200);
  Wire.begin();
  pinMode(AIN1, OUTPUT); pinMode(AIN2, OUTPUT); pinMode(PWMA, OUTPUT);
  pinMode(BIN1, OUTPUT); pinMode(BIN2, OUTPUT); pinMode(PWMB, OUTPUT);
  stopAll();
  for (int i = 0; i < 5; i++) { pinMode(xshut[i], OUTPUT); digitalWrite(xshut[i], LOW); }
  delay(10);
  for (int i = 0; i < 5; i++) {
    digitalWrite(xshut[i], HIGH); delay(10);
    sensor[i].setTimeout(500);
    if (!sensor[i].init()) { Serial.print("센서 시작 실패: "); Serial.println(i + 1); while (true) {} }
    sensor[i].setAddress(0x30 + i);
    sensor[i].startContinuous(50);
  }
  Serial.println("준비 완료. 3초 뒤 출발합니다.");
  delay(3000);

#if CAL_MODE
  // 보정 시험: 평평한 곳에 놓고, 2초 직진 후 1초 우회전한다. 벽은 없어도 된다.
  Serial.println("보정 시험: 2초 직진");
  drivePWM(FWD_PWM, FWD_PWM); delay(2000); stopAll(); delay(1500);
  Serial.println("보정 시험: 1초 우회전");
  drivePWM(TURN_PWM, -TURN_PWM); delay(1000); stopAll();
  Serial.println("끝. 간 거리(cm)와 돈 각도(도)를 재서 CELL_MS, TURN90_MS를 계산하세요.");
#else
  // ===== 외운 길 =====
  forward(2UL * CELL_MS, false);       // 직진 2칸
  turnRight();
  forward(2UL * CELL_MS * 14 / 10, true);   // 직진 2칸 (앞 벽까지, 늦으면 1.4배 시간에서 멈춤)
  turnRight();
  forward(1UL * CELL_MS, false);       // 직진 1칸
  turnLeft();
  forward(1UL * CELL_MS * 14 / 10, true);   // 직진 1칸 (앞 벽까지)
  turnLeft();
  forward(2UL * CELL_MS * 14 / 10, true);   // 직진 2칸 (앞 벽까지) = 도착
  Serial.println("도착!");
#endif
  stopAll();
}

void loop() { }
