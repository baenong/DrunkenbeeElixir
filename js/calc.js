const advs = document.querySelector(".advs");
const chkAlls = advs.querySelectorAll(".chk-all");
const chance = document.querySelector(".chance");
const advAccept = document.querySelector(".adv-accept");
const advReset = document.querySelector(".adv-reset");
const opts = document.querySelector(".opts");
const inputHits = opts.querySelectorAll(".opt-hit input");
const inputCrits = opts.querySelectorAll(".opt-crit input");
const inputCnts = opts.querySelectorAll(".opt-cnt input");

let hitProb = [20, 20, 20, 20, 20];
let backProb = [20, 20, 20, 20, 20];
let critProb = [10, 10, 10, 10, 10];
let backCrit = [10, 10, 10, 10, 10];
let cntSuccess = [0, 0, 0, 0, 0];
let chan = 14;
let once = false;
const backSuccess = [0, 0, 0, 0, 0];
const SIMULCNT = 1000;

const getRandom = () => {
  return Math.floor(Math.random() * 100) + 1;
};

// 연성확률 조정
const controlHit = (hit, pos) => {
  const origin = hitProb[pos];
  hitProb.forEach((elem, idx) => {
    idx === pos
      ? (hitProb[idx] += hit)
      : (hitProb[idx] = hitProb[idx] - hit * (hitProb[idx] / (100 - origin)));
  });
};

// 데이터 불러오기
const loadData = () => {
  // 연성확률 불러오기
  inputHits.forEach((elem, idx) => (hitProb[idx] = Number(elem.value)));

  // 대성공확률 불러오기
  inputCrits.forEach((elem, idx) => (critProb[idx] = Number(elem.value)));

  // 남은 연성횟수 불러오기
  chan = chance.value === "" ? 14 : Number(chance.value);

  // 붙은 횟수
  inputCnts.forEach((elem, idx) => (backSuccess[idx] = Number(elem.value)));
};

// 대성공 확률 조정
const controlCrit = (hit, pos) => {
  if (critProb[pos] + hit > 100) critProb[pos] = 100;
  else if (critProb[pos] + hit < 0) critProb[pos] = 0;
  else critProb[pos] += hit;
};

const makeUp = () => {
  let ret = getRandom();
  for (let cnt = 0; cnt < 5; cnt++) {
    // 만약 랜덤값이 확률보다 크다면 랜덤값에서 해당 확률 빼고 다음으로 넘어감
    if (hitProb[cnt] < ret) {
      ret = ret - hitProb[cnt];
    } else {
      // 랜덤값이 확률에 해당한다면 대성공 확률 계산하여 대성공이면 1 추가하기
      const retCrit = getRandom();
      cntSuccess[cnt] =
        retCrit < critProb[cnt] ? cntSuccess[cnt] + 2 : cntSuccess[cnt] + 1;
      break;
    }
  }
};

const simulation = () => {
  // 이번만이 체크되어 있는 경우 일회용 배열에 기본배열 복사해두고 덮어쓰기
  let onceProb = once ? [...backProb] : null;
  backProb = [...hitProb];

  let onceCrit = once ? [...backCrit] : null;
  backCrit = [...critProb];

  // 기존확률대로 시뮬레이션 : SIMUL COUNT 횟수만큼 반복
  for (let i = 0; i < SIMULCNT; i++) {
    // 각 시뮬 회차마다 초기화(안하면 이전 봉인페이즈 확률 계승됨)
    hitProb = [...backProb];
    // 남은 횟수만큼 기존 확률대로 진행(초기값 : 14) 봉인페이즈 제외하고 진행
    for (let j = 3; j < chan; j++) {
      // 이번만이 체크되어 있는 경우, 처음이 아닌 경우(j > 3) 일회용배열로 초기화
      if (onceProb !== null && j > 3) {
        hitProb = [...onceProb];
        critProb = [...onceCrit];
      }
      makeUp();
    }
    // 봉인페이즈 : 제일 확률 낮은 순으로 봉인하며 진행
    for (let k = 0; k < 3; k++) {
      const minArr = [...hitProb];
      minArr.sort((a, b) => {
        return a - b;
      });
      const minProb = minArr[k];
      const idxProb = hitProb.indexOf(minProb);
      // 봉인된 확률만큼 내리기
      controlHit(minProb * -1, idxProb);
      makeUp();
    }
  }
};

