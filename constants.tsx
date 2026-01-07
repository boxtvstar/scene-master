
import React from 'react';
import { SequenceTemplate } from './types';

export const SEQUENCE_TEMPLATES: SequenceTemplate[] = [
  { id: 'none', name: '없음 (None)', description: '특별한 템플릿 없이 사용자의 지시사항과 이미지 분석에만 집중합니다.', previewUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=300' },
  { id: 'farewell', name: '작별 (Farewell)', description: '부드러운 조명과 함께 감정적인 이별의 순간을 연출합니다.', previewUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=300' },
  { id: 'trailer', name: '시네마틱 트레일러', description: '빠른 호흡과 높은 대비의 웅장한 샷으로 구성됩니다.', previewUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=300' },
  { id: 'war', name: '전쟁 및 결투', description: '강렬한 액션, 로우 앵글, 거친 질감의 연출입니다.', previewUrl: 'https://images.unsplash.com/photo-1506466010722-395aa2bef877?auto=format&fit=crop&q=80&w=300' },
  { id: 'peace', name: '평온한 일상', description: '넓은 샷과 자연광을 활용한 평화로운 분위기입니다.', previewUrl: 'https://images.unsplash.com/photo-1499728966931-cfb44249a43a?auto=format&fit=crop&q=80&w=300' },
  { id: 'suspense', name: '미스테리/서스펜스', description: '긴장감 넘치는 클로즈업과 그림자를 강조합니다.', previewUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=300' },
  { id: 'cyberpunk', name: '사이버펑크/SF', description: '네온 조명과 하이테크적인 차가운 느낌을 연출합니다.', previewUrl: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=300' },
  { id: 'romance', name: '로맨틱 판타지', description: '몽환적이고 따뜻한 톤의 아름다운 장면을 만듭니다.', previewUrl: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?auto=format&fit=crop&q=80&w=300' },
  { id: 'horror', name: '심리적 공포', description: '기괴한 앵글과 차가운 색조로 공포를 자아냅니다.', previewUrl: 'https://images.unsplash.com/photo-1505633560063-d8247f077e9a?auto=format&fit=crop&q=80&w=300' },
  { id: 'noir', name: '필름 누아르', description: '흑백의 강한 대비와 고독한 도시 분위기입니다.', previewUrl: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&q=80&w=300' },
  { id: 'comedy', name: '경쾌한 코미디', description: '밝은 채도와 다채로운 샷으로 즐거움을 줍니다.', previewUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=300' },
  { id: 'espionage', name: '첩보 액션 (Espionage)', description: '세련된 도시 배경과 긴장감 넘치는 추격전을 묘사합니다.', previewUrl: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&q=80&w=300' },
  { id: 'historical', name: '시대극/사극', description: '고전적인 건축물과 전통 의상의 우아함을 담아냅니다.', previewUrl: 'https://images.unsplash.com/photo-1461397821064-32d6b3c91b9f?auto=format&fit=crop&q=80&w=300' },
  { id: 'nature', name: '자연 다큐멘터리', description: '압도적인 자연 경관과 생생한 질감을 강조합니다.', previewUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=300' },
  { id: 'disaster', name: '재난 영화', description: '거대한 파괴와 혼돈, 생존의 긴박함을 연출합니다.', previewUrl: 'https://images.unsplash.com/photo-1502759683299-cdcc6974244f?auto=format&fit=crop&q=80&w=300' },
  { id: 'comingage', name: '성장 드라마', description: '청춘의 풋풋함과 감정의 변화를 섬세하게 포착합니다.', previewUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=300' },
  { id: 'postapoc', name: '포스트 아포칼립스', description: '황량한 폐허와 거친 생존의 현장을 묘사합니다.', previewUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=300' },
  { id: 'sports', name: '스포츠 열정', description: '역동적인 움직임과 승부의 뜨거운 에너지를 담습니다.', previewUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=300' },
  { id: 'musical', name: '뮤지컬/퍼포먼스', description: '화려한 무대 조명과 예술적 퍼포먼스를 연출합니다.', previewUrl: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=300' },
  { id: 'gourmet', name: '요리/미식 (Gourmet)', description: '음식의 질감과 조리 과정의 디테일을 극대화합니다.', previewUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=300' },
  { id: 'space', name: '우주 탐사 (Space)', description: '광활한 우주와 신비로운 성운, 미지의 탐험을 그립니다.', previewUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=300' },
];

export const EXPRESSIONS = ['기본', '미소', '슬픔/눈물', '분너', '공포', '놀람', '고민중'];
export const SHOT_SIZES = ['와이드 샷', '풀 샷', '니 샷 (무릎)', '미디엄 샷', '클로즈업', '익스트림 클로즈업'];

export const LOGO_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
