# 장애인권 퀴즈

서버나 로그인 없이 브라우저에서 실행하는 정적 웹앱입니다.

## 실행

ES 모듈을 사용하므로 로컬 웹 서버로 실행하세요.

```bash
python3 -m http.server 8000
```

그 후 `http://localhost:8000`을 엽니다.

## 문제 수정

모든 문제는 `src/questions.js`의 `questions` 배열에 있습니다. 각 문제는 고유한 `id`와 `difficulty`, `type`, `question`, `answer`, `explanation`을 가집니다. 객관식에는 `options`, 주관식에는 필요에 따라 `displayAnswer`를 추가합니다.
