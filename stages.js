// 스토리/정답 데이터. 이 파일만 수정하면 됩니다.
// 정답은 tools/hash.html 에서 해시로 변환해 answerHash 에 붙여넣으세요. (trim + 소문자 기준)
//
// type:
//   'qr-scan'     카메라로 QR을 스캔. QR 안의 글자(payload)를 해시로 비교. (카메라 안 되면 직접 입력 가능)
//   'text-input'  글자/숫자 입력.  uppercase:true 면 대문자 입력, dial:N 이면 숫자 자물쇠 N칸
//   'multi-input' fields:[{label, answerHash, dial?}] 전부 맞아야 통과
//   'info-only'   읽고 "다음"
//   'gps' | 'ar'  위치/AR 퍼즐 (현재 흐름에서는 미사용)
// story:     스테이지 시작 시 타자기로 보여줄 글
// image:     스토리 아래 사진 (예: 'images/key1.jpg')
// failMsg:   오답일 때 문구 (없으면 기본 문구)
// hints:     ['힌트1', '힌트2'] 순서대로 열림
// nextStory / nextImage: 클리어 후 보여줄 지령 / 사진
// theme:     'warm' 이면 따뜻한 톤
// ※ 사진을 추가하면 sw.js 의 ASSETS 에도 추가하고 CACHE 버전을 올릴 것!
//
// ---- 샘플 정답 (테스트용) ----
// QR payload: memory-01(식탁) memory-02(스토리지) memory-03(우편함) memory-04(트렁크) memory-05(본넷)
// 11번 사진 순서대로 1,2,3
// 2번 P1=126 P2=128 / 4번 BOX / 6번 1234 (초록12 검정34) / 8번 1115 / 10번 초5 검6 파7 빨8 (자물쇠)
// 사진은 전부 images/sample.svg placeholder 입니다.

