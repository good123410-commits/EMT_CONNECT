import { CommunityBoardPage } from './CommunityBoardPage';

/** EMS 질문 게시판 — 질문&답변 카테고리 전용 */
export function CommunityQnaPage() {
  return (
    <CommunityBoardPage
      mode="qna"
      heroTitle="EMS 질문하기"
      heroSubtitle="응급·현장 관련 질문을 남기고 구급대원의 답변을 확인하세요"
      writeLabel="질문하기"
    />
  );
}
