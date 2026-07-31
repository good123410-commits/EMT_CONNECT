/** 전국 시·도 / 시·군·구 단위 지역 목록 (시설 데이터 기반 255개) */

export type KoreanSigunguUnit = {
  code: string;
  sido: string;
  sigungu: string;
  displayName: string;
  label: string;
};

export type KoreanProvince = {
  code: string;
  name: string;
  sigungu: KoreanSigunguUnit[];
};

export const KOREAN_PROVINCES: KoreanProvince[] = [
  {
    "code": "gangwon",
    "name": "강원특별자치도",
    "sigungu": [
      {
        "code": "gangwon-6rCV66aJ7I",
        "sido": "강원특별자치도",
        "sigungu": "강릉시",
        "displayName": "강릉시",
        "label": "강원특별자치도 강릉시"
      },
      {
        "code": "gangwon-6rOg7ISx6r",
        "sido": "강원특별자치도",
        "sigungu": "고성군",
        "displayName": "고성군",
        "label": "강원특별자치도 고성군"
      },
      {
        "code": "gangwon-64Z7ZW07Iu",
        "sido": "강원특별자치도",
        "sigungu": "동해시",
        "displayName": "동해시",
        "label": "강원특별자치도 동해시"
      },
      {
        "code": "gangwon-7IK87LKZ7I",
        "sido": "강원특별자치도",
        "sigungu": "삼척시",
        "displayName": "삼척시",
        "label": "강원특별자치도 삼척시"
      },
      {
        "code": "gangwon-7IaN7LSI7I",
        "sido": "강원특별자치도",
        "sigungu": "속초시",
        "displayName": "속초시",
        "label": "강원특별자치도 속초시"
      },
      {
        "code": "gangwon-7JaR6rWs6r",
        "sido": "강원특별자치도",
        "sigungu": "양구군",
        "displayName": "양구군",
        "label": "강원특별자치도 양구군"
      },
      {
        "code": "gangwon-7JaR7JaR6r",
        "sido": "강원특별자치도",
        "sigungu": "양양군",
        "displayName": "양양군",
        "label": "강원특별자치도 양양군"
      },
      {
        "code": "gangwon-7JiB7JuU6r",
        "sido": "강원특별자치도",
        "sigungu": "영월군",
        "displayName": "영월군",
        "label": "강원특별자치도 영월군"
      },
      {
        "code": "gangwon-7JuQ7KO87I",
        "sido": "강원특별자치도",
        "sigungu": "원주시",
        "displayName": "원주시",
        "label": "강원특별자치도 원주시"
      },
      {
        "code": "gangwon-7J247KCc6r",
        "sido": "강원특별자치도",
        "sigungu": "인제군",
        "displayName": "인제군",
        "label": "강원특별자치도 인제군"
      },
      {
        "code": "gangwon-7KCV7ISg6r",
        "sido": "강원특별자치도",
        "sigungu": "정선군",
        "displayName": "정선군",
        "label": "강원특별자치도 정선군"
      },
      {
        "code": "gangwon-7LKg7JuQ6r",
        "sido": "강원특별자치도",
        "sigungu": "철원군",
        "displayName": "철원군",
        "label": "강원특별자치도 철원군"
      },
      {
        "code": "gangwon-7LaY7LKc7I",
        "sido": "강원특별자치도",
        "sigungu": "춘천시",
        "displayName": "춘천시",
        "label": "강원특별자치도 춘천시"
      },
      {
        "code": "gangwon-7YOc67Cx7I",
        "sido": "강원특별자치도",
        "sigungu": "태백시",
        "displayName": "태백시",
        "label": "강원특별자치도 태백시"
      },
      {
        "code": "gangwon-7YJ7LC96rW",
        "sido": "강원특별자치도",
        "sigungu": "평창군",
        "displayName": "평창군",
        "label": "강원특별자치도 평창군"
      },
      {
        "code": "gangwon-7ZmN7LKc6r",
        "sido": "강원특별자치도",
        "sigungu": "홍천군",
        "displayName": "홍천군",
        "label": "강원특별자치도 홍천군"
      },
      {
        "code": "gangwon-7ZmU7LKc6r",
        "sido": "강원특별자치도",
        "sigungu": "화천군",
        "displayName": "화천군",
        "label": "강원특별자치도 화천군"
      },
      {
        "code": "gangwon-7Zqh7ISx6r",
        "sido": "강원특별자치도",
        "sigungu": "횡성군",
        "displayName": "횡성군",
        "label": "강원특별자치도 횡성군"
      }
    ]
  },
  {
    "code": "gyeonggi",
    "name": "경기도",
    "sigungu": [
      {
        "code": "gyeonggi-6rCA7YJ6rW",
        "sido": "경기도",
        "sigungu": "가평군",
        "displayName": "가평군",
        "label": "경기도 가평군"
      },
      {
        "code": "gyeonggi-6rOg7JaR64",
        "sido": "경기도",
        "sigungu": "고양덕양구",
        "displayName": "덕양구",
        "label": "경기도 덕양구"
      },
      {
        "code": "gyeonggi-6rOg7JaR7J",
        "sido": "경기도",
        "sigungu": "고양일산동구",
        "displayName": "일산동구",
        "label": "경기도 일산동구"
      },
      {
        "code": "gyeonggi-6rOg7JaR7J2",
        "sido": "경기도",
        "sigungu": "고양일산서구",
        "displayName": "일산서구",
        "label": "경기도 일산서구"
      },
      {
        "code": "gyeonggi-6rO87LKc7I",
        "sido": "경기도",
        "sigungu": "과천시",
        "displayName": "과천시",
        "label": "경기도 과천시"
      },
      {
        "code": "gyeonggi-6rSR66qF7I",
        "sido": "경기도",
        "sigungu": "광명시",
        "displayName": "광명시",
        "label": "경기도 광명시"
      },
      {
        "code": "gyeonggi-6rSR7KO87I",
        "sido": "경기도",
        "sigungu": "광주시",
        "displayName": "시",
        "label": "경기도 시"
      },
      {
        "code": "gyeonggi-6rWs66as7I",
        "sido": "경기도",
        "sigungu": "구리시",
        "displayName": "구리시",
        "label": "경기도 구리시"
      },
      {
        "code": "gyeonggi-6rWw7Ys7Iu",
        "sido": "경기도",
        "sigungu": "군포시",
        "displayName": "군포시",
        "label": "경기도 군포시"
      },
      {
        "code": "gyeonggi-6rmA7Ys7Iu",
        "sido": "경기도",
        "sigungu": "김포시",
        "displayName": "김포시",
        "label": "경기도 김포시"
      },
      {
        "code": "gyeonggi-64Ko7JaR7K",
        "sido": "경기도",
        "sigungu": "남양주시",
        "displayName": "남양주시",
        "label": "경기도 남양주시"
      },
      {
        "code": "gyeonggi-64Z65GQ7LK",
        "sido": "경기도",
        "sigungu": "동두천시",
        "displayName": "동두천시",
        "label": "경기도 동두천시"
      },
      {
        "code": "gyeonggi-67aA7LKc7I",
        "sido": "경기도",
        "sigungu": "부천소사구",
        "displayName": "소사구",
        "label": "경기도 소사구"
      },
      {
        "code": "gyeonggi-67aA7LKc7J",
        "sido": "경기도",
        "sigungu": "부천오정구",
        "displayName": "오정구",
        "label": "경기도 오정구"
      },
      {
        "code": "gyeonggi-67aA7LKc7J2",
        "sido": "경기도",
        "sigungu": "부천원미구",
        "displayName": "원미구",
        "label": "경기도 원미구"
      },
      {
        "code": "gyeonggi-7ISx64Ko67",
        "sido": "경기도",
        "sigungu": "성남분당구",
        "displayName": "분당구",
        "label": "경기도 분당구"
      },
      {
        "code": "gyeonggi-7ISx64Ko7I",
        "sido": "경기도",
        "sigungu": "성남수정구",
        "displayName": "수정구",
        "label": "경기도 수정구"
      },
      {
        "code": "gyeonggi-7ISx64Ko7K",
        "sido": "경기도",
        "sigungu": "성남중원구",
        "displayName": "중원구",
        "label": "경기도 중원구"
      },
      {
        "code": "gyeonggi-7IiY7JuQ6r",
        "sido": "경기도",
        "sigungu": "수원권선구",
        "displayName": "권선구",
        "label": "경기도 권선구"
      },
      {
        "code": "gyeonggi-7IiY7JuQ7J",
        "sido": "경기도",
        "sigungu": "수원영통구",
        "displayName": "영통구",
        "label": "경기도 영통구"
      },
      {
        "code": "gyeonggi-7IiY7JuQ7J2",
        "sido": "경기도",
        "sigungu": "수원장안구",
        "displayName": "장안구",
        "label": "경기도 장안구"
      },
      {
        "code": "gyeonggi-7IiY7JuQ7Y",
        "sido": "경기도",
        "sigungu": "수원팔달구",
        "displayName": "팔달구",
        "label": "경기도 팔달구"
      },
      {
        "code": "gyeonggi-7Iuc7Z2l7I",
        "sido": "경기도",
        "sigungu": "시흥시",
        "displayName": "시흥시",
        "label": "경기도 시흥시"
      },
      {
        "code": "gyeonggi-7JWI7IKw64",
        "sido": "경기도",
        "sigungu": "안산단원구",
        "displayName": "단원구",
        "label": "경기도 단원구"
      },
      {
        "code": "gyeonggi-7JWI7IKw7I",
        "sido": "경기도",
        "sigungu": "안산상록구",
        "displayName": "상록구",
        "label": "경기도 상록구"
      },
      {
        "code": "gyeonggi-7JWI7ISx7I",
        "sido": "경기도",
        "sigungu": "안성시",
        "displayName": "안성시",
        "label": "경기도 안성시"
      },
      {
        "code": "gyeonggi-7JWI7JaR64",
        "sido": "경기도",
        "sigungu": "안양동안구",
        "displayName": "동안구",
        "label": "경기도 동안구"
      },
      {
        "code": "gyeonggi-7JWI7JaR66",
        "sido": "경기도",
        "sigungu": "안양만안구",
        "displayName": "만안구",
        "label": "경기도 만안구"
      },
      {
        "code": "gyeonggi-7JaR7KO87I",
        "sido": "경기도",
        "sigungu": "양주시",
        "displayName": "양주시",
        "label": "경기도 양주시"
      },
      {
        "code": "gyeonggi-7JaR7YJ6rW",
        "sido": "경기도",
        "sigungu": "양평군",
        "displayName": "양평군",
        "label": "경기도 양평군"
      },
      {
        "code": "gyeonggi-7Jes7KO87I",
        "sido": "경기도",
        "sigungu": "여주시",
        "displayName": "여주시",
        "label": "경기도 여주시"
      },
      {
        "code": "gyeonggi-7Jew7LKc6r",
        "sido": "경기도",
        "sigungu": "연천군",
        "displayName": "연천군",
        "label": "경기도 연천군"
      },
      {
        "code": "gyeonggi-7Jik7IKw7I",
        "sido": "경기도",
        "sigungu": "오산시",
        "displayName": "오산시",
        "label": "경기도 오산시"
      },
      {
        "code": "gyeonggi-7Jqp7J246r",
        "sido": "경기도",
        "sigungu": "용인기흥구",
        "displayName": "기흥구",
        "label": "경기도 기흥구"
      },
      {
        "code": "gyeonggi-7Jqp7J247I",
        "sido": "경기도",
        "sigungu": "용인수지구",
        "displayName": "수지구",
        "label": "경기도 수지구"
      },
      {
        "code": "gyeonggi-7Jqp7J247L",
        "sido": "경기도",
        "sigungu": "용인처인구",
        "displayName": "처인구",
        "label": "경기도 처인구"
      },
      {
        "code": "gyeonggi-7J2Y7JmV7I",
        "sido": "경기도",
        "sigungu": "의왕시",
        "displayName": "의왕시",
        "label": "경기도 의왕시"
      },
      {
        "code": "gyeonggi-7J2Y7KCV67",
        "sido": "경기도",
        "sigungu": "의정부시",
        "displayName": "의정부시",
        "label": "경기도 의정부시"
      },
      {
        "code": "gyeonggi-7J207LKc7I",
        "sido": "경기도",
        "sigungu": "이천시",
        "displayName": "이천시",
        "label": "경기도 이천시"
      },
      {
        "code": "gyeonggi-7YyM7KO87I",
        "sido": "경기도",
        "sigungu": "파주시",
        "displayName": "파주시",
        "label": "경기도 파주시"
      },
      {
        "code": "gyeonggi-7YJ7YOd7Iu",
        "sido": "경기도",
        "sigungu": "평택시",
        "displayName": "평택시",
        "label": "경기도 평택시"
      },
      {
        "code": "gyeonggi-7Ys7LKc7Iu",
        "sido": "경기도",
        "sigungu": "포천시",
        "displayName": "포천시",
        "label": "경기도 포천시"
      },
      {
        "code": "gyeonggi-7ZWY64Ko7I",
        "sido": "경기도",
        "sigungu": "하남시",
        "displayName": "하남시",
        "label": "경기도 하남시"
      },
      {
        "code": "gyeonggi-7ZmU7ISx64",
        "sido": "경기도",
        "sigungu": "화성동탄구",
        "displayName": "동탄구",
        "label": "경기도 동탄구"
      },
      {
        "code": "gyeonggi-7ZmU7ISx66",
        "sido": "경기도",
        "sigungu": "화성만세구",
        "displayName": "만세구",
        "label": "경기도 만세구"
      },
      {
        "code": "gyeonggi-7ZmU7ISx67",
        "sido": "경기도",
        "sigungu": "화성병점구",
        "displayName": "병점구",
        "label": "경기도 병점구"
      },
      {
        "code": "gyeonggi-7ZmU7ISx7Z",
        "sido": "경기도",
        "sigungu": "화성효행구",
        "displayName": "효행구",
        "label": "경기도 효행구"
      }
    ]
  },
  {
    "code": "gyeongnam",
    "name": "경상남도",
    "sigungu": [
      {
        "code": "gyeongnam-6rGw7KCc7I",
        "sido": "경상남도",
        "sigungu": "거제시",
        "displayName": "거제시",
        "label": "경상남도 거제시"
      },
      {
        "code": "gyeongnam-6rGw7LC96r",
        "sido": "경상남도",
        "sigungu": "거창군",
        "displayName": "거창군",
        "label": "경상남도 거창군"
      },
      {
        "code": "gyeongnam-6rOg7ISx6r",
        "sido": "경상남도",
        "sigungu": "고성군",
        "displayName": "고성군",
        "label": "경상남도 고성군"
      },
      {
        "code": "gyeongnam-6rmA7ZW07I",
        "sido": "경상남도",
        "sigungu": "김해시",
        "displayName": "김해시",
        "label": "경상남도 김해시"
      },
      {
        "code": "gyeongnam-64Ko7ZW06r",
        "sido": "경상남도",
        "sigungu": "남해군",
        "displayName": "남해군",
        "label": "경상남도 남해군"
      },
      {
        "code": "gyeongnam-67CA7JaR7I",
        "sido": "경상남도",
        "sigungu": "밀양시",
        "displayName": "밀양시",
        "label": "경상남도 밀양시"
      },
      {
        "code": "gyeongnam-7IKs7LKc7I",
        "sido": "경상남도",
        "sigungu": "사천시",
        "displayName": "사천시",
        "label": "경상남도 사천시"
      },
      {
        "code": "gyeongnam-7IKw7LKt6r",
        "sido": "경상남도",
        "sigungu": "산청군",
        "displayName": "산청군",
        "label": "경상남도 산청군"
      },
      {
        "code": "gyeongnam-7JaR7IKw7I",
        "sido": "경상남도",
        "sigungu": "양산시",
        "displayName": "양산시",
        "label": "경상남도 양산시"
      },
      {
        "code": "gyeongnam-7J2Y66C56r",
        "sido": "경상남도",
        "sigungu": "의령군",
        "displayName": "의령군",
        "label": "경상남도 의령군"
      },
      {
        "code": "gyeongnam-7KeE7KO87I",
        "sido": "경상남도",
        "sigungu": "진주시",
        "displayName": "진주시",
        "label": "경상남도 진주시"
      },
      {
        "code": "gyeongnam-7LC964WV6r",
        "sido": "경상남도",
        "sigungu": "창녕군",
        "displayName": "창녕군",
        "label": "경상남도 창녕군"
      },
      {
        "code": "gyeongnam-7LC97JuQ66",
        "sido": "경상남도",
        "sigungu": "창원마산합포구",
        "displayName": "창원마산합포구",
        "label": "경상남도 창원마산합포구"
      },
      {
        "code": "gyeongnam-7LC97JuQ662",
        "sido": "경상남도",
        "sigungu": "창원마산회원구",
        "displayName": "창원마산회원구",
        "label": "경상남도 창원마산회원구"
      },
      {
        "code": "gyeongnam-7LC97JuQ7I",
        "sido": "경상남도",
        "sigungu": "창원성산구",
        "displayName": "창원성산구",
        "label": "경상남도 창원성산구"
      },
      {
        "code": "gyeongnam-7LC97JuQ7J",
        "sido": "경상남도",
        "sigungu": "창원의창구",
        "displayName": "창원의창구",
        "label": "경상남도 창원의창구"
      },
      {
        "code": "gyeongnam-7LC97JuQ7K",
        "sido": "경상남도",
        "sigungu": "창원진해구",
        "displayName": "창원진해구",
        "label": "경상남도 창원진해구"
      },
      {
        "code": "gyeongnam-7Ya17JiB7I",
        "sido": "경상남도",
        "sigungu": "통영시",
        "displayName": "통영시",
        "label": "경상남도 통영시"
      },
      {
        "code": "gyeongnam-7ZWY64Z6rW",
        "sido": "경상남도",
        "sigungu": "하동군",
        "displayName": "하동군",
        "label": "경상남도 하동군"
      },
      {
        "code": "gyeongnam-7ZWo7JWI6r",
        "sido": "경상남도",
        "sigungu": "함안군",
        "displayName": "함안군",
        "label": "경상남도 함안군"
      },
      {
        "code": "gyeongnam-7ZWo7JaR6r",
        "sido": "경상남도",
        "sigungu": "함양군",
        "displayName": "함양군",
        "label": "경상남도 함양군"
      },
      {
        "code": "gyeongnam-7ZWp7LKc6r",
        "sido": "경상남도",
        "sigungu": "합천군",
        "displayName": "합천군",
        "label": "경상남도 합천군"
      }
    ]
  },
  {
    "code": "gyeongbuk",
    "name": "경상북도",
    "sigungu": [
      {
        "code": "gyeongbuk-6rK97IKw7I",
        "sido": "경상북도",
        "sigungu": "경산시",
        "displayName": "경산시",
        "label": "경상북도 경산시"
      },
      {
        "code": "gyeongbuk-6rK97KO87I",
        "sido": "경상북도",
        "sigungu": "경주시",
        "displayName": "경주시",
        "label": "경상북도 경주시"
      },
      {
        "code": "gyeongbuk-6rOg66C56r",
        "sido": "경상북도",
        "sigungu": "고령군",
        "displayName": "고령군",
        "label": "경상북도 고령군"
      },
      {
        "code": "gyeongbuk-6rWs6647Iu",
        "sido": "경상북도",
        "sigungu": "구미시",
        "displayName": "구미시",
        "label": "경상북도 구미시"
      },
      {
        "code": "gyeongbuk-6rmA7LKc7I",
        "sido": "경상북도",
        "sigungu": "김천시",
        "displayName": "김천시",
        "label": "경상북도 김천시"
      },
      {
        "code": "gyeongbuk-66y46rK97I",
        "sido": "경상북도",
        "sigungu": "문경시",
        "displayName": "문경시",
        "label": "경상북도 문경시"
      },
      {
        "code": "gyeongbuk-67SJ7ZmU6r",
        "sido": "경상북도",
        "sigungu": "봉화군",
        "displayName": "봉화군",
        "label": "경상북도 봉화군"
      },
      {
        "code": "gyeongbuk-7IOB7KO87I",
        "sido": "경상북도",
        "sigungu": "상주시",
        "displayName": "상주시",
        "label": "경상북도 상주시"
      },
      {
        "code": "gyeongbuk-7ISx7KO86r",
        "sido": "경상북도",
        "sigungu": "성주군",
        "displayName": "성주군",
        "label": "경상북도 성주군"
      },
      {
        "code": "gyeongbuk-7JWI64Z7Iu",
        "sido": "경상북도",
        "sigungu": "안동시",
        "displayName": "안동시",
        "label": "경상북도 안동시"
      },
      {
        "code": "gyeongbuk-7JiB642V6r",
        "sido": "경상북도",
        "sigungu": "영덕군",
        "displayName": "영덕군",
        "label": "경상북도 영덕군"
      },
      {
        "code": "gyeongbuk-7JiB7JaR6r",
        "sido": "경상북도",
        "sigungu": "영양군",
        "displayName": "영양군",
        "label": "경상북도 영양군"
      },
      {
        "code": "gyeongbuk-7JiB7KO87I",
        "sido": "경상북도",
        "sigungu": "영주시",
        "displayName": "영주시",
        "label": "경상북도 영주시"
      },
      {
        "code": "gyeongbuk-7JiB7LKc7I",
        "sido": "경상북도",
        "sigungu": "영천시",
        "displayName": "영천시",
        "label": "경상북도 영천시"
      },
      {
        "code": "gyeongbuk-7JiI7LKc6r",
        "sido": "경상북도",
        "sigungu": "예천군",
        "displayName": "예천군",
        "label": "경상북도 예천군"
      },
      {
        "code": "gyeongbuk-7Jq466aJ6r",
        "sido": "경상북도",
        "sigungu": "울릉군",
        "displayName": "울릉군",
        "label": "경상북도 울릉군"
      },
      {
        "code": "gyeongbuk-7Jq47KeE6r",
        "sido": "경상북도",
        "sigungu": "울진군",
        "displayName": "울진군",
        "label": "경상북도 울진군"
      },
      {
        "code": "gyeongbuk-7J2Y7ISx6r",
        "sido": "경상북도",
        "sigungu": "의성군",
        "displayName": "의성군",
        "label": "경상북도 의성군"
      },
      {
        "code": "gyeongbuk-7LKt64E6rW",
        "sido": "경상북도",
        "sigungu": "청도군",
        "displayName": "청도군",
        "label": "경상북도 청도군"
      },
      {
        "code": "gyeongbuk-7LKt7Iah6r",
        "sido": "경상북도",
        "sigungu": "청송군",
        "displayName": "청송군",
        "label": "경상북도 청송군"
      },
      {
        "code": "gyeongbuk-7Lmg6rOh6r",
        "sido": "경상북도",
        "sigungu": "칠곡군",
        "displayName": "칠곡군",
        "label": "경상북도 칠곡군"
      },
      {
        "code": "gyeongbuk-7Ys7ZWt64K",
        "sido": "경상북도",
        "sigungu": "포항남구",
        "displayName": "포항남구",
        "label": "경상북도 포항남구"
      },
      {
        "code": "gyeongbuk-7Ys7ZWt67a",
        "sido": "경상북도",
        "sigungu": "포항북구",
        "displayName": "포항북구",
        "label": "경상북도 포항북구"
      }
    ]
  },
  {
    "code": "gwangju",
    "name": "광주광역시",
    "sigungu": [
      {
        "code": "gwangju-6rSR7KO86r",
        "sido": "광주광역시",
        "sigungu": "광주광산구",
        "displayName": "광산구",
        "label": "광주광역시 광산구"
      },
      {
        "code": "gwangju-6rSR7KO864",
        "sido": "광주광역시",
        "sigungu": "광주남구",
        "displayName": "남구",
        "label": "광주광역시 남구"
      },
      {
        "code": "gwangju-6rSR7KO8642",
        "sido": "광주광역시",
        "sigungu": "광주동구",
        "displayName": "동구",
        "label": "광주광역시 동구"
      },
      {
        "code": "gwangju-6rSR7KO867",
        "sido": "광주광역시",
        "sigungu": "광주북구",
        "displayName": "북구",
        "label": "광주광역시 북구"
      },
      {
        "code": "gwangju-6rSR7KO87I",
        "sido": "광주광역시",
        "sigungu": "광주서구",
        "displayName": "서구",
        "label": "광주광역시 서구"
      }
    ]
  },
  {
    "code": "daegu",
    "name": "대구광역시",
    "sigungu": [
      {
        "code": "daegu-64yA6rWs6r",
        "sido": "대구광역시",
        "sigungu": "대구군위군",
        "displayName": "군위군",
        "label": "대구광역시 군위군"
      },
      {
        "code": "daegu-64yA6rWs64",
        "sido": "대구광역시",
        "sigungu": "대구남구",
        "displayName": "남구",
        "label": "대구광역시 남구"
      },
      {
        "code": "daegu-64yA6rWs642",
        "sido": "대구광역시",
        "sigungu": "대구달서구",
        "displayName": "달서구",
        "label": "대구광역시 달서구"
      },
      {
        "code": "daegu-64yA6rWs643",
        "sido": "대구광역시",
        "sigungu": "대구달성군",
        "displayName": "달성군",
        "label": "대구광역시 달성군"
      },
      {
        "code": "daegu-64yA6rWs644",
        "sido": "대구광역시",
        "sigungu": "대구동구",
        "displayName": "동구",
        "label": "대구광역시 동구"
      },
      {
        "code": "daegu-64yA6rWs67",
        "sido": "대구광역시",
        "sigungu": "대구북구",
        "displayName": "북구",
        "label": "대구광역시 북구"
      },
      {
        "code": "daegu-64yA6rWs7I",
        "sido": "대구광역시",
        "sigungu": "대구서구",
        "displayName": "서구",
        "label": "대구광역시 서구"
      },
      {
        "code": "daegu-64yA6rWs7I2",
        "sido": "대구광역시",
        "sigungu": "대구수성구",
        "displayName": "수성구",
        "label": "대구광역시 수성구"
      },
      {
        "code": "daegu-64yA6rWs7K",
        "sido": "대구광역시",
        "sigungu": "대구중구",
        "displayName": "중구",
        "label": "대구광역시 중구"
      }
    ]
  },
  {
    "code": "daejeon",
    "name": "대전광역시",
    "sigungu": [
      {
        "code": "daejeon-64yA7KCE64",
        "sido": "대전광역시",
        "sigungu": "대전대덕구",
        "displayName": "대덕구",
        "label": "대전광역시 대덕구"
      },
      {
        "code": "daejeon-64yA7KCE642",
        "sido": "대전광역시",
        "sigungu": "대전동구",
        "displayName": "동구",
        "label": "대전광역시 동구"
      },
      {
        "code": "daejeon-64yA7KCE7I",
        "sido": "대전광역시",
        "sigungu": "대전서구",
        "displayName": "서구",
        "label": "대전광역시 서구"
      },
      {
        "code": "daejeon-64yA7KCE7J",
        "sido": "대전광역시",
        "sigungu": "대전유성구",
        "displayName": "유성구",
        "label": "대전광역시 유성구"
      },
      {
        "code": "daejeon-64yA7KCE7K",
        "sido": "대전광역시",
        "sigungu": "대전중구",
        "displayName": "중구",
        "label": "대전광역시 중구"
      }
    ]
  },
  {
    "code": "busan",
    "name": "부산광역시",
    "sigungu": [
      {
        "code": "busan-gangseo",
        "sido": "부산광역시",
        "sigungu": "부산강서구",
        "displayName": "강서구",
        "label": "부산광역시 강서구"
      },
      {
        "code": "busan-67aA7IKw6r",
        "sido": "부산광역시",
        "sigungu": "부산금정구",
        "displayName": "금정구",
        "label": "부산광역시 금정구"
      },
      {
        "code": "busan-67aA7IKw6r2",
        "sido": "부산광역시",
        "sigungu": "부산기장군",
        "displayName": "기장군",
        "label": "부산광역시 기장군"
      },
      {
        "code": "busan-67aA7IKw64",
        "sido": "부산광역시",
        "sigungu": "부산남구",
        "displayName": "남구",
        "label": "부산광역시 남구"
      },
      {
        "code": "busan-67aA7IKw642",
        "sido": "부산광역시",
        "sigungu": "부산동구",
        "displayName": "동구",
        "label": "부산광역시 동구"
      },
      {
        "code": "busan-67aA7IKw643",
        "sido": "부산광역시",
        "sigungu": "부산동래구",
        "displayName": "동래구",
        "label": "부산광역시 동래구"
      },
      {
        "code": "busan-67aA7IKw67",
        "sido": "부산광역시",
        "sigungu": "부산북구",
        "displayName": "북구",
        "label": "부산광역시 북구"
      },
      {
        "code": "busan-67aA7IKw7I",
        "sido": "부산광역시",
        "sigungu": "부산사상구",
        "displayName": "사상구",
        "label": "부산광역시 사상구"
      },
      {
        "code": "busan-67aA7IKw7I2",
        "sido": "부산광역시",
        "sigungu": "부산사하구",
        "displayName": "사하구",
        "label": "부산광역시 사하구"
      },
      {
        "code": "busan-67aA7IKw7I3",
        "sido": "부산광역시",
        "sigungu": "부산서구",
        "displayName": "서구",
        "label": "부산광역시 서구"
      },
      {
        "code": "busan-67aA7IKw7I4",
        "sido": "부산광역시",
        "sigungu": "부산수영구",
        "displayName": "수영구",
        "label": "부산광역시 수영구"
      },
      {
        "code": "busan-67aA7IKw7J",
        "sido": "부산광역시",
        "sigungu": "부산연제구",
        "displayName": "연제구",
        "label": "부산광역시 연제구"
      },
      {
        "code": "busan-67aA7IKw7J2",
        "sido": "부산광역시",
        "sigungu": "부산영도구",
        "displayName": "영도구",
        "label": "부산광역시 영도구"
      },
      {
        "code": "busan-67aA7IKw7K",
        "sido": "부산광역시",
        "sigungu": "부산중구",
        "displayName": "중구",
        "label": "부산광역시 중구"
      },
      {
        "code": "busan-67aA7IKw7K2",
        "sido": "부산광역시",
        "sigungu": "부산진구",
        "displayName": "진구",
        "label": "부산광역시 진구"
      },
      {
        "code": "busan-haeundae",
        "sido": "부산광역시",
        "sigungu": "부산해운대구",
        "displayName": "해운대구",
        "label": "부산광역시 해운대구"
      }
    ]
  },
  {
    "code": "seoul",
    "name": "서울특별시",
    "sigungu": [
      {
        "code": "seoul-gangnam",
        "sido": "서울특별시",
        "sigungu": "강남구",
        "displayName": "강남구",
        "label": "서울특별시 강남구"
      },
      {
        "code": "seoul-gangdong",
        "sido": "서울특별시",
        "sigungu": "강동구",
        "displayName": "강동구",
        "label": "서울특별시 강동구"
      },
      {
        "code": "seoul-gangbuk",
        "sido": "서울특별시",
        "sigungu": "강북구",
        "displayName": "강북구",
        "label": "서울특별시 강북구"
      },
      {
        "code": "seoul-gangseo",
        "sido": "서울특별시",
        "sigungu": "강서구",
        "displayName": "강서구",
        "label": "서울특별시 강서구"
      },
      {
        "code": "seoul-gwanak",
        "sido": "서울특별시",
        "sigungu": "관악구",
        "displayName": "관악구",
        "label": "서울특별시 관악구"
      },
      {
        "code": "seoul-gwangjin",
        "sido": "서울특별시",
        "sigungu": "광진구",
        "displayName": "광진구",
        "label": "서울특별시 광진구"
      },
      {
        "code": "seoul-guro",
        "sido": "서울특별시",
        "sigungu": "구로구",
        "displayName": "구로구",
        "label": "서울특별시 구로구"
      },
      {
        "code": "seoul-geumcheon",
        "sido": "서울특별시",
        "sigungu": "금천구",
        "displayName": "금천구",
        "label": "서울특별시 금천구"
      },
      {
        "code": "seoul-nowon",
        "sido": "서울특별시",
        "sigungu": "노원구",
        "displayName": "노원구",
        "label": "서울특별시 노원구"
      },
      {
        "code": "seoul-dobong",
        "sido": "서울특별시",
        "sigungu": "도봉구",
        "displayName": "도봉구",
        "label": "서울특별시 도봉구"
      },
      {
        "code": "seoul-dongdaemun",
        "sido": "서울특별시",
        "sigungu": "동대문구",
        "displayName": "동대문구",
        "label": "서울특별시 동대문구"
      },
      {
        "code": "seoul-dongjak",
        "sido": "서울특별시",
        "sigungu": "동작구",
        "displayName": "동작구",
        "label": "서울특별시 동작구"
      },
      {
        "code": "seoul-mapo",
        "sido": "서울특별시",
        "sigungu": "마포구",
        "displayName": "마포구",
        "label": "서울특별시 마포구"
      },
      {
        "code": "seoul-seodaemun",
        "sido": "서울특별시",
        "sigungu": "서대문구",
        "displayName": "서대문구",
        "label": "서울특별시 서대문구"
      },
      {
        "code": "seoul-seocho",
        "sido": "서울특별시",
        "sigungu": "서초구",
        "displayName": "서초구",
        "label": "서울특별시 서초구"
      },
      {
        "code": "seoul-seongdong",
        "sido": "서울특별시",
        "sigungu": "성동구",
        "displayName": "성동구",
        "label": "서울특별시 성동구"
      },
      {
        "code": "seoul-seongbuk",
        "sido": "서울특별시",
        "sigungu": "성북구",
        "displayName": "성북구",
        "label": "서울특별시 성북구"
      },
      {
        "code": "seoul-songpa",
        "sido": "서울특별시",
        "sigungu": "송파구",
        "displayName": "송파구",
        "label": "서울특별시 송파구"
      },
      {
        "code": "seoul-yangcheon",
        "sido": "서울특별시",
        "sigungu": "양천구",
        "displayName": "양천구",
        "label": "서울특별시 양천구"
      },
      {
        "code": "seoul-yeongdeungpo",
        "sido": "서울특별시",
        "sigungu": "영등포구",
        "displayName": "영등포구",
        "label": "서울특별시 영등포구"
      },
      {
        "code": "seoul-yongsan",
        "sido": "서울특별시",
        "sigungu": "용산구",
        "displayName": "용산구",
        "label": "서울특별시 용산구"
      },
      {
        "code": "seoul-eunpyeong",
        "sido": "서울특별시",
        "sigungu": "은평구",
        "displayName": "은평구",
        "label": "서울특별시 은평구"
      },
      {
        "code": "seoul-jongno",
        "sido": "서울특별시",
        "sigungu": "종로구",
        "displayName": "종로구",
        "label": "서울특별시 종로구"
      },
      {
        "code": "seoul-7KSR6rWs",
        "sido": "서울특별시",
        "sigungu": "중구",
        "displayName": "중구",
        "label": "서울특별시 중구"
      },
      {
        "code": "seoul-jungnang",
        "sido": "서울특별시",
        "sigungu": "중랑구",
        "displayName": "중랑구",
        "label": "서울특별시 중랑구"
      }
    ]
  },
  {
    "code": "sejong",
    "name": "세종특별자치시",
    "sigungu": [
      {
        "code": "sejong-7IS47KKF7I",
        "sido": "세종특별자치시",
        "sigungu": "세종시",
        "displayName": "세종시",
        "label": "세종특별자치시 세종시"
      }
    ]
  },
  {
    "code": "ulsan",
    "name": "울산광역시",
    "sigungu": [
      {
        "code": "ulsan-7Jq47IKw64",
        "sido": "울산광역시",
        "sigungu": "울산남구",
        "displayName": "남구",
        "label": "울산광역시 남구"
      },
      {
        "code": "ulsan-7Jq47IKw642",
        "sido": "울산광역시",
        "sigungu": "울산동구",
        "displayName": "동구",
        "label": "울산광역시 동구"
      },
      {
        "code": "ulsan-7Jq47IKw67",
        "sido": "울산광역시",
        "sigungu": "울산북구",
        "displayName": "북구",
        "label": "울산광역시 북구"
      },
      {
        "code": "ulsan-7Jq47IKw7J",
        "sido": "울산광역시",
        "sigungu": "울산울주군",
        "displayName": "울주군",
        "label": "울산광역시 울주군"
      },
      {
        "code": "ulsan-7Jq47IKw7K",
        "sido": "울산광역시",
        "sigungu": "울산중구",
        "displayName": "중구",
        "label": "울산광역시 중구"
      }
    ]
  },
  {
    "code": "incheon",
    "name": "인천광역시",
    "sigungu": [
      {
        "code": "incheon-ganghwa",
        "sido": "인천광역시",
        "sigungu": "인천강화군",
        "displayName": "강화군",
        "label": "인천광역시 강화군"
      },
      {
        "code": "incheon-7J247LKc6r",
        "sido": "인천광역시",
        "sigungu": "인천계양구",
        "displayName": "계양구",
        "label": "인천광역시 계양구"
      },
      {
        "code": "incheon-7J247LKc64",
        "sido": "인천광역시",
        "sigungu": "인천남동구",
        "displayName": "남동구",
        "label": "인천광역시 남동구"
      },
      {
        "code": "incheon-7J247LKc642",
        "sido": "인천광역시",
        "sigungu": "인천동구",
        "displayName": "동구",
        "label": "인천광역시 동구"
      },
      {
        "code": "incheon-7J247LKc66",
        "sido": "인천광역시",
        "sigungu": "인천미추홀구",
        "displayName": "미추홀구",
        "label": "인천광역시 미추홀구"
      },
      {
        "code": "incheon-7J247LKc67",
        "sido": "인천광역시",
        "sigungu": "인천부평구",
        "displayName": "부평구",
        "label": "인천광역시 부평구"
      },
      {
        "code": "incheon-7J247LKc7I",
        "sido": "인천광역시",
        "sigungu": "인천서구",
        "displayName": "서구",
        "label": "인천광역시 서구"
      },
      {
        "code": "incheon-7J247LKc7J",
        "sido": "인천광역시",
        "sigungu": "인천연수구",
        "displayName": "연수구",
        "label": "인천광역시 연수구"
      },
      {
        "code": "incheon-7J247LKc7J2",
        "sido": "인천광역시",
        "sigungu": "인천옹진군",
        "displayName": "옹진군",
        "label": "인천광역시 옹진군"
      },
      {
        "code": "incheon-7J247LKc7K",
        "sido": "인천광역시",
        "sigungu": "인천중구",
        "displayName": "중구",
        "label": "인천광역시 중구"
      }
    ]
  },
  {
    "code": "jeonnam",
    "name": "전라남도",
    "sigungu": [
      {
        "code": "jeonnam-6rCV7KeE6r",
        "sido": "전라남도",
        "sigungu": "강진군",
        "displayName": "강진군",
        "label": "전라남도 강진군"
      },
      {
        "code": "jeonnam-6rOg7Z2l6r",
        "sido": "전라남도",
        "sigungu": "고흥군",
        "displayName": "고흥군",
        "label": "전라남도 고흥군"
      },
      {
        "code": "jeonnam-6rOh7ISx6r",
        "sido": "전라남도",
        "sigungu": "곡성군",
        "displayName": "곡성군",
        "label": "전라남도 곡성군"
      },
      {
        "code": "jeonnam-6rSR7JaR7I",
        "sido": "전라남도",
        "sigungu": "광양시",
        "displayName": "광양시",
        "label": "전라남도 광양시"
      },
      {
        "code": "jeonnam-6rWs66GA6r",
        "sido": "전라남도",
        "sigungu": "구례군",
        "displayName": "구례군",
        "label": "전라남도 구례군"
      },
      {
        "code": "jeonnam-64KY7KO87I",
        "sido": "전라남도",
        "sigungu": "나주시",
        "displayName": "나주시",
        "label": "전라남도 나주시"
      },
      {
        "code": "jeonnam-64u07JaR6r",
        "sido": "전라남도",
        "sigungu": "담양군",
        "displayName": "담양군",
        "label": "전라남도 담양군"
      },
      {
        "code": "jeonnam-mokpo",
        "sido": "전라남도",
        "sigungu": "목포시",
        "displayName": "목포시",
        "label": "전라남도 목포시"
      },
      {
        "code": "jeonnam-muan",
        "sido": "전라남도",
        "sigungu": "무안군",
        "displayName": "무안군",
        "label": "전라남도 무안군"
      },
      {
        "code": "jeonnam-67O07ISx6r",
        "sido": "전라남도",
        "sigungu": "보성군",
        "displayName": "보성군",
        "label": "전라남도 보성군"
      },
      {
        "code": "jeonnam-suncheon",
        "sido": "전라남도",
        "sigungu": "순천시",
        "displayName": "순천시",
        "label": "전라남도 순천시"
      },
      {
        "code": "jeonnam-7Iug7JWI6r",
        "sido": "전라남도",
        "sigungu": "신안군",
        "displayName": "신안군",
        "label": "전라남도 신안군"
      },
      {
        "code": "jeonnam-yeosu",
        "sido": "전라남도",
        "sigungu": "여수시",
        "displayName": "여수시",
        "label": "전라남도 여수시"
      },
      {
        "code": "jeonnam-7JiB6rSR6r",
        "sido": "전라남도",
        "sigungu": "영광군",
        "displayName": "영광군",
        "label": "전라남도 영광군"
      },
      {
        "code": "jeonnam-7JiB7JWU6r",
        "sido": "전라남도",
        "sigungu": "영암군",
        "displayName": "영암군",
        "label": "전라남도 영암군"
      },
      {
        "code": "jeonnam-7JmE64E6rW",
        "sido": "전라남도",
        "sigungu": "완도군",
        "displayName": "완도군",
        "label": "전라남도 완도군"
      },
      {
        "code": "jeonnam-7J6l7ISx6r",
        "sido": "전라남도",
        "sigungu": "장성군",
        "displayName": "장성군",
        "label": "전라남도 장성군"
      },
      {
        "code": "jeonnam-7J6l7Z2l6r",
        "sido": "전라남도",
        "sigungu": "장흥군",
        "displayName": "장흥군",
        "label": "전라남도 장흥군"
      },
      {
        "code": "jeonnam-7KeE64E6rW",
        "sido": "전라남도",
        "sigungu": "진도군",
        "displayName": "진도군",
        "label": "전라남도 진도군"
      },
      {
        "code": "jeonnam-7ZWo7YJ6rW",
        "sido": "전라남도",
        "sigungu": "함평군",
        "displayName": "함평군",
        "label": "전라남도 함평군"
      },
      {
        "code": "jeonnam-7ZW064Ko6r",
        "sido": "전라남도",
        "sigungu": "해남군",
        "displayName": "해남군",
        "label": "전라남도 해남군"
      },
      {
        "code": "jeonnam-7ZmU7Iic6r",
        "sido": "전라남도",
        "sigungu": "화순군",
        "displayName": "화순군",
        "label": "전라남도 화순군"
      }
    ]
  },
  {
    "code": "jeonbuk",
    "name": "전북특별자치도",
    "sigungu": [
      {
        "code": "jeonbuk-6rOg7LC96r",
        "sido": "전북특별자치도",
        "sigungu": "고창군",
        "displayName": "고창군",
        "label": "전북특별자치도 고창군"
      },
      {
        "code": "jeonbuk-6rWw7IKw7I",
        "sido": "전북특별자치도",
        "sigungu": "군산시",
        "displayName": "군산시",
        "label": "전북특별자치도 군산시"
      },
      {
        "code": "jeonbuk-6rmA7KCc7I",
        "sido": "전북특별자치도",
        "sigungu": "김제시",
        "displayName": "김제시",
        "label": "전북특별자치도 김제시"
      },
      {
        "code": "jeonbuk-64Ko7JuQ7I",
        "sido": "전북특별자치도",
        "sigungu": "남원시",
        "displayName": "남원시",
        "label": "전북특별자치도 남원시"
      },
      {
        "code": "jeonbuk-66y07KO86r",
        "sido": "전북특별자치도",
        "sigungu": "무주군",
        "displayName": "무주군",
        "label": "전북특별자치도 무주군"
      },
      {
        "code": "jeonbuk-67aA7JWI6r",
        "sido": "전북특별자치도",
        "sigungu": "부안군",
        "displayName": "부안군",
        "label": "전북특별자치도 부안군"
      },
      {
        "code": "jeonbuk-7Iic7LC96r",
        "sido": "전북특별자치도",
        "sigungu": "순창군",
        "displayName": "순창군",
        "label": "전북특별자치도 순창군"
      },
      {
        "code": "jeonbuk-7JmE7KO86r",
        "sido": "전북특별자치도",
        "sigungu": "완주군",
        "displayName": "완주군",
        "label": "전북특별자치도 완주군"
      },
      {
        "code": "jeonbuk-7J217IKw7I",
        "sido": "전북특별자치도",
        "sigungu": "익산시",
        "displayName": "익산시",
        "label": "전북특별자치도 익산시"
      },
      {
        "code": "jeonbuk-7J6E7Iuk6r",
        "sido": "전북특별자치도",
        "sigungu": "임실군",
        "displayName": "임실군",
        "label": "전북특별자치도 임실군"
      },
      {
        "code": "jeonbuk-7J6l7IiY6r",
        "sido": "전북특별자치도",
        "sigungu": "장수군",
        "displayName": "장수군",
        "label": "전북특별자치도 장수군"
      },
      {
        "code": "jeonbuk-7KCE7KO864",
        "sido": "전북특별자치도",
        "sigungu": "전주덕진구",
        "displayName": "덕진구",
        "label": "전북특별자치도 덕진구"
      },
      {
        "code": "jeonbuk-7KCE7KO87J",
        "sido": "전북특별자치도",
        "sigungu": "전주완산구",
        "displayName": "완산구",
        "label": "전북특별자치도 완산구"
      },
      {
        "code": "jeonbuk-7KCV7J2N7I",
        "sido": "전북특별자치도",
        "sigungu": "정읍시",
        "displayName": "정읍시",
        "label": "전북특별자치도 정읍시"
      },
      {
        "code": "jeonbuk-7KeE7JWI6r",
        "sido": "전북특별자치도",
        "sigungu": "진안군",
        "displayName": "진안군",
        "label": "전북특별자치도 진안군"
      }
    ]
  },
  {
    "code": "jeju",
    "name": "제주특별자치도",
    "sigungu": [
      {
        "code": "jeju-7ISc6reA7Y",
        "sido": "제주특별자치도",
        "sigungu": "서귀포시",
        "displayName": "서귀포시",
        "label": "제주특별자치도 서귀포시"
      },
      {
        "code": "jeju-jeju",
        "sido": "제주특별자치도",
        "sigungu": "제주시",
        "displayName": "제주시",
        "label": "제주특별자치도 제주시"
      }
    ]
  },
  {
    "code": "chungnam",
    "name": "충청남도",
    "sigungu": [
      {
        "code": "chungnam-6rOE66Oh7I",
        "sido": "충청남도",
        "sigungu": "계룡시",
        "displayName": "계룡시",
        "label": "충청남도 계룡시"
      },
      {
        "code": "chungnam-6rO17KO87I",
        "sido": "충청남도",
        "sigungu": "공주시",
        "displayName": "공주시",
        "label": "충청남도 공주시"
      },
      {
        "code": "chungnam-6riI7IKw6r",
        "sido": "충청남도",
        "sigungu": "금산군",
        "displayName": "금산군",
        "label": "충청남도 금산군"
      },
      {
        "code": "chungnam-64W87IKw7I",
        "sido": "충청남도",
        "sigungu": "논산시",
        "displayName": "논산시",
        "label": "충청남도 논산시"
      },
      {
        "code": "chungnam-64u57KeE7I",
        "sido": "충청남도",
        "sigungu": "당진시",
        "displayName": "당진시",
        "label": "충청남도 당진시"
      },
      {
        "code": "chungnam-67O066C57I",
        "sido": "충청남도",
        "sigungu": "보령시",
        "displayName": "보령시",
        "label": "충청남도 보령시"
      },
      {
        "code": "chungnam-67aA7Jes6r",
        "sido": "충청남도",
        "sigungu": "부여군",
        "displayName": "부여군",
        "label": "충청남도 부여군"
      },
      {
        "code": "chungnam-7ISc7IKw7I",
        "sido": "충청남도",
        "sigungu": "서산시",
        "displayName": "서산시",
        "label": "충청남도 서산시"
      },
      {
        "code": "chungnam-7ISc7LKc6r",
        "sido": "충청남도",
        "sigungu": "서천군",
        "displayName": "서천군",
        "label": "충청남도 서천군"
      },
      {
        "code": "chungnam-7JWE7IKw7I",
        "sido": "충청남도",
        "sigungu": "아산시",
        "displayName": "아산시",
        "label": "충청남도 아산시"
      },
      {
        "code": "chungnam-7JiI7IKw6r",
        "sido": "충청남도",
        "sigungu": "예산군",
        "displayName": "예산군",
        "label": "충청남도 예산군"
      },
      {
        "code": "chungnam-7LKc7JWI64",
        "sido": "충청남도",
        "sigungu": "천안동남구",
        "displayName": "동남구",
        "label": "충청남도 동남구"
      },
      {
        "code": "chungnam-7LKc7JWI7I",
        "sido": "충청남도",
        "sigungu": "천안서북구",
        "displayName": "서북구",
        "label": "충청남도 서북구"
      },
      {
        "code": "chungnam-7LKt7JaR6r",
        "sido": "충청남도",
        "sigungu": "청양군",
        "displayName": "청양군",
        "label": "충청남도 청양군"
      },
      {
        "code": "chungnam-7YOc7JWI6r",
        "sido": "충청남도",
        "sigungu": "태안군",
        "displayName": "태안군",
        "label": "충청남도 태안군"
      },
      {
        "code": "chungnam-7ZmN7ISx6r",
        "sido": "충청남도",
        "sigungu": "홍성군",
        "displayName": "홍성군",
        "label": "충청남도 홍성군"
      }
    ]
  },
  {
    "code": "chungbuk",
    "name": "충청북도",
    "sigungu": [
      {
        "code": "chungbuk-6rS07IKw6r",
        "sido": "충청북도",
        "sigungu": "괴산군",
        "displayName": "괴산군",
        "label": "충청북도 괴산군"
      },
      {
        "code": "chungbuk-64uo7JaR6r",
        "sido": "충청북도",
        "sigungu": "단양군",
        "displayName": "단양군",
        "label": "충청북도 단양군"
      },
      {
        "code": "chungbuk-67O07J2A6r",
        "sido": "충청북도",
        "sigungu": "보은군",
        "displayName": "보은군",
        "label": "충청북도 보은군"
      },
      {
        "code": "chungbuk-7JiB64Z6rW",
        "sido": "충청북도",
        "sigungu": "영동군",
        "displayName": "영동군",
        "label": "충청북도 영동군"
      },
      {
        "code": "chungbuk-7Jil7LKc6r",
        "sido": "충청북도",
        "sigungu": "옥천군",
        "displayName": "옥천군",
        "label": "충청북도 옥천군"
      },
      {
        "code": "chungbuk-7J2M7ISx6r",
        "sido": "충청북도",
        "sigungu": "음성군",
        "displayName": "음성군",
        "label": "충청북도 음성군"
      },
      {
        "code": "chungbuk-7KCc7LKc7I",
        "sido": "충청북도",
        "sigungu": "제천시",
        "displayName": "제천시",
        "label": "충청북도 제천시"
      },
      {
        "code": "chungbuk-7Kad7YJ6rW",
        "sido": "충청북도",
        "sigungu": "증평군",
        "displayName": "증평군",
        "label": "충청북도 증평군"
      },
      {
        "code": "chungbuk-7KeE7LKc6r",
        "sido": "충청북도",
        "sigungu": "진천군",
        "displayName": "진천군",
        "label": "충청북도 진천군"
      },
      {
        "code": "chungbuk-7LKt7KO87I",
        "sido": "충청북도",
        "sigungu": "청주상당구",
        "displayName": "상당구",
        "label": "충청북도 상당구"
      },
      {
        "code": "chungbuk-7LKt7KO87I2",
        "sido": "충청북도",
        "sigungu": "청주서원구",
        "displayName": "서원구",
        "label": "충청북도 서원구"
      },
      {
        "code": "chungbuk-7LKt7KO87L",
        "sido": "충청북도",
        "sigungu": "청주청원구",
        "displayName": "청원구",
        "label": "충청북도 청원구"
      },
      {
        "code": "chungbuk-7LKt7KO87Z",
        "sido": "충청북도",
        "sigungu": "청주흥덕구",
        "displayName": "흥덕구",
        "label": "충청북도 흥덕구"
      },
      {
        "code": "chungbuk-7Lap7KO87I",
        "sido": "충청북도",
        "sigungu": "충주시",
        "displayName": "충주시",
        "label": "충청북도 충주시"
      }
    ]
  }
];

