import React, { useState, useEffect, useRef } from 'react';

/**
 * MemoryEditor Component
 * 
 * This component provides a UI for viewing and editing the Z80's 64K memory.
 * It displays memory contents in a hex editor style interface with both
 * hexadecimal and ASCII representations.
 */
const MemoryEditor = ({ z80, onMemoryChange }) => {
  const [startAddress, setStartAddress] = useState(0);
  const [visibleRows, setVisibleRows] = useState(16);
  const [selectedCell, setSelectedCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);
  const [memory, setMemory] = useState([]);
  
  // Bytes per row in the display
  const BYTES_PER_ROW = 16;
  
  // Update memory view when Z80 state or view parameters change
  useEffect(() => {
    if (z80) {
      updateMemoryView();
    }
  }, [z80, startAddress, visibleRows]);
  
  // Update the memory view data
  const updateMemoryView = () => {
    if (!z80) return;
    
    const memoryData = [];
    const endAddress = Math.min(65536, startAddress + (visibleRows * BYTES_PER_ROW));
    
    for (let address = startAddress; address < endAddress; address++) {
      memoryData.push(z80.readByte(address));
    }
    
    setMemory(memoryData);
  };
  
  // Handle memory cell selection for editing
  const handleCellSelect = (address) => {
    setSelectedCell(address);
    setEditValue(z80.readByte(address).toString(16).padStart(2, '0').toUpperCase());
    
    // Focus the input after a short delay to ensure it's rendered
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 10);
  };
  
  // Handle memory value change
  const handleMemoryChange = (address, value) => {
    // Convert input to number and ensure it's within valid range
    let numValue = parseInt(value, 16);
    
    // Validate input
    if (isNaN(numValue)) {
      numValue = 0;
    }
    
    // Ensure value is in valid range for a byte (0-255)
    numValue = Math.max(0, Math.min(255, numValue));
    
    // Update Z80 memory
    z80.writeByte(address, numValue);
    
    // Update local state
    updateMemoryView();
    
    // Notify parent component
    if (onMemoryChange) {
      onMemoryChange(address, numValue);
    }
    
    // Clear selection
    setSelectedCell(null);
  };
  
  // Handle key press in the edit input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && selectedCell !== null) {
      handleMemoryChange(selectedCell, editValue);
    } else if (e.key === 'Escape') {
      setSelectedCell(null);
    }
  };
  
  // Navigate to a specific address
  const handleAddressChange = (e) => {
    const address = parseInt(e.target.value, 16);
    if (!isNaN(address) && address >= 0 && address < 65536) {
      setStartAddress(address - (address % BYTES_PER_ROW));
    }
  };
  
  // Format a byte as ASCII character
  const formatAscii = (byte) => {
    if (byte >= 32 && byte <= 126) {
      return String.fromCharCode(byte);
    }
    return '.';
  };
  
  // Render a memory row
  const renderMemoryRow = (rowIndex) => {
    const rowAddress = startAddress + (rowIndex * BYTES_PER_ROW);
    const rowData = memory.slice(rowIndex * BYTES_PER_ROW, (rowIndex + 1) * BYTES_PER_ROW);
    
    // Ensure we have exactly BYTES_PER_ROW elements
    while (rowData.length < BYTES_PER_ROW) {
      rowData.push(0);
    }
    
    return (
      <div className="memory-row" key={rowAddress}>
        <div className="memory-address">
          {rowAddress.toString(16).padStart(4, '0').toUpperCase()}
        </div>
        <div className="memory-hex">
          {rowData.map((byte, index) => {
            const address = rowAddress + index;
            return (
              <div 
                key={index} 
                className={`memory-cell ${selectedCell === address ? 'selected' : ''}`}
                onClick={() => handleCellSelect(address)}
              >
                {selectedCell === address ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onBlur={() => handleMemoryChange(address, editValue)}
                    className="memory-input"
                    maxLength={2}
                  />
                ) : (
                  byte.toString(16).padStart(2, '0').toUpperCase()
                )}
              </div>
            );
          })}
        </div>
        <div className="memory-ascii">
          {rowData.map((byte, index) => (
            <div 
              key={index} 
              className={`ascii-cell ${selectedCell === (rowAddress + index) ? 'selected' : ''}`}
              onClick={() => handleCellSelect(rowAddress + index)}
            >
              {formatAscii(byte)}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render memory rows
  const renderMemoryRows = () => {
    const rows = [];
    for (let i = 0; i < visibleRows; i++) {
      rows.push(renderMemoryRow(i));
    }
    return rows;
  };
  
  // Handle scroll events
  const handleScroll = (direction) => {
    if (direction === 'up') {
      setStartAddress(Math.max(0, startAddress - (BYTES_PER_ROW * 4)));
    } else if (direction === 'down') {
      setStartAddress(Math.min(65536 - (visibleRows * BYTES_PER_ROW), startAddress + (BYTES_PER_ROW * 4)));
    }
  };
  
  // Fill memory with a value
  const handleFillMemory = () => {
    const startAddr = parseInt(prompt('Start address (hex):', '0000'), 16);
    const endAddr = parseInt(prompt('End address (hex):', 'FFFF'), 16);
    const value = parseInt(prompt('Fill value (hex):', '00'), 16);
    
    if (isNaN(startAddr) || isNaN(endAddr) || isNaN(value)) {
      alert('Invalid input. Please enter hexadecimal values.');
      return;
    }
    
    if (startAddr < 0 || startAddr > 65535 || endAddr < 0 || endAddr > 65535) {
      alert('Addresses must be between 0000 and FFFF.');
      return;
    }
    
    if (value < 0 || value > 255) {
      alert('Fill value must be between 00 and FF.');
      return;
    }
    
    for (let addr = startAddr; addr <= endAddr; addr++) {
      z80.writeByte(addr, value);
    }
    
    updateMemoryView();
  };
  
  // Load binary data from file
  const handleLoadBinary = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target.result;
      const bytes = new Uint8Array(buffer);
      const loadAddress = parseInt(prompt('Load address (hex):', '0000'), 16);
      
      if (isNaN(loadAddress) || loadAddress < 0 || loadAddress > 65535) {
        alert('Invalid load address. Please enter a hexadecimal value between 0000 and FFFF.');
        return;
      }
      
      for (let i = 0; i < bytes.length && (loadAddress + i) < 65536; i++) {
        z80.writeByte(loadAddress + i, bytes[i]);
      }
      
      updateMemoryView();
      setStartAddress(loadAddress - (loadAddress % BYTES_PER_ROW));
    };
    
    reader.readAsArrayBuffer(file);
  };
  
  return (
    <div className="memory-editor">
      <h2>Memory Editor</h2>
      
      <div className="memory-controls">
        <div className="address-navigation">
          <label htmlFor="goto-address">Go to address (hex):</label>
          <input
            id="goto-address"
            type="text"
            placeholder="0000"
            onChange={handleAddressChange}
            maxLength={4}
          />
        </div>
        
        <div className="memory-actions">
          <button onClick={() => handleScroll('up')}>◀ Previous</button>
          <button onClick={() => handleScroll('down')}>Next ▶</button>
          <button onClick={handleFillMemory}>Fill Memory</button>
          <label className="file-input-label">
            Load Binary
            <input
              type="file"
              onChange={handleLoadBinary}
              style={{ display: 'none' }}
            />
          </label>
        </div>
        
        <div className="rows-control">
          <label htmlFor="visible-rows">Rows:</label>
          <select
            id="visible-rows"
            value={visibleRows}
            onChange={(e) => setVisibleRows(parseInt(e.target.value))}
          >
            <option value="8">8</option>
            <option value="16">16</option>
            <option value="32">32</option>
            <option value="64">64</option>
          </select>
        </div>
      </div>
      
      <div className="memory-header">
        <div className="memory-address-header">Address</div>
        <div className="memory-hex-header">
          {Array.from({ length: BYTES_PER_ROW }, (_, i) => (
            <div key={i} className="memory-cell-header">
              {i.toString(16).padStart(2, '0').toUpperCase()}
            </div>
          ))}
        </div>
        <div className="memory-ascii-header">ASCII</div>
      </div>
      
      <div className="memory-content">
        {renderMemoryRows()}
      </div>
    </div>
  );
};

export default MemoryEditor;
