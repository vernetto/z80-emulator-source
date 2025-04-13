import React, { useState, useEffect, useRef } from 'react';

/**
 * AsmEditor Component
 * 
 * This component provides a UI for editing and parsing Z80 assembly code.
 * It includes syntax highlighting, line numbering, and assembly/disassembly functionality.
 */
const AsmEditor = ({ z80, onCodeChange, onProgramLoad }) => {
  const [code, setCode] = useState('');
  const [assembledProgram, setAssembledProgram] = useState([]);
  const [errors, setErrors] = useState([]);
  const [startAddress, setStartAddress] = useState(0);
  const editorRef = useRef(null);
  
  // Z80 instruction set definitions (partial implementation)
  const Z80_INSTRUCTIONS = {
    // 8-bit load instructions
    'LD A,': { opcode: 0x3E, bytes: 2, operands: ['immediate'] },
    'LD B,': { opcode: 0x06, bytes: 2, operands: ['immediate'] },
    'LD C,': { opcode: 0x0E, bytes: 2, operands: ['immediate'] },
    'LD D,': { opcode: 0x16, bytes: 2, operands: ['immediate'] },
    'LD E,': { opcode: 0x1E, bytes: 2, operands: ['immediate'] },
    'LD H,': { opcode: 0x26, bytes: 2, operands: ['immediate'] },
    'LD L,': { opcode: 0x2E, bytes: 2, operands: ['immediate'] },
    
    // 16-bit load instructions
    'LD BC,': { opcode: 0x01, bytes: 3, operands: ['immediate16'] },
    'LD DE,': { opcode: 0x11, bytes: 3, operands: ['immediate16'] },
    'LD HL,': { opcode: 0x21, bytes: 3, operands: ['immediate16'] },
    'LD SP,': { opcode: 0x31, bytes: 3, operands: ['immediate16'] },
    
    // Register-to-register loads
    'LD A,B': { opcode: 0x78, bytes: 1 },
    'LD A,C': { opcode: 0x79, bytes: 1 },
    'LD A,D': { opcode: 0x7A, bytes: 1 },
    'LD A,E': { opcode: 0x7B, bytes: 1 },
    'LD A,H': { opcode: 0x7C, bytes: 1 },
    'LD A,L': { opcode: 0x7D, bytes: 1 },
    
    // Memory operations
    'LD A,(HL)': { opcode: 0x7E, bytes: 1 },
    'LD (HL),A': { opcode: 0x77, bytes: 1 },
    
    // Arithmetic and logic
    'ADD A,': { opcode: 0xC6, bytes: 2, operands: ['immediate'] },
    'SUB ': { opcode: 0xD6, bytes: 2, operands: ['immediate'] },
    'AND ': { opcode: 0xE6, bytes: 2, operands: ['immediate'] },
    'OR ': { opcode: 0xF6, bytes: 2, operands: ['immediate'] },
    'XOR ': { opcode: 0xEE, bytes: 2, operands: ['immediate'] },
    'CP ': { opcode: 0xFE, bytes: 2, operands: ['immediate'] },
    
    // Jump instructions
    'JP ': { opcode: 0xC3, bytes: 3, operands: ['immediate16'] },
    'JR ': { opcode: 0x18, bytes: 2, operands: ['relative'] },
    'CALL ': { opcode: 0xCD, bytes: 3, operands: ['immediate16'] },
    'RET': { opcode: 0xC9, bytes: 1 },
    
    // Misc
    'NOP': { opcode: 0x00, bytes: 1 },
    'HALT': { opcode: 0x76, bytes: 1 },
  };
  
  // Parse a line of assembly code
  const parseLine = (line, lineNumber, currentAddress) => {
    // Remove comments
    const commentIndex = line.indexOf(';');
    if (commentIndex !== -1) {
      line = line.substring(0, commentIndex);
    }
    
    // Trim whitespace
    line = line.trim();
    
    // Skip empty lines
    if (!line) {
      return { bytes: [], address: currentAddress };
    }
    
    // Check for labels
    if (line.endsWith(':')) {
      // This is a label definition, no bytes generated
      return { bytes: [], address: currentAddress, label: line.slice(0, -1) };
    }
    
    // Parse instruction
    let matchedInstruction = null;
    let operandValue = null;
    
    // Try to match against known instructions
    for (const [instructionPattern, details] of Object.entries(Z80_INSTRUCTIONS)) {
      if (line === instructionPattern.trim()) {
        // Exact match for instructions without operands
        matchedInstruction = { ...details, pattern: instructionPattern };
        break;
      } else if (line.startsWith(instructionPattern)) {
        // Match for instructions with operands
        const operandStr = line.substring(instructionPattern.length).trim();
        
        // Parse operand value
        if (details.operands && details.operands[0] === 'immediate') {
          // 8-bit immediate value
          operandValue = parseImmediate(operandStr);
          if (operandValue !== null && operandValue >= 0 && operandValue <= 255) {
            matchedInstruction = { ...details, pattern: instructionPattern };
            break;
          }
        } else if (details.operands && details.operands[0] === 'immediate16') {
          // 16-bit immediate value
          operandValue = parseImmediate(operandStr);
          if (operandValue !== null && operandValue >= 0 && operandValue <= 65535) {
            matchedInstruction = { ...details, pattern: instructionPattern };
            break;
          }
        } else if (details.operands && details.operands[0] === 'relative') {
          // Relative jump (not fully implemented)
          operandValue = parseImmediate(operandStr);
          if (operandValue !== null) {
            matchedInstruction = { ...details, pattern: instructionPattern };
            break;
          }
        }
      }
    }
    
    if (!matchedInstruction) {
      return { 
        error: `Unknown instruction: ${line}`, 
        lineNumber, 
        address: currentAddress 
      };
    }
    
    // Generate bytes for the instruction
    const bytes = [];
    bytes.push(matchedInstruction.opcode);
    
    if (matchedInstruction.operands) {
      if (matchedInstruction.operands[0] === 'immediate') {
        bytes.push(operandValue & 0xFF);
      } else if (matchedInstruction.operands[0] === 'immediate16') {
        bytes.push(operandValue & 0xFF);
        bytes.push((operandValue >> 8) & 0xFF);
      } else if (matchedInstruction.operands[0] === 'relative') {
        // Simplified relative jump calculation
        const relativeOffset = operandValue - (currentAddress + 2);
        if (relativeOffset < -128 || relativeOffset > 127) {
          return { 
            error: `Relative jump out of range: ${relativeOffset}`, 
            lineNumber, 
            address: currentAddress 
          };
        }
        bytes.push(relativeOffset & 0xFF);
      }
    }
    
    return { 
      bytes, 
      address: currentAddress,
      instruction: line,
      lineNumber
    };
  };
  
  // Parse immediate value (decimal, hex, or binary)
  const parseImmediate = (str) => {
    str = str.trim();
    
    // Hexadecimal (0xNN or NNh)
    if (str.startsWith('0x') || str.startsWith('$')) {
      return parseInt(str.substring(str.startsWith('0x') ? 2 : 1), 16);
    } else if (str.endsWith('h') || str.endsWith('H')) {
      return parseInt(str.slice(0, -1), 16);
    }
    // Binary (0bNNNN or NNNNb)
    else if (str.startsWith('0b') || str.startsWith('%')) {
      return parseInt(str.substring(str.startsWith('0b') ? 2 : 1), 2);
    } else if (str.endsWith('b') || str.endsWith('B')) {
      return parseInt(str.slice(0, -1), 2);
    }
    // Decimal
    else {
      return parseInt(str, 10);
    }
  };
  
  // Assemble the code
  const assembleCode = () => {
    const lines = code.split('\n');
    const program = [];
    const newErrors = [];
    let currentAddress = startAddress;
    const labels = {};
    
    // First pass: collect labels
    lines.forEach((line, index) => {
      const result = parseLine(line, index + 1, currentAddress);
      if (result.label) {
        labels[result.label] = currentAddress;
      }
      if (result.bytes) {
        currentAddress += result.bytes.length;
      }
    });
    
    // Second pass: generate code
    currentAddress = startAddress;
    lines.forEach((line, index) => {
      const result = parseLine(line, index + 1, currentAddress);
      
      if (result.error) {
        newErrors.push(result.error + ` (line ${result.lineNumber})`);
      } else if (result.bytes && result.bytes.length > 0) {
        program.push({
          address: result.address,
          bytes: result.bytes,
          instruction: result.instruction,
          lineNumber: result.lineNumber
        });
        currentAddress += result.bytes.length;
      }
    });
    
    setAssembledProgram(program);
    setErrors(newErrors);
    
    return { program, errors: newErrors };
  };
  
  // Load the assembled program into Z80 memory
  const loadProgram = () => {
    if (assembledProgram.length === 0) {
      const { program, errors } = assembleCode();
      if (errors.length > 0) {
        return;
      }
      
      // Load program into memory
      program.forEach(item => {
        item.bytes.forEach((byte, index) => {
          z80.writeByte(item.address + index, byte);
        });
      });
      
      // Set PC to start address
      z80.setState({ pc: startAddress });
      
      // Notify parent component
      if (onProgramLoad) {
        onProgramLoad(program, startAddress);
      }
    } else {
      // Load already assembled program
      assembledProgram.forEach(item => {
        item.bytes.forEach((byte, index) => {
          z80.writeByte(item.address + index, byte);
        });
      });
      
      // Set PC to start address
      z80.setState({ pc: startAddress });
      
      // Notify parent component
      if (onProgramLoad) {
        onProgramLoad(assembledProgram, startAddress);
      }
    }
  };
  
  // Handle code changes
  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    
    if (onCodeChange) {
      onCodeChange(newCode);
    }
  };
  
  // Handle start address changes
  const handleStartAddressChange = (e) => {
    const address = parseInt(e.target.value, 16);
    if (!isNaN(address) && address >= 0 && address <= 0xFFFF) {
      setStartAddress(address);
    }
  };
  
  // Disassemble memory to assembly code
  const disassembleMemory = () => {
    const startAddr = parseInt(prompt('Start address (hex):', '0000'), 16);
    const length = parseInt(prompt('Length (bytes):', '100'), 16);
    
    if (isNaN(startAddr) || isNaN(length)) {
      alert('Invalid input. Please enter hexadecimal values.');
      return;
    }
    
    if (startAddr < 0 || startAddr > 0xFFFF || length < 1 || length > 0x10000) {
      alert('Invalid range. Address must be between 0000 and FFFF, length must be positive.');
      return;
    }
    
    let disassembled = '';
    let address = startAddr;
    const endAddr = Math.min(0x10000, startAddr + length);
    
    while (address < endAddr) {
      const opcode = z80.readByte(address);
      let instruction = '';
      let bytes = 1;
      
      // Very simplified disassembler (would need to be expanded for a real implementation)
      switch (opcode) {
        case 0x00:
          instruction = 'NOP';
          break;
        case 0x3E:
          instruction = `LD A,${z80.readByte(address + 1).toString(16).padStart(2, '0').toUpperCase()}h`;
          bytes = 2;
          break;
        case 0x06:
          instruction = `LD B,${z80.readByte(address + 1).toString(16).padStart(2, '0').toUpperCase()}h`;
          bytes = 2;
          break;
        case 0x0E:
          instruction = `LD C,${z80.readByte(address + 1).toString(16).padStart(2, '0').toUpperCase()}h`;
          bytes = 2;
          break;
        case 0x16:
          instruction = `LD D,${z80.readByte(address + 1).toString(16).padStart(2, '0').toUpperCase()}h`;
          bytes = 2;
          break;
        case 0x1E:
          instruction = `LD E,${z80.readByte(address + 1).toString(16).padStart(2, '0').toUpperCase()}h`;
          bytes = 2;
          break;
        case 0x26:
          instruction = `LD H,${z80.readByte(address + 1).toString(16).padStart(2, '0').toUpperCase()}h`;
          bytes = 2;
          break;
        case 0x2E:
          instruction = `LD L,${z80.readByte(address + 1).toString(16).padStart(2, '0').toUpperCase()}h`;
          bytes = 2;
          break;
        case 0x01:
          instruction = `LD BC,${z80.readWord(address + 1).toString(16).padStart(4, '0').toUpperCase()}h`;
          bytes = 3;
          break;
        case 0x11:
          instruction = `LD DE,${z80.readWord(address + 1).toString(16).padStart(4, '0').toUpperCase()}h`;
          bytes = 3;
          break;
        case 0x21:
          instruction = `LD HL,${z80.readWord(address + 1).toString(16).padStart(4, '0').toUpperCase()}h`;
          bytes = 3;
          break;
        case 0x31:
          instruction = `LD SP,${z80.readWord(address + 1).toString(16).padStart(4, '0').toUpperCase()}h`;
          bytes = 3;
          break;
        case 0x76:
          instruction = 'HALT';
          break;
        case 0xC3:
          instruction = `JP ${z80.readWord(address + 1).toString(16).padStart(4, '0').toUpperCase()}h`;
          bytes = 3;
          break;
        default:
          instruction = `DB ${opcode.toString(16).padStart(2, '0').toUpperCase()}h ; Unknown opcode`;
      }
      
      disassembled += `${address.toString(16).padStart(4, '0').toUpperCase()}: ${instruction}\n`;
      address += bytes;
    }
    
    setCode(disassembled);
  };
  
  // Load example code
  const loadExampleCode = () => {
    const example = `; Simple Z80 program example
; Counts from 0 to 10 in register B

    LD B,0       ; Initialize counter
loop:
    LD A,B       ; Load B into A
    CP 10        ; Compare with 10
    JP Z,done    ; Jump to done if equal
    INC B        ; Increment counter
    JP loop      ; Repeat
done:
    HALT         ; Stop execution
`;
    setCode(example);
  };
  
  return (
    <div className="asm-editor">
      <h2>Z80 Assembly Editor</h2>
      
      <div className="editor-controls">
        <div className="address-control">
          <label htmlFor="start-address">Start Address (hex):</label>
          <input
            id="start-address"
            type="text"
            value={startAddress.toString(16).padStart(4, '0').toUpperCase()}
            onChange={handleStartAddressChange}
            maxLength={4}
          />
        </div>
        
        <div className="editor-actions">
          <button onClick={assembleCode}>Assemble</button>
          <button onClick={loadProgram}>Load Program</button>
          <button onClick={disassembleMemory}>Disassemble Memory</button>
          <button onClick={loadExampleCode}>Load Example</button>
        </div>
      </div>
      
      <div className="editor-container">
        <textarea
          ref={editorRef}
          className="code-editor"
          value={code}
          onChange={handleCodeChange}
          spellCheck="false"
          placeholder="Enter Z80 assembly code here..."
        />
      </div>
      
      {errors.length > 0 && (
        <div className="error-list">
          <h3>Errors:</h3>
          <ul>
            {errors.map((error, index) => (
              <li key={index} className="error-item">{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {assembledProgram.length > 0 && (
        <div className="assembled-program">
          <h3>Assembled Program:</h3>
          <table className="program-table">
            <thead>
              <tr>
                <th>Address</th>
                <th>Bytes</th>
                <th>Instruction</th>
              </tr>
            </thead>
            <tbody>
              {assembledProgram.map((item, index) => (
                <tr key={index}>
                  <td>{item.address.toString(16).padStart(4, '0').toUpperCase()}</td>
                  <td>
                    {item.bytes.map(byte => 
                      byte.toString(16).padStart(2, '0').toUpperCase()
                    ).join(' ')}
                  </td>
                  <td>{item.instruction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AsmEditor;
