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
  const animationRef = useRef(null);
  const canvasRef = useRef(null);

  const primarySelectedId = selectedIds[0] || null;
  const selectedObject = objects.find(obj => obj.id === primarySelectedId);

  const addObject = (type) => {
    const newObj = {
      id: `obj_${Date.now()}`,
      name: `${type}_${objects.filter(o => o.type === type).length + 1}`,
      type,
      transitions: [
        {
          startTime: 0,
          duration: 0,
          x: 250,
          y: 200,
          scale: 1,
          rotation: 0,
          opacity: 1,
          color: type === 'circle' ? '#3b82f6' : type === 'square' ? '#ef4444' : '#10b981',
          text: '',
          easing: 'linear'
        }
      ]
    };
    setObjects([...objects, newObj]);
    setSelectedIds([newObj.id]);
    setSelectedTransitionIndex(0);
  };

  const deleteObject = (id) => {
    setObjects(objects.filter(obj => obj.id !== id));
    setSelectedIds(selectedIds.filter(sid => sid !== id));
  };

  const handleContextMenu = (e, objId, transIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, objId, transIndex });
    if (!selectedIds.includes(objId)) {
      setSelectedIds([objId]);
    }
    setSelectedTransitionIndex(transIndex);
  };

  const closeContextMenu = () => setContextMenu(null);

  const openTransitionModal = () => {
    setShowTransitionModal(true);
    closeContextMenu();
  };

  const copyTransition = () => {
    if (!contextMenu) return;
    const obj = objects.find(o => o.id === contextMenu.objId);
    const trans = obj.transitions[contextMenu.transIndex];
    setCopiedTransition({ ...trans });
    closeContextMenu();
  };

  const pasteTransition = () => {
    if (!copiedTransition || !contextMenu) return;
    const obj = objects.find(o => o.id === contextMenu.objId);
    const lastTransition = obj.transitions[obj.transitions.length - 1];
    const newStartTime = lastTransition.startTime + lastTransition.duration;
    
    const newTransition = {
      ...copiedTransition,
      startTime: newStartTime,
      x: lastTransition.x + 100,
      y: lastTransition.y
    };
    
    addTransitionToObject(contextMenu.objId, newTransition);
    closeContextMenu();
  };

  const addTransition = (transitionDuration, easing) => {
    if (selectedIds.length === 0) return;
    
    selectedIds.forEach(objId => {
      const obj = objects.find(o => o.id === objId);
      const lastTransition = obj.transitions[obj.transitions.length - 1];
      const newStartTime = lastTransition.startTime + lastTransition.duration;
      
      const newTransition = {
        startTime: newStartTime,
        duration: transitionDuration,
        x: lastTransition.x,
        y: lastTransition.y,
        scale: lastTransition.scale,
        rotation: lastTransition.rotation,
        opacity: lastTransition.opacity,
        color: lastTransition.color,
        text: lastTransition.text || '',
        easing: easing
      };
      
      addTransitionToObject(objId, newTransition);
      
      const totalTime = newStartTime + transitionDuration;
      if (totalTime > duration) {
        setDuration(Math.min(totalTime + 2, 30));
      }
    });
    
    setShowTransitionModal(false);
  };

  const addTransitionToObject = (objId, newTransition) => {
    setObjects(prevObjects => prevObjects.map(o => {
      if (o.id === objId) {
        return { ...o, transitions: [...o.transitions, newTransition] };
      }
      return o;
    }));
  };

  const updateTransition = (objId, transIndex, updates) => {
    setObjects(objects.map(obj => {
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
    setObjects(objects.map(obj => {
      if (obj.id === objId) {
        const newTransitions = obj.transitions.filter((_, i) => i !== transIndex);
        return { ...obj, transitions: newTransitions };
      }
      return obj;
    }));
    if (selectedTransitionIndex === transIndex) {
      setSelectedTransitionIndex(Math.max(0, transIqndex - 1));
    }
  };

  const getObjectStateAtTime = (obj, time) => {
    let currentTransition = obj.transitions[0];
    let nextTransition = null;
    
    for (let i = 0; i < obj.transitions.length; i++) {
      const trans = obj.transitions[i];
      const endTime = trans.startTime + trans.duration;
      
      if (time >= trans.startTime && time <= endTime) {
        currentTransition = trans;
        nextTransition = obj.transitions[i + 1] || trans;
        break;
      } else if (time > endTime && i === obj.transitions.length - 1) {
        return trans;
      }
    }
    
    if (time <= currentTransition.startTime) return currentTransition;
    
    const progress = currentTransition.duration > 0 ? (time - currentTransition.startTime) / currentTransition.duration : 0;
    const easedProgress = applyEasing(progress, currentTransition.easing);
    
    return {
      x: currentTransition.x + (nextTransition.x - currentTransition.x) * easedProgress,
      y: currentTransition.y + (nextTransition.y - currentTransition.y) * easedProgress,
      scale: currentTransition.scale + (nextTransition.scale - currentTransition.scale) * easedProgress,
      rotation: currentTransition.rotation + (nextTransition.rotation - currentTransition.rotation) * easedProgress,
      opacity: currentTransition.opacity + (nextTransition.opacity - currentTransition.opacity) * easedProgress,
      color: nextTransition.color,
      text: nextTransition.text || currentTransition.text || ''
    };
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

  const handleMouseDown = (e, objId, transIndex) => {
    if (isPlaying) return;
    e.stopPropagation();
    
    if (e.ctrlKey || e.metaKey) {
      if (selectedIds.includes(objId)) {
        setSelectedIds(selectedIds.filter(id => id !== objId));
      } else {
        setSelectedIds([...selectedIds, objId]);
      }
    } else {
      if (!selectedIds.includes(objId)) {
        setSelectedIds([objId]);
      }
      setSelectedTransitionIndex(transIndex);
      setDraggingId(`${objId}-${transIndex}`);
      
      const obj = objects.find(o => o.id === objId);
      const trans = obj.transitions[transIndex];
      const rect = canvasRef.current.getBoundingClientRect();
      setDragOffset({ x: e.clientX - rect.left - trans.x, y: e.clientY - rect.top - trans.y });
    }
  };

  const handleMouseMove = (e) => {
    if (!draggingId || isPlaying) return;
    
    const [objId, transIndex] = draggingId.split('-');
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;
    
    updateTransition(objId, parseInt(transIndex), { x: newX, y: newY });
  };

  const handleMouseUp = () => setDraggingId(null);

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingId, dragOffset]);

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

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
        } else {
          setCurrentTime(elapsed);
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      animate();
    }
  };

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
      <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
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
    const size = 50 * state.scale;
    const isSelected = selectedIds.includes(obj.id) && selectedTransitionIndex === transIndex;
    const borderStyle = isSelected && !isPlaying ? '3px solid white' : isGhost ? '2px dashed rgba(255,255,255,0.5)' : selectedIds.includes(obj.id) && !isPlaying ? '2px solid rgba(255,255,255,0.6)' : 'none';
    
    const baseStyle = {
      position: 'absolute',
      left: state.x,
      top: state.y,
      opacity: isGhost ? state.opacity * 0.4 : state.opacity,
      transform: `translate(-50%, -50%) rotate(${state.rotation}deg)`,
      cursor: isPlaying ? 'default' : 'move',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${12 * state.scale}px`,
      fontWeight: 'bold',
      color: 'white',
      textShadow: '0 0 3px rgba(0,0,0,0.8)',
      userSelect: 'none'
    };

    const textContent = state.text || '';

    if (obj.type === 'circle') {
      return <div style={{ ...baseStyle, width: size, height: size, borderRadius: '50%', backgroundColor: state.color, border: borderStyle }} onMouseDown={(e) => handleMouseDown(e, obj.id, transIndex)} onContextMenu={(e) => handleContextMenu(e, obj.id, transIndex)}>{textContent}</div>;
    } else if (obj.type === 'square') {
      return <div style={{ ...baseStyle, width: size, height: size, backgroundColor: state.color, border: borderStyle }} onMouseDown={(e) => handleMouseDown(e, obj.id, transIndex)} onContextMenu={(e) => handleContextMenu(e, obj.id, transIndex)}>{textContent}</div>;
    } else {
      return (
        <div style={{ ...baseStyle }} onMouseDown={(e) => handleMouseDown(e, obj.id, transIndex)} onContextMenu={(e) => handleContextMenu(e, obj.id, transIndex)}>
          <div style={{ width: 0, height: 0, borderLeft: `${size/2}px solid transparent`, borderRight: `${size/2}px solid transparent`, borderBottom: `${size}px solid ${state.color}`, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '50%', top: `${size * 0.4}px`, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>{textContent}</span>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <h1 className="text-xl font-bold">Animation Studio</h1>
        <div className="flex gap-2">
          <span className="text-sm text-gray-400 self-center">Ctrl+Click for multi-select</span>
          <button onClick={exportAnimation} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded">
            <Download size={18} />
            Export JSON
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-sm font-semibold mb-2">Add Shapes</h2>
            <div className="flex gap-2">
              <button onClick={() => addObject('circle')} className="p-2 bg-blue-600 hover:bg-blue-700 rounded"><Circle size={20} /></button>
              <button onClick={() => addObject('square')} className="p-2 bg-red-600 hover:bg-red-700 rounded"><Square size={20} /></button>
              <button onClick={() => addObject('triangle')} className="p-2 bg-green-600 hover:bg-green-700 rounded"><Triangle size={20} /></button>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-2">Objects ({selectedIds.length} selected)</h2>
            {objects.map(obj => (
              <div key={obj.id} className={`flex items-center justify-between p-2 mb-1 rounded cursor-pointer ${selectedIds.includes(obj.id) ? 'bg-gray-700' : 'bg-gray-750 hover:bg-gray-700'}`} onClick={(e) => { if (e.ctrlKey || e.metaKey) { if (selectedIds.includes(obj.id)) { setSelectedIds(selectedIds.filter(id => id !== obj.id)); } else { setSelectedIds([...selectedIds, obj.id]); } } else { setSelectedIds([obj.id]); setSelectedTransitionIndex(obj.transitions.length - 1); } }}>
                <span className="text-sm">{obj.name}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteObject(obj.id); }} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div ref={canvasRef} className="flex-1 bg-gray-700 relative overflow-hidden">
            {objects.map(obj => renderMotionTrail(obj))}
            {objects.map(obj => {
              const lastTransIndex = obj.transitions.length - 1;
              const currentState = obj.transitions[lastTransIndex];
              const prevState = lastTransIndex > 0 ? obj.transitions[lastTransIndex - 1] : null;
              return (
                <React.Fragment key={obj.id}>
                  {prevState && !isPlaying && <div>{renderShape(obj, prevState, true, lastTransIndex - 1)}</div>}
                  {renderShape(obj, isPlaying ? getObjectStateAtTime(obj, currentTime) : currentState, false, lastTransIndex)}
                </React.Fragment>
              );
            })}
          </div>

          <div className="h-48 bg-gray-800 border-t border-gray-700 p-4">
            <div className="flex items-center gap-4 mb-4">
              <button onClick={togglePlay} className="p-2 bg-blue-600 hover:bg-blue-700 rounded">{isPlaying ? <Pause size={20} /> : <Play size={20} />}</button>
              <span className="text-sm">{currentTime.toFixed(2)}s / {duration}s</span>
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
          {selectedObject && selectedTransitionIndex !== null ? (
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
                  <input type="text" value={selectedObject.transitions[selectedTransitionIndex].text || ''} onChange={(e) => updateTransition(selectedObject.id, selectedTransitionIndex, { text: e.target.value })} className="w-full px-3 py-2 bg-gray-700 rounded text-white" placeholder="Enter text..." />
                </div>
                <div>
                  <label className="block text-xs mb-1">Scale: {selectedObject.transitions[selectedTransitionIndex].scale.toFixed(1)}</label>
                  <input type="range" min="0.1" max="3" step="0.1" value={selectedObject.transitions[selectedTransitionIndex].scale} onChange={(e) => updateTransition(selectedObject.id, selectedTransitionIndex, { scale: parseFloat(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs mb-1">Rotation: {selectedObject.transitions[selectedTransitionIndex].rotation}°</label>
                  <input type="range" min="0" max="360" value={selectedObject.transitions[selectedTransitionIndex].rotation} onChange={(e) => updateTransition(selectedObject.id, selectedTransitionIndex, { rotation: parseInt(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs mb-1">Opacity: {selectedObject.transitions[selectedTransitionIndex].opacity.toFixed(1)}</label>
                  <input type="range" min="0" max="1" step="0.1" value={selectedObject.transitions[selectedTransitionIndex].opacity} onChange={(e) => updateTransition(selectedObject.id, selectedTransitionIndex, { opacity: parseFloat(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs mb-1">Color</label>
                  <input type="color" value={selectedObject.transitions[selectedTransitionIndex].color} onChange={(e) => updateTransition(selectedObject.id, selectedTransitionIndex, { color: e.target.value })} className="w-full h-8 rounded" />
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
          <button onClick={openTransitionModal} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700">Add Transition</button>
          <button onClick={copyTransition} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700">Copy Transition</button>
          {copiedTransition && <button onClick={pasteTransition} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700">Paste Transition</button>}
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