// 미로 찾기 로봇: 진화시킨 신경망으로 달린다 (좌우반전 4x4 미로(출발 오른쪽 아래), 길 폭 25cm, 로봇 반지름 6.5~8cm로 학습한 가중치, 실기 오차를 넣어 학습한 개체)
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

const int MAX_PWM = 255;          // 바퀴 최대 힘(0~255). 너무 빠르면 줄인다 (예: 200)
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
const float W1[NIN * NH] = {0.97479f, -1.09869f, -0.43861f, 1.71805f, 0.63620f, -0.85606f, -0.25464f, -1.49793f, -0.00662f, 0.24603f, 1.02903f, 0.98438f, -0.55266f, -1.33171f, 2.18895f, -0.46286f, -1.50423f, 0.72727f, 0.79350f, 0.53431f, -1.30260f, -1.13752f, -0.89758f, 0.58003f, -0.99235f, 1.00255f, 1.01417f, -2.31786f, 0.12751f, 1.24406f};   // W1[센서*6 + 은닉]
const float BIAS1[NH]       = {-0.72086f, 1.30428f, 0.38340f, -0.45185f, 0.08948f, -0.01174f};
const float W2[NH * NOUT] = {1.04778f, -1.85756f, -1.38664f, -0.25823f, -0.64730f, 0.82129f, -1.68939f, 1.33626f, -3.05798f, 1.16406f, 0.19008f, 0.60104f};  // W2[은닉*2 + 출력]
const float BIAS2[NOUT]     = {-1.51544f, 0.05351f};

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

void drive(float left, float right) {                  // -1 ~ 1
  int l = (int)(left * MAX_PWM), r = (int)(right * MAX_PWM);
  if (INVERT_LEFT) l = -l;
  if (INVERT_RIGHT) r = -r;
  if (LEFT_IS_A) { motor(AIN1, AIN2, PWMA, l); motor(BIN1, BIN2, PWMB, r); }
  else           { motor(AIN1, AIN2, PWMA, r); motor(BIN1, BIN2, PWMB, l); }
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
  drive(out[0], out[1]);

  Serial.print("L90:"); Serial.print(mm[0]);
  Serial.print(" L45:"); Serial.print(mm[1]);
  Serial.print(" F:");   Serial.print(mm[2]);
  Serial.print(" R45:"); Serial.print(mm[3]);
  Serial.print(" R90:"); Serial.print(mm[4]);
  Serial.print("  -> 왼바퀴 "); Serial.print(out[0], 2);
  Serial.print(" 오른바퀴 "); Serial.println(out[1], 2);
}
