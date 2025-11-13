import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Circle, Triangle, Download, Trash2, X } from 'lucide-react';

export default function AnimationStudio() {
  const [objects, setObjects] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedTransitionIndex, setSelectedTransitionIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(15);
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [copiedTransition, setCopiedTransition] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartPositions, setDragStartPositions] = useState({});
  const [resizingId, setResizingId] = useState(null);
  const [resizeStart, setResizeStart] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null);
  const [selectionStart, setSelectionStart] = useState(null);
  const [copiedObjects, setCopiedObjects] = useState(null);

  const animationRef = useRef(null);
  const canvasRef = useRef(null);

  const primarySelectedId = selectedIds[0] || null;
  const selectedObject = objects.find(obj => obj.id === primarySelectedId);

  const addObject = (type, startTime = 0) => {
    const x = Math.random() * (window.innerWidth - 300) + 150; // sensible canvas-centered random
    const y = Math.random() * (window.innerHeight - 300) + 150;
    const base = {
      x,
      y,
      width: type === 'rectangle' ? 100 : type === 'text' ? 200 : null,
      height: type === 'rectangle' ? 60 : type === 'text' ? 40 : null,
      scale: 1,
      rotation: 0,
      color: type === 'circle' ? '#3b82f6' : type === 'square' ? '#ef4444' : type === 'triangle' ? '#10b981' : type === 'text' ? '#ffffff' : '#f59e0b',
      text: type === 'text' ? 'Double click to edit' : '',
      easing: 'linear'
    };

    const fadeDuration = 0.5;
    let transitions = [];

    if (startTime > 0) {
      // Keep object invisible from 0 -> startTime, then fade in over fadeDuration
      transitions = [
        { startTime: 0, duration: startTime, ...base, opacity: 0 },
        { startTime: startTime, duration: fadeDuration, ...base, opacity: 0 },
        { startTime: startTime + fadeDuration, duration: 0, ...base, opacity: 1 }
      ];
    } else {
      transitions = [
        { startTime: 0, duration: 0, ...base, opacity: 1 }
      ];
    }

    const newObj = {
      id: `obj_${Date.now()}`,
      name: `${type}_${objects.filter(o => o.type === type).length + 1}`,
      type,
      transitions
    };

    setObjects(prev => [...prev, newObj]);
    setSelectedIds([newObj.id]);
    setSelectedTransitionIndex(0);
  };

  const deleteObject = (id) => {
    setObjects(prev => prev.filter(obj => obj.id !== id));
    setSelectedIds(prev => prev.filter(sid => sid !== id));
  };

  const handleContextMenu = (e, objId, transIndex) => {
    e.preventDefault();
    e.stopPropagation();
    // treat both undefined and null as "object-level" context (no specific transition)
    const isObject = objId && (transIndex === undefined || transIndex === null);
    setContextMenu({ x: e.clientX, y: e.clientY, objId, transIndex, isObject });
    if (objId && !selectedIds.includes(objId)) {
      setSelectedIds([objId]);
    }
    if (transIndex !== undefined && transIndex !== null) {
      setSelectedTransitionIndex(transIndex);
    }
  };

  const closeContextMenu = () => setContextMenu(null);

  const openTransitionModal = () => {
    setShowTransitionModal(true);
    closeContextMenu();
  };

  const copyObjects = () => {
    if (selectedIds.length === 0) return;
    const objectsToCopy = objects.filter(obj => selectedIds.includes(obj.id));
    setCopiedObjects(JSON.parse(JSON.stringify(objectsToCopy)));
    closeContextMenu();
  };

  const pasteObjects = () => {
    if (!copiedObjects) return;

    const newObjects = copiedObjects.map(obj => ({
      ...obj,
      id: `obj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      name: `${obj.name}_copy`,
      transitions: obj.transitions.map(t => ({ ...t, x: t.x + 50, y: t.y + 50 }))
    }));

    setObjects(prev => [...prev, ...newObjects]);
    setSelectedIds(newObjects.map(o => o.id));
    closeContextMenu();
  };

  const copyTransition = () => {
    if (!contextMenu) return;
    const obj = objects.find(o => o.id === contextMenu.objId);
    if (!obj) return;
    const trans = obj.transitions[contextMenu.transIndex];
    if (!trans) return;
    setCopiedTransition({ ...trans });
    closeContextMenu();
  };

  const addTransitionToObject = (objId, newTransition) => {
    setObjects(prevObjects => prevObjects.map(o => {
      if (o.id === objId) {
        return { ...o, transitions: [...o.transitions, newTransition] };
      }
      return o;
    }));
  };

  const pasteTransition = () => {
    if (!copiedTransition || !contextMenu) return;
    const obj = objects.find(o => o.id === contextMenu.objId);
    if (!obj) return;
    const lastTransition = obj.transitions[obj.transitions.length - 1];
    const newStartTime = lastTransition.startTime + lastTransition.duration;

    const newTransition = {
      ...copiedTransition,
      startTime: newStartTime,
      x: lastTransition.x,
      y: lastTransition.y
    };

    addTransitionToObject(contextMenu.objId, newTransition);
    closeContextMenu();
  };

  const addTransition = (transitionDuration, easing) => {
    if (selectedIds.length === 0) return;

    setObjects(prevObjects => {
      const updated = prevObjects.map(o => {
        if (selectedIds.includes(o.id)) {
          const lastTransition = o.transitions[o.transitions.length - 1];
          const newStartTime = lastTransition.startTime + lastTransition.duration;

          const newTransition = {
            startTime: newStartTime,
            duration: transitionDuration,
            x: lastTransition.x,
            y: lastTransition.y,
            width: lastTransition.width,
            height: lastTransition.height,
            scale: lastTransition.scale,
            rotation: lastTransition.rotation,
            opacity: lastTransition.opacity,
            color: lastTransition.color,
            text: lastTransition.text || '',
            easing: easing
          };

          return { ...o, transitions: [...o.transitions, newTransition] };
        }
        return o;
      });
      return updated;
    });

    // update duration based on selected objects' new end time
    const maxEnd = selectedIds.reduce((acc, id) => {
      const obj = objects.find(o => o.id === id);
      if (!obj) return acc;
      const last = obj.transitions[obj.transitions.length - 1];
      const end = last.startTime + last.duration + transitionDuration;
      return Math.max(acc, end);
    }, duration);
    if (maxEnd > duration) {
      setDuration(Math.min(maxEnd + 2, 30));
    }

    setShowTransitionModal(false);
  };

  const updateTransition = (objId, transIndex, updates) => {
    setObjects(prev => prev.map(obj => {
      if (obj.id === objId) {
        const newTransitions = [...obj.transitions];
        newTransitions[transIndex] = { ...newTransitions[transIndex], ...updates };
        return { ...obj, transitions: newTransitions };
      }
      return obj;
    }));
  };

  const deleteTransition = (objId, transIndex) => {
    if (transIndex === 0) return;
    setObjects(prev => prev.map(obj => {
      if (obj.id === objId) {
        const newTransitions = obj.transitions.filter((_, i) => i !== transIndex);
        return { ...obj, transitions: newTransitions };
      }
      return obj;
    }));
    if (selectedTransitionIndex === transIndex) {
      setSelectedTransitionIndex(Math.max(0, transIndex - 1));
    }
  };

  const getObjectStateAtTime = (obj, time) => {
    if (!obj || !obj.transitions || obj.transitions.length === 0) return null;

    const transitions = obj.transitions.slice().sort((a, b) => a.startTime - b.startTime);

    // Before the first keyframe: keep the initial shape but hidden
    if (time < transitions[0].startTime) {
      return { ...transitions[0], opacity: 0 };
    }

    const lastIndex = transitions.length - 1;

    // After last keyframe's end: return the last keyframe state
    const last = transitions[lastIndex];
    if (time >= last.startTime + (last.duration || 0)) {
      return last;
    }

    // Find the segment where time falls
    for (let i = 0; i < transitions.length; i++) {
      const t = transitions[i];
      const start = t.startTime;
      const dur = t.duration || 0;
      const end = start + dur;

      // If this transition has duration and time is within it -> interpolate from this (start) to next (end)
      if (dur > 0 && time >= start && time <= end) {
        const from = t;
        const to = transitions[i + 1] || t;
        const rawProgress = (time - start) / dur;
        const progress = Math.max(0, Math.min(1, rawProgress));
        const eased = applyEasing(progress, from.easing);

        const interp = (a, b) => (a === undefined ? b : a + (b - a) * eased);

        return {
          x: interp(from.x, to.x),
          y: interp(from.y, to.y),
          width: from.width !== undefined ? interp(from.width, to.width) : to.width,
          height: from.height !== undefined ? interp(from.height, to.height) : to.height,
          scale: interp(from.scale ?? 1, to.scale ?? 1),
          rotation: interp(from.rotation ?? 0, to.rotation ?? 0),
          opacity: interp(from.opacity ?? 1, to.opacity ?? 1),
          color: to.color ?? from.color,
          text: to.text ?? from.text ?? ''
        };
      }

      // If time is exactly at the start of this transition or between this transition end and next start -> return this state
      const nextStart = transitions[i + 1] ? transitions[i + 1].startTime : Infinity;
      if (time >= start && time < nextStart) {
        return t;
      }
    }

    return null;
  };

  const applyEasing = (t, easing) => {
    switch (easing) {
      case 'ease-in': return t * t;
      case 'ease-out': return t * (2 - t);
      case 'ease-in-out': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      case 'bounce': return Math.sin(t * Math.PI);
      default: return t;
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current && !isPlaying) {
      // Clear selection if clicking directly on canvas
      if (!e.ctrlKey && !e.metaKey) {
        setSelectedIds([]);
        setSelectedTransitionIndex(null);
      }
      const rect = canvasRef.current.getBoundingClientRect();
      setSelectionStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setSelectionBox({ x: e.clientX - rect.left, y: e.clientY - rect.top, width: 0, height: 0 });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (selectionStart && !isPlaying) {
      const rect = canvasRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const x = Math.min(selectionStart.x, currentX);
      const y = Math.min(selectionStart.y, currentY);
      const width = Math.abs(currentX - selectionStart.x);
      const height = Math.abs(currentY - selectionStart.y);

      setSelectionBox({ x, y, width, height });
    }
  };

  const handleCanvasMouseUp = () => {
    if (selectionBox && selectionBox.width > 5 && selectionBox.height > 5) {
      const selected = objects.filter(obj => {
        const lastTrans = obj.transitions[obj.transitions.length - 1];
        if (!lastTrans) return false;
        return (
          lastTrans.x >= selectionBox.x &&
          lastTrans.x <= selectionBox.x + selectionBox.width &&
          lastTrans.y >= selectionBox.y &&
          lastTrans.y <= selectionBox.y + selectionBox.height
        );
      }).map(obj => obj.id);

      setSelectedIds(selected);
      setSelectedTransitionIndex(0);
    }
    setSelectionStart(null);
    setSelectionBox(null);
  };

  const handleMouseDown = (e, objId, transIndex, isResizeHandle = false) => {
    if (isPlaying) return;
    e.stopPropagation();

    if (isResizeHandle) {
      setResizingId(`${objId}-${transIndex}`);
      const obj = objects.find(o => o.id === objId);
      const trans = obj.transitions[transIndex];
      setResizeStart({
        width: trans.width ?? 100,
        height: trans.height ?? 60,
        scale: trans.scale ?? 1,
        startX: e.clientX,
        startY: e.clientY
      });
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      setSelectedIds(prev => prev.includes(objId) ? prev.filter(id => id !== objId) : [...prev, objId]);
      return;
    }

    if (!selectedIds.includes(objId)) {
      setSelectedIds([objId]);
    }

    setSelectedTransitionIndex(transIndex);
    setDraggingId(`${objId}-${transIndex}`);

    const obj = objects.find(o => o.id === objId);
    const trans = obj.transitions[transIndex];
    const rect = canvasRef.current.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left - (trans.x ?? 0), y: e.clientY - rect.top - (trans.y ?? 0) });

    // Store initial positions for ALL currently selected objects
    const positions = {};
    const allSelected = selectedIds.includes(objId) ? selectedIds : [...selectedIds.filter(Boolean), objId];

    allSelected.forEach(id => {
      const selectedObj = objects.find(o => o.id === id);
      if (selectedObj && selectedObj.transitions[transIndex]) {
        positions[id] = {
          x: selectedObj.transitions[transIndex].x,
          y: selectedObj.transitions[transIndex].y,
          transIndex: transIndex
        };
      }
    });

    setDragStartPositions(positions);
  };

  const handleMouseMove = (e) => {
    if (isPlaying) return;

    if (resizingId && resizeStart) {
      const [objId, transIndex] = resizingId.split('-');
      const deltaX = e.clientX - resizeStart.startX;
      const deltaY = e.clientY - resizeStart.startY;

      const obj = objects.find(o => o.id === objId);
      if (!obj) return;

      if (obj.type === 'rectangle') {
        const newWidth = Math.max(20, resizeStart.width + deltaX);
        const newHeight = Math.max(20, resizeStart.height + deltaY);
        updateTransition(objId, parseInt(transIndex), { width: newWidth, height: newHeight });
      } else {
        const avgDelta = (deltaX + deltaY) / 2;
        const newScale = Math.max(0.1, Math.min(3, resizeStart.scale + avgDelta / 50));
        updateTransition(objId, parseInt(transIndex), { scale: newScale });
      }
      return;
    }

    if (!draggingId) return;

    const [objId, transIndex] = draggingId.split('-');
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left - dragOffset.x;
    const currentY = e.clientY - rect.top - dragOffset.y;

    const originalPos = dragStartPositions[objId];
    if (!originalPos) {
      updateTransition(objId, parseInt(transIndex), { x: currentX, y: currentY });
      return;
    }

    const deltaX = currentX - originalPos.x;
    const deltaY = currentY - originalPos.y;

    // Move ALL objects in dragStartPositions (which includes all selected objects)
    Object.keys(dragStartPositions).forEach(id => {
      const startPos = dragStartPositions[id];
      if (startPos) {
        updateTransition(id, startPos.transIndex, {
          x: startPos.x + deltaX,
          y: startPos.y + deltaY
        });
      }
    });
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setResizingId(null);
    setResizeStart(null);
    setDragStartPositions({});
  };

  useEffect(() => {
    if (draggingId || resizingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingId, resizingId, dragOffset, selectedIds, objects, dragStartPositions, resizeStart]);

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        copyObjects();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        pasteObjects();
      }
      // Add Delete key support
      if (e.key === 'Delete' && selectedIds.length > 0) {
        e.preventDefault();
        selectedIds.forEach(id => deleteObject(id));
      }
    };
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedIds, objects, copiedObjects, deleteObject]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    } else {
      setIsPlaying(true);
      const startTime = Date.now() - (currentTime * 1000);

      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= duration) {
          setCurrentTime(0);
          setIsPlaying(false);
          if (animationRef.current) cancelAnimationFrame(animationRef.current);
        } else {
          setCurrentTime(elapsed);
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      animate();
    }
  };

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const exportAnimation = () => {
    const data = {
      duration,
      objects: objects.map(obj => ({
        id: obj.id,
        name: obj.name,
        type: obj.type,
        transitions: obj.transitions
      }))
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'animation.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderMotionTrail = (obj) => {
    if (isPlaying || obj.transitions.length < 2) return null;
    const points = obj.transitions.map(t => ({ x: t.x, y: t.y }));

    return (
      <svg key={`trail-${obj.id}`} className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
        {points.map((point, i) => {
          if (i === points.length - 1) return null;
          const nextPoint = points[i + 1];
          return <line key={i} x1={point.x} y1={point.y} x2={nextPoint.x} y2={nextPoint.y} stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" strokeDasharray="5,5" />;
        })}
        {points.map((point, i) => <circle key={`dot-${i}`} cx={point.x} cy={point.y} r="3" fill="rgba(255, 255, 255, 0.5)" />)}
      </svg>
    );
  };

  const renderShape = (obj, state, isGhost = false, transIndex = null) => {
    if (!state) return null;
    const size = 50 * (state.scale ?? 1);
    const isSelected = selectedIds.includes(obj.id) && selectedTransitionIndex === transIndex;
    const borderStyle = isSelected && !isPlaying ? '3px solid white' : isGhost ? '2px dashed rgba(255,255,255,0.5)' : (selectedIds.includes(obj.id) && !isPlaying ? '2px solid rgba(255,255,255,0.6)' : 'none');

    const baseStyle = {
      position: 'absolute',
      left: `${state.x}px`,
      top: `${state.y}px`,
      opacity: isGhost ? (state.opacity ?? 1) * 0.4 : (state.opacity ?? 1),
      transform: `translate(-50%, -50%) rotate(${state.rotation ?? 0}deg)`,
      cursor: isPlaying ? 'default' : 'move',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${12 * (state.scale ?? 1)}px`,
      fontWeight: 'bold',
      color: 'white',
      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
      userSelect: 'none',
      pointerEvents: isGhost ? 'none' : 'auto', // ghost shouldn't block mouse events
      zIndex: isSelected ? 20 : 5
    };

    const textContent = state.text || '';

    const resizeHandle = (!isPlaying && !isGhost && isSelected) ? (
      <div
        style={{
          position: 'absolute',
          bottom: -8,
          right: -8,
          width: 12,
          height: 12,
          backgroundColor: 'white',
          border: '2px solid #3b82f6',
          cursor: 'nwse-resize',
          zIndex: 30
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          handleMouseDown(e, obj.id, transIndex, true);
        }}
      />
    ) : null;

    if (obj.type === 'circle') {
      return (
        <div
          key={`${obj.id}-${transIndex}-${isGhost ? 'ghost' : 'solid'}`}
          style={{ ...baseStyle, width: `${size}px`, height: `${size}px`, borderRadius: '50%', backgroundColor: state.color, border: borderStyle }}
          onMouseDown={(e) => handleMouseDown(e, obj.id, transIndex)}
          onContextMenu={(e) => handleContextMenu(e, obj.id, transIndex)}
        >
          {textContent}
          {resizeHandle}
        </div>
      );
    } else if (obj.type === 'square') {
      return (
        <div
          key={`${obj.id}-${transIndex}-${isGhost ? 'ghost' : 'solid'}`}
          style={{ ...baseStyle, width: `${size}px`, height: `${size}px`, backgroundColor: state.color, border: borderStyle }}
          onMouseDown={(e) => handleMouseDown(e, obj.id, transIndex)}
          onContextMenu={(e) => handleContextMenu(e, obj.id, transIndex)}
        >
          {textContent}
          {resizeHandle}
        </div>
      );
    } else if (obj.type === 'rectangle') {
      const width = ((state.width ?? 100) * (state.scale ?? 1));
      const height = ((state.height ?? 60) * (state.scale ?? 1));
      return (
        <div
          key={`${obj.id}-${transIndex}-${isGhost ? 'ghost' : 'solid'}`}
          style={{ ...baseStyle, width: `${width}px`, height: `${height}px`, backgroundColor: state.color, border: borderStyle }}
          onMouseDown={(e) => handleMouseDown(e, obj.id, transIndex)}
          onContextMenu={(e) => handleContextMenu(e, obj.id, transIndex)}
        >
          {textContent}
          {resizeHandle}
        </div>
      );
    } else if (obj.type === 'triangle') {
      return (
        <div
          key={`${obj.id}-${transIndex}-${isGhost ? 'ghost' : 'solid'}`}
          style={{ ...baseStyle }}
          onMouseDown={(e) => handleMouseDown(e, obj.id, transIndex)}
          onContextMenu={(e) => handleContextMenu(e, obj.id, transIndex)}
        >
          <div style={{ width: 0, height: 0, borderLeft: `${size / 2}px solid transparent`, borderRight: `${size / 2}px solid transparent`, borderBottom: `${size}px solid ${state.color}`, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '50%', top: `${size * 0.4}px`, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>{textContent}</span>
          </div>
          {resizeHandle}
        </div>
      );
    } else if (obj.type === 'text') {
      const width = ((state.width ?? 200) * (state.scale ?? 1));
      const height = ((state.height ?? 40) * (state.scale ?? 1));
      return (
        <div
          key={`${obj.id}-${transIndex}-${isGhost ? 'ghost' : 'solid'}`}
          style={{
            ...baseStyle,
            width: `${width}px`,
            height: `${height}px`,
            border: borderStyle || '1px solid rgba(255,255,255,0.2)',
            backgroundColor: 'transparent',
            color: state.color,
            fontSize: `${Math.min(height * 0.8, width * 0.1)}px`,
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
          onMouseDown={(e) => handleMouseDown(e, obj.id, transIndex)}
          onContextMenu={(e) => handleContextMenu(e, obj.id, transIndex)}
          onDoubleClick={() => {
            if (!isPlaying && !isGhost) {
              const newText = prompt('Enter text:', state.text);
              if (newText !== null) {
                updateTransition(obj.id, transIndex, { text: newText });
              }
            }
          }}
        >
          {state.text}
          {resizeHandle}
        </div>
      );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <h1 className="text-xl font-bold">Animation Studio</h1>
        <div className="flex gap-2">
          <span className="text-sm text-gray-400 self-center">Ctrl+Click multi-select | Drag canvas to select | Ctrl+C/V to copy/paste</span>
          <button onClick={exportAnimation} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded">
            <Download size={18} />
            Export JSON
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-sm font-semibold mb-2">Add Objects</h2>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => addObject('circle')} className="p-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center justify-center">
                <Circle size={20} />
              </button>
              <button onClick={() => addObject('square')} className="p-2 bg-red-600 hover:bg-red-700 rounded flex items-center justify-center">
                <Square size={20} />
              </button>
              <button onClick={() => addObject('triangle')} className="p-2 bg-green-600 hover:bg-green-700 rounded flex items-center justify-center">
                <Triangle size={20} />
              </button>
              <button onClick={() => addObject('rectangle')} className="p-2 bg-orange-600 hover:bg-orange-700 rounded text-xs">
                Rect
              </button>
              <button onClick={() => addObject('text')} className="p-2 bg-purple-600 hover:bg-purple-700 rounded text-xs col-span-2">
                Text
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-2">Objects ({selectedIds.length} selected)</h2>
            {objects.map(obj => (
              <div key={obj.id} className={`flex items-center justify-between p-2 mb-1 rounded cursor-pointer ${selectedIds.includes(obj.id) ? 'bg-gray-700' : 'bg-gray-750 hover:bg-gray-700'}`}
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    setSelectedIds(prev => prev.includes(obj.id) ? prev.filter(id => id !== obj.id) : [...prev, obj.id]);
                  } else {
                    setSelectedIds([obj.id]);
                    setSelectedTransitionIndex(obj.transitions.length - 1);
                  }
                }}
                onContextMenu={(e) => handleContextMenu(e, obj.id, undefined)}
              >
                <span className="text-sm">{obj.name}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteObject(obj.id); }} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div
            ref={canvasRef}
            className="flex-1 bg-gray-700 relative overflow-hidden"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
          >
            {objects.map(obj => renderMotionTrail(obj))}

            {objects.map(obj => {
              const allTransitions = obj.transitions.map((trans, idx) => ({ trans, idx }));

              return (
                <React.Fragment key={obj.id}>
                  {!isPlaying && allTransitions.slice(0, -1).map(({ trans, idx }) => (
                    renderShape(obj, trans, true, idx)
                  ))}
                  {renderShape(obj, isPlaying ? getObjectStateAtTime(obj, currentTime) : obj.transitions[obj.transitions.length - 1], false, obj.transitions.length - 1)}
                </React.Fragment>
              );
            })}

            {selectionBox && (
              <div
                style={{
                  position: 'absolute',
                  left: selectionBox.x,
                  top: selectionBox.y,
                  width: selectionBox.width,
                  height: selectionBox.height,
                  border: '2px dashed #3b82f6',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  pointerEvents: 'none'
                }}
              />
            )}
          </div>

          <div className="h-48 bg-gray-800 border-t border-gray-700 p-4">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={togglePlay} className="p-2 bg-blue-600 hover:bg-blue-700 rounded">{isPlaying ? <Pause size={20} /> : <Play size={20} />}</button>
            <span className="text-sm">{currentTime.toFixed(2)}s / {duration}s</span>
            {/* <button 
              onClick={() => {
                const time = prompt('Enter time to add object (in seconds):', currentTime.toFixed(2));
                if (time !== null) {
                  const type = prompt('Enter object type (circle, square, triangle, rectangle, text):', 'circle');
                  if (type && ['circle', 'square', 'triangle', 'rectangle', 'text'].includes(type.toLowerCase())) {
                    addObject(type.toLowerCase(), parseFloat(time));
                  } else {
                    alert('Invalid object type');
                  }
                }
              }}
              className="px-
            >
              Add at Time
            </button> */} 
          </div>
            <div className="relative h-16 bg-gray-900 rounded overflow-x-auto">
              <input type="range" min="0" max={duration} step="0.01" value={currentTime} onChange={(e) => setCurrentTime(parseFloat(e.target.value))} className="absolute w-full h-full opacity-0 cursor-pointer z-10" disabled={isPlaying} />
              <div className="absolute w-full h-full flex items-center px-2">
                <div className="w-full h-8 bg-gray-700 relative">
                  <div className="absolute h-full bg-blue-500 opacity-30" style={{ width: `${(currentTime / duration) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-72 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
          {selectedObject && selectedTransitionIndex !== null && selectedObject.transitions[selectedTransitionIndex] ? (
            <div>
              <h2 className="text-sm font-semibold mb-1">{selectedObject.name}</h2>
              <p className="text-xs text-gray-400 mb-3">{selectedTransitionIndex === 0 ? 'Initial State' : `Transition ${selectedTransitionIndex}`}</p>
              {selectedTransitionIndex > 0 && (
                <div className="mb-4 p-2 bg-gray-700 rounded">
                  <button onClick={() => deleteTransition(selectedObject.id, selectedTransitionIndex)} className="w-full text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded">Delete Transition</button>
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs mb-1">Text</label>
                  <input type="text" value={selectedObject.transitions[selectedTransitionIndex].text || ''} onChange={(e) => updateTransition(selectedObject.id, selectedTransitionIndex, { text: e.target.value })} className="w-full px-3 py-2 bg-gray-700 rounded text-white text-sm" placeholder="Enter text..." />
                </div>
                {selectedObject.type === 'rectangle' && (
                  <>
                    <div>
                      <label className="block text-xs mb-1">Width: {selectedObject.transitions[selectedTransitionIndex].width ?? 100}</label>
                      <input type="range" min="20" max="300" value={selectedObject.transitions[selectedTransitionIndex].width ?? 100} onChange={(e) => updateTransition(selectedObject.id, selectedTransitionIndex, { width: parseInt(e.target.value) })} className="w-full" />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Height: {selectedObject.transitions[selectedTransitionIndex].height ?? 60}</label>
                      <input type="range" min="20" max="300" value={selectedObject.transitions[selectedTransitionIndex].height ?? 60} onChange={(e) => updateTransition(selectedObject.id, selectedTransitionIndex, { height: parseInt(e.target.value) })} className="w-full" />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-xs mb-1">Scale: {(selectedObject.transitions[selectedTransitionIndex].scale ?? 1).toFixed(1)}</label>
                  <input type="range" min="0.1" max="3" step="0.1" value={selectedObject.transitions[selectedTransitionIndex].scale ?? 1} onChange={(e) => updateTransition(selectedObject.id, selectedTransitionIndex, { scale: parseFloat(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs mb-1">Rotation: {selectedObject.transitions[selectedTransitionIndex].rotation ?? 0}°</label>
                  <input type="range" min="0" max="360" value={selectedObject.transitions[selectedTransitionIndex].rotation ?? 0} onChange={(e) => updateTransition(selectedObject.id, selectedTransitionIndex, { rotation: parseInt(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs mb-1">Opacity: {(selectedObject.transitions[selectedTransitionIndex].opacity ?? 1).toFixed(1)}</label>
                  <input type="range" min="0" max="1" step="0.1" value={selectedObject.transitions[selectedTransitionIndex].opacity ?? 1} onChange={(e) => updateTransition(selectedObject.id, selectedTransitionIndex, { opacity: parseFloat(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs mb-1">Color</label>
                  <input type="color" value={selectedObject.transitions[selectedTransitionIndex].color ?? '#ffffff'} onChange={(e) => updateTransition(selectedObject.id, selectedTransitionIndex, { color: e.target.value })} className="w-full h-8 rounded" />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">{selectedIds.length > 1 ? `${selectedIds.length} objects selected - right-click to add transition` : 'Select an object to edit'}</div>
          )}
        </div>
      </div>

      {contextMenu && (
        <div className="fixed bg-gray-800 border border-gray-700 rounded shadow-lg py-1 z-50" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(e) => e.stopPropagation()}>
          {contextMenu.isObject ? (
            <>
              <button onClick={copyObjects} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700">Copy Object(s)</button>
              {copiedObjects && <button onClick={pasteObjects} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700">Paste Object(s)</button>}
            </>
          ) : (
            <>
              <button onClick={openTransitionModal} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700">Add Transition</button>
              <button onClick={copyTransition} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700">Copy Transition</button>
              {copiedTransition && <button onClick={pasteTransition} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700">Paste Transition</button>}
            </>
          )}
        </div>
      )}

      {showTransitionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Transition {selectedIds.length > 1 && `(${selectedIds.length} objects)`}</h3>
              <button onClick={() => setShowTransitionModal(false)}><X size={20} /></button>
            </div>
            <TransitionForm onSubmit={addTransition} onCancel={() => setShowTransitionModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function TransitionForm({ onSubmit, onCancel }) {
  const [duration, setDuration] = useState(1);
  const [easing, setEasing] = useState('linear');

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm mb-2">Duration (seconds)</label>
        <input type="number" min="0.1" max="10" step="0.1" value={duration} onChange={(e) => setDuration(parseFloat(e.target.value))} className="w-full px-3 py-2 bg-gray-700 rounded text-white" />
      </div>
      <div className="mb-4">
        <label className="block text-sm mb-2">Easing</label>
        <select value={easing} onChange={(e) => setEasing(e.target.value)} className="w-full px-3 py-2 bg-gray-700 rounded text-white">
          <option value="linear">Linear</option>
          <option value="ease-in">Ease In</option>
          <option value="ease-out">Ease Out</option>
          <option value="ease-in-out">Ease In-Out</option>
          <option value="bounce">Bounce</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded">Cancel</button>
        <button type="button" onClick={() => onSubmit(duration, easing)} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded">Add</button>
      </div>
    </div>
  );
}