const applyAdvice = (advNo) => {
  // 사용자가 입력한 값 불러오기
  loadData();
  const whatAdv = `.adv${advNo}`;
  const inputPos = advs.querySelectorAll(
    `${whatAdv} .target input[type="checkbox"]`
  );
  cntSuccess = [0, 0, 0, 0, 0];
  simulation();

  const orgSuccess = [];
  cntSuccess.forEach((elem, idx) => {
    orgSuccess.push(elem / SIMULCNT + backSuccess[idx]);
  });

  // 변경점 반영하여 다시 시뮬
  const inputHit = advs.querySelector(`${whatAdv} .hit input`);
  const inputCrit = advs.querySelector(`${whatAdv} .crit input`);
  const inputInc = advs.querySelector(`${whatAdv} .inc input`);
  const inputChan = advs.querySelector(`${whatAdv} .chan input`);
  const inputOnce = advs.querySelector(`${whatAdv} .curr input`);

  const applyHit = inputHit.value === "" ? 0 : Number(inputHit.value);
  const applyCrit = inputCrit.value === "" ? 0 : Number(inputCrit.value);
  const applyInc = inputInc.value === "" ? 0 : Number(inputInc.value);
  const applyChan = inputChan.value === "" ? 0 : Number(inputChan.value);
  once = inputOnce.checked;

  // 연성확률 조정
  hitProb = [...backProb];
  critProb = [...backCrit];
  cntSuccess = [0, 0, 0, 0, 0];
  const isSelected = [0, 0, 0, 0, 0];

  inputPos.forEach((elem, idx) => {
    if (!elem.classList.contains("chk-all")) {
      if (elem.checked) {
        controlHit(applyHit, idx - 1);
        controlCrit(applyCrit, idx - 1);
        isSelected[idx - 1] = applyInc;
      }
    }
  });
  chan += applyChan;
  simulation();

  const aftSuccess = [];
  cntSuccess.forEach((elem, idx) => {
    aftSuccess.push(elem / SIMULCNT + isSelected[idx] + backSuccess[idx]);
  });
  const rsltOpt = opts.querySelectorAll(`.opt${advNo}`);
  rsltOpt.forEach((elem, idx) => {
    elem.innerText = Math.round(aftSuccess[idx] * SIMULCNT) / SIMULCNT;
  });

  // 점수 계산
  const scoreArr = [...aftSuccess];
  scoreArr.sort((a, b) => {
    return a - b;
  });
  const optScore = opts.querySelector(`.opt${advNo}-score`);
  optScore.innerText =
    Math.round((scoreArr[4] + scoreArr[3]) * SIMULCNT) / SIMULCNT;
};

chkAlls.forEach((chkAll) => {
  chkAll.addEventListener("change", (event) => {
    const chks = event.target.parentNode.querySelectorAll(
      "input[type='checkbox']"
    );
    chks.forEach((chk) => (chk.checked = event.target.checked));
  });
});

advAccept.addEventListener("click", () => {
  applyAdvice(1);
  applyAdvice(2);
  applyAdvice(3);
});

advReset.addEventListener("click", () => {
  inputHits.forEach((elem) => {
    elem.value = 20;
    elem.dataset.per = 20;
  });
  inputCrits.forEach((elem) => (elem.value = 10));
  inputCnts.forEach((elem) => (elem.value = 0));

  chance.value = 14;
  loadData();

  [1, 2, 3].forEach((advNo) => {
    const rsltOpt = opts.querySelectorAll(`.opt${advNo}`);
    rsltOpt.forEach((elem) => (elem.innerText = 0));
  });
});

inputHits.forEach((elem, idx) => {
  elem.addEventListener("change", () => {
    const origin = Number(elem.dataset.per);
    const inc = Number(elem.value - origin);
    inputHits.forEach((e, i) => {
      if (i !== idx) e.value = e.value - inc * (e.value / (100 - origin));
      e.dataset.per = e.value;
    });
  });
});
