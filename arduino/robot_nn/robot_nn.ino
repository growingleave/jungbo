// 미로 찾기 로봇: 진화시킨 신경망으로 달린다 (좌우반전 4x4 미로에서 벽 하나를 없앤 판, 길 폭 25cm, 로봇 반지름 6.5~8cm로 학습, 실기 오차를 넣어 학습한 개체)
// 센서 5개(VL53L0X) -> 신경망 -> 바퀴 2개(TB6612). 한 번 업로드하면 3초 뒤부터 혼자 달린다.
#include <Wire.h>
#include <VL53L0X.h>
#include <math.h>

// ===================== 여기만 바꾸면 되는 설정 =====================
// 센서가 꽂힌 XSHUT 핀. 순서: 왼90, 왼45, 앞, 오45, 오90 (도면 기준 실제 위치)
const int xshut[5] = {4, 6, 5, 3, 2};

// 바퀴: 신경망 출력 0번이 "왼쪽 바퀴", 1번이 "오른쪽 바퀴"다.
const bool LEFT_IS_A   = true;    // true: 모터 A가 왼쪽, B가 오른쪽.  반대로 꽂았으면 false
const bool INVERT_LEFT  = false;  // 왼쪽 바퀴가 뒤로 돌면 true
const bool INVERT_RIGHT = false;  // 오른쪽 바퀴가 뒤로 돌면 true

const int MAX_PWM = 200;          // 바퀴 최대 힘(0~255). 벽에 세게 부딪히면 줄이고, 너무 느리면 올린다
const int MIN_PWM = 80;           // 바퀴가 겨우 도는 최소 힘. 약한 명령에서 안 돌면 올리고, 튀면 내린다
const int  STUCK_MM   = 40;       // 0.5초 동안 센서 값이 이 합계(mm)보다 적게 변하면 "안 움직인다"로 본다
const float SENSOR_R_CM = 5.2;    // 센서 앞면에서 로봇 중심까지 거리(cm). 실제로 재서 맞춘다 (학습 때 5.2 가정)

// 앞 센서(파손) 보정
const int FRONT = 2;              // 센서 배열에서 앞 센서 번호
const int F_OFFSET_MM = 0;        // 앞 센서가 항상 크게 나오면 + (mm)
const int F_MIN_MM    = 60;       // 이 값 이하는 모두 "가까움"으로 처리
// ===================================================================

const int AIN1 = 7,  AIN2 = 8,  PWMA = 9;
const int BIN1 = 12, BIN2 = 13, PWMB = 10;
VL53L0X sensor[5];

// ===== 신경망 (시뮬레이터와 같은 계산: 센서 5개 -> 은닉 6개(tanh) -> 출력 2개(tanh)) =====
const int NIN = 5, NH = 6, NOUT = 2;
const float W1[NIN * NH] = {-1.40313f, 0.50529f, 1.46751f, 0.61581f, -1.93901f, -1.09648f, -1.22001f, 0.27793f, 3.70548f, 0.10578f, 0.89527f, -1.31385f, -0.60853f, 1.74274f, 0.59719f, -1.62422f, -1.00545f, -0.15875f, -2.51700f, -1.53008f, -0.13070f, 1.62577f, 1.51185f, -0.30253f, -1.22528f, -0.17927f, -0.65756f, -0.65072f, -0.03495f, -0.62887f};   // W1[센서*6 + 은닉]
const float BIAS1[NH]       = {-0.11809f, 0.54268f, -1.67155f, -3.06751f, -0.92586f, -1.22881f};
const float W2[NH * NOUT] = {-0.56173f, 0.83189f, -0.81851f, 1.93781f, -0.94487f, 2.16579f, -0.06897f, 0.53281f, 1.43500f, 0.74608f, 0.68642f, -1.61282f};  // W2[은닉*2 + 출력]
const float BIAS2[NOUT]     = {3.01783f, -1.83222f};

void think(const float *in, float *out) {
  float h[NH];
  for (int j = 0; j < NH; j++) {
    float v = BIAS1[j];
    for (int i = 0; i < NIN; i++) v += in[i] * W1[i * NH + j];
    h[j] = tanh(v);
  }
  for (int o = 0; o < NOUT; o++) {
    float v = BIAS2[o];
    for (int j = 0; j < NH; j++) v += h[j] * W2[j * NOUT + o];
    out[o] = tanh(v);
  }
}

int frontHist[3] = {1200, 1200, 1200};   // 앞 센서는 최근 3번 값의 가운데 값을 쓴다 (튀는 값 제거)

int median3(int a, int b, int c) {
  if ((a >= b && a <= c) || (a <= b && a >= c)) return a;
  if ((b >= a && b <= c) || (b <= a && b >= c)) return b;
  return c;
}

