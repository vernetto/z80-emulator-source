# Z80 Emulator

A React-based Z80 CPU emulator with a comprehensive UI for editing registers, memory, and debugging Z80 assembly code.

## Features

- **Z80 CPU Emulation**: Complete emulation of Z80 CPU registers, flags, and basic instruction set
- **Register Editor**: UI to view and edit all Z80 registers and flags
- **Memory Editor**: Hex editor interface for viewing and modifying the 64K memory
- **Assembly Editor**: Code editor for Z80 assembly with syntax parsing and program loading
- **Debugger**: Step-by-step execution, breakpoints, and execution history tracking

## Components

The application consists of the following main components:

1. **Z80Core**: The core emulation engine that implements Z80 CPU functionality
2. **RegisterEditor**: UI component for editing CPU registers and flags
3. **MemoryEditor**: UI component for viewing and editing memory contents
4. **AsmEditor**: UI component for editing and assembling Z80 assembly code
5. **Debugger**: UI component for debugging Z80 programs

## Usage Instructions

### Register Editor

- View and edit all Z80 registers (A, B, C, D, E, H, L, IX, IY, SP, PC, etc.)
- Toggle flag bits (S, Z, H, P/V, N, C)
- Reset registers or exchange register sets with alternate registers

### Memory Editor

- Navigate through the 64K memory space
- Edit memory values in hexadecimal format
- View ASCII representation of memory contents
- Fill memory ranges with specific values
- Load binary data from files

### Assembly Editor

- Write Z80 assembly code with syntax highlighting
- Assemble code and view generated machine code
- Load programs into memory for execution
- Disassemble memory contents back to assembly code

### Debugger

- Execute programs step by step
- Set breakpoints at specific addresses
- Control execution speed
- View execution history
- Monitor program state during debugging

## Supported Z80 Instructions

The emulator supports a subset of Z80 instructions, including:

- 8-bit load instructions (LD A,n, LD B,n, etc.)
- 16-bit load instructions (LD BC,nn, LD DE,nn, etc.)
- Register-to-register transfers
- Memory operations (LD A,(HL), LD (HL),A, etc.)
- Arithmetic and logic operations (ADD, SUB, AND, OR, XOR, CP)
- Jump and call instructions (JP, JR, CALL, RET)
- Miscellaneous instructions (NOP, HALT)

## Development

This project was created using React and can be extended with additional Z80 instructions and features.

To run the development server:

```bash
cd z80-emulator
pnpm run dev
```

To build for production:

```bash
cd z80-emulator
pnpm run build
```