export const KOREAN_SIGUNGU_UNITS: KoreanSigunguUnit[] = [
  {
    "code": "gangwon-6rCV66aJ7I",
    "sido": "강원특별자치도",
    "sigungu": "강릉시",
    "displayName": "강릉시",
    "label": "강원특별자치도 강릉시"
  },
  {
    "code": "gangwon-6rOg7ISx6r",
    "sido": "강원특별자치도",
    "sigungu": "고성군",
    "displayName": "고성군",
    "label": "강원특별자치도 고성군"
  },
  {
    "code": "gangwon-64Z7ZW07Iu",
    "sido": "강원특별자치도",
    "sigungu": "동해시",
    "displayName": "동해시",
    "label": "강원특별자치도 동해시"
  },
  {
    "code": "gangwon-7IK87LKZ7I",
    "sido": "강원특별자치도",
    "sigungu": "삼척시",
    "displayName": "삼척시",
    "label": "강원특별자치도 삼척시"
  },
  {
    "code": "gangwon-7IaN7LSI7I",
    "sido": "강원특별자치도",
    "sigungu": "속초시",
    "displayName": "속초시",
    "label": "강원특별자치도 속초시"
  },
  {
    "code": "gangwon-7JaR6rWs6r",
    "sido": "강원특별자치도",
    "sigungu": "양구군",
    "displayName": "양구군",
    "label": "강원특별자치도 양구군"
  },
  {
    "code": "gangwon-7JaR7JaR6r",
    "sido": "강원특별자치도",
    "sigungu": "양양군",
    "displayName": "양양군",
    "label": "강원특별자치도 양양군"
  },
  {
    "code": "gangwon-7JiB7JuU6r",
    "sido": "강원특별자치도",
    "sigungu": "영월군",
    "displayName": "영월군",
    "label": "강원특별자치도 영월군"
  },
  {
    "code": "gangwon-7JuQ7KO87I",
    "sido": "강원특별자치도",
    "sigungu": "원주시",
    "displayName": "원주시",
    "label": "강원특별자치도 원주시"
  },
  {
    "code": "gangwon-7J247KCc6r",
    "sido": "강원특별자치도",
    "sigungu": "인제군",
    "displayName": "인제군",
    "label": "강원특별자치도 인제군"
  },
  {
    "code": "gangwon-7KCV7ISg6r",
    "sido": "강원특별자치도",
    "sigungu": "정선군",
    "displayName": "정선군",
    "label": "강원특별자치도 정선군"
  },
  {
    "code": "gangwon-7LKg7JuQ6r",
    "sido": "강원특별자치도",
    "sigungu": "철원군",
    "displayName": "철원군",
    "label": "강원특별자치도 철원군"
  },
  {
    "code": "gangwon-7LaY7LKc7I",
    "sido": "강원특별자치도",
    "sigungu": "춘천시",
    "displayName": "춘천시",
    "label": "강원특별자치도 춘천시"
  },
  {
    "code": "gangwon-7YOc67Cx7I",
    "sido": "강원특별자치도",
    "sigungu": "태백시",
    "displayName": "태백시",
    "label": "강원특별자치도 태백시"
  },
  {
    "code": "gangwon-7YJ7LC96rW",
    "sido": "강원특별자치도",
    "sigungu": "평창군",
    "displayName": "평창군",
    "label": "강원특별자치도 평창군"
  },
  {
    "code": "gangwon-7ZmN7LKc6r",
    "sido": "강원특별자치도",
    "sigungu": "홍천군",
    "displayName": "홍천군",
    "label": "강원특별자치도 홍천군"
  },
  {
    "code": "gangwon-7ZmU7LKc6r",
    "sido": "강원특별자치도",
    "sigungu": "화천군",
    "displayName": "화천군",
    "label": "강원특별자치도 화천군"
  },
  {
    "code": "gangwon-7Zqh7ISx6r",
    "sido": "강원특별자치도",
    "sigungu": "횡성군",
    "displayName": "횡성군",
    "label": "강원특별자치도 횡성군"
  },
  {
    "code": "gyeonggi-6rCA7YJ6rW",
    "sido": "경기도",
    "sigungu": "가평군",
    "displayName": "가평군",
    "label": "경기도 가평군"
  },
  {
    "code": "gyeonggi-6rOg7JaR64",
    "sido": "경기도",
    "sigungu": "고양덕양구",
    "displayName": "덕양구",
    "label": "경기도 덕양구"
  },
  {
    "code": "gyeonggi-6rOg7JaR7J",
    "sido": "경기도",
    "sigungu": "고양일산동구",
    "displayName": "일산동구",
    "label": "경기도 일산동구"
  },
  {
    "code": "gyeonggi-6rOg7JaR7J2",
    "sido": "경기도",
    "sigungu": "고양일산서구",
    "displayName": "일산서구",
    "label": "경기도 일산서구"
  },
  {
    "code": "gyeonggi-6rO87LKc7I",
    "sido": "경기도",
    "sigungu": "과천시",
    "displayName": "과천시",
    "label": "경기도 과천시"
  },
  {
    "code": "gyeonggi-6rSR66qF7I",
    "sido": "경기도",
    "sigungu": "광명시",
    "displayName": "광명시",
    "label": "경기도 광명시"
  },
  {
    "code": "gyeonggi-6rSR7KO87I",
    "sido": "경기도",
    "sigungu": "광주시",
    "displayName": "시",
    "label": "경기도 시"
  },
  {
    "code": "gyeonggi-6rWs66as7I",
    "sido": "경기도",
    "sigungu": "구리시",
    "displayName": "구리시",
    "label": "경기도 구리시"
  },
  {
    "code": "gyeonggi-6rWw7Ys7Iu",
    "sido": "경기도",
    "sigungu": "군포시",
    "displayName": "군포시",
    "label": "경기도 군포시"
  },
  {
    "code": "gyeonggi-6rmA7Ys7Iu",
    "sido": "경기도",
    "sigungu": "김포시",
    "displayName": "김포시",
    "label": "경기도 김포시"
  },
  {
    "code": "gyeonggi-64Ko7JaR7K",
    "sido": "경기도",
    "sigungu": "남양주시",
    "displayName": "남양주시",
    "label": "경기도 남양주시"
  },
  {
    "code": "gyeonggi-64Z65GQ7LK",
    "sido": "경기도",
    "sigungu": "동두천시",
    "displayName": "동두천시",
    "label": "경기도 동두천시"
  },
  {
    "code": "gyeonggi-67aA7LKc7I",
    "sido": "경기도",
    "sigungu": "부천소사구",
    "displayName": "소사구",
    "label": "경기도 소사구"
  },
  {
    "code": "gyeonggi-67aA7LKc7J",
    "sido": "경기도",
    "sigungu": "부천오정구",
    "displayName": "오정구",
    "label": "경기도 오정구"
  },
  {
    "code": "gyeonggi-67aA7LKc7J2",
    "sido": "경기도",
    "sigungu": "부천원미구",
    "displayName": "원미구",
    "label": "경기도 원미구"
  },
  {
    "code": "gyeonggi-7ISx64Ko67",
    "sido": "경기도",
    "sigungu": "성남분당구",
    "displayName": "분당구",
    "label": "경기도 분당구"
  },
  {
    "code": "gyeonggi-7ISx64Ko7I",
    "sido": "경기도",
    "sigungu": "성남수정구",
    "displayName": "수정구",
    "label": "경기도 수정구"
  },
  {
    "code": "gyeonggi-7ISx64Ko7K",
    "sido": "경기도",
    "sigungu": "성남중원구",
    "displayName": "중원구",
    "label": "경기도 중원구"
  },
  {
    "code": "gyeonggi-7IiY7JuQ6r",
    "sido": "경기도",
    "sigungu": "수원권선구",
    "displayName": "권선구",
    "label": "경기도 권선구"
  },
  {
    "code": "gyeonggi-7IiY7JuQ7J",
    "sido": "경기도",
    "sigungu": "수원영통구",
    "displayName": "영통구",
    "label": "경기도 영통구"
  },
  {
    "code": "gyeonggi-7IiY7JuQ7J2",
    "sido": "경기도",
    "sigungu": "수원장안구",
    "displayName": "장안구",
    "label": "경기도 장안구"
  },
  {
    "code": "gyeonggi-7IiY7JuQ7Y",
    "sido": "경기도",
    "sigungu": "수원팔달구",
    "displayName": "팔달구",
    "label": "경기도 팔달구"
  },
  {
    "code": "gyeonggi-7Iuc7Z2l7I",
    "sido": "경기도",
    "sigungu": "시흥시",
    "displayName": "시흥시",
    "label": "경기도 시흥시"
  },
  {
    "code": "gyeonggi-7JWI7IKw64",
    "sido": "경기도",
    "sigungu": "안산단원구",
    "displayName": "단원구",
    "label": "경기도 단원구"
  },
  {
    "code": "gyeonggi-7JWI7IKw7I",
    "sido": "경기도",
    "sigungu": "안산상록구",
    "displayName": "상록구",
    "label": "경기도 상록구"
  },
  {
    "code": "gyeonggi-7JWI7ISx7I",
    "sido": "경기도",
    "sigungu": "안성시",
    "displayName": "안성시",
    "label": "경기도 안성시"
  },
  {
    "code": "gyeonggi-7JWI7JaR64",
    "sido": "경기도",
    "sigungu": "안양동안구",
    "displayName": "동안구",
    "label": "경기도 동안구"
  },
  {
    "code": "gyeonggi-7JWI7JaR66",
    "sido": "경기도",
    "sigungu": "안양만안구",
    "displayName": "만안구",
    "label": "경기도 만안구"
  },
  {
    "code": "gyeonggi-7JaR7KO87I",
    "sido": "경기도",
    "sigungu": "양주시",
    "displayName": "양주시",
    "label": "경기도 양주시"
  },
  {
    "code": "gyeonggi-7JaR7YJ6rW",
    "sido": "경기도",
    "sigungu": "양평군",
    "displayName": "양평군",
    "label": "경기도 양평군"
  },
  {
    "code": "gyeonggi-7Jes7KO87I",
    "sido": "경기도",
    "sigungu": "여주시",
    "displayName": "여주시",
    "label": "경기도 여주시"
  },
  {
    "code": "gyeonggi-7Jew7LKc6r",
    "sido": "경기도",
    "sigungu": "연천군",
    "displayName": "연천군",
    "label": "경기도 연천군"
  },
  {
    "code": "gyeonggi-7Jik7IKw7I",
    "sido": "경기도",
    "sigungu": "오산시",
    "displayName": "오산시",
    "label": "경기도 오산시"
  },
  {
    "code": "gyeonggi-7Jqp7J246r",
    "sido": "경기도",
    "sigungu": "용인기흥구",
    "displayName": "기흥구",
    "label": "경기도 기흥구"
  },
  {
    "code": "gyeonggi-7Jqp7J247I",
    "sido": "경기도",
    "sigungu": "용인수지구",
    "displayName": "수지구",
    "label": "경기도 수지구"
  },
  {
    "code": "gyeonggi-7Jqp7J247L",
    "sido": "경기도",
    "sigungu": "용인처인구",
    "displayName": "처인구",
    "label": "경기도 처인구"
  },
  {
    "code": "gyeonggi-7J2Y7JmV7I",
    "sido": "경기도",
    "sigungu": "의왕시",
    "displayName": "의왕시",
    "label": "경기도 의왕시"
  },
  {
    "code": "gyeonggi-7J2Y7KCV67",
    "sido": "경기도",
    "sigungu": "의정부시",
    "displayName": "의정부시",
    "label": "경기도 의정부시"
  },
  {
    "code": "gyeonggi-7J207LKc7I",
    "sido": "경기도",
    "sigungu": "이천시",
    "displayName": "이천시",
    "label": "경기도 이천시"
  },
  {
    "code": "gyeonggi-7YyM7KO87I",
    "sido": "경기도",
    "sigungu": "파주시",
    "displayName": "파주시",
    "label": "경기도 파주시"
  },
  {
    "code": "gyeonggi-7YJ7YOd7Iu",
    "sido": "경기도",
    "sigungu": "평택시",
    "displayName": "평택시",
    "label": "경기도 평택시"
  },
  {
    "code": "gyeonggi-7Ys7LKc7Iu",
    "sido": "경기도",
    "sigungu": "포천시",
    "displayName": "포천시",
    "label": "경기도 포천시"
  },
  {
    "code": "gyeonggi-7ZWY64Ko7I",
    "sido": "경기도",
    "sigungu": "하남시",
    "displayName": "하남시",
    "label": "경기도 하남시"
  },
  {
    "code": "gyeonggi-7ZmU7ISx64",
    "sido": "경기도",
    "sigungu": "화성동탄구",
    "displayName": "동탄구",
    "label": "경기도 동탄구"
  },
  {
    "code": "gyeonggi-7ZmU7ISx66",
    "sido": "경기도",
    "sigungu": "화성만세구",
    "displayName": "만세구",
    "label": "경기도 만세구"
  },
  {
    "code": "gyeonggi-7ZmU7ISx67",
    "sido": "경기도",
    "sigungu": "화성병점구",
    "displayName": "병점구",
    "label": "경기도 병점구"
  },
  {
    "code": "gyeonggi-7ZmU7ISx7Z",
    "sido": "경기도",
    "sigungu": "화성효행구",
    "displayName": "효행구",
    "label": "경기도 효행구"
  },
  {
    "code": "gyeongnam-6rGw7KCc7I",
    "sido": "경상남도",
    "sigungu": "거제시",
    "displayName": "거제시",
    "label": "경상남도 거제시"
  },
  {
    "code": "gyeongnam-6rGw7LC96r",
    "sido": "경상남도",
    "sigungu": "거창군",
    "displayName": "거창군",
    "label": "경상남도 거창군"
  },
  {
    "code": "gyeongnam-6rOg7ISx6r",
    "sido": "경상남도",
    "sigungu": "고성군",
    "displayName": "고성군",
    "label": "경상남도 고성군"
  },
  {
    "code": "gyeongnam-6rmA7ZW07I",
    "sido": "경상남도",
    "sigungu": "김해시",
    "displayName": "김해시",
    "label": "경상남도 김해시"
  },
  {
    "code": "gyeongnam-64Ko7ZW06r",
    "sido": "경상남도",
    "sigungu": "남해군",
    "displayName": "남해군",
    "label": "경상남도 남해군"
  },
  {
    "code": "gyeongnam-67CA7JaR7I",
    "sido": "경상남도",
    "sigungu": "밀양시",
    "displayName": "밀양시",
    "label": "경상남도 밀양시"
  },
  {
    "code": "gyeongnam-7IKs7LKc7I",
    "sido": "경상남도",
    "sigungu": "사천시",
    "displayName": "사천시",
    "label": "경상남도 사천시"
  },
  {
    "code": "gyeongnam-7IKw7LKt6r",
    "sido": "경상남도",
    "sigungu": "산청군",
    "displayName": "산청군",
    "label": "경상남도 산청군"
  },
  {
    "code": "gyeongnam-7JaR7IKw7I",
    "sido": "경상남도",
    "sigungu": "양산시",
    "displayName": "양산시",
    "label": "경상남도 양산시"
  },
  {
    "code": "gyeongnam-7J2Y66C56r",
    "sido": "경상남도",
    "sigungu": "의령군",
    "displayName": "의령군",
    "label": "경상남도 의령군"
  },
  {
    "code": "gyeongnam-7KeE7KO87I",
    "sido": "경상남도",
    "sigungu": "진주시",
    "displayName": "진주시",
    "label": "경상남도 진주시"
  },
  {
    "code": "gyeongnam-7LC964WV6r",
    "sido": "경상남도",
    "sigungu": "창녕군",
    "displayName": "창녕군",
    "label": "경상남도 창녕군"
  },
  {
    "code": "gyeongnam-7LC97JuQ66",
    "sido": "경상남도",
    "sigungu": "창원마산합포구",
    "displayName": "창원마산합포구",
    "label": "경상남도 창원마산합포구"
  },
  {
    "code": "gyeongnam-7LC97JuQ662",
    "sido": "경상남도",
    "sigungu": "창원마산회원구",
    "displayName": "창원마산회원구",
    "label": "경상남도 창원마산회원구"
  },
  {
    "code": "gyeongnam-7LC97JuQ7I",
    "sido": "경상남도",
    "sigungu": "창원성산구",
    "displayName": "창원성산구",
    "label": "경상남도 창원성산구"
  },
  {
    "code": "gyeongnam-7LC97JuQ7J",
    "sido": "경상남도",
    "sigungu": "창원의창구",
    "displayName": "창원의창구",
    "label": "경상남도 창원의창구"
  },
  {
    "code": "gyeongnam-7LC97JuQ7K",
    "sido": "경상남도",
    "sigungu": "창원진해구",
    "displayName": "창원진해구",
    "label": "경상남도 창원진해구"
  },
  {
    "code": "gyeongnam-7Ya17JiB7I",
    "sido": "경상남도",
    "sigungu": "통영시",
    "displayName": "통영시",
    "label": "경상남도 통영시"
  },
  {
    "code": "gyeongnam-7ZWY64Z6rW",
    "sido": "경상남도",
    "sigungu": "하동군",
    "displayName": "하동군",
    "label": "경상남도 하동군"
  },
  {
    "code": "gyeongnam-7ZWo7JWI6r",
    "sido": "경상남도",
    "sigungu": "함안군",
    "displayName": "함안군",
    "label": "경상남도 함안군"
  },
  {
    "code": "gyeongnam-7ZWo7JaR6r",
    "sido": "경상남도",
    "sigungu": "함양군",
    "displayName": "함양군",
    "label": "경상남도 함양군"
  },
  {
    "code": "gyeongnam-7ZWp7LKc6r",
    "sido": "경상남도",
    "sigungu": "합천군",
    "displayName": "합천군",
    "label": "경상남도 합천군"
  },
  {
    "code": "gyeongbuk-6rK97IKw7I",
    "sido": "경상북도",
    "sigungu": "경산시",
    "displayName": "경산시",
    "label": "경상북도 경산시"
  },
  {
    "code": "gyeongbuk-6rK97KO87I",
    "sido": "경상북도",
    "sigungu": "경주시",
    "displayName": "경주시",
    "label": "경상북도 경주시"
  },
  {
    "code": "gyeongbuk-6rOg66C56r",
    "sido": "경상북도",
    "sigungu": "고령군",
    "displayName": "고령군",
    "label": "경상북도 고령군"
  },
  {
    "code": "gyeongbuk-6rWs6647Iu",
    "sido": "경상북도",
    "sigungu": "구미시",
    "displayName": "구미시",
    "label": "경상북도 구미시"
  },
  {
    "code": "gyeongbuk-6rmA7LKc7I",
    "sido": "경상북도",
    "sigungu": "김천시",
    "displayName": "김천시",
    "label": "경상북도 김천시"
  },
  {
    "code": "gyeongbuk-66y46rK97I",
    "sido": "경상북도",
    "sigungu": "문경시",
    "displayName": "문경시",
    "label": "경상북도 문경시"
  },
  {
    "code": "gyeongbuk-67SJ7ZmU6r",
    "sido": "경상북도",
    "sigungu": "봉화군",
    "displayName": "봉화군",
    "label": "경상북도 봉화군"
  },
  {
    "code": "gyeongbuk-7IOB7KO87I",
    "sido": "경상북도",
    "sigungu": "상주시",
    "displayName": "상주시",
    "label": "경상북도 상주시"
  },
  {
    "code": "gyeongbuk-7ISx7KO86r",
    "sido": "경상북도",
    "sigungu": "성주군",
    "displayName": "성주군",
    "label": "경상북도 성주군"
  },
  {
    "code": "gyeongbuk-7JWI64Z7Iu",
    "sido": "경상북도",
    "sigungu": "안동시",
    "displayName": "안동시",
    "label": "경상북도 안동시"
  },
  {
    "code": "gyeongbuk-7JiB642V6r",
    "sido": "경상북도",
    "sigungu": "영덕군",
    "displayName": "영덕군",
    "label": "경상북도 영덕군"
  },
  {
    "code": "gyeongbuk-7JiB7JaR6r",
    "sido": "경상북도",
    "sigungu": "영양군",
    "displayName": "영양군",
    "label": "경상북도 영양군"
  },
  {
    "code": "gyeongbuk-7JiB7KO87I",
    "sido": "경상북도",
    "sigungu": "영주시",
    "displayName": "영주시",
    "label": "경상북도 영주시"
  },
  {
    "code": "gyeongbuk-7JiB7LKc7I",
    "sido": "경상북도",
    "sigungu": "영천시",
    "displayName": "영천시",
    "label": "경상북도 영천시"
  },
  {
    "code": "gyeongbuk-7JiI7LKc6r",
    "sido": "경상북도",
    "sigungu": "예천군",
    "displayName": "예천군",
    "label": "경상북도 예천군"
  },
  {
    "code": "gyeongbuk-7Jq466aJ6r",
    "sido": "경상북도",
    "sigungu": "울릉군",
    "displayName": "울릉군",
    "label": "경상북도 울릉군"
  },
  {
    "code": "gyeongbuk-7Jq47KeE6r",
    "sido": "경상북도",
    "sigungu": "울진군",
    "displayName": "울진군",
    "label": "경상북도 울진군"
  },
  {
    "code": "gyeongbuk-7J2Y7ISx6r",
    "sido": "경상북도",
    "sigungu": "의성군",
    "displayName": "의성군",
    "label": "경상북도 의성군"
  },
  {
    "code": "gyeongbuk-7LKt64E6rW",
    "sido": "경상북도",
    "sigungu": "청도군",
    "displayName": "청도군",
    "label": "경상북도 청도군"
  },
  {
    "code": "gyeongbuk-7LKt7Iah6r",
    "sido": "경상북도",
    "sigungu": "청송군",
    "displayName": "청송군",
    "label": "경상북도 청송군"
  },
  {
    "code": "gyeongbuk-7Lmg6rOh6r",
    "sido": "경상북도",
    "sigungu": "칠곡군",
    "displayName": "칠곡군",
    "label": "경상북도 칠곡군"
  },
  {
    "code": "gyeongbuk-7Ys7ZWt64K",
    "sido": "경상북도",
    "sigungu": "포항남구",
    "displayName": "포항남구",
    "label": "경상북도 포항남구"
  },
  {
    "code": "gyeongbuk-7Ys7ZWt67a",
    "sido": "경상북도",
    "sigungu": "포항북구",
    "displayName": "포항북구",
    "label": "경상북도 포항북구"
  },
  {
    "code": "gwangju-6rSR7KO86r",
    "sido": "광주광역시",
    "sigungu": "광주광산구",
    "displayName": "광산구",
    "label": "광주광역시 광산구"
  },
  {
    "code": "gwangju-6rSR7KO864",
    "sido": "광주광역시",
    "sigungu": "광주남구",
    "displayName": "남구",
    "label": "광주광역시 남구"
  },
  {
    "code": "gwangju-6rSR7KO8642",
    "sido": "광주광역시",
    "sigungu": "광주동구",
    "displayName": "동구",
    "label": "광주광역시 동구"
  },
  {
    "code": "gwangju-6rSR7KO867",
    "sido": "광주광역시",
    "sigungu": "광주북구",
    "displayName": "북구",
    "label": "광주광역시 북구"
  },
  {
    "code": "gwangju-6rSR7KO87I",
    "sido": "광주광역시",
    "sigungu": "광주서구",
    "displayName": "서구",
    "label": "광주광역시 서구"
  },
  {
    "code": "daegu-64yA6rWs6r",
    "sido": "대구광역시",
    "sigungu": "대구군위군",
    "displayName": "군위군",
    "label": "대구광역시 군위군"
  },
  {
    "code": "daegu-64yA6rWs64",
    "sido": "대구광역시",
    "sigungu": "대구남구",
    "displayName": "남구",
    "label": "대구광역시 남구"
  },
  {
    "code": "daegu-64yA6rWs642",
    "sido": "대구광역시",
    "sigungu": "대구달서구",
    "displayName": "달서구",
    "label": "대구광역시 달서구"
  },
  {
    "code": "daegu-64yA6rWs643",
    "sido": "대구광역시",
    "sigungu": "대구달성군",
    "displayName": "달성군",
    "label": "대구광역시 달성군"
  },
  {
    "code": "daegu-64yA6rWs644",
    "sido": "대구광역시",
    "sigungu": "대구동구",
    "displayName": "동구",
    "label": "대구광역시 동구"
  },
  {
    "code": "daegu-64yA6rWs67",
    "sido": "대구광역시",
    "sigungu": "대구북구",
    "displayName": "북구",
    "label": "대구광역시 북구"
  },
  {
    "code": "daegu-64yA6rWs7I",
    "sido": "대구광역시",
    "sigungu": "대구서구",
    "displayName": "서구",
    "label": "대구광역시 서구"
  },
  {
    "code": "daegu-64yA6rWs7I2",
    "sido": "대구광역시",
    "sigungu": "대구수성구",
    "displayName": "수성구",
    "label": "대구광역시 수성구"
  },
  {
    "code": "daegu-64yA6rWs7K",
    "sido": "대구광역시",
    "sigungu": "대구중구",
    "displayName": "중구",
    "label": "대구광역시 중구"
  },
  {
    "code": "daejeon-64yA7KCE64",
    "sido": "대전광역시",
    "sigungu": "대전대덕구",
    "displayName": "대덕구",
    "label": "대전광역시 대덕구"
  },
  {
    "code": "daejeon-64yA7KCE642",
    "sido": "대전광역시",
    "sigungu": "대전동구",
    "displayName": "동구",
    "label": "대전광역시 동구"
  },
  {
    "code": "daejeon-64yA7KCE7I",
    "sido": "대전광역시",
    "sigungu": "대전서구",
    "displayName": "서구",
    "label": "대전광역시 서구"
  },
  {
    "code": "daejeon-64yA7KCE7J",
    "sido": "대전광역시",
    "sigungu": "대전유성구",
    "displayName": "유성구",
    "label": "대전광역시 유성구"
  },
  {
    "code": "daejeon-64yA7KCE7K",
    "sido": "대전광역시",
    "sigungu": "대전중구",
    "displayName": "중구",
    "label": "대전광역시 중구"
  },
  {
    "code": "busan-gangseo",
    "sido": "부산광역시",
    "sigungu": "부산강서구",
    "displayName": "강서구",
    "label": "부산광역시 강서구"
  },
  {
    "code": "busan-67aA7IKw6r",
    "sido": "부산광역시",
    "sigungu": "부산금정구",
    "displayName": "금정구",
    "label": "부산광역시 금정구"
  },
  {
    "code": "busan-67aA7IKw6r2",
    "sido": "부산광역시",
    "sigungu": "부산기장군",
    "displayName": "기장군",
    "label": "부산광역시 기장군"
  },
  {
    "code": "busan-67aA7IKw64",
    "sido": "부산광역시",
    "sigungu": "부산남구",
    "displayName": "남구",
    "label": "부산광역시 남구"
  },
  {
    "code": "busan-67aA7IKw642",
    "sido": "부산광역시",
    "sigungu": "부산동구",
    "displayName": "동구",
    "label": "부산광역시 동구"
  },
  {
    "code": "busan-67aA7IKw643",
    "sido": "부산광역시",
    "sigungu": "부산동래구",
    "displayName": "동래구",
    "label": "부산광역시 동래구"
  },
  {
    "code": "busan-67aA7IKw67",
    "sido": "부산광역시",
    "sigungu": "부산북구",
    "displayName": "북구",
    "label": "부산광역시 북구"
  },
  {
    "code": "busan-67aA7IKw7I",
    "sido": "부산광역시",
    "sigungu": "부산사상구",
    "displayName": "사상구",
    "label": "부산광역시 사상구"
  },
  {
    "code": "busan-67aA7IKw7I2",
    "sido": "부산광역시",
    "sigungu": "부산사하구",
    "displayName": "사하구",
    "label": "부산광역시 사하구"
  },
  {
    "code": "busan-67aA7IKw7I3",
    "sido": "부산광역시",
    "sigungu": "부산서구",
    "displayName": "서구",
    "label": "부산광역시 서구"
  },
  {
    "code": "busan-67aA7IKw7I4",
    "sido": "부산광역시",
    "sigungu": "부산수영구",
    "displayName": "수영구",
    "label": "부산광역시 수영구"
  },
  {
    "code": "busan-67aA7IKw7J",
    "sido": "부산광역시",
    "sigungu": "부산연제구",
    "displayName": "연제구",
    "label": "부산광역시 연제구"
  },
  {
    "code": "busan-67aA7IKw7J2",
    "sido": "부산광역시",
    "sigungu": "부산영도구",
    "displayName": "영도구",
    "label": "부산광역시 영도구"
  },
  {
    "code": "busan-67aA7IKw7K",
    "sido": "부산광역시",
    "sigungu": "부산중구",
    "displayName": "중구",
    "label": "부산광역시 중구"
  },
  {
    "code": "busan-67aA7IKw7K2",
    "sido": "부산광역시",
    "sigungu": "부산진구",
    "displayName": "진구",
    "label": "부산광역시 진구"
  },
  {
    "code": "busan-haeundae",
    "sido": "부산광역시",
    "sigungu": "부산해운대구",
    "displayName": "해운대구",
    "label": "부산광역시 해운대구"
  },
  {
    "code": "seoul-gangnam",
    "sido": "서울특별시",
    "sigungu": "강남구",
    "displayName": "강남구",
    "label": "서울특별시 강남구"
  },
  {
    "code": "seoul-gangdong",
    "sido": "서울특별시",
    "sigungu": "강동구",
    "displayName": "강동구",
    "label": "서울특별시 강동구"
  },
  {
    "code": "seoul-gangbuk",
    "sido": "서울특별시",
    "sigungu": "강북구",
    "displayName": "강북구",
    "label": "서울특별시 강북구"
  },
  {
    "code": "seoul-gangseo",
    "sido": "서울특별시",
    "sigungu": "강서구",
    "displayName": "강서구",
    "label": "서울특별시 강서구"
  },
  {
    "code": "seoul-gwanak",
    "sido": "서울특별시",
    "sigungu": "관악구",
    "displayName": "관악구",
    "label": "서울특별시 관악구"
  },
  {
    "code": "seoul-gwangjin",
    "sido": "서울특별시",
    "sigungu": "광진구",
    "displayName": "광진구",
    "label": "서울특별시 광진구"
  },
  {
    "code": "seoul-guro",
    "sido": "서울특별시",
    "sigungu": "구로구",
    "displayName": "구로구",
    "label": "서울특별시 구로구"
  },
  {
    "code": "seoul-geumcheon",
    "sido": "서울특별시",
    "sigungu": "금천구",
    "displayName": "금천구",
    "label": "서울특별시 금천구"
  },
  {
    "code": "seoul-nowon",
    "sido": "서울특별시",
    "sigungu": "노원구",
    "displayName": "노원구",
    "label": "서울특별시 노원구"
  },
  {
    "code": "seoul-dobong",
    "sido": "서울특별시",
    "sigungu": "도봉구",
    "displayName": "도봉구",
    "label": "서울특별시 도봉구"
  },
  {
    "code": "seoul-dongdaemun",
    "sido": "서울특별시",
    "sigungu": "동대문구",
    "displayName": "동대문구",
    "label": "서울특별시 동대문구"
  },
  {
    "code": "seoul-dongjak",
    "sido": "서울특별시",
    "sigungu": "동작구",
    "displayName": "동작구",
    "label": "서울특별시 동작구"
  },
  {
    "code": "seoul-mapo",
    "sido": "서울특별시",
    "sigungu": "마포구",
    "displayName": "마포구",
    "label": "서울특별시 마포구"
  },
  {
    "code": "seoul-seodaemun",
    "sido": "서울특별시",
    "sigungu": "서대문구",
    "displayName": "서대문구",
    "label": "서울특별시 서대문구"
  },
  {
    "code": "seoul-seocho",
    "sido": "서울특별시",
    "sigungu": "서초구",
    "displayName": "서초구",
    "label": "서울특별시 서초구"
  },
  {
    "code": "seoul-seongdong",
    "sido": "서울특별시",
    "sigungu": "성동구",
    "displayName": "성동구",
    "label": "서울특별시 성동구"
  },
  {
    "code": "seoul-seongbuk",
    "sido": "서울특별시",
    "sigungu": "성북구",
    "displayName": "성북구",
    "label": "서울특별시 성북구"
  },
  {
    "code": "seoul-songpa",
    "sido": "서울특별시",
    "sigungu": "송파구",
    "displayName": "송파구",
    "label": "서울특별시 송파구"
  },
  {
    "code": "seoul-yangcheon",
    "sido": "서울특별시",
    "sigungu": "양천구",
    "displayName": "양천구",
    "label": "서울특별시 양천구"
  },
  {
    "code": "seoul-yeongdeungpo",
    "sido": "서울특별시",
    "sigungu": "영등포구",
    "displayName": "영등포구",
    "label": "서울특별시 영등포구"
  },
  {
    "code": "seoul-yongsan",
    "sido": "서울특별시",
    "sigungu": "용산구",
    "displayName": "용산구",
    "label": "서울특별시 용산구"
  },
  {
    "code": "seoul-eunpyeong",
    "sido": "서울특별시",
    "sigungu": "은평구",
    "displayName": "은평구",
    "label": "서울특별시 은평구"
  },
  {
    "code": "seoul-jongno",
    "sido": "서울특별시",
    "sigungu": "종로구",
    "displayName": "종로구",
    "label": "서울특별시 종로구"
  },
  {
    "code": "seoul-7KSR6rWs",
    "sido": "서울특별시",
    "sigungu": "중구",
    "displayName": "중구",
    "label": "서울특별시 중구"
  },
  {
    "code": "seoul-jungnang",
    "sido": "서울특별시",
    "sigungu": "중랑구",
    "displayName": "중랑구",
    "label": "서울특별시 중랑구"
  },
  {
    "code": "sejong-7IS47KKF7I",
    "sido": "세종특별자치시",
    "sigungu": "세종시",
    "displayName": "세종시",
    "label": "세종특별자치시 세종시"
  },
  {
    "code": "ulsan-7Jq47IKw64",
    "sido": "울산광역시",
    "sigungu": "울산남구",
    "displayName": "남구",
    "label": "울산광역시 남구"
  },
  {
    "code": "ulsan-7Jq47IKw642",
    "sido": "울산광역시",
    "sigungu": "울산동구",
    "displayName": "동구",
    "label": "울산광역시 동구"
  },
  {
    "code": "ulsan-7Jq47IKw67",
    "sido": "울산광역시",
    "sigungu": "울산북구",
    "displayName": "북구",
    "label": "울산광역시 북구"
  },
  {
    "code": "ulsan-7Jq47IKw7J",
    "sido": "울산광역시",
    "sigungu": "울산울주군",
    "displayName": "울주군",
    "label": "울산광역시 울주군"
  },
  {
    "code": "ulsan-7Jq47IKw7K",
    "sido": "울산광역시",
    "sigungu": "울산중구",
    "displayName": "중구",
    "label": "울산광역시 중구"
  },
  {
    "code": "incheon-ganghwa",
    "sido": "인천광역시",
    "sigungu": "인천강화군",
    "displayName": "강화군",
    "label": "인천광역시 강화군"
  },
  {
    "code": "incheon-7J247LKc6r",
    "sido": "인천광역시",
    "sigungu": "인천계양구",
    "displayName": "계양구",
    "label": "인천광역시 계양구"
  },
  {
    "code": "incheon-7J247LKc64",
    "sido": "인천광역시",
    "sigungu": "인천남동구",
    "displayName": "남동구",
    "label": "인천광역시 남동구"
  },
  {
    "code": "incheon-7J247LKc642",
    "sido": "인천광역시",
    "sigungu": "인천동구",
    "displayName": "동구",
    "label": "인천광역시 동구"
  },
  {
    "code": "incheon-7J247LKc66",
    "sido": "인천광역시",
    "sigungu": "인천미추홀구",
    "displayName": "미추홀구",
    "label": "인천광역시 미추홀구"
  },
  {
    "code": "incheon-7J247LKc67",
    "sido": "인천광역시",
    "sigungu": "인천부평구",
    "displayName": "부평구",
    "label": "인천광역시 부평구"
  },
  {
    "code": "incheon-7J247LKc7I",
    "sido": "인천광역시",
    "sigungu": "인천서구",
    "displayName": "서구",
    "label": "인천광역시 서구"
  },
  {
    "code": "incheon-7J247LKc7J",
    "sido": "인천광역시",
    "sigungu": "인천연수구",
    "displayName": "연수구",
    "label": "인천광역시 연수구"
  },
  {
    "code": "incheon-7J247LKc7J2",
    "sido": "인천광역시",
    "sigungu": "인천옹진군",
    "displayName": "옹진군",
    "label": "인천광역시 옹진군"
  },
  {
    "code": "incheon-7J247LKc7K",
    "sido": "인천광역시",
    "sigungu": "인천중구",
    "displayName": "중구",
    "label": "인천광역시 중구"
  },
  {
    "code": "jeonnam-6rCV7KeE6r",
    "sido": "전라남도",
    "sigungu": "강진군",
    "displayName": "강진군",
    "label": "전라남도 강진군"
  },
  {
    "code": "jeonnam-6rOg7Z2l6r",
    "sido": "전라남도",
    "sigungu": "고흥군",
    "displayName": "고흥군",
    "label": "전라남도 고흥군"
  },
  {
    "code": "jeonnam-6rOh7ISx6r",
    "sido": "전라남도",
    "sigungu": "곡성군",
    "displayName": "곡성군",
    "label": "전라남도 곡성군"
  },
  {
    "code": "jeonnam-6rSR7JaR7I",
    "sido": "전라남도",
    "sigungu": "광양시",
    "displayName": "광양시",
    "label": "전라남도 광양시"
  },
  {
    "code": "jeonnam-6rWs66GA6r",
    "sido": "전라남도",
    "sigungu": "구례군",
    "displayName": "구례군",
    "label": "전라남도 구례군"
  },
  {
    "code": "jeonnam-64KY7KO87I",
    "sido": "전라남도",
    "sigungu": "나주시",
    "displayName": "나주시",
    "label": "전라남도 나주시"
  },
  {
    "code": "jeonnam-64u07JaR6r",
    "sido": "전라남도",
    "sigungu": "담양군",
    "displayName": "담양군",
    "label": "전라남도 담양군"
  },
  {
    "code": "jeonnam-mokpo",
    "sido": "전라남도",
    "sigungu": "목포시",
    "displayName": "목포시",
    "label": "전라남도 목포시"
  },
  {
    "code": "jeonnam-muan",
    "sido": "전라남도",
    "sigungu": "무안군",
    "displayName": "무안군",
    "label": "전라남도 무안군"
  },
  {
    "code": "jeonnam-67O07ISx6r",
    "sido": "전라남도",
    "sigungu": "보성군",
    "displayName": "보성군",
    "label": "전라남도 보성군"
  },
  {
    "code": "jeonnam-suncheon",
    "sido": "전라남도",
    "sigungu": "순천시",
    "displayName": "순천시",
    "label": "전라남도 순천시"
  },
  {
    "code": "jeonnam-7Iug7JWI6r",
    "sido": "전라남도",
    "sigungu": "신안군",
    "displayName": "신안군",
    "label": "전라남도 신안군"
  },
  {
    "code": "jeonnam-yeosu",
    "sido": "전라남도",
    "sigungu": "여수시",
    "displayName": "여수시",
    "label": "전라남도 여수시"
  },
  {
    "code": "jeonnam-7JiB6rSR6r",
    "sido": "전라남도",
    "sigungu": "영광군",
    "displayName": "영광군",
    "label": "전라남도 영광군"
  },
  {
    "code": "jeonnam-7JiB7JWU6r",
    "sido": "전라남도",
    "sigungu": "영암군",
    "displayName": "영암군",
    "label": "전라남도 영암군"
  },
  {
    "code": "jeonnam-7JmE64E6rW",
    "sido": "전라남도",
    "sigungu": "완도군",
    "displayName": "완도군",
    "label": "전라남도 완도군"
  },
  {
    "code": "jeonnam-7J6l7ISx6r",
    "sido": "전라남도",
    "sigungu": "장성군",
    "displayName": "장성군",
    "label": "전라남도 장성군"
  },
  {
    "code": "jeonnam-7J6l7Z2l6r",
    "sido": "전라남도",
    "sigungu": "장흥군",
    "displayName": "장흥군",
    "label": "전라남도 장흥군"
  },
  {
    "code": "jeonnam-7KeE64E6rW",
    "sido": "전라남도",
    "sigungu": "진도군",
    "displayName": "진도군",
    "label": "전라남도 진도군"
  },
  {
    "code": "jeonnam-7ZWo7YJ6rW",
    "sido": "전라남도",
    "sigungu": "함평군",
    "displayName": "함평군",
    "label": "전라남도 함평군"
  },
  {
    "code": "jeonnam-7ZW064Ko6r",
    "sido": "전라남도",
    "sigungu": "해남군",
    "displayName": "해남군",
    "label": "전라남도 해남군"
  },
  {
    "code": "jeonnam-7ZmU7Iic6r",
    "sido": "전라남도",
    "sigungu": "화순군",
    "displayName": "화순군",
    "label": "전라남도 화순군"
  },
  {
    "code": "jeonbuk-6rOg7LC96r",
    "sido": "전북특별자치도",
    "sigungu": "고창군",
    "displayName": "고창군",
    "label": "전북특별자치도 고창군"
  },
  {
    "code": "jeonbuk-6rWw7IKw7I",
    "sido": "전북특별자치도",
    "sigungu": "군산시",
    "displayName": "군산시",
    "label": "전북특별자치도 군산시"
  },
  {
    "code": "jeonbuk-6rmA7KCc7I",
    "sido": "전북특별자치도",
    "sigungu": "김제시",
    "displayName": "김제시",
    "label": "전북특별자치도 김제시"
  },
  {
    "code": "jeonbuk-64Ko7JuQ7I",
    "sido": "전북특별자치도",
    "sigungu": "남원시",
    "displayName": "남원시",
    "label": "전북특별자치도 남원시"
  },
  {
    "code": "jeonbuk-66y07KO86r",
    "sido": "전북특별자치도",
    "sigungu": "무주군",
    "displayName": "무주군",
    "label": "전북특별자치도 무주군"
  },
  {
    "code": "jeonbuk-67aA7JWI6r",
    "sido": "전북특별자치도",
    "sigungu": "부안군",
    "displayName": "부안군",
    "label": "전북특별자치도 부안군"
  },
  {
    "code": "jeonbuk-7Iic7LC96r",
    "sido": "전북특별자치도",
    "sigungu": "순창군",
    "displayName": "순창군",
    "label": "전북특별자치도 순창군"
  },
  {
    "code": "jeonbuk-7JmE7KO86r",
    "sido": "전북특별자치도",
    "sigungu": "완주군",
    "displayName": "완주군",
    "label": "전북특별자치도 완주군"
  },
  {
    "code": "jeonbuk-7J217IKw7I",
    "sido": "전북특별자치도",
    "sigungu": "익산시",
    "displayName": "익산시",
    "label": "전북특별자치도 익산시"
  },
  {
    "code": "jeonbuk-7J6E7Iuk6r",
    "sido": "전북특별자치도",
    "sigungu": "임실군",
    "displayName": "임실군",
    "label": "전북특별자치도 임실군"
  },
  {
    "code": "jeonbuk-7J6l7IiY6r",
    "sido": "전북특별자치도",
    "sigungu": "장수군",
    "displayName": "장수군",
    "label": "전북특별자치도 장수군"
  },
  {
    "code": "jeonbuk-7KCE7KO864",
    "sido": "전북특별자치도",
    "sigungu": "전주덕진구",
    "displayName": "덕진구",
    "label": "전북특별자치도 덕진구"
  },
  {
    "code": "jeonbuk-7KCE7KO87J",
    "sido": "전북특별자치도",
    "sigungu": "전주완산구",
    "displayName": "완산구",
    "label": "전북특별자치도 완산구"
  },
  {
    "code": "jeonbuk-7KCV7J2N7I",
    "sido": "전북특별자치도",
    "sigungu": "정읍시",
    "displayName": "정읍시",
    "label": "전북특별자치도 정읍시"
  },
  {
    "code": "jeonbuk-7KeE7JWI6r",
    "sido": "전북특별자치도",
    "sigungu": "진안군",
    "displayName": "진안군",
    "label": "전북특별자치도 진안군"
  },
  {
    "code": "jeju-7ISc6reA7Y",
    "sido": "제주특별자치도",
    "sigungu": "서귀포시",
    "displayName": "서귀포시",
    "label": "제주특별자치도 서귀포시"
  },
  {
    "code": "jeju-jeju",
    "sido": "제주특별자치도",
    "sigungu": "제주시",
    "displayName": "제주시",
    "label": "제주특별자치도 제주시"
  },
  {
    "code": "chungnam-6rOE66Oh7I",
    "sido": "충청남도",
    "sigungu": "계룡시",
    "displayName": "계룡시",
    "label": "충청남도 계룡시"
  },
  {
    "code": "chungnam-6rO17KO87I",
    "sido": "충청남도",
    "sigungu": "공주시",
    "displayName": "공주시",
    "label": "충청남도 공주시"
  },
  {
    "code": "chungnam-6riI7IKw6r",
    "sido": "충청남도",
    "sigungu": "금산군",
    "displayName": "금산군",
    "label": "충청남도 금산군"
  },
  {
    "code": "chungnam-64W87IKw7I",
    "sido": "충청남도",
    "sigungu": "논산시",
    "displayName": "논산시",
    "label": "충청남도 논산시"
  },
  {
    "code": "chungnam-64u57KeE7I",
    "sido": "충청남도",
    "sigungu": "당진시",
    "displayName": "당진시",
    "label": "충청남도 당진시"
  },
  {
    "code": "chungnam-67O066C57I",
    "sido": "충청남도",
    "sigungu": "보령시",
    "displayName": "보령시",
    "label": "충청남도 보령시"
  },
  {
    "code": "chungnam-67aA7Jes6r",
    "sido": "충청남도",
    "sigungu": "부여군",
    "displayName": "부여군",
    "label": "충청남도 부여군"
  },
  {
    "code": "chungnam-7ISc7IKw7I",
    "sido": "충청남도",
    "sigungu": "서산시",
    "displayName": "서산시",
    "label": "충청남도 서산시"
  },
  {
    "code": "chungnam-7ISc7LKc6r",
    "sido": "충청남도",
    "sigungu": "서천군",
    "displayName": "서천군",
    "label": "충청남도 서천군"
  },
  {
    "code": "chungnam-7JWE7IKw7I",
    "sido": "충청남도",
    "sigungu": "아산시",
    "displayName": "아산시",
    "label": "충청남도 아산시"
  },
  {
    "code": "chungnam-7JiI7IKw6r",
    "sido": "충청남도",
    "sigungu": "예산군",
    "displayName": "예산군",
    "label": "충청남도 예산군"
  },
  {
    "code": "chungnam-7LKc7JWI64",
    "sido": "충청남도",
    "sigungu": "천안동남구",
    "displayName": "동남구",
    "label": "충청남도 동남구"
  },
  {
    "code": "chungnam-7LKc7JWI7I",
    "sido": "충청남도",
    "sigungu": "천안서북구",
    "displayName": "서북구",
    "label": "충청남도 서북구"
  },
  {
    "code": "chungnam-7LKt7JaR6r",
    "sido": "충청남도",
    "sigungu": "청양군",
    "displayName": "청양군",
    "label": "충청남도 청양군"
  },
  {
    "code": "chungnam-7YOc7JWI6r",
    "sido": "충청남도",
    "sigungu": "태안군",
    "displayName": "태안군",
    "label": "충청남도 태안군"
  },
  {
    "code": "chungnam-7ZmN7ISx6r",
    "sido": "충청남도",
    "sigungu": "홍성군",
    "displayName": "홍성군",
    "label": "충청남도 홍성군"
  },
  {
    "code": "chungbuk-6rS07IKw6r",
    "sido": "충청북도",
    "sigungu": "괴산군",
    "displayName": "괴산군",
    "label": "충청북도 괴산군"
  },
  {
    "code": "chungbuk-64uo7JaR6r",
    "sido": "충청북도",
    "sigungu": "단양군",
    "displayName": "단양군",
    "label": "충청북도 단양군"
  },
  {
    "code": "chungbuk-67O07J2A6r",
    "sido": "충청북도",
    "sigungu": "보은군",
    "displayName": "보은군",
    "label": "충청북도 보은군"
  },
  {
    "code": "chungbuk-7JiB64Z6rW",
    "sido": "충청북도",
    "sigungu": "영동군",
    "displayName": "영동군",
    "label": "충청북도 영동군"
  },
  {
    "code": "chungbuk-7Jil7LKc6r",
    "sido": "충청북도",
    "sigungu": "옥천군",
    "displayName": "옥천군",
    "label": "충청북도 옥천군"
  },
  {
    "code": "chungbuk-7J2M7ISx6r",
    "sido": "충청북도",
    "sigungu": "음성군",
    "displayName": "음성군",
    "label": "충청북도 음성군"
  },
  {
    "code": "chungbuk-7KCc7LKc7I",
    "sido": "충청북도",
    "sigungu": "제천시",
    "displayName": "제천시",
    "label": "충청북도 제천시"
  },
  {
    "code": "chungbuk-7Kad7YJ6rW",
    "sido": "충청북도",
    "sigungu": "증평군",
    "displayName": "증평군",
    "label": "충청북도 증평군"
  },
  {
    "code": "chungbuk-7KeE7LKc6r",
    "sido": "충청북도",
    "sigungu": "진천군",
    "displayName": "진천군",
    "label": "충청북도 진천군"
  },
  {
    "code": "chungbuk-7LKt7KO87I",
    "sido": "충청북도",
    "sigungu": "청주상당구",
    "displayName": "상당구",
    "label": "충청북도 상당구"
  },
  {
    "code": "chungbuk-7LKt7KO87I2",
    "sido": "충청북도",
    "sigungu": "청주서원구",
    "displayName": "서원구",
    "label": "충청북도 서원구"
  },
  {
    "code": "chungbuk-7LKt7KO87L",
    "sido": "충청북도",
    "sigungu": "청주청원구",
    "displayName": "청원구",
    "label": "충청북도 청원구"
  },
  {
    "code": "chungbuk-7LKt7KO87Z",
    "sido": "충청북도",
    "sigungu": "청주흥덕구",
    "displayName": "흥덕구",
    "label": "충청북도 흥덕구"
  },
  {
    "code": "chungbuk-7Lap7KO87I",
    "sido": "충청북도",
    "sigungu": "충주시",
    "displayName": "충주시",
    "label": "충청북도 충주시"
  }
];