const STAGES = [
  {
    id: 1, title: '기억의 파편', type: 'qr-scan',
    story: '우리가 지난 1년간 기억의 파편들을 떨구고 다녔다는 걸 어젯밤에야 알아차렸어.\n더 늦기 전에 내가 먼저 찾으러 떠나야 할 것 같아.\n\n이건 너도 꼭 찾아야 하는 파편들이야. 내가 찾는 대로 네게 힌트를 놓고 갈게.\n\n먼저 식탁으로 나가 봐. 식탁 위에 내가 두고 간 힌트가 있을 거야.',
    scanLabel: '📷 식탁 위 QR 스캔',
    answerHash: '803dfde39a104a663af5e4ed9f5ca026e160f07adbe9352a38bf95ed937ac7cf', // memory-01
    hints: ['식탁 위를 잘 둘러보세요. 작은 QR 코드가 있어요.'],
    nextStory: ''
  },
  {
    id: 2, title: '가장 최근의 기억', type: 'multi-input',
    story: '가장 최근 일부터 차근차근 돌아보자.\n우리가 요즘 푹 빠진 건 아무래도 보드게임이지. 여기 우리 둘이 하던 하모니즈야.\nP1은 나, P2는 너. 아직 네 차례가 한 번 남았네.\n\n가능한 최고의 수를 찾아서 마지막 한 턴을 플레이해 줘. 그다음 너와 내 점수를 계산해서 알려줬으면 해.',
    fields: [
      { label: 'P1 (나) 점수', dial: 3, answerHash: '65a699905c02619370bcf9207f5a477c3d67130ca71ec6f750e07fe8d510b084' }, // 126
      { label: 'P2 (너) 점수', dial: 3, answerHash: '2747b7c718564ba5f066f0523b03e17f6a496b06851333d2d59ab6d863225848' }  // 128
    ],
    failMsg: '최선의 수를 못 찾았거나, 점수 계산에 실수가 있었던 것 같아. 한 번만 더 살펴볼까?',
    hints: [
      '한 턴에 할 수 있는 행동은 타일 가져가기, 동물 카드 가져가기가 있습니다.',
      '가져가야 하는 타일은 건물, 돌, 들판입니다.',
      '가져가야 하는 동물 카드는 까마귀입니다.'
    ],
    nextStory: '역시 가장 최근의 기억이라 그런지 잘 기억하네. 좋아!\n\n너랑 나, 두 사람의 점수 잊지 마. 곧 쓰일 거야.\n\n이 사진이 가리키는 곳에서 작은 열쇠를 챙겨서 지하 5층 스토리지로 와. 다음 기억은 거기 있어.',
    nextImage: 'images/sample.svg' // 작은 열쇠 1 위치
  },
  {
    id: 3, title: '지하 5층 스토리지', type: 'qr-scan',
    story: '스토리지에 도착했으면 문에 붙어 있는 QR 코드를 스캔해 줘.',
    scanLabel: '📷 스토리지 QR 스캔',
    answerHash: '4f0460573c4585bc88eb47a1c467fa9bbed93c295c40fcb675fc5a8461cc676e', // memory-02
    hints: ['스토리지 문이나 자물쇠 근처를 찾아보세요.'],
    nextStory: '아까 맞춘 두 점수로 자물쇠 두 개를 열어 봐.\n그리고 안으로 들어가서 다음 이야기를 들어 줘.'
  },
  {
    id: 4, title: '사라진 짐', type: 'text-input',
    story: '얼마 전엔 장모님 짐도 들어오고, 너도 한국에 다녀오면서 이것저것 들여오는 바람에 창고에 뭐가 얼마나 있는지 모르겠어.\n내가 찾는 짐이 하나 있는데, 찾는 걸 도와줬으면 해.\n\n내가 찾는 짐은:\n· 바닥에 닿아 있지 않고\n· 위에 아무것도 없고\n· 벽에 한 면 이상 닿아 있고\n· 옆에 더 큰 박스가 있어.\n\n그 짐을 찾아서, 짐에 적힌 첫 번째 단어를 입력해 줘.',
    placeholder: '대문자 단어',
    uppercase: true,
    answerHash: '26f8567f2569182294c3fa5b9f9cb2270b554eef628b4c149cf82a42888ff4ae', // BOX
    failMsg: '음… 그 짐은 아닌 것 같아. 조건 네 개를 다시 하나씩 확인해 볼까?',
    hints: [
      '네 조건을 모두 만족하는 박스는 단 하나뿐이에요.',
      '벽, 바닥, 위, 옆. 차례대로 하나씩 지워 가며 후보를 줄여 보세요.'
    ],
    nextStory: '역시 네가 정리한 곳이라 잘 알고 있네!\n\n내 전동 낚시 릴 박스 안에 다음 미션에 필요한 것들이 들어 있을 거야.\n우편함도 확인한 지 오래된 것 같은데, 다음은 우편함으로 가 보자.',
    nextImage: 'images/sample.svg' // 우편함 열쇠 + 작은 열쇠 2
  },
  {
    id: 5, title: '우편함', type: 'qr-scan',
    story: '우편함 열쇠로 메일을 열어 봐.\n차키와 작은 열쇠 3, 그리고 QR 코드가 들어 있을 거야.',
    scanLabel: '📷 우편함 QR 스캔',
    answerHash: 'ea07c202b2a98e77d6cb7ae72b2d33dc033f1059308c9e8aee24d41e5717594b', // memory-03
    hints: ['우편함 안쪽, 차키 가까이에 QR이 있어요.'],
    nextStory: ''
  },
  {
    id: 6, title: '마당의 기억', type: 'text-input',
    story: '차키를 보자마자 차로 달려가고 싶겠지. 하지만 그 전에 해결할 일이 있어.\n\n파스타 대회 때 우리 집 마당에서 잠깐 놀았잖아. 그때도 뭔가를 떨어뜨렸던 것 같아.\n\n다음 사진이 네가 어디로 가야 하는지 알려줄 거야.',
    image: 'images/sample.svg', // geometric climbing gym 사진
    dial: 4,
    dialColors: ['green', 'green', 'black', 'black'], // 초록 두 자리 + 검정 두 자리 (문구에 '손잡이' 언급 금지)
    answerHash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', // 1234
    failMsg: '숫자가 조금 달라 보여. 사진 속 그곳을 다시 한 번 찬찬히 살펴볼까?',
    hints: [
      '그림에서 보이는 물체는 바깥에 있어요.',
      '보이는 물체에 튀어나온 부분들을 확인하세요.',
      '물체는 정문에서 나가면 보입니다.'
    ],
    nextStory: '꽤 익숙해진 모양이네, 이젠 제법 잘 찾는데?\n거의 다 모은 것 같으니 조금만 더 힘내자. 지금부턴 더 집중해야 할 거야.\n\n엘랑이 트렁크 안에 내가 중요한 물건을 넣어 뒀던 걸로 기억해. 지하 5층에서 보자.',
    nextImage: 'images/sample.svg' // 작은 열쇠 4
  },
  {
    id: 7, title: '자동차 트렁크', type: 'qr-scan',
    story: '트렁크를 열면 숫자 잠금장치가 달린 작은 열쇠 상자가 보일 거야.\n상자 근처의 QR 코드를 스캔해 줘.',
    scanLabel: '📷 트렁크 QR 스캔',
    answerHash: '6e9a73689f67931750501ad0e82f9c0d97732e6bb10e669eacc6d3a7b03375f4', // memory-04
    hints: ['열쇠 상자 가까이 어딘가에 붙어 있어요.'],
    nextStory: ''
  },
  {
    id: 8, title: '열쇠 상자', type: 'text-input',
    story: '이 열쇠 상자 안에 내가 중요한 걸 넣어 둔 것 같은데, 뭐였는지 기억이 안 나네…\n비밀번호는 뭔가 중요한 날짜였던 것 같아.\n\n[퀴즈 placeholder]',
    dial: 4,
    answerHash: '71af0fdd2e7f62c1c351432a69fdf8f6579e9dce0c12c2b3af90f964540bdb83', // 1115
    failMsg: '상자가 열리지 않아. 우리에게 가장 중요한 날짜가 맞을까?',
    hints: ['우리 둘 사이가 변한 날짜입니다'],
    nextStory: '기억났어! 한국에서 돌아오자마자 엘랑이 배터리가 나가서 고생했었지.\n\n이 후레쉬로 본넷 근처를 잘 찾아봐. 뭔가 실마리가 보일 거야.'
  },
  {
    id: 9, title: '본넷의 실마리', type: 'qr-scan',
    story: '',
    scanLabel: '📷 QR 스캔',
    answerHash: '2d7fa04f0a0600a3ac89516336f4f5296ef7889ffeca6e9ef9097f5386f59855', // memory-05
    hints: ['[힌트 placeholder]'],
    nextStory: ''
  },
  {
    id: 10, title: '네 가지 색', type: 'multi-input',
    story: '',
    row: true, // 가로 정렬. 자릿수가 다르면 각 필드의 dial 값을 바꾸세요 (현재 1자리)
    fields: [
      { dial: 1, dialColors: ['green'], answerHash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d' }, // 5
      { dial: 1, dialColors: ['black'], answerHash: 'e7f6c011776e8db7cd330b54174fd76f7d0216b612387a5ffcfb81e6f0919683' }, // 6
      { dial: 1, dialColors: ['blue'],  answerHash: '7902699be42c8a8e46fbbb4501726517e86b22c56a189f7625a6da49081b2451' }, // 7
      { dial: 1, dialColors: ['red'],   answerHash: '2c624232cdd221771294dfbb310aca000a0df6ac8b66b696d90ef06fdefb64a3' }  // 8
    ],
    failMsg: '계산이 조금 어긋난 것 같아. 색깔과 수식이 짝이 맞는지 다시 볼까?',
    hints: ['[힌트 placeholder]'],
    nextStory: '좋아, 이게 마지막 파편인 것 같아.\n\n이 사진에 있는 곳에 마지막 파편들이 있을 거야. 그걸 통해 마지막 문제를 풀어줘.',
    nextImage: 'images/sample.svg' // 마지막 파편들이 있는 장소 사진
  },
  {
    id: 11, title: '마지막 조각', type: 'multi-input',
    story: '',
    row: true, // 사진 3장을 가로로. 자릿수가 다르면 dial 값을 바꾸세요 (현재 1자리)
    fields: [
      { image: 'images/sample.svg', dial: 1, answerHash: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b' }, // 1
      { image: 'images/sample.svg', dial: 1, answerHash: 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35' }, // 2
      { image: 'images/sample.svg', dial: 1, answerHash: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce' }  // 3
    ],
    failMsg: '조금 어긋난 것 같아. 사진과 열쇠가 짝이 맞는지 다시 볼까?',
    hints: ['[힌트 placeholder]'],
    nextStory: '이제 거의 다 모은 것 같네. 마지막 기억의 파편 몇 조각만 모으면 돼.\n\n우리가 1년 동안 가장 가깝게 지낸 사람들을 만나러 가자.\n사진 속 장소에서, 그들이 있는 곳으로 갈 수 있는 열쇠를 찾을 수 있을 거야.',
    nextImage: 'images/sample.svg' // 자동차 내 fob key 숨겨둔 곳
  }
];
