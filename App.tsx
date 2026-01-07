
import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { AppMode, ResultMode, AspectRatio, StoryboardCut, EditParams } from './types';
import { SEQUENCE_TEMPLATES, EXPRESSIONS, SHOT_SIZES, LOGO_SVG } from './constants';
import { generateStoryboardLogic, generateImage, generateGridImage, editSingleImage, testConnection } from './services/geminiService';
import ThreeDCube from './components/ThreeDCube';

// 간단한 인코딩 함수 (로컬 저장용)
const encodeKey = (k: string) => btoa(k);
const decodeKey = (k: string) => k ? atob(k) : '';

interface ProcessTile {
  url: string;
  isEnhancing: boolean;
  isEnhanced?: boolean;
  customPrompt?: string;
}

const ICONS = {
  DIRECTING: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2-2v8a2 2 0 002 2z" />
    </svg>
  ),
  CAMERA: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  PROCESS: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  ),
  WORKS: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  DOWNLOAD: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15V3m0 12l-4-4m4 4l4-4M4 17v1a2 2 0 002 2h12a2 2 0 002-2v-1" />
    </svg>
  ),
  ENHANCE: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  CONFIRM: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  ),
  ZIP: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  KEY: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  )
};

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(() => decodeKey(localStorage.getItem('SCENE_MASTER_USER_KEY') || ''));
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(!apiKey);
  const [tempKey, setTempKey] = useState(apiKey);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [mode, setMode] = useState<AppMode>(AppMode.CINEMA);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [history, setHistory] = useState<StoryboardCut[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [lightboxPrompt, setLightboxPrompt] = useState("");

  const [selectedTemplate, setSelectedTemplate] = useState(SEQUENCE_TEMPLATES[0].id);
  const [aspectRatio, setAspectRatio] = useState(AspectRatio.LANDSCAPE);
  const [resultMode, setResultMode] = useState<ResultMode>(ResultMode.GRID);
  const [cinemaScenario, setCinemaScenario] = useState("");

  const [editParams, setEditParams] = useState<EditParams>({
    rotation: 0,
    tilt: 0,
    zoom: 0,
    denoising: 0.5,
    expression: '기본',
    shotSize: '미디엄 샷',
    customPrompt: ''
  });
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [inferredAspectRatio, setInferredAspectRatio] = useState<string>("1:1");

  const [splitCols, setSplitCols] = useState(3);
  const [splitRows, setSplitRows] = useState(3);
  const [splitResults, setSplitResults] = useState<ProcessTile[]>([]);
  const [processAspectRatio, setProcessAspectRatio] = useState<string>('16:9');

  const filteredHistory = history.filter(cut => {
    if (mode === AppMode.GALLERY) return true;
    if (mode === AppMode.CINEMA) return cut.projectId === '그리드 프로젝트' || cut.projectId === '개별 장면';
    if (mode === AppMode.EDIT) return cut.projectId === '카메라워크';
    if (mode === AppMode.PROCESS) return cut.projectId === '분할 강화';
    return true;
  });

  const currentTemplateObj = SEQUENCE_TEMPLATES.find(t => t.id === selectedTemplate);

  // 이미지 비율 추론 함수
  const inferRatio = (url: string) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      const ratio = img.width / img.height;
      if (ratio > 2) setInferredAspectRatio("21:9");
      else if (ratio > 1.4) setInferredAspectRatio("16:9");
      else if (ratio > 1.1) setInferredAspectRatio("4:3");
      else if (ratio > 0.9) setInferredAspectRatio("1:1");
      else if (ratio > 0.6) setInferredAspectRatio("3:4");
      else setInferredAspectRatio("9:16");
    };
  };

  const handleSaveKey = async () => {
    if (!tempKey) return;
    setIsTestingKey(true);
    setKeyStatus('idle');
    const isValid = await testConnection(tempKey);
    setIsTestingKey(false);
    
    if (isValid) {
      setKeyStatus('success');
      setApiKey(tempKey);
      localStorage.setItem('SCENE_MASTER_USER_KEY', encodeKey(tempKey));
      setTimeout(() => setIsKeyModalOpen(false), 800);
    } else {
      setKeyStatus('error');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultUrl = reader.result as string;
        setBaseImage(resultUrl);
        inferRatio(resultUrl);
        if (mode === AppMode.EDIT) setEditedImage(resultUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setBaseImage(null);
    if (mode === AppMode.EDIT) setEditedImage(null);
  };

  const handleMoveToProcess = (imageUrl: string) => {
    setBaseImage(imageUrl);
    setMode(AppMode.PROCESS);
    setSplitResults([]); 
    setPreviewImageUrl(null); 
  };

  const handleMoveToEdit = (imageUrl: string) => {
    setBaseImage(imageUrl);
    setEditedImage(imageUrl);
    inferRatio(imageUrl);
    setMode(AppMode.EDIT);
    setPreviewImageUrl(null);
  };

  const handleGenerateGrid = async () => {
    if (!apiKey) { setIsKeyModalOpen(true); return; }
    setIsLoading(true);
    setLoadingStep("시나리오를 구성하고 있습니다...");
    try {
      // 그리드 생성 시에도 먼저 상세 장면 지문을 생성하여 메타데이터 확보
      const storyboard = await generateStoryboardLogic(
        apiKey,
        baseImage, 
        currentTemplateObj?.name || "",
        cinemaScenario
      );

      if (resultMode === ResultMode.GRID) {
        setLoadingStep("3x3 스토리보드 그리드를 렌더링 중...");
        const gridUrl = await generateGridImage(
          apiKey,
          baseImage, 
          currentTemplateObj?.name || "",
          cinemaScenario
        );

        // 9개 장면의 지문을 하나의 문자열로 결합 (라이트박스 표시용)
        const combinedCaption = storyboard.scenes
          .map((s, i) => `[Scene ${i + 1}] ${s.caption}`)
          .join('\n\n');

        const newCut: StoryboardCut = {
          id: Date.now().toString(),
          imageUrl: gridUrl,
          caption: combinedCaption,
          prompt: "그리드 생성",
          projectId: '그리드 프로젝트'
        };
        setHistory([newCut, ...history]);
      } else {
        setLoadingStep("9개의 장면을 개별 생성 중...");
        const generatedCuts: StoryboardCut[] = [];
        
        for (let i = 0; i < storyboard.scenes.length; i++) {
          setLoadingStep(`장면 ${i+1}/9 생성 중...`);
          const scene = storyboard.scenes[i];
          const url = await generateImage(
            apiKey,
            baseImage, 
            scene.prompt, 
            aspectRatio
          );
          generatedCuts.push({
            id: `${Date.now()}-${i}`,
            imageUrl: url,
            caption: scene.caption,
            prompt: scene.prompt,
            projectId: '개별 장면'
          });
        }
        setHistory([...generatedCuts, ...history]);
      }
    } catch (error: any) {
      alert(`생성 중 오류 발생: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleEnhanceHistoryItem = async (id: string, customInstruction?: string) => {
    if (!apiKey) { setIsKeyModalOpen(true); return; }
    const item = history.find(h => h.id === id);
    if (!item) return;

    setIsLoading(true);
    setLoadingStep("이미지 디테일을 강화하고 있습니다...");
    try {
      const prompt = customInstruction 
        ? `Enhance this cinematic image based on this instruction: ${customInstruction}. 
           STRICT RULE: The output must be a clean image ONLY. Remove all borders, margins, descriptive text, watermarks, or UI elements.
           Refine textures, lighting, and clarity while keeping the original composition and characters exactly the same.`
        : `Mastering: Enhance this cinematic image to maximum quality. 
           STRICT RULE: The output must be a clean image ONLY. Remove all borders, margins, descriptive text, watermarks, or UI elements.
           Refine textures, lighting, and clarity while keeping the original composition and characters exactly the same.`;
      
      const result = await editSingleImage(apiKey, item.imageUrl, prompt);

      const newHistory = history.map(h => 
        h.id === id ? { ...h, imageUrl: result, projectId: '강화된 마스터' } : h
      );
      setHistory(newHistory);
      if (previewImageUrl === item.imageUrl) setPreviewImageUrl(result);
    } catch (error: any) {
      alert(`해상도 개선 중 오류: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleEnhanceBaseImage = async (customInstruction?: string) => {
    if (!apiKey) { setIsKeyModalOpen(true); return; }
    if (!baseImage) return;

    setIsLoading(true);
    setLoadingStep("원본 이미지의 해상도를 개선하고 있습니다...");
    try {
      const prompt = customInstruction
        ? `Enhance this source image based on this instruction: ${customInstruction}. 
           STRICT RULE: The output must be a clean image ONLY. Remove all borders, margins, descriptive text, watermarks, or UI elements.
           Improve textures, sharpen details, and optimize lighting while preserving all original features.`
        : `Mastering: Enhance this source image to professional cinematic quality. 
           STRICT RULE: The output must be a clean image ONLY. Remove all borders, margins, descriptive text, watermarks, or UI elements.
           Improve textures, sharpen details, and optimize lighting while preserving all original features.`

      const result = await editSingleImage(apiKey, baseImage, prompt);

      setBaseImage(result);
      if (previewImageUrl === baseImage) setPreviewImageUrl(result);
      if (mode === AppMode.EDIT) setEditedImage(result);

      const newCut: StoryboardCut = {
        id: Date.now().toString(),
        imageUrl: result,
        caption: customInstruction ? `원본 개선 (${customInstruction})` : "원본 이미지 해상도 개선",
        prompt: prompt,
        projectId: '강화된 마스터'
      };
      setHistory([newCut, ...history]);
    } catch (error: any) {
      alert(`원본 해상도 개선 실패: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleEditPreview = async () => {
    if (!apiKey) { setIsKeyModalOpen(true); return; }
    if (!baseImage) return;
    setIsLoading(true);
    setLoadingStep("시네마틱 카메라 물리 연산을 수행 중...");
    try {
      // 1. Rotation (수평 회전) Semantic Mapping
      let rotDesc = "";
      const absRot = Math.abs(editParams.rotation);
      if (absRot < 15) {
        rotDesc = "Frontal eye-level view, looking directly at the camera.";
      } else if (absRot < 60) {
        rotDesc = `Three-quarter ${editParams.rotation > 0 ? 'right' : 'left'} angle view.`;
      } else if (absRot < 110) {
        rotDesc = `Side profile view from the ${editParams.rotation > 0 ? 'right' : 'left'}.`;
      } else if (absRot < 160) {
        rotDesc = `Over-the-shoulder rear-${editParams.rotation > 0 ? 'right' : 'left'} cinematic view.`;
      } else {
        rotDesc = "EXACT REAR VIEW, facing completely away from the camera. Showing only the back of the head, hair, and clothing. The subject's face is COMPLETELY HIDDEN. Ensure the person is looking away from the viewer.";
      }

      // 2. Tilt (수직 기울기) Semantic Mapping
      let tiltDesc = "Neutral eye-level camera height.";
      if (editParams.tilt > 25) {
        tiltDesc = "Dramatic LOW-ANGLE shot looking up, creating a heroic and imposing perspective of the subject.";
      } else if (editParams.tilt < -25) {
        tiltDesc = "Cinematic HIGH-ANGLE bird's-eye view looking down, creating a sense of scale and perspective from above.";
      }

      // 3. Zoom & Shot Size Mapping
      let zoomDesc = `Primary Shot Size: ${editParams.shotSize}.`;
      if (editParams.zoom > 25) {
        zoomDesc += " Extremely tight zoom-in (Extreme Close-Up), capturing intense minute textures and focused details.";
      } else if (editParams.zoom > 10) {
        zoomDesc += " Tightened focal distance (Close-Up) for intimate detail.";
      } else if (editParams.zoom < -25) {
        zoomDesc += " Very wide-angle lens (Extreme Wide Shot), capturing extensive environment and atmospheric background scale.";
      } else if (editParams.zoom < -10) {
        zoomDesc += " Pulled back focal distance (Wide Shot) for broader environmental perspective.";
      }

      const instructions = `
        [CINEMATIC CAMERA DIRECTIVE]
        - ORIENTATION: ${rotDesc}
        - CAMERA ANGLE: ${tiltDesc}
        - LENS FOCAL DEPTH: ${zoomDesc}
        - SUBJECT EXPRESSION: Change subject's facial expression to '${editParams.expression}'.
        - STYLE OVERRIDE: ${editParams.customPrompt || "Preserve the original cinematic lighting and mood."}

        [STRICT VISUAL CONTINUITY]
        - Maintain 100% character identity: Keep exactly the same hair style, hair color, facial features, and specific clothing (color and fabric) seen in the reference image.
        - The background environment and atmosphere must remain consistent with the reference.
        - If 'REAR VIEW' is active, DO NOT show the face. Strictly render the back side of the character.

        [OUTPUT RULE]
        - Output a CLEAN cinematic image only. No text, watermarks, borders, or UI elements.
        - Ensure the output fills the frame according to the requested aspect ratio.
      `;

      // 원본 비율 유지가 선택된 경우 추론된 비율을 사용
      const targetRatio = aspectRatio === AspectRatio.ORIGINAL ? inferredAspectRatio : (aspectRatio as string);

      const result = await editSingleImage(apiKey, baseImage, instructions, targetRatio);
      setEditedImage(result);
      const newCut: StoryboardCut = {
        id: Date.now().toString(),
        imageUrl: result,
        caption: `카메라워크 연출: ${editParams.shotSize} / ${rotDesc}`,
        prompt: instructions,
        projectId: '카메라워크'
      };
      setHistory([newCut, ...history]);
    } catch (error: any) {
      alert(`편집 실패: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleSplitImage = () => {
    if (!baseImage) return;
    const img = new Image();
    img.src = baseImage;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const tileWidth = img.width / splitCols;
      const tileHeight = img.height / splitRows;
      const tiles: ProcessTile[] = [];
      for (let y = 0; y < splitRows; y++) {
        for (let x = 0; x < splitCols; x++) {
          canvas.width = tileWidth;
          canvas.height = tileHeight;
          ctx.drawImage(img, x * tileWidth, y * tileHeight, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
          tiles.push({ url: canvas.toDataURL(), isEnhancing: false });
        }
      }
      setSplitResults(tiles);
    };
  };

  const handleEnhanceTile = async (index: number, customInstruction?: string) => {
    if (!apiKey) { setIsKeyModalOpen(true); return; }
    if (index < 0 || index >= splitResults.length) return;

    const tile = splitResults[index];
    const newTiles = [...splitResults];
    newTiles[index].isEnhancing = true;
    setSplitResults(newTiles);

    if (previewImageUrl === tile.url) {
      setIsLoading(true);
      setLoadingStep("선택한 타일의 해상도를 개선하고 있습니다...");
    }

    try {
      const prompt = `Enhance cinematic quality and clarity of this specific panel. 
                      ${customInstruction || tile.customPrompt || ""}
                      STRICT RULE: The output must be a clean image ONLY. Remove all borders, margins, descriptive text, watermarks, or UI elements.`;
      
      const result = await editSingleImage(apiKey, tile.url, prompt, processAspectRatio);
      
      const finalTiles = [...splitResults];
      finalTiles[index] = { ...finalTiles[index], url: result, isEnhancing: false, isEnhanced: true };
      setSplitResults(finalTiles);

      if (previewImageUrl === tile.url) setPreviewImageUrl(result);

      const newCut: StoryboardCut = {
        id: Date.now().toString(),
        imageUrl: result,
        caption: `강화된 패널 ${index + 1}${customInstruction ? ` (${customInstruction})` : ''}`,
        prompt: prompt,
        projectId: '분할 강화'
      };
      setHistory([newCut, ...history]);
    } catch (error: any) {
      alert(`해상도 개선 실패: ${error.message}`);
      const resetTiles = [...splitResults];
      resetTiles[index].isEnhancing = false;
      setSplitResults(resetTiles);
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleLightboxEnhance = () => {
    const activeCut = history.find(hi => hi.imageUrl === previewImageUrl);
    if (activeCut) {
      handleEnhanceHistoryItem(activeCut.id, lightboxPrompt);
    } else if (previewImageUrl === baseImage) {
      handleEnhanceBaseImage(lightboxPrompt);
    } else {
      const tileIdx = splitResults.findIndex(t => t.url === previewImageUrl);
      if (tileIdx !== -1) handleEnhanceTile(tileIdx, lightboxPrompt);
    }
  };

  const handleDownloadHistoryZip = async () => {
    const targets = selectedIds.size > 0 
      ? history.filter(h => selectedIds.has(h.id))
      : history;

    if (targets.length === 0) return;
    
    setIsLoading(true);
    setLoadingStep(`${targets.length}개의 파일을 압축 중...`);
    
    try {
      const zip = new JSZip();
      const folder = zip.folder("scene-master-storyboard");
      for (let i = 0; i < targets.length; i++) {
        const cut = targets[i];
        const res = await fetch(cut.imageUrl);
        const blob = await res.blob();
        folder?.file(`shot_${cut.id}.png`, blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `storyboard_${new Date().getTime()}_${targets.length}files.zip`;
      link.click();
    } catch (e) {
      alert("압축 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const activeCut = history.find(h => h.imageUrl === previewImageUrl);

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-slate-200">
      {isLoading && (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4"></div>
          <p className="text-amber-500 font-black uppercase text-xs tracking-widest animate-pulse">{loadingStep}</p>
        </div>
      )}

      <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">{LOGO_SVG}</div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase">Scene Master</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">by 디스이즈머니</p>
          </div>
        </div>
        <nav className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700">
          {[
            { id: AppMode.CINEMA, label: '디렉팅', icon: ICONS.DIRECTING },
            { id: AppMode.EDIT, label: '카메라워크', icon: ICONS.CAMERA },
            { id: AppMode.PROCESS, label: '분할및개선', icon: ICONS.PROCESS },
            { id: AppMode.GALLERY, label: '작업물', icon: ICONS.WORKS },
          ].map(item => (
            <button key={item.id} onClick={() => setMode(item.id as AppMode)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === item.id ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsKeyModalOpen(true)} className={`p-2 rounded-lg border transition-all ${apiKey ? 'border-slate-700 text-slate-500 hover:text-amber-500' : 'border-amber-500/50 text-amber-500 animate-pulse bg-amber-500/5'}`} title="API 키 설정">
            {ICONS.KEY}
          </button>
          <button 
            onClick={handleDownloadHistoryZip} 
            disabled={history.length === 0}
            className={`p-2 rounded-lg border transition-all flex items-center gap-2 ${selectedIds.size > 0 ? 'bg-amber-500 border-amber-500 text-slate-900 shadow-xl shadow-amber-500/50' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white disabled:opacity-30'}`} 
            title={selectedIds.size > 0 ? `${selectedIds.size}개 항목 압축 다운로드` : "전체 항목 압축 다운로드"}
          >
            {ICONS.ZIP}
            {selectedIds.size > 0 && <span className="text-xs font-black">{selectedIds.size}</span>}
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-[360px] border-r border-slate-800 bg-slate-900/30 overflow-y-auto p-6 space-y-8 no-scrollbar">
          <section>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-1 h-3 bg-amber-500 rounded-full"></div> 원본 이미지
            </h3>
            <div className={`relative group aspect-video rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden ${baseImage ? 'border-amber-500/50' : 'border-slate-700 hover:border-slate-500 bg-slate-800/50'}`}>
              {baseImage ? (
                <>
                  <img src={baseImage} className="w-full h-full object-cover" alt="Source" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label className="cursor-pointer p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md border border-white/20 transition-all">
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 9l-4-4m0 0L8 9m4-4v12" strokeWidth={2} /></svg>
                    </label>
                    <button onClick={handleRemoveImage} className="p-3 bg-red-500/20 hover:bg-red-500/40 rounded-full backdrop-blur-md border border-red-500/20 text-red-400 transition-all">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} /></svg>
                    </button>
                  </div>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center text-center p-8">
                  <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-400 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={2.5} /></svg>
                  </div>
                  <span className="text-xs font-bold text-slate-300">이미지 업로드</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </section>

          {mode === AppMode.CINEMA && (
            <section className="space-y-6 animate-in slide-in-from-left-4 duration-500">
              <div>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><div className="w-1 h-3 bg-amber-500 rounded-full"></div> 서사 템플릿</h3>
                <div className="space-y-3">
                  <div className="relative">
                    <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm font-bold text-slate-200 outline-none focus:border-amber-500 transition-all appearance-none cursor-pointer">
                      {SEQUENCE_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  {currentTemplateObj && (
                    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 flex gap-3 animate-in fade-in duration-300">
                      <img src={currentTemplateObj.previewUrl} className="w-16 h-16 rounded object-cover border border-slate-700 shadow-lg" alt="Preview" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-amber-500 uppercase mb-1">상세 내용</p>
                        <p className="text-[11px] text-slate-400 leading-tight font-medium">{currentTemplateObj.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">화면 비율</label>
                  <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold outline-none cursor-pointer">
                    {Object.values(AspectRatio).map(ratio => <option key={ratio} value={ratio}>{ratio}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">생성 형식</label>
                  <div className="flex p-1 bg-slate-800 rounded-lg border border-slate-700">
                    <button onClick={() => setResultMode(ResultMode.GRID)} className={`flex-1 py-1.5 rounded-md text-[9px] font-black transition-all ${resultMode === ResultMode.GRID ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>3x3 그리드</button>
                    <button onClick={() => setResultMode(ResultMode.INDIVIDUAL)} className={`flex-1 py-1.5 rounded-md text-[9px] font-black transition-all ${resultMode === ResultMode.INDIVIDUAL ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>9장 개별</button>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">시나리오 및 설정</label>
                <textarea value={cinemaScenario} onChange={(e) => setCinemaScenario(e.target.value)} placeholder="분위기나 특정 상황에 대한 추가 지시사항을 입력하세요..." className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-xs font-medium h-24 outline-none focus:border-amber-500 transition-all resize-none placeholder:text-slate-600" />
              </div>
              <button onClick={handleGenerateGrid} disabled={isLoading} className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-slate-900 font-black rounded-xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95">
                {isLoading ? <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div> : <>{ICONS.DIRECTING} <span>디렉팅 시작하기</span></>}
              </button>
            </section>
          )}

          {mode === AppMode.EDIT && (
            <section className="space-y-6 animate-in slide-in-from-left-4 duration-500">
              <ThreeDCube rotation={editParams.rotation} tilt={editParams.tilt} zoom={editParams.zoom} previewImage={editedImage || baseImage} />
              <div className="space-y-5">
                {[
                  { label: '수평 회전 (Rotation)', key: 'rotation', min: -180, max: 180 },
                  { label: '수직 기울기 (Tilt)', key: 'tilt', min: -90, max: 90 },
                  { label: '확대/축소 (Zoom)', key: 'zoom', min: -50, max: 50 },
                ].map(param => (
                  <div key={param.key}>
                    <div className="flex justify-between mb-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{param.label}</label>
                      <span className="text-[10px] font-mono text-amber-500">{(editParams as any)[param.key]}</span>
                    </div>
                    <input type="range" min={param.min} max={param.max} value={(editParams as any)[param.key]} onChange={(e) => setEditParams({...editParams, [param.key]: parseInt(e.target.value)})} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">표정 설정</label>
                  <select value={editParams.expression} onChange={(e) => setEditParams({...editParams, expression: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-[10px] font-bold outline-none cursor-pointer">
                    {EXPRESSIONS.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">샷 사이즈</label>
                  <select value={editParams.shotSize} onChange={(e) => setEditParams({...editParams, shotSize: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-[10px] font-bold outline-none cursor-pointer">
                    {SHOT_SIZES.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleEditPreview} disabled={isLoading || !baseImage} className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-slate-900 font-black rounded-xl transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-amber-500/10">
                {isLoading ? <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div> : <>{ICONS.CAMERA} <span>카메라 렌더링</span></>}
              </button>
            </section>
          )}

          {mode === AppMode.PROCESS && (
            <section className="space-y-6 animate-in slide-in-from-left-4 duration-500">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">가로 분할 (열)</label>
                  <input type="number" min="1" max="5" value={splitCols} onChange={(e) => setSplitCols(parseInt(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">세로 분할 (행)</label>
                  <input type="number" min="1" max="5" value={splitRows} onChange={(e) => setSplitRows(parseInt(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">타겟 비율</label>
                <select value={processAspectRatio} onChange={(e) => setProcessAspectRatio(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold outline-none cursor-pointer">
                  {Object.values(AspectRatio).map(ratio => <option key={ratio} value={ratio}>{ratio}</option>)}
                </select>
              </div>
              <button onClick={handleSplitImage} disabled={!baseImage} className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-900 font-black rounded-xl transition-all active:scale-95">이미지 분할 시작</button>
            </section>
          )}
        </aside>

        <section className="flex-1 bg-[#0f172a] overflow-y-auto p-10 no-scrollbar relative">
          {mode === AppMode.PROCESS && splitResults.length > 0 ? (
            <div className="grid gap-0 mx-auto max-w-[1200px]" style={{ gridTemplateColumns: `repeat(${splitCols}, minmax(0, 1fr))` }}>
              {splitResults.map((tile, idx) => (
                <div key={idx} className="group relative aspect-video bg-slate-800 overflow-hidden shadow-xl transition-all">
                  <img src={tile.url} className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform duration-500" alt={`Tile ${idx}`} onClick={() => setPreviewImageUrl(tile.url)} />
                  {tile.isEnhanced && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 text-slate-900 text-[8px] font-black rounded uppercase shadow-lg">개선됨</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-slate-900/90 p-3 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm flex gap-2 border-t border-slate-700 items-center">
                    <input type="text" placeholder="개선 프롬프트 입력..." value={tile.customPrompt || ""} onChange={(e) => { const n = [...splitResults]; n[idx].customPrompt = e.target.value; setSplitResults(n); }} className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[10px] outline-none text-slate-200" />
                    <button onClick={(e) => { e.stopPropagation(); handleEnhanceTile(idx); }} className="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded transition-all active:scale-95" title="확인">
                      {ICONS.CONFIRM}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleEnhanceTile(idx); }} disabled={tile.isEnhancing} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg transition-all disabled:bg-slate-700 flex items-center justify-center gap-1.5 min-w-[100px] text-[10px] font-black">
                      {tile.isEnhancing ? <div className="w-3 h-3 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div> : <>{ICONS.ENHANCE} <span>해상도 개선</span></>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredHistory.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1400px] mx-auto">
              {filteredHistory.map((cut) => (
                <article key={cut.id} className={`group relative flex flex-col bg-slate-800/50 rounded-2xl border-2 transition-all overflow-hidden cursor-zoom-in ${selectedIds.has(cut.id) ? 'border-amber-500 ring-4 ring-amber-500/10' : 'border-slate-800 hover:border-slate-700'}`} onClick={() => setPreviewImageUrl(cut.imageUrl)}>
                  <div className="relative aspect-video overflow-hidden">
                    <img src={cut.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Cut" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
                    
                    {/* 선택 체크박스 */}
                    <div onClick={(e) => { e.stopPropagation(); toggleSelect(cut.id); }} className={`absolute top-4 left-4 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all z-10 ${selectedIds.has(cut.id) ? 'bg-amber-500 border-amber-500 text-slate-900 shadow-lg' : 'bg-black/20 border-white/40 text-transparent opacity-0 group-hover:opacity-100 hover:border-white'}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>
                    </div>

                    <div className="absolute top-4 right-4 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all items-center">
                      <button onClick={(e) => { e.stopPropagation(); handleMoveToProcess(cut.imageUrl); }} className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 rounded-lg backdrop-blur-md border border-indigo-600 text-white transition-all shadow-xl flex items-center gap-2 text-[10px] font-black">
                        {ICONS.PROCESS} <span>분할</span>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleMoveToEdit(cut.imageUrl); }} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 rounded-lg backdrop-blur-md border border-amber-600 text-slate-900 transition-all shadow-xl flex items-center gap-2 text-[10px] font-black" title="카메라워크로 이동">
                        {ICONS.CAMERA} <span>편집</span>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleEnhanceHistoryItem(cut.id); }} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg backdrop-blur-md border border-slate-600 text-white transition-all shadow-xl flex items-center gap-1.5 text-[10px] font-black">
                        {ICONS.ENHANCE} <span>개선</span>
                      </button>
                      {/* 개별 다운로드 버튼 */}
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          const a = document.createElement('a');
                          a.href = cut.imageUrl;
                          a.download = `shot_${cut.id}.png`;
                          a.click();
                        }} 
                        className="p-1.5 bg-white hover:bg-slate-200 rounded-lg text-black transition-all shadow-xl active:scale-95"
                      >
                        {ICONS.DOWNLOAD}
                      </button>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 bg-slate-700 text-[9px] font-black text-slate-300 rounded uppercase tracking-widest">{cut.projectId}</span>
                      <span className="text-[10px] text-slate-500 font-bold">{new Date(parseInt(cut.id.split('-')[0])).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-300 leading-relaxed line-clamp-3 italic">"{cut.caption.split('\n\n')[0].replace(/\[Scene \d+\] /, '')}"</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto opacity-40">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-8 border border-slate-700">
                <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={1.5} /></svg>
              </div>
              <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">디렉팅 준비 완료</h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">이미지를 업로드하고 영화적 서사를 시작하세요.</p>
            </div>
          )}
        </section>
      </main>

      {isKeyModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20 text-amber-500">{ICONS.KEY}</div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Gemini API 키 설정</h2>
              <p className="text-slate-500 text-xs font-bold mt-2 leading-relaxed uppercase tracking-widest">직접 API 키를 입력하여 엔진을 활성화하세요.</p>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <input type="password" value={tempKey} onChange={(e) => setTempKey(e.target.value)} placeholder="AI_KEY_HERE..." className={`w-full bg-slate-800/50 border rounded-2xl px-6 py-4 text-sm font-mono outline-none transition-all ${keyStatus === 'error' ? 'border-red-500 focus:ring-red-500/20' : keyStatus === 'success' ? 'border-emerald-500 focus:ring-emerald-500/20' : 'border-slate-700 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10'}`} />
                {isTestingKey && <div className="absolute right-4 top-1/2 -translate-y-1/2"><div className="w-4 h-4 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div></div>}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4">
                <button onClick={() => setIsKeyModalOpen(false)} disabled={!apiKey} className="py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black rounded-2xl transition-all disabled:opacity-50 text-xs uppercase">취소</button>
                <button onClick={handleSaveKey} disabled={isTestingKey || !tempKey} className="py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-slate-900 font-black rounded-2xl transition-all shadow-xl shadow-amber-500/10 text-xs uppercase">{isTestingKey ? '테스트 중...' : '테스트 및 저장'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewImageUrl && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300" onClick={() => setPreviewImageUrl(null)}>
          <div className="relative max-w-[1600px] w-full h-full flex flex-col md:flex-row items-center justify-center gap-8" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewImageUrl(null)} className="absolute top-[-40px] md:top-0 right-0 p-4 text-white/50 hover:text-white transition-colors z-50">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={1.5} /></svg>
            </button>
            
            {/* 왼쪽: 이미지 영역 */}
            <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden rounded-2xl border border-white/5 shadow-2xl bg-black/20">
              <img src={previewImageUrl} className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95 duration-500" alt="Preview" />
            </div>
            
            {/* 오른쪽: 정보 및 제어 영역 */}
            <div className="w-full md:w-[480px] h-fit md:h-full flex flex-col bg-slate-900/90 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
              <div className="p-8 flex-1 overflow-y-auto no-scrollbar space-y-8">
                <div>
                  <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-1 h-3 bg-amber-500 rounded-full"></div> 감독의 연출 지문
                  </h3>
                  <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                    {activeCut ? (
                      <div className="space-y-4">
                        {activeCut.caption.split('\n\n').map((para, idx) => (
                          <div key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                            {para.startsWith('[Scene') ? (
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-amber-500/60 uppercase">{para.split(']')[0] + ']'}</span>
                                <p className="text-sm font-medium text-slate-200 leading-relaxed tracking-tight">
                                  {para.split(']')[1].trim()}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm font-medium text-slate-200 leading-relaxed tracking-tight italic">
                                "{para}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 font-medium">선택된 이미지에 대한 연출 정보가 없습니다.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-1 h-3 bg-slate-700 rounded-full"></div> 스마트 리마스터링
                  </h3>
                  <div className="flex flex-col gap-2">
                    <textarea 
                      value={lightboxPrompt}
                      onChange={(e) => setLightboxPrompt(e.target.value)}
                      placeholder="디테일 수정 또는 추가 연출 지시..."
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-xs text-white outline-none focus:border-amber-500 transition-all resize-none h-24"
                    />
                    <button onClick={handleLightboxEnhance} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95">
                      {ICONS.CONFIRM} <span>지시사항 적용하여 강화</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-900 border-t border-slate-800 grid grid-cols-2 gap-3">
                <button onClick={() => handleMoveToProcess(previewImageUrl)} className="py-4 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/20 font-black text-[10px] uppercase rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95">
                  {ICONS.PROCESS} 분할 및 개선
                </button>
                <button onClick={() => handleMoveToEdit(previewImageUrl)} className="py-4 bg-amber-500 text-slate-900 font-black text-[10px] uppercase rounded-xl hover:bg-amber-400 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-amber-500/10">
                  {ICONS.CAMERA} 카메라워크 이동
                </button>
                <button onClick={handleLightboxEnhance} className="py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] uppercase rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95">
                  {ICONS.ENHANCE} 해상도 개선
                </button>
                <button 
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = previewImageUrl;
                    a.download = "scene_master_shot.png";
                    a.click();
                  }}
                  className="py-4 bg-white text-black font-black text-[10px] uppercase rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {ICONS.DOWNLOAD} 다운로드
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="h-10 border-t border-slate-800 bg-slate-900/80 px-6 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">상태: <span className={apiKey ? "text-emerald-500" : "text-amber-500"}>{apiKey ? "엔진 활성화됨" : "API 키 설정 필요"}</span></span>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{history.length}개의 컷 생성됨</span>
        </div>
        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">© 2024 SCENE MASTER STUDIO · DIS-IS-MONEY</div>
      </footer>
    </div>
  );
};

export default App;
