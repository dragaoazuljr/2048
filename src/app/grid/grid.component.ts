import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { filter, from, fromEvent, map, merge, Observable, Subject, Subscription, throttleTime } from 'rxjs';
import { BlockType } from 'src/enums/BlockType.enum';
import { Key } from 'src/enums/Key.enum';
import * as Hammer from 'hammerjs';

@Component({
  selector: 'app-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss']
})
export class GridComponent implements OnInit {

  keyPress$!: Subscription;
  swipe$ = new Subject<Key>();
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
    } else {
      this.checkGameOver();
    }
    this.calculateScore()
    this.listenForArrowKeys();
  }

  listenForArrowKeys() {
    const hammerTap = new Hammer.Manager(document.body, {
      recognizers: [
        [Hammer.Swipe, { direction: Hammer.DIRECTION_ALL }],
      ]
    })

    hammerTap.on('swipeleft', (event) => this.swipe$.next(Key.ArrowLeft));
    hammerTap.on('swiperight', (event) => this.swipe$.next(Key.ArrowRight));
    hammerTap.on('swipeup', (event) => this.swipe$.next(Key.ArrowUp));
    hammerTap.on('swipedown', (event) => this.swipe$.next(Key.ArrowDown));

    this.keyPress$ = merge(
      fromEvent<KeyboardEvent>(document, 'keyup').pipe(
        filter((event: KeyboardEvent) => {
          return event.key === Key.ArrowUp ||
            event.key === Key.ArrowDown ||
            event.key === Key.ArrowLeft ||
            event.key === Key.ArrowRight;
        }),
        map((event: KeyboardEvent) => {
          event.preventDefault();
          return event.key
        })
        ),
      this.swipe$.pipe(throttleTime(200))
    ).subscribe((event: string) => {
      this.moveBlocks(event as Key);
    });
  }

  moveBlocks(key: Key) {
    let hasMoved = false;

    switch (key) {
      case Key.ArrowUp:
        hasMoved = this.moveBlocksUp();
        break;
      case Key.ArrowDown:
        hasMoved = this.moveBlocksDown();
        break;
      case Key.ArrowLeft:
        hasMoved = this.moveBlocksLeft();
        break;
      case Key.ArrowRight:
        hasMoved = this.moveBlocksRight();
        break;
    }

    hasMoved ? this.addBlock() : false;
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
      let hasMergebleBlocks = false;
      
      for (let line = 0; line < 4; line++) {
        let mergebleSideBlocks = []; 
        let mergebleUpBlocks = [];
        
        this.grid[line].forEach((block, i, blocks) => {
          if(i === 0) {
            block === blocks[i + 1] ? mergebleSideBlocks.push(block) : false;
          } else if(i === 3) {
            block === blocks[i - 1] ? mergebleSideBlocks.push(block) : false;
          } else {
            block === blocks[i - 1] || block === blocks[i + 1] ? mergebleSideBlocks.push(block) : false;
          }


          if(line === 0) {
            block === this.grid[line + 1][i] ? mergebleUpBlocks.push(block) : false;
          } else if(line === 3) {
            block === this.grid[line - 1][i] ? mergebleUpBlocks.push(block) : false;
          } else {
            block === this.grid[line + 1][i] || block === this.grid[line - 1][i] ? mergebleUpBlocks.push(block) : false;
          }
        });

        if (mergebleSideBlocks.length || mergebleUpBlocks.length) {
          hasMergebleBlocks = true;
          break;
        }
      }

      if (!hasMergebleBlocks) {
       this.endGame(false);
      }
    }

    const hasTwoThousandFortyEightBlock = this.getBlocksPositionsAndValue().some((block) => {
      return block.value === BlockType.TwoThousandFortyEight
    });

    if (hasTwoThousandFortyEightBlock) {
      this.endGame(true);
    }
  }

  endGame(win: boolean) {
    const playAgain = confirm( win ? 'Congratulations, you won! Wanna continue?' : 'Game Over! Play again?');
    
    if (playAgain && !win) {
      this.keyPress$?.unsubscribe();
      this.startGame();
    }
    
    if (!playAgain && !win) {
      this.keyPress$?.unsubscribe();
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
  
  moveBlocksUp(): boolean {
    const blocksPositions = this.getBlocksPositionsAndValue();
    let hasMoved = false;

    blocksPositions.forEach((block) => {
      if (block.line > 0) {
        let linesAbove = +block.line;

        while (linesAbove > 0) {
           if (this.grid[linesAbove - 1][block.column] === BlockType.Empty) {
             this.grid[linesAbove - 1][block.column] = block.value;
             this.grid[linesAbove][block.column] = BlockType.Empty;
             linesAbove--;
             hasMoved = true;
           } else if (this.grid[linesAbove - 1][block.column] === block.value) {
             this.grid[linesAbove - 1][block.column] = block.value * 2;
             this.grid[linesAbove][block.column] = BlockType.Empty;
             linesAbove--;
              hasMoved = true;
           }else {
             break;
           }
        }
      }
    });

    return hasMoved;
  }
  
  moveBlocksDown() {
    const blocksPositions = this.getBlocksPositionsAndValue().reverse();
    let hasMoved = false;

    blocksPositions.forEach((block) => {
      if (block.line < 3) {
        let linesBelow = +block.line;

        while (linesBelow < 3) {
          if (this.grid[linesBelow + 1][block.column] === BlockType.Empty) {
            this.grid[linesBelow + 1][block.column] = block.value;
            this.grid[linesBelow][block.column] = BlockType.Empty;
            linesBelow++;
            hasMoved = true;
          } else if (this.grid[linesBelow + 1][block.column] === block.value) {
            this.grid[linesBelow + 1][block.column] = block.value * 2;
            this.grid[linesBelow][block.column] = BlockType.Empty;
            linesBelow++;
            hasMoved = true;
          } else {
            break;
          }
        }
      }
    });

    return hasMoved;
  }

  moveBlocksLeft() {
    const blocksPositions = this.getBlocksPositionsAndValue();
    let hasMoved = false;

    blocksPositions.forEach((block) => {
      if (block.column > 0) {
        let columnsLeft = +block.column;

        while (columnsLeft > 0) {
          if (this.grid[block.line][columnsLeft - 1] === BlockType.Empty) {
            this.grid[block.line][columnsLeft - 1] = block.value;
            this.grid[block.line][columnsLeft] = BlockType.Empty;
            columnsLeft--;
            hasMoved = true;
          } else if (this.grid[block.line][columnsLeft - 1] === block.value) {
            this.grid[block.line][columnsLeft - 1] = block.value * 2;
            this.grid[block.line][columnsLeft] = BlockType.Empty;
            columnsLeft--;
            hasMoved = true;
          } else {
            break;
          }
        }

      }
    });

    return hasMoved;
  }
  
  moveBlocksRight() {
    const blocksPositions = this.getBlocksPositionsAndValue().reverse();
    let hasMoved = false;

    blocksPositions.forEach((block) => {
      if (block.column < 3) {
        let columnsRight = +block.column;

        while (columnsRight < 3) {
          if (this.grid[block.line][columnsRight + 1] === BlockType.Empty) {
            this.grid[block.line][columnsRight + 1] = block.value;
            this.grid[block.line][columnsRight] = BlockType.Empty;
            columnsRight++;
            hasMoved = true;
          } else if (this.grid[block.line][columnsRight + 1] === block.value) {
            this.grid[block.line][columnsRight + 1] = block.value * 2;
            this.grid[block.line][columnsRight] = BlockType.Empty;
            columnsRight++;
            hasMoved = true;
          } else {
            break;
          }
        }
      }
    });

    return hasMoved;
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

    if (randomNumber < 3) {
      return BlockType.Two;
    } else if (randomNumber < 6) {
      return BlockType.Four;
    } else {
      return BlockType.Eight;
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