int readMM(int i) {
  int d = sensor[i].readRangeContinuousMillimeters();
  if (sensor[i].timeoutOccurred() || d > 1200) d = 1200;
  if (i == FRONT) {
    frontHist[0] = frontHist[1]; frontHist[1] = frontHist[2]; frontHist[2] = d;
    d = median3(frontHist[0], frontHist[1], frontHist[2]) - F_OFFSET_MM;
    if (d < F_MIN_MM) d = F_MIN_MM;
  }
  if (d < 0) d = 0;
  return d;
}

void motor(int in1, int in2, int pwm, int speed) {     // speed: -255 ~ 255
  digitalWrite(in1, speed > 0 ? HIGH : LOW);
  digitalWrite(in2, speed < 0 ? HIGH : LOW);
  analogWrite(pwm, abs(speed));
}

int pwmOf(float v) {                                   // 약한 명령도 MIN_PWM부터 시작하도록 펴 준다
  if (fabs(v) < 0.05) return 0;
  int p = MIN_PWM + (int)((MAX_PWM - MIN_PWM) * fabs(v));
  return v > 0 ? p : -p;
}

void drive(float left, float right) {                  // -1 ~ 1
  int l = pwmOf(left), r = pwmOf(right);
  if (INVERT_LEFT) l = -l;
  if (INVERT_RIGHT) r = -r;
  if (LEFT_IS_A) { motor(AIN1, AIN2, PWMA, l); motor(BIN1, BIN2, PWMB, r); }
  else           { motor(AIN1, AIN2, PWMA, r); motor(BIN1, BIN2, PWMB, l); }
}

// ===== 끼임 탈출: 바퀴는 돌리는데 센서 값이 1.5초 동안 거의 안 바뀌면 뒤로 빼고 열린 쪽으로 돈다 =====
void recover(const int *mm) {
  drive(-0.8, -0.8); delay(450);                       // 뒤로
  if (mm[0] + mm[1] > mm[3] + mm[4]) drive(-0.7, 0.7); // 왼쪽이 더 열려 있으면 왼쪽으로 제자리 회전
  else                               drive(0.7, -0.7); // 아니면 오른쪽으로
  delay(380);
  drive(0, 0); delay(60);
}

void setup() {
  Serial.begin(115200);
  Wire.begin();
  pinMode(AIN1, OUTPUT); pinMode(AIN2, OUTPUT); pinMode(PWMA, OUTPUT);
  pinMode(BIN1, OUTPUT); pinMode(BIN2, OUTPUT); pinMode(PWMB, OUTPUT);
  drive(0, 0);
  for (int i = 0; i < 5; i++) { pinMode(xshut[i], OUTPUT); digitalWrite(xshut[i], LOW); }
  delay(10);
  for (int i = 0; i < 5; i++) {
    digitalWrite(xshut[i], HIGH);
    delay(10);
    sensor[i].setTimeout(500);
    if (!sensor[i].init()) {
      Serial.print("센서 시작 실패: "); Serial.println(i + 1);
      while (true) {}
    }
    sensor[i].setAddress(0x30 + i);
    sensor[i].startContinuous(50);
  }
  Serial.println("준비 완료. 3초 뒤 출발합니다.");
  delay(3000);
}

void loop() {
  float in[NIN], out[NOUT];
  int mm[5];
  for (int i = 0; i < 5; i++) {
    mm[i] = readMM(i);
    float cm = mm[i] / 10.0 + SENSOR_R_CM;             // 센서 값 -> 로봇 중심에서 벽까지 거리
    if (cm > 40.0) cm = 40.0;                          // 시뮬레이터와 같이 40cm에서 자름
    in[i] = cm / 40.0;
  }
  think(in, out);

  // 끼임 검사: 10번(약 0.5초)마다 센서 값이 얼마나 변했는지 본다
  static int ref[5] = {0, 0, 0, 0, 0}, cnt = 0, stuck = 0;
  if (++cnt >= 10) {
    int diff = 0;
    for (int i = 0; i < 5; i++) { diff += abs(mm[i] - ref[i]); ref[i] = mm[i]; }
    cnt = 0;
    float spd = (fabs(out[0]) + fabs(out[1])) / 2;     // 바퀴에 준 힘
    stuck = (diff < STUCK_MM && spd > 0.25) ? stuck + 1 : 0;
  }
  if (stuck >= 3) { recover(mm); stuck = 0; return; }  // 1.5초 연속이면 탈출 동작

  drive(out[0], out[1]);

  Serial.print("L90:"); Serial.print(mm[0]);
  Serial.print(" L45:"); Serial.print(mm[1]);
  Serial.print(" F:");   Serial.print(mm[2]);
  Serial.print(" R45:"); Serial.print(mm[3]);
  Serial.print(" R90:"); Serial.print(mm[4]);
  Serial.print("  -> 왼바퀴 "); Serial.print(out[0], 2);
  Serial.print(" 오른바퀴 "); Serial.println(out[1], 2);
}
