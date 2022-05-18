import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { filter, from, fromEvent, Observable, Subject, Subscription } from 'rxjs';
import { BlockType } from 'src/enums/BlockType.enum';
import { Key } from 'src/enums/Key.enum';

@Component({
  selector: 'app-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss']
})
export class GridComponent implements OnInit {

  keyPress$!: Subscription;
  grid: BlockType[][] = [
    [BlockType.Empty, BlockType.Empty, BlockType.Empty, BlockType.Empty],
    [BlockType.Empty, BlockType.Empty, BlockType.Empty, BlockType.Empty],
    [BlockType.Empty, BlockType.Empty, BlockType.Empty, BlockType.Empty],
    [BlockType.Empty, BlockType.Empty, BlockType.Empty, BlockType.Empty]
  ];

  @Output() scoreEmitter: EventEmitter<number> = new EventEmitter<number>();

  constructor() { }

  ngOnInit(): void {
    const savedGame = this.loadGame();

    if (savedGame.length) {
      this.grid = savedGame;
    }

    this.startGame(!!savedGame.length);
  }

  startGame(loadedGame: boolean = false) {
    if (!loadedGame) {
      this.clearGrid();
      this.addBlock(BlockType.Two);
      this.addBlock(BlockType.Two);
    }
    this.listenForArrowKeys();
  }

  listenForArrowKeys() {
    this.keyPress$ = fromEvent<KeyboardEvent>(document, 'keyup').pipe(
      filter((event: KeyboardEvent) => {
        return event.key === Key.ArrowUp ||
          event.key === Key.ArrowDown ||
          event.key === Key.ArrowLeft ||
          event.key === Key.ArrowRight;
      })
    ).subscribe((event: KeyboardEvent) => {
      event.preventDefault();
      this.moveBlocks(event.key as Key);
      this.addBlock()
    });
  }

  moveBlocks(key: Key) {
    switch (key) {
      case Key.ArrowUp:
        this.moveBlocksUp();
        break;
      case Key.ArrowDown:
        this.moveBlocksDown();
        break;
      case Key.ArrowLeft:
        this.moveBlocksLeft();
        break;
      case Key.ArrowRight:
        this.moveBlocksRight();
        break;
    }

    this.checkGameOver();
  }

  calculateScore() {
    const blocksPositions = this.getBlocksPositionsAndValue();
    let score = 0;

    blocksPositions.forEach((block) => {
      score += block.value;
    });

    this.scoreEmitter.emit(score);
  }

  checkGameOver() {
    const emptyBlocks = this.getEmptyBlocks();

    if (emptyBlocks.length === 0) {
      this.keyPress$.unsubscribe();
      const playAgain = confirm('Game Over! Play again?');

      if (playAgain) {
        this.startGame();
      }
    }
  }

  getEmptyBlocks() {
    const emptyBlocks: BlockType[] = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (this.grid[i][j] === BlockType.Empty) {
          emptyBlocks.push(BlockType.Empty);
        }
      }
    }

    return emptyBlocks;
  }
  
  moveBlocksUp() {
    const blocksPositions = this.getBlocksPositionsAndValue();

    blocksPositions.forEach((block) => {
      if (block.line > 0) {
        let linesAbove = +block.line;

        while (linesAbove > 0) {
           if (this.grid[linesAbove - 1][block.column] === BlockType.Empty) {
             this.grid[linesAbove - 1][block.column] = block.value;
             this.grid[linesAbove][block.column] = BlockType.Empty;
             linesAbove--;
           } else if (this.grid[linesAbove - 1][block.column] === block.value) {
             this.grid[linesAbove - 1][block.column] = block.value * 2;
             this.grid[linesAbove][block.column] = BlockType.Empty;
             linesAbove--;
           }else {
             break;
           }
        }
      }
    });
  }
  
  moveBlocksDown() {
    const blocksPositions = this.getBlocksPositionsAndValue();

    blocksPositions.forEach((block) => {
      if (block.line < 3) {
        let linesBelow = +block.line;

        while (linesBelow < 3) {
          if (this.grid[linesBelow + 1][block.column] === BlockType.Empty) {
            this.grid[linesBelow + 1][block.column] = block.value;
            this.grid[linesBelow][block.column] = BlockType.Empty;
            linesBelow++;
          } else if (this.grid[linesBelow + 1][block.column] === block.value) {
            this.grid[linesBelow + 1][block.column] = block.value * 2;
            this.grid[linesBelow][block.column] = BlockType.Empty;
            linesBelow++;
          } else {
            break;
          }
        }
      }
    });
  }

  moveBlocksLeft() {
    const blocksPositions = this.getBlocksPositionsAndValue();

    blocksPositions.forEach((block) => {
      if (block.column > 0) {
        let columnsLeft = +block.column;

        while (columnsLeft > 0) {
          if (this.grid[block.line][columnsLeft - 1] === BlockType.Empty) {
            this.grid[block.line][columnsLeft - 1] = block.value;
            this.grid[block.line][columnsLeft] = BlockType.Empty;
            columnsLeft--;
          } else if (this.grid[block.line][columnsLeft - 1] === block.value) {
            this.grid[block.line][columnsLeft - 1] = block.value * 2;
            this.grid[block.line][columnsLeft] = BlockType.Empty;
            columnsLeft--;
          } else {
            break;
          }
        }
      }
    });
  }
  
  moveBlocksRight() {
    const blocksPositions = this.getBlocksPositionsAndValue();

    blocksPositions.forEach((block) => {
      if (block.column < 3) {
        let columnsRight = +block.column;

        while (columnsRight < 3) {
          if (this.grid[block.line][columnsRight + 1] === BlockType.Empty) {
            this.grid[block.line][columnsRight + 1] = block.value;
            this.grid[block.line][columnsRight] = BlockType.Empty;
            columnsRight++;
          } else if (this.grid[block.line][columnsRight + 1] === block.value) {
            this.grid[block.line][columnsRight + 1] = block.value * 2;
            this.grid[block.line][columnsRight] = BlockType.Empty;
            columnsRight++;
          } else {
            break;
          }
        }
      }
    });
  }
  
  getBlocksPositionsAndValue() {
    const blocksPositionsAndValue: {
      line: number,
      column: number,
      value: BlockType
    }[] = [];

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (this.grid[i][j] !== BlockType.Empty) {
          blocksPositionsAndValue.push({
            line: i,
            column: j,
            value: this.grid[i][j]
          });
        }
      }
    }

    return blocksPositionsAndValue;
  }

  addBlock(value?: BlockType) {
    const randomLine = Math.floor(Math.random() * 4);
    const randomColumn = Math.floor(Math.random() * 4);

    if (this.grid[randomLine][randomColumn] === BlockType.Empty) {
      this.grid[randomLine][randomColumn] = value || this.getRandomBlockType();
    } else {
      this.addBlock();
    }

    this.calculateScore();
    this.saveGame();
  }
  
  saveGame() {
    localStorage.setItem('grid', JSON.stringify(this.grid));
  }

  loadGame() {
    const gridString = localStorage.getItem('grid');
    
    return gridString ? JSON.parse(gridString) : [];
  }
  
  getRandomBlockType(): BlockType {
    const randomNumber = Math.floor(Math.random() * 10);

    if (randomNumber < 2) {
      return BlockType.Two;
    } else if (randomNumber < 4) {
      return BlockType.Four;
    } else if (randomNumber < 6) {
      return BlockType.Eight;
    } else {
      return BlockType.Sixteen;
    } 
  }

  clearGrid() {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        this.grid[i][j] = BlockType.Empty;
      }
    }
  }
}
